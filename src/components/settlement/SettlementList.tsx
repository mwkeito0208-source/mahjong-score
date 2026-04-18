import type { Settlement } from "@/lib/settlement";
import { Card } from "@/components/ui";

type Props = {
  title: string;
  settlements: Settlement[];
  variant?: "default" | "highlight";
};

export function SettlementList({ title, settlements, variant = "default" }: Props) {
  const highlight = variant === "highlight";

  return (
    <Card
      padding="md"
      accent={highlight ? "shu" : "none"}
      className={highlight ? "bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface))]" : ""}
    >
      <h3 className="font-serif-jp text-base font-bold text-[var(--ink)]">{title}</h3>
      {settlements.length > 0 ? (
        <div className="mt-3 space-y-2">
          {settlements.map((s, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2.5 ${
                highlight
                  ? "border border-[var(--accent)] bg-[var(--surface)]"
                  : "border border-[var(--line)] bg-[var(--surface-2)]"
              }`}
            >
              <div className="flex items-center gap-2 text-sm text-[var(--ink)]">
                <span className="font-medium">{s.from}</span>
                <span className="text-[var(--ink-subtle)]">→</span>
                <span className="font-medium">{s.to}</span>
              </div>
              <span
                className={`num-mono tabular font-bold ${
                  highlight ? "text-[var(--accent)]" : "text-[var(--ink)]"
                }`}
              >
                {s.amount.toLocaleString()}
                <span className="ml-0.5 text-[10px] text-[var(--ink-subtle)]">pt</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 py-2 text-center text-sm text-[var(--ink-muted)]">精算なし ✓</p>
      )}
    </Card>
  );
}
