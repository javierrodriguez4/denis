import { toISODate } from "@/lib/dates";
import type { ProgramData } from "@/lib/ai/program-schema";

/**
 * Deterministic schedule generation from a parsed program.
 *
 * No AI here — given the structured program and the comisión the student
 * belongs to, we compute exact dates for each seminar and exam and produce the
 * topics, calendar events, and planner entries that drive the planner/calendar.
 */

export interface GeneratedTopic {
  title: string;
  sort_order: number;
}

export interface GeneratedEvent {
  title: string;
  event_type: "seminario" | "parcial" | "recuperatorio" | "final" | "otro";
  event_date: string; // ISO yyyy-MM-dd
  event_time: string | null; // HH:00 or null
}

export interface GeneratedPlannerEntry {
  /** Index into the generated topics array; resolved to a topic id at insert. */
  topicIndex: number;
  planned_date: string; // ISO yyyy-MM-dd
}

export interface GeneratedSchedule {
  topics: GeneratedTopic[];
  events: GeneratedEvent[];
  plannerEntries: GeneratedPlannerEntry[];
}

// --- Spanish language helpers -------------------------------------------------

/** Lowercases and strips accents so "Miércoles" === "miercoles". */
function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

const WEEKDAY_TO_JS: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

const MONTH_TO_INDEX: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

/** Spanish weekday name -> JS getDay() (0=domingo..6=sábado), or null. */
export function spanishWeekdayToJs(dia: string): number | null {
  const key = normalize(dia);
  return key in WEEKDAY_TO_JS ? WEEKDAY_TO_JS[key] : null;
}

/** Spanish month name -> 0..11, or null. */
export function spanishMonthToIndex(month: string): number | null {
  const key = normalize(month);
  return key in MONTH_TO_INDEX ? MONTH_TO_INDEX[key] : null;
}

/**
 * Parses a single Spanish date like "Sábado 25 de abril" or "25 de abril" into
 * a Date in the given year. The weekday word (if present) is ignored for the
 * actual date but could be used to validate. Returns null if unparseable.
 */
export function parseSpanishDate(text: string, year: number): Date | null {
  const norm = normalize(text);
  // Match "<day> de <month>"
  const match = norm.match(/(\d{1,2})\s*de\s+([a-z]+)/);
  if (!match) return null;
  const day = Number(match[1]);
  const monthIndex = spanishMonthToIndex(match[2]);
  if (monthIndex == null || day < 1 || day > 31) return null;
  return new Date(year, monthIndex, day);
}

/**
 * Parses a Spanish date range into start/end Dates in the given year.
 *
 * Supports two shapes:
 *  - same month:  "9-11 de marzo"            -> Mar 9 .. Mar 11
 *  - cross month: "30 de marzo-1 de abril"   -> Mar 30 .. Apr 1
 *
 * For the cross-month shape, each side carries its own month, so the end month
 * is read from the right side of the dash. For the same-month shape, the month
 * appears once (after the second number) and applies to both endpoints.
 *
 * Returns null if it can't parse a coherent range.
 */
export function parseSpanishDateRange(
  text: string,
  year: number,
): { start: Date; end: Date } | null {
  const norm = normalize(text);

  // Cross-month: "<day> de <month> - <day> de <month>"
  const cross = norm.match(
    /(\d{1,2})\s*de\s+([a-z]+)\s*[-–—a]\s*(\d{1,2})\s*de\s+([a-z]+)/,
  );
  if (cross) {
    const startDay = Number(cross[1]);
    const startMonth = spanishMonthToIndex(cross[2]);
    const endDay = Number(cross[3]);
    const endMonth = spanishMonthToIndex(cross[4]);
    if (startMonth == null || endMonth == null) return null;
    const start = new Date(year, startMonth, startDay);
    let end = new Date(year, endMonth, endDay);
    // Range crossing the year boundary (e.g. diciembre-enero).
    if (end < start) end = new Date(year + 1, endMonth, endDay);
    return { start, end };
  }

  // Same-month: "<day> - <day> de <month>"
  const same = norm.match(/(\d{1,2})\s*[-–—a]\s*(\d{1,2})\s*de\s+([a-z]+)/);
  if (same) {
    const startDay = Number(same[1]);
    const endDay = Number(same[2]);
    const month = spanishMonthToIndex(same[3]);
    if (month == null) return null;
    return {
      start: new Date(year, month, startDay),
      end: new Date(year, month, endDay),
    };
  }

  // Single date (no range): treat start === end.
  const single = parseSpanishDate(norm, year);
  if (single) return { start: single, end: single };

  return null;
}

/**
 * Within [start, end] inclusive, returns the first date whose weekday matches
 * `weekday` (JS getDay). Seminar ranges span a few consecutive days so exactly
 * one match is expected. Returns null if none falls in range.
 */
export function findDateForWeekday(
  start: Date,
  end: Date,
  weekday: number,
): Date | null {
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cursor <= last) {
    if (cursor.getDay() === weekday) {
      return new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

/** Maps an exam "tipo" string to a calendar event type. */
export function examTypeToEventType(tipo: string): GeneratedEvent["event_type"] {
  if (/recuperatorio/i.test(tipo)) return "recuperatorio";
  if (/parcial/i.test(tipo)) return "parcial";
  if (/final/i.test(tipo)) return "final";
  return "otro";
}

/** Normalizes a comisión start hour ("14") to "HH:00", or null if invalid. */
function hourToTime(hora: string): string | null {
  const match = String(hora).match(/\d{1,2}/);
  if (!match) return null;
  const h = Number(match[0]);
  if (h < 0 || h > 23) return null;
  return `${String(h).padStart(2, "0")}:00`;
}

/**
 * Generates the deterministic schedule (topics, calendar events, planner
 * entries) for a given comisión number. Seminars produce one topic + one
 * seminar event + one planner entry each (dated to the comisión's weekday
 * within the seminar range). Exams produce one event each, shared across
 * comisiones.
 */
export function generateSchedule(
  program: ProgramData,
  comisionNumero: number,
): GeneratedSchedule {
  const topics: GeneratedTopic[] = [];
  const events: GeneratedEvent[] = [];
  const plannerEntries: GeneratedPlannerEntry[] = [];

  const comision = program.comisiones.find((c) => c.numero === comisionNumero);
  const weekday = comision ? spanishWeekdayToJs(comision.dia_semana) : null;
  const eventTime = comision ? hourToTime(comision.hora_inicio) : null;

  for (const sem of program.seminarios) {
    const title = `Seminario ${sem.numero}: ${sem.titulo}`;
    const topicIndex = topics.length;
    topics.push({ title, sort_order: sem.numero });

    const range = parseSpanishDateRange(sem.rango_fechas, program.anio);
    if (!range || weekday == null) continue;

    const classDate = findDateForWeekday(range.start, range.end, weekday);
    if (!classDate) continue;

    const isoDate = toISODate(classDate);
    events.push({
      title,
      event_type: "seminario",
      event_date: isoDate,
      event_time: eventTime,
    });
    plannerEntries.push({ topicIndex, planned_date: isoDate });
  }

  for (const exam of program.examenes) {
    const date = parseSpanishDate(exam.fecha, program.anio);
    if (!date) continue;
    events.push({
      title: exam.tipo,
      event_type: examTypeToEventType(exam.tipo),
      event_date: toISODate(date),
      event_time: null,
    });
  }

  return { topics, events, plannerEntries };
}
