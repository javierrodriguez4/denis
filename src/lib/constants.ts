import type { EventType, FileType } from "@/lib/supabase/types";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  parcial: "Parcial",
  final: "Final",
  presentacion: "Presentación",
  otro: "Otro",
  seminario: "Seminario",
  recuperatorio: "Recuperatorio",
  inscripcion: "Inscripción",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  parcial: "#d97706",
  final: "#dc2626",
  presentacion: "#2563eb",
  otro: "#6b7280",
  seminario: "#0d9488",
  recuperatorio: "#b45309",
  inscripcion: "#7c3aed",
};

export const FILE_TYPE_LABELS: Record<FileType, string> = {
  program: "Programa curricular",
  book: "Libro",
  presentation: "Presentación",
  other: "Otro",
};

export const SUBJECT_COLORS = [
  "#2d6a6a",
  "#4a7c59",
  "#5b6eae",
  "#9b6b4a",
  "#8b5a7d",
  "#4a8b8b",
  "#6b5b4a",
  "#5a6b8b",
];

export const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
