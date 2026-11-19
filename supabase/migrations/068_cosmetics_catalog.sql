-- Cosmetics catalog: categories, facets, sample brands and products.
-- Replaces jewelry filter attributes. Idempotent.

BEGIN;

UPDATE public.categories
SET is_active = false, updated_at = now()
WHERE slug IN ('گردنبند', 'گوشواره', 'انگشتر', 'دستبند', 'ست', 'اکسسوری', 'necklace', 'earring', 'ring', 'bracelet', 'accessory');

INSERT INTO public.categories (
  name, slug, description, sort_order, is_active, parent_id, meta_title, meta_description
)
VALUES
  ('مراقبت پوست', 'مراقبت-پوست', 'کرم، سرم، شوینده و ضدآفتاب', 10, true, NULL, 'مراقبت پوست | بیوتی‌فیکیشن', 'خرید محصولات مراقبت پوست'),
  ('آرایش', 'آرایش', 'رژ، کرم‌پودر و لوازم آرایش', 20, true, NULL, 'آرایش | بیوتی‌فیکیشن', 'خرید لوازم آرایش'),
  ('مو', 'مو', 'شامپو، نرم‌کننده و مراقبت مو', 30, true, NULL, 'مو | بیوتی‌فیکیشن', 'خرید محصولات مو'),
  ('بدن', 'بدن', 'لوسیون، شوینده بدن و مراقبت پوست بدن', 40, true, NULL, 'بدن | بیوتی‌فیکیشن', 'خرید محصولات بدن'),
  ('عطر', 'عطر', 'عطر و اسپری بدن', 50, true, NULL, 'عطر | بیوتی‌فیکیشن', 'خرید عطر'),
  ('بهداشت', 'بهداشت', 'بهداشت دهان، دست و مراقبت روزانه', 60, true, NULL, 'بهداشت | بیوتی‌فیکیشن', 'خرید محصولات بهداشتی')
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  parent_id = NULL,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  updated_at = now();

UPDATE public.attributes
SET is_filterable = false
WHERE slug IN (
  'material', 'material-type', 'metal', 'plating', 'karat', 'purity',
  'stone', 'gemstone', 'finish', 'style', 'hypoallergenic', 'clasp',
  'chain-type', 'chain-length', 'necklace-length', 'bracelet-size',
  'bracelet-length', 'ring-size', 'ring-size-type', 'earring-type',
  'occasion', 'origin', 'thickness', 'closure'
);

INSERT INTO public.attributes (name, slug, type, is_filterable, sort_order)
SELECT v.name, v.slug, 'select', true, v.sort_order
FROM (VALUES
  ('نوع پوست', 'skin-type', 10),
  ('نگرانی پوست', 'skin-concern', 20),
  ('جنسیت', 'gender', 30)
) AS v(name, slug, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.attributes a WHERE a.slug = v.slug
);

UPDATE public.attributes
SET name = v.name, is_filterable = true, type = 'select', sort_order = v.sort_order
FROM (VALUES
  ('نوع پوست', 'skin-type', 10),
  ('نگرانی پوست', 'skin-concern', 20),
  ('جنسیت', 'gender', 30)
) AS v(name, slug, sort_order)
WHERE public.attributes.slug = v.slug;

INSERT INTO public.attribute_options (attribute_id, value, slug, sort_order, hex)
SELECT a.id, o.value, o.slug, o.sort_order, NULL
FROM public.attributes a
JOIN (VALUES
  ('skin-type', 'خشک', 'dry', 10),
  ('skin-type', 'چرب', 'oily', 20),
  ('skin-type', 'مختلط', 'combination', 30),
  ('skin-type', 'معمولی', 'normal', 40),
  ('skin-type', 'حساس', 'sensitive', 50),
  ('skin-concern', 'آکنه', 'acne', 10),
  ('skin-concern', 'چین و چروک', 'wrinkles', 20),
  ('skin-concern', 'لک', 'dark-spots', 30),
  ('skin-concern', 'خشکی', 'dryness', 40),
  ('skin-concern', 'منافذ', 'pores', 50),
  ('skin-concern', 'تیرگی', 'dullness', 60),
  ('skin-concern', 'آبرسانی', 'hydration', 70),
  ('gender', 'زنانه', 'women', 10),
  ('gender', 'مردانه', 'men', 20),
  ('gender', 'مشترک', 'unisex', 30)
) AS o(attr_slug, value, slug, sort_order)
  ON a.slug = o.attr_slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.attribute_options ao
  WHERE ao.attribute_id = a.id AND ao.slug = o.slug
);

INSERT INTO public.brands (name, slug, description, is_active)
SELECT v.name, v.slug, v.description, true
FROM (VALUES
  ('سینره', 'cinere', 'مراقبت پوست'),
  ('هیدرودرم', 'hydroderm', 'مراقبت پوست و بدن'),
  ('مای', 'my', 'آرایش'),
  ('لافارر', 'lafarrerr', 'مراقبت مو'),
  ('شون', 'schon', 'بدن و بهداشت'),
  ('بادی کر', 'body-care', 'عطر')
) AS v(name, slug, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.brands b WHERE b.slug = v.slug
);

INSERT INTO public.products (
  category_id, brand_id, name, slug, short_description, description,
  status, is_featured, is_new, is_bestseller, published_at
)
SELECT c.id, b.id, p.name, p.slug, p.short_description, p.description,
  'published', p.featured, true, p.bestseller, now()
