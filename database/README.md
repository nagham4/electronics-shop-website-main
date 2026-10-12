# Supabase PostgreSQL design

`supabase-schema.sql` is a proposed one-time initial schema for a new Supabase
PostgreSQL database. It is a design artifact only; it has not been applied or
validated against a live database. Do not run it against an existing database
as a migration.

## Frontend data covered

- **Catalog:** category `id`, Arabic display `name`, unique `slug`, ordering,
  and active state; brand `id` and `name`.
- **Products:** UUID `id`, `slug`, `name`, `brandId`, `categoryId`, optional
  `model`, list `price`, optional `discountPrice`, `stock`, image gallery,
  `description`, ordered `{label, value}` specifications, optional `warranty`,
  variants with their own IDs, labels, prices, discounts and stock, popularity,
  and creation time. Accessory compatibility references device slugs in demo
  data; the relational schema replaces those with product UUID relationships
  and an explicit universal-compatibility flag.
- **Storefront queries:** category/brand filters, search across name, brand,
  model and specification values, minimum/maximum price, and newest/price/
  popularity sorting. Pagination itself is an API contract, not a table.
- **Cart and checkout:** the cart is browser `localStorage`; no customer account
  or server cart table is indicated. Checkout sends customer full name, phone,
  city, area, address, optional notes, shipping zone, product/variant IDs,
  quantities and cash-on-delivery method. It does not need stored browser cart
  rows.
- **Orders/admin:** order number, customer and delivery snapshot, item name and
  variant label snapshots, unit prices, quantities, shipping fee, total,
  creation time and internal statuses `Pending`, `Confirmed`, `Processing`,
  `Completed`, `Cancelled`. No customer account or customer order-tracking page
  is modeled.
- **Admin-managed content:** product images/gallery, variants and specs;
  category ordering/active state; brands; homepage slide badge/title/body/button
  text/link/image/active/order; store name/tagline/contact/address, WhatsApp
  button settings, banner, out-of-stock visibility, theme, four policy texts,
  shipping zones/fees and social links.

The persistent WhatsApp contact control uses store settings; it does not need a
separate WhatsApp integration table. Hero slides need their own table because
the existing admin interface edits them. Store settings are modeled as a
single-row record; shipping zones and social links are child tables so each has
a stable identity and ordering.

### Source inspected

- `src/lib/api/types.ts` — frontend DTO shapes for categories, brands, products,
  variants, settings, search query, checkout request and order response.
- `src/lib/api/demo-data.ts` — actual demo categories, brands, products,
  variants, compatibility, settings and sample image imports.
- `src/lib/api/catalog.ts` — filters, sorting, availability, related products,
  compatible accessories and current sample pagination behavior.
- `src/lib/api/admin.ts` and `src/lib/api/slides.ts` — admin persistence calls,
  order shape, slide shape and current image data-URL behavior.
- `src/lib/cart.tsx`, `src/routes/checkout.tsx`,
  `src/routes/products.$slug.tsx`, and `src/routes/index.tsx` — cart, product,
  checkout and catalog fields consumed by the UI.
- `src/routes/admin.products.tsx`, `src/routes/admin.categories.tsx`,
  `src/routes/admin.orders.tsx`, `src/routes/admin.settings.tsx`, and
  `src/routes/admin.slides.tsx` — editable/admin-displayed fields.

## Relationships and key design choices

- Products reference categories and brands by UUID. Deleting referenced
  categories/brands is restricted; deactivate categories instead.
- A product has zero or more variants, images and specifications. Product image
  and slide rows reference `media_assets`, which records the Storage bucket,
  object path, public URL, content type and byte size.
- `product_compatibility` relates an accessory product to each compatible
  device. `products.is_universal_compatible` represents the demo convention
  where compatibility is unspecified/universal.
- A guest order has many order items and an optional shipping-zone FK. Order
  items keep product and variant labels, quantity, and unit price as snapshots;
  deleting a catalog item therefore does not erase its order history.
- Prices use `numeric(12,2)` and currency is constrained to ILS, matching the
  current shekel storefront. `total = subtotal + shipping_fee` is checked in
  the database. The API must also verify that the subtotal equals the sum of
  its line totals in one transaction.
- For a simple product, `products.stock` is the available inventory. For a
  variant product, `products.stock` is NULL and each variant's stock is
  authoritative; the API maps the sum of variant stock into the frontend's
  required numeric `Product.stock`. `ProductCard` and the unselected product
  detail display product-level `price`/`discountPrice`; preserve those fields
  as the product's default/list display pair. Once selected, the detail page
  switches to the selected variant's exact price pair and stock. A variant
  order uses that variant's trusted database price at checkout. The API must
  validate that simple and variant inventory modes are not mixed.
