"use server";

import { revalidatePath } from "next/cache";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { FileType, SubjectFile } from "@/lib/supabase/types";

export async function getSubjectFiles(subjectId: string): Promise<SubjectFile[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("subject_files")
    .select("*")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getFileById(id: string): Promise<SubjectFile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServerClient();
  const { data } = await supabase
    .from("subject_files")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function registerSubjectFile(input: {
  subjectId: string;
  name: string;
  fileType: FileType;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("subject_files")
    .insert({
      subject_id: input.subjectId,
      name: input.name,
      file_type: input.fileType,
      storage_path: input.storagePath,
      mime_type: input.mimeType || null,
      size_bytes: input.sizeBytes,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/materias/${input.subjectId}`);
  return { data };
}

export async function deleteSubjectFile(id: string, subjectId: string) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = createServerClient();
  const { data: file } = await supabase
    .from("subject_files")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (file) {
    await supabase.storage.from("subject-files").remove([file.storage_path]);
  }

  const { error } = await supabase.from("subject_files").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/materias/${subjectId}`);
  return { success: true };
}

export async function getFileSignedUrl(storagePath: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServerClient();
  const { data } = await supabase.storage
    .from("subject-files")
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? null;
}
