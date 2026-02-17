type MyStats = {
  totalSessions: number;
  totalRounds: number;
  totalBalance: number;
  avgRank: number;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  fourthPlace: number;
  tobi: number;
  tobiRate: number;
};

type Props = {
  stats: MyStats;
};

function getRankColor(rank: number): string {
  if (rank <= 2.0) return "text-green-600";
  if (rank <= 2.5) return "text-yellow-600";
  return "text-red-600";
}

const RANK_BARS = [
  { key: "firstPlace" as const, rank: 1, color: "bg-yellow-400" },
  { key: "secondPlace" as const, rank: 2, color: "bg-gray-300" },
  { key: "thirdPlace" as const, rank: 3, color: "bg-orange-300" },
  { key: "fourthPlace" as const, rank: 4, color: "bg-gray-200" },
];

export function OverviewTab({ stats }: Props) {
  const totalGames =
    stats.firstPlace + stats.secondPlace + stats.thirdPlace + stats.fourthPlace;

  return (
    <div className="space-y-4">
      {/* 通算収支 */}
      <div className="rounded-xl bg-gradient-to-r from-green-500 to-green-600 p-5 text-white shadow-md">
        <div className="mb-1 text-sm opacity-80">通算収支</div>
        <div className="text-3xl font-bold">
          {stats.totalBalance >= 0 ? "+" : ""}
          {stats.totalBalance.toLocaleString()}pt
        </div>
        <div className="mt-2 text-sm opacity-80">
          {stats.totalSessions}セッション / {stats.totalRounds}半荘
        </div>
      </div>

      {/* 平均順位 */}
      <div className="rounded-xl bg-white p-4 shadow-md">
        <div className="mb-2 text-sm text-gray-500">平均順位</div>
        <div className="flex items-end gap-2">
          <span
            className={`text-4xl font-bold ${getRankColor(stats.avgRank)}`}
          >
            {stats.avgRank.toFixed(2)}
          </span>
          <span className="mb-1 text-gray-400">位</span>
        </div>
      </div>

      {/* 順位分布 */}
      <div className="rounded-xl bg-white p-4 shadow-md">
        <div className="mb-3 text-sm text-gray-500">順位分布</div>
        <div className="space-y-2">
          {RANK_BARS.map((item) => {
            const count = stats[item.key];
            const percent = ((count / totalGames) * 100).toFixed(1);
            return (
              <div key={item.rank} className="flex items-center gap-3">
                <span className="w-8 text-sm text-gray-600">
                  {item.rank}位
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-20 text-right text-sm text-gray-600">
                  {count}回 ({percent}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 飛び率 */}
      <div className="rounded-xl bg-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">飛び回数</div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.tobi}回
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">飛び率</div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.tobiRate}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
