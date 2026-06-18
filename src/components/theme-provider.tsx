"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

interface ThemeContextValue {
  dark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("denis-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("denis-theme", next ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>
  );
}

/**
 * ThemeToggle — a self-contained light/dark switch. Render it anywhere inside
 * the ThemeProvider (e.g. via the SideNav `renderToggle` slot).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { dark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar tema"
      aria-pressed={dark}
      className={
        className ??
        "flex w-full items-center gap-3 rounded-xl border border-[var(--soft)] bg-[var(--surface)] px-3 py-2.5 text-[14.5px] font-medium text-[var(--muted)] outline-none transition-colors hover:bg-[var(--bg)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      }
    >
      {dark ? (
        <Sun className="h-5 w-5 flex-none" strokeWidth={1.7} />
      ) : (
        <Moon className="h-5 w-5 flex-none" strokeWidth={1.7} />
      )}
      {dark ? "Modo claro" : "Modo oscuro"}
    </button>
  );
}
