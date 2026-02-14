type Props = {
  counts: [number, number, number, number];
};

const BARS = [
  { rank: 1, color: "bg-yellow-400" },
  { rank: 2, color: "bg-gray-300" },
  { rank: 3, color: "bg-orange-300" },
  { rank: 4, color: "bg-gray-200" },
];

export function RankDistribution({ counts }: Props) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div>
      <h4 className="mb-2 text-sm font-bold text-gray-500">順位分布</h4>
      <div className="space-y-1.5">
        {BARS.map((bar, i) => {
          const percent = ((counts[i] / total) * 100).toFixed(1);
          return (
            <div key={bar.rank} className="flex items-center gap-2">
              <span className="w-6 text-right text-xs text-gray-600">
                {bar.rank}位
              </span>
              <div className="h-5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full ${bar.color} rounded-full`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-16 text-right text-xs tabular-nums text-gray-600">
                {counts[i]}回 ({percent}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
