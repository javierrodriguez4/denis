import { MobileHeader } from "@/components/navigation";
import { SetupBanner } from "@/components/setup-banner";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { getCalendarEvents } from "@/lib/actions/calendar";
import { getStudyLogs } from "@/lib/actions/study-logs";
import { getSubjects } from "@/lib/actions/subjects";
import { format } from "date-fns";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const now = new Date();
  const month = mes ?? format(now, "yyyy-MM");
  const [year, monthNum] = month.split("-").map(Number);
  const from = `${month}-01`;
  const lastDay = new Date(year, monthNum, 0).getDate();
  const to = `${month}-${String(lastDay).padStart(2, "0")}`;

  const [events, studyLogs, subjects] = await Promise.all([
    getCalendarEvents(from, to),
    getStudyLogs(from, to),
    getSubjects(),
  ]);

  return (
    <>
      <MobileHeader title="Calendario" />
      <div className="hidden md:mb-6 md:block">
        <h1 className="text-2xl font-semibold">Calendario académico</h1>
        <p className="text-[var(--muted)]">
          Exámenes, presentaciones y tiempo de estudio diario
        </p>
      </div>

      <SetupBanner />
      <CalendarGrid
        events={events}
        studyLogs={studyLogs}
        subjects={subjects}
        month={month}
      />
    </>
  );
}
