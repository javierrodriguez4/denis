import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * SERVER-ONLY admin client backed by the service_role key.
 *
 * This client BYPASSES Row Level Security. It must NEVER be imported into a
 * client component or shipped to the browser — the `server-only` import above
 * makes any such import a build error. Use it exclusively inside server actions
 * AFTER verifying the caller is an admin.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Falta configuración de admin. Revisa SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
