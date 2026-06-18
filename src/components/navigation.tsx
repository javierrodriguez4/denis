"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, BookOpen, LayoutGrid, Settings, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/materias", label: "Materias", icon: BookOpen },
  { href: "/planner", label: "Planner", icon: LayoutGrid },
  { href: "/checklist", label: "Checklist", icon: CheckSquare },
  { href: "/calendario", label: "Calendario", icon: Calendar },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
                active ? "text-[var(--accent)]" : "text-[var(--muted)]",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] p-4 md:block">
      <div className="mb-8">
        <span className="text-xl font-semibold tracking-tight text-[var(--accent)]">
          Denis
        </span>
        <p className="text-xs text-[var(--muted)]">Tu organizador de estudio</p>
      </div>
      <div className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--accent)]/10 font-medium text-[var(--accent)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-hover)]",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
        <Link
          href="/ajustes"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
            pathname === "/ajustes"
              ? "bg-[var(--accent)]/10 font-medium text-[var(--accent)]"
              : "text-[var(--muted)] hover:bg-[var(--surface-hover)]",
          )}
        >
          <Settings className="h-4 w-4" />
          Ajustes
        </Link>
      </div>
    </aside>
  );
}

export function MobileHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--muted)]">Denis</p>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <Link href="/ajustes" className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-hover)]">
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
