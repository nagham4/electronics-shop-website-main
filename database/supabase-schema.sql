-- Initial schema for the electronics storefront.
--
-- Intended for a new Supabase PostgreSQL project after review. This is a
-- one-time schema script, not an idempotent migration. Do not run it against
-- an existing database without a reviewed migration plan.
--
-- All customer-facing reads and writes go through ASP.NET Core. Do not grant
-- anon/authenticated direct table access. The server connects with a dedicated
-- non-superuser PostgreSQL login that is a member of the NOLOGIN `store_api`
-- role. Provision that login and its password outside this file; never use a
-- frontend credential or expose a database/service-role secret to the browser.

BEGIN;

-- The application role receives explicit table grants and RLS policies below.
-- It has no login or password; provision a separate secret-bearing login role
-- and grant membership after this script has been reviewed and applied.
CREATE ROLE store_api
  NOLOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION
  NOBYPASSRLS;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  slug text NOT NULL UNIQUE CHECK (length(btrim(slug)) > 0),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX brands_name_lower_uq ON public.brands (lower(name));
CREATE INDEX categories_active_order_idx
  ON public.categories (is_active, sort_order);

CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (length(btrim(email)) > 3),
  display_name text NOT NULL CHECK (length(btrim(display_name)) > 0),
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE UNIQUE INDEX admin_users_email_lower_uq ON public.admin_users (lower(email));

-- Storage bucket `store-media` is configured separately in Supabase Storage.
-- Store public URLs for storefront rendering plus object metadata for cleanup.
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL DEFAULT 'store-media'
    CHECK (bucket_id = 'store-media'),
  object_path text NOT NULL CHECK (length(btrim(object_path)) > 0),
  public_url text NOT NULL CHECK (length(btrim(public_url)) > 0),
  content_type text NOT NULL CHECK (
    content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')
  ),
  byte_size integer NOT NULL CHECK (byte_size BETWEEN 1 AND 3145728),
  uploaded_by_admin_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket_id, object_path)
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (length(btrim(slug)) > 0),
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  model text,
  -- Catalog-level/base price is used for simple products and as the product
  -- card's display price for variant products. Variant prices remain the
  -- checkout source of truth when a variant is selected.
  price numeric(12, 2) NOT NULL CHECK (price > 0),
  discount_price numeric(12, 2),
  -- Required for simple products. NULL for a product managed through variants;
  -- the API maps the sum of variant stock to frontend Product.stock.
  stock integer CHECK (stock >= 0),
  description text NOT NULL DEFAULT '',
  warranty text,
  popularity integer NOT NULL DEFAULT 0 CHECK (popularity >= 0),
  -- True represents the demo-data convention where compatibleWith is absent
  -- and the accessory is universal. Keep false when compatibility rows exist.
  is_universal_compatible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (discount_price IS NULL OR
         (discount_price > 0 AND discount_price < price))
);

CREATE INDEX products_category_id_idx ON public.products (category_id);
CREATE INDEX products_brand_id_idx ON public.products (brand_id);
CREATE INDEX products_category_brand_idx ON public.products (category_id, brand_id);
CREATE INDEX products_created_at_idx ON public.products (created_at DESC);
CREATE INDEX products_price_idx ON public.products (price);
CREATE INDEX products_effective_price_idx
  ON public.products ((coalesce(discount_price, price)));
CREATE INDEX products_popularity_idx ON public.products (popularity DESC);
CREATE INDEX products_stock_idx ON public.products (stock);

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (length(btrim(label)) > 0),
  price numeric(12, 2) NOT NULL CHECK (price > 0),
  discount_price numeric(12, 2),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (discount_price IS NULL OR
         (discount_price > 0 AND discount_price < price)),
  UNIQUE (product_id, label),
  -- Supports a composite order-item FK that prevents a variant from being
  -- paired with a different product.
  UNIQUE (id, product_id)
);

CREATE INDEX product_variants_product_order_idx
  ON public.product_variants (product_id, sort_order);

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  media_asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, sort_order)
);

CREATE INDEX product_images_product_order_idx
  ON public.product_images (product_id, sort_order);

CREATE TABLE public.product_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (length(btrim(label)) > 0),
  value text NOT NULL CHECK (length(btrim(value)) > 0),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  UNIQUE (product_id, sort_order)
);

CREATE INDEX product_specifications_product_order_idx
  ON public.product_specifications (product_id, sort_order);

CREATE TABLE public.product_compatibility (
  accessory_product_id uuid NOT NULL
    REFERENCES public.products(id) ON DELETE CASCADE,
  device_product_id uuid NOT NULL
    REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (accessory_product_id, device_product_id),
  CHECK (accessory_product_id <> device_product_id)
);

CREATE INDEX product_compatibility_device_idx
  ON public.product_compatibility (device_product_id, accessory_product_id);

CREATE TABLE public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE CHECK (length(btrim(label)) > 0),
  fee numeric(12, 2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX shipping_zones_active_order_idx
  ON public.shipping_zones (is_active, sort_order);

CREATE TABLE public.store_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'المتجر'
    CHECK (length(btrim(store_name)) > 0),
  tagline text NOT NULL DEFAULT '',
  phone text,
  email text,
  address text,
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  whatsapp_phone text,
  whatsapp_message text NOT NULL DEFAULT '',
  banner_enabled boolean NOT NULL DEFAULT false,
  banner_text text NOT NULL DEFAULT '',
  show_out_of_stock boolean NOT NULL DEFAULT false,
  theme_color text NOT NULL DEFAULT 'oklch(0.45 0.11 205)',
  policy_shipping text NOT NULL DEFAULT '',
  policy_warranty text NOT NULL DEFAULT '',
  policy_returns text NOT NULL DEFAULT '',
  policy_privacy text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT whatsapp_enabled OR length(btrim(coalesce(whatsapp_phone, ''))) > 0)
);

