"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EVENT_TYPE_LABELS } from "@/lib/constants";
import type { EventType } from "@/lib/supabase/types";

interface ReminderEvent {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  daysUntil: number;
}

export function ReminderBanner() {
  const [events, setEvents] = useState<ReminderEvent[]>([]);

  useEffect(() => {
    fetch("/api/reminders")
      .then((r) => r.json())
      .then((data) => setEvents(data.events ?? []))
      .catch(() => {});
  }, []);

  if (!events.length) return null;

  return (
    <Card
      className="mb-6 border-[var(--accent)]/20 bg-[var(--accent-soft)]"
      role="region"
      aria-label="Recordatorios próximos"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/60"
          aria-hidden="true"
        >
          <Bell className="h-4 w-4 text-[var(--accent)]" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--ink)]">Recordatorios</p>
          <ul className="mt-1.5 space-y-1" aria-label="Eventos próximos">
            {events.map((e) => (
              <li key={e.id} className="text-sm text-[var(--muted)]">
                <span className="font-medium text-[var(--ink)]">{e.title}</span>
                {" — "}
                {EVENT_TYPE_LABELS[e.event_type as EventType] ?? e.event_type}
                {" en "}
                {e.daysUntil === 0
                  ? "hoy"
                  : `${e.daysUntil} día${e.daysUntil > 1 ? "s" : ""}`}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
