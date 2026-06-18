-- Denis: app de organización de estudio para medicina

create extension if not exists "pgcrypto";

-- Materias
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#2d6a6a',
  created_at timestamptz not null default now()
);

-- Archivos por materia
create table if not exists subject_files (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  name text not null,
  file_type text not null check (file_type in ('program', 'book', 'presentation', 'other')),
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

-- Temas del programa
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  title text not null,
  sort_order int not null default 0,
  source_file_id uuid references subject_files(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Eventos del calendario
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete set null,
  title text not null,
  event_type text not null check (event_type in ('parcial', 'final', 'presentacion', 'otro')),
  event_date date not null,
  event_time time,
  notes text,
  created_at timestamptz not null default now()
);

-- Entradas del planner semanal
create table if not exists planner_entries (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  planned_date date not null,
  read_done boolean not null default false,
  studied_done boolean not null default false,
  reviewed_done boolean not null default false,
  created_at timestamptz not null default now(),
  unique (topic_id, planned_date)
);

-- Configuración de recordatorios (fila única)
create table if not exists reminder_settings (
  id int primary key default 1 check (id = 1),
  days_before int[] not null default '{7,3,1}',
  notifications_enabled boolean not null default true
);

insert into reminder_settings (id) values (1) on conflict (id) do nothing;

-- Storage bucket (ejecutar también en dashboard si falla)
insert into storage.buckets (id, name, public)
values ('subject-files', 'subject-files', false)
on conflict (id) do nothing;

alter table subjects enable row level security;
alter table subject_files enable row level security;
alter table topics enable row level security;
alter table calendar_events enable row level security;
alter table planner_entries enable row level security;
alter table reminder_settings enable row level security;

-- Políticas permisivas para uso personal (mantén el proyecto Supabase privado)
create policy "Allow all on subjects" on subjects for all using (true) with check (true);
create policy "Allow all on subject_files" on subject_files for all using (true) with check (true);
create policy "Allow all on topics" on topics for all using (true) with check (true);
create policy "Allow all on calendar_events" on calendar_events for all using (true) with check (true);
create policy "Allow all on planner_entries" on planner_entries for all using (true) with check (true);
create policy "Allow all on reminder_settings" on reminder_settings for all using (true) with check (true);
create policy "Storage all" on storage.objects for all using (bucket_id = 'subject-files') with check (bucket_id = 'subject-files');

create index if not exists idx_topics_subject on topics(subject_id, sort_order);
create index if not exists idx_planner_date on planner_entries(planned_date);
create index if not exists idx_events_date on calendar_events(event_date);

-- Permisos para roles de Supabase (anon / authenticated)
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
