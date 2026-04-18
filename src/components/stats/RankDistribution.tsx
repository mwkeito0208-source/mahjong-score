type Props = {
  counts: number[];
};

const RANK_BAR_COLOR = [
  "var(--gold)",
  "#a8a8ae",
  "#c98a5a",
  "var(--ink-subtle)",
];

export function RankDistribution({ counts }: Props) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div>
      <h4 className="font-serif-jp text-sm font-bold text-[var(--ink)]">順位分布</h4>
      <div className="mt-2 space-y-1.5">
        {counts.map((count, i) => {
          const percent = (count / total) * 100;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-right text-[11px] text-[var(--ink-muted)]">
                {i + 1}位
              </span>
              <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${percent}%`,
                    background: RANK_BAR_COLOR[i] ?? "var(--ink-subtle)",
                  }}
                />
              </div>
              <span className="num-mono tabular w-16 text-right text-[11px] text-[var(--ink-muted)]">
                {count}回 ({percent.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
