"use client";

import { BottomNav, SideNav } from "@/components/navigation";
import { ThemeToggle, useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";

/**
 * AppShell — the application chrome: a sticky ~248px SideNav on md+, a
 * BottomNav on mobile, and a content slot. Pages own their own max-width and
 * horizontal padding; the shell only provides vertical room for the nav bars.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <SideNav renderToggle={() => <ThemeToggle />} />
      {/*
        Pages own their own max-width. The shell only provides outer gutters and
        vertical room for the nav bars so existing pages stay readable until they
        are reworked to manage their own padding.
      */}
      <main className="min-w-0 flex-1 px-4 pb-28 pt-5 md:px-10 md:pb-10 md:pt-8">
        {children}
      </main>
      <BottomNav />
      <FloatingThemeToggle />
    </div>
  );
}

/**
 * Mobile-only floating theme toggle. On md+ the toggle lives inside the
 * SideNav, so this is hidden there.
 */
function FloatingThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar tema"
      aria-pressed={dark}
      className="fixed bottom-24 right-4 z-50 flex rounded-full border border-[var(--soft)] bg-[var(--surface)] p-3 shadow-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)] md:hidden"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
