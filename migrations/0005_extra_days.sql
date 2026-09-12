-- Extra days on a tour shift due-off without wiping the union/set-date rule.
alter table crew_tours add column if not exists extra_days integer not null default 0;