-- A singleton settings row makes the public settings endpoint predictable.
-- Replace the generic name and fill real store values through the protected API.
INSERT INTO public.store_settings (id, store_name) VALUES (1, 'المتجر');

CREATE TABLE public.store_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL CHECK (length(btrim(label)) > 0),
  url text NOT NULL CHECK (length(btrim(url)) > 0),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0)
);

CREATE INDEX store_social_links_order_idx
  ON public.store_social_links (sort_order);

CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge text NOT NULL DEFAULT '',
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  body_text text NOT NULL DEFAULT '',
  cta_text text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  media_asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (link = '' OR link LIKE '/%' OR link LIKE 'https://%')
);

CREATE INDEX hero_slides_active_order_idx
  ON public.hero_slides (is_active, sort_order);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE CHECK (length(btrim(order_number)) > 0),
  customer_full_name text NOT NULL
    CHECK (length(btrim(customer_full_name)) BETWEEN 3 AND 100),
  customer_phone text NOT NULL CHECK (length(btrim(customer_phone)) > 0),
  customer_city text NOT NULL CHECK (length(btrim(customer_city)) BETWEEN 2 AND 60),
  customer_area text NOT NULL CHECK (length(btrim(customer_area)) BETWEEN 2 AND 60),
  customer_address text NOT NULL CHECK (length(btrim(customer_address)) BETWEEN 5 AND 250),
  customer_notes text NOT NULL DEFAULT '' CHECK (length(customer_notes) <= 500),
  shipping_zone_id uuid REFERENCES public.shipping_zones(id) ON DELETE SET NULL,
  shipping_zone_label_snapshot text NOT NULL
    CHECK (length(btrim(shipping_zone_label_snapshot)) > 0),
  shipping_fee numeric(12, 2) NOT NULL CHECK (shipping_fee >= 0),
  subtotal numeric(12, 2) NOT NULL CHECK (subtotal >= 0),
  total numeric(12, 2) NOT NULL CHECK (total >= 0 AND total = subtotal + shipping_fee),
  currency_code char(3) NOT NULL DEFAULT 'ILS' CHECK (currency_code = 'ILS'),
  payment_method text NOT NULL DEFAULT 'cash_on_delivery'
    CHECK (payment_method = 'cash_on_delivery'),
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled')),
  stock_restocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'Cancelled' OR stock_restocked_at IS NOT NULL)
);

CREATE INDEX orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX orders_status_created_idx ON public.orders (status, created_at DESC);
CREATE INDEX orders_customer_phone_idx ON public.orders (customer_phone);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid,
  variant_id uuid,
  product_name_snapshot text NOT NULL
    CHECK (length(btrim(product_name_snapshot)) > 0),
  variant_label_snapshot text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12, 2) NOT NULL CHECK (unit_price >= 0),
  line_total numeric(14, 2)
    GENERATED ALWAYS AS (unit_price * quantity) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL,
  FOREIGN KEY (variant_id, product_id)
    REFERENCES public.product_variants(id, product_id) ON DELETE SET NULL,
  CHECK (variant_id IS NULL OR product_id IS NOT NULL)
);

CREATE INDEX order_items_order_id_idx ON public.order_items (order_id);
CREATE INDEX order_items_product_id_idx ON public.order_items (product_id);

-- RLS is on for every application table. Only the private ASP.NET database
-- role is allowed by policy. The API must still authenticate JWTs and perform
-- authorization; RLS does not replace those checks. No policies or grants are
-- given to Supabase anon/authenticated roles, so browsers cannot query tables.
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.categories TO store_api
  USING (true) WITH CHECK (true);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.brands TO store_api
  USING (true) WITH CHECK (true);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.admin_users TO store_api
  USING (true) WITH CHECK (true);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.media_assets TO store_api
  USING (true) WITH CHECK (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.products TO store_api
  USING (true) WITH CHECK (true);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.product_variants TO store_api
  USING (true) WITH CHECK (true);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.product_images TO store_api
  USING (true) WITH CHECK (true);

ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specifications FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.product_specifications TO store_api
  USING (true) WITH CHECK (true);

ALTER TABLE public.product_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_compatibility FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.product_compatibility TO store_api
  USING (true) WITH CHECK (true);

ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.shipping_zones TO store_api
  USING (true) WITH CHECK (true);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.store_settings TO store_api
  USING (true) WITH CHECK (true);

ALTER TABLE public.store_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_social_links FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.store_social_links TO store_api
  USING (true) WITH CHECK (true);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.hero_slides TO store_api
  USING (true) WITH CHECK (true);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.orders TO store_api
  USING (true) WITH CHECK (true);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;
CREATE POLICY store_api_all ON public.order_items TO store_api
  USING (true) WITH CHECK (true);

REVOKE ALL ON public.categories, public.brands, public.admin_users,
  public.media_assets, public.products, public.product_variants,
  public.product_images, public.product_specifications,
  public.product_compatibility, public.shipping_zones, public.store_settings,
  public.store_social_links, public.hero_slides, public.orders,
  public.order_items FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO store_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.categories, public.brands, public.admin_users, public.media_assets,
  public.products, public.product_variants, public.product_images,
  public.product_specifications, public.product_compatibility,
  public.shipping_zones, public.store_settings, public.store_social_links,
  public.hero_slides, public.orders, public.order_items TO store_api;

COMMIT;
