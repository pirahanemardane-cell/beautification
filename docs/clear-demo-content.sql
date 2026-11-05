-- =====================================================
-- Owner-run: clear demo / seed / test storefront content
-- Same as supabase/migrations/063_clear_demo_content.sql
-- Idempotent. Keeps schema, RLS, shipping config, profiles.
-- Run in Supabase SQL Editor (Production).
-- =====================================================

BEGIN;

DO $$
DECLARE
  t text;
  targets text[] := ARRAY[
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
    'cart_items',
    'carts',
    'stock_reservations',
    'stock_alerts',
    'discount_uses',
    'discount_reservations',
    'discounts',
    'reviews',
    'wishlists',
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
    'blog_tag_map',
    'blog_posts',
    'blog_tags',
    'blog_categories',
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

INSERT INTO public.site_settings (key, value, updated_at) VALUES
  ('page_faq', '{"items":[]}'::jsonb, now()),
  ('page_terms', '{"title":"شرایط استفاده","paragraphs":[]}'::jsonb, now()),
  ('page_privacy', '{"title":"حریم خصوصی","paragraphs":[]}'::jsonb, now()),
  ('page_shipping', '{"title":"ارسال و تحویل","paragraphs":[]}'::jsonb, now()),
  ('page_returns', '{"title":"سیاست مرجوعی","paragraphs":[]}'::jsonb, now())
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = now();

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
      to_jsonb('جواهر شاد'::text),
      true
    ),
    updated_at = now()
  WHERE key = 'store'
    AND (
      value->>'name' IS NULL
      OR value->>'name' IN ('پیراهن مردانه', 'Pirahan Mardane', 'Demo Store')
    );

  DELETE FROM public.site_settings
  WHERE key IN ('flash_sale_ends_at', 'flash_sale');
END $$;

COMMIT;

-- Optional after large truncates:
-- NOTIFY pgrst, 'reload schema';
