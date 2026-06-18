"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/lib/constants";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/actions/calendar";
import type { CalendarEvent, EventType, Subject } from "@/lib/supabase/types";
import { formatDate } from "@/lib/dates";

export function CalendarManager({
  events,
  subjects,
  month,
}: {
  events: CalendarEvent[];
  subjects: Subject[];
  month: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionLabel className="mb-0 capitalize">
          {formatDate(month + "-01", "MMMM yyyy")}
        </SectionLabel>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          aria-label="Nuevo evento"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo evento
        </Button>
      </div>

      {/* Event form */}
      {(showForm || editing) && (
        <EventForm
          subjects={subjects}
          event={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      {/* Events grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="flex flex-col gap-2 p-4">
            {/* Color accent bar */}
            <div
              aria-hidden="true"
              className="h-1 w-full rounded-full"
              style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type] }}
            />
            <CardTitle>{event.title}</CardTitle>
            <p className="text-xs text-[var(--muted)]">
              {EVENT_TYPE_LABELS[event.event_type]} · {formatDate(event.event_date)}
            </p>
            {event.subjects && (
              <p className="text-xs font-medium" style={{ color: event.subjects.color }}>
                {event.subjects.name}
              </p>
            )}
            <div className="mt-auto flex gap-1 pt-1">
              <button
                type="button"
                aria-label={`Editar evento ${event.title}`}
                onClick={() => {
                  setEditing(event);
                  setShowForm(false);
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
          </Card>
        ))}
      </div>

      {events.length === 0 && !showForm && (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            No hay eventos este mes. Agrega parciales, finales o presentaciones.
          </p>
        </Card>
      )}
    </div>
  );
}

// ── Event form ─────────────────────────────────────────────────────────────

function EventForm({
  subjects,
  event,
  onClose,
  onSaved,
}: {
  subjects: Subject[];
  event: CalendarEvent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [eventType, setEventType] = useState<EventType>(event?.event_type ?? "parcial");
  const [eventDate, setEventDate] = useState(event?.event_date ?? "");
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
    <Card>
      <CardTitle>{event ? "Editar evento" : "Nuevo evento"}</CardTitle>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3" aria-label={event ? "Editar evento" : "Nuevo evento"}>
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
        <div className="flex gap-2">
          <Button type="submit" disabled={loading} size="sm">
            {loading ? "Guardando..." : "Guardar"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
