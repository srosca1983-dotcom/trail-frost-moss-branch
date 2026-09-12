-- This port / next port for the GEORGE II run (Long Beach ↔ Honolulu).
create table if not exists vessel_run (
  user_id text primary key,
  this_port text not null default 'Long Beach',
  next_port text not null default 'Honolulu',
  eta text,
  voyage_number text,
  updated_at timestamptz not null default now()
);