- The SQL creates a private `store_api` NOLOGIN role, grants it access through
  RLS policies, and grants no table access to Supabase `anon` or `authenticated`
  roles. Provision a separate server-only login role and its secret through a
  secure administrative process, then make that login a member of `store_api`.
  Do not put a PostgreSQL password or Supabase service-role key in `VITE_*`
  variables. Store SQL credentials only in ASP.NET server-side secret
  configuration. Storage bucket policy/configuration is separate from this
  PostgreSQL schema.

## Security and transactional requirements

- The browser calls ASP.NET Core only. ASP.NET authenticates JWTs and applies
  admin roles/policies before performing admin operations. RLS is defense in
  depth; the `store_api` policy grants the trusted backend role table access,
  so the API must not expose its database credentials or trust frontend
  authorization state.
- Public catalog reads, checkout order creation, admin edits, login, password
  verification, image upload and order status changes are server endpoints.
  Do not expose direct Supabase table access to storefront JavaScript.
- Store admin password hashes only. Generate hashes with the selected
  ASP.NET Core Identity password hasher; provision the initial admin through
  an out-of-band, server-side setup command. There is no public registration
  flow. JWT signing secrets and database credentials are separate secrets.
- On checkout, require `shipping_zone_id` as the zone UUID. Validate every UUID,
  positive bounded quantity, product/variant relationship, active shipping
  zone, current prices/discounts, stock and delivery fee on the server. Ignore
  any browser-supplied price or total.
- Create the order and decrement inventory in one PostgreSQL transaction.
  Lock all affected product/variant rows in stable ID order (`FOR UPDATE`),
  consolidate duplicate lines, verify the requested quantity against locked
  stock, then decrement and insert snapshots before commit. A conditional
  `UPDATE ... WHERE stock >= requested` with a checked affected-row count is an
  alternative. On any failure, roll back the entire order.
- Allowed internal statuses are `Pending`, `Confirmed`, `Processing`,
  `Completed`, and `Cancelled`. Only `Pending` or `Confirmed` orders may be
  cancelled; cancellation is rejected after processing begins. Deduct stock
  exactly once at order creation in the same transaction as order insertion.
  When an eligible order is cancelled, lock the order and inventory rows, and
  restore each item only if `stock_restocked_at IS NULL`; update the marker and
  status in that same transaction. Reject repeat cancellation/restoration.
  Never restore completed orders. The SQL requires the marker for `Cancelled`
  orders. If cancellation is permitted from `Processing`, this rule and
  operational fulfillment handling must be revised before implementation.
- Validate uploaded image bytes, decoded file type, size, and admin authority
  before writing to Supabase Storage. The SQL's 3 MiB metadata limit mirrors
  the current frontend upload limit, but server validation is authoritative.
  A public-read bucket is appropriate for storefront image URLs; only the
  backend should be able to upload, replace or delete objects.

RLS is enabled and forced on every application table. Policies are limited to
the private backend role. Keep `anon` and `authenticated` without table grants
or policies. The server's database login must be non-superuser and must not
have `BYPASSRLS`; Supabase superuser/service-role credentials would bypass the
intended policy layer and are not appropriate for browser use.

## Approved implementation decisions

- Checkout uses UUID `shipping_zone_id`; a later frontend adapter must submit
  the stable identifier.
- Variant price and stock live on variants. Keep the product-level display
  price as the card and unselected detail default; selecting a variant shows
  its price. Aggregate variant stock for product-level availability. Checkout
  trusts only current database price/stock.
- Use the five statuses above. The backend deducts once during order creation;
  cancellation from Pending or Confirmed restores once transactionally. The
  customer has no order tracking page.
- Generate a unique category slug in the backend from the Arabic category name;
  resolve collisions server-side.
- Use the `admin_users` table, not full ASP.NET Core Identity storage. A later
  authentication stage must use a vetted password hasher, signed tokens,
  authorization policies, and protected admin endpoints.
- Product and homepage slide images may be public-read. All upload, replacement,
  and deletion operations require authorized admin access.
- API pagination is standard page-based with `page`, `pageSize`, and total
  count. Existing “load more” UX must append successive pages in the later
  frontend integration stage.

No sample catalog seed script is included. Demo product IDs are non-UUID
strings and image values import local files; production seed records should be
created only after IDs are mapped and assets are uploaded to the chosen Storage
bucket.
