"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminUser {
  id: string;
  email: string | undefined;
  name: string;
  role: string;
  must_change_password: boolean;
  banned: boolean;
  created_at: string;
}

/**
 * Verifies the caller has a valid session with role 'admin'.
 * Returns the admin user on success, or null when the caller is not an admin.
 * Every admin action MUST call this before touching the service_role client.
 */
async function requireAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    return null;
  }
  return user;
}

function isBanned(bannedUntil: string | null | undefined): boolean {
  if (!bannedUntil) return false;
  // Supabase encodes a permanent ban as a far-future date; "none" means active.
  if (bannedUntil === "none") return false;
  return new Date(bannedUntil).getTime() > Date.now();
}

export async function listUsers(): Promise<{
  data?: AdminUser[];
  error?: string;
}> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) return { error: error.message };

  const users: AdminUser[] = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    name: (u.user_metadata?.name as string | undefined) ?? "",
    role: (u.app_metadata?.role as string | undefined) ?? "user",
    must_change_password: u.user_metadata?.must_change_password === true,
    banned: isBanned(
      (u as { banned_until?: string | null }).banned_until ?? null,
    ),
    created_at: u.created_at,
  }));

  return { data: users };
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<{ success?: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!email || !name || !input.password) {
    return { error: "Completa email, nombre y contraseña inicial" };
  }
  if (input.password.length < 4) {
    return { error: "La contraseña inicial debe tener al menos 4 caracteres" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    app_metadata: { role: "user" },
    user_metadata: { name, must_change_password: true },
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function resetUserPassword(input: {
  userId: string;
  password: string;
}): Promise<{ success?: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  if (!input.password || input.password.length < 4) {
    return { error: "La nueva contraseña debe tener al menos 4 caracteres" };
  }

  const supabase = createAdminClient();
  // Preserve existing user_metadata (e.g. name) and re-arm the forced change.
  const { data: target } = await supabase.auth.admin.getUserById(input.userId);
  const existingMeta = target?.user?.user_metadata ?? {};

  const { error } = await supabase.auth.admin.updateUserById(input.userId, {
    password: input.password,
    user_metadata: { ...existingMeta, must_change_password: true },
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function deactivateUser(input: {
  userId: string;
  active: boolean;
}): Promise<{ success?: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  if (input.userId === admin.id) {
    return { error: "No puedes desactivar tu propia cuenta" };
  }

  const supabase = createAdminClient();
  // ban_duration "none" reactivates; a long duration deactivates (ban).
  const { error } = await supabase.auth.admin.updateUserById(input.userId, {
    ban_duration: input.active ? "none" : "876000h",
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/usuarios");
  return { success: true };
}
