"use client";

import { useEffect, useState } from "react";
import { MobileHeader } from "@/components/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateReminderSettings } from "@/lib/actions/reminders";
import { requestNotificationPermission } from "@/components/pwa/register-sw";
import type { ReminderSettings } from "@/lib/supabase/types";

const PRESETS = [
  { label: "7, 3 y 1 día antes", value: [7, 3, 1] },
  { label: "14, 7 y 1 día antes", value: [14, 7, 1] },
  { label: "Solo 1 día antes", value: [1] },
];

export default function AjustesPage() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifStatus, setNotifStatus] = useState<string>("");

  useEffect(() => {
    fetch("/api/settings/reminders")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(() => {});
  }, []);

  async function save(days: number[], enabled: boolean) {
    setLoading(true);
    await updateReminderSettings({ days_before: days, notifications_enabled: enabled });
    setSettings({ id: 1, days_before: days, notifications_enabled: enabled });
    setLoading(false);
  }

  async function enableNotifications() {
    const ok = await requestNotificationPermission();
    setNotifStatus(
      ok
        ? "Notificaciones activadas en este dispositivo"
        : "Permiso denegado. Actívalo en ajustes del navegador.",
    );
    if (ok && settings) await save(settings.days_before, true);
  }

  return (
    <>
      <MobileHeader title="Ajustes" />
      <div className="hidden md:mb-6 md:block">
        <h1 className="text-2xl font-semibold">Ajustes</h1>
        <p className="text-[var(--muted)]">Recordatorios e instalación</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardTitle>Recordatorios</CardTitle>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Recibe avisos antes de exámenes y presentaciones.
          </p>
          <div className="mt-4 space-y-2">
            {PRESETS.map((p) => (
              <Button
                key={p.label}
                variant={
                  JSON.stringify(settings?.days_before) === JSON.stringify(p.value)
                    ? "primary"
                    : "secondary"
                }
                className="w-full justify-start"
                disabled={loading}
                onClick={() => save(p.value, settings?.notifications_enabled ?? true)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Notificaciones del navegador</CardTitle>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Para recibir avisos en el celular, instala Denis desde el navegador
            (Agregar a pantalla de inicio) y activa las notificaciones.
          </p>
          <Button className="mt-4" onClick={enableNotifications}>
            Activar notificaciones
          </Button>
          {notifStatus && (
            <p className="mt-2 text-sm text-[var(--muted)]">{notifStatus}</p>
          )}
        </Card>

        <Card>
          <CardTitle>Instalar en el celular</CardTitle>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[var(--muted)]">
            <li>Abre Denis en Chrome o Safari</li>
            <li>Toca el menú (⋮ o compartir)</li>
            <li>Elige &quot;Agregar a pantalla de inicio&quot; o &quot;Instalar app&quot;</li>
          </ol>
        </Card>
      </div>
    </>
  );
}
