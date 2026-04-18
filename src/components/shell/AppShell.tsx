"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { useSyncFromSupabase } from "@/store/useSyncFromSupabase";

type Tab = {
  href: string;
  label: string;    // フル表記（PC）
  short: string;    // 一字表記（モバイル下）
  icon: ReactNode;
};

const TABS: Tab[] = [
  {
    href: "/",
    label: "席",
    short: "席",
    icon: <IconSeat />,
  },
  {
    href: "/groups",
    label: "組",
    short: "組",
    icon: <IconGroup />,
  },
  {
    href: "/stats",
    label: "戦績",
    short: "戦績",
    icon: <IconChart />,
  },
  {
    href: "/settings",
    label: "床の間",
    short: "床",
    icon: <IconStamp />,
  },
];

/** シェル非表示にするパス（集中モード） */
function shouldHideChrome(path: string): boolean {
  if (path.startsWith("/session/")) return true;
  if (path.startsWith("/auth/")) return true;
  if (path.startsWith("/join/")) return true;
  return false;
}

function isActive(path: string, tab: Tab): boolean {
  if (tab.href === "/") return path === "/";
  return path === tab.href || path.startsWith(tab.href + "/");
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const hide = shouldHideChrome(pathname);

  // 全ページ共通で Supabase 同期を走らせる（どのページへ直接ランディングしても反映される）
  useSyncFromSupabase();

  if (hide) {
    return <div className="min-h-dvh">{children}</div>;
  }

  return (
    <div className="min-h-dvh lg:flex">
      {/* 左サイドバー（PC） */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-[var(--line)] lg:bg-[var(--bg-subtle)]">
        <div className="flex h-16 items-center gap-2 border-b border-[var(--line)] px-5">
          <Brand />
        </div>
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {TABS.map((t) => {
              const active = isActive(pathname, t);
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    className={`flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-[var(--surface)] font-bold text-[var(--ink)] shadow-[var(--shadow-sm)]"
                        : "text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <span className={active ? "text-[var(--accent)]" : ""}>{t.icon}</span>
                    <span className="font-serif-jp tracking-wider">{t.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-[var(--line)] p-3">
          <ThemeToggle />
        </div>
      </aside>

      {/* メイン */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* モバイル上部バー */}
        <header className="flex h-14 items-center justify-between border-b border-[var(--line)] bg-[var(--bg)] px-4 lg:hidden">
          <Brand />
          <ThemeToggle />
        </header>

        <main className="flex-1 pb-24 lg:pb-6">{children}</main>

        {/* モバイル底タブ */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] backdrop-blur pb-safe lg:hidden"
          aria-label="主要ナビゲーション"
        >
          <ul className="mx-auto flex max-w-xl items-stretch">
            {TABS.map((t) => {
              const active = isActive(pathname, t);
              return (
                <li key={t.href} className="flex-1">
                  <Link
                    href={t.href}
                    className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] tracking-widest ${
                      active ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"
                    }`}
                  >
                    <span className="h-5 w-5">{t.icon}</span>
                    <span className="font-serif-jp">{t.short}</span>
                    <span
                      aria-hidden
                      className={`h-0.5 w-6 rounded-full transition-colors ${active ? "bg-[var(--accent)]" : "bg-transparent"}`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center">
      <span className="font-serif-jp text-lg font-bold tracking-[0.15em] text-[var(--ink)]">
        麻雀番付
      </span>
    </Link>
  );
}

function IconSeat() {
  // 卓（円卓）
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 5v3M12 16v3M5 12h3M16 12h3" strokeLinecap="round" />
    </svg>
  );
}
function IconGroup() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="9" r="3" />
      <circle cx="16" cy="9" r="3" />
      <path d="M3 19c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5M12 19c0-2.5 2.2-4.5 5-4.5s4 2 4 4.5" strokeLinecap="round" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V5M4 19h16" strokeLinecap="round" />
      <rect x="7" y="11" width="3" height="6" />
      <rect x="12" y="8" width="3" height="9" />
      <rect x="17" y="13" width="3" height="4" />
    </svg>
  );
}
function IconStamp() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="6" y="4" width="12" height="12" rx="2" />
      <path d="M9 9h6M9 12h6" strokeLinecap="round" />
      <path d="M4 20h16" strokeLinecap="round" />
    </svg>
  );
}
