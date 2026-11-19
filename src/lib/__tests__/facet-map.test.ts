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

describe("facet-map cosmetics", () => {
  it("blocks apparel leftover attribute slugs", () => {
    for (const slug of APPAREL_ATTR_BLOCKLIST) {
      expect(isApparelAttrSlug(slug)).toBe(true);
      expect(isAllowedJewelryAttrSlug(slug)).toBe(false);
    }
  });

  it("allows skin type, skin concern, and gender", () => {
    expect(isAllowedJewelryAttrSlug("skin-type")).toBe(true);
    expect(isAllowedJewelryAttrSlug("skin-concern")).toBe(true);
    expect(isAllowedJewelryAttrSlug("gender")).toBe(true);
    expect(isAllowedJewelryAttrSlug("material")).toBe(false);
    expect(isAllowedJewelryAttrSlug("ring-size")).toBe(false);
    expect(isAllowedJewelryAttrSlug("karat")).toBe(false);
  });

  it("filters facets to the cosmetics set", () => {
    const facets = [
      { slug: "fabric" },
      { slug: "skin-type" },
      { slug: "gender" },
      { slug: "material" },
      { slug: "skin-concern" },
      { slug: "ring-size" },
    ];
    const skin = filterJewelryFacets(facets, "مراقبت-پوست").map((f) => f.slug);
    expect(skin).toEqual(["skin-type", "gender", "skin-concern"]);

    const makeup = filterJewelryFacets(facets, "آرایش").map((f) => f.slug);
    expect(makeup).toContain("gender");
    expect(makeup).not.toContain("material");
    expect(makeup).not.toContain("ring-size");

    const all = filterJewelryFacets(facets).map((f) => f.slug);
    expect(all).toContain("skin-type");
    expect(all).toContain("skin-concern");
    expect(all).toContain("gender");
    expect(all).not.toContain("fabric");
    expect(all).not.toContain("material");
  });

  it("drops apparel letter sizes from chips", () => {
    const sizes = filterJewelrySizeChips([
      { slug: "m", name: "M" },
      { slug: "50ml", name: "۵۰ میل" },
      { slug: "xl", name: "XL" },
    ]);
    expect(sizes.map((s) => s.slug)).toEqual(["50ml"]);
  });

  it("parses cosmetics attr + inStock URL params", () => {
    expect(
      parseAttrFacetsFromParams({
        "skin-type": "dry",
        material: "gold",
        gender: "women",
        fabric: "cotton",
      }),
    ).toEqual({ "skin-type": "dry", gender: "women" });
    expect(parseInStockParam("1")).toBe(true);
    expect(parseInStockParam("0")).toBeUndefined();
  });
});
