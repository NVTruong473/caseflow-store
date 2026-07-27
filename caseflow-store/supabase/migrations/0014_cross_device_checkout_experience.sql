begin;

create table if not exists public.checkout_experience_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  client_request_id uuid not null,
  token_hash text not null unique
    check (token_hash ~ '^[a-f0-9]{64}$'),
  confirmation_code_hash text not null
    check (confirmation_code_hash ~ '^[a-f0-9]{64}$'),
  confirmation_code_salt text not null
    check (confirmation_code_salt ~ '^[a-f0-9]{64}$'),
  cart_fingerprint text not null
    check (cart_fingerprint ~ '^[a-f0-9]{64}$'),
  amount_vnd integer not null check (amount_vnd between 1 and 100000000),
  currency text not null default 'VND' check (currency = 'VND'),
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'expired', 'locked', 'cancelled')),
  transfer_content text not null unique
    check (char_length(transfer_content) between 8 and 40),
  failed_attempts smallint not null default 0
    check (failed_attempts between 0 and 5),
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (customer_id, client_request_id),
  check (expires_at > created_at),
  check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index if not exists checkout_experience_sessions_customer_created_idx
  on public.checkout_experience_sessions (customer_id, created_at desc);

create index if not exists checkout_experience_sessions_expiry_idx
  on public.checkout_experience_sessions (status, expires_at)
  where status = 'pending';

drop trigger if exists checkout_experience_sessions_set_updated_at
  on public.checkout_experience_sessions;
create trigger checkout_experience_sessions_set_updated_at
before update on public.checkout_experience_sessions
for each row execute function public.set_updated_at();

alter table public.checkout_experience_sessions enable row level security;

revoke all on public.checkout_experience_sessions from public, anon, authenticated;
grant select, insert, update, delete
  on public.checkout_experience_sessions to service_role;

create or replace function public.complete_checkout_experience_session(
  p_token_hash text,
  p_amount_vnd integer,
  p_confirmation_code_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  session_record public.checkout_experience_sessions%rowtype;
  next_attempts smallint;
begin
  select *
  into session_record
  from public.checkout_experience_sessions
  where token_hash = p_token_hash
  for update;

  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;

  if session_record.status = 'completed' then
    return jsonb_build_object(
      'result', 'completed',
      'status', session_record.status,
      'completedAt', session_record.completed_at,
      'failedAttempts', session_record.failed_attempts
    );
  end if;

  if session_record.status <> 'pending' then
    return jsonb_build_object(
      'result', 'invalid_state',
      'status', session_record.status,
      'failedAttempts', session_record.failed_attempts
    );
  end if;

  if session_record.expires_at <= timezone('utc', now()) then
    update public.checkout_experience_sessions
    set status = 'expired'
    where id = session_record.id;

    return jsonb_build_object(
      'result', 'expired',
      'status', 'expired',
      'failedAttempts', session_record.failed_attempts
    );
  end if;

  if session_record.failed_attempts >= 5 then
    update public.checkout_experience_sessions
    set status = 'locked'
    where id = session_record.id;

    return jsonb_build_object(
      'result', 'locked',
      'status', 'locked',
      'failedAttempts', session_record.failed_attempts
    );
  end if;

  if
    session_record.amount_vnd <> p_amount_vnd
    or session_record.confirmation_code_hash <> p_confirmation_code_hash
  then
    next_attempts := least(session_record.failed_attempts + 1, 5);

    update public.checkout_experience_sessions
    set
      failed_attempts = next_attempts,
      status = case when next_attempts >= 5 then 'locked' else 'pending' end
    where id = session_record.id;

    return jsonb_build_object(
      'result', case when next_attempts >= 5 then 'locked' else 'invalid_confirmation' end,
      'status', case when next_attempts >= 5 then 'locked' else 'pending' end,
      'failedAttempts', next_attempts
    );
  end if;

  update public.checkout_experience_sessions
  set
    status = 'completed',
    completed_at = timezone('utc', now())
  where id = session_record.id
  returning * into session_record;

  return jsonb_build_object(
    'result', 'completed',
    'status', session_record.status,
    'completedAt', session_record.completed_at,
    'failedAttempts', session_record.failed_attempts
  );
end;
$$;

revoke all on function public.complete_checkout_experience_session(
  text,
  integer,
  text
) from public, anon, authenticated;
grant execute on function public.complete_checkout_experience_session(
  text,
  integer,
  text
) to service_role;

commit;
