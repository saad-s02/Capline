create extension if not exists postgis;
create table buildings (
  id text primary key,
  geom geometry(MultiPolygon, 4326) not null,
  height_m double precision,
  height_source text
);
create index buildings_geom_idx on buildings using gist (geom);
create table companies (
  id text primary key,
  display_name text not null,
  legal_name text, website text, hq_address text,
  lng double precision, lat double precision,
  building_id text references buildings(id),
  wikidata_qid text, sec_cik text,
  weight_basis text not null default 'funding_total',
  status text not null default 'live'
);
create table metric_records (
  id bigserial primary key,
  company_id text references companies(id) on delete cascade,
  metric text not null, value double precision,
  value_min double precision, value_max double precision, bucket text,
  currency text default 'CAD', as_of date,
  source_type text not null, source_url text,
  confidence text not null, last_verified_at date
);
create table submissions (
  id bigserial primary key,
  kind text not null, payload jsonb not null,
  submitter_email text not null, submitter_domain_verified boolean default false,
  status text not null default 'pending', created_at timestamptz default now()
);
