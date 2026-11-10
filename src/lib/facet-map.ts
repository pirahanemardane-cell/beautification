/**
 * Jewelry/accessory PLP facets — Farfetch / Net-a-Porter / Nordstrom style.
 * Apparel leftovers (fabric, fit, collar, gender tee, etc.) are blocked.
 */

/** Attribute slugs allowed as URL facet params (color/size are first-class, not here). */
export const JEWELRY_ATTR_FACET_SLUGS = [
  "material",
  "material-type",
  "metal",
  "plating",
  "karat",
  "purity",
  "stone",
  "gemstone",
  "finish",
  "style",
  "clasp",
  "chain-type",
  "chain-length",
  "necklace-length",
  "bracelet-size",
  "bracelet-length",
  "ring-size",
  "ring-size-type",
  "earring-type",
  "occasion",
  "origin",
  "thickness",
  "closure",
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
  "gender",
  "gender-tee",
  "shirt-size",
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

/** Core facets shown for every jewelry category (when present in catalog). */
const CORE_JEWELRY_FACETS = [
  "material",
  "material-type",
  "metal",
  "plating",
  "karat",
  "stone",
  "gemstone",
  "finish",
  "style",
  "occasion",
  "origin",
] as const;

const RING_FACETS = [
  ...CORE_JEWELRY_FACETS,
  "ring-size",
  "ring-size-type",
] as const;

const NECKLACE_FACETS = [
  ...CORE_JEWELRY_FACETS,
  "necklace-length",
  "chain-length",
  "chain-type",
  "clasp",
  "closure",
] as const;

const BRACELET_FACETS = [
  ...CORE_JEWELRY_FACETS,
  "bracelet-size",
  "bracelet-length",
  "clasp",
  "closure",
  "thickness",
] as const;

const EARRING_FACETS = [
  ...CORE_JEWELRY_FACETS,
  "earring-type",
  "closure",
  "clasp",
] as const;

const SET_FACETS = [...CORE_JEWELRY_FACETS, "clasp", "closure"] as const;

const ACCESSORY_FACETS = [
  ...CORE_JEWELRY_FACETS,
  "clasp",
  "closure",
  "thickness",
] as const;

export const FACET_BY_CATEGORY: Record<string, string[]> = {
  necklace: [...NECKLACE_FACETS],
  necklaces: [...NECKLACE_FACETS],
  earring: [...EARRING_FACETS],
  earrings: [...EARRING_FACETS],
  ring: [...RING_FACETS],
  rings: [...RING_FACETS],
  bracelet: [...BRACELET_FACETS],
  bracelets: [...BRACELET_FACETS],
  set: [...SET_FACETS],
  sets: [...SET_FACETS],
  accessory: [...ACCESSORY_FACETS],
  accessories: [...ACCESSORY_FACETS],
};

/** URL keys accepted for attribute facets (shared by PLP / category / brand / search). */
export const FACET_KEYS = [...JEWELRY_ATTR_FACET_SLUGS] as const;

export const DEFAULT_FACET_SLUGS = [...CORE_JEWELRY_FACETS] as const;

/** First-class material facet slugs (promoted above “more filters”). */
export const MATERIAL_FACET_SLUGS = new Set([
  "material",
  "material-type",
  "metal",
  "plating",
  "karat",
  "purity",
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
  return FACET_BY_CATEGORY[categorySlug] ?? [...DEFAULT_FACET_SLUGS];
}

/** Keep only jewelry-relevant filterable attributes for a category. */
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

/** Apparel tee/shirt letter sizes — hide from jewelry PLP size chips. */
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

/** Parse jewelry attr facets from URL search params. */
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
