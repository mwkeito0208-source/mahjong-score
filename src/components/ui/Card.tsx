import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "section" | "article";
  padding?: "none" | "sm" | "md" | "lg";
  accent?: "none" | "gold" | "shu";
  washi?: boolean;
  children: ReactNode;
};

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export function Card({
  as: Tag = "div",
  padding = "md",
  accent = "none",
  washi = false,
  className = "",
  children,
  ...rest
}: Props) {
  const accentClass =
    accent === "gold"
      ? "border border-[var(--gold)]"
      : accent === "shu"
        ? "border-l-2 border-l-[var(--accent)] border-t border-r border-b border-[var(--line)]"
        : "border border-[var(--line)]";

  return (
    <Tag
      className={`rounded-[var(--radius-lg)] bg-[var(--surface)] ${washi ? "washi" : ""} ${accentClass} ${paddings[padding]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardTitle({
  children,
  className = "",
  serif = false,
}: {
  children: ReactNode;
  className?: string;
  serif?: boolean;
}) {
  return (
    <h3
      className={`text-base font-bold text-[var(--ink)] ${serif ? "font-serif-jp" : ""} ${className}`}
    >
      {children}
    </h3>
  );
}

export function CardSubtle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-sm text-[var(--ink-muted)] ${className}`}>{children}</p>
  );
}
