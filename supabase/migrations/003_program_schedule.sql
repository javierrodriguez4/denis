-- Program processing: support generated class schedules from an academic program (PDF)

begin;

-- Extend calendar event types to include class seminars and exam make-ups
alter table calendar_events drop constraint if exists calendar_events_event_type_check;
alter table calendar_events
  add constraint calendar_events_event_type_check
  check (event_type in ('parcial', 'final', 'presentacion', 'otro', 'seminario', 'recuperatorio'));

-- Link a subject to the program file it was generated from
alter table subjects
  add column if not exists program_source_file_id uuid references subject_files(id) on delete set null;

-- Faster lookups by subject + type (e.g. all seminars of a subject)
create index if not exists idx_events_subject_type on calendar_events(subject_id, event_type);

commit;
