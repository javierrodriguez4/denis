"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardSection, CardTitle } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/lib/constants";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/actions/calendar";
import { upsertStudyLog, deleteStudyLog } from "@/lib/actions/study-logs";
import type { CalendarEvent, EventType, StudyLog, Subject } from "@/lib/supabase/types";
import { formatDate, toISODate } from "@/lib/dates";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Tailwind-safe chip styles keyed by event type
const EVENT_CHIP_STYLE: Record<string, string> = {
  parcial: "bg-amber-500 text-white",
  final: "bg-red-600 text-white",
  presentacion: "bg-blue-600 text-white",
  otro: "bg-[var(--muted)] text-white",
};

interface CalendarGridProps {
  events: CalendarEvent[];
  studyLogs: StudyLog[];
  subjects: Subject[];
  month: string;
}

export function CalendarGrid({ events, studyLogs, subjects, month }: CalendarGridProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [studyHours, setStudyHours] = useState("");
  const [studyNotes, setStudyNotes] = useState("");
  const [savingStudy, setSavingStudy] = useState(false);

  const monthDate = parseISO(`${month}-01`);
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthDate]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      if (!map[e.event_date]) map[e.event_date] = [];
      map[e.event_date].push(e);
    }
    return map;
  }, [events]);

  const studyByDate = useMemo(() => {
    const map: Record<string, StudyLog> = {};
    for (const log of studyLogs) map[log.log_date] = log;
    return map;
  }, [studyLogs]);

  function navigateMonth(delta: number) {
    const next = format(addMonths(monthDate, delta), "yyyy-MM");
    router.push(`/calendario?mes=${next}`);
  }

  function openDay(iso: string) {
    setSelectedDate(iso);
    setShowEventForm(false);
    setEditingEvent(null);
    const log = studyByDate[iso];
    setStudyHours(log ? String(log.hours) : "");
    setStudyNotes(log?.notes ?? "");
  }

  function closeDetail() {
    setSelectedDate(null);
    setShowEventForm(false);
    setEditingEvent(null);
  }

  async function saveStudyTime() {
    if (!selectedDate) return;
    setSavingStudy(true);
    const hours = parseFloat(studyHours);
    if (Number.isNaN(hours) || hours <= 0) {
      await deleteStudyLog(selectedDate);
    } else {
      await upsertStudyLog(selectedDate, hours, studyNotes);
    }
    setSavingStudy(false);
    router.refresh();
  }

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] ?? [] : [];
  const selectedStudy = selectedDate ? studyByDate[selectedDate] : null;
  const today = toISODate(new Date());
  const monthTotal = studyLogs.reduce((s, l) => s + Number(l.hours), 0);
  const monthLabel = format(monthDate, "MMMM yyyy", { locale: es });

  return (
    <div className="space-y-5">
      {/* ── Month navigation header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* SectionLabel with inline month nav */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => navigateMonth(-1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[var(--muted)] transition-colors hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <span
            className="min-w-[140px] text-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)] capitalize"
            aria-live="polite"
          >
            {monthLabel}
          </span>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => navigateMonth(1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[var(--muted)] transition-colors hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {/* Right side: study total + new event */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
            <Clock className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
            {monthTotal.toFixed(1)} h este mes
          </span>
          <Button
            size="sm"
            onClick={() => {
              setSelectedDate(today);
              setShowEventForm(true);
              setEditingEvent(null);
            }}
            aria-label="Nuevo evento"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nuevo evento
          </Button>
        </div>
      </div>

      {/* ── Responsive layout: grid on lg ── */}
      <div className={cn("flex flex-col gap-5", selectedDate && "lg:grid lg:grid-cols-[1fr_360px] lg:items-start")}>
        {/* Calendar grid card */}
        <Card className="overflow-hidden p-0">
          {/* Weekday headers */}
          <div
            className="grid grid-cols-7 border-b border-[var(--soft)] bg-[var(--accent-soft)]"
            role="row"
            aria-hidden="true"
          >
            {WEEKDAY_LABELS.map((d) => (
              <div
                key={d}
                className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7" role="grid" aria-label={`Calendario de ${monthLabel}`}>
            {calendarDays.map((day) => {
              const iso = toISODate(day);
              const inMonth = day.getMonth() === monthDate.getMonth();
              const dayEvents = eventsByDate[iso] ?? [];
              const study = studyByDate[iso];
              const isSelected = selectedDate === iso;
              const isToday = iso === today;

              return (
                <button
                  key={iso}
                  type="button"
                  role="gridcell"
                  aria-label={`${format(day, "EEEE d", { locale: es })}${dayEvents.length ? `, ${dayEvents.length} evento${dayEvents.length > 1 ? "s" : ""}` : ""}`}
                  aria-pressed={isSelected}
                  onClick={() => openDay(iso)}
                  className={cn(
                    "group min-h-[72px] border-b border-r border-[var(--soft)] p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] sm:min-h-[88px]",
                    !inMonth && "opacity-35",
                    isSelected
                      ? "bg-[var(--accent-soft)] ring-1 ring-inset ring-[var(--accent)]/40"
                      : "hover:bg-[var(--soft)]/40",
                    isToday && !isSelected && "bg-[var(--accent-soft)]/40",
                  )}
                >
                  {/* Day number */}
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--ink)] group-hover:text-[var(--accent)]",
                      !inMonth && "text-[var(--muted)]",
                    )}
                  >
                    {day.getDate()}
                  </span>

                  {/* Study hours dot */}
                  {study && (
                    <p className="mt-0.5 truncate text-[10px] font-semibold text-[var(--accent)]">
                      {Number(study.hours).toFixed(1)}h
                    </p>
                  )}

                  {/* Event chips */}
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <p
                        key={e.id}
                        className={cn(
                          "truncate rounded-md px-1 py-px text-[10px] font-medium leading-tight",
                          EVENT_CHIP_STYLE[e.event_type] ?? "bg-[var(--muted)] text-white",
                        )}
                      >
                        {e.title}
                      </p>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-[10px] font-medium text-[var(--muted)]">
                        +{dayEvents.length - 2}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* ── Day detail panel ── */}
        {selectedDate && (
          <div className="space-y-4" aria-label={`Detalle del ${formatDate(selectedDate, "EEEE d MMMM")}`}>
            <Card className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="capitalize">
                  {formatDate(selectedDate, "EEEE d MMMM")}
                </CardTitle>
                <button
                  type="button"
                  aria-label="Cerrar panel de día"
                  onClick={closeDetail}
                  className="mt-0.5 rounded-lg p-1 text-[var(--muted)] transition-colors hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              {/* Study time section */}
              <CardSection>
                <SectionLabel className="mb-3">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
                    Tiempo de estudio
                  </span>
                </SectionLabel>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="sm:w-28">
                    <Label>Horas</Label>
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      placeholder="Ej: 3"
                      value={studyHours}
                      onChange={(e) => setStudyHours(e.target.value)}
                      aria-label="Horas de estudio"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Notas (opcional)</Label>
                    <Input
                      placeholder="Qué estudiaste..."
                      value={studyNotes}
                      onChange={(e) => setStudyNotes(e.target.value)}
                      aria-label="Notas de estudio"
                    />
                  </div>
                  <Button onClick={saveStudyTime} disabled={savingStudy} size="sm">
                    {savingStudy ? "Guardando..." : "Guardar"}
                  </Button>
                </div>

                {selectedStudy && (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Registrado: {Number(selectedStudy.hours).toFixed(1)} h
                    {selectedStudy.notes ? ` — ${selectedStudy.notes}` : ""}
                  </p>
                )}
              </CardSection>

              {/* Events section */}
              <CardSection>
                <div className="mb-3 flex items-center justify-between">
                  <SectionLabel className="mb-0">Eventos del día</SectionLabel>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowEventForm(true);
                      setEditingEvent(null);
                    }}
                    aria-label="Agregar evento"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Agregar
                  </Button>
                </div>

                {selectedEvents.length === 0 && !showEventForm && (
                  <p className="text-sm text-[var(--muted)]">Sin eventos este día.</p>
                )}

                <ul className="space-y-2" aria-label="Lista de eventos">
                  {selectedEvents.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-start gap-3 rounded-xl border border-[var(--soft)] p-3"
                    >
                      {/* Color dot with semantic event type color */}
                      <div
                        aria-hidden="true"
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--ink)]">{event.title}</p>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          {EVENT_TYPE_LABELS[event.event_type]}
                          {event.subjects ? ` · ${event.subjects.name}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label={`Editar evento ${event.title}`}
                          onClick={() => {
                            setEditingEvent(event);
                            setShowEventForm(true);
                          }}
                          className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar evento ${event.title}`}
                          onClick={async () => {
                            if (confirm("¿Eliminar evento?")) {
                              await deleteCalendarEvent(event.id);
                              router.refresh();
                            }
                          }}
                          className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardSection>

              {/* Event form */}
              {(showEventForm || editingEvent) && (
                <CardSection>
                  <EventForm
                    subjects={subjects}
                    event={editingEvent}
                    defaultDate={selectedDate}
                    onClose={() => {
                      setShowEventForm(false);
                      setEditingEvent(null);
                    }}
                    onSaved={() => {
                      setShowEventForm(false);
                      setEditingEvent(null);
                      router.refresh();
                    }}
                  />
                </CardSection>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Event form ─────────────────────────────────────────────────────────────

function EventForm({
  subjects,
  event,
  defaultDate,
  onClose,
  onSaved,
}: {
  subjects: Subject[];
  event: CalendarEvent | null;
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [eventType, setEventType] = useState<EventType>(event?.event_type ?? "parcial");
  const [eventDate, setEventDate] = useState(event?.event_date ?? defaultDate);
  const [eventTime, setEventTime] = useState(event?.event_time ?? "");
  const [subjectId, setSubjectId] = useState(event?.subject_id ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const input = {
      title,
      event_type: eventType,
      event_date: eventDate,
      event_time: eventTime || undefined,
      subject_id: subjectId || undefined,
      notes: notes || undefined,
    };
    if (event) await updateCalendarEvent(event.id, input);
    else await createCalendarEvent(input);
    setLoading(false);
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" aria-label={event ? "Editar evento" : "Nuevo evento"}>
      <p className="text-sm font-semibold text-[var(--ink)]">
        {event ? "Editar evento" : "Nuevo evento"}
      </p>

      <div>
        <Label>Título</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Ej: Parcial de Anatomía"
          aria-required="true"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Tipo</Label>
          <Select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>
            {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Fecha</Label>
          <Input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            aria-required="true"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Hora (opcional)</Label>
          <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
        </div>
        <div>
          <Label>Materia (opcional)</Label>
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Sin materia</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label>Notas</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
