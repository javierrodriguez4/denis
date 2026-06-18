-- Mover progreso del planner a temas + tabla de tiempo de estudio

alter table topics
  add column if not exists read_done boolean not null default false,
  add column if not exists studied_done boolean not null default false,
  add column if not exists reviewed_done boolean not null default false;

-- Migrar progreso existente desde planner_entries
update topics t
set
  read_done = coalesce((
    select bool_or(pe.read_done) from planner_entries pe where pe.topic_id = t.id
  ), false),
  studied_done = coalesce((
    select bool_or(pe.studied_done) from planner_entries pe where pe.topic_id = t.id
  ), false),
  reviewed_done = coalesce((
    select bool_or(pe.reviewed_done) from planner_entries pe where pe.topic_id = t.id
  ), false);

alter table planner_entries
  drop column if exists read_done,
  drop column if exists studied_done,
  drop column if exists reviewed_done;

-- Tiempo de estudio por día
create table if not exists study_logs (
  id uuid primary key default gen_random_uuid(),
  log_date date not null unique,
  hours numeric(4, 1) not null default 0 check (hours >= 0 and hours <= 24),
  notes text,
  created_at timestamptz not null default now()
);

alter table study_logs enable row level security;
create policy "Allow all on study_logs" on study_logs for all using (true) with check (true);

grant all on study_logs to anon, authenticated, service_role;

create index if not exists idx_study_logs_date on study_logs(log_date);
