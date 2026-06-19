"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Presentation,
  X,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { DAY_NAMES, EVENT_TYPE_LABELS } from "@/lib/constants";
import {
  addDays,
  formatWeekRange,
  getWeekDays,
  getWeekStart,
  toISODate,
} from "@/lib/dates";
import {
  addPlannerEntry,
  movePlannerEntry,
  removePlannerEntry,
  type SubjectWithTopics,
} from "@/lib/actions/planner";
import {
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/actions/calendar";
import type { CalendarEvent, EventType, PlannerEntry } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface WeeklyPlannerProps {
  entries: PlannerEntry[];
  presentations: CalendarEvent[];
  subjects: SubjectWithTopics[];
}

/** Abbreviated day names for tight mobile columns. */
const DAY_ABBR = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export function WeeklyPlanner({
  entries,
  presentations,
  subjects,
}: WeeklyPlannerProps) {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Per-day "add topic" panel + per-event edit panel are tracked by id/iso.
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const base = addDays(getWeekStart(new Date()), weekOffset * 7);
  const days = getWeekDays(base);
  const todayISO = toISODate(new Date());
  const weekDayOptions = days.map((d, i) => ({
    iso: toISODate(d),
    label: `${DAY_ABBR[i]} ${d.getDate()}`,
  }));

  function run(action: () => Promise<{ error?: string } | { success?: boolean } | unknown>) {
    setError(null);
    startTransition(async () => {
      const result = (await action()) as { error?: string } | undefined;
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

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

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {/* 7-column grid */}
      <div
        className="grid grid-cols-7 gap-2 md:gap-3"
        role="grid"
        aria-label="Planner semanal"
      >
        {days.map((day, i) => {
          const iso = toISODate(day);
          const dayEntries = entries.filter((e) => e.planned_date === iso);
          const dayPresentations = presentations.filter(
            (e) => e.event_date === iso,
          );
          const isToday = iso === todayISO;
          const hasContent =
            dayEntries.length > 0 || dayPresentations.length > 0;

          return (
            <div
              key={iso}
              role="gridcell"
              aria-label={`${DAY_NAMES[i]} ${day.getDate()}${isToday ? ", hoy" : ""}`}
              className={cn(
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

                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold leading-none",
                    isToday ? "bg-[var(--accent)] text-white" : "text-[var(--ink)]",
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
                    const subjectColor = topic.subjects?.color ?? "var(--accent)";

                    return (
                      <li
                        key={entry.id}
                        className="flex flex-col gap-1.5 rounded-xl border border-[var(--soft)] bg-[var(--surface)] p-2"
                      >
                        <div className="flex items-start gap-1.5">
                          <span
                            aria-hidden="true"
                            className="mt-0.5 h-2 w-1.5 flex-none rounded-sm"
                            style={{ backgroundColor: subjectColor, opacity: 0.85 }}
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

                          {/* Remove control */}
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => run(() => removePlannerEntry(entry.id))}
                            aria-label={`Quitar ${topic.title} del planner`}
                            className="rounded-md p-0.5 text-[var(--muted)] transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
                          >
                            <X className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </div>

                        {/* Move-to-day picker */}
                        <label className="sr-only" htmlFor={`move-${entry.id}`}>
                          Mover {topic.title} a otro día
                        </label>
                        <Select
                          id={`move-${entry.id}`}
                          value={iso}
                          disabled={isPending}
                          onChange={(e) => {
                            const next = e.target.value;
                            if (next !== iso) {
                              run(() => movePlannerEntry(entry.id, next));
                            }
                          }}
                          className="px-1.5 py-1 text-[10px]"
                          aria-label={`Mover ${topic.title} a otro día`}
                        >
                          {weekDayOptions.map((o) => (
                            <option key={o.iso} value={o.iso}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
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
                      <div className="min-w-0 flex-1">
                        <div className="text-[9px] font-semibold uppercase tracking-[0.06em] text-blue-500">
                          {EVENT_TYPE_LABELS[event.event_type]}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingDay(null);
                            setEditingEvent(event);
                          }}
                          className="mt-0.5 line-clamp-2 w-full text-left text-[11px] font-medium leading-snug text-[var(--ink)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          aria-label={`Editar evento ${event.title}`}
                        >
                          {event.title}
                        </button>
                      </div>
                      <Pencil
                        className="mt-0.5 h-2.5 w-2.5 flex-none text-blue-400"
                        aria-hidden="true"
                      />
                    </li>
                  ))}
                </ul>
              )}

              {/* Add-topic affordance */}
              <button
                type="button"
                onClick={() => {
                  setEditingEvent(null);
                  setAddingDay((d) => (d === iso ? null : iso));
                }}
                aria-label={`Agregar tema al ${DAY_NAMES[i]} ${day.getDate()}`}
                aria-expanded={addingDay === iso}
                className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--soft)] py-1 text-[10px] font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                Tema
              </button>
            </div>
          );
        })}
      </div>

      {/* Add-topic panel (full width, below the grid for mobile usability) */}
      {addingDay && (
        <AddTopicPanel
          dateISO={addingDay}
          dateLabel={
            weekDayOptions.find((o) => o.iso === addingDay)?.label ?? addingDay
          }
          subjects={subjects}
          pending={isPending}
          onClose={() => setAddingDay(null)}
          onAdd={(topicId) =>
            run(async () => {
              const res = await addPlannerEntry(topicId, addingDay);
              setAddingDay(null);
              return res;
            })
          }
        />
      )}

      {/* Edit-event panel */}
      {editingEvent && (
        <EditEventPanel
          event={editingEvent}
          subjects={subjects}
          pending={isPending}
          onClose={() => setEditingEvent(null)}
          onSave={(input) =>
            run(async () => {
              const res = await updateCalendarEvent(editingEvent.id, input);
              setEditingEvent(null);
              return res;
            })
          }
          onDelete={() =>
            run(async () => {
              const res = await deleteCalendarEvent(editingEvent.id);
              setEditingEvent(null);
              return res;
            })
          }
        />
      )}
    </div>
  );
}

