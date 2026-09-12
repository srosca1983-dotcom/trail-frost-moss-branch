-- Lookups for a large ledger: open tours, tickets by person, matching on MMC / last 4 / name.
create index if not exists crew_tours_user_crew_idx on crew_tours (user_id, crew_id);
create index if not exists crew_tours_open_idx on crew_tours (user_id, crew_id) where sign_off is null;
create index if not exists crew_tours_sign_on_idx on crew_tours (user_id, sign_on desc);
create index if not exists crew_docs_user_crew_idx on crew_documents (user_id, crew_id);
create index if not exists crew_mmc_idx on crew (user_id, mmc_number);
create index if not exists crew_ssn_idx on crew (user_id, ss_last4);
create index if not exists crew_passport_idx on crew (user_id, passport_number);
create index if not exists crew_name_dob_idx on crew (user_id, last_name, dob);
