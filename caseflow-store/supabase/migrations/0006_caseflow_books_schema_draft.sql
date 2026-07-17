-- CaseFlow Books v1.1 schema migration draft.
--
-- D23-T01 scope:
-- - Draft only. Do not apply this file to production in D23-T01.
-- - D23-T02 must add a production data migration and rollback plan first.
-- - D23-T03 is the earliest task allowed to apply and verify the approved SQL.
--
-- This draft expands the released v1.0.0 schema without deleting the legacy
-- phone-accessory tables, so the production v1.0.0 app can remain compatible
-- until the v1.1 repositories and UI are migrated.

begin;

create extension if not exists pgcrypto;

-- Existing helper from schema.sql. Recreate defensively so this migration can
-- be reviewed standalone in a fresh Supabase project.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- v1.1 roles: admin, staff/operator, customer.
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists email_verified_at timestamptz,
  add column if not exists phone text,
  add column if not exists phone_verified_at timestamptz,
  add column if not exists default_shipping_address jsonb;

alter table public.profiles
  drop constraint if exists profiles_role_check,
  add constraint profiles_role_check check (role in ('customer', 'staff', 'admin'));

alter table public.profiles
  drop constraint if exists profiles_full_name_length,
  add constraint profiles_full_name_length check (
    full_name is null or char_length(full_name) between 1 and 120
  ),
  drop constraint if exists profiles_email_format,
  add constraint profiles_email_format check (
    email is null
    or (
      char_length(email) between 3 and 254
      and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    )
  ),
  drop constraint if exists profiles_phone_format,
  add constraint profiles_phone_format check (
    phone is null
    or (
      char_length(phone) between 7 and 24
      and phone ~ '^[0-9+(). -]+$'
    )
  ),
  drop constraint if exists profiles_default_shipping_address_shape,
  add constraint profiles_default_shipping_address_shape check (
    default_shipping_address is null
    or (
      jsonb_typeof(default_shipping_address) = 'object'
      and default_shipping_address->>'countryCode' = 'VN'
      and char_length(coalesce(default_shipping_address->>'recipientName', '')) between 1 and 120
      and char_length(coalesce(default_shipping_address->>'phone', '')) between 7 and 24
      and char_length(coalesce(default_shipping_address->>'line1', '')) between 1 and 180
      and char_length(coalesce(default_shipping_address->>'district', '')) between 1 and 120
      and char_length(coalesce(default_shipping_address->>'province', '')) between 1 and 120
    )
  );

create table if not exists public.book_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  labels jsonb not null,
  description jsonb not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_categories_slug_unique unique (slug),
  constraint book_categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint book_categories_slug_allowed check (
    slug in (
      'fiction',
      'classic-literature',
      'mystery-thriller',
      'fantasy-sci-fi',
      'romance',
      'business-economics',
      'self-development',
      'children-young-adult',
      'language-learning',
      'vietnamese-books',
      'english-books'
    )
  ),
  constraint book_categories_labels_shape check (
    jsonb_typeof(labels) = 'object'
    and char_length(coalesce(labels->>'vi', '')) between 1 and 120
    and char_length(coalesce(labels->>'en', '')) between 1 and 120
  ),
  constraint book_categories_description_shape check (
    jsonb_typeof(description) = 'object'
    and char_length(coalesce(description->>'vi', '')) between 1 and 300
    and char_length(coalesce(description->>'en', '')) between 1 and 300
  ),
  constraint book_categories_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists public.book_authors (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  bio_short jsonb,
  country text,
  birth_year integer,
  death_year integer,
  source_note jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_authors_slug_unique unique (slug),
  constraint book_authors_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint book_authors_name_length check (char_length(name) between 1 and 160),
  constraint book_authors_bio_shape check (
    bio_short is null
    or (
      jsonb_typeof(bio_short) = 'object'
      and char_length(coalesce(bio_short->>'vi', '')) between 1 and 1200
      and char_length(coalesce(bio_short->>'en', '')) between 1 and 1200
    )
  ),
  constraint book_authors_country_length check (
    country is null or char_length(country) between 2 and 80
  ),
  constraint book_authors_year_range check (
    birth_year is null or birth_year between -4000 and 3000
  ),
  constraint book_authors_death_year_range check (
    death_year is null or death_year between -4000 and 3000
  ),
  constraint book_authors_year_order check (
    birth_year is null or death_year is null or death_year >= birth_year
  )
);

