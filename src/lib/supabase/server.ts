import { cookies } from "next/headers";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Cookie-aware server client for Server Components and Server Actions.
 *
 * It reads the session from the request cookies (via `cookies()` from
 * next/headers) so every query runs as the logged-in user. RLS policies
 * (auth.uid() = user_id) then scope the data automatically.
 *
 * Must be awaited because `cookies()` is async in Next.js 16.
 */
export async function createServerClient(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no está configurado. Revisa .env.local");
  }

  const cookieStore = await cookies();

  return createSsrServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` was called from a Server Component. This can be ignored
            // when there is middleware/proxy refreshing the session.
          }
        },
      },
    },
  );
}
