-- =====================================================
-- 063 Clear demo / seed / test storefront content
-- Idempotent. Keeps schema, RLS, shipping config, profiles.
-- Safe to re-run in Supabase SQL Editor.
-- =====================================================
-- DOES NOT DROP TABLES. DOES NOT TOUCH auth.users / profiles.
-- Clears: catalog samples, blog, reviews, carts, orders & related,
-- discounts, contact/newsletter noise, analytics noise, demo settings pages.
-- =====================================================

BEGIN;

-- Truncate only tables that exist (live DBs may lag migrations).
DO $$
DECLARE
  t text;
  targets text[] := ARRAY[
    -- order / commerce dependents first (explicit; CASCADE also covers FKs)
    'return_items',
    'return_requests',
    'shipment_events',
    'payment_attempts',
    'order_notes',
    'order_status_history',
    'financial_audit_logs',
    'payment_webhook_events',
    'order_items',
    'orders',
    -- cart / stock / alerts
    'cart_items',
    'carts',
    'stock_reservations',
    'stock_alerts',
    'discount_uses',
    'discount_reservations',
    'discounts',
    -- reviews / wishlist / compare-ish
    'reviews',
    'wishlists',
    -- catalog
    'product_attribute_values',
    'product_tag_map',
    'product_price_history',
    'product_images',
    'product_variants',
    'products',
    'product_tags',
    'size_guide_rows',
    'size_guides',
    'attribute_options',
    'attributes',
    'brands',
    'categories',
    'colors',
    'sizes',
    -- blog
    'blog_tag_map',
    'blog_posts',
    'blog_tags',
    'blog_categories',
    -- inbox / noise
    'contact_messages',
    'newsletter_subscribers',
    'sms_outbox',
    'notifications',
    'job_queue',
    'otp_challenges',
    'search_queries',
    'analytics_events',
    'url_redirects',
    'support_ticket_messages',
    'support_tickets',
    'audit_logs',
    'admin_logs',
    'content_pages'
  ];
BEGIN
  FOREACH t IN ARRAY targets LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', t);
    END IF;
  END LOOP;
END $$;

-- Reset seeded static page blobs to empty structures (admin can refill).
-- Codefallbacks in src/lib/content/static-pages.ts still render if keys are missing.
INSERT INTO public.site_settings (key, value, updated_at) VALUES
  ('page_faq', '{"items":[]}'::jsonb, now()),
  ('page_terms', '{"title":"شرایط استفاده","paragraphs":[]}'::jsonb, now()),
  ('page_privacy', '{"title":"حریم خصوصی","paragraphs":[]}'::jsonb, now()),
  ('page_shipping', '{"title":"ارسال و تحویل","paragraphs":[]}'::jsonb, now()),
  ('page_returns', '{"title":"سیاست مرجوعی","paragraphs":[]}'::jsonb, now())
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = now();

-- Fix legacy store display names if present; keep other store fields.
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
      to_jsonb('اکسسوری شاد'::text),
      true
    ),
    updated_at = now()
  WHERE key = 'store'
    AND (
      value->>'name' IS NULL
      OR value->>'name' IN ('Demo Store', 'جواهر شاد')
    );

  -- Clear flash-sale demo end time if set
  DELETE FROM public.site_settings
  WHERE key IN ('flash_sale_ends_at', 'flash_sale');
END $$;

COMMIT;

-- Optional: refresh PostgREST schema cache after large truncates
-- NOTIFY pgrst, 'reload schema';