create table if not exists public.book_translators (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  bio_short jsonb,
  source_note jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_translators_slug_unique unique (slug),
  constraint book_translators_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint book_translators_name_length check (char_length(name) between 1 and 160),
  constraint book_translators_bio_shape check (
    bio_short is null
    or (
      jsonb_typeof(bio_short) = 'object'
      and char_length(coalesce(bio_short->>'vi', '')) between 1 and 1200
      and char_length(coalesce(bio_short->>'en', '')) between 1 and 1200
    )
  )
);

create table if not exists public.book_publishers (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  country text,
  website text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_publishers_slug_unique unique (slug),
  constraint book_publishers_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint book_publishers_name_length check (char_length(name) between 1 and 160),
  constraint book_publishers_country_length check (
    country is null or char_length(country) between 2 and 80
  ),
  constraint book_publishers_website_format check (
    website is null or (char_length(website) <= 500 and website ~ '^https?://.+')
  )
);

create table if not exists public.book_cover_assets (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  alt_text jsonb not null,
  source text not null default 'placeholder',
  source_note jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_cover_assets_path_unique unique (path),
  constraint book_cover_assets_path_format check (path ~ '^(https?://|/).+'),
  constraint book_cover_assets_alt_text_shape check (
    jsonb_typeof(alt_text) = 'object'
    and char_length(coalesce(alt_text->>'vi', '')) between 1 and 180
    and char_length(coalesce(alt_text->>'en', '')) between 1 and 180
  ),
  constraint book_cover_assets_source_check check (
    source in ('placeholder', 'generated', 'internal', 'licensed', 'public-domain')
  )
);

create table if not exists public.book_works (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  original_title text,
  localized_title jsonb not null default '{}'::jsonb,
  original_language text not null,
  themes text[] not null default '{}'::text[],
  age_rating text,
  publication_era text,
  canonical_summary jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_works_slug_unique unique (slug),
  constraint book_works_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint book_works_title_length check (char_length(title) between 1 and 180),
  constraint book_works_original_title_length check (
    original_title is null or char_length(original_title) between 1 and 180
  ),
  constraint book_works_localized_title_shape check (
    jsonb_typeof(localized_title) = 'object'
  ),
  constraint book_works_original_language_length check (
    char_length(original_language) between 2 and 80
  ),
  constraint book_works_themes_limit check (
    cardinality(themes) <= 20 and array_position(themes, null) is null
  ),
  constraint book_works_age_rating_length check (
    age_rating is null or char_length(age_rating) between 1 and 40
  ),
  constraint book_works_publication_era_length check (
    publication_era is null or char_length(publication_era) between 1 and 80
  ),
  constraint book_works_canonical_summary_shape check (
    jsonb_typeof(canonical_summary) = 'object'
    and char_length(coalesce(canonical_summary->>'vi', '')) between 1 and 1200
    and char_length(coalesce(canonical_summary->>'en', '')) between 1 and 1200
  )
);

