import { MobileHeader } from "@/components/navigation";
import { SetupBanner } from "@/components/setup-banner";
import { ReminderBanner } from "@/components/reminder-banner";
import { Card, CardTitle } from "@/components/ui/card";
import { SubjectCard } from "@/components/subjects/subject-card";
import { getSubjects } from "@/lib/actions/subjects";
import { getUpcomingEvents } from "@/lib/actions/calendar";
import { getTodayEntries } from "@/lib/actions/planner";
import { getSubjectProgress } from "@/lib/actions/planner";
import { formatDate } from "@/lib/dates";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import type { EventType } from "@/lib/supabase/types";
import Link from "next/link";
import { Check } from "lucide-react";

export default async function HomePage() {
  const [subjects, upcoming, todayEntries] = await Promise.all([
    getSubjects(),
    getUpcomingEvents(5),
    getTodayEntries(),
  ]);

  const progressList = await Promise.all(
    subjects.map(async (s) => ({
      subject: s,
      progress: await getSubjectProgress(s.id),
    })),
  );

  return (
    <>
      <MobileHeader title="Inicio" />
      <div className="hidden md:mb-6 md:block">
        <h1 className="text-2xl font-semibold">Buen día</h1>
        <p className="text-[var(--muted)]">Tu resumen de estudio de hoy</p>
      </div>

      <SetupBanner />
      <ReminderBanner />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Hoy — {formatDate(new Date())}</CardTitle>
          {todayEntries.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              No hay temas planificados para hoy.{" "}
              <Link href="/planner" className="text-[var(--accent)] underline">
                Ver planner
              </Link>
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {todayEntries.map((e) => (
                <li key={e.id} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                  <span>{e.topics?.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>Próximos eventos</CardTitle>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Sin eventos próximos.{" "}
              <Link href="/calendario" className="text-[var(--accent)] underline">
                Agregar al calendario
              </Link>
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((e) => (
                <li key={e.id} className="text-sm">
                  <span className="font-medium">{e.title}</span>
                  <span className="text-[var(--muted)]">
                    {" "}
                    · {EVENT_TYPE_LABELS[e.event_type as EventType]} ·{" "}
                    {formatDate(e.event_date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {subjects.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Tus materias</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {progressList.map(({ subject, progress }) => (
              <SubjectCard key={subject.id} subject={subject} progress={progress} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
