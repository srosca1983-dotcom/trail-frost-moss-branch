-- Packet inbox read log so a crash still shows what already filed.
create table if not exists inbox_log (
  id text primary key,
  user_id text not null,
  filename text not null,
  crew_id text,
  full_name text,
  created boolean not null default false,
  error text,
  logged_at timestamptz not null default now()
);
create index if not exists inbox_log_user_idx on inbox_log (user_id, logged_at desc);
