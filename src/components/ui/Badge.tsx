import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "gold" | "positive" | "negative" | "ai";
type Size = "sm" | "md";

const tones: Record<Tone, string> = {
  neutral:
    "bg-[var(--surface-2)] text-[var(--ink-muted)] border border-[var(--line)]",
  accent:
    "bg-[var(--accent)] text-[var(--accent-ink)]",
  gold:
    "bg-[var(--surface-2)] text-[var(--gold)] border border-[var(--gold)]",
  positive:
    "bg-[var(--surface-2)] text-[var(--positive)] border border-[var(--line)]",
  negative:
    "bg-[var(--surface-2)] text-[var(--negative)] border border-[var(--line)]",
  ai:
    "bg-[var(--surface-2)] text-[color:var(--color-ai-500)] border border-[var(--line)]",
};

const sizes: Record<Size, string> = {
  sm: "h-5 px-2 text-[11px]",
  md: "h-6 px-2.5 text-xs",
};

export function Badge({
  tone = "neutral",
  size = "md",
  children,
  className = "",
}: {
  tone?: Tone;
  size?: Size;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${tones[tone]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}

/** 順位バッジ（金/銀/銅/鉛） */
export function RankBadge({ rank }: { rank: 1 | 2 | 3 | 4 }) {
  const map = {
    1: { bg: "var(--gold)", label: "一" },
    2: { bg: "#a8a8ae", label: "二" },
    3: { bg: "#c98a5a", label: "三" },
    4: { bg: "var(--ink-subtle)", label: "四" },
  } as const;
  const { bg, label } = map[rank];
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius-xs)] text-[11px] font-serif-jp font-bold text-white"
      style={{ background: bg }}
      aria-label={`${rank}位`}
    >
      {label}
    </span>
  );
}
