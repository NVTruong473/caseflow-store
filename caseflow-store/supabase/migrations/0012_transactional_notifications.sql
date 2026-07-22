-- NOTIFY-T03: additive transactional notification outbox, customer inbox,
-- and hashed phone verification challenges.

begin;

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  event_type text not null,
  channel text not null,
  template_key text not null,
  customer_id uuid not null references public.profiles(id) on update cascade on delete cascade,
  order_id uuid references public.orders(id) on update cascade on delete restrict,
  status text not null default 'queued',
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default timezone('utc', now()),
  provider_message_id text,
  last_error_code text,
  rendered_preview jsonb,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint notification_outbox_event_channel_unique unique (event_key, channel),
  constraint notification_outbox_event_key_length check (char_length(event_key) between 8 and 180),
  constraint notification_outbox_event_type_check check (
    event_type in (
      'order.created',
      'order.confirmed',
      'order.cancelled',
      'payment.awaiting-transfer',
      'payment.confirmed',
      'payment.rejected',
      'shipping.shipped',
      'order.completed',
      'phone.verification-requested',
      'phone.verified'
    )
  ),
  constraint notification_outbox_channel_check check (channel in ('in-app', 'email', 'sms')),
  constraint notification_outbox_template_key_check check (
    template_key in (
      'order-created',
      'order-confirmed',
      'order-cancelled',
      'payment-awaiting-transfer',
      'payment-confirmed',
      'payment-rejected',
      'shipping-shipped',
      'order-completed',
      'phone-verification-code',
      'phone-verified'
    )
  ),
  constraint notification_outbox_status_check check (
    status in ('queued', 'processing', 'sent', 'blocked', 'failed')
  ),
  constraint notification_outbox_attempts_range check (attempts between 0 and 20),
  constraint notification_outbox_metadata_shape check (jsonb_typeof(metadata) = 'object'),
  constraint notification_outbox_preview_shape check (
    rendered_preview is null or jsonb_typeof(rendered_preview) = 'object'
  ),
  constraint notification_outbox_sent_shape check (
    (status = 'sent' and sent_at is not null)
    or (status <> 'sent')
  )
);

create index if not exists notification_outbox_dispatch_idx
  on public.notification_outbox (status, next_attempt_at, created_at);

create index if not exists notification_outbox_customer_idx
  on public.notification_outbox (customer_id, created_at desc);

create index if not exists notification_outbox_order_idx
  on public.notification_outbox (order_id, created_at desc)
  where order_id is not null;

create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on update cascade on delete cascade,
  outbox_id uuid not null references public.notification_outbox(id) on update cascade on delete cascade,
  order_id uuid references public.orders(id) on update cascade on delete restrict,
  event_type text not null,
  title jsonb not null,
  body jsonb not null,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint customer_notifications_outbox_unique unique (outbox_id),
  constraint customer_notifications_event_type_check check (
    event_type in (
      'order.created',
      'order.confirmed',
      'order.cancelled',
      'payment.awaiting-transfer',
      'payment.confirmed',
      'payment.rejected',
      'shipping.shipped',
      'order.completed',
      'phone.verification-requested',
      'phone.verified'
    )
  ),
  constraint customer_notifications_title_shape check (
    jsonb_typeof(title) = 'object'
    and char_length(coalesce(title->>'vi', '')) between 1 and 160
    and char_length(coalesce(title->>'en', '')) between 1 and 160
  ),
  constraint customer_notifications_body_shape check (
    jsonb_typeof(body) = 'object'
    and char_length(coalesce(body->>'vi', '')) between 1 and 600
    and char_length(coalesce(body->>'en', '')) between 1 and 600
  )
);

create index if not exists customer_notifications_customer_created_idx
  on public.customer_notifications (customer_id, created_at desc);

create index if not exists customer_notifications_customer_unread_idx
  on public.customer_notifications (customer_id, created_at desc)
  where read_at is null;

create table if not exists public.phone_verification_challenges (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on update cascade on delete cascade,
  phone text not null,
  otp_hash text not null,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint phone_verification_phone_format check (
    char_length(phone) between 7 and 24 and phone ~ '^[0-9+(). -]+$'
  ),
  constraint phone_verification_hash_length check (char_length(otp_hash) between 32 and 256),
  constraint phone_verification_attempts_range check (
    attempts between 0 and max_attempts and max_attempts between 1 and 10
  ),
  constraint phone_verification_expiry_order check (expires_at > created_at),
  constraint phone_verification_consumed_order check (
    consumed_at is null or consumed_at >= created_at
  )
);

create index if not exists phone_verification_customer_created_idx
  on public.phone_verification_challenges (customer_id, created_at desc);

create index if not exists phone_verification_expiry_idx
  on public.phone_verification_challenges (expires_at)
  where consumed_at is null;

