"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Home,
  BookOpen,
  LayoutGrid,
  Settings,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserChip } from "@/components/ui/user-chip";

const links = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/materias", label: "Materias", icon: BookOpen },
  { href: "/calendario", label: "Calendario", icon: Calendar },
  { href: "/planner", label: "Planner", icon: LayoutGrid },
  { href: "/checklist", label: "Checklist", icon: CheckSquare },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

interface NavProps {
  /** Optional theme toggle (or any control) rendered inside the nav. */
  renderToggle?: () => React.ReactNode;
}

export function SideNav({ renderToggle }: NavProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-[var(--soft)] bg-[var(--surface)] px-[18px] py-6 md:flex">
      <Link
        href="/"
        className="mb-5 flex items-center gap-2.5 px-2.5 font-[family-name:var(--font-display)] text-[23px] font-bold tracking-tight text-[var(--ink)]"
      >
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_4px_var(--accent-soft)]"
        />
        Denis
      </Link>

      <nav aria-label="Navegación principal" className="flex flex-col gap-0.5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-[14.5px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                active
                  ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                  : "font-medium text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]",
              )}
            >
              <Icon className="h-5 w-5 flex-none" strokeWidth={1.7} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        {renderToggle?.()}
        <div className="border-t border-[var(--soft)] pt-3">
          <UserChip name="Javi" subtitle="Medicina · 3.º año" />
        </div>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--soft)] bg-[var(--surface)]/90 backdrop-blur-md backdrop-saturate-150 md:hidden"
    >
      <div className="flex items-stretch justify-around px-1.5 pb-[env(safe-area-inset-bottom)]">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
                active ? "text-[var(--accent)]" : "text-[var(--muted)]",
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={1.7} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * MobileHeader — per-page mobile heading. Retained for backward compatibility
 * with pages that still render their own title bar above the content.
 */
export function MobileHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-40 mb-4 border-b border-[var(--soft)] bg-[var(--bg)]/95 px-1 py-3 backdrop-blur md:hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--muted)]">Denis</p>
          <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
            {title}
          </h1>
        </div>
        <Link
          href="/ajustes"
          className="rounded-lg p-2 text-[var(--muted)] outline-none transition-colors hover:bg-[var(--soft)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label="Ajustes"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
