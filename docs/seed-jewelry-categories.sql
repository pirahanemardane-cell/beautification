-- =====================================================
-- Owner-run: seed default jewelry categories (Persian slugs)
-- Idempotent. Restores home/mega category tiles + icons.
-- Run in Supabase Dashboard → SQL Editor → Paste → Run.
-- Source of truth in repo:
--   supabase/migrations/065_seed_jewelry_categories.sql
--   supabase/migrations/067_persian_category_slugs.sql
--   docs/seed-jewelry-categories.sql
-- Slugs: گردنبند, گوشواره, انگشتر, دستبند, ست, اکسسوری
-- =====================================================

BEGIN;

-- Prefer rename when English leftovers exist
UPDATE public.categories AS c
SET
  slug = m.fa,
  updated_at = now()
FROM (
  VALUES
    ('necklace', 'گردنبند'),
    ('earring', 'گوشواره'),
    ('ring', 'انگشتر'),
    ('bracelet', 'دستبند'),
    ('set', 'ست'),
    ('accessory', 'اکسسوری')
) AS m(en, fa)
WHERE c.slug = m.en
  AND NOT EXISTS (
    SELECT 1 FROM public.categories x WHERE x.slug = m.fa AND x.id <> c.id
  );

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
    'گردنبند',
    'گردنبندهای دست‌ساز',
    10,
    true,
    NULL,
    'گردنبند | اکسسوری شاد',
    'خرید گردنبند دست‌ساز'
  ),
  (
    'گوشواره',
    'گوشواره',
    'گوشواره‌های دست‌ساز',
    20,
    true,
    NULL,
    'گوشواره | اکسسوری شاد',
    'خرید گوشواره دست‌ساز'
  ),
  (
    'انگشتر',
    'انگشتر',
    'انگشترهای دست‌ساز',
    30,
    true,
    NULL,
    'انگشتر | اکسسوری شاد',
    'خرید انگشتر دست‌ساز'
  ),
  (
    'دستبند',
    'دستبند',
    'دستبندهای دست‌ساز',
    40,
    true,
    NULL,
    'دستبند | اکسسوری شاد',
    'خرید دستبند دست‌ساز'
  ),
  (
    'ست',
    'ست',
    'ست‌های هماهنگ اکسسوری',
    50,
    true,
    NULL,
    'ست | اکسسوری شاد',
    'خرید ست اکسسوری دست‌ساز'
  ),
  (
    'اکسسوری',
    'اکسسوری',
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

INSERT INTO public.url_redirects (from_path, to_path, status_code, source, note, is_active)
VALUES
  ('/necklace', '/گردنبند', 301, 'system', 'persian category slug', true),
  ('/earring', '/گوشواره', 301, 'system', 'persian category slug', true),
  ('/ring', '/انگشتر', 301, 'system', 'persian category slug', true),
  ('/bracelet', '/دستبند', 301, 'system', 'persian category slug', true),
  ('/set', '/ست', 301, 'system', 'persian category slug', true),
  ('/accessory', '/اکسسوری', 301, 'system', 'persian category slug', true),
  ('/categories/necklace', '/گردنبند', 301, 'system', 'persian category slug', true),
  ('/categories/earring', '/گوشواره', 301, 'system', 'persian category slug', true),
  ('/categories/ring', '/انگشتر', 301, 'system', 'persian category slug', true),
  ('/categories/bracelet', '/دستبند', 301, 'system', 'persian category slug', true),
  ('/categories/set', '/ست', 301, 'system', 'persian category slug', true),
  ('/categories/accessory', '/اکسسوری', 301, 'system', 'persian category slug', true)
ON CONFLICT (from_path) DO UPDATE
SET
  to_path = EXCLUDED.to_path,
  status_code = 301,
  is_active = true,
  updated_at = now();

COMMIT;

-- Optional:
-- NOTIFY pgrst, 'reload schema';
