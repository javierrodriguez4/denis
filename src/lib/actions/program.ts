"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createServerClient } from "@/lib/supabase/server";
import { extractTextFromPdfBuffer } from "@/lib/pdf/extract-text";
import { extractProgram } from "@/lib/ai/extract-program";
import { generateSchedule } from "@/lib/ai/schedule-generator";
import type { ProgramData } from "@/lib/ai/program-schema";

interface ActionError {
  error: string;
}

interface ProcessProgramResult {
  program: ProgramData;
}

/**
 * Downloads a program PDF from storage, extracts its text, and parses it into
 * structured ProgramData via OpenAI. Returns an error envelope on any failure
 * (no key, non-PDF, download/parse failure).
 */
export async function processProgramFile(
  fileId: string,
): Promise<ProcessProgramResult | ActionError> {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };

  const supabase = await createServerClient();
  const { data: file, error: fileError } = await supabase
    .from("subject_files")
    .select("*")
    .eq("id", fileId)
    .single();

  if (fileError || !file) return { error: "Archivo no encontrado" };

  if (
    file.mime_type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return { error: "Solo se pueden procesar programas en PDF" };
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from("subject-files")
    .download(file.storage_path);

  if (downloadError || !blob) {
    return { error: "No se pudo descargar el archivo" };
  }

  try {
    const buffer = Buffer.from(await blob.arrayBuffer());
    const text = await extractTextFromPdfBuffer(buffer);
    const program = await extractProgram(text);
    if (!program) {
      return {
        error:
          "No se pudo procesar el programa con IA. Verificá que la clave de OpenAI esté configurada e intentá de nuevo.",
      };
    }
    return { program };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error al procesar el programa",
    };
  }
}

/**
 * Deterministically generates and persists the schedule for a subject from a
 * parsed program and the student's comisión: inserts topics, calendar events
 * (seminars + exams) and planner entries, and links the subject to its source
 * program file. Revalidates all affected views.
 */
export async function generateScheduleFromProgram(
  subjectId: string,
  fileId: string,
  program: ProgramData,
  comisionNumero: number,
): Promise<{ topics: number; events: number; plannerEntries: number } | ActionError> {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };

  const supabase = await createServerClient();
  const schedule = generateSchedule(program, comisionNumero);

  if (schedule.topics.length === 0) {
    return { error: "El programa no contiene seminarios para generar" };
  }

  // Insert topics and keep the returned rows in input order to resolve planner
  // entry topic indexes to topic ids.
  const topicRows = schedule.topics.map((t) => ({
    subject_id: subjectId,
    title: t.title,
    sort_order: t.sort_order,
    source_file_id: fileId,
  }));

  const { data: insertedTopics, error: topicsError } = await supabase
    .from("topics")
    .insert(topicRows)
    .select("id, sort_order");

  if (topicsError) return { error: topicsError.message };
  if (!insertedTopics) return { error: "No se pudieron crear los temas" };

  // Map topicIndex -> topic id. Topics were inserted in array order; align by
  // sort_order (each seminar's sort_order is unique = its numero).
  const sortOrderToId = new Map<number, string>();
  for (const row of insertedTopics) {
    sortOrderToId.set(row.sort_order as number, row.id as string);
  }
  const topicIndexToId = schedule.topics.map(
    (t) => sortOrderToId.get(t.sort_order) ?? null,
  );

  // Insert calendar events (seminars + exams).
  if (schedule.events.length > 0) {
    const eventRows = schedule.events.map((e) => ({
      subject_id: subjectId,
      title: e.title,
      event_type: e.event_type,
      event_date: e.event_date,
      event_time: e.event_time,
    }));
    const { error: eventsError } = await supabase
      .from("calendar_events")
      .insert(eventRows);
    if (eventsError) return { error: eventsError.message };
  }

  // Insert planner entries on each seminar's class date.
  const plannerRows = schedule.plannerEntries
    .map((p) => {
      const topicId = topicIndexToId[p.topicIndex];
      return topicId ? { topic_id: topicId, planned_date: p.planned_date } : null;
    })
    .filter((row): row is { topic_id: string; planned_date: string } => row !== null);

  if (plannerRows.length > 0) {
    const { error: plannerError } = await supabase
      .from("planner_entries")
      .upsert(plannerRows, { onConflict: "topic_id,planned_date" });
    if (plannerError) return { error: plannerError.message };
  }

  // Link the subject to the program file it was generated from.
  const { error: linkError } = await supabase
    .from("subjects")
    .update({ program_source_file_id: fileId })
    .eq("id", subjectId);
  if (linkError) return { error: linkError.message };

  revalidatePath("/");
  revalidatePath("/calendario");
  revalidatePath("/planner");
  revalidatePath("/checklist");
  revalidatePath(`/materias/${subjectId}`);

  return {
    topics: insertedTopics.length,
    events: schedule.events.length,
    plannerEntries: plannerRows.length,
  };
}
