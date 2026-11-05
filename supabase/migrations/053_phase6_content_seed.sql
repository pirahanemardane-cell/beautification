-- Phase 6: ensure static-page setting keys exist (empty — no demo blog/FAQ copy).
-- Demo blog posts removed. Owner fills content via /admin/pages and /admin/blog.
-- To clear previously seeded blog/pages on live, run 063_clear_demo_content.sql.

INSERT INTO public.site_settings (key, value, updated_at) VALUES
('page_faq', '{"items":[]}'::jsonb, now()),
('page_terms', '{"title":"شرایط استفاده","paragraphs":[]}'::jsonb, now()),
('page_privacy', '{"title":"حریم خصوصی","paragraphs":[]}'::jsonb, now()),
('page_shipping', '{"title":"ارسال و تحویل","paragraphs":[]}'::jsonb, now()),
('page_returns', '{"title":"سیاست مرجوعی","paragraphs":[]}'::jsonb, now())
ON CONFLICT (key) DO NOTHING;

-- no demo blog_categories / blog_posts inserts
