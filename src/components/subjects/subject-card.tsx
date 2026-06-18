import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Subject } from "@/lib/supabase/types";

interface SubjectCardProps {
  subject: Subject;
  progress?: { total: number; read: number; studied: number; reviewed: number };
}

export function SubjectCard({ subject, progress }: SubjectCardProps) {
  const pct =
    progress && progress.total > 0
      ? Math.round(
          ((progress.read + progress.studied + progress.reviewed) /
            (progress.total * 3)) *
            100,
        )
      : 0;

  return (
    <Link href={`/materias/${subject.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 shrink-0 rounded-xl"
            style={{ backgroundColor: subject.color }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{subject.name}</p>
            {progress && progress.total > 0 ? (
              <div className="mt-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{pct}% progreso</p>
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)]">Sin temas planificados</p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
        </div>
      </Card>
    </Link>
  );
}
