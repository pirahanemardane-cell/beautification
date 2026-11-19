/**
 * PLP facets — same allowlist used by products, category, brand, and search.
 * Cosmetics set (Khanoumi / Digikala beauty / Roja): skin type, skin concern, gender.
 * Category, brand, and price are first-class filters, not attribute slugs.
 * Apparel leftovers stay blocked.
 */

/** Attribute slugs allowed as URL facet params (color/size are first-class, not here). */
export const JEWELRY_ATTR_FACET_SLUGS = [
  "skin-type",
  "skin-concern",
  "gender",
] as const;

export type JewelryAttrFacetSlug = (typeof JEWELRY_ATTR_FACET_SLUGS)[number];

/** Explicit legacy apparel attribute leftovers — never surface in shop filters. */
export const APPAREL_ATTR_BLOCKLIST = [
  "fabric",
  "pattern",
  "season",
  "fit",
  "collar",
  "collar-type",
  "sleeve",
  "sleeve-type",
  "button-type",
  "pocket",
  "tie-width",
  "tie-length",
  "bow-tie-type",
  "cufflink-material",
  "gender-tee",
  "tee-size",
  "waist",
  "inseam",
  "neck",
  "chest",
] as const;

const APPAREL_BLOCK = new Set<string>(
  APPAREL_ATTR_BLOCKLIST.map((s) => s.toLowerCase()),
);

const ALLOWED_ATTR = new Set<string>(
  JEWELRY_ATTR_FACET_SLUGS.map((s) => s.toLowerCase()),
);

/** Shown for every cosmetics category (when present in catalog). */
const CORE_FACETS = ["skin-type", "skin-concern", "gender"] as const;

export const FACET_BY_CATEGORY: Record<string, string[]> = {
  "مراقبت-پوست": [...CORE_FACETS],
  "مراقبت پوست": [...CORE_FACETS],
  skincare: [...CORE_FACETS],
  "skin-care": [...CORE_FACETS],
  آرایش: [...CORE_FACETS],
  makeup: [...CORE_FACETS],
  مو: [...CORE_FACETS],
  hair: [...CORE_FACETS],
  بدن: [...CORE_FACETS],
  body: [...CORE_FACETS],
  عطر: [...CORE_FACETS],
  fragrance: [...CORE_FACETS],
  perfume: [...CORE_FACETS],
  بهداشت: [...CORE_FACETS],
  hygiene: [...CORE_FACETS],
};

/** URL keys accepted for attribute facets (shared by PLP / category / brand / search). */
export const FACET_KEYS = [...JEWELRY_ATTR_FACET_SLUGS] as const;

export const DEFAULT_FACET_SLUGS = [...CORE_FACETS] as const;

/** Facets promoted above “more filters”. */
export const MATERIAL_FACET_SLUGS = new Set([
  "skin-type",
  "skin-concern",
  "gender",
]);

export function isApparelAttrSlug(slug: string): boolean {
  return APPAREL_BLOCK.has(slug.trim().toLowerCase());
}

export function isAllowedJewelryAttrSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (!s || APPAREL_BLOCK.has(s)) return false;
  if (s === "color" || s === "size") return false;
  return ALLOWED_ATTR.has(s);
}

export function facetSlugsForCategory(categorySlug?: string): string[] {
  if (!categorySlug) return [...DEFAULT_FACET_SLUGS];
  const key = categorySlug.trim();
  return (
    FACET_BY_CATEGORY[key] ??
    FACET_BY_CATEGORY[key.toLowerCase()] ??
    [...DEFAULT_FACET_SLUGS]
  );
}

/** Keep only cosmetics filterable attributes for a category. */
export function filterJewelryFacets<T extends { slug: string }>(
  facets: T[],
  categorySlug?: string,
): T[] {
  const allowed = new Set(
    facetSlugsForCategory(categorySlug).map((s) => s.toLowerCase()),
  );
  const loose = !categorySlug;
  return facets.filter((f) => {
    const s = String(f.slug || "").toLowerCase();
    if (!s || isApparelAttrSlug(s)) return false;
    if (s === "color" || s === "size") return false;
    if (allowed.has(s)) return true;
    return loose && isAllowedJewelryAttrSlug(s);
  });
}

/** Legacy apparel letter sizes — hide from size chips. */
const APPAREL_SIZE_SLUGS = new Set([
  "xxs",
  "xs",
  "s",
  "m",
  "l",
  "xl",
  "xxl",
  "2xl",
  "3xl",
  "4xl",
  "one-size",
  "onesize",
  "os",
  "free-size",
  "freesize",
]);

const APPAREL_SIZE_NAMES = new Set([
  "ایکس اس",
  "اس",
  "ام",
  "ال",
  "ایکس ال",
  "دو ایکس ال",
  "فری سایز",
  "وان سایز",
]);

export function isApparelSizeChip(input: {
  slug?: string | null;
  name?: string | null;
}): boolean {
  const slug = String(input.slug || "")
    .trim()
    .toLowerCase();
  const name = String(input.name || "")
    .trim()
    .toLowerCase();
  if (slug && APPAREL_SIZE_SLUGS.has(slug)) return true;
  if (name && APPAREL_SIZE_SLUGS.has(name)) return true;
  if (name && APPAREL_SIZE_NAMES.has(name)) return true;
  return false;
}

export function filterJewelrySizeChips<
  T extends { slug?: string | null; name?: string | null },
>(sizes: T[]): T[] {
  return sizes.filter((s) => !isApparelSizeChip(s));
}

/** Parse cosmetics attr facets from URL search params. */
export function parseAttrFacetsFromParams(
  params: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const key of FACET_KEYS) {
    const v = params[key];
    if (typeof v === "string" && v && isAllowedJewelryAttrSlug(key)) {
      attrs[key] = v;
    }
  }
  return attrs;
}

export function parseInStockParam(
  value: string | string[] | undefined,
): boolean | undefined {
  if (value === "1" || value === "true") return true;
  return undefined;
}
