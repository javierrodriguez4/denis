import { NextResponse } from "next/server";
import { getReminderSettings } from "@/lib/actions/reminders";

export async function GET() {
  const settings = await getReminderSettings();
  return NextResponse.json({ settings });
}
