create extension if not exists pgcrypto;

create table if not exists app_user (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  display_name text not null,
  role text not null default 'USER',
  created_at timestamptz not null default now()
);

create sequence if not exists offer_no_seq start 1;

create or replace function next_offer_no()
returns text
language sql
as $$
  select 'EST-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('offer_no_seq')::text, 6, '0');
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists offer_user_updated_idx on offer (user_id, updated_at desc);
create index if not exists offer_status_idx on offer (status);

create table if not exists admin_config (
  entity text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into app_user (username, display_name, role)
values ('ufuk.turcan', 'Ufuk Turcan', 'ADMIN')
on conflict (username) do update
set display_name = excluded.display_name,
    role = excluded.role;
