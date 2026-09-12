-- Rotary MMP/MEBA leave pauses the 120/90-day assignment. One leave per tour.
alter table crew_tours add column if not exists leave_days integer not null default 0;
alter table crew_tours add column if not exists leave_count integer not null default 0;
alter table crew_tours add column if not exists leave_started_on text;
