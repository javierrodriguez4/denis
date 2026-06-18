"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LerBadge } from "@/components/ui/ler-badge";
import { DAY_NAMES } from "@/lib/constants";
import {
  addDays,
  formatWeekRange,
  getWeekDays,
  getWeekStart,
  toISODate,
} from "@/lib/dates";
import type { CalendarEvent, PlannerEntry } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface WeeklyPlannerProps {
  entries: PlannerEntry[];
  presentations: CalendarEvent[];
}

/** Abbreviated day names for tight mobile columns. */
const DAY_ABBR = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export function WeeklyPlanner({ entries, presentations }: WeeklyPlannerProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const base = addDays(getWeekStart(new Date()), weekOffset * 7);
  const days = getWeekDays(base);
  const todayISO = toISODate(new Date());

  return (
    <div className="space-y-5">
      {/* Week navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekOffset((w) => w - 1)}
          aria-label="Semana anterior"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>

        <span className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight text-[var(--ink)]">
          {formatWeekRange(base)}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekOffset((w) => w + 1)}
          aria-label="Semana siguiente"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* 7-column grid — on mobile, a single scrollable row of compact columns */}
      <div
        className="grid grid-cols-7 gap-2 md:gap-3"
        role="grid"
        aria-label="Planner semanal"
      >
        {days.map((day, i) => {
          const iso = toISODate(day);
          const dayEntries = entries.filter((e) => e.planned_date === iso);
          const dayPresentations = presentations.filter((e) => e.event_date === iso);
          const isToday = iso === todayISO;
          const hasContent = dayEntries.length > 0 || dayPresentations.length > 0;

          return (
            <div
              key={iso}
              role="gridcell"
              aria-label={`${DAY_NAMES[i]} ${day.getDate()}${isToday ? ", hoy" : ""}`}
              className={cn(
                // Base column card
                "relative flex min-h-[120px] flex-col rounded-2xl border bg-[var(--surface)] p-2.5 transition-colors md:p-3",
                isToday
                  ? "border-[var(--accent)]/30 bg-[var(--accent-soft)]/40 ring-2 ring-[var(--accent)]/25"
                  : "border-[var(--soft)]",
              )}
            >
              {/* Day header */}
              <div className="mb-2.5 flex flex-col items-center gap-0.5">
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.1em]",
                    isToday ? "text-[var(--accent)]" : "text-[var(--muted)]",
                  )}
                >
                  {DAY_ABBR[i]}
                </span>

                {/* Date number — today gets an accent circle */}
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold leading-none",
                    isToday
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--ink)]",
                  )}
                  aria-hidden="true"
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Divider */}
              <div
                className={cn(
                  "mb-2 h-px",
                  isToday ? "bg-[var(--accent)]/20" : "bg-[var(--soft)]",
                )}
              />

              {/* Entries */}
              {!hasContent ? (
                <p className="mt-1 text-center text-[10px] leading-snug text-[var(--muted)]/60">
                  —
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5" aria-label="Temas del día">
                  {dayEntries.map((entry) => {
                    const topic = entry.topics;
                    if (!topic) return null;

                    // Compute LER value from topic booleans
                    const lerValue =
                      (topic.read_done ? 1 : 0) +
                      (topic.studied_done ? 1 : 0) +
                      (topic.reviewed_done ? 1 : 0);

                    // Subject color for the accent tick (fallback to var(--accent))
                    const subjectColor = topic.subjects?.color ?? "var(--accent)";

                    return (
                      <li
                        key={entry.id}
                        className="flex flex-col gap-1.5 rounded-xl border border-[var(--soft)] bg-[var(--surface)] p-2"
                      >
                        {/* Subject tick + name */}
                        <div className="flex items-start gap-1.5">
                          <span
                            aria-hidden="true"
                            className="mt-0.5 h-2 w-1.5 flex-none rounded-sm"
                            style={{
                              backgroundColor: subjectColor,
                              opacity: 0.85,
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            {topic.subjects && (
                              <div
                                className="truncate text-[9px] font-semibold uppercase tracking-[0.06em]"
                                style={{ color: subjectColor }}
                              >
                                {topic.subjects.name}
                              </div>
                            )}
                            <div className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-[var(--ink)]">
                              {topic.title}
                            </div>
                          </div>
                        </div>

                        {/* Read-only LER badge */}
                        <LerBadge value={lerValue} size="sm" />
                      </li>
                    );
                  })}

                  {dayPresentations.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-start gap-1.5 rounded-xl border border-blue-200/60 bg-blue-50/60 p-2"
                    >
                      <Presentation
                        className="mt-0.5 h-3 w-3 flex-none text-blue-600"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="text-[9px] font-semibold uppercase tracking-[0.06em] text-blue-500">
                          Presentación
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-[var(--ink)]">
                          {event.title}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend — only shown when there is data to interpret */}
      <p className="px-0.5 text-[11px] text-[var(--muted)]">
        <span className="font-semibold">L</span> leído ·{" "}
        <span className="font-semibold">E</span> estudiado ·{" "}
        <span className="font-semibold">R</span> repasado
      </p>
    </div>
  );
}
