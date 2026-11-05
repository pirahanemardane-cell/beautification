import { describe, expect, it } from "vitest";
import { resolveCategoryIconId } from "@/components/home/category-icons";

describe("resolveCategoryIconId", () => {
  it("maps Persian jewelry category names", () => {
    expect(resolveCategoryIconId("گردنبند", "necklace")).toBe("necklace");
    expect(resolveCategoryIconId("گوشواره", "earring")).toBe("earring");
    expect(resolveCategoryIconId("انگشتر", "ring")).toBe("ring");
    expect(resolveCategoryIconId("دستبند", "bracelet")).toBe("bracelet");
    expect(resolveCategoryIconId("ست", "set")).toBe("set");
  });

  it("maps English slugs from href-style paths", () => {
    expect(resolveCategoryIconId(null, "/necklace")).toBe("necklace");
    expect(resolveCategoryIconId(null, "/earring")).toBe("earring");
    expect(resolveCategoryIconId(null, "/ring")).toBe("ring");
    expect(resolveCategoryIconId(null, "/bracelet")).toBe("bracelet");
    expect(resolveCategoryIconId(null, "/set")).toBe("set");
  });

  it("does not confuse earring with ring", () => {
    expect(resolveCategoryIconId("گوشواره", "earring")).toBe("earring");
    expect(resolveCategoryIconId(null, "/ear-ring")).toBe("earring");
  });

  it("falls back to gem default", () => {
    expect(resolveCategoryIconId("متفرقه", "misc")).toBe("default");
    expect(resolveCategoryIconId("اکسسوری", "accessory")).toBe("default");
  });

  it("maps all JEWELRY_CATEGORIES slugs to expected icons", async () => {
    const { JEWELRY_CATEGORIES } = await import("@/lib/jewelry-categories");
    for (const cat of JEWELRY_CATEGORIES) {
      expect(resolveCategoryIconId(cat.name, cat.slug)).toBe(cat.icon);
    }
  });
});
