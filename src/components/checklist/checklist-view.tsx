"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { updateTopicProgress } from "@/lib/actions/checklist";
import type { TopicWithSubject } from "@/lib/actions/checklist";
import { cn } from "@/lib/utils";

export function ChecklistView({ topics }: { topics: TopicWithSubject[] }) {
  const router = useRouter();
  const grouped = topics.reduce<Record<string, TopicWithSubject[]>>((acc, t) => {
    const key = t.subject_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  async function toggle(
    topicId: string,
    field: "read_done" | "studied_done" | "reviewed_done",
    value: boolean,
  ) {
    await updateTopicProgress(topicId, field, value);
    router.refresh();
  }

  if (topics.length === 0) {
    return (
      <Card>
        <p className="text-sm text-[var(--muted)]">
          No hay temas todavía. Crea materias y agrega temas desde el programa curricular.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([subjectId, subjectTopics]) => {
        const subject = subjectTopics[0].subjects;
        const done = subjectTopics.filter(
          (t) => t.read_done && t.studied_done && t.reviewed_done,
        ).length;
        const pct = Math.round((done / subjectTopics.length) * 100);

        return (
          <Card key={subjectId}>
            <div className="mb-4 flex items-center gap-3">
              <div
                className="h-10 w-10 shrink-0 rounded-xl"
                style={{ backgroundColor: subject.color }}
              />
              <div className="flex-1">
                <CardTitle>{subject.name}</CardTitle>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--muted)]">{pct}%</span>
                </div>
              </div>
            </div>

            <ul className="space-y-2">
              {subjectTopics.map((topic) => (
                <li
                  key={topic.id}
                  className="rounded-xl border border-[var(--border)] p-3"
                >
                  <p className="mb-2 text-sm font-medium">{topic.title}</p>
                  <div className="flex flex-wrap gap-2">
                    <CheckButton
                      label="Leído"
                      checked={topic.read_done}
                      onChange={(v) => toggle(topic.id, "read_done", v)}
                    />
                    <CheckButton
                      label="Estudiado"
                      checked={topic.studied_done}
                      onChange={(v) => toggle(topic.id, "studied_done", v)}
                    />
                    <CheckButton
                      label="Resumido"
                      checked={topic.reviewed_done}
                      onChange={(v) => toggle(topic.id, "reviewed_done", v)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

function CheckButton({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
        checked
          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
          : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-hover)]",
      )}
    >
      <span
        className={cn(
          "flex h-3.5 w-3.5 items-center justify-center rounded border",
          checked
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[var(--border)]",
        )}
      >
        {checked && <Check className="h-2.5 w-2.5" />}
      </span>
      {label}
    </button>
  );
}