create table if not exists public.book_work_authors (
  work_id uuid not null references public.book_works(id) on update cascade on delete cascade,
  author_id uuid not null references public.book_authors(id) on update cascade on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (work_id, author_id),
  constraint book_work_authors_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists public.book_work_categories (
  work_id uuid not null references public.book_works(id) on update cascade on delete cascade,
  category_id uuid not null references public.book_categories(id) on update cascade on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (work_id, category_id),
  constraint book_work_categories_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists public.book_editions (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.book_works(id) on update cascade on delete restrict,
  slug text not null,
  display_title text not null,
  localized_display_title jsonb not null default '{}'::jsonb,
  subtitle text,
  language text not null,
  format text not null,
  publisher_id uuid references public.book_publishers(id) on update cascade on delete set null,
  isbn13 text,
  isbn10 text,
  publication_year integer,
  page_count integer,
  dimensions jsonb,
  weight_grams integer,
  cover_asset_id uuid references public.book_cover_assets(id) on update cascade on delete set null,
  price_vnd integer not null,
  compare_at_price_vnd integer,
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 0,
  inventory_status text not null default 'in-stock',
  summary jsonb not null,
  table_of_contents jsonb,
  sample_excerpt_policy text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_editions_slug_unique unique (slug),
  constraint book_editions_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint book_editions_display_title_length check (char_length(display_title) between 1 and 180),
  constraint book_editions_localized_display_title_shape check (
    jsonb_typeof(localized_display_title) = 'object'
  ),
  constraint book_editions_subtitle_length check (
    subtitle is null or char_length(subtitle) between 1 and 220
  ),
  constraint book_editions_language_check check (language in ('vi', 'en')),
  constraint book_editions_format_check check (
    format in ('paperback', 'hardcover', 'box-set', 'special-edition')
  ),
  constraint book_editions_isbn13_format check (
    isbn13 is null or isbn13 ~ '^(978|979)\d{10}$'
  ),
  constraint book_editions_isbn10_format check (
    isbn10 is null or isbn10 ~ '^\d{9}[\dX]$'
  ),
  constraint book_editions_publication_year_range check (
    publication_year is null or publication_year between 1400 and 3000
  ),
  constraint book_editions_page_count_range check (
    page_count is null or page_count between 1 and 20000
  ),
  constraint book_editions_dimensions_shape check (
    case
      when dimensions is null then true
      when jsonb_typeof(dimensions) <> 'object' then false
      else
        case
          when jsonb_typeof(dimensions->'widthMm') = 'number'
            then (dimensions->>'widthMm')::numeric between 1 and 1000
          else false
        end
        and case
          when jsonb_typeof(dimensions->'heightMm') = 'number'
            then (dimensions->>'heightMm')::numeric between 1 and 1000
          else false
        end
        and case
          when not dimensions ? 'thicknessMm'
            or dimensions->'thicknessMm' = 'null'::jsonb then true
          when jsonb_typeof(dimensions->'thicknessMm') = 'number'
            then (dimensions->>'thicknessMm')::numeric between 1 and 1000
          else false
        end
    end
  ),
  constraint book_editions_weight_grams_range check (
    weight_grams is null or weight_grams between 1 and 50000
  ),
  constraint book_editions_price_vnd_range check (
    price_vnd between 0 and 50000000
  ),
  constraint book_editions_compare_at_price_vnd_range check (
    compare_at_price_vnd is null or compare_at_price_vnd between 0 and 50000000
  ),
  constraint book_editions_compare_at_price_gte_price check (
    compare_at_price_vnd is null or compare_at_price_vnd >= price_vnd
  ),
  constraint book_editions_stock_quantity_range check (
    stock_quantity between 0 and 1000000
  ),
  constraint book_editions_low_stock_threshold_range check (
    low_stock_threshold between 0 and 1000000
  ),
  constraint book_editions_inventory_status_check check (
    inventory_status in (
      'in-stock',
      'low-stock',
      'out-of-stock',
      'preorder',
      'discontinued'
    )
  ),
  constraint book_editions_summary_shape check (
    jsonb_typeof(summary) = 'object'
    and char_length(coalesce(summary->>'vi', '')) between 1 and 1200
    and char_length(coalesce(summary->>'en', '')) between 1 and 1200
  ),
  constraint book_editions_table_of_contents_shape check (
    table_of_contents is null
    or (
      jsonb_typeof(table_of_contents) = 'object'
      and char_length(coalesce(table_of_contents->>'vi', '')) between 1 and 5000
      and char_length(coalesce(table_of_contents->>'en', '')) between 1 and 5000
    )
  ),
  constraint book_editions_sample_excerpt_policy_length check (
    sample_excerpt_policy is null or char_length(sample_excerpt_policy) between 1 and 300
  )
);

create unique index if not exists book_editions_isbn13_unique_idx
  on public.book_editions (isbn13)
  where isbn13 is not null;

create unique index if not exists book_editions_isbn10_unique_idx
  on public.book_editions (isbn10)
  where isbn10 is not null;

create table if not exists public.book_edition_translators (
  edition_id uuid not null references public.book_editions(id) on update cascade on delete cascade,
  translator_id uuid not null references public.book_translators(id) on update cascade on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (edition_id, translator_id),
  constraint book_edition_translators_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  ward text,
  district text not null,
  province text not null,
  country_code text not null default 'VN',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_addresses_recipient_name_length check (
    char_length(recipient_name) between 1 and 120
  ),
  constraint customer_addresses_phone_format check (
    char_length(phone) between 7 and 24 and phone ~ '^[0-9+(). -]+$'
  ),
  constraint customer_addresses_line1_length check (char_length(line1) between 1 and 180),
  constraint customer_addresses_line2_length check (
    line2 is null or char_length(line2) between 1 and 180
  ),
  constraint customer_addresses_ward_length check (
    ward is null or char_length(ward) between 1 and 120
  ),
  constraint customer_addresses_district_length check (char_length(district) between 1 and 120),
  constraint customer_addresses_province_length check (char_length(province) between 1 and 120),
  constraint customer_addresses_country_code_check check (country_code = 'VN')
);

create unique index if not exists customer_addresses_one_default_idx
  on public.customer_addresses (user_id)
  where is_default = true;

create table if not exists public.book_promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name jsonb not null,
  discount_type text not null,
  amount_vnd integer,
  percentage_basis_points integer,
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_promotions_code_unique unique (code),
  constraint book_promotions_code_format check (code ~ '^[A-Z0-9-]{4,40}$'),
  constraint book_promotions_name_shape check (
    jsonb_typeof(name) = 'object'
    and char_length(coalesce(name->>'vi', '')) between 1 and 120
    and char_length(coalesce(name->>'en', '')) between 1 and 120
  ),
  constraint book_promotions_discount_type_check check (
    discount_type in ('fixed-vnd', 'percentage')
  ),
  constraint book_promotions_discount_value_check check (
    (
      discount_type = 'fixed-vnd'
      and amount_vnd is not null
      and amount_vnd >= 0
      and percentage_basis_points is null
    )
    or (
      discount_type = 'percentage'
      and amount_vnd is null
      and percentage_basis_points between 0 and 10000
    )
  ),
  constraint book_promotions_date_order check (
    ends_at is null or ends_at > starts_at
  )
);

create table if not exists public.book_inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.book_editions(id) on update cascade on delete restrict,
  quantity_delta integer not null,
  reason text not null,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint book_inventory_adjustments_quantity_delta_range check (
    quantity_delta between -1000000 and 1000000 and quantity_delta <> 0
  ),
  constraint book_inventory_adjustments_reason_length check (
    char_length(reason) between 1 and 240
  )
);

