"use client";

import { useEffect, useState } from "react";
import { Bell, Download, Check } from "lucide-react";
import { Card, CardTitle, CardSection } from "@/components/ui/card";
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
    setSettings((prev) => ({
      id: prev?.id ?? 1,
      user_id: prev?.user_id ?? "",
      days_before: days,
      notifications_enabled: enabled,
    }));
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
    <div className="mx-auto w-full max-w-2xl">
      {/* Page heading */}
      <header className="mb-7 px-0.5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Configuración
        </p>
        <h1 className="mt-1.5 font-[family-name:var(--font-display)] text-[27px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--ink)] md:text-[32px]">
          Ajustes
        </h1>
      </header>

      <div className="space-y-4">
        {/* Reminders card */}
        <Card>
          <CardSection>
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)]"
                aria-hidden="true"
              >
                <Bell className="h-4 w-4 text-[var(--accent)]" />
              </span>
              <div className="flex-1 min-w-0">
                <CardTitle>Recordatorios</CardTitle>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Recibe avisos antes de exámenes y presentaciones.
                </p>
              </div>
            </div>

            <fieldset className="mt-5 border-0 p-0" disabled={loading}>
              <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Cuándo avisarte
              </legend>
              {/* Chip group — wraps on narrow screens */}
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Días de anticipación"
              >
                {PRESETS.map((p) => {
                  const active =
                    JSON.stringify(settings?.days_before) === JSON.stringify(p.value);
                  return (
                    <button
                      key={p.label}
                      role="radio"
                      aria-checked={active}
                      onClick={() =>
                        save(p.value, settings?.notifications_enabled ?? true)
                      }
                      disabled={loading}
                      className={[
                        // base chip
                        "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors outline-none",
                        "focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
                        "disabled:opacity-50 cursor-pointer",
                        // selected vs idle
                        active
                          ? "bg-[var(--accent)] text-white shadow-sm"
                          : "border border-[var(--soft)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent)]",
                      ].join(" ")}
                    >
                      {active && (
                        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      )}
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </CardSection>
        </Card>

        {/* Browser notifications card */}
        <Card>
          <CardSection>
            <CardTitle>Notificaciones del navegador</CardTitle>
            <p className="mt-1.5 text-sm text-[var(--muted)]">
              Para recibir avisos en el celular, instala Denis desde el
              navegador (Agregar a pantalla de inicio) y activa las
              notificaciones.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <Button
                variant="primary"
                size="md"
                onClick={enableNotifications}
                aria-label="Activar notificaciones del navegador"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                Activar notificaciones
              </Button>
              {notifStatus && (
                <p
                  className="text-sm text-[var(--muted)]"
                  role="status"
                  aria-live="polite"
                >
                  {notifStatus}
                </p>
              )}
            </div>
          </CardSection>
        </Card>

        {/* Install PWA card */}
        <Card>
          <CardSection>
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)]"
                aria-hidden="true"
              >
                <Download className="h-4 w-4 text-[var(--accent)]" />
              </span>
              <div className="flex-1 min-w-0">
                <CardTitle>Instalar en el celular</CardTitle>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Usá Denis como app nativa — sin abrir el navegador.
                </p>
              </div>
            </div>
            <ol className="mt-4 space-y-2 pl-1">
              {[
                "Abre Denis en Chrome o Safari",
                "Toca el menú (⋮ o compartir)",
                'Elige "Agregar a pantalla de inicio" o "Instalar app"',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[var(--muted)]">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </CardSection>
        </Card>
      </div>
    </div>
  );
}
