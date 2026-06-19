"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, KeyRound, Ban, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardTitle, CardSection } from "@/components/ui/card";
import {
  createUser,
  resetUserPassword,
  deactivateUser,
  type AdminUser,
} from "@/lib/actions/admin-users";

export function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Create form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  function run(action: () => Promise<{ success?: boolean; error?: string }>) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      const result = await createUser({ email, name, password });
      if (!result.error) {
        setEmail("");
        setName("");
        setPassword("");
        setNotice("Usuario creado.");
      }
      return result;
    });
  }

  function handleReset(userId: string) {
    const newPassword = window.prompt("Nueva contraseña inicial para este usuario:");
    if (!newPassword) return;
    run(async () => {
      const result = await resetUserPassword({ userId, password: newPassword });
      if (!result.error) setNotice("Contraseña reseteada.");
      return result;
    });
  }

  function handleToggleActive(user: AdminUser) {
    const activate = user.banned;
    const verb = activate ? "reactivar" : "desactivar";
    if (!window.confirm(`¿Seguro que quieres ${verb} esta cuenta?`)) return;
    run(async () => {
      const result = await deactivateUser({ userId: user.id, active: activate });
      if (!result.error) setNotice(activate ? "Cuenta reactivada." : "Cuenta desactivada.");
      return result;
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Crear usuario</CardTitle>
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="new-name">Nombre</Label>
              <Input
                id="new-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre y apellido"
              />
            </div>
            <div>
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="new-password">Contraseña inicial</Label>
            <Input
              id="new-password"
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="El usuario deberá cambiarla al ingresar"
            />
          </div>

          <Button type="submit" disabled={isPending} aria-busy={isPending}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Crear usuario
          </Button>
        </form>
      </Card>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-[var(--accent)]">{notice}</p>}

      <Card>
        <CardTitle>Usuarios ({initialUsers.length})</CardTitle>
        <CardSection className="mt-4">
          <ul role="list" className="divide-y divide-[var(--soft)]">
            {initialUsers.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--ink)]">
                    {user.name || "(sin nombre)"}
                    {user.role === "admin" && (
                      <span className="ml-2 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                        admin
                      </span>
                    )}
                    {user.banned && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                        desactivada
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {user.email}
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleReset(user.id)}
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  Resetear clave
                </Button>

                {user.id !== currentUserId && (
                  <Button
                    variant={user.banned ? "secondary" : "danger"}
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleToggleActive(user)}
                  >
                    {user.banned ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Reactivar
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4" aria-hidden="true" />
                        Desactivar
                      </>
                    )}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardSection>
      </Card>
    </div>
  );
}