-- Extend v1.0.0 orders into v1.1 bookstore order snapshots. Existing guest
-- orders stay valid; v1.1 route handlers/RPCs require customer_id.
alter table public.orders
  add column if not exists customer_id uuid references auth.users(id) on delete restrict,
  add column if not exists shipping_address_json jsonb,
  add column if not exists payment_method text not null default 'cod',
  add column if not exists payment_status text not null default 'pending',
  add column if not exists shipping_method text not null default 'standard',
  add column if not exists currency text not null default 'VND',
  add column if not exists discount_total_vnd integer not null default 0,
  add column if not exists shipping_fee_vnd integer not null default 0,
  add column if not exists tax_total_vnd integer not null default 0,
  add column if not exists payment_fee_vnd integer not null default 0,
  add column if not exists tax_estimates jsonb not null default '[]'::jsonb,
  add column if not exists fee_estimates jsonb not null default '[]'::jsonb,
  add column if not exists display_estimate jsonb,
  add column if not exists promotion_code text;

alter table public.orders
  add column if not exists total_vnd integer generated always as (
    subtotal - discount_total_vnd + shipping_fee_vnd + tax_total_vnd + payment_fee_vnd
  ) stored;

alter table public.orders
  drop constraint if exists orders_shipping_address_json_shape,
  add constraint orders_shipping_address_json_shape check (
    shipping_address_json is null
    or (
      jsonb_typeof(shipping_address_json) = 'object'
      and shipping_address_json->>'countryCode' = 'VN'
      and char_length(coalesce(shipping_address_json->>'recipientName', '')) between 1 and 120
      and char_length(coalesce(shipping_address_json->>'phone', '')) between 7 and 24
      and char_length(coalesce(shipping_address_json->>'line1', '')) between 1 and 180
      and char_length(coalesce(shipping_address_json->>'district', '')) between 1 and 120
      and char_length(coalesce(shipping_address_json->>'province', '')) between 1 and 120
    )
  ),
  drop constraint if exists orders_payment_method_check,
  add constraint orders_payment_method_check check (
    payment_method in ('cod', 'bank-transfer', 'momo', 'zalopay', 'vnpay')
  ),
  drop constraint if exists orders_payment_status_check,
  add constraint orders_payment_status_check check (
    payment_status in (
      'pending',
      'awaiting-transfer',
      'awaiting-provider-confirmation',
      'confirmed',
      'failed',
      'cancelled'
    )
  ),
  drop constraint if exists orders_shipping_method_check,
  add constraint orders_shipping_method_check check (shipping_method in ('standard', 'express')),
  drop constraint if exists orders_currency_check,
  add constraint orders_currency_check check (currency = 'VND'),
  drop constraint if exists orders_book_totals_nonnegative,
  add constraint orders_book_totals_nonnegative check (
    subtotal >= 0
    and discount_total_vnd >= 0
    and shipping_fee_vnd >= 0
    and tax_total_vnd >= 0
    and payment_fee_vnd >= 0
    and total_vnd >= 0
  ),
  drop constraint if exists orders_tax_estimates_shape,
  add constraint orders_tax_estimates_shape check (jsonb_typeof(tax_estimates) = 'array'),
  drop constraint if exists orders_fee_estimates_shape,
  add constraint orders_fee_estimates_shape check (jsonb_typeof(fee_estimates) = 'array'),
  drop constraint if exists orders_display_estimate_shape,
  add constraint orders_display_estimate_shape check (
    display_estimate is null or jsonb_typeof(display_estimate) = 'object'
  ),
  drop constraint if exists orders_promotion_code_format,
  add constraint orders_promotion_code_format check (
    promotion_code is null or promotion_code ~ '^[A-Z0-9-]{4,40}$'
  );

