-- =====================================================
-- Accessory feature gaps (idempotent)
-- image roles, hypoallergenic, review photos, complements,
-- gift checkout fields, price alerts, jewelry attr seed
-- =====================================================

BEGIN;

-- 1) Product image roles (neutral / lifestyle / angle / model / gallery)
ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS image_role text NOT NULL DEFAULT 'gallery';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'product_images_image_role_check'
  ) THEN
    ALTER TABLE public.product_images
      ADD CONSTRAINT product_images_image_role_check
      CHECK (image_role IN ('gallery', 'neutral', 'lifestyle', 'angle', 'model'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_product_images_role
  ON public.product_images (product_id, image_role);

-- 2) Hypoallergenic flag on products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_hypoallergenic boolean NOT NULL DEFAULT false;

-- 3) Review photos
CREATE TABLE IF NOT EXISTS public.review_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_images_review
  ON public.review_images (review_id);

ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS review_images_public_select ON public.review_images;
CREATE POLICY review_images_public_select ON public.review_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id AND r.is_approved = true
    )
  );

DROP POLICY IF EXISTS review_images_insert_own ON public.review_images;
CREATE POLICY review_images_insert_own ON public.review_images
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id AND r.user_id = auth.uid()
    )
  );

-- 4) Suggested sets / buy-with complements
CREATE TABLE IF NOT EXISTS public.product_complements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  complement_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'buy_with'
    CHECK (kind IN ('buy_with', 'set')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_complements_no_self CHECK (product_id <> complement_product_id),
  CONSTRAINT product_complements_unique UNIQUE (product_id, complement_product_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_product_complements_product
  ON public.product_complements (product_id, kind, sort_order);

ALTER TABLE public.product_complements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_complements_public_select ON public.product_complements;
CREATE POLICY product_complements_public_select ON public.product_complements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS product_complements_admin_all ON public.product_complements;
CREATE POLICY product_complements_admin_all ON public.product_complements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin', 'staff')
    )
  );

-- 5) Gift options + scheduled delivery on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS gift_packaging boolean NOT NULL DEFAULT false;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS gift_message text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS scheduled_delivery_date date;

-- 6) Stock alerts email column
ALTER TABLE public.stock_alerts
  ADD COLUMN IF NOT EXISTS email text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_alerts_email_variant_pending
  ON public.stock_alerts (email, variant_id)
  WHERE status = 'pending' AND email IS NOT NULL;

-- 7) Price / discount alerts
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  email text,
  phone text,
  target_price numeric,
  alert_type text NOT NULL DEFAULT 'price_drop'
    CHECK (alert_type IN ('price_drop', 'discount')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'notified', 'cancelled')),
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_product_pending
  ON public.price_alerts (product_id)
  WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS uq_price_alerts_user_product_pending
  ON public.price_alerts (user_id, product_id, alert_type)
  WHERE status = 'pending' AND user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_price_alerts_email_product_pending
  ON public.price_alerts (email, product_id, alert_type)
  WHERE status = 'pending' AND email IS NOT NULL;

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS price_alerts_select_own ON public.price_alerts;
CREATE POLICY price_alerts_select_own ON public.price_alerts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS price_alerts_insert_own ON public.price_alerts;
CREATE POLICY price_alerts_insert_own ON public.price_alerts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS price_alerts_update_own ON public.price_alerts;
CREATE POLICY price_alerts_update_own ON public.price_alerts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- 8) Seed jewelry filter attributes (no products invented)
INSERT INTO public.attributes (name, slug, type, is_filterable, sort_order)
SELECT v.name, v.slug, 'select', true, v.sort_order
FROM (VALUES
  ('جنس / متریال', 'material', 10),
  ('فلز', 'metal', 20),
  ('آبکاری', 'plating', 30),
  ('عیار', 'karat', 40),
  ('سنگ', 'stone', 50),
  ('سبک', 'style', 60),
  ('ضد حساسیت', 'hypoallergenic', 70)
) AS v(name, slug, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.attributes a WHERE a.slug = v.slug
);

-- Options for material / metal / plating / hypoallergenic
INSERT INTO public.attribute_options (attribute_id, value, slug, sort_order, hex)
SELECT a.id, o.value, o.slug, o.sort_order, o.hex
FROM public.attributes a
JOIN (VALUES
  ('material', 'طلا', 'gold', 10, NULL::text),
  ('material', 'نقره', 'silver', 20, NULL),
  ('material', 'استیل', 'steel', 30, NULL),
  ('material', 'رزگلد', 'rosegold', 40, NULL),
  ('material', 'پلاتین', 'platinum', 50, NULL),
  ('metal', 'طلا', 'gold', 10, '#D4AF37'),
  ('metal', 'نقره', 'silver', 20, '#C0C0C0'),
  ('metal', 'استیل', 'steel', 30, '#8A8A8A'),
  ('metal', 'رزگلد', 'rosegold', 40, '#B76E79'),
  ('metal', 'پلاتین', 'platinum', 50, '#E5E4E2'),
  ('plating', 'بدون آبکاری', 'none', 10, NULL),
  ('plating', 'طلایی', 'gold-plated', 20, '#D4AF37'),
  ('plating', 'رزگلد', 'rose-gold-plated', 30, '#B76E79'),
  ('plating', 'رودیوم', 'rhodium', 40, NULL),
  ('hypoallergenic', 'بله', 'yes', 10, NULL),
  ('hypoallergenic', 'خیر', 'no', 20, NULL),
  ('karat', '۱۸ عیار', '18k', 10, NULL),
  ('karat', '۱۴ عیار', '14k', 20, NULL),
  ('karat', '۹۲۵', '925', 30, NULL)
) AS o(attr_slug, value, slug, sort_order, hex)
  ON a.slug = o.attr_slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.attribute_options ao
  WHERE ao.attribute_id = a.id AND ao.slug = o.slug
);

-- Ensure hypoallergenic is in facet allowlist path (attr already filterable)
UPDATE public.attributes
SET is_filterable = true
WHERE slug IN ('material', 'metal', 'plating', 'karat', 'stone', 'style', 'hypoallergenic');

COMMIT;
