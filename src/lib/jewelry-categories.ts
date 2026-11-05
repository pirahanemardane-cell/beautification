/** دسته‌بندی‌های استاندارد اکسسوری شاد (slugs map to CategorySvgIcon) */
export const JEWELRY_CATEGORIES = [
  { name: "گردنبند", slug: "necklace", icon: "necklace" },
  { name: "گوشواره", slug: "earring", icon: "earring" },
  { name: "انگشتر", slug: "ring", icon: "ring" },
  { name: "دستبند", slug: "bracelet", icon: "bracelet" },
  { name: "ست", slug: "set", icon: "set" },
  { name: "اکسسوری", slug: "accessory", icon: "default" },
] as const;

/** متریال‌های رایج */
export const JEWELRY_MATERIALS = [
  { name: "طلا", slug: "gold" },
  { name: "نقره", slug: "silver" },
  { name: "استیل", slug: "steel" },
  { name: "رزگلد", slug: "rosegold" },
  { name: "پلاتین", slug: "platinum" },
] as const;

/** رنگ‌های رایج */
export const JEWELRY_COLORS = [
  { name: "طلایی", slug: "gold", hex: "#D4AF37" },
  { name: "نقره‌ای", slug: "silver", hex: "#C0C0C0" },
  { name: "رزگلد", slug: "rosegold", hex: "#B76E79" },
  { name: "سفید", slug: "white", hex: "#F5F5F5" },
  { name: "مشکی", slug: "black", hex: "#1a1a1a" },
] as const;
