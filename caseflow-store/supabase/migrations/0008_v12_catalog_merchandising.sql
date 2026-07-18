-- CaseFlow Books v1.2 catalog provenance, content quality, and merchandising.
-- This migration is intentionally additive and idempotent.
-- Production data upserts are planned separately and must run only after the
-- v1.2 pre-migration backup/count gate passes.

begin;

alter table public.book_editions
  add column if not exists pair_id uuid,
  add column if not exists paired_edition_id uuid,
  add column if not exists reason_to_read jsonb,
  add column if not exists display_facts jsonb not null default '[]'::jsonb,
  add column if not exists omitted_optional_fact_keys text[] not null default '{}'::text[],
  add column if not exists source_edition_key text,
  add column if not exists source_review_status text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'book_editions_paired_edition_id_fkey'
      and conrelid = 'public.book_editions'::regclass
  ) then
    alter table public.book_editions
      add constraint book_editions_paired_edition_id_fkey
      foreign key (paired_edition_id)
      references public.book_editions(id)
      on update cascade
      on delete set null
      not valid;
  end if;
end $$;

alter table public.book_editions
  drop constraint if exists book_editions_pair_not_self,
  add constraint book_editions_pair_not_self check (
    paired_edition_id is null or paired_edition_id <> id
  ),
  drop constraint if exists book_editions_reason_to_read_shape,
  add constraint book_editions_reason_to_read_shape check (
    reason_to_read is null
    or (
      jsonb_typeof(reason_to_read) = 'object'
      and char_length(coalesce(reason_to_read->>'vi', '')) between 1 and 1200
      and char_length(coalesce(reason_to_read->>'en', '')) between 1 and 1200
    )
  ),
  drop constraint if exists book_editions_display_facts_shape,
  add constraint book_editions_display_facts_shape check (
    jsonb_typeof(display_facts) = 'array'
  ),
  drop constraint if exists book_editions_source_review_status_check,
  add constraint book_editions_source_review_status_check check (
    source_review_status is null
    or source_review_status in ('draft', 'needs-review', 'approved', 'rejected')
  ),
  drop constraint if exists book_editions_source_edition_key_length,
  add constraint book_editions_source_edition_key_length check (
    source_edition_key is null
    or char_length(source_edition_key) between 3 and 180
  );

create index if not exists book_editions_pair_id_idx
  on public.book_editions (pair_id)
  where pair_id is not null;

create index if not exists book_editions_paired_edition_id_idx
  on public.book_editions (paired_edition_id)
  where paired_edition_id is not null;

create index if not exists book_editions_source_review_status_idx
  on public.book_editions (source_review_status)
  where source_review_status is not null;

