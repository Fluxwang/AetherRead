"use client";

import { useEffect } from "react";

const THEME_STORAGE_KEY = "aether-theme";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
type ThemeMode = "light" | "dark";

function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  useEffect(() => {
    const currentThemeAttr = document.documentElement.getAttribute("data-theme");
    if (currentThemeAttr === "light" || currentThemeAttr === "dark") return;

    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", storedTheme);
      document.cookie = `${THEME_STORAGE_KEY}=${storedTheme}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
    }
  }, []);

  const handleToggle = () => {
    const currentThemeAttr =
      document.documentElement.getAttribute("data-theme");
    const currentTheme: ThemeMode =
      currentThemeAttr === "dark" || currentThemeAttr === "light"
        ? currentThemeAttr
        : getSystemTheme();
    const nextTheme: ThemeMode = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    document.cookie = `${THEME_STORAGE_KEY}=${nextTheme}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="btn-secondary min-h-9 px-3 text-xs"
      aria-label="切换深浅色模式"
      title="切换深浅色模式"
    >
      切换主题
    </button>
  );
}
