create extension if not exists pgcrypto;

create table if not exists app_user (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text unique,
  display_name text not null,
  role text not null default 'USER',
  is_admin boolean not null default false,
  status text not null default 'PENDING',
  password_hash text,
  approved_by uuid references app_user(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table app_user add column if not exists email text;
alter table app_user add column if not exists is_admin boolean not null default false;
alter table app_user add column if not exists status text not null default 'PENDING';
alter table app_user add column if not exists password_hash text;
alter table app_user add column if not exists approved_by uuid references app_user(id) on delete set null;
alter table app_user add column if not exists approved_at timestamptz;

create unique index if not exists app_user_email_unique_idx on app_user (lower(email)) where email is not null;

create sequence if not exists offer_no_seq start 1;

create or replace function next_offer_no()
returns text
language sql
as $$
  select 'NTT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('offer_no_seq')::text, 6, '0');
$$;

create table if not exists offer (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_user(id) on delete set null,
  offer_no text not null unique default next_offer_no(),
  title text not null,
  customer_name text,
  project_name text,
  industry text,
  implementation_type text,
  system_type text,
  status text not null default 'DRAFT',
  total_effort numeric not null default 0,
  project_definition jsonb not null default '{}'::jsonb,
  scope_answers jsonb not null default '{}'::jsonb,
  development_answers jsonb not null default '{}'::jsonb,
  module_selection jsonb not null default '{}'::jsonb,
  localization_selection jsonb not null default '{}'::jsonb,
  hypercare_inputs jsonb not null default '{}'::jsonb,
  final_effort jsonb not null default '{}'::jsonb,
  submitted_by uuid references app_user(id) on delete set null,
  submitted_at timestamptz,
  approved_by uuid references app_user(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

update offer
set offer_no = 'NTT-' || substring(offer_no from 5)
where offer_no like 'EST-%';

create index if not exists offer_user_updated_idx on offer (user_id, updated_at desc);
create index if not exists offer_status_idx on offer (status);

alter table offer
  alter column total_effort type numeric
  using total_effort::numeric;

alter table offer add column if not exists submitted_by uuid references app_user(id) on delete set null;
alter table offer add column if not exists submitted_at timestamptz;
alter table offer add column if not exists approved_by uuid references app_user(id) on delete set null;
alter table offer add column if not exists approved_at timestamptz;

create table if not exists admin_config (
  entity text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