-- v1.1 book order items are stored beside the v1.0.0 product snapshot fields.
-- Legacy product fields remain available until the application fully migrates.
alter table public.order_items
  alter column product_id drop not null,
  add column if not exists book_edition_id uuid references public.book_editions(id) on update cascade on delete restrict,
  add column if not exists book_work_id uuid references public.book_works(id) on update cascade on delete restrict,
  add column if not exists edition_title text,
  add column if not exists edition_language text,
  add column if not exists edition_format text,
  add column if not exists unit_price_vnd integer,
  add column if not exists line_total_vnd integer;

alter table public.order_items
  drop constraint if exists order_items_book_snapshot_complete,
  add constraint order_items_book_snapshot_complete check (
    book_edition_id is null
    or (
      book_work_id is not null
      and char_length(coalesce(edition_title, '')) between 1 and 180
      and edition_language in ('vi', 'en')
      and edition_format in ('paperback', 'hardcover', 'box-set', 'special-edition')
      and unit_price_vnd is not null
      and unit_price_vnd >= 0
      and line_total_vnd is not null
      and line_total_vnd = unit_price_vnd * quantity
    )
  );

create unique index if not exists order_items_order_book_edition_unique_idx
  on public.order_items (order_id, book_edition_id)
  where book_edition_id is not null;

create index if not exists book_categories_active_sort_idx
  on public.book_categories (is_active, sort_order, slug);

create index if not exists book_authors_active_name_idx
  on public.book_authors (is_active, name);

create index if not exists book_translators_active_name_idx
  on public.book_translators (is_active, name);

create index if not exists book_publishers_active_name_idx
  on public.book_publishers (is_active, name);

create index if not exists book_works_active_slug_idx
  on public.book_works (is_active, slug);

create index if not exists book_work_authors_author_id_idx
  on public.book_work_authors (author_id);

create index if not exists book_work_categories_category_id_idx
  on public.book_work_categories (category_id);

create index if not exists book_editions_work_active_idx
  on public.book_editions (work_id, is_active);

create index if not exists book_editions_language_format_idx
  on public.book_editions (language, format);

