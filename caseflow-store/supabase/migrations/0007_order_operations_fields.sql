-- D37-T03 order operations fields.
-- Additive only: existing orders receive pending shipping status and empty
-- internal notes so legacy checkout/order rows remain valid.

alter table public.orders
  add column if not exists shipping_status text not null default 'pending',
  add column if not exists internal_notes text not null default '';

alter table public.orders
  drop constraint if exists orders_shipping_status_check,
  add constraint orders_shipping_status_check check (
    shipping_status in (
      'pending',
      'preparing',
      'shipped',
      'delivered',
      'returned',
      'cancelled'
    )
  ),
  drop constraint if exists orders_internal_notes_length,
  add constraint orders_internal_notes_length check (
    char_length(internal_notes) <= 2000
  );

create index if not exists orders_shipping_status_idx
  on public.orders (shipping_status);
