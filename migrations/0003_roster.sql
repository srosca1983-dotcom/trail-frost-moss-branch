-- Shipboard billets, watches, and due-off fields for M/V GEORGE II
create table if not exists vessel_billets (
  id text primary key,
  user_id text not null,
  code text not null,
  sort_order integer not null,
  title text not null,
  short_title text not null,
  department text not null,
  watch text,
  union_hall text not null,
  default_assignment text not null,
  notes text
);
create unique index if not exists vessel_billets_user_code on vessel_billets (user_id, code);
create index if not exists vessel_billets_user_idx on vessel_billets (user_id);

create table if not exists roster_meta (
  user_id text primary key,
  version integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table crew add column if not exists union_hall text;
alter table crew add column if not exists assignment_type text;
alter table crew add column if not exists seniority_class text;
alter table crew add column if not exists watch text;
alter table crew add column if not exists billet_code text;

alter table crew_tours add column if not exists watch text;
alter table crew_tours add column if not exists due_off text;
alter table crew_tours add column if not exists due_off_rule text;
alter table crew_tours add column if not exists billet_code text;
alter table crew_tours add column if not exists seniority_class text;
