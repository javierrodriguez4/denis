import { SetupBanner } from "@/components/setup-banner";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { getCalendarEvents } from "@/lib/actions/calendar";
import { getStudyLogs } from "@/lib/actions/study-logs";
import { getSubjects } from "@/lib/actions/subjects";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

  // Eyebrow: formatted day
  const eyebrow = format(now, "EEEE d · MMMM", { locale: es });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-0 pb-6 md:px-0">
      {/* Page heading — replaces MobileHeader */}
      <div className="px-0.5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)] capitalize">
          {eyebrow}
        </p>
        <h1 className="mt-1.5 font-[family-name:var(--font-display)] text-[27px] font-semibold leading-[1.15] tracking-tight text-[var(--ink)] md:text-[32px]">
          Calendario
        </h1>
      </div>

      <SetupBanner />

      <CalendarGrid
        events={events}
        studyLogs={studyLogs}
        subjects={subjects}
        month={month}
      />
    </div>
  );
}
