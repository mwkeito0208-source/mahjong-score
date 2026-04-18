import type { OverviewStats } from "@/lib/stats-calc";
import { Card, Stat } from "@/components/ui";

type Props = {
  stats: OverviewStats;
};

function getRankTone(rank: number): "positive" | "neutral" | "negative" {
  if (rank <= 2.0) return "positive";
  if (rank <= 2.5) return "neutral";
  return "negative";
}

const RANK_BAR_COLOR = [
  "var(--gold)",
  "#a8a8ae",
  "#c98a5a",
  "var(--ink-subtle)",
];

export function OverviewTab({ stats }: Props) {
  const totalGames = stats.rankCounts.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* 通算収支 */}
      <Card padding="lg" accent="shu">
        <div className="text-[11px] tracking-[0.25em] text-[var(--ink-subtle)]">通算収支</div>
        <div
          className={`mt-1 num-mono tabular text-4xl font-bold ${
            stats.totalBalance >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
          }`}
        >
          {stats.totalBalance >= 0 ? "+" : ""}
          {stats.totalBalance.toLocaleString()}
          <span className="ml-1 text-base text-[var(--ink-subtle)]">pt</span>
        </div>
        <div className="mt-2 text-xs text-[var(--ink-muted)]">
          {stats.totalSessions}対局・{stats.totalRounds}半荘
        </div>
      </Card>

      {/* 平均順位 + 飛び */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="md">
          <Stat
            label="平均順位"
            value={stats.avgRank.toFixed(2)}
            sub="位"
            tone={getRankTone(stats.avgRank)}
            size="lg"
          />
        </Card>
        <Card padding="md">
          <div className="flex items-end justify-between">
            <Stat label="飛び" value={stats.tobi} sub="回" tone="neutral" />
            <Stat label="率" value={`${stats.tobiRate}%`} align="right" tone="neutral" />
          </div>
        </Card>
      </div>

      {/* 順位分布 */}
      <Card padding="md">
        <h3 className="font-serif-jp text-base font-bold text-[var(--ink)]">順位分布</h3>
        <div className="mt-3 space-y-2">
          {stats.rankCounts.map((count, i) => {
            const percent =
              totalGames > 0 ? (count / totalGames) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 text-xs text-[var(--ink-muted)]">
                  {i + 1}位
                </span>
                <div className="h-4 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${percent}%`,
                      background: RANK_BAR_COLOR[i] ?? "var(--ink-subtle)",
                    }}
                  />
                </div>
                <span className="num-mono tabular w-20 text-right text-xs text-[var(--ink-muted)]">
                  {count}回 ({percent.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