create index if not exists book_editions_inventory_status_idx
  on public.book_editions (inventory_status, stock_quantity);

create index if not exists book_editions_featured_active_idx
  on public.book_editions (is_featured, is_active);

create index if not exists book_edition_translators_translator_id_idx
  on public.book_edition_translators (translator_id);

create index if not exists customer_addresses_user_id_idx
  on public.customer_addresses (user_id);

create index if not exists book_promotions_active_window_idx
  on public.book_promotions (is_active, starts_at, ends_at);

create index if not exists book_inventory_adjustments_edition_created_idx
  on public.book_inventory_adjustments (edition_id, created_at desc);

create index if not exists orders_customer_created_idx
  on public.orders (customer_id, created_at desc);

create index if not exists orders_payment_status_idx
  on public.orders (payment_status);

create index if not exists order_items_book_edition_idx
  on public.order_items (book_edition_id);

drop trigger if exists book_categories_set_updated_at on public.book_categories;
create trigger book_categories_set_updated_at
before update on public.book_categories
for each row execute function public.set_updated_at();

drop trigger if exists book_authors_set_updated_at on public.book_authors;
create trigger book_authors_set_updated_at
before update on public.book_authors
for each row execute function public.set_updated_at();

drop trigger if exists book_translators_set_updated_at on public.book_translators;
create trigger book_translators_set_updated_at
before update on public.book_translators
for each row execute function public.set_updated_at();

drop trigger if exists book_publishers_set_updated_at on public.book_publishers;
create trigger book_publishers_set_updated_at
before update on public.book_publishers
for each row execute function public.set_updated_at();

drop trigger if exists book_cover_assets_set_updated_at on public.book_cover_assets;
create trigger book_cover_assets_set_updated_at
before update on public.book_cover_assets
for each row execute function public.set_updated_at();

drop trigger if exists book_works_set_updated_at on public.book_works;
create trigger book_works_set_updated_at
before update on public.book_works
for each row execute function public.set_updated_at();

drop trigger if exists book_editions_set_updated_at on public.book_editions;
create trigger book_editions_set_updated_at
before update on public.book_editions
for each row execute function public.set_updated_at();

drop trigger if exists customer_addresses_set_updated_at on public.customer_addresses;
create trigger customer_addresses_set_updated_at
before update on public.customer_addresses
for each row execute function public.set_updated_at();

drop trigger if exists book_promotions_set_updated_at on public.book_promotions;
create trigger book_promotions_set_updated_at
before update on public.book_promotions
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.book_categories enable row level security;
alter table public.book_authors enable row level security;
alter table public.book_translators enable row level security;
alter table public.book_publishers enable row level security;
alter table public.book_cover_assets enable row level security;
alter table public.book_works enable row level security;
alter table public.book_work_authors enable row level security;
alter table public.book_work_categories enable row level security;
alter table public.book_editions enable row level security;
alter table public.book_edition_translators enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.book_promotions enable row level security;
alter table public.book_inventory_adjustments enable row level security;

drop policy if exists "Public can read active book categories" on public.book_categories;
create policy "Public can read active book categories"
on public.book_categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can read active book authors" on public.book_authors;
create policy "Public can read active book authors"
on public.book_authors
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can read active book translators" on public.book_translators;
create policy "Public can read active book translators"
on public.book_translators
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can read active book publishers" on public.book_publishers;
create policy "Public can read active book publishers"
on public.book_publishers
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can read book cover assets" on public.book_cover_assets;
create policy "Public can read book cover assets"
on public.book_cover_assets
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read active book works" on public.book_works;
create policy "Public can read active book works"
on public.book_works
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can read active work authors" on public.book_work_authors;
create policy "Public can read active work authors"
on public.book_work_authors
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.book_works
    where book_works.id = book_work_authors.work_id
      and book_works.is_active = true
  )
);

drop policy if exists "Public can read active work categories" on public.book_work_categories;
create policy "Public can read active work categories"
on public.book_work_categories
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.book_works
    where book_works.id = book_work_categories.work_id
      and book_works.is_active = true
  )
);

drop policy if exists "Public can read active book editions" on public.book_editions;
create policy "Public can read active book editions"
on public.book_editions
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.book_works
    where book_works.id = book_editions.work_id
      and book_works.is_active = true
  )
);

