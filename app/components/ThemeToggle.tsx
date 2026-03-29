"use client";

const THEME_STORAGE_KEY = "aether-theme";
type ThemeMode = "light" | "dark";

function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
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
