-- Datos de demostración para Denis

insert into subjects (id, name, color) values
  ('a1000000-0000-4000-8000-000000000001', 'Anatomía', '#2d6a6a'),
  ('a1000000-0000-4000-8000-000000000002', 'Fisiología', '#4a7c59'),
  ('a1000000-0000-4000-8000-000000000003', 'Bioquímica', '#5b6eae')
on conflict (id) do nothing;

insert into topics (subject_id, title, sort_order, read_done, studied_done, reviewed_done) values
  ('a1000000-0000-4000-8000-000000000001', 'Sistema locomotor — huesos del miembro superior', 0, true, false, false),
  ('a1000000-0000-4000-8000-000000000001', 'Sistema locomotor — articulaciones', 1, false, false, false),
  ('a1000000-0000-4000-8000-000000000001', 'Sistema cardiovascular — corazón', 2, false, false, false),
  ('a1000000-0000-4000-8000-000000000002', 'Potencial de acción', 0, false, false, false),
  ('a1000000-0000-4000-8000-000000000002', 'Contracción muscular', 1, false, false, false),
  ('a1000000-0000-4000-8000-000000000003', 'Enzimas y cinética', 0, false, false, false)
on conflict do nothing;

insert into calendar_events (subject_id, title, event_type, event_date) values
  ('a1000000-0000-4000-8000-000000000001', 'Parcial Anatomía — Locomotor', 'parcial', current_date + 14),
  ('a1000000-0000-4000-8000-000000000002', 'Final Fisiología', 'final', current_date + 45),
  ('a1000000-0000-4000-8000-000000000003', 'Presentación seminario Bioquímica', 'presentacion', current_date + 7)
on conflict do nothing;

insert into planner_entries (topic_id, planned_date)
select t.id, current_date + (t.sort_order % 7)
from topics t
where t.subject_id = 'a1000000-0000-4000-8000-000000000001'
on conflict (topic_id, planned_date) do nothing;

insert into planner_entries (topic_id, planned_date)
select t.id, current_date + 1
from topics t
where t.subject_id = 'a1000000-0000-4000-8000-000000000002'
on conflict (topic_id, planned_date) do nothing;

insert into study_logs (log_date, hours, notes) values
  (current_date, 2.5, 'Anatomía — miembro superior'),
  (current_date - 1, 3, 'Fisiología general')
on conflict (log_date) do nothing;
