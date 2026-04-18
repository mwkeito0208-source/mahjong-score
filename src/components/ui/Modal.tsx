"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  titleSerif?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({
  open,
  onClose,
  title,
  titleSerif = true,
  children,
  footer,
  size = "md",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(0,0,0,0.45)] p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92vh] w-full ${sizes[size]} flex-col overflow-hidden rounded-t-[var(--radius-xl)] bg-[var(--surface)] shadow-[var(--shadow-lg)] sm:rounded-[var(--radius-xl)]`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
            <h2
              className={`text-lg font-bold text-[var(--ink)] ${titleSerif ? "font-serif-jp" : ""}`}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="閉じる"
              className="rounded-[var(--radius-sm)] p-1 text-[var(--ink-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t border-[var(--line)] bg-[var(--surface-2)] px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
