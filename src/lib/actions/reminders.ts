"use server";

import { revalidatePath } from "next/cache";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ReminderSettings } from "@/lib/supabase/types";

export async function getReminderSettings(): Promise<ReminderSettings | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServerClient();
  const { data } = await supabase
    .from("reminder_settings")
    .select("*")
    .eq("id", 1)
    .single();
  return data;
}

export async function updateReminderSettings(input: {
  days_before: number[];
  notifications_enabled: boolean;
}) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = createServerClient();
  const { error } = await supabase
    .from("reminder_settings")
    .update({
      days_before: input.days_before.sort((a, b) => b - a),
      notifications_enabled: input.notifications_enabled,
    })
    .eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/ajustes");
  return { success: true };
}

export async function getEventsNeedingReminder(): Promise<
  { id: string; title: string; event_date: string; event_type: string; daysUntil: number }[]
> {
  if (!isSupabaseConfigured()) return [];
  const settings = await getReminderSettings();
  if (!settings?.notifications_enabled) return [];

  const supabase = createServerClient();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 14);
  const horizonStr = horizon.toISOString().slice(0, 10);

  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, event_date, event_type")
    .gte("event_date", todayStr)
    .lte("event_date", horizonStr);

  if (!events) return [];

  return events
    .map((e) => {
      const eventDate = new Date(e.event_date + "T00:00:00");
      const daysUntil = Math.ceil(
        (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return { ...e, daysUntil };
    })
    .filter((e) => settings.days_before.includes(e.daysUntil));
}
