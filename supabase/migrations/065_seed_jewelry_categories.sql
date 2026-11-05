-- =====================================================
-- Seed default jewelry categories (idempotent)
-- Restores storefront category tiles + CategorySvgIcon
-- mapping after demo-content wipe (063) emptied categories.
-- Slugs match src/lib/jewelry-categories.ts + icon rules.
-- =====================================================

BEGIN;

INSERT INTO public.categories (
  name,
  slug,
  description,
  sort_order,
  is_active,
  parent_id,
  meta_title,
  meta_description
)
VALUES
  (
    'گردنبند',
    'necklace',
    'گردنبندهای دست‌ساز',
    10,
    true,
    NULL,
    'گردنبند | اکسسوری شاد',
    'خرید گردنبند دست‌ساز'
  ),
  (
    'گوشواره',
    'earring',
    'گوشواره‌های دست‌ساز',
    20,
    true,
    NULL,
    'گوشواره | اکسسوری شاد',
    'خرید گوشواره دست‌ساز'
  ),
  (
    'انگشتر',
    'ring',
    'انگشترهای دست‌ساز',
    30,
    true,
    NULL,
    'انگشتر | اکسسوری شاد',
    'خرید انگشتر دست‌ساز'
  ),
  (
    'دستبند',
    'bracelet',
    'دستبندهای دست‌ساز',
    40,
    true,
    NULL,
    'دستبند | اکسسوری شاد',
    'خرید دستبند دست‌ساز'
  ),
  (
    'ست',
    'set',
    'ست‌های هماهنگ اکسسوری',
    50,
    true,
    NULL,
    'ست | اکسسوری شاد',
    'خرید ست اکسسوری دست‌ساز'
  ),
  (
    'اکسسوری',
    'accessory',
    'سایر اکسسوری‌ها',
    60,
    true,
    NULL,
    'اکسسوری | اکسسوری شاد',
    'خرید اکسسوری دست‌ساز'
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = COALESCE(EXCLUDED.description, public.categories.description),
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  parent_id = NULL,
  meta_title = COALESCE(EXCLUDED.meta_title, public.categories.meta_title),
  meta_description = COALESCE(EXCLUDED.meta_description, public.categories.meta_description),
  updated_at = now();

COMMIT;

-- Optional after owner run:
-- NOTIFY pgrst, 'reload schema';
