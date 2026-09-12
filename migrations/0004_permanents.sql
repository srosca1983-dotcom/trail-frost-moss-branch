-- Permanent rating vs sailing rank; editable NS5-style seats
alter table crew add column if not exists permanent_rating text;

create table if not exists vessel_permanent_slots (
  id text primary key,
  user_id text not null,
  slot_key text not null,
  rating text not null,
  title text not null,
  seat text not null,
  union_hall text not null,
  sailing_billet text,
  on_sheet boolean not null default true,
  sheet_name text,
  sort_order integer not null,
  crew_id text,
  notes text,
  updated_at timestamptz not null default now()
);
create unique index if not exists vessel_permanent_slots_user_key on vessel_permanent_slots (user_id, slot_key);
create index if not exists vessel_permanent_slots_user_idx on vessel_permanent_slots (user_id);
create index if not exists vessel_permanent_slots_crew_idx on vessel_permanent_slots (crew_id);

create table if not exists permanent_events (
  id text primary key,
  user_id text not null,
  slot_id text not null,
  crew_id text,
  event_type text not null,
  reason text,
  from_rating text,
  to_rating text,
  notes text,
  occurred_on text,
  created_at timestamptz not null default now()
);
create index if not exists permanent_events_user_idx on permanent_events (user_id);
create index if not exists permanent_events_slot_idx on permanent_events (slot_id);
