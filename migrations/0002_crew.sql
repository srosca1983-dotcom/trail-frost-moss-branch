-- Crew ledger for Sunrise Vessel Operations / M/V GEORGE II
create table if not exists crew (
  id text primary key,
  user_id text not null,
  full_name text not null,
  first_name text,
  last_name text,
  middle_name text,
  ss_last4 text,
  dob text,
  sex text,
  place_of_birth text,
  citizenship text,
  race text,
  hair_color text,
  eye_color text,
  height text,
  weight text,
  address_line text,
  city text,
  state text,
  zip text,
  home_phone text,
  cell_phone text,
  email text,
  nearest_airport text,
  airport_code text,
  maritime_college text,
  year_graduated text,
  combat_veteran boolean not null default false,
  marital_status text,
  mmc_number text,
  mmc_place_of_issue text,
  mmc_expiration text,
  passport_number text,
  passport_expiration text,
  status text not null default 'past',
  last_position text,
  last_vessel text default 'M/V GEORGE II',
  glasses boolean not null default false,
  spare_glasses boolean not null default false,
  allergies text,
  medications text,
  medical_remarks text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crew_user_id_idx on crew (user_id);
create index if not exists crew_status_idx on crew (user_id, status);
create index if not exists crew_name_idx on crew (user_id, last_name);

create table if not exists crew_nok (
  id text primary key,
  user_id text not null,
  crew_id text not null references crew(id) on delete cascade,
  full_name text not null,
  relationship text,
  address_line text,
  city text,
  state text,
  zip text,
  phone text,
  cell_phone text
);
create index if not exists crew_nok_crew_idx on crew_nok (crew_id);

create table if not exists crew_documents (
  id text primary key,
  user_id text not null,
  crew_id text not null references crew(id) on delete cascade,
  doc_type text not null,
  label text not null,
  doc_number text,
  issued_on text,
  expires_on text,
  notes text,
  source_packet text
);
create index if not exists crew_docs_crew_idx on crew_documents (crew_id);
create index if not exists crew_docs_exp_idx on crew_documents (user_id, expires_on);

create table if not exists crew_tours (
  id text primary key,
  user_id text not null,
  crew_id text not null references crew(id) on delete cascade,
  vessel text not null default 'M/V GEORGE II',
  position text,
  sign_on text,
  sign_off text,
  port text,
  relieving text,
  assignment_type text,
  length_days integer,
  dispatch_ref text,
  union_hall text,
  notes text
);
create index if not exists crew_tours_crew_idx on crew_tours (crew_id);

create table if not exists crew_forms (
  id text primary key,
  user_id text not null,
  crew_id text not null references crew(id) on delete cascade,
  tour_id text,
  form_code text not null,
  form_label text not null,
  completed_on text,
  present boolean not null default true
);
create index if not exists crew_forms_crew_idx on crew_forms (crew_id);

create table if not exists sign_on_requirements (
  id text primary key,
  user_id text not null,
  code text not null,
  label text not null,
  kind text not null,
  applies_to text not null default 'all',
  required boolean not null default true,
  source text not null default 'sro',
  sort_order integer not null default 0,
  notes text
);
create unique index if not exists sign_on_req_user_code on sign_on_requirements (user_id, code);

create table if not exists sms_sync (
  user_id text primary key,
  last_synced_at timestamptz,
  source_url text,
  snapshot_json text,
  status text
);
