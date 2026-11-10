import { describe, expect, it } from "vitest";
import {
  brandPath,
  categoryPath,
  englishPathToPersian,
  persianPathToEnglish,
  productPath,
  STOREFRONT_PATHS,
} from "@/lib/seo/storefront-paths";

describe("storefront-paths", () => {
  it("maps English pages to Persian", () => {
    expect(englishPathToPersian("/products")).toBe("/محصولات");
    expect(englishPathToPersian("/products/ring-gold")).toBe(
      "/محصولات/ring-gold",
    );
    expect(englishPathToPersian("/cart")).toBe("/سبد-خرید");
    expect(englishPathToPersian("/checkout")).toBe("/تسویه-حساب");
    expect(englishPathToPersian("/admin/products")).toBeNull();
  });

  it("rewrites Persian pages to English App Router paths", () => {
    expect(persianPathToEnglish("/محصولات")).toBe("/products");
    expect(persianPathToEnglish("/محصولات/انگشتر-طلا")).toBe(
      "/products/انگشتر-طلا",
    );
    expect(persianPathToEnglish("/سبد-خرید")).toBe("/cart");
    expect(persianPathToEnglish("/تماس-با-ما")).toBe("/contact");
  });

  it("builds product/category/brand hrefs", () => {
    expect(productPath("انگشتر-طلا")).toBe("/محصولات/انگشتر-طلا");
    expect(categoryPath("گردنبند")).toBe("/گردنبند");
    expect(brandPath("شاد")).toBe("/شاد");
    expect(STOREFRONT_PATHS.search).toBe("/جستجو");
  });
});
