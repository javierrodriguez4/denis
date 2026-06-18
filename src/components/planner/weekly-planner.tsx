"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DAY_NAMES, EVENT_TYPE_COLORS } from "@/lib/constants";
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

export function WeeklyPlanner({ entries, presentations }: WeeklyPlannerProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const base = addDays(getWeekStart(new Date()), weekOffset * 7);
  const days = getWeekDays(base);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setWeekOffset((w) => w - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{formatWeekRange(base)}</span>
        <Button variant="ghost" onClick={() => setWeekOffset((w) => w + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day, i) => {
          const iso = toISODate(day);
          const dayEntries = entries.filter((e) => e.planned_date === iso);
          const dayPresentations = presentations.filter((e) => e.event_date === iso);
          const isToday = iso === toISODate(new Date());
          const hasContent = dayEntries.length > 0 || dayPresentations.length > 0;

          return (
            <Card
              key={iso}
              className={cn(isToday && "ring-2 ring-[var(--accent)]/40")}
            >
              <div className="mb-3">
                <p className="text-xs text-[var(--muted)]">{DAY_NAMES[i]}</p>
                <p className={cn("text-lg font-semibold", isToday && "text-[var(--accent)]")}>
                  {day.getDate()}
                </p>
              </div>

              {!hasContent ? (
                <p className="text-xs text-[var(--muted)]">Sin clases ni presentaciones</p>
              ) : (
                <ul className="space-y-2">
                  {dayEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-lg border border-[var(--border)] p-2"
                    >
                      <p className="text-xs font-medium leading-snug">
                        {entry.topics?.title}
                      </p>
                      {entry.topics?.subjects && (
                        <span
                          className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px]"
                          style={{
                            backgroundColor: `${entry.topics.subjects.color}20`,
                            color: entry.topics.subjects.color,
                          }}
                        >
                          {entry.topics.subjects.name}
                        </span>
                      )}
                    </li>
                  ))}

                  {dayPresentations.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-lg border p-2"
                      style={{
                        borderColor: `${EVENT_TYPE_COLORS.presentacion}40`,
                        backgroundColor: `${EVENT_TYPE_COLORS.presentacion}10`,
                      }}
                    >
                      <div className="flex items-start gap-1.5">
                        <Presentation
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          style={{ color: EVENT_TYPE_COLORS.presentacion }}
                        />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                            Presentación
                          </p>
                          <p className="text-xs font-medium leading-snug">{event.title}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
