"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createServerClient } from "@/lib/supabase/server";
import type { Topic } from "@/lib/supabase/types";

export type TopicWithSubject = Topic & {
  subjects: { name: string; color: string };
};

export async function getAllTopicsWithProgress(): Promise<TopicWithSubject[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*, subjects(name, color)")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as TopicWithSubject[];
}

export async function getTopicsBySubjectWithProgress(
  subjectId: string,
): Promise<Topic[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("subject_id", subjectId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateTopicProgress(
  topicId: string,
  field: "read_done" | "studied_done" | "reviewed_done" | "choice_done",
  value: boolean,
) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = await createServerClient();
  const { data: topic } = await supabase
    .from("topics")
    .select("subject_id")
    .eq("id", topicId)
    .single();

  const { error } = await supabase
    .from("topics")
    .update({ [field]: value })
    .eq("id", topicId);
  if (error) return { error: error.message };

  revalidatePath("/checklist");
  revalidatePath("/");
  revalidatePath("/materias");
  if (topic?.subject_id) revalidatePath(`/materias/${topic.subject_id}`);
  return { success: true };
}
