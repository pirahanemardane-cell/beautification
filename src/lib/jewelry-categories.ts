/** دسته‌بندی‌های استاندارد اکسسوری شاد (slugs map to CategorySvgIcon) */
export const JEWELRY_CATEGORIES = [
  { name: "گردنبند", slug: "گردنبند", icon: "necklace" },
  { name: "گوشواره", slug: "گوشواره", icon: "earring" },
  { name: "انگشتر", slug: "انگشتر", icon: "ring" },
  { name: "دستبند", slug: "دستبند", icon: "bracelet" },
  { name: "ست", slug: "ست", icon: "set" },
  { name: "اکسسوری", slug: "اکسسوری", icon: "default" },
] as const;

/** متریال‌های رایج — slug فارسی برای URL facet */
export const JEWELRY_MATERIALS = [
  { name: "طلا", slug: "طلا" },
  { name: "نقره", slug: "نقره" },
  { name: "استیل", slug: "استیل" },
  { name: "رزگلد", slug: "رزگلد" },
  { name: "پلاتین", slug: "پلاتین" },
] as const;

/** رنگ‌های رایج — slug فارسی برای URL facet */
export const JEWELRY_COLORS = [
  { name: "طلایی", slug: "طلایی", hex: "#D4AF37" },
  { name: "نقره‌ای", slug: "نقره-ای", hex: "#C0C0C0" },
  { name: "رزگلد", slug: "رزگلد", hex: "#B76E79" },
  { name: "سفید", slug: "سفید", hex: "#F5F5F5" },
  { name: "مشکی", slug: "مشکی", hex: "#1a1a1a" },
] as const;
