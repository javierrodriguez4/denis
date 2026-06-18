"use client";

import { useEffect } from "react";
import { showLocalNotification } from "@/components/pwa/register-sw";

export function NotificationScheduler() {
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/reminders");
        const data = await res.json();
        const events = data.events ?? [];
        const key = `denis-notified-${new Date().toISOString().slice(0, 10)}`;
        const notified: string[] = JSON.parse(localStorage.getItem(key) ?? "[]");

        for (const e of events) {
          if (notified.includes(e.id)) continue;
          const shown = showLocalNotification(
            "Denis — Recordatorio",
            `${e.title} ${e.daysUntil === 0 ? "es hoy" : `en ${e.daysUntil} día${e.daysUntil > 1 ? "s" : ""}`}`,
          );
          if (shown) notified.push(e.id);
        }

        localStorage.setItem(key, JSON.stringify(notified));
      } catch {
        /* ignore */
      }
    };

    check();
    const interval = setInterval(check, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
