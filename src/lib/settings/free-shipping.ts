/** Live site_settings stores free-shipping under key `shipping` (jsonb object)
 *  AND optionally flat string keys. Read both; write both for compatibility.
 */

export type FreeShippingSettings = {
  enabled: boolean;
  minAmount: number;
  excludeCodes: string;
};

const FLAT = {
  enabled: "free_shipping_enabled",
  minAmount: "free_shipping_min_amount",
  exclude: "free_shipping_exclude_provider_codes",
} as const;

const SHIPPING_DOC_KEY = "shipping";

function asPlain(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  // jsonb object/array — not a flat string setting
  return "";
}

function shippingDoc(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      /* ignore */
    }
  }
  return {};
}

export function parseFreeShippingFromRows(
  rows: { key: string; value: unknown }[],
): FreeShippingSettings {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const doc = shippingDoc(map.get(SHIPPING_DOC_KEY));

  const enabledRaw =
    asPlain(map.get(FLAT.enabled)) ||
    asPlain(doc.free_shipping_enabled) ||
    (doc.free_shipping_enabled === true ? "true" : "");
  const minRaw =
    asPlain(map.get(FLAT.minAmount)) ||
    asPlain(doc.free_shipping_min_amount) ||
    "";
  const excludeRaw =
    asPlain(map.get(FLAT.exclude)) ||
    asPlain(doc.free_shipping_exclude_provider_codes) ||
    "peyk,alopeyk";

  return {
    enabled: enabledRaw.toLowerCase() === "true" || doc.free_shipping_enabled === true,
    minAmount: Math.max(0, Number(minRaw || 0) || 0),
    excludeCodes: excludeRaw || "peyk,alopeyk",
  };
}

export function freeShippingSelectKeys(): string[] {
  return [FLAT.enabled, FLAT.minAmount, FLAT.exclude, SHIPPING_DOC_KEY];
}

export function freeShippingUpsertRows(input: FreeShippingSettings): {
  key: string;
  value: unknown;
}[] {
  const exclude =
    input.excludeCodes
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean)
      .join(",") || "peyk,alopeyk";
  const minAmount = Math.max(0, Math.floor(Number(input.minAmount) || 0));
  const enabled = !!input.enabled;

  return [
    { key: FLAT.enabled, value: enabled ? "true" : "false" },
    { key: FLAT.minAmount, value: String(minAmount) },
    { key: FLAT.exclude, value: exclude },
    {
      key: SHIPPING_DOC_KEY,
      value: {
        free_shipping_enabled: enabled,
        free_shipping_min_amount: minAmount,
        free_shipping_exclude_provider_codes: exclude,
      },
    },
  ];
}

/** Merge free-shipping fields into existing shipping jsonb doc (preserve warehouse etc.). */
export function mergeShippingDoc(
  existing: unknown,
  input: FreeShippingSettings,
): Record<string, unknown> {
  const doc = shippingDoc(existing);
  const exclude =
    input.excludeCodes
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean)
      .join(",") || "peyk,alopeyk";
  return {
    ...doc,
    free_shipping_enabled: !!input.enabled,
    free_shipping_min_amount: Math.max(0, Math.floor(Number(input.minAmount) || 0)),
    free_shipping_exclude_provider_codes: exclude,
  };
}
