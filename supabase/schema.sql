create table if not exists public.sets (
  id text primary key,
  device_id text not null,
  workout_type text,
  weight_lb double precision,
  weight_is_bodyweight boolean default false,
  reps integer,
  rest_seconds integer,
  duration_seconds integer,
  performed_at_iso timestamptz,
  created_at_iso timestamptz not null default now(),
  updated_at_iso timestamptz not null default now()
);

create index if not exists sets_device_id_idx on public.sets (device_id);
