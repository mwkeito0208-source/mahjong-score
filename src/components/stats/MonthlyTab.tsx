import { Card } from "@/components/ui";

type MonthlyStat = {
  month: string;
  sessions: number;
  balance: number;
};

type Props = {
  data: MonthlyStat[];
};

export function MonthlyTab({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card padding="lg" className="text-center">
        <p className="text-sm text-[var(--ink-muted)]">データがありません</p>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {data.map((month) => (
        <Card key={month.month} padding="md">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-serif-jp text-base font-bold text-[var(--ink)]">
                {month.month}
              </div>
              <div className="mt-0.5 text-xs text-[var(--ink-muted)]">
                {month.sessions}対局
              </div>
            </div>
            <div
              className={`num-mono tabular text-lg font-bold ${
                month.balance >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
              }`}
            >
              {month.balance >= 0 ? "+" : ""}
              {month.balance.toLocaleString()}
              <span className="ml-0.5 text-[10px] text-[var(--ink-subtle)]">pt</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
