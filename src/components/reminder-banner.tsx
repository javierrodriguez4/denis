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
    <Card className="mb-6 border-[var(--accent)]/30 bg-[var(--accent)]/5">
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
        <div className="space-y-2">
          <p className="font-medium">Recordatorios</p>
          {events.map((e) => (
            <p key={e.id} className="text-sm text-[var(--muted)]">
              <span className="font-medium text-[var(--foreground)]">{e.title}</span>
              {" — "}
              {EVENT_TYPE_LABELS[e.event_type as EventType] ?? e.event_type}
              {" en "}
              {e.daysUntil === 0 ? "hoy" : `${e.daysUntil} día${e.daysUntil > 1 ? "s" : ""}`}
            </p>
          ))}
        </div>
      </div>
    </Card>
  );
}