drop policy if exists "Public can read active edition translators" on public.book_edition_translators;
create policy "Public can read active edition translators"
on public.book_edition_translators
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.book_editions
    where book_editions.id = book_edition_translators.edition_id
      and book_editions.is_active = true
  )
);

drop policy if exists "Users can read own customer addresses" on public.customer_addresses;
create policy "Users can read own customer addresses"
on public.customer_addresses
for select
to authenticated
using (user_id = auth.uid());

-- Operational data intentionally has no direct anon/authenticated write policy.
-- Next.js Route Handlers must validate user input and use the server-only
-- service role after checking the authenticated user and role.

grant usage on schema public to anon, authenticated;
grant select on public.book_categories to anon, authenticated;
grant select on public.book_authors to anon, authenticated;
grant select on public.book_translators to anon, authenticated;
grant select on public.book_publishers to anon, authenticated;
grant select on public.book_cover_assets to anon, authenticated;
grant select on public.book_works to anon, authenticated;
grant select on public.book_work_authors to anon, authenticated;
grant select on public.book_work_categories to anon, authenticated;
grant select on public.book_editions to anon, authenticated;
grant select on public.book_edition_translators to anon, authenticated;
grant select on public.customer_addresses to authenticated;

revoke insert, update, delete on public.book_categories from anon, authenticated;
revoke insert, update, delete on public.book_authors from anon, authenticated;
revoke insert, update, delete on public.book_translators from anon, authenticated;
revoke insert, update, delete on public.book_publishers from anon, authenticated;
revoke insert, update, delete on public.book_cover_assets from anon, authenticated;
revoke insert, update, delete on public.book_works from anon, authenticated;
revoke insert, update, delete on public.book_work_authors from anon, authenticated;
revoke insert, update, delete on public.book_work_categories from anon, authenticated;
revoke insert, update, delete on public.book_editions from anon, authenticated;
revoke insert, update, delete on public.book_edition_translators from anon, authenticated;
revoke insert, update, delete on public.customer_addresses from anon, authenticated;
revoke all on public.book_promotions from anon, authenticated;
revoke all on public.book_inventory_adjustments from anon, authenticated;
revoke all on public.orders, public.order_items from anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.book_categories to service_role;
grant select, insert, update, delete on public.book_authors to service_role;
grant select, insert, update, delete on public.book_translators to service_role;
grant select, insert, update, delete on public.book_publishers to service_role;
grant select, insert, update, delete on public.book_cover_assets to service_role;
grant select, insert, update, delete on public.book_works to service_role;
grant select, insert, update, delete on public.book_work_authors to service_role;
grant select, insert, update, delete on public.book_work_categories to service_role;
grant select, insert, update, delete on public.book_editions to service_role;
grant select, insert, update, delete on public.book_edition_translators to service_role;
grant select, insert, update, delete on public.customer_addresses to service_role;
grant select, insert, update, delete on public.book_promotions to service_role;
grant select, insert, update, delete on public.book_inventory_adjustments to service_role;
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.orders, public.order_items to service_role;

