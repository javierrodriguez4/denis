-- Add a "choice" study state to topics, and an "inscripción" calendar event type.

begin;

-- Fourth study state: practiced multiple-choice ("choice") questions.
alter table topics add column if not exists choice_done boolean not null default false;

-- New event type: registering for finals ("inscripción a finales").
alter table calendar_events drop constraint if exists calendar_events_event_type_check;
alter table calendar_events
  add constraint calendar_events_event_type_check
  check (event_type in ('parcial', 'final', 'presentacion', 'otro', 'seminario', 'recuperatorio', 'inscripcion'));

commit;
