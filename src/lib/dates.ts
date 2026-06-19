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

// Argentina has no DST and the app's users are there, so "today" on the server
// (UTC on Vercel) must be computed in Buenos Aires time to avoid an off-by-one
// day near UTC midnight. Use this for any server-side "now/today" computation.
// (Client components run in the browser and already use the user's local time.)
const APP_TIME_ZONE = "America/Argentina/Buenos_Aires";

export function nowBA(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: APP_TIME_ZONE }));
}

export function todayISO(): string {
  return toISODate(nowBA());
}

export function getWeekStart(date: Date = nowBA()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekEnd(date: Date = nowBA()): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekDays(date: Date = nowBA()): Date[] {
  return eachDayOfInterval({
    start: getWeekStart(date),
    end: getWeekEnd(date),
  });
}

export function formatDate(date: Date | string, pattern = "d MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: es });
}

export function formatWeekRange(date: Date = nowBA()): string {
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
