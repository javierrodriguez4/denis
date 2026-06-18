"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Trash2, CalendarRange, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardTitle, CardSection } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import {
  createTopic,
  createTopicsBatch,
  deleteTopic,
  updateTopic,
} from "@/lib/actions/topics";
import { distributeTopicsToPlanner } from "@/lib/actions/planner";
import {
  processProgramFile,
  generateScheduleFromProgram,
} from "@/lib/actions/program";
import type { ProgramData } from "@/lib/ai/program-schema";
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

  // Program wizard state.
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [programFileId, setProgramFileId] = useState<string | null>(null);
  const [comisionNumero, setComisionNumero] = useState<number | null>(null);
  const [programSuccess, setProgramSuccess] = useState("");

  const router = useRouter();

  // Only true program files drive the wizard; the flat extractor handles any PDF.
  const wizardFiles = programFiles.filter((f) => f.file_type === "program");

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

  async function handleProcessProgram(fileId: string) {
    setLoading(true);
    setError("");
    setProgramSuccess("");
    setProgram(null);
    setComisionNumero(null);
    const result = await processProgramFile(fileId);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setProgram(result.program);
    setProgramFileId(fileId);
    setComisionNumero(result.program.comisiones[0]?.numero ?? null);
  }

  async function handleGenerateSchedule() {
    if (!program || !programFileId || comisionNumero == null) return;
    setLoading(true);
    setError("");
    const result = await generateScheduleFromProgram(
      subjectId,
      programFileId,
      program,
      comisionNumero,
    );
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setProgramSuccess(
      `Listo: ${result.topics} temas, ${result.events} eventos y ${result.plannerEntries} clases en tu planner.`,
    );
    setProgram(null);
    setProgramFileId(null);
    setComisionNumero(null);
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

        {/* Program wizard: parse a PROGRAM PDF and generate the full schedule */}
        {wizardFiles.length > 0 && (
          <CardSection className="mt-4">
            <SectionLabel>Generar planner desde el programa</SectionLabel>
            <p className="mb-3 text-xs text-[var(--muted)]">
              Procesá el programa de la materia para generar automáticamente tus
              seminarios, parciales y planner del cuatrimestre.
            </p>
            <div className="flex flex-wrap gap-2">
              {wizardFiles.map((f) => (
                <Button
                  key={f.id}
                  variant="secondary"
                  size="sm"
                  disabled={loading}
                  onClick={() => handleProcessProgram(f.id)}
                  aria-busy={loading}
                >
                  <Wand2 className="h-4 w-4" aria-hidden="true" />
                  Procesar programa con IA
                </Button>
              ))}
            </div>

            {program && (
              <div className="mt-4 space-y-3 rounded-xl border border-[var(--soft)] bg-[var(--surface)] p-4">
                <p className="text-sm text-[var(--ink)]">
                  Materia detectada:{" "}
                  <span className="font-semibold">{program.materia}</span>
                  {program.cuatrimestre ? ` — ${program.cuatrimestre}` : ""}
                </p>

                {program.comisiones.length > 0 ? (
                  <div>
                    <Label htmlFor="comision-select">¿Qué comisión sos?</Label>
                    <Select
                      id="comision-select"
                      value={comisionNumero ?? ""}
                      onChange={(e) => setComisionNumero(Number(e.target.value))}
                    >
                      {program.comisiones.map((c) => (
                        <option key={c.numero} value={c.numero}>
                          {`Comisión ${c.numero} — ${c.dia_semana} ${c.hora_inicio} a ${c.hora_fin} h`}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted)]">
                    No se detectaron comisiones en el programa.
                  </p>
                )}

                <Button
                  className="w-full"
                  onClick={handleGenerateSchedule}
                  disabled={loading || comisionNumero == null}
                  aria-busy={loading}
                >
                  <CalendarRange className="h-4 w-4" aria-hidden="true" />
                  Generar planner y calendario
                </Button>
              </div>
            )}

            {programSuccess && (
              <p
                role="status"
                className="mt-3 text-sm font-medium text-[var(--accent)]"
              >
                {programSuccess}
              </p>
            )}
          </CardSection>
        )}

        {/* AI extraction from PDF */}
        {programFiles.length > 0 && (
          <CardSection className="mt-4">
            <SectionLabel>Extraer temas con IA</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {programFiles.map((f) => (
                <Button
                  key={f.id}
                  variant="secondary"
                  size="sm"
                  disabled={loading}
                  onClick={() => handleExtract(f.id)}
                  aria-busy={loading}
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {f.name}
                </Button>
              ))}
            </div>
          </CardSection>
        )}

        {/* Suggested topics review panel */}
        {suggested && (
          <CardSection className="mt-4">
            <p className="mb-3 text-sm font-semibold text-[var(--ink)]">
              Revisa los temas sugeridos
            </p>
            <ul
              role="list"
              className="mb-4 max-h-64 space-y-2 overflow-y-auto pr-1"
              aria-label="Lista de temas sugeridos por IA"
            >
              {suggested.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <Input
                    aria-label={`Tema ${i + 1}`}
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
                    onClick={() => setSuggested(suggested.filter((_, j) => j !== i))}
                    aria-label={`Eliminar tema sugerido ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Button onClick={confirmSuggested} disabled={loading} aria-busy={loading}>
                Confirmar temas
              </Button>
              <Button variant="ghost" onClick={() => setSuggested(null)}>
                Cancelar
              </Button>
            </div>
          </CardSection>
        )}

        {/* Add topic manually */}
        <CardSection className="mt-4">
          <form
            onSubmit={handleAddTopic}
            className="flex gap-2"
            aria-label="Agregar tema manualmente"
          >
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Agregar tema manualmente"
              aria-label="Nombre del nuevo tema"
            />
            <Button
              type="submit"
              disabled={loading || !newTitle.trim()}
              aria-label="Agregar tema"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </CardSection>

        {/* Topic list */}
        {topics.length > 0 && (
          <CardSection className="mt-4">
            <SectionLabel>{topics.length} {topics.length === 1 ? "tema" : "temas"}</SectionLabel>
            <ul role="list" className="space-y-1.5">
              {topics.map((t) => (
                <TopicRow key={t.id} topic={t} subjectId={subjectId} />
              ))}
            </ul>
          </CardSection>
        )}

        {/* Distribute to planner — only when there are topics */}
        {topics.length > 0 && (
          <CardSection className="mt-4">
            <p className="mb-0.5 text-sm font-semibold text-[var(--ink)]">
              Distribuir en el planner
            </p>
            <p className="mb-3 text-xs text-[var(--muted)]">
              Reparte los temas equitativamente hasta la fecha del examen.
            </p>
            <div className="space-y-2">
              <div>
                <Label htmlFor="exam-date">Fecha del examen</Label>
                <Input
                  id="exam-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  aria-required="true"
                />
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleDistribute}
                disabled={loading}
                aria-busy={loading}
              >
                <CalendarRange className="h-4 w-4" aria-hidden="true" />
                Distribuir automáticamente
              </Button>
            </div>
          </CardSection>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </Card>
    </div>
  );
}

function TopicRow({ topic, subjectId }: { topic: Topic; subjectId: string }) {
  const [title, setTitle] = useState(topic.title);
  const router = useRouter();

  return (
    <li className="flex items-center gap-2 rounded-xl border border-[var(--soft)] bg-[var(--surface)] px-3 py-2 transition-colors hover:border-[#d3e0dc]">
      {/* Sort order badge */}
      <span
        aria-hidden="true"
        className="flex h-5 w-5 flex-none items-center justify-center rounded-md bg-[var(--accent-soft)] text-[10px] font-semibold text-[var(--accent)]"
      >
        {topic.sort_order + 1}
      </span>
      <Input
        className="border-transparent bg-transparent px-1 focus-visible:border-[var(--accent)] focus-visible:bg-[var(--surface)]"
        value={title}
        aria-label={`Nombre del tema ${topic.sort_order + 1}`}
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
        aria-label={`Eliminar tema "${title}"`}
      >
        <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
      </Button>
    </li>
  );
}
