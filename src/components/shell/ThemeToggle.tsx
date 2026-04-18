"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

function readTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem("theme");
    if (v === "light" || v === "dark") return v;
  } catch {}
  return "system";
}

function applyTheme(t: Theme) {
  if (t === "system") {
    document.documentElement.removeAttribute("data-theme");
    try { localStorage.removeItem("theme"); } catch {}
    return;
  }
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem("theme", t); } catch {}
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(
    subscribe,
    () => readTheme(),
    () => "system",
  );

  const next = (): Theme =>
    theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const label = theme === "light" ? "☀︎ 昼" : theme === "dark" ? "☾ 夜" : "⟳ 自動";

  return (
    <button
      onClick={() => {
        applyTheme(next());
        // 同タブではstorageイベントが発火しないので手動で通知
        window.dispatchEvent(new StorageEvent("storage", { key: "theme" }));
      }}
      className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--surface)] px-2.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
      aria-label="テーマ切替"
    >
      {label}
    </button>
  );
}
