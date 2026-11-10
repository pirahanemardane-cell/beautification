export const PRODUCT_IMAGE_ROLES = [
  "gallery",
  "neutral",
  "lifestyle",
  "angle",
  "model",
] as const;

export type ProductImageRole = (typeof PRODUCT_IMAGE_ROLES)[number];

export const PRODUCT_IMAGE_ROLE_LABELS: Record<ProductImageRole, string> = {
  gallery: "گالری",
  neutral: "خنثی (استودیو)",
  lifestyle: "لایف‌استایل",
  angle: "زاویه",
  model: "مدل / پوشیده",
};

export function isProductImageRole(v: unknown): v is ProductImageRole {
  return (
    typeof v === "string" &&
    (PRODUCT_IMAGE_ROLES as readonly string[]).includes(v)
  );
}

export function normalizeImageRole(v: unknown): ProductImageRole {
  return isProductImageRole(v) ? v : "gallery";
}
