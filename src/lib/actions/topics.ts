"use server";

import { revalidatePath } from "next/cache";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Topic } from "@/lib/supabase/types";

export async function getTopicsBySubject(subjectId: string): Promise<Topic[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("subject_id", subjectId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTopic(
  subjectId: string,
  title: string,
  sortOrder?: number,
  sourceFileId?: string,
) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = createServerClient();

  let order = sortOrder;
  if (order === undefined) {
    const { data: maxRow } = await supabase
      .from("topics")
      .select("sort_order")
      .eq("subject_id", subjectId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    order = (maxRow?.sort_order ?? -1) + 1;
  }

  const { data, error } = await supabase
    .from("topics")
    .insert({
      subject_id: subjectId,
      title: title.trim(),
      sort_order: order,
      source_file_id: sourceFileId ?? null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/materias/${subjectId}`);
  revalidatePath("/planner");
  return { data };
}

export async function createTopicsBatch(
  subjectId: string,
  topics: { title: string; sort_order: number }[],
  sourceFileId?: string,
) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  if (!topics.length) return { error: "No hay temas para guardar" };

  const supabase = createServerClient();
  const rows = topics.map((t) => ({
    subject_id: subjectId,
    title: t.title.trim(),
    sort_order: t.sort_order,
    source_file_id: sourceFileId ?? null,
  }));

  const { data, error } = await supabase.from("topics").insert(rows).select();
  if (error) return { error: error.message };
  revalidatePath(`/materias/${subjectId}`);
  revalidatePath("/planner");
  return { data };
}

export async function updateTopic(id: string, subjectId: string, title: string) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = createServerClient();
  const { error } = await supabase
    .from("topics")
    .update({ title: title.trim() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/materias/${subjectId}`);
  revalidatePath("/planner");
  return { success: true };
}

export async function deleteTopic(id: string, subjectId: string) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = createServerClient();
  const { error } = await supabase.from("topics").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/materias/${subjectId}`);
  revalidatePath("/planner");
  return { success: true };
}

export async function deleteTopicsBySubject(subjectId: string) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = createServerClient();
  const { error } = await supabase
    .from("topics")
    .delete()
    .eq("subject_id", subjectId);
  if (error) return { error: error.message };
  revalidatePath(`/materias/${subjectId}`);
  return { success: true };
}
