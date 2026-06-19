export const dynamic = "force-dynamic";

import { SetupBanner } from "@/components/setup-banner";
import { WeeklyPlanner } from "@/components/planner/weekly-planner";
import { getPlannerEntries, getSubjectsWithTopics } from "@/lib/actions/planner";
import { getCalendarEvents } from "@/lib/actions/calendar";
import { getWeekStart, getWeekEnd, toISODate, formatDate, nowBA } from "@/lib/dates";
import { addWeeks } from "date-fns";

export default async function PlannerPage() {
  const today = nowBA();
  const start = getWeekStart(today);
  const end = addWeeks(getWeekEnd(today), 2);
  const from = toISODate(start);
  const to = toISODate(end);

  const [entries, allEvents, subjectsWithTopics] = await Promise.all([
    getPlannerEntries(from, to),
    getCalendarEvents(from, to),
    getSubjectsWithTopics(),
  ]);

  const presentations = allEvents.filter((e) => e.event_type === "presentacion");

  // Eyebrow label: e.g. "Semana del 16 jun"
  const eyebrow = `Semana del ${formatDate(start, "d MMM")}`;

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Page heading */}
      <div className="mb-6 px-0.5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 font-[family-name:var(--font-display)] text-[27px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--ink)] md:text-[32px]">
          Planner semanal
        </h1>
      </div>

      <SetupBanner />
      <WeeklyPlanner
        entries={entries}
        presentations={presentations}
        subjects={subjectsWithTopics}
      />
    </div>
  );
}
