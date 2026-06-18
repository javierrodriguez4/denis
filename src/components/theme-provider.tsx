"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

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
    <>
      {children}
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-20 right-4 z-50 hidden rounded-full border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg md:bottom-6 md:flex"
        aria-label="Cambiar tema"
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </>
  );
}
