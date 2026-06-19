"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";

/** Logout control. Calls the server action, which clears the session cookie. */
export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      disabled={isPending}
      onClick={() => startTransition(() => void signOut())}
      className="flex flex-none rounded-lg p-2 text-[var(--muted)] outline-none transition-colors hover:bg-[var(--bg)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
