import Link from "next/link";
import type { Subject } from "@/lib/supabase/types";

interface SubjectCardProps {
  subject: Subject;
  progress?: { total: number; read: number; studied: number; reviewed: number };
}

/**
 * SubjectCard — slim accent progress bar row used in the dashboard "Materias"
 * section. Links to the subject detail page.
 */
export function SubjectCard({ subject, progress }: SubjectCardProps) {
  const pct =
    progress && progress.total > 0
      ? Math.round(
          ((progress.read + progress.studied + progress.reviewed) /
            (progress.total * 3)) *
            100,
        )
      : 0;

  return (
    <Link
      href={`/materias/${subject.id}`}
      className="group flex flex-col gap-2 outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[14.5px] font-medium text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
          {subject.name}
        </span>
        <span className="font-[family-name:var(--font-display)] text-[13px] font-semibold tabular-nums text-[var(--muted)]">
          {pct}%
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-[var(--soft)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso de ${subject.name}: ${pct}%`}
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}
