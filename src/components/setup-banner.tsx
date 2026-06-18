import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function SetupBanner() {
  if (isSupabaseConfigured()) return null;

  return (
    <Card className="mb-6 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium text-amber-900 dark:text-amber-100">
            Configuración pendiente
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
            Copia <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">.env.local.example</code>{" "}
            a <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">.env.local</code> y
            completa las claves de Supabase. Consulta el README para los pasos detallados.
          </p>
        </div>
      </div>
    </Card>
  );
}
