import {
  addDays,
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  differenceInCalendarDays,
} from "date-fns";
import { es } from "date-fns/locale";

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekDays(date: Date = new Date()): Date[] {
  return eachDayOfInterval({
    start: getWeekStart(date),
    end: getWeekEnd(date),
  });
}

export function formatDate(date: Date | string, pattern = "d MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: es });
}

export function formatWeekRange(date: Date = new Date()): string {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  return `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}`;
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function distributeDates(
  count: number,
  startDate: Date,
  endDate: Date,
): string[] {
  if (count === 0) return [];
  const totalDays = Math.max(1, differenceInCalendarDays(endDate, startDate) + 1);
  const dates: string[] = [];

  for (let i = 0; i < count; i++) {
    const dayOffset = Math.floor((i * totalDays) / count);
    dates.push(toISODate(addDays(startDate, dayOffset)));
  }

  return dates;
}

export { isSameDay, addDays, parseISO, format };
