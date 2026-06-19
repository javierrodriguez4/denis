"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createServerClient } from "@/lib/supabase/server";
import type { CalendarEvent, EventType } from "@/lib/supabase/types";
import { toISODate, todayISO } from "@/lib/dates";

export async function getCalendarEvents(
  from?: string,
  to?: string,
): Promise<CalendarEvent[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerClient();
  let query = supabase
    .from("calendar_events")
    .select("*, subjects(name, color)")
    .order("event_date");

  if (from) query = query.gte("event_date", from);
  if (to) query = query.lte("event_date", to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getUpcomingEvents(limit = 5): Promise<CalendarEvent[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerClient();
  const today = todayISO();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*, subjects(name, color)")
    .gte("event_date", today)
    .order("event_date")
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getNextExamForSubject(
  subjectId: string,
): Promise<CalendarEvent | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerClient();
  const today = todayISO();
  const { data } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("subject_id", subjectId)
    .in("event_type", ["parcial", "final"])
    .gte("event_date", today)
    .order("event_date")
    .limit(1)
    .maybeSingle();
  return data;
}

export async function createCalendarEvent(input: {
  title: string;
  event_type: EventType;
  event_date: string;
  event_time?: string;
  subject_id?: string;
  notes?: string;
}) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      title: input.title.trim(),
      event_type: input.event_type,
      event_date: input.event_date,
      event_time: input.event_time || null,
      subject_id: input.subject_id || null,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/calendario");
  revalidatePath("/");
  return { data };
}

export async function updateCalendarEvent(
  id: string,
  input: {
    title: string;
    event_type: EventType;
    event_date: string;
    event_time?: string;
    subject_id?: string;
    notes?: string;
  },
) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("calendar_events")
    .update({
      title: input.title.trim(),
      event_type: input.event_type,
      event_date: input.event_date,
      event_time: input.event_time || null,
      subject_id: input.subject_id || null,
      notes: input.notes?.trim() || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/calendario");
  revalidatePath("/");
  return { success: true };
}

export async function deleteCalendarEvent(id: string) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = await createServerClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/calendario");
  revalidatePath("/");
  return { success: true };
}
