import { MobileHeader } from "@/components/navigation";
import { SetupBanner } from "@/components/setup-banner";
import { WeeklyPlanner } from "@/components/planner/weekly-planner";
import { getPlannerEntries } from "@/lib/actions/planner";
import { getCalendarEvents } from "@/lib/actions/calendar";
import { getWeekStart, getWeekEnd, toISODate } from "@/lib/dates";
import { addWeeks } from "date-fns";

export default async function PlannerPage() {
  const start = getWeekStart(new Date());
  const end = addWeeks(getWeekEnd(new Date()), 2);
  const from = toISODate(start);
  const to = toISODate(end);

  const [entries, allEvents] = await Promise.all([
    getPlannerEntries(from, to),
    getCalendarEvents(from, to),
  ]);

  const presentations = allEvents.filter((e) => e.event_type === "presentacion");

  return (
    <>
      <MobileHeader title="Planner" />
      <div className="hidden md:mb-6 md:block">
        <h1 className="text-2xl font-semibold">Planner semanal</h1>
        <p className="text-[var(--muted)]">
          Temas de clase del día y presentaciones programadas
        </p>
      </div>

      <SetupBanner />
      <WeeklyPlanner entries={entries} presentations={presentations} />
    </>
  );
}