FROM (VALUES
  ('مراقبت-پوست', 'cinere', 'کرم آبرسان سینره', 'cinere-hydrating-cream', 'کرم آبرسان برای پوست خشک', 'کرم آبرسان روزانه با بافت سبک برای پوست خشک و حساس.', true, true),
  ('مراقبت-پوست', 'hydroderm', 'سرم ویتامین سی هیدرودرم', 'hydroderm-vitamin-c-serum', 'سرم روشن‌کننده لک', 'سرم ویتامین سی برای کاهش لک و تیرگی پوست مختلط.', true, false),
  ('آرایش', 'my', 'رژ لب مای', 'my-lipstick', 'رژ لب کرمی', 'رژ لب با پوشش یکنواخت، مناسب استفاده روزانه.', false, true),
  ('مو', 'lafarrerr', 'شامپو ضدریزش لافارر', 'lafarrerr-anti-hair-loss-shampoo', 'شامپو تقویت‌کننده مو', 'شامپو روزانه برای کاهش ریزش و تمیز کردن پوست سر.', true, false),
  ('بدن', 'schon', 'لوسیون بدن شون', 'schon-body-lotion', 'لوسیون مرطوب‌کننده بدن', 'لوسیون بدن برای پوست خشک، جذب سریع و بدون چربی اضافه.', false, false),
  ('عطر', 'body-care', 'اسپری بدن زنانه', 'body-mist-women', 'اسپری بدن سبک', 'رایحه ملایم روزانه با ماندگاری متوسط.', false, false),
  ('عطر', 'body-care', 'ادو تویلت مردانه', 'edt-men', 'عطر مردانه چوبی', 'رایحه چوبی-خنک برای استفاده روزانه.', false, true),
  ('بهداشت', 'schon', 'خمیر دندان روزانه', 'daily-toothpaste', 'خمیر دندان نعنایی', 'خمیر دندان برای بهداشت روزانه دهان و دندان.', false, false)
) AS p(cat_slug, brand_slug, name, slug, short_description, description, featured, bestseller)
JOIN public.categories c ON c.slug = p.cat_slug
JOIN public.brands b ON b.slug = p.brand_slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.products x WHERE x.slug = p.slug
);

INSERT INTO public.product_variants (
  product_id, sku, price, original_price, stock_quantity, is_active
)
SELECT pr.id, v.sku, v.price, v.original_price, v.stock, true
FROM (VALUES
  ('cinere-hydrating-cream', 'CIN-HYD-50', 285000, 320000, 24),
  ('hydroderm-vitamin-c-serum', 'HYD-VTC-30', 410000, NULL, 18),
  ('my-lipstick', 'MY-LIP-01', 165000, 189000, 40),
  ('lafarrerr-anti-hair-loss-shampoo', 'LAF-SHP-250', 198000, NULL, 30),
  ('schon-body-lotion', 'SCH-LOT-300', 142000, 159000, 22),
  ('body-mist-women', 'BDC-MST-W', 220000, NULL, 15),
  ('edt-men', 'BDC-EDT-M', 540000, 590000, 12),
  ('daily-toothpaste', 'SCH-PST-01', 68000, NULL, 50)
) AS v(slug, sku, price, original_price, stock)
JOIN public.products pr ON pr.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_variants pv WHERE pv.sku = v.sku
);

INSERT INTO public.product_attribute_values (product_id, attribute_id, option_id)
SELECT pr.id, a.id, o.id
FROM (VALUES
  ('cinere-hydrating-cream', 'skin-type', 'dry'),
  ('cinere-hydrating-cream', 'skin-concern', 'hydration'),
  ('cinere-hydrating-cream', 'gender', 'women'),
  ('hydroderm-vitamin-c-serum', 'skin-type', 'combination'),
  ('hydroderm-vitamin-c-serum', 'skin-concern', 'dark-spots'),
  ('hydroderm-vitamin-c-serum', 'gender', 'unisex'),
  ('my-lipstick', 'skin-type', 'normal'),
  ('my-lipstick', 'gender', 'women'),
  ('lafarrerr-anti-hair-loss-shampoo', 'skin-type', 'oily'),
  ('lafarrerr-anti-hair-loss-shampoo', 'gender', 'unisex'),
  ('schon-body-lotion', 'skin-type', 'dry'),
  ('schon-body-lotion', 'skin-concern', 'dryness'),
  ('schon-body-lotion', 'gender', 'women'),
  ('body-mist-women', 'gender', 'women'),
  ('edt-men', 'gender', 'men'),
  ('daily-toothpaste', 'gender', 'unisex')
) AS m(product_slug, attr_slug, opt_slug)
JOIN public.products pr ON pr.slug = m.product_slug
JOIN public.attributes a ON a.slug = m.attr_slug
JOIN public.attribute_options o ON o.attribute_id = a.id AND o.slug = m.opt_slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_attribute_values pav
  WHERE pav.product_id = pr.id AND pav.attribute_id = a.id
);

DO $$
BEGIN
  IF to_regclass('public.site_settings') IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.site_settings
  SET
    value = jsonb_set(
      COALESCE(value, '{}'::jsonb),
      '{name}',
      to_jsonb('بیوتی‌فیکیشن'::text),
      true
    ),
    updated_at = now()
  WHERE key = 'store';
END $$;

COMMIT;