create or replace function public.create_book_order_with_items(
  p_order_code text,
  p_customer_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address jsonb,
  p_shipping_method text,
  p_payment_method text,
  p_discount_total_vnd integer,
  p_shipping_fee_vnd integer,
  p_tax_total_vnd integer,
  p_payment_fee_vnd integer,
  p_tax_estimates jsonb,
  p_fee_estimates jsonb,
  p_display_estimate jsonb,
  p_promotion_code text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item_count integer;
  distinct_item_count integer;
  valid_item_count integer;
  calculated_subtotal_vnd integer;
  new_order public.orders%rowtype;
  inserted_items jsonb;
begin
  if p_customer_id is null then
    raise exception 'Customer account is required for CaseFlow Books checkout';
  end if;

  if jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) < 1
    or jsonb_array_length(p_items) > 50 then
    raise exception 'Order items must be an array containing 1 to 50 items';
  end if;

  select
    count(*),
    count(distinct item.edition_id)
  into item_count, distinct_item_count
  from jsonb_to_recordset(p_items) as item(edition_id uuid, quantity integer);

  if item_count <> distinct_item_count then
    raise exception 'Duplicate book editions are not allowed in one order';
  end if;

  select
    count(*),
    coalesce(sum(book_editions.price_vnd * item.quantity), 0)
  into valid_item_count, calculated_subtotal_vnd
  from jsonb_to_recordset(p_items) as item(edition_id uuid, quantity integer)
  join public.book_editions
    on book_editions.id = item.edition_id
  join public.book_works
    on book_works.id = book_editions.work_id
  where item.quantity > 0
    and item.quantity <= book_editions.stock_quantity
    and book_editions.is_active = true
    and book_works.is_active = true
    and book_editions.inventory_status in ('in-stock', 'low-stock', 'preorder');

  if valid_item_count <> item_count then
    raise exception 'One or more book editions are unavailable or over stock';
  end if;

  if calculated_subtotal_vnd < 0 then
    raise exception 'Calculated subtotal cannot be negative';
  end if;

  insert into public.orders (
    order_code,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    shipping_address_json,
    status,
    subtotal,
    payment_method,
    payment_status,
    shipping_method,
    currency,
    discount_total_vnd,
    shipping_fee_vnd,
    tax_total_vnd,
    payment_fee_vnd,
    tax_estimates,
    fee_estimates,
    display_estimate,
    promotion_code
  )
  values (
    p_order_code,
    p_customer_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    concat_ws(
      ', ',
      p_shipping_address->>'line1',
      p_shipping_address->>'ward',
      p_shipping_address->>'district',
      p_shipping_address->>'province',
      p_shipping_address->>'countryCode'
    ),
    p_shipping_address,
    'pending',
    calculated_subtotal_vnd,
    p_payment_method,
    case
      when p_payment_method = 'bank-transfer' then 'awaiting-transfer'
      when p_payment_method in ('momo', 'zalopay', 'vnpay') then 'awaiting-provider-confirmation'
      else 'pending'
    end,
    p_shipping_method,
    'VND',
    p_discount_total_vnd,
    p_shipping_fee_vnd,
    p_tax_total_vnd,
    p_payment_fee_vnd,
    coalesce(p_tax_estimates, '[]'::jsonb),
    coalesce(p_fee_estimates, '[]'::jsonb),
    p_display_estimate,
    p_promotion_code
  )
  returning * into new_order;

  insert into public.order_items (
    order_id,
    product_id,
    product_name,
    unit_price,
    quantity,
    line_total,
    book_edition_id,
    book_work_id,
    edition_title,
    edition_language,
    edition_format,
    unit_price_vnd,
    line_total_vnd
  )
  select
    new_order.id,
    null,
    book_editions.display_title,
    book_editions.price_vnd,
    item.quantity,
    book_editions.price_vnd * item.quantity,
    book_editions.id,
    book_editions.work_id,
    book_editions.display_title,
    book_editions.language,
    book_editions.format,
    book_editions.price_vnd,
    book_editions.price_vnd * item.quantity
  from jsonb_to_recordset(p_items) as item(edition_id uuid, quantity integer)
  join public.book_editions
    on book_editions.id = item.edition_id;

  select coalesce(jsonb_agg(to_jsonb(order_item) order by order_item.id), '[]'::jsonb)
  into inserted_items
  from public.order_items as order_item
  where order_item.order_id = new_order.id;

  return jsonb_build_object(
    'order', to_jsonb(new_order),
    'items', inserted_items
  );
end;
$$;

revoke all on function public.create_book_order_with_items(
  text,
  uuid,
  text,
  text,
  text,
  jsonb,
  text,
  text,
  integer,
  integer,
  integer,
  integer,
  jsonb,
  jsonb,
  jsonb,
  text,
  jsonb
) from public, anon, authenticated;

grant execute on function public.create_book_order_with_items(
  text,
  uuid,
  text,
  text,
  text,
  jsonb,
  text,
  text,
  integer,
  integer,
  integer,
  integer,
  jsonb,
  jsonb,
  jsonb,
  text,
  jsonb
) to service_role;

-- No direct public order insert/update policies are defined in this draft.
-- Book checkout and admin operations must go through Next.js Route Handlers,
-- server-side Zod validation, server-side authorization, and service-role RPCs.

commit;
