"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Trash2, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import {
  createTopic,
  createTopicsBatch,
  deleteTopic,
  updateTopic,
} from "@/lib/actions/topics";
import { distributeTopicsToPlanner } from "@/lib/actions/planner";
import type { SubjectFile, Topic } from "@/lib/supabase/types";
import type { SuggestedTopic } from "@/lib/supabase/types";

export function TopicManager({
  subjectId,
  topics,
  programFiles,
  nextExamDate,
}: {
  subjectId: string;
  topics: Topic[];
  programFiles: SubjectFile[];
  nextExamDate?: string | null;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggested, setSuggested] = useState<SuggestedTopic[] | null>(null);
  const [sourceFileId, setSourceFileId] = useState<string | null>(null);
  const [endDate, setEndDate] = useState(nextExamDate ?? "");
  const router = useRouter();

  async function handleAddTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading(true);
    await createTopic(subjectId, newTitle);
    setNewTitle("");
    setLoading(false);
    router.refresh();
  }

  async function handleExtract(fileId: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/extract-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuggested(data.topics);
      setSourceFileId(data.sourceFileId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al extraer temas");
    }
    setLoading(false);
  }

  async function confirmSuggested() {
    if (!suggested?.length) return;
    setLoading(true);
    await createTopicsBatch(subjectId, suggested, sourceFileId ?? undefined);
    setSuggested(null);
    setLoading(false);
    router.refresh();
  }

  async function handleDistribute() {
    if (!endDate) {
      setError("Indica la fecha del examen");
      return;
    }
    setLoading(true);
    const result = await distributeTopicsToPlanner(subjectId, endDate);
    setLoading(false);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Temas de estudio</CardTitle>
        <div className="mt-4 space-y-4">
          {programFiles.length > 0 && (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-3">
              <p className="mb-2 text-sm text-[var(--muted)]">
                Extraer temas desde el programa (PDF):
              </p>
              <div className="flex flex-wrap gap-2">
                {programFiles.map((f) => (
                  <Button
                    key={f.id}
                    variant="secondary"
                    size="sm"
                    disabled={loading}
                    onClick={() => handleExtract(f.id)}
                  >
                    <Sparkles className="h-4 w-4" />
                    {f.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {suggested && (
            <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-4">
              <p className="mb-3 font-medium">Revisa los temas sugeridos</p>
              <ul className="mb-4 max-h-60 space-y-2 overflow-y-auto">
                {suggested.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <Input
                      value={t.title}
                      onChange={(e) => {
                        const next = [...suggested];
                        next[i] = { ...t, title: e.target.value };
                        setSuggested(next);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSuggested(suggested.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button onClick={confirmSuggested} disabled={loading}>
                  Confirmar temas
                </Button>
                <Button variant="ghost" onClick={() => setSuggested(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleAddTopic} className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Agregar tema manualmente"
            />
            <Button type="submit" disabled={loading}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          {topics.length > 0 && (
            <>
              <ul className="divide-y divide-[var(--border)]">
                {topics.map((t) => (
                  <TopicRow key={t.id} topic={t} subjectId={subjectId} />
                ))}
              </ul>

              <div className="rounded-xl border border-[var(--border)] p-3">
                <p className="mb-2 text-sm font-medium">Distribuir en el planner</p>
                <p className="mb-3 text-xs text-[var(--muted)]">
                  Reparte los temas equitativamente hasta la fecha del examen.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <Button
                    variant="secondary"
                    onClick={handleDistribute}
                    disabled={loading}
                  >
                    <CalendarRange className="h-4 w-4" />
                    Distribuir automáticamente
                  </Button>
                </div>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Card>
    </div>
  );
}

function TopicRow({ topic, subjectId }: { topic: Topic; subjectId: string }) {
  const [title, setTitle] = useState(topic.title);
  const router = useRouter();

  return (
    <li className="flex items-center gap-2 py-2">
      <span className="w-6 text-xs text-[var(--muted)]">{topic.sort_order + 1}</span>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          if (title !== topic.title) updateTopic(topic.id, subjectId, title);
        }}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          await deleteTopic(topic.id, subjectId);
          router.refresh();
        }}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </li>
  );
}
