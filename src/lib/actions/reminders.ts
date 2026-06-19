"use server";

import { revalidatePath } from "next/cache";
import { addDays, format } from "date-fns";
import { nowBA } from "@/lib/dates";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createServerClient } from "@/lib/supabase/server";
import type { ReminderSettings } from "@/lib/supabase/types";

export async function getReminderSettings(): Promise<ReminderSettings | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerClient();
  // RLS scopes the row to the current user; settings are now per-user (no more
  // global id = 1 singleton). maybeSingle() avoids throwing when the user has
  // no row yet.
  const { data } = await supabase
    .from("reminder_settings")
    .select("*")
    .maybeSingle();
  return data;
}

export async function updateReminderSettings(input: {
  days_before: number[];
  notifications_enabled: boolean;
}) {
  if (!isSupabaseConfigured()) return { error: "Configura Supabase" };
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida" };

  // Per-user upsert: conflict on user_id (the row's unique key), defaulting
  // user_id to the current user.
  const { error } = await supabase.from("reminder_settings").upsert(
    {
      user_id: user.id,
      days_before: input.days_before.sort((a, b) => b - a),
      notifications_enabled: input.notifications_enabled,
    },
    { onConflict: "user_id" },
  );
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

  const supabase = await createServerClient();
  const today = nowBA();
  const todayStr = format(today, "yyyy-MM-dd");
  const horizonStr = format(addDays(today, 14), "yyyy-MM-dd");

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
    .filter((e) => {
      // Inscripción events (e.g. registering for finals) are reminded ON the
      // day itself, never the day(s) before — regardless of the days_before
      // setting. Compare the date string directly to avoid timezone drift.
      if (e.event_type === "inscripcion") return e.event_date === todayStr;
      return settings.days_before.includes(e.daysUntil);
    });
}
