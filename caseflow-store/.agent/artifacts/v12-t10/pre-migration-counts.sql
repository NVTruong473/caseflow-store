-- V12-T10 pre-migration count-only checks. Do not select PII rows here.
select jsonb_build_object(
  'categories', (select count(*) from public.categories),
  'products', (select count(*) from public.products),
  'profiles', (select count(*) from public.profiles),
  'orders', (select count(*) from public.orders),
  'order_items', (select count(*) from public.order_items),
  'book_categories', (select count(*) from public.book_categories),
  'book_authors', (select count(*) from public.book_authors),
  'book_translators', (select count(*) from public.book_translators),
  'book_publishers', (select count(*) from public.book_publishers),
  'book_cover_assets', (select count(*) from public.book_cover_assets),
  'book_works', (select count(*) from public.book_works),
  'book_work_authors', (select count(*) from public.book_work_authors),
  'book_work_categories', (select count(*) from public.book_work_categories),
  'book_editions', (select count(*) from public.book_editions),
  'book_edition_translators', (select count(*) from public.book_edition_translators),
  'book_promotions', (select count(*) from public.book_promotions),
  'book_inventory_adjustments', (select count(*) from public.book_inventory_adjustments)
) as pre_v12_counts;

select jsonb_build_object(
  'active_book_editions', (select count(*) from public.book_editions where is_active),
  'active_book_works', (select count(*) from public.book_works where is_active),
  'primary_placeholder_editions', (
    select count(*)
    from public.book_editions
    join public.book_cover_assets
      on book_cover_assets.id = book_editions.cover_asset_id
    where book_editions.is_active
      and book_cover_assets.path like '%placeholder%'
  ),
  'book_order_snapshots', (
    select count(*) from public.order_items where book_edition_id is not null
  )
) as pre_v12_catalog_state;
