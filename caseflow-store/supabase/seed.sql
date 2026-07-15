-- CaseFlow Store seed data.
-- Source: src/data/mock/catalog.ts
-- This file is idempotent and keeps Supabase catalog rows aligned with the mock catalog.

begin;

insert into public.categories (
  id,
  slug,
  name,
  description,
  sort_order,
  is_active,
  created_at,
  updated_at
)
values
  ('20000000-0000-4000-8000-000000000001'::uuid, 'phone-cases', 'Phone cases', 'Protective cases for current iPhone, Galaxy, and Pixel models.', 10, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('20000000-0000-4000-8000-000000000002'::uuid, 'screen-protectors', 'Screen protectors', 'Tempered glass and matte protectors matched to phone models.', 20, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('20000000-0000-4000-8000-000000000003'::uuid, 'chargers', 'Chargers', 'Wall, wireless, and compact fast chargers for everyday use.', 30, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('20000000-0000-4000-8000-000000000004'::uuid, 'cables-adapters', 'Cables and adapters', 'Charging cables and small adapters for common mobile setups.', 40, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('20000000-0000-4000-8000-000000000005'::uuid, 'stands-mounts', 'Stands and mounts', 'Desk stands and mounts for hands-free viewing and charging.', 50, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz)
on conflict (slug) do update
set
  id = excluded.id,
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = excluded.updated_at;

insert into public.products (
  id,
  category_id,
  name,
  slug,
  description,
  price,
  stock,
  image_url,
  compatibility,
  is_featured,
  is_active,
  created_at,
  updated_at
)
values
  ('10000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 'AeroGuard MagSafe Case', 'aeroguard-magsafe-case', 'Slim MagSafe-compatible case with raised camera edges and a soft-touch grip.', 329000, 18, '/images/products/aeroguard-magsafe-case.jpg', array['iPhone 15', 'iPhone 16']::text[], true, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 'ClearShield Slim Case', 'clearshield-slim-case', 'Transparent everyday case with anti-yellowing coating and button protection.', 249000, 24, '/images/products/clearshield-slim-case.jpg', array['iPhone 13', 'iPhone 14']::text[], false, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000003'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 'Galaxy Armor Grip Case', 'galaxy-armor-grip-case', 'Shock-absorbing Galaxy case with textured side rails and reinforced corners.', 299000, 15, '/images/products/galaxy-armor-grip-case.jpg', array['Galaxy S24', 'Galaxy S25']::text[], true, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000004'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 'Pixel SoftGrip Case', 'pixel-softgrip-case', 'Lightweight Pixel case with a microfiber lining and matte grip finish.', 279000, 12, '/images/products/pixel-softgrip-case.jpg', array['Pixel 8', 'Pixel 9']::text[], false, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000005'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, 'EdgeClear Glass Protector', 'edgeclear-glass-protector', 'Tempered glass protector with full-edge coverage and an alignment frame.', 179000, 30, '/images/products/edgeclear-glass-protector.jpg', array['iPhone 15', 'iPhone 16']::text[], true, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000006'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, 'Galaxy Glass Shield', 'galaxy-glass-shield', 'Case-friendly screen glass with a smooth coating for Galaxy displays.', 169000, 22, '/images/products/galaxy-glass-shield.jpg', array['Galaxy S23', 'Galaxy S24', 'Galaxy S25']::text[], false, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000007'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, 'Pixel Matte Film Pack', 'pixel-matte-film-pack', 'Two-pack matte protector film for lower glare and smoother swiping.', 149000, 20, '/images/products/pixel-matte-film-pack.jpg', array['Pixel 8', 'Pixel 9']::text[], false, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000008'::uuid, '20000000-0000-4000-8000-000000000003'::uuid, 'VoltMini 30W USB-C Charger', 'voltmini-30w-usb-c-charger', 'Compact 30W USB-C charger for daily fast charging at home or work.', 359000, 16, '/images/products/voltmini-30w-usb-c-charger.jpg', array['Universal']::text[], true, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000009'::uuid, '20000000-0000-4000-8000-000000000003'::uuid, 'GaN Duo 65W Charger', 'gan-duo-65w-charger', 'Dual-port GaN charger for a phone and another USB-C device at the same time.', 749000, 9, '/images/products/gan-duo-65w-charger.jpg', array['Universal']::text[], true, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000010'::uuid, '20000000-0000-4000-8000-000000000003'::uuid, 'MagDock Wireless Pad', 'magdock-wireless-pad', 'Magnetic wireless charging pad with a braided cable and low-profile base.', 489000, 11, '/images/products/magdock-wireless-pad.jpg', array['iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16']::text[], false, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000011'::uuid, '20000000-0000-4000-8000-000000000004'::uuid, 'FlexLine USB-C Cable', 'flexline-usb-c-cable', 'Braided USB-C to USB-C cable with reinforced ends and fast-charge support.', 189000, 28, '/images/products/flexline-usb-c-cable.jpg', array['Universal']::text[], false, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000012'::uuid, '20000000-0000-4000-8000-000000000004'::uuid, 'LightningLink USB-C Cable', 'lightninglink-usb-c-cable', 'USB-C to Lightning cable for older iPhone charging setups and data sync.', 219000, 19, '/images/products/lightninglink-usb-c-cable.jpg', array['iPhone 13', 'iPhone 14']::text[], false, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000013'::uuid, '20000000-0000-4000-8000-000000000004'::uuid, 'AudioCharge USB-C Adapter', 'audiocharge-usb-c-adapter', 'Compact USB-C adapter for wired audio and charging while traveling.', 259000, 14, '/images/products/audiocharge-usb-c-adapter.jpg', array['Galaxy S23', 'Galaxy S24', 'Galaxy S25', 'Pixel 8', 'Pixel 9']::text[], false, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000014'::uuid, '20000000-0000-4000-8000-000000000005'::uuid, 'FoldStand Aluminum Dock', 'foldstand-aluminum-dock', 'Foldable aluminum stand with adjustable viewing angles for desks and counters.', 299000, 17, '/images/products/foldstand-aluminum-dock.jpg', array['Universal']::text[], true, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000015'::uuid, '20000000-0000-4000-8000-000000000005'::uuid, 'MagVent Car Mount', 'magvent-car-mount', 'Magnetic vent mount with a compact hinge for safer in-car navigation.', 399000, 13, '/images/products/magvent-car-mount.jpg', array['iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16']::text[], false, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz),
  ('10000000-0000-4000-8000-000000000016'::uuid, '20000000-0000-4000-8000-000000000005'::uuid, 'CreatorClamp Video Mount', 'creatorclamp-video-mount', 'Desk clamp mount for filming calls, demos, and short product videos.', 459000, 8, '/images/products/creatorclamp-video-mount.jpg', array['Universal']::text[], false, true, '2026-07-14T00:00:00.000Z'::timestamptz, '2026-07-14T00:00:00.000Z'::timestamptz)
on conflict (slug) do update
set
  id = excluded.id,
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  stock = excluded.stock,
  image_url = excluded.image_url,
  compatibility = excluded.compatibility,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  updated_at = excluded.updated_at;

commit;

select jsonb_build_object(
  'category_count', (select count(*) from public.categories),
  'active_category_count', (select count(*) from public.categories where is_active),
  'product_count', (select count(*) from public.products),
  'active_product_count', (select count(*) from public.products where is_active),
  'featured_product_count', (select count(*) from public.products where is_featured),
  'product_counts_by_category', (
    select jsonb_object_agg(category_slug, product_count order by category_slug)
    from (
      select c.slug as category_slug, count(p.id) as product_count
      from public.categories c
      left join public.products p on p.category_id = c.id
      group by c.slug
    ) counts
  )
) as seed_check;
