-- PAYQR-T01: additive QR demo payment sessions.
-- This migration does not connect to any real bank, wallet, or payment
-- provider. It only stores server-owned demo payment sessions and their
-- idempotent status transitions.

alter table public.orders
  drop constraint if exists orders_payment_status_check,
  add constraint orders_payment_status_check check (
    payment_status in (
      'pending',
      'awaiting-transfer',
      'awaiting-provider-confirmation',
      'confirmed',
      'expired',
      'failed',
      'cancelled'
    )
  );

create table if not exists public.payments (
  id text primary key,
  order_id uuid not null references public.orders(id) on update cascade on delete restrict,
  provider text not null,
  amount integer not null,
  currency text not null default 'VND',
  status text not null default 'PENDING',
  qr_payload text not null,
  payment_reference text not null,
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint payments_id_format check (id ~ '^pay_[a-z0-9][a-z0-9_-]{8,80}$'),
  constraint payments_provider_check check (provider in ('MOCK_GATEWAY', 'DEMO_VIETQR')),
  constraint payments_amount_positive check (amount > 0 and amount <= 999999999),
  constraint payments_currency_check check (currency = 'VND'),
  constraint payments_status_check check (
    status in ('PENDING', 'PAID', 'EXPIRED', 'FAILED', 'CANCELLED')
  ),
  constraint payments_reference_format check (
    payment_reference ~ '^CFPAY-[A-Z0-9-]{8,80}$'
  ),
  constraint payments_qr_payload_length check (char_length(qr_payload) between 10 and 4096),
  constraint payments_paid_at_status_check check (
    (status = 'PAID' and paid_at is not null)
    or (status <> 'PAID' and paid_at is null)
  )
);

create unique index if not exists payments_payment_reference_key
  on public.payments (payment_reference);

create index if not exists payments_order_created_idx
  on public.payments (order_id, created_at desc);

create index if not exists payments_status_expires_idx
  on public.payments (status, expires_at);

create unique index if not exists payments_one_pending_per_order_idx
  on public.payments (order_id)
  where status = 'PENDING';

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();

alter table public.payments enable row level security;

drop policy if exists "payments_customer_read_own" on public.payments;
create policy "payments_customer_read_own"
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = payments.order_id
      and orders.customer_id = auth.uid()
  )
);

revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;
grant select, insert, update, delete on public.payments to service_role;

create or replace function public.mark_demo_payment_paid(
  p_payment_id text,
  p_paid_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_payment public.payments%rowtype;
  linked_order public.orders%rowtype;
begin
  select *
  into existing_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found';
  end if;

  select *
  into linked_order
  from public.orders
  where id = existing_payment.order_id
  for update;

  if not found then
    raise exception 'Linked order not found';
  end if;

  if existing_payment.status = 'PAID' then
    return jsonb_build_object(
      'changed', false,
      'payment_id', existing_payment.id,
      'payment_status', existing_payment.status,
      'order_id', linked_order.id,
      'order_status', linked_order.status,
      'order_payment_status', linked_order.payment_status
    );
  end if;

  if existing_payment.status <> 'PENDING' then
    raise exception 'Payment status transition is not allowed';
  end if;

  if existing_payment.expires_at <= timezone('utc', now()) then
    update public.payments
    set status = 'EXPIRED'
    where id = existing_payment.id;

    update public.orders
    set payment_status = 'expired'
    where id = linked_order.id
      and payment_status <> 'cancelled';

    raise exception 'Payment has expired';
  end if;

  if linked_order.status = 'cancelled' or linked_order.payment_status = 'cancelled' then
    raise exception 'Cancelled order cannot be paid';
  end if;

  update public.payments
  set
    status = 'PAID',
    paid_at = p_paid_at
  where id = existing_payment.id
  returning * into existing_payment;

  update public.orders
  set
    status = case
      when status = 'pending' then 'confirmed'
      else status
    end,
    payment_status = 'confirmed'
  where id = linked_order.id
  returning * into linked_order;

  return jsonb_build_object(
    'changed', true,
    'payment_id', existing_payment.id,
    'payment_status', existing_payment.status,
    'order_id', linked_order.id,
    'order_status', linked_order.status,
    'order_payment_status', linked_order.payment_status
  );
end;
$$;

revoke all on function public.mark_demo_payment_paid(text, timestamptz) from public;
grant execute on function public.mark_demo_payment_paid(text, timestamptz) to service_role;