// ── Add-topic panel ──────────────────────────────────────────────────────────

function AddTopicPanel({
  dateISO,
  dateLabel,
  subjects,
  pending,
  onClose,
  onAdd,
}: {
  dateISO: string;
  dateLabel: string;
  subjects: SubjectWithTopics[];
  pending: boolean;
  onClose: () => void;
  onAdd: (topicId: string) => void;
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const subject = subjects.find((s) => s.id === subjectId);
  const [topicId, setTopicId] = useState(subject?.topics[0]?.id ?? "");

  return (
    <div className="rounded-2xl border border-[var(--soft)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--ink)]">
          Agregar tema — {dateLabel}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-lg p-1 text-[var(--muted)] transition-colors hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {subjects.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No hay materias todavía. Creá una materia y agregá temas primero.
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor={`add-subject-${dateISO}`}>Materia</Label>
            <Select
              id={`add-subject-${dateISO}`}
              value={subjectId}
              onChange={(e) => {
                const sid = e.target.value;
                setSubjectId(sid);
                const next = subjects.find((s) => s.id === sid);
                setTopicId(next?.topics[0]?.id ?? "");
              }}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor={`add-topic-${dateISO}`}>Tema</Label>
            <Select
              id={`add-topic-${dateISO}`}
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              disabled={!subject?.topics.length}
            >
              {subject?.topics.length ? (
                subject.topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))
              ) : (
                <option value="">Sin temas</option>
              )}
            </Select>
          </div>
          <Button
            size="sm"
            disabled={pending || !topicId}
            onClick={() => topicId && onAdd(topicId)}
          >
            Agregar
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Edit-event panel ─────────────────────────────────────────────────────────

interface EventInput {
  title: string;
  event_type: EventType;
  event_date: string;
  subject_id?: string;
}

function EditEventPanel({
  event,
  subjects,
  pending,
  onClose,
  onSave,
  onDelete,
}: {
  event: CalendarEvent;
  subjects: SubjectWithTopics[];
  pending: boolean;
  onClose: () => void;
  onSave: (input: EventInput) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [eventType, setEventType] = useState<EventType>(event.event_type);
  const [eventDate, setEventDate] = useState(event.event_date);
  const [subjectId, setSubjectId] = useState(event.subject_id ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      title,
      event_type: eventType,
      event_date: eventDate,
      subject_id: subjectId || undefined,
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--soft)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--ink)]">Editar evento</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-lg p-1 text-[var(--muted)] transition-colors hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" aria-label="Editar evento">
        <div>
          <Label htmlFor="event-title">Título</Label>
          <Input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            aria-required="true"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="event-type">Tipo</Label>
            <Select
              id="event-type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
            >
              {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="event-date">Fecha</Label>
            <Input
              id="event-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              aria-required="true"
            />
          </div>
          <div>
            <Label htmlFor="event-subject">Materia</Label>
            <Select
              id="event-subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Sin materia</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" size="sm" disabled={pending}>
            Guardar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={onDelete}
            className="text-red-600 hover:bg-red-50"
          >
            Eliminar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
