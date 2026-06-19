"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createServerClient } from "@/lib/supabase/server";
import type { StudyLog } from "@/lib/supabase/types";

export async function getStudyLogs(from: string, to: string): Promise<StudyLog[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("study_logs")
    .select("*")
    .gte("log_date", from)
    .lte("log_date", to)
    .order("log_date");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertStudyLog(logDate: string, hours: number, notes?: string) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  if (hours < 0 || hours > 24) return { error: "Las horas deben estar entre 0 y 24" };

  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida" };

  // Unique key is now (user_id, log_date) so each user has their own log per
  // day. user_id is set explicitly to satisfy the onConflict target.
  const { data, error } = await supabase
    .from("study_logs")
    .upsert(
      {
        user_id: user.id,
        log_date: logDate,
        hours,
        notes: notes?.trim() || null,
      },
      { onConflict: "user_id,log_date" },
    )
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/calendario");
  revalidatePath("/");
  return { data };
}

export async function deleteStudyLog(logDate: string) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = await createServerClient();
  const { error } = await supabase.from("study_logs").delete().eq("log_date", logDate);
  if (error) return { error: error.message };
  revalidatePath("/calendario");
  return { success: true };
}

export async function getMonthStudyTotal(from: string, to: string): Promise<number> {
  const logs = await getStudyLogs(from, to);
  return logs.reduce((sum, l) => sum + Number(l.hours), 0);
}
