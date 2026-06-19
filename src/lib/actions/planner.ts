"use server";

import { revalidatePath } from "next/cache";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { distributeDates, toISODate, nowBA, todayISO } from "@/lib/dates";
import type { PlannerEntry } from "@/lib/supabase/types";
import { parseISO } from "date-fns";

export async function getPlannerEntries(
  from: string,
  to: string,
): Promise<PlannerEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("planner_entries")
    .select("*, topics(*, subjects(name, color))")
    .gte("planned_date", from)
    .lte("planned_date", to)
    .order("planned_date");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTodayEntries(): Promise<PlannerEntry[]> {
  const today = todayISO();
  return getPlannerEntries(today, today);
}

export async function addPlannerEntry(topicId: string, plannedDate: string) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("planner_entries")
    .upsert(
      { topic_id: topicId, planned_date: plannedDate },
      { onConflict: "topic_id,planned_date" },
    )
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/planner");
  revalidatePath("/");
  return { data };
}

export async function removePlannerEntry(id: string) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = createServerClient();
  const { error } = await supabase.from("planner_entries").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/planner");
  revalidatePath("/");
  return { success: true };
}

export async function distributeTopicsToPlanner(
  subjectId: string,
  endDate: string,
  startDate?: string,
) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = createServerClient();

  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("id, sort_order")
    .eq("subject_id", subjectId)
    .order("sort_order");

  if (topicsError) return { error: topicsError.message };
  if (!topics?.length) return { error: "No hay temas en esta materia" };

  const start = startDate ? parseISO(startDate) : nowBA();
  const end = parseISO(endDate);
  if (end < start) return { error: "La fecha del examen debe ser futura" };

  const dates = distributeDates(topics.length, start, end);
  const rows = topics.map((topic, i) => ({
    topic_id: topic.id,
    planned_date: dates[i],
  }));

  const { error } = await supabase
    .from("planner_entries")
    .upsert(rows, { onConflict: "topic_id,planned_date" });

  if (error) return { error: error.message };
  revalidatePath("/planner");
  revalidatePath(`/materias/${subjectId}`);
  return { success: true, count: topics.length };
}

export async function getSubjectProgress(subjectId: string) {
  if (!isSupabaseConfigured()) return { total: 0, read: 0, studied: 0, reviewed: 0 };
  const supabase = createServerClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("read_done, studied_done, reviewed_done")
    .eq("subject_id", subjectId);

  if (!topics?.length) return { total: 0, read: 0, studied: 0, reviewed: 0 };

  const total = topics.length;
  const read = topics.filter((t) => t.read_done).length;
  const studied = topics.filter((t) => t.studied_done).length;
  const reviewed = topics.filter((t) => t.reviewed_done).length;

  return { total, read, studied, reviewed };
}
