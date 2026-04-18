import { Card } from "@/components/ui";

type Props = {
  title: string;
  members: string[];
  balances: number[];
  subtitle?: string;
  extra?: (index: number) => React.ReactNode;
  action?: React.ReactNode;
};

function formatPt(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString()}`;
}

export function BalanceSection({
  title,
  members,
  balances,
  subtitle,
  extra,
  action,
}: Props) {
  return (
    <Card padding="md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif-jp text-base font-bold text-[var(--ink)]">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[var(--ink-subtle)]">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="mt-3 divide-y divide-[var(--line)]">
        {members.map((name, i) => (
          <div key={name} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-sm text-[var(--ink)]">
              <span>{name}</span>
              <span className="text-xs text-[var(--ink-subtle)]">{extra?.(i)}</span>
            </div>
            <span
              className={`num-mono tabular text-sm font-bold ${
                balances[i] > 0
                  ? "text-[var(--positive)]"
                  : balances[i] < 0
                    ? "text-[var(--negative)]"
                    : "text-[var(--ink-muted)]"
              }`}
            >
              {formatPt(balances[i])}<span className="ml-0.5 text-[10px] text-[var(--ink-subtle)]">pt</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
