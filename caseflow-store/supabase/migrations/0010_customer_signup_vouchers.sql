-- Additive customer voucher layer for signup marketing campaigns.
-- `book_promotions` remains the campaign source of truth; this table stores
-- per-account issuance, expiry, reservation, and redemption state.

insert into public.book_promotions (
  code,
  name,
  discount_type,
  amount_vnd,
  percentage_basis_points,
  starts_at,
  ends_at,
  is_active
)
values
  (
    'WELCOME30K',
    '{"vi":"Ưu đãi chào mừng 30.000 đ","en":"Welcome 30,000 VND offer"}'::jsonb,
    'fixed-vnd',
    30000,
    null,
    '2026-01-01T00:00:00+00:00',
    null,
    true
  ),
  (
    'READMORE20K',
    '{"vi":"Đọc thêm giảm 20.000 đ","en":"Read more 20,000 VND offer"}'::jsonb,
    'fixed-vnd',
    20000,
    null,
    '2026-01-01T00:00:00+00:00',
    null,
    true
  ),
  (
    'FREESHIP25K',
    '{"vi":"Hỗ trợ phí giao 25.000 đ","en":"Delivery support 25,000 VND offer"}'::jsonb,
    'fixed-vnd',
    25000,
    null,
    '2026-01-01T00:00:00+00:00',
    null,
    true
  )
on conflict (code) do update
set
  name = excluded.name,
  discount_type = excluded.discount_type,
  amount_vnd = excluded.amount_vnd,
  percentage_basis_points = excluded.percentage_basis_points,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  is_active = true;

create table if not exists public.customer_promotion_vouchers (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on update cascade on delete cascade,
  promotion_id uuid not null references public.book_promotions(id) on update cascade on delete restrict,
  code text not null,
  source text not null default 'signup',
  issued_at timestamptz not null default now(),
  activated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  reserved_at timestamptz,
  reservation_token text,
  reservation_expires_at timestamptz,
  used_at timestamptz,
  used_order_id uuid references public.orders(id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_promotion_vouchers_customer_promotion_unique unique (customer_id, promotion_id),
  constraint customer_promotion_vouchers_code_format check (code ~ '^[A-Z0-9-]{4,40}$'),
  constraint customer_promotion_vouchers_source_check check (source in ('signup')),
  constraint customer_promotion_vouchers_expiry_order check (expires_at > activated_at),
  constraint customer_promotion_vouchers_reservation_shape check (
    (
      reserved_at is null
      and reservation_token is null
      and reservation_expires_at is null
    )
    or (
      reserved_at is not null
      and reservation_token is not null
      and reservation_expires_at is not null
      and reservation_expires_at > reserved_at
    )
  ),
  constraint customer_promotion_vouchers_used_order_shape check (
    used_at is null or used_order_id is not null
  )
);

create index if not exists customer_promotion_vouchers_customer_idx
  on public.customer_promotion_vouchers (customer_id, source, expires_at);

create index if not exists customer_promotion_vouchers_code_customer_idx
  on public.customer_promotion_vouchers (code, customer_id);

create index if not exists customer_promotion_vouchers_reservation_idx
  on public.customer_promotion_vouchers (reservation_token)
  where reservation_token is not null;

drop trigger if exists customer_promotion_vouchers_set_updated_at
  on public.customer_promotion_vouchers;
create trigger customer_promotion_vouchers_set_updated_at
before update on public.customer_promotion_vouchers
for each row execute function public.set_updated_at();

alter table public.customer_promotion_vouchers enable row level security;

revoke all on public.customer_promotion_vouchers from anon, authenticated;
grant select, insert, update, delete on public.customer_promotion_vouchers to service_role;
