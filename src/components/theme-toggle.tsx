"use client";

import { useEffect, useState } from "react";

/**
 * Light/dark toggle. Theme is persisted in localStorage and applied by an
 * inline script in the root layout before paint (no flash), defaulting to the
 * OS preference.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const current = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    setTheme(current);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem("ipdf-site-theme", next);
    } catch {
      /* storage may be unavailable (private mode) - the class still applies */
    }
    setTheme(next);
  };

  const label =
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-lg transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-[#141722] dark:hover:bg-[#1c1f2b]"
    >
      <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
