import { describe, expect, it } from "vitest";
import {
  APPAREL_ATTR_BLOCKLIST,
  filterJewelryFacets,
  filterJewelrySizeChips,
  isAllowedJewelryAttrSlug,
  isApparelAttrSlug,
  parseAttrFacetsFromParams,
  parseInStockParam,
} from "@/lib/facet-map";

describe("facet-map jewelry standards", () => {
  it("blocks apparel leftover attribute slugs", () => {
    for (const slug of APPAREL_ATTR_BLOCKLIST) {
      expect(isApparelAttrSlug(slug)).toBe(true);
      expect(isAllowedJewelryAttrSlug(slug)).toBe(false);
    }
  });

  it("allows jewelry material / metal / ring-size facets", () => {
    expect(isAllowedJewelryAttrSlug("material")).toBe(true);
    expect(isAllowedJewelryAttrSlug("metal")).toBe(true);
    expect(isAllowedJewelryAttrSlug("ring-size")).toBe(true);
    expect(isAllowedJewelryAttrSlug("necklace-length")).toBe(true);
  });

  it("filters facets by jewelry category", () => {
    const facets = [
      { slug: "fabric" },
      { slug: "material" },
      { slug: "ring-size" },
      { slug: "fit" },
      { slug: "necklace-length" },
    ];
    const ring = filterJewelryFacets(facets, "ring").map((f) => f.slug);
    expect(ring).toContain("material");
    expect(ring).toContain("ring-size");
    expect(ring).not.toContain("fabric");
    expect(ring).not.toContain("fit");
    expect(ring).not.toContain("necklace-length");

    const ringFa = filterJewelryFacets(facets, "انگشتر").map((f) => f.slug);
    expect(ringFa).toContain("ring-size");
    expect(ringFa).not.toContain("necklace-length");

    const all = filterJewelryFacets(facets).map((f) => f.slug);
    expect(all).toContain("material");
    expect(all).toContain("ring-size");
    expect(all).toContain("necklace-length");
    expect(all).not.toContain("fabric");
  });

  it("drops apparel letter sizes from chips", () => {
    const sizes = filterJewelrySizeChips([
      { slug: "m", name: "M" },
      { slug: "54", name: "۵۴" },
      { slug: "xl", name: "XL" },
      { slug: "58", name: "۵۸" },
    ]);
    expect(sizes.map((s) => s.slug)).toEqual(["54", "58"]);
  });

  it("parses jewelry attr + inStock URL params", () => {
    expect(
      parseAttrFacetsFromParams({
        material: "gold",
        fabric: "cotton",
        "ring-size": "54",
      }),
    ).toEqual({ material: "gold", "ring-size": "54" });
    expect(parseInStockParam("1")).toBe(true);
    expect(parseInStockParam("0")).toBeUndefined();
  });
});
