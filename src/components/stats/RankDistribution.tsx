type Props = {
  counts: number[];
};

const RANK_COLORS = [
  "bg-yellow-400",  // 1位
  "bg-gray-300",    // 2位
  "bg-orange-300",  // 3位
  "bg-gray-200",    // 4位
];

export function RankDistribution({ counts }: Props) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div>
      <h4 className="mb-2 text-sm font-bold text-gray-500">順位分布</h4>
      <div className="space-y-1.5">
        {counts.map((count, i) => {
          const percent = ((count / total) * 100).toFixed(1);
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-right text-xs text-gray-600">
                {i + 1}位
              </span>
              <div className="h-5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full ${RANK_COLORS[i] ?? "bg-gray-200"} rounded-full`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-16 text-right text-xs tabular-nums text-gray-600">
                {count}回 ({percent}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
