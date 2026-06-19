"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** L·E·R·C study stages, in order. */
export const LER_STAGES = ["leído", "estudiado", "repasado", "choice"] as const;
export type LerStage = 0 | 1 | 2 | 3;

const LETTERS = ["L", "E", "R", "C"] as const;

interface LerBadgeProps {
  /**
   * Number of completed stages (0..segments). Segments below this index render as "on".
   */
  value: number;
  /**
   * Interactive mode: clicking a segment reports the new completed-count.
   * Omit for a read-only indicator.
   */
  onChange?: (value: number) => void;
  /** Visual size of each segment. */
  size?: "sm" | "md";
  /** How many sequential stages to render (3 = L·E·R, 4 = L·E·R·C). Defaults to 3. */
  segments?: 3 | 4;
  className?: string;
}

export function LerBadge({
  value,
  onChange,
  size = "md",
  segments = 3,
  className,
}: LerBadgeProps) {
  const interactive = typeof onChange === "function";
  const completed = Math.min(segments, Math.max(0, Math.round(value)));
  const letters = LETTERS.slice(0, segments);

  const stageNames = LER_STAGES.slice(0, segments).join(", ");

  const dims = size === "sm" ? "h-6 w-6 text-[10px]" : "h-[26px] w-[26px] text-[10px]";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div
      className={cn("flex flex-none gap-1.5", className)}
      role={interactive ? "group" : undefined}
      aria-label={interactive ? `Progreso de estudio (${stageNames})` : undefined}
    >
      {letters.map((letter, index) => {
        const on = index < completed;
        const stage = LER_STAGES[index];
        const segmentClasses = cn(
          "flex items-center justify-center rounded-[7px] border font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
          dims,
          on
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[var(--soft)] bg-[var(--surface)] text-[var(--muted)]",
        );

        const content = on ? (
          <Check className={iconSize} strokeWidth={3} aria-hidden="true" />
        ) : (
          letter
        );

        if (!interactive) {
          return (
            <span
              key={letter}
              className={segmentClasses}
              aria-label={`${stage}: ${on ? "completo" : "pendiente"}`}
              title={cap(stage)}
            >
              {content}
            </span>
          );
        }

        return (
          <button
            key={letter}
            type="button"
            // Toggling a stage: if it is the last "on" stage, drop it; otherwise
            // mark all stages up to and including this one as complete.
            onClick={() => onChange(on && index + 1 === completed ? index : index + 1)}
            aria-pressed={on}
            aria-label={`Marcar ${stage}`}
            title={cap(stage)}
            className={segmentClasses}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
