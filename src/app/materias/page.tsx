export const dynamic = "force-dynamic";

import { SetupBanner } from "@/components/setup-banner";
import { Card, CardTitle } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { ProgressRing } from "@/components/ui/progress-ring";
import { CreateSubjectForm } from "@/components/subjects/create-subject-form";
import { getSubjects } from "@/lib/actions/subjects";
import { getSubjectProgress } from "@/lib/actions/planner";
import Link from "next/link";

export default async function MateriasPage() {
  const subjects = await getSubjects();
  const progressList = await Promise.all(
    subjects.map(async (s) => ({
      subject: s,
      progress: await getSubjectProgress(s.id),
    })),
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-0">
      {/* Page heading */}
      <header className="mb-6 px-0.5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          Tus estudios
        </p>
        <h1 className="mt-1.5 font-[family-name:var(--font-display)] text-[27px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--ink)] md:text-[32px]">
          Materias
        </h1>
      </header>

      <SetupBanner />

      {/* Desktop 2-col / mobile stacked */}
      <div className="grid gap-6 md:grid-cols-[1fr_320px] md:items-start lg:grid-cols-[1fr_340px]">

        {/* ── Left: subject list ── */}
        <section aria-label="Lista de materias">
          <SectionLabel>{subjects.length > 0 ? `${subjects.length} materia${subjects.length !== 1 ? "s" : ""}` : "Materias"}</SectionLabel>

          {progressList.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--soft)] bg-[var(--surface)] px-6 py-14 text-center">
              <span className="mb-3 text-3xl" aria-hidden="true">📚</span>
              <p className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--ink)]">
                Aún no tenés materias
              </p>
              <p className="mt-1.5 max-w-[240px] text-sm leading-relaxed text-[var(--muted)]">
                Agregá tu primera materia para empezar a organizar tus contenidos.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {progressList.map(({ subject, progress }) => {
                const pct =
                  progress && progress.total > 0
                    ? Math.min(
                        1,
                        (progress.read + progress.studied + progress.reviewed) /
                          (progress.total * 3),
                      )
                    : 0;
                const pctLabel = Math.round(pct * 100);
                const hasTopics = progress && progress.total > 0;

                return (
                  <Link
                    key={subject.id}
                    href={`/materias/${subject.id}`}
                    className="group block rounded-2xl border border-[var(--soft)] bg-[var(--surface)] p-5 shadow-[0_12px_24px_-20px_rgba(20,32,30,0.3)] outline-none transition-shadow hover:shadow-[0_16px_32px_-20px_rgba(20,32,30,0.38)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                    aria-label={`${subject.name}${hasTopics ? `, ${pctLabel}% de progreso` : ", sin temas planificados"}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Color accent */}
                      <div
                        className="h-10 w-2 flex-none rounded-full opacity-85"
                        style={{ backgroundColor: subject.color }}
                        aria-hidden="true"
                      />

                      {/* Name + progress bar */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-[var(--ink)]">
                          {subject.name}
                        </p>
                        {hasTopics && progress ? (
                          <div className="mt-2">
                            <div
                              className="h-1.5 overflow-hidden rounded-full bg-[var(--soft)]"
                              role="progressbar"
                              aria-valuenow={pctLabel}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-700 motion-reduce:transition-none"
                                style={{ width: `${pctLabel}%` }}
                              />
                            </div>
                            <div className="mt-1.5 flex items-baseline justify-between">
                              <span className="text-xs text-[var(--muted)]">
                                {progress.read + progress.studied + progress.reviewed} de {progress.total * 3} pasos
                              </span>
                              <span className="font-[family-name:var(--font-display)] text-[13px] font-semibold tabular-nums text-[var(--muted)]">
                                {pctLabel}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-0.5 text-xs text-[var(--muted)]">
                            Sin temas planificados
                          </p>
                        )}
                      </div>

                      {/* Progress ring */}
                      {hasTopics && (
                        <ProgressRing
                          value={pct}
                          label={`${pctLabel}%`}
                          size="sm"
                          ariaLabel={`${pctLabel}% completado`}
                        />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Right: create form ── */}
        <aside>
          <SectionLabel>Nueva materia</SectionLabel>
          <Card>
            <CardTitle className="mb-4">Agregar materia</CardTitle>
            <CreateSubjectForm />
          </Card>
        </aside>
      </div>
    </div>
  );
}
