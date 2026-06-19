"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createServerClient } from "@/lib/supabase/server";
import { SUBJECT_COLORS } from "@/lib/constants";
import type { Subject } from "@/lib/supabase/types";

export async function getSubjects(): Promise<Subject[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSubject(id: string): Promise<Subject | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function createSubject(name: string, color?: string) {
  if (!isSupabaseConfigured()) {
    return { error: "Configura Supabase en .env.local" };
  }
  const supabase = await createServerClient();
  const { data: existing } = await supabase.from("subjects").select("id");
  const pickColor =
    color ?? SUBJECT_COLORS[(existing?.length ?? 0) % SUBJECT_COLORS.length];

  const { data, error } = await supabase
    .from("subjects")
    .insert({ name: name.trim(), color: pickColor })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/materias");
  return { data };
}

export async function updateSubject(id: string, name: string, color: string) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("subjects")
    .update({ name: name.trim(), color })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/materias");
  revalidatePath(`/materias/${id}`);
  return { success: true };
}

export async function deleteSubject(id: string) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = await createServerClient();
  const { data: files, error: filesError } = await supabase
    .from("subject_files")
    .select("storage_path")
    .eq("subject_id", id);

  // Abort before the cascade delete if we cannot list the files, otherwise the
  // subject_files rows (and their storage references) would be lost on retry.
  if (filesError) return { error: filesError.message };

  if (files?.length) {
    const { error: removeError } = await supabase.storage
      .from("subject-files")
      .remove(files.map((f) => f.storage_path));
    // Storage removal failed; do not delete the subject or the cascade would
    // orphan these storage objects with no DB reference to locate them.
    if (removeError) return { error: removeError.message };
  }

  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/materias");
  return { success: true };
}
