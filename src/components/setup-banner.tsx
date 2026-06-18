import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function SetupBanner() {
  if (isSupabaseConfigured()) return null;

  return (
    <Card
      className="mb-6 border-amber-300/60 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-950/20"
      role="alert"
      aria-label="Configuración pendiente"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40"
          aria-hidden="true"
        >
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Configuración pendiente
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
            Copia{" "}
            <code className="rounded-md bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/60">
              .env.local.example
            </code>{" "}
            a{" "}
            <code className="rounded-md bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/60">
              .env.local
            </code>{" "}
            y completa las claves de Supabase. Consulta el README para los pasos detallados.
          </p>
        </div>
      </div>
    </Card>
  );
}
