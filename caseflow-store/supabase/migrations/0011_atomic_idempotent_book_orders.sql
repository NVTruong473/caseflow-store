-- Make one customer checkout attempt idempotent and consume an optional
-- account voucher in the same PostgreSQL transaction as the order.

begin;

alter table public.orders
  add column if not exists checkout_attempt_id uuid;

create unique index if not exists orders_customer_checkout_attempt_unique_idx
  on public.orders (customer_id, checkout_attempt_id)
  where customer_id is not null and checkout_attempt_id is not null;

-- Voucher đã dùng phải giữ liên kết lịch sử với order. ON DELETE SET NULL của
-- migration cũ mâu thuẫn với constraint used_order_shape và làm delete thất bại
-- ở thời điểm kiểm tra constraint; RESTRICT biểu đạt đúng policy lưu vết.
alter table public.customer_promotion_vouchers
  drop constraint if exists customer_promotion_vouchers_used_order_id_fkey,
  add constraint customer_promotion_vouchers_used_order_id_fkey
    foreign key (used_order_id)
    references public.orders(id)
    on update cascade
    on delete restrict;

create or replace function public.create_book_order_with_items_v2(
  p_checkout_attempt_id uuid,
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
  existing_order public.orders%rowtype;
  new_order public.orders%rowtype;
  inserted_items jsonb;
  voucher_update_count integer;
begin
  if p_customer_id is null then
    raise exception 'Customer account is required for CaseFlow Books checkout';
  end if;

  if p_checkout_attempt_id is null then
    raise exception 'Checkout attempt ID is required';
  end if;

  -- Một request retry phải nhận lại đúng đơn đã commit, không tạo đơn thứ hai.
  select *
  into existing_order
  from public.orders
  where customer_id = p_customer_id
    and checkout_attempt_id = p_checkout_attempt_id;

  if found then
    select coalesce(jsonb_agg(to_jsonb(order_item) order by order_item.id), '[]'::jsonb)
    into inserted_items
    from public.order_items as order_item
    where order_item.order_id = existing_order.id;

    return jsonb_build_object(
      'order', to_jsonb(existing_order),
      'items', inserted_items
    );
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

  if calculated_subtotal_vnd <= 0 then
    raise exception 'Calculated subtotal must be positive';
  end if;

  insert into public.orders (
    checkout_attempt_id,
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
    p_checkout_attempt_id,
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
  on conflict (customer_id, checkout_attempt_id)
    where customer_id is not null and checkout_attempt_id is not null
    do nothing
  returning * into new_order;

  -- Hai request đồng thời cùng attempt ID hội tụ về một order duy nhất.
  if new_order.id is null then
    select *
    into existing_order
    from public.orders
    where customer_id = p_customer_id
      and checkout_attempt_id = p_checkout_attempt_id;

    if existing_order.id is null then
      raise exception 'Failed to resolve idempotent checkout attempt';
    end if;

    select coalesce(jsonb_agg(to_jsonb(order_item) order by order_item.id), '[]'::jsonb)
    into inserted_items
    from public.order_items as order_item
    where order_item.order_id = existing_order.id;

    return jsonb_build_object(
      'order', to_jsonb(existing_order),
      'items', inserted_items
    );
  end if;

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

  -- Voucher và order phải commit hoặc rollback cùng nhau. Browser không thể
  -- quyết định quyền sở hữu hoặc trạng thái voucher.
  if exists (
    select 1
    from public.customer_promotion_vouchers
    where customer_id = p_customer_id
      and code = p_promotion_code
      and source = 'signup'
  ) then
    update public.customer_promotion_vouchers
    set
      reservation_expires_at = null,
      reservation_token = null,
      reserved_at = null,
      used_at = now(),
      used_order_id = new_order.id
    where customer_id = p_customer_id
      and code = p_promotion_code
      and source = 'signup'
      and used_at is null
      and expires_at > now()
      and (
        reservation_token is null
        or reservation_expires_at <= now()
      );

    get diagnostics voucher_update_count = row_count;

    if voucher_update_count <> 1 then
      raise exception 'Signup voucher is invalid, expired, reserved, or used';
    end if;
  end if;

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

revoke all on function public.create_book_order_with_items_v2(
  uuid,
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

grant execute on function public.create_book_order_with_items_v2(
  uuid,
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

commit;
