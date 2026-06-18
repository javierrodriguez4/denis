"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">
          {formatDate(month + "-01", "MMMM yyyy")}
        </h2>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          Nuevo evento
        </Button>
      </div>

      {(showForm || editing) && (
        <EventForm
          subjects={subjects}
          event={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); router.refresh(); }}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id}>
            <div
              className="mb-2 h-1 rounded-full"
              style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type] }}
            />
            <p className="font-medium">{event.title}</p>
            <p className="text-sm text-[var(--muted)]">
              {EVENT_TYPE_LABELS[event.event_type]} · {formatDate(event.event_date)}
            </p>
            {event.subjects && (
              <p className="mt-1 text-xs" style={{ color: event.subjects.color }}>
                {event.subjects.name}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(event)}>
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
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            No hay eventos este mes. Agrega parciales, finales o presentaciones.
          </p>
        </Card>
      )}
    </div>
  );
}

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
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Tipo</Label>
            <Select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
            >
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
          <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </form>
    </Card>
  );
}
