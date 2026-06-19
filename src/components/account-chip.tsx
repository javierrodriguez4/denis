import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { UserChip } from "@/components/ui/user-chip";
import { LogoutButton } from "@/components/logout-button";

/**
 * Server component: reads the logged-in user and renders the UserChip with the
 * real name/email + role, plus a logout control. Rendered inside the SideNav.
 */
export async function AccountChip() {
  if (!isSupabaseConfigured()) {
    return <UserChip name="Invitado" subtitle="Sin sesión" />;
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <UserChip name="Invitado" subtitle="Sin sesión" />;
  }

  const name =
    (user.user_metadata?.name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Usuario";
  const role = user.app_metadata?.role === "admin" ? "Admin" : "Estudiante";
  const subtitle = user.email ? `${user.email} · ${role}` : role;

  return (
    <UserChip name={name} subtitle={subtitle} trailing={<LogoutButton />} />
  );
}
