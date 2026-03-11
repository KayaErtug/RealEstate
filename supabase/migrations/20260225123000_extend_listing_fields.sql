-- Extend properties and vehicles with richer fields

-- PROPERTIES
alter table public.properties
  add column if not exists net_area numeric,
  add column if not exists gross_area numeric,
  add column if not exists heating text,
  add column if not exists dues numeric,
  add column if not exists frontage text,
  add column if not exists deed_status text,
  add column if not exists usage_status text,
  add column if not exists in_site boolean not null default false,
  add column if not exists site_name text,
  add column if not exists balcony_count integer,
  add column if not exists pool boolean not null default false,
  add column if not exists security boolean not null default false;

-- VEHICLES
alter table public.vehicles
  add column if not exists body_type text,
  add column if not exists color text,
  add column if not exists engine text,
  add column if not exists engine_power_hp integer,
  add column if not exists drive_type text,
  add column if not exists doors integer,
  add column if not exists seats integer,
  add column if not exists damage_status text,
  add column if not exists swap_available boolean not null default false;
