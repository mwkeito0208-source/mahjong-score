type Props = {
  members: string[];
  mahjongBalances: number[];
  chipBalances: number[];
  expenseBalances: number[];
  finalBalances: number[];
  chipEnabled: boolean;
};

function fmt(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString()}`;
}

export function BreakdownDetails({
  members,
  mahjongBalances,
  chipBalances,
  expenseBalances,
  finalBalances,
  chipEnabled,
}: Props) {
  return (
    <details className="group rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)]">
      <summary className="cursor-pointer list-none px-4 py-3 font-medium text-[var(--ink)]">
        <span className="inline-flex items-center gap-2">
          <span className="font-serif-jp text-base">最終収支の内訳</span>
          <span className="text-[10px] text-[var(--ink-subtle)]">五捨六入で計算</span>
          <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="border-t border-[var(--line)] px-4 pb-3 pt-2">
        <div className="divide-y divide-[var(--line)]">
          {members.map((name, i) => (
            <div key={name} className="flex items-start justify-between gap-3 py-2">
              <span className="text-sm text-[var(--ink)]">{name}</span>
              <div className="text-right">
                <div
                  className={`num-mono tabular text-sm font-bold ${
                    finalBalances[i] >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                  }`}
                >
                  {fmt(finalBalances[i])}
                  <span className="ml-0.5 text-[10px] text-[var(--ink-subtle)]">pt</span>
                </div>
                <div className="mt-0.5 flex flex-wrap justify-end gap-x-2 text-[10px] text-[var(--ink-subtle)]">
                  <span>麻雀 {fmt(mahjongBalances[i])}</span>
                  {chipEnabled && <span>チップ {fmt(chipBalances[i])}</span>}
                  <span>費用 {fmt(expenseBalances[i])}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
