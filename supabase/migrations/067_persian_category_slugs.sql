-- =====================================================
-- Convert jewelry category slugs EN → FA + cheap redirects
-- Idempotent. Safe if categories already Persian.
-- =====================================================

BEGIN;

-- Rename known English jewelry category slugs to Persian
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

-- Seed Persian categories if missing (no-op when already present)
INSERT INTO public.categories (
  name, slug, description, sort_order, is_active, parent_id, meta_title, meta_description
)
VALUES
  ('گردنبند', 'گردنبند', 'گردنبندهای دست‌ساز', 10, true, NULL, 'گردنبند | اکسسوری شاد', 'خرید گردنبند دست‌ساز'),
  ('گوشواره', 'گوشواره', 'گوشواره‌های دست‌ساز', 20, true, NULL, 'گوشواره | اکسسوری شاد', 'خرید گوشواره دست‌ساز'),
  ('انگشتر', 'انگشتر', 'انگشترهای دست‌ساز', 30, true, NULL, 'انگشتر | اکسسوری شاد', 'خرید انگشتر دست‌ساز'),
  ('دستبند', 'دستبند', 'دستبندهای دست‌ساز', 40, true, NULL, 'دستبند | اکسسوری شاد', 'خرید دستبند دست‌ساز'),
  ('ست', 'ست', 'ست‌های هماهنگ اکسسوری', 50, true, NULL, 'ست | اکسسوری شاد', 'خرید ست اکسسوری دست‌ساز'),
  ('اکسسوری', 'اکسسوری', 'سایر اکسسوری‌ها', 60, true, NULL, 'اکسسوری | اکسسوری شاد', 'خرید اکسسوری دست‌ساز')
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  is_active = true,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Optional DB redirects (app also redirects EN→FA in next.config + proxy)
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
  ('/categories/accessory', '/اکسسوری', 301, 'system', 'persian category slug', true),
  ('/products', '/محصولات', 301, 'system', 'persian storefront path', true),
  ('/cart', '/سبد-خرید', 301, 'system', 'persian storefront path', true),
  ('/checkout', '/تسویه-حساب', 301, 'system', 'persian storefront path', true),
  ('/blog', '/بلاگ', 301, 'system', 'persian storefront path', true),
  ('/brands', '/برندها', 301, 'system', 'persian storefront path', true),
  ('/about', '/درباره-ما', 301, 'system', 'persian storefront path', true),
  ('/contact', '/تماس', 301, 'system', 'persian storefront path', true)
ON CONFLICT (from_path) DO UPDATE
SET
  to_path = EXCLUDED.to_path,
  status_code = EXCLUDED.status_code,
  source = EXCLUDED.source,
  note = EXCLUDED.note,
  is_active = true,
  updated_at = now();

COMMIT;
