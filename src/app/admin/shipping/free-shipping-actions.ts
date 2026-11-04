"use server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { createServiceClient } from "@/lib/supabase/service";
import {
  freeShippingSelectKeys,
  freeShippingUpsertRows,
  mergeShippingDoc,
  parseFreeShippingFromRows,
} from "@/lib/settings/free-shipping";
import { revalidatePath } from "next/cache";

export async function getFreeShippingSettingsAction() {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", freeShippingSelectKeys());

    if (error) {
      console.error("[getFreeShippingSettings]", error);
      return { ok: false as const, error: "db" as const };
    }

    const parsed = parseFreeShippingFromRows(
      (data ?? []) as { key: string; value: unknown }[],
    );
    return {
      ok: true as const,
      enabled: parsed.enabled,
      minAmount: parsed.minAmount,
      excludeCodes: parsed.excludeCodes,
    };
  } catch (e) {
    console.error("[getFreeShippingSettings]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function saveFreeShippingSettingsAction(input: {
  enabled: boolean;
  minAmount: number;
  excludeCodes?: string;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const settings = {
    enabled: !!input.enabled,
    minAmount: Math.max(0, Math.floor(Number(input.minAmount) || 0)),
    excludeCodes: input.excludeCodes || "peyk,alopeyk",
  };

  try {
    const supabase = createServiceClient();

    // Preserve other fields inside shipping jsonb (e.g. warehouse leftovers)
    const { data: existingShipping } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "shipping")
      .maybeSingle();

    const rows = freeShippingUpsertRows(settings).map((row) => {
      if (row.key === "shipping") {
        return {
          key: "shipping",
          value: mergeShippingDoc(existingShipping?.value, settings),
        };
      }
      return row;
    });

    for (const row of rows) {
      const { error } = await supabase.from("site_settings").upsert(
        {
          key: row.key,
          value: row.value as never,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );
      if (error) {
        console.error("[saveFreeShippingSettings]", error);
        return { ok: false as const, error: "db" as const };
      }
    }

    revalidatePath("/admin/shipping");
    revalidatePath("/checkout");
    return { ok: true as const };
  } catch (e) {
    console.error("[saveFreeShippingSettings]", e);
    return { ok: false as const, error: "server" as const };
  }
}
