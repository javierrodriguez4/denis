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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[160px] text-center text-lg font-semibold capitalize">
            {format(monthDate, "MMMM yyyy", { locale: es })}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--muted)]">
            <Clock className="mr-1 inline h-4 w-4" />
            {monthTotal.toFixed(1)} h este mes
          </span>
          <Button
            size="sm"
            onClick={() => {
              setSelectedDate(today);
              setShowEventForm(true);
              setEditingEvent(null);
            }}
          >
            <Plus className="h-4 w-4" />
            Nuevo evento
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-hover)]">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-[var(--muted)]">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
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
                onClick={() => openDay(iso)}
                className={cn(
                  "min-h-[88px] border-b border-r border-[var(--border)] p-1.5 text-left transition-colors hover:bg-[var(--surface-hover)]",
                  !inMonth && "bg-[var(--background)] opacity-40",
                  isSelected && "bg-[var(--accent)]/10 ring-1 ring-inset ring-[var(--accent)]/40",
                  isToday && !isSelected && "bg-[var(--accent)]/5",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday && "bg-[var(--accent)] text-white",
                  )}
                >
                  {day.getDate()}
                </span>

                {study && (
                  <p className="mt-0.5 truncate text-[10px] font-medium text-[var(--accent)]">
                    {Number(study.hours).toFixed(1)}h estudio
                  </p>
                )}

                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <p
                      key={e.id}
                      className="truncate rounded px-1 text-[10px] leading-tight text-white"
                      style={{ backgroundColor: EVENT_TYPE_COLORS[e.event_type] }}
                    >
                      {e.title}
                    </p>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[10px] text-[var(--muted)]">+{dayEvents.length - 2} más</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {selectedDate && (
        <Card>
          <CardTitle>{formatDate(selectedDate, "EEEE d MMMM")}</CardTitle>

          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-[var(--border)] p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-[var(--accent)]" />
                Tiempo de estudio
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="sm:w-32">
                  <Label>Horas</Label>
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    placeholder="Ej: 3"
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label>Notas (opcional)</Label>
                  <Input
                    placeholder="Qué estudiaste..."
                    value={studyNotes}
                    onChange={(e) => setStudyNotes(e.target.value)}
                  />
                </div>
                <Button onClick={saveStudyTime} disabled={savingStudy} size="sm">
                  {savingStudy ? "Guardando..." : "Guardar"}
                </Button>
              </div>
              {selectedStudy && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Registrado: {Number(selectedStudy.hours).toFixed(1)} horas
                  {selectedStudy.notes ? ` — ${selectedStudy.notes}` : ""}
                </p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">Eventos del día</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowEventForm(true);
                    setEditingEvent(null);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Agregar
                </Button>
              </div>

              {selectedEvents.length === 0 && !showEventForm && (
                <p className="text-sm text-[var(--muted)]">Sin eventos este día.</p>
              )}

              <ul className="space-y-2">
                {selectedEvents.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-3"
                  >
                    <div
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {EVENT_TYPE_LABELS[event.event_type]}
                        {event.subjects ? ` · ${event.subjects.name}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingEvent(event);
                          setShowEventForm(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm("¿Eliminar evento?")) {
                            await deleteCalendarEvent(event.id);
                            router.refresh();
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {(showEventForm || editingEvent) && (
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
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

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
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-[var(--border)] p-3">
      <p className="text-sm font-medium">{event ? "Editar evento" : "Nuevo evento"}</p>
      <div>
        <Label>Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
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
          <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
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
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}
