export const dynamic = "force-dynamic";

import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SectionLabel } from "@/components/ui/section-label";
import { TopicRow } from "@/components/ui/topic-row";
import { ExamCard } from "@/components/ui/exam-card";
import { SubjectCard } from "@/components/subjects/subject-card";
import { getSubjects } from "@/lib/actions/subjects";
import { getUpcomingEvents } from "@/lib/actions/calendar";
import { getTodayEntries, getSubjectProgress } from "@/lib/actions/planner";
import { format, parseISO, nowBA } from "@/lib/dates";
import { differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import type { EventType } from "@/lib/supabase/types";
import Link from "next/link";

/** Compute LER stage count (0..3) from topic flags. */
function lerValue(t: {
  read_done: boolean;
  studied_done: boolean;
  reviewed_done: boolean;
}): number {
  if (t.reviewed_done) return 3;
  if (t.studied_done) return 2;
  if (t.read_done) return 1;
  return 0;
}

/** Tick opacity decreases with remaining stages. */
function tickOpacity(ler: number): number {
  return [0.25, 0.5, 0.7, 0.85][ler] ?? 0.85;
}

/** Format date as eyebrow: "Miércoles 18 · junio" */
function formatEyebrow(date: Date): string {
  const weekday = format(date, "EEEE", { locale: es });
  const day = format(date, "d", { locale: es });
  const month = format(date, "MMMM", { locale: es });
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(weekday)} ${day} · ${month}`;
}

/** Days until an ISO date string. */
function daysUntil(isoDate: string): number {
  return differenceInCalendarDays(parseISO(isoDate), nowBA());
}

/** Human-readable countdown. */
function countdownLabel(days: number): string {
  if (days <= 0) return "hoy";
  if (days === 1) return "mañana";
  return `${days} días`;
}

/** Format event date + optional time as "vie 21 · 08:00". */
function formatEventWhen(isoDate: string, eventTime?: string | null): string {
  const d = parseISO(isoDate);
  const part = format(d, "EEE d", { locale: es });
  return eventTime ? `${part} · ${eventTime.slice(0, 5)}` : part;
}

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

  const today = nowBA();
  const eyebrow = formatEyebrow(today);

  // Today focus progress
  const totalToday = todayEntries.length;
  const doneToday = todayEntries.filter((e) => {
    const t = e.topics;
    return t && (t.read_done || t.studied_done || t.reviewed_done);
  }).length;
  const ringValue = totalToday > 0 ? doneToday / totalToday : 0;

  // Reassuring headline and body copy
  const focusHeadline =
    ringValue >= 1
      ? "¡Todo listo!"
      : ringValue >= 0.5
        ? "Vas bien."
        : totalToday === 0
          ? "Sin temas hoy."
          : "Arrancá tranquilo.";

  const remaining = totalToday - doneToday;
  let focusBody: string;
  if (totalToday === 0) {
    focusBody = "No hay temas planificados para hoy. Podés revisar el planner.";
  } else if (remaining === 0) {
    focusBody = "Terminaste todos los temas del día. ¡Excelente trabajo!";
  } else {
    const pendingTopic = todayEntries
      .filter((e) => {
        const t = e.topics;
        return t && !t.read_done && !t.studied_done && !t.reviewed_done;
      })
      .at(-1);
    const topicHint = pendingTopic?.topics?.title
      ? `: ${pendingTopic.topics.title}.`
      : ".";
    focusBody =
      remaining === 1
        ? `Te queda un tema para cerrar el día${topicHint}`
        : `Te quedan ${remaining} temas para cerrar el día.`;
  }

  // Next exam: first upcoming event with exam type
  const nextExam = upcoming.find((e) =>
    (["parcial", "final"] as EventType[]).includes(e.event_type as EventType),
  );

  const hasSubjects = subjects.length > 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 md:px-8 md:pt-8">
      {/* Greeting block */}
      <header className="mb-6 px-0.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[27px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--ink)] md:text-[32px]">
          Buenos días.{" "}
          <span className="font-medium text-[var(--muted)]">
            {totalToday > 0
              ? `Hoy tenés ${totalToday} ${totalToday === 1 ? "tema" : "temas"}.`
              : "Sin temas planificados hoy."}
          </span>
        </h1>
      </header>

      {/* Desktop 1fr/360px two-column grid, single-column on mobile */}
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_360px]">

        {/* ── Left column: focus card + para hoy ── */}
        <div className="flex flex-col gap-7">

          {/* Today focus card with ProgressRing */}
          <Card
            aria-label="Tu avance de hoy"
            className="flex items-center gap-[18px] md:gap-[22px] md:p-6"
          >
            {/* sm ring on mobile, lg on desktop */}
            <ProgressRing
              value={ringValue}
              label={totalToday > 0 ? `${doneToday}/${totalToday}` : "—"}
              caption="hoy"
              size="sm"
              ariaLabel={`${doneToday} de ${totalToday} temas completados hoy`}
              className="md:hidden"
            />
            <ProgressRing
              value={ringValue}
              label={totalToday > 0 ? `${doneToday}/${totalToday}` : "—"}
              caption="hoy"
              size="lg"
              ariaLabel={`${doneToday} de ${totalToday} temas completados hoy`}
              className="hidden md:flex"
            />
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-[18px] font-semibold tracking-[-0.01em] text-[var(--ink)] md:text-[21px]">
                {focusHeadline}
              </h2>
              <p className="mt-1 text-[13.5px] leading-[1.45] text-[var(--muted)] md:mt-1.5 md:text-[14.5px]">
                {focusBody}
              </p>
            </div>
          </Card>

          {/* Para hoy — topic list */}
          <section>
            <SectionLabel action={{ label: "Planner", href: "/planner" }}>
              Para hoy
            </SectionLabel>
            {todayEntries.length === 0 ? (
              <p className="rounded-xl border border-[var(--soft)] bg-[var(--surface)] px-4 py-4 text-[14px] text-[var(--muted)]">
                No hay temas para hoy.{" "}
                <Link
                  href="/planner"
                  className="text-[var(--accent)] underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                >
                  Abrí el planner
                </Link>{" "}
                para planificar.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {todayEntries.map((entry) => {
                  const topic = entry.topics;
                  if (!topic) return null;
                  const ler = lerValue(topic);
                  return (
                    <TopicRow
                      key={entry.id}
                      subject={topic.subjects?.name ?? ""}
                      title={topic.title}
                      ler={ler}
                      tickOpacity={tickOpacity(ler)}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── Right column / aside: exam + materias ── */}
        <div className="flex flex-col gap-7">

          {/* Próximo examen */}
          <section>
            <SectionLabel>Próximo examen</SectionLabel>
            {nextExam ? (
              <ExamCard
                kind={EVENT_TYPE_LABELS[nextExam.event_type as EventType]}
                subject={nextExam.title}
                countdown={countdownLabel(daysUntil(nextExam.event_date))}
                when={formatEventWhen(nextExam.event_date, nextExam.event_time)}
              />
            ) : (
              <p className="rounded-xl border border-[var(--soft)] bg-[var(--surface)] px-4 py-4 text-[14px] text-[var(--muted)]">
                Sin exámenes próximos.{" "}
                <Link
                  href="/calendario"
                  className="text-[var(--accent)] underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                >
                  Agregar al calendario
                </Link>
                .
              </p>
            )}
          </section>

          {/* Materias — slim progress bars */}
          <section>
            <SectionLabel action={{ label: "Ver todas", href: "/materias" }}>
              Materias
            </SectionLabel>

            {!hasSubjects ? (
              /* Calm inline empty-state — no SetupBanner dependency */
              <div className="rounded-xl border border-[var(--soft)] bg-[var(--surface)] px-5 py-6 text-center">
                <p className="text-[15px] font-medium text-[var(--ink)]">
                  Todavía no hay materias
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--muted)]">
                  Creá tu primera materia para empezar a organizar el estudio.
                </p>
                <Link
                  href="/materias"
                  className="mt-4 inline-block rounded-lg bg-[var(--accent-soft)] px-4 py-2 text-[13.5px] font-medium text-[var(--accent)] outline-none transition-colors hover:bg-[var(--soft)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                >
                  Crear materia
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop: wrapped in a card */}
                <div className="hidden rounded-2xl border border-[var(--soft)] bg-[var(--surface)] p-5 md:block">
                  <div className="flex flex-col gap-4">
                    {progressList.map(({ subject, progress }) => (
                      <SubjectCard
                        key={subject.id}
                        subject={subject}
                        progress={progress}
                      />
                    ))}
                  </div>
                </div>

                {/* Mobile: bare list (no card wrapper — matches serena.html) */}
                <div className="flex flex-col gap-3.5 md:hidden">
                  {progressList.map(({ subject, progress }) => (
                    <SubjectCard
                      key={subject.id}
                      subject={subject}
                      progress={progress}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
