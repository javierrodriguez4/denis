import { LerBadge } from "@/components/ui/ler-badge";
import { cn } from "@/lib/utils";

interface TopicRowProps {
  /** Subject eyebrow (e.g. "Anatomía"). */
  subject: string;
  /** Topic title (e.g. "Sistema nervioso central"). */
  title: string;
  /** Completed L·E·R stages (0..3). */
  ler: number;
  /** Interactive L·E·R handler; omit for read-only. */
  onLerChange?: (value: number) => void;
  /** Opacity of the subject tick (0..1), used to fade lower-priority rows. */
  tickOpacity?: number;
  className?: string;
}

/**
 * TopicRow — a single study topic line: a colored subject tick, the subject
 * eyebrow + topic title, and a L·E·R progress badge on the right.
 */
export function TopicRow({
  subject,
  title,
  ler,
  onLerChange,
  tickOpacity = 0.85,
  className,
}: TopicRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-xl border border-[var(--soft)] bg-[var(--surface)] px-4 py-3.5 transition-colors hover:border-[#d3e0dc]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="w-2 flex-none self-stretch rounded bg-[var(--accent)]"
        style={{ opacity: tickOpacity }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
          {subject}
        </div>
        <div className="mt-0.5 truncate text-[15px] font-medium text-[var(--ink)]">
          {title}
        </div>
      </div>
      <LerBadge value={ler} onChange={onLerChange} />
    </div>
  );
}
