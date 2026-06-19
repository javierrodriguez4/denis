-- 005_multi_user.sql
-- Multi-user auth: per-user data isolation via a user_id column + RLS.
--
-- IMPORTANT (run order — handled by the orchestrator, NOT this file):
--   1. Apply THIS migration. It adds a NULLABLE user_id to every table and
--      replaces the permissive RLS policies with per-user policies.
--   2. BACKFILL: assign all existing (test) rows to the bootstrap admin's
--      user_id, e.g.:
--          update subjects        set user_id = '<ADMIN_UUID>' where user_id is null;
--          update subject_files   set user_id = '<ADMIN_UUID>' where user_id is null;
--          ... (repeat for every table below) ...
--   3. ENFORCE: once backfilled, set the columns NOT NULL and add the
--      `default auth.uid()` so future inserts are auto-scoped, e.g.:
--          alter table subjects alter column user_id set not null;
--          alter table subjects alter column user_id set default auth.uid();
--
-- user_id is left NULLABLE here on purpose so the backfill in step 2 can run.

begin;

-- ---------------------------------------------------------------------------
-- 1. Add user_id (nullable for now) to every per-user table.
-- ---------------------------------------------------------------------------
alter table subjects         add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table subject_files    add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table topics           add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table calendar_events  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table planner_entries  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table study_logs       add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table reminder_settings add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Helpful indexes for the per-user lookups RLS will perform.
create index if not exists idx_subjects_user        on subjects(user_id);
create index if not exists idx_subject_files_user    on subject_files(user_id);
create index if not exists idx_topics_user           on topics(user_id);
create index if not exists idx_calendar_events_user  on calendar_events(user_id);
create index if not exists idx_planner_entries_user  on planner_entries(user_id);
create index if not exists idx_study_logs_user       on study_logs(user_id);

-- ---------------------------------------------------------------------------
-- 2. reminder_settings: from a global id=1 singleton to one row per user.
-- ---------------------------------------------------------------------------
-- Drop the singleton constraint (id = 1) if it exists.
alter table reminder_settings drop constraint if exists reminder_settings_id_check;
-- id is no longer a singleton: make it auto-increment so each user's row gets a
-- unique primary key (the upsert conflicts on user_id, not id).
create sequence if not exists reminder_settings_id_seq owned by reminder_settings.id;
select setval('reminder_settings_id_seq', coalesce((select max(id) from reminder_settings), 0) + 1, false);
alter table reminder_settings alter column id set default nextval('reminder_settings_id_seq');
create unique index if not exists uq_reminder_settings_user on reminder_settings(user_id);

-- ---------------------------------------------------------------------------
-- 3. study_logs: unique(log_date) -> unique(user_id, log_date).
-- ---------------------------------------------------------------------------
-- The original `log_date date not null unique` created an auto-named unique
-- constraint. Drop it (idempotent) and add the per-user composite.
alter table study_logs drop constraint if exists study_logs_log_date_key;
drop index if exists study_logs_log_date_key;
create unique index if not exists uq_study_logs_user_date on study_logs(user_id, log_date);

-- ---------------------------------------------------------------------------
-- 4. Replace permissive RLS policies with per-user policies.
--    using(auth.uid() = user_id) with check(auth.uid() = user_id)
-- ---------------------------------------------------------------------------
alter table subjects          enable row level security;
alter table subject_files     enable row level security;
alter table topics            enable row level security;
alter table calendar_events   enable row level security;
alter table planner_entries   enable row level security;
alter table study_logs        enable row level security;
alter table reminder_settings enable row level security;

-- Drop the old "allow all" policies.
drop policy if exists "Allow all on subjects"          on subjects;
drop policy if exists "Allow all on subject_files"      on subject_files;
drop policy if exists "Allow all on topics"             on topics;
drop policy if exists "Allow all on calendar_events"    on calendar_events;
drop policy if exists "Allow all on planner_entries"    on planner_entries;
drop policy if exists "Allow all on study_logs"         on study_logs;
drop policy if exists "Allow all on reminder_settings"  on reminder_settings;

-- Per-user policies (idempotent: drop-then-create).
drop policy if exists "own rows" on subjects;
create policy "own rows" on subjects
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on subject_files;
create policy "own rows" on subject_files
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on topics;
create policy "own rows" on topics
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on calendar_events;
create policy "own rows" on calendar_events
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on planner_entries;
create policy "own rows" on planner_entries
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on study_logs;
create policy "own rows" on study_logs
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on reminder_settings;
create policy "own rows" on reminder_settings
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. Storage: scope the subject-files bucket to per-user folders.
--    Path layout is `{user_id}/{subject_id}/{file}`, so the first folder
--    segment must equal the caller's uid.
-- ---------------------------------------------------------------------------
drop policy if exists "Storage all" on storage.objects;
drop policy if exists "subject-files own folder" on storage.objects;
create policy "subject-files own folder" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'subject-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'subject-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 6. Tighten table grants: the anon role should no longer have blanket access;
--    authenticated users go through RLS. service_role keeps full access for
--    the admin client.
-- ---------------------------------------------------------------------------
revoke all on subjects, subject_files, topics, calendar_events,
              planner_entries, study_logs, reminder_settings
  from anon;

commit;

-- ---------------------------------------------------------------------------
-- POST-BACKFILL (run after step 2 above; left out of this transaction so the
-- backfill can happen in between). Reference only:
--
--   alter table subjects         alter column user_id set not null, alter column user_id set default auth.uid();
--   alter table subject_files    alter column user_id set not null, alter column user_id set default auth.uid();
--   alter table topics           alter column user_id set not null, alter column user_id set default auth.uid();
--   alter table calendar_events  alter column user_id set not null, alter column user_id set default auth.uid();
--   alter table planner_entries  alter column user_id set not null, alter column user_id set default auth.uid();
--   alter table study_logs       alter column user_id set not null, alter column user_id set default auth.uid();
--   alter table reminder_settings alter column user_id set not null, alter column user_id set default auth.uid();
-- ---------------------------------------------------------------------------