create table if not exists public.book_catalog_provenance_records (
  id text primary key,
  entity_type text not null,
  entity_id uuid not null,
  field_key text not null,
  source_label text not null,
  source_url text,
  checked_at timestamptz not null,
  content_kind text not null,
  rights_basis text not null,
  rights_basis_note text not null,
  license jsonb,
  attribution jsonb not null,
  review_status text not null,
  reviewer_note text,
  reviewed_at timestamptz,
  edition_match_confidence text not null,
  source_edition_key text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint book_catalog_provenance_entity_type_check check (
    entity_type in (
      'author',
      'translator',
      'publisher',
      'work',
      'edition',
      'cover-asset'
    )
  ),
  constraint book_catalog_provenance_field_key_format check (
    field_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint book_catalog_provenance_source_url_format check (
    source_url is null or source_url ~ '^https?://.+'
  ),
  constraint book_catalog_provenance_content_kind_check check (
    content_kind in ('bibliographic-fact', 'project-written-text', 'media')
  ),
  constraint book_catalog_provenance_rights_basis_check check (
    rights_basis in (
      'factual-data',
      'project-created',
      'generated-original',
      'licensed',
      'public-domain'
    )
  ),
  constraint book_catalog_provenance_review_status_check check (
    review_status in ('draft', 'needs-review', 'approved', 'rejected')
  ),
  constraint book_catalog_provenance_reviewed_at_check check (
    (review_status in ('approved', 'rejected') and reviewed_at is not null)
    or (review_status in ('draft', 'needs-review') and reviewed_at is null)
  ),
  constraint book_catalog_provenance_match_confidence_check check (
    edition_match_confidence in (
      'not-applicable',
      'low',
      'medium',
      'high',
      'exact'
    )
  ),
  constraint book_catalog_provenance_attribution_shape check (
    jsonb_typeof(attribution) = 'object'
    and jsonb_typeof(attribution->'required') = 'boolean'
  ),
  constraint book_catalog_provenance_license_shape check (
    license is null or jsonb_typeof(license) = 'object'
  ),
  constraint book_catalog_provenance_bibliographic_rights_check check (
    content_kind <> 'bibliographic-fact'
    or (
      rights_basis = 'factual-data'
      and source_url is not null
      and source_edition_key is not null
      and edition_match_confidence <> 'not-applicable'
    )
  ),
  constraint book_catalog_provenance_project_text_rights_check check (
    content_kind <> 'project-written-text' or rights_basis = 'project-created'
  ),
  constraint book_catalog_provenance_media_rights_check check (
    content_kind <> 'media' or rights_basis <> 'factual-data'
  )
);

create index if not exists book_catalog_provenance_entity_idx
  on public.book_catalog_provenance_records (entity_type, entity_id);

create index if not exists book_catalog_provenance_review_status_idx
  on public.book_catalog_provenance_records (review_status);

create table if not exists public.book_content_quality_checks (
  id uuid primary key default gen_random_uuid(),
  edition_id uuid not null references public.book_editions(id)
    on update cascade
    on delete cascade,
  requirement text not null,
  requirement_level text not null,
  status text not null,
  provenance_record_id text,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (edition_id, requirement),
  constraint book_content_quality_requirement_level_check check (
    requirement_level in ('blocking', 'optional')
  ),
  constraint book_content_quality_status_check check (
    status in ('verified', 'missing', 'unverified', 'not-applicable')
  ),
  constraint book_content_quality_verified_requires_source check (
    status <> 'verified' or provenance_record_id is not null
  ),
  constraint book_content_quality_nonverified_note_check check (
    status = 'verified' or char_length(coalesce(note, '')) between 1 and 1000
  )
);

create index if not exists book_content_quality_checks_edition_idx
  on public.book_content_quality_checks (edition_id, requirement_level, status);

create table if not exists public.book_catalog_compatibility (
  id uuid primary key default gen_random_uuid(),
  legacy_entity_type text not null,
  legacy_id uuid not null,
  legacy_slug text not null,
  behavior text not null,
  target_slug text,
  reason jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (legacy_entity_type, legacy_id),
  unique (legacy_entity_type, legacy_slug),
  constraint book_catalog_compatibility_entity_type_check check (
    legacy_entity_type in ('work', 'edition')
  ),
  constraint book_catalog_compatibility_behavior_check check (
    behavior in ('preserved', 'redirect', 'retired-to-catalog')
  ),
  constraint book_catalog_compatibility_target_check check (
    (behavior = 'redirect' and target_slug is not null)
    or (behavior <> 'redirect' and target_slug is null)
  ),
  constraint book_catalog_compatibility_reason_shape check (
    jsonb_typeof(reason) = 'object'
    and char_length(coalesce(reason->>'vi', '')) between 1 and 600
    and char_length(coalesce(reason->>'en', '')) between 1 and 600
  )
);

create table if not exists public.book_merchandising_shelves (
  id uuid primary key,
  slug text not null unique,
  shelf_type text not null,
  source_kind text not null,
  labels jsonb not null,
  description jsonb not null,
  inclusion_rule jsonb not null,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default false,
  sort_order integer not null,
  min_items integer not null,
  max_items integer not null,
  fallback jsonb not null,
  required_permission text not null default 'merchandising:manage',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint book_merchandising_shelves_slug_format check (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint book_merchandising_shelves_type_check check (
    shelf_type in (
      'editorial-curation',
      'category-focus',
      'language-focus',
      'promotion-focus',
      'inventory-focus',
      'paired-editions',
      'order-derived'
    )
  ),
  constraint book_merchandising_shelves_source_kind_check check (
    source_kind in (
      'editorial',
      'catalog-rule',
      'promotion-rule',
      'inventory-rule',
      'order-derived'
    )
  ),
  constraint book_merchandising_shelves_order_source_guard check (
    (shelf_type = 'order-derived' and source_kind = 'order-derived')
    or (shelf_type <> 'order-derived' and source_kind <> 'order-derived')
  ),
  constraint book_merchandising_shelves_labels_shape check (
    jsonb_typeof(labels) = 'object'
    and char_length(coalesce(labels->>'vi', '')) between 1 and 120
    and char_length(coalesce(labels->>'en', '')) between 1 and 120
  ),
  constraint book_merchandising_shelves_description_shape check (
    jsonb_typeof(description) = 'object'
    and char_length(coalesce(description->>'vi', '')) between 1 and 500
    and char_length(coalesce(description->>'en', '')) between 1 and 500
  ),
  constraint book_merchandising_shelves_window check (
    starts_at is null or ends_at is null or starts_at < ends_at
  ),
  constraint book_merchandising_shelves_items check (
    min_items >= 0 and max_items > 0 and min_items <= max_items
  ),
  constraint book_merchandising_shelves_permission check (
    required_permission = 'merchandising:manage'
  )
);

create table if not exists public.book_merchandising_shelf_items (
  id uuid primary key,
  shelf_id uuid not null references public.book_merchandising_shelves(id)
    on update cascade
    on delete cascade,
  edition_id uuid not null references public.book_editions(id)
    on update cascade
    on delete restrict,
  position integer not null,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (shelf_id, edition_id),
  unique (shelf_id, position),
  constraint book_merchandising_shelf_items_position check (position > 0),
  constraint book_merchandising_shelf_items_note_length check (
    note is null or char_length(note) between 1 and 500
  )
);

create index if not exists book_merchandising_shelves_active_order_idx
  on public.book_merchandising_shelves (is_active, sort_order);

create index if not exists book_merchandising_shelf_items_shelf_order_idx
  on public.book_merchandising_shelf_items (shelf_id, is_active, position);

create index if not exists book_merchandising_shelf_items_edition_idx
  on public.book_merchandising_shelf_items (edition_id);

drop trigger if exists book_catalog_provenance_records_set_updated_at
  on public.book_catalog_provenance_records;
create trigger book_catalog_provenance_records_set_updated_at
before update on public.book_catalog_provenance_records
for each row execute function public.set_updated_at();

drop trigger if exists book_content_quality_checks_set_updated_at
  on public.book_content_quality_checks;
create trigger book_content_quality_checks_set_updated_at
before update on public.book_content_quality_checks
for each row execute function public.set_updated_at();

drop trigger if exists book_catalog_compatibility_set_updated_at
  on public.book_catalog_compatibility;
create trigger book_catalog_compatibility_set_updated_at
before update on public.book_catalog_compatibility
for each row execute function public.set_updated_at();

drop trigger if exists book_merchandising_shelves_set_updated_at
  on public.book_merchandising_shelves;
create trigger book_merchandising_shelves_set_updated_at
before update on public.book_merchandising_shelves
for each row execute function public.set_updated_at();

drop trigger if exists book_merchandising_shelf_items_set_updated_at
  on public.book_merchandising_shelf_items;
create trigger book_merchandising_shelf_items_set_updated_at
before update on public.book_merchandising_shelf_items
for each row execute function public.set_updated_at();

alter table public.book_catalog_provenance_records enable row level security;
alter table public.book_content_quality_checks enable row level security;
alter table public.book_catalog_compatibility enable row level security;
alter table public.book_merchandising_shelves enable row level security;
alter table public.book_merchandising_shelf_items enable row level security;

drop policy if exists "Public can read catalog compatibility"
  on public.book_catalog_compatibility;
create policy "Public can read catalog compatibility"
on public.book_catalog_compatibility
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read active merchandising shelves"
  on public.book_merchandising_shelves;
create policy "Public can read active merchandising shelves"
on public.book_merchandising_shelves
for select
to anon, authenticated
using (
  is_active = true
  and (starts_at is null or starts_at <= timezone('utc', now()))
  and (ends_at is null or ends_at > timezone('utc', now()))
);

drop policy if exists "Public can read active merchandising shelf items"
  on public.book_merchandising_shelf_items;
create policy "Public can read active merchandising shelf items"
on public.book_merchandising_shelf_items
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.book_merchandising_shelves
    where book_merchandising_shelves.id = book_merchandising_shelf_items.shelf_id
      and book_merchandising_shelves.is_active = true
      and (
        book_merchandising_shelves.starts_at is null
        or book_merchandising_shelves.starts_at <= timezone('utc', now())
      )
      and (
        book_merchandising_shelves.ends_at is null
        or book_merchandising_shelves.ends_at > timezone('utc', now())
      )
  )
);

grant usage on schema public to anon, authenticated;
grant select on public.book_catalog_compatibility to anon, authenticated;
grant select on public.book_merchandising_shelves to anon, authenticated;
grant select on public.book_merchandising_shelf_items to anon, authenticated;

revoke all on public.book_catalog_provenance_records from anon, authenticated;
revoke all on public.book_content_quality_checks from anon, authenticated;
revoke insert, update, delete on public.book_catalog_compatibility from anon, authenticated;
revoke insert, update, delete on public.book_merchandising_shelves from anon, authenticated;
revoke insert, update, delete on public.book_merchandising_shelf_items from anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.book_catalog_provenance_records to service_role;
grant select, insert, update, delete on public.book_content_quality_checks to service_role;
grant select, insert, update, delete on public.book_catalog_compatibility to service_role;
grant select, insert, update, delete on public.book_merchandising_shelves to service_role;
grant select, insert, update, delete on public.book_merchandising_shelf_items to service_role;

notify pgrst, 'reload schema';

commit;
