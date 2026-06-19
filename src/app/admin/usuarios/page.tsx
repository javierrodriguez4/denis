import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { listUsers } from "@/lib/actions/admin-users";
import { UsersManager } from "@/components/admin/users-manager";

// Server component: re-verifies admin role even though proxy already guards
// /admin/*. Defense in depth — never trust the proxy alone.
export default async function AdminUsersPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.app_metadata?.role !== "admin") redirect("/");

  const { data: users, error } = await listUsers();

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)]">
          Usuarios
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Crea cuentas, resetea contraseñas y activa o desactiva el acceso.
        </p>
      </header>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          No se pudieron cargar los usuarios: {error}
        </p>
      ) : (
        <UsersManager initialUsers={users ?? []} currentUserId={user.id} />
      )}
    </div>
  );
}
