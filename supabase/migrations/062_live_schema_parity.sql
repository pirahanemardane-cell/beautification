-- 062 Live schema parity
-- Brings production DB in line with what the running app expects.
-- Idempotent: safe to re-run in Supabase SQL Editor.
-- Apply ASAP: without this, guest checkout, OTP, addresses, notifications,
-- support/returns, payment verify webhooks, stock RPCs, blog, analytics break.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── products / brands / attributes SEO & extras ───────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS robots_index boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS robots_follow boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS focus_keyphrases text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS robots_index boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS robots_follow boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS focus_keyphrases text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.attribute_options
  ADD COLUMN IF NOT EXISTS hex text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- ─── orders: columns the app inserts/selects ───────────────────────────────
ALTER TABLE public.orders
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS discount_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,0) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_fee numeric(12,0) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_method_id uuid,
  ADD COLUMN IF NOT EXISTS shipping_method_title text,
  ADD COLUMN IF NOT EXISTS shipping_email text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_payment_status_chk
    CHECK (payment_status IN ('pending','paid','cod','failed','refunded','cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── discounts extras ──────────────────────────────────────────────────────
ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS min_order_amount numeric(12,0),
  ADD COLUMN IF NOT EXISTS once_per_user boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_discount_amount numeric(12,0),
  ADD COLUMN IF NOT EXISTS product_ids uuid[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS category_ids uuid[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_automatic boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text;

CREATE TABLE IF NOT EXISTS public.discount_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id uuid NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS discount_uses_discount_idx ON public.discount_uses(discount_id);
CREATE INDEX IF NOT EXISTS discount_uses_user_idx ON public.discount_uses(user_id);

CREATE TABLE IF NOT EXISTS public.discount_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id uuid NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── customer addresses ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  full_name text NOT NULL,
  phone text NOT NULL,
  province text,
  city text NOT NULL,
  address_line text NOT NULL,
  postal_code text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS addresses_user_idx ON public.addresses(user_id);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS addresses_own_all ON public.addresses;
CREATE POLICY addresses_own_all ON public.addresses
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── notifications ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text,
  link text,
  read_at timestamptz,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_own_select ON public.notifications;
CREATE POLICY notifications_own_select ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS notifications_own_update ON public.notifications;
CREATE POLICY notifications_own_update ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ─── OTP login ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.otp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_challenges_phone_idx ON public.otp_challenges(phone, created_at DESC);
ALTER TABLE public.otp_challenges
  ADD COLUMN IF NOT EXISTS consumed_at timestamptz;
ALTER TABLE public.otp_challenges ENABLE ROW LEVEL SECURITY;
-- service role only (no public policies)

-- ─── support / returns ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  priority text,
  category text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  is_staff boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES public.return_requests(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  quantity int NOT NULL DEFAULT 1,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_tickets_own ON public.support_tickets;
CREATE POLICY support_tickets_own ON public.support_tickets
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS support_msgs_own ON public.support_ticket_messages;
CREATE POLICY support_msgs_own ON public.support_ticket_messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));
DROP POLICY IF EXISTS return_requests_own ON public.return_requests;
CREATE POLICY return_requests_own ON public.return_requests
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── blog ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  body text,
  cover_url text,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  meta_title text,
  meta_description text,
  og_title text,
  og_description text,
  og_image_url text,
  robots_index boolean NOT NULL DEFAULT true,
  robots_follow boolean NOT NULL DEFAULT true,
  canonical_url text,
  focus_keyphrases text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.blog_tag_map (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS robots_index boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS robots_follow boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS focus_keyphrases text[] NOT NULL DEFAULT '{}';

-- ─── legacy colors/sizes (optional facets fallback) ────────────────────────
CREATE TABLE IF NOT EXISTS public.colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  hex_code text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── ops / SEO / analytics / queue / redirects / payments ─────────────────
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text,
  entity_id text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text,
  entity_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.financial_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  amount numeric(14,0),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.order_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.seo_page_settings (
  page_key text PRIMARY KEY,
  title text,
  meta_title text,
  meta_description text,
  focus_keyphrases text[] NOT NULL DEFAULT '{}',
  og_title text,
  og_description text,
  og_image_url text,
  robots_index boolean NOT NULL DEFAULT true,
  robots_follow boolean NOT NULL DEFAULT true,
  canonical_url text,
  body_preview text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.url_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path text NOT NULL UNIQUE,
  to_path text NOT NULL,
  status_code int NOT NULL DEFAULT 301,
  is_active boolean NOT NULL DEFAULT true,
  note text,
  source text NOT NULL DEFAULT 'manual',
  hit_count bigint NOT NULL DEFAULT 0,
  last_hit_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.url_redirects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read active redirects" ON public.url_redirects;
CREATE POLICY "public read active redirects" ON public.url_redirects
  FOR SELECT USING (is_active = true);

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'zarinpal',
  event_key text NOT NULL,
  authority text,
  ref_id text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  amount numeric,
  status text NOT NULL DEFAULT 'received',
  payload jsonb,
  verified boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_webhook_events_event_key_unique UNIQUE (provider, event_key)
);
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.job_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 5,
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  result_count int,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_label text,
  user_agent text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  session_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id uuid,
  variant_id uuid,
  order_id uuid,
  quantity integer,
  value numeric(14,0),
  currency text NOT NULL DEFAULT 'IRR',
  search_term text,
  result_count integer,
  path text,
  device text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_events_name_created_idx
  ON public.analytics_events (event_name, created_at DESC);

CREATE TABLE IF NOT EXISTS public.product_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  price numeric(12,0) NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_price_history_product_idx
  ON public.product_price_history (product_id, recorded_at);

-- stock reservations (if missing) + guest session support
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'consumed', 'released', 'expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_reservations
  ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.stock_reservations
  ADD COLUMN IF NOT EXISTS session_id text;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Lightweight admin product performance view (analytics-backed)
CREATE OR REPLACE VIEW public.admin_product_performance AS
SELECT
  p.id,
  p.name,
  p.slug,
  COALESCE(v.views, 0)::bigint AS views,
  COALESCE(c.carts, 0)::bigint AS add_to_carts,
  COALESCE(u.purchases, 0)::bigint AS purchases,
  CASE
    WHEN COALESCE(v.views, 0) = 0 THEN 0
    ELSE round((COALESCE(u.purchases, 0)::numeric / v.views::numeric) * 100, 2)
  END AS conversion_rate
FROM public.products p
LEFT JOIN (
  SELECT product_id, count(*) AS views
  FROM public.analytics_events
  WHERE event_name = 'view_item' AND product_id IS NOT NULL
  GROUP BY product_id
) v ON v.product_id = p.id
LEFT JOIN (
  SELECT product_id, count(*) AS carts
  FROM public.analytics_events
  WHERE event_name = 'add_to_cart' AND product_id IS NOT NULL
  GROUP BY product_id
) c ON c.product_id = p.id
LEFT JOIN (
  SELECT product_id, count(*) AS purchases
  FROM public.analytics_events
  WHERE event_name = 'purchase' AND product_id IS NOT NULL
  GROUP BY product_id
) u ON u.product_id = p.id
WHERE p.deleted_at IS NULL;

-- ─── Stock / discount RPCs (service_role) ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(p_variant_id uuid, p_qty int)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF p_qty IS NULL OR p_qty < 1 THEN RETURN false; END IF;
  UPDATE product_variants
  SET stock_quantity = stock_quantity - p_qty
  WHERE id = p_variant_id AND is_active = true AND stock_quantity >= p_qty;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_variant_stock(p_variant_id uuid, p_qty int)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_qty IS NULL OR p_qty < 1 THEN RETURN; END IF;
  UPDATE product_variants
  SET stock_quantity = stock_quantity + p_qty
  WHERE id = p_variant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_expired_stock_reservations()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; n int := 0;
BEGIN
  FOR r IN
    SELECT id, variant_id, quantity FROM stock_reservations
    WHERE status = 'active' AND expires_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE stock_reservations SET status = 'expired', updated_at = now()
    WHERE id = r.id AND status = 'active';
    IF FOUND THEN
      PERFORM increment_variant_stock(r.variant_id, r.quantity);
      n := n + 1;
    END IF;
  END LOOP;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_user_variant_reservation(p_user_id uuid, p_variant_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id, quantity FROM stock_reservations
    WHERE user_id = p_user_id AND variant_id = p_variant_id AND status = 'active'
    FOR UPDATE
  LOOP
    UPDATE stock_reservations SET status = 'released', updated_at = now()
    WHERE id = r.id AND status = 'active';
    IF FOUND THEN PERFORM increment_variant_stock(p_variant_id, r.quantity); END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_variant_stock(
  p_user_id uuid, p_variant_id uuid, p_qty int, p_minutes int DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ok boolean; ttl int;
BEGIN
  IF p_user_id IS NULL OR p_variant_id IS NULL OR p_qty IS NULL OR p_qty < 1 THEN RETURN false; END IF;
  ttl := GREATEST(1, LEAST(COALESCE(p_minutes, 15), 60));
  PERFORM release_expired_stock_reservations();
  PERFORM release_user_variant_reservation(p_user_id, p_variant_id);
  ok := decrement_variant_stock(p_variant_id, p_qty);
  IF NOT ok THEN RETURN false; END IF;
  INSERT INTO stock_reservations (user_id, variant_id, quantity, status, expires_at)
  VALUES (p_user_id, p_variant_id, p_qty, 'active', now() + make_interval(mins => ttl));
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_all_user_reservations(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; n int := 0;
BEGIN
  FOR r IN
    SELECT id, variant_id, quantity FROM stock_reservations
    WHERE user_id = p_user_id AND status = 'active' FOR UPDATE
  LOOP
    UPDATE stock_reservations SET status = 'released', updated_at = now()
    WHERE id = r.id AND status = 'active';
    IF FOUND THEN
      PERFORM increment_variant_stock(r.variant_id, r.quantity);
      n := n + 1;
    END IF;
  END LOOP;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_user_reservations(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  UPDATE stock_reservations SET status = 'consumed', updated_at = now()
  WHERE user_id = p_user_id AND status = 'active';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.extend_user_reservations(p_user_id uuid, p_minutes int DEFAULT 15)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ttl int; n int;
BEGIN
  ttl := GREATEST(1, LEAST(COALESCE(p_minutes, 15), 60));
  UPDATE stock_reservations
  SET expires_at = now() + make_interval(mins => ttl), updated_at = now()
  WHERE user_id = p_user_id AND status = 'active' AND expires_at > now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_session_variant_reservation(p_session_id text, p_variant_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id, quantity FROM stock_reservations
    WHERE session_id = p_session_id AND variant_id = p_variant_id AND status = 'active'
    FOR UPDATE
  LOOP
    UPDATE stock_reservations SET status = 'released', updated_at = now()
    WHERE id = r.id AND status = 'active';
    IF FOUND THEN PERFORM increment_variant_stock(p_variant_id, r.quantity); END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_variant_stock_session(
  p_session_id text, p_variant_id uuid, p_qty int, p_minutes int DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ok boolean; ttl int; sid text;
BEGIN
  sid := nullif(trim(p_session_id), '');
  IF sid IS NULL OR p_variant_id IS NULL OR p_qty IS NULL OR p_qty < 1 THEN RETURN false; END IF;
  ttl := GREATEST(1, LEAST(COALESCE(p_minutes, 15), 60));
  PERFORM release_expired_stock_reservations();
  PERFORM release_session_variant_reservation(sid, p_variant_id);
  ok := decrement_variant_stock(p_variant_id, p_qty);
  IF NOT ok THEN RETURN false; END IF;
  INSERT INTO stock_reservations (user_id, session_id, variant_id, quantity, status, expires_at)
  VALUES (NULL, sid, p_variant_id, p_qty, 'active', now() + make_interval(mins => ttl));
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_all_session_reservations(p_session_id text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; n int := 0;
BEGIN
  FOR r IN
    SELECT id, variant_id, quantity FROM stock_reservations
    WHERE session_id = p_session_id AND status = 'active' FOR UPDATE
  LOOP
    UPDATE stock_reservations SET status = 'released', updated_at = now()
    WHERE id = r.id AND status = 'active';
    IF FOUND THEN
      PERFORM increment_variant_stock(r.variant_id, r.quantity);
      n := n + 1;
    END IF;
  END LOOP;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_session_reservations(p_session_id text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  UPDATE stock_reservations SET status = 'consumed', updated_at = now()
  WHERE session_id = p_session_id AND status = 'active';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.extend_session_reservations(p_session_id text, p_minutes int DEFAULT 15)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ttl int; n int;
BEGIN
  ttl := GREATEST(1, LEAST(COALESCE(p_minutes, 15), 60));
  UPDATE stock_reservations
  SET expires_at = now() + make_interval(mins => ttl), updated_at = now()
  WHERE session_id = p_session_id AND status = 'active' AND expires_at > now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_discount_use(p_code text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_updated integer;
BEGIN
  UPDATE discounts
  SET used_count = COALESCE(used_count, 0) + 1
  WHERE upper(code) = upper(trim(p_code))
    AND is_active = true
    AND (max_uses IS NULL OR COALESCE(used_count, 0) < max_uses)
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now());
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_product_review_stats(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer; v_avg numeric(2,1);
BEGIN
  SELECT count(*)::integer, coalesce(round(avg(rating)::numeric, 1), 0)
  INTO v_count, v_avg
  FROM reviews WHERE product_id = p_product_id AND is_approved = true;
  UPDATE products
  SET review_count = v_count, average_rating = v_avg, updated_at = now()
  WHERE id = p_product_id;
END;
$$;

-- Grants (service role)
REVOKE ALL ON FUNCTION public.decrement_variant_stock(uuid, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_variant_stock(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_variant_stock(uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_variant_stock(uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_expired_stock_reservations() TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_variant_stock(uuid, uuid, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_user_variant_reservation(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_all_user_reservations(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_user_reservations(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.extend_user_reservations(uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_variant_stock_session(text, uuid, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_session_variant_reservation(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_all_session_reservations(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_session_reservations(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.extend_session_reservations(text, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_discount_use(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_discount_use(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_product_review_stats(uuid) TO service_role;

-- ─── Extra RLS for customer profile + public discounts ─────────────────────
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS discounts_public_active_select ON public.discounts;
CREATE POLICY discounts_public_active_select ON public.discounts
  FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

-- ─── Remaining live column gaps (admin SEO / reviews / catalog) ────────────
-- Probed missing on production 2026-11-04; keep IF NOT EXISTS for idempotency.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS twitter_title text,
  ADD COLUMN IF NOT EXISTS twitter_description text,
  ADD COLUMN IF NOT EXISTS is_cornerstone boolean NOT NULL DEFAULT false;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS robots_index boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS robots_follow boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS focus_keyphrases text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS short_description text;

-- Keep logo_url and image_url in sync when one is null (best-effort)
DO $$ BEGIN
  UPDATE public.brands SET image_url = logo_url WHERE image_url IS NULL AND logo_url IS NOT NULL;
  UPDATE public.brands SET logo_url = image_url WHERE logo_url IS NULL AND image_url IS NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

ALTER TABLE public.product_tags
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS focus_keyphrases text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS robots_index boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS robots_follow boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS canonical_url text;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS admin_reply text;

ALTER TABLE public.stock_alerts
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Align is_active with status for rows that already exist
DO $$ BEGIN
  UPDATE public.stock_alerts
  SET is_active = (status IS DISTINCT FROM 'cancelled')
  WHERE true;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- Ensure site_settings / contact / newsletter exist (already live on prod; safe IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read site_settings" ON public.site_settings;
CREATE POLICY "public read site_settings"
  ON public.site_settings FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  company text,
  email text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  admin_note text
);

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  source text DEFAULT 'home',
  ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  CONSTRAINT newsletter_subscribers_phone_unique UNIQUE (phone)
);

CREATE TABLE IF NOT EXISTS public.sms_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
