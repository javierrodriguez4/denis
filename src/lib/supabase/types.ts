export type FileType = "program" | "book" | "presentation" | "other";
export type EventType =
  | "parcial"
  | "final"
  | "presentacion"
  | "otro"
  | "seminario"
  | "recuperatorio";

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface SubjectFile {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  file_type: FileType;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface Topic {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  sort_order: number;
  source_file_id: string | null;
  read_done: boolean;
  studied_done: boolean;
  reviewed_done: boolean;
  created_at: string;
  subjects?: Pick<Subject, "name" | "color">;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  event_type: EventType;
  event_date: string;
  event_time: string | null;
  notes: string | null;
  created_at: string;
  subjects?: Pick<Subject, "name" | "color"> | null;
}

export interface PlannerEntry {
  id: string;
  user_id: string;
  topic_id: string;
  planned_date: string;
  created_at: string;
  topics?: Topic & { subjects?: Pick<Subject, "name" | "color"> };
}

export interface StudyLog {
  id: string;
  user_id: string;
  log_date: string;
  hours: number;
  notes: string | null;
  created_at: string;
}

export interface ReminderSettings {
  id: number;
  user_id: string;
  days_before: number[];
  notifications_enabled: boolean;
}

export interface SuggestedTopic {
  title: string;
  sort_order: number;
}
