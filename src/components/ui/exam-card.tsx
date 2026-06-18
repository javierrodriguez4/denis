import { cn } from "@/lib/utils";

interface ExamCardProps {
  /** Exam kind eyebrow (e.g. "Parcial"). */
  kind: string;
  /** Subject / exam name (e.g. "Anatomía"). */
  subject: string;
  /** Countdown headline (e.g. "3 días"). */
  countdown: string;
  /** When detail (e.g. "vie 21 · 08:00"). */
  when: string;
  className?: string;
}

/**
 * ExamCard — "próximo examen" highlight card with a left accent bar and a
 * countdown on the right.
 */
export function ExamCard({ kind, subject, countdown, when, className }: ExamCardProps) {
  return (
    <section
      aria-label="Próximo examen"
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-[var(--soft)] border-l-[3px] border-l-[var(--accent)] bg-gradient-to-b from-[var(--surface)] to-[var(--accent-soft)] p-4",
        className,
      )}
    >
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          {kind}
        </div>
        <div className="mt-1 font-[family-name:var(--font-display)] text-base font-semibold text-[var(--ink)]">
          {subject}
        </div>
      </div>
      <div className="flex-none text-right">
        <div className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-none text-[var(--accent)]">
          {countdown}
        </div>
        <div className="mt-0.5 text-[11px] text-[var(--muted)]">{when}</div>
      </div>
    </section>
  );
}
