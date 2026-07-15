-- CaseFlow Store database draft.
-- This file is intended for Supabase PostgreSQL and should be reviewed again
-- before applying it to a real project in D13.

create extension if not exists pgcrypto;

do $$
begin
  create type public.order_status as enum (
    'pending',
    'confirmed',
    'shipping',
    'completed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.text_array_is_unique(items text[])
returns boolean
language sql
immutable
as $$
  select count(*) = count(distinct value)
  from unnest(items) as item(value);
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('customer', 'admin'))
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_unique unique (slug),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint categories_slug_allowed check (
    slug in (
      'phone-cases',
      'screen-protectors',
      'chargers',
      'cables-adapters',
      'stands-mounts'
    )
  ),
  constraint categories_name_length check (char_length(name) between 1 and 80),
  constraint categories_description_length check (char_length(description) between 1 and 300),
  constraint categories_sort_order_nonnegative check (sort_order >= 0)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on update cascade on delete restrict,
  name text not null,
  slug text not null,
  description text not null,
  price integer not null,
  stock integer not null default 0,
  image_url text not null,
  compatibility text[] not null,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_unique unique (slug),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint products_name_length check (char_length(name) between 1 and 120),
  constraint products_description_length check (char_length(description) between 1 and 1000),
  constraint products_price_nonnegative check (price >= 0),
  constraint products_stock_nonnegative check (stock >= 0),
  constraint products_image_url_format check (image_url ~ '^(https?://|/).+'),
  constraint products_compatibility_allowed check (
    cardinality(compatibility) between 1 and 10
    and array_position(compatibility, null) is null
    and compatibility <@ array[
      'iPhone 13',
      'iPhone 14',
      'iPhone 15',
      'iPhone 16',
      'Galaxy S23',
      'Galaxy S24',
      'Galaxy S25',
      'Pixel 8',
      'Pixel 9',
      'Universal'
    ]::text[]
    and public.text_array_is_unique(compatibility)
  )
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address text not null,
  status public.order_status not null default 'pending',
  subtotal integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_order_code_unique unique (order_code),
  constraint orders_order_code_format check (order_code ~ '^[A-Z0-9-]{4,40}$'),
  constraint orders_customer_name_length check (char_length(customer_name) between 1 and 120),
  constraint orders_customer_email_length check (char_length(customer_email) between 3 and 254),
  constraint orders_customer_phone_format check (
    char_length(customer_phone) between 7 and 24
    and customer_phone ~ '^[0-9+(). -]+$'
  ),
  constraint orders_shipping_address_length check (char_length(shipping_address) between 1 and 500),
  constraint orders_subtotal_nonnegative check (subtotal >= 0)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on update cascade on delete restrict,
  product_name text not null,
  unit_price integer not null,
  quantity integer not null,
  line_total integer not null,
  constraint order_items_order_product_unique unique (order_id, product_id),
  constraint order_items_product_name_length check (char_length(product_name) between 1 and 120),
  constraint order_items_unit_price_nonnegative check (unit_price >= 0),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_line_total_matches check (line_total = unit_price * quantity)
);

create index if not exists categories_active_sort_idx
  on public.categories (is_active, sort_order, name);

create index if not exists products_category_active_idx
  on public.products (category_id, is_active);

create index if not exists products_featured_active_idx
  on public.products (is_featured, is_active);

create index if not exists products_created_at_idx
  on public.products (created_at desc);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists orders_status_idx
  on public.orders (status);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.categories
    where categories.id = products.category_id
      and categories.is_active = true
  )
);

-- Keep direct Data API grants aligned with the RLS policies above.
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products to anon, authenticated;
grant select on public.profiles to authenticated;

-- The backend service role bypasses RLS, but still needs explicit table
-- privileges for trusted administration and test cleanup operations.
grant usage on schema public to service_role;
grant select on public.categories, public.products to service_role;
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.orders, public.order_items to service_role;

revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
revoke insert, update, delete on public.categories, public.products from anon, authenticated;
revoke all on public.orders, public.order_items from anon, authenticated;

create or replace function public.create_order_with_items(
  p_order_code text,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_subtotal integer,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_order public.orders%rowtype;
  inserted_items jsonb;
begin
  if jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) < 1
    or jsonb_array_length(p_items) > 25 then
    raise exception 'Order items must be an array containing 1 to 25 items';
  end if;

  insert into public.orders (
    order_code,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    status,
    subtotal
  )
  values (
    p_order_code,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_shipping_address,
    'pending',
    p_subtotal
  )
  returning * into new_order;

  insert into public.order_items (
    order_id,
    product_id,
    product_name,
    unit_price,
    quantity,
    line_total
  )
  select
    new_order.id,
    item.product_id,
    item.product_name,
    item.unit_price,
    item.quantity,
    item.line_total
  from jsonb_to_recordset(p_items) as item(
    product_id uuid,
    product_name text,
    unit_price integer,
    quantity integer,
    line_total integer
  );

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

revoke all on function public.create_order_with_items(
  text,
  text,
  text,
  text,
  text,
  integer,
  jsonb
) from public, anon, authenticated;

grant execute on function public.create_order_with_items(
  text,
  text,
  text,
  text,
  text,
  integer,
  jsonb
) to service_role;

-- No cart table is created for the MVP. The guest cart lives in localStorage
-- and stores only productId and quantity.
--
-- No direct public order insert/update policies are defined here. Checkout and
-- admin changes must go through Next.js Route Handlers so the server can
-- recalculate prices, validate stock, and enforce admin authorization.
-- The atomic order RPC is executable only by service_role and receives only
-- server-validated, server-priced order lines.