drop trigger if exists notification_outbox_set_updated_at on public.notification_outbox;
create trigger notification_outbox_set_updated_at
before update on public.notification_outbox
for each row execute function public.set_updated_at();

alter table public.notification_outbox enable row level security;
alter table public.customer_notifications enable row level security;
alter table public.phone_verification_challenges enable row level security;

revoke all on public.notification_outbox from anon, authenticated;
revoke all on public.customer_notifications from anon, authenticated;
revoke all on public.phone_verification_challenges from anon, authenticated;

grant select, insert, update, delete on public.notification_outbox to service_role;
grant select, insert, update, delete on public.customer_notifications to service_role;
grant select, insert, update, delete on public.phone_verification_challenges to service_role;
grant select on public.customer_notifications to authenticated;

drop policy if exists "customer_notifications_read_own" on public.customer_notifications;
create policy "customer_notifications_read_own"
on public.customer_notifications
for select
to authenticated
using (customer_id = auth.uid());

create or replace function public.mark_customer_notifications_read(
  p_notification_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if p_notification_ids is null or cardinality(p_notification_ids) < 1
    or cardinality(p_notification_ids) > 100 then
    raise exception 'One to 100 notification IDs are required';
  end if;

  -- Chi cap nhat read_at cho inbox cua chinh session hien tai.
  update public.customer_notifications
  set read_at = coalesce(read_at, timezone('utc', now()))
  where customer_id = auth.uid()
    and id = any(p_notification_ids);

  get diagnostics changed_count = row_count;
  return changed_count;
end;
$$;

revoke all on function public.mark_customer_notifications_read(uuid[]) from public, anon;
grant execute on function public.mark_customer_notifications_read(uuid[]) to authenticated;

create or replace function public.claim_notification_outbox(p_limit integer default 25)
returns setof public.notification_outbox
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'Claim limit must be between 1 and 100';
  end if;

  -- SKIP LOCKED ngan hai worker cung claim va gui trung mot delivery.
  return query
  with candidates as (
    select notification.id
    from public.notification_outbox as notification
    where notification.status = 'queued'
      and notification.next_attempt_at <= timezone('utc', now())
    order by notification.created_at
    for update skip locked
    limit p_limit
  )
  update public.notification_outbox as notification
  set
    status = 'processing',
    attempts = notification.attempts + 1
  from candidates
  where notification.id = candidates.id
  returning notification.*;
end;
$$;

revoke all on function public.claim_notification_outbox(integer)
  from public, anon, authenticated;
grant execute on function public.claim_notification_outbox(integer) to service_role;

create or replace function public.create_phone_verification_challenge(
  p_challenge_id uuid,
  p_customer_id uuid,
  p_phone text,
  p_otp_hash text,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_count integer;
  new_outbox_id uuid;
begin
  if not exists (
    select 1
    from public.profiles
    where id = p_customer_id
      and role = 'customer'
      and phone = p_phone
  ) then
    return jsonb_build_object('status', 'profile-mismatch');
  end if;

  select count(*)::integer
  into recent_count
  from public.phone_verification_challenges
  where customer_id = p_customer_id
    and created_at >= timezone('utc', now()) - interval '15 minutes';

  if recent_count >= 3 then
    return jsonb_build_object('status', 'rate-limited');
  end if;

  update public.phone_verification_challenges
  set consumed_at = timezone('utc', now())
  where customer_id = p_customer_id
    and consumed_at is null;

  insert into public.phone_verification_challenges (
    id,
    customer_id,
    phone,
    otp_hash,
    expires_at
  )
  values (
    p_challenge_id,
    p_customer_id,
    p_phone,
    p_otp_hash,
    p_expires_at
  );

  insert into public.notification_outbox (
    event_key,
    event_type,
    channel,
    template_key,
    customer_id,
    status,
    attempts,
    metadata
  )
  values (
    concat('phone:', p_customer_id::text, ':challenge:', p_challenge_id::text),
    'phone.verification-requested',
    'sms',
    'phone-verification-code',
    p_customer_id,
    'processing',
    1,
    jsonb_build_object('challengeId', p_challenge_id::text)
  )
  returning id into new_outbox_id;

  return jsonb_build_object(
    'status', 'created',
    'challengeId', p_challenge_id,
    'outboxId', new_outbox_id,
    'expiresAt', p_expires_at
  );
end;
$$;

revoke all on function public.create_phone_verification_challenge(
  uuid, uuid, text, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.create_phone_verification_challenge(
  uuid, uuid, text, text, timestamptz
) to service_role;

create or replace function public.verify_phone_challenge(
  p_challenge_id uuid,
  p_customer_id uuid,
  p_otp_hash text,
  p_verified_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  challenge public.phone_verification_challenges%rowtype;
  verification_outbox_id uuid;
begin
  select *
  into challenge
  from public.phone_verification_challenges
  where id = p_challenge_id
    and customer_id = p_customer_id
  for update;

  if not found then
    return jsonb_build_object('status', 'not-found');
  end if;

  if challenge.consumed_at is not null then
    return jsonb_build_object('status', 'consumed');
  end if;

  if challenge.expires_at <= timezone('utc', now()) then
    update public.phone_verification_challenges
    set consumed_at = timezone('utc', now())
    where id = challenge.id;
    return jsonb_build_object('status', 'expired');
  end if;

  if challenge.attempts >= challenge.max_attempts then
    return jsonb_build_object('status', 'locked');
  end if;

  -- Chi so sanh HMAC; ma OTP ro khong bao gio vao database.
  if challenge.otp_hash <> p_otp_hash then
    update public.phone_verification_challenges
    set
      attempts = attempts + 1,
      consumed_at = case
        when attempts + 1 >= max_attempts then timezone('utc', now())
        else consumed_at
      end
    where id = challenge.id;
    return jsonb_build_object('status', 'invalid');
  end if;

  update public.phone_verification_challenges
  set consumed_at = p_verified_at
  where id = challenge.id;

  update public.profiles
  set
    phone = challenge.phone,
    phone_verified_at = p_verified_at
  where id = p_customer_id
    and role = 'customer';

  insert into public.notification_outbox (
    event_key,
    event_type,
    channel,
    template_key,
    customer_id,
    status,
    attempts,
    sent_at,
    metadata
  )
  values (
    concat('phone:', p_customer_id::text, ':verified:', p_challenge_id::text),
    'phone.verified',
    'in-app',
    'phone-verified',
    p_customer_id,
    'sent',
    1,
    p_verified_at,
    '{}'::jsonb
  )
  on conflict (event_key, channel) do nothing
  returning id into verification_outbox_id;

  if verification_outbox_id is not null then
    insert into public.customer_notifications (
      customer_id,
      outbox_id,
      event_type,
      title,
      body
    )
    values (
      p_customer_id,
      verification_outbox_id,
      'phone.verified',
      '{"vi":"Số điện thoại đã được xác nhận","en":"Phone number verified"}'::jsonb,
      '{"vi":"Số điện thoại trong tài khoản đã được xác nhận.","en":"Your account phone number has been verified."}'::jsonb
    );
  end if;

  return jsonb_build_object('status', 'verified', 'phone', challenge.phone);
end;
$$;

revoke all on function public.verify_phone_challenge(
  uuid, uuid, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.verify_phone_challenge(
  uuid, uuid, text, timestamptz
) to service_role;

create or replace function public.enqueue_order_notification_event(
  p_order_id uuid,
  p_customer_id uuid,
  p_order_code text,
  p_event_type text,
  p_template_key text,
  p_title_vi text,
  p_title_en text,
  p_body_vi text,
  p_body_en text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_event_key text;
  channel_name text;
  inserted_outbox_id uuid;
begin
  if p_customer_id is null then
    return;
  end if;

  base_event_key := concat('order:', p_order_id::text, ':', replace(p_event_type, '.', '-'));

  -- Inbox duoc ghi trong cung transaction voi order; email/SMS chi vao outbox.
  insert into public.notification_outbox (
    event_key,
    event_type,
    channel,
    template_key,
    customer_id,
    order_id,
    status,
    attempts,
    sent_at,
    metadata
  )
  values (
    base_event_key,
    p_event_type,
    'in-app',
    p_template_key,
    p_customer_id,
    p_order_id,
    'sent',
    1,
    timezone('utc', now()),
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('orderCode', p_order_code)
  )
  on conflict (event_key, channel) do nothing
  returning id into inserted_outbox_id;

  if inserted_outbox_id is not null then
    insert into public.customer_notifications (
      customer_id,
      outbox_id,
      order_id,
      event_type,
      title,
      body
    )
    values (
      p_customer_id,
      inserted_outbox_id,
      p_order_id,
      p_event_type,
      jsonb_build_object('vi', p_title_vi, 'en', p_title_en),
      jsonb_build_object('vi', p_body_vi, 'en', p_body_en)
    )
    on conflict (outbox_id) do nothing;
  end if;

  foreach channel_name in array array['email', 'sms'] loop
    insert into public.notification_outbox (
      event_key,
      event_type,
      channel,
      template_key,
      customer_id,
      order_id,
      metadata
    )
    values (
      base_event_key,
      p_event_type,
      channel_name,
      p_template_key,
      p_customer_id,
      p_order_id,
      coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('orderCode', p_order_code)
    )
    on conflict (event_key, channel) do nothing;
  end loop;
end;
$$;

revoke all on function public.enqueue_order_notification_event(
  uuid, uuid, text, text, text, text, text, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.enqueue_order_notification_event(
  uuid, uuid, text, text, text, text, text, text, text, jsonb
) to service_role;

create or replace function public.enqueue_order_notification_events_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.enqueue_order_notification_event(
      new.id, new.customer_id, new.order_code,
      'order.created', 'order-created',
      'Đơn hàng đã được tiếp nhận', 'Order received',
      concat('CaseFlow Books đã tiếp nhận đơn ', new.order_code, '.'),
      concat('CaseFlow Books has received order ', new.order_code, '.'),
      jsonb_build_object('paymentMethod', new.payment_method)
    );

    if new.payment_status = 'awaiting-transfer' then
      perform public.enqueue_order_notification_event(
        new.id, new.customer_id, new.order_code,
        'payment.awaiting-transfer', 'payment-awaiting-transfer',
        'Đang chờ xác nhận chuyển khoản', 'Awaiting transfer confirmation',
        concat('Đơn ', new.order_code, ' đang chờ bộ phận vận hành xác nhận chuyển khoản.'),
        concat('Order ', new.order_code, ' is awaiting transfer confirmation by our operations team.'),
        jsonb_build_object('paymentMethod', new.payment_method)
      );
    end if;

    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'confirmed' then
      perform public.enqueue_order_notification_event(
        new.id, new.customer_id, new.order_code,
        'order.confirmed', 'order-confirmed',
        'Đơn hàng đã được xác nhận', 'Order confirmed',
        concat('Đơn ', new.order_code, ' đã được xác nhận và đang được xử lý.'),
        concat('Order ', new.order_code, ' has been confirmed and is being processed.'),
        '{}'::jsonb
      );
    elsif new.status = 'cancelled' then
      perform public.enqueue_order_notification_event(
        new.id, new.customer_id, new.order_code,
        'order.cancelled', 'order-cancelled',
        'Đơn hàng đã hủy', 'Order cancelled',
        concat('Đơn ', new.order_code, ' đã được hủy. Lịch sử đơn vẫn được lưu trong tài khoản.'),
        concat('Order ', new.order_code, ' was cancelled. Its history remains in your account.'),
        '{}'::jsonb
      );
    elsif new.status = 'completed' then
      perform public.enqueue_order_notification_event(
        new.id, new.customer_id, new.order_code,
        'order.completed', 'order-completed',
        'Đơn hàng đã hoàn tất', 'Order completed',
        concat('Đơn ', new.order_code, ' đã hoàn tất.'),
        concat('Order ', new.order_code, ' is complete.'),
        '{}'::jsonb
      );
    end if;
  end if;

  if new.payment_status is distinct from old.payment_status then
    if new.payment_status = 'confirmed' then
      perform public.enqueue_order_notification_event(
        new.id, new.customer_id, new.order_code,
        'payment.confirmed', 'payment-confirmed',
        'Thanh toán đã được xác nhận', 'Payment confirmed',
        concat('Thanh toán cho đơn ', new.order_code, ' đã được xác nhận.'),
        concat('Payment for order ', new.order_code, ' has been confirmed.'),
        '{}'::jsonb
      );
    elsif new.payment_status in ('failed', 'cancelled') then
      perform public.enqueue_order_notification_event(
        new.id, new.customer_id, new.order_code,
        'payment.rejected', 'payment-rejected',
        'Thanh toán chưa được chấp nhận', 'Payment not accepted',
        concat('Thanh toán cho đơn ', new.order_code, ' chưa được chấp nhận. Vui lòng xem lại chi tiết đơn.'),
        concat('Payment for order ', new.order_code, ' was not accepted. Please review the order details.'),
        '{}'::jsonb
      );
    end if;
  end if;

  if new.shipping_status is distinct from old.shipping_status
    and new.shipping_status = 'shipped' then
    perform public.enqueue_order_notification_event(
      new.id, new.customer_id, new.order_code,
      'shipping.shipped', 'shipping-shipped',
      'Đơn hàng đang được giao', 'Order shipped',
      concat('Đơn ', new.order_code, ' đã được bàn giao cho đơn vị vận chuyển.'),
      concat('Order ', new.order_code, ' has been handed to the delivery service.'),
      '{}'::jsonb
    );
  end if;

  return new;
end;
$$;

revoke all on function public.enqueue_order_notification_events_trigger()
  from public, anon, authenticated;

drop trigger if exists orders_enqueue_notification_events on public.orders;
create trigger orders_enqueue_notification_events
after insert or update of status, payment_status, shipping_status on public.orders
for each row execute function public.enqueue_order_notification_events_trigger();

commit;
