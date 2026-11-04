import { describe, expect, it } from "vitest";
import { parseFreeShippingFromRows, mergeShippingDoc } from "./free-shipping";

describe("free-shipping settings", () => {
  it("reads nested shipping jsonb from live shape", () => {
    const parsed = parseFreeShippingFromRows([
      {
        key: "shipping",
        value: { free_shipping_enabled: true, free_shipping_min_amount: 2000000 },
      },
    ]);
    expect(parsed.enabled).toBe(true);
    expect(parsed.minAmount).toBe(2000000);
  });

  it("prefers flat keys when present", () => {
    const parsed = parseFreeShippingFromRows([
      { key: "shipping", value: { free_shipping_enabled: false, free_shipping_min_amount: 1 } },
      { key: "free_shipping_enabled", value: "true" },
      { key: "free_shipping_min_amount", value: "5000" },
    ]);
    expect(parsed.enabled).toBe(true);
    expect(parsed.minAmount).toBe(5000);
  });

  it("merges shipping doc without dropping other fields", () => {
    const merged = mergeShippingDoc(
      { free_shipping_enabled: false, city: "تهران" },
      { enabled: true, minAmount: 100, excludeCodes: "peyk" },
    );
    expect(merged.city).toBe("تهران");
    expect(merged.free_shipping_enabled).toBe(true);
    expect(merged.free_shipping_min_amount).toBe(100);
  });
});
