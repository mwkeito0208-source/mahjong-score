import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "accent";
  align?: "left" | "center" | "right";
  size?: "md" | "lg";
};

const valueColor = {
  neutral: "text-[var(--ink)]",
  positive: "text-[var(--positive)]",
  negative: "text-[var(--negative)]",
  accent: "text-[var(--accent)]",
};

export function Stat({
  label,
  value,
  sub,
  tone = "neutral",
  align = "left",
  size = "md",
}: Props) {
  const alignCls =
    align === "center" ? "items-center text-center" : align === "right" ? "items-end text-right" : "items-start";
  const valueSize = size === "lg" ? "text-3xl" : "text-2xl";
  return (
    <div className={`flex flex-col gap-0.5 ${alignCls}`}>
      <span className="text-xs font-medium tracking-wider text-[var(--ink-subtle)]">
        {label}
      </span>
      <span className={`num-mono tabular ${valueSize} font-bold ${valueColor[tone]}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-[var(--ink-muted)]">{sub}</span>}
    </div>
  );
}
