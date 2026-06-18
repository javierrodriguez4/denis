import { NextResponse } from "next/server";
import { getEventsNeedingReminder } from "@/lib/actions/reminders";

export async function GET() {
  const events = await getEventsNeedingReminder();
  return NextResponse.json({ events });
}
