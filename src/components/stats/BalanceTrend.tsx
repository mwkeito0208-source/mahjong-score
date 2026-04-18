type Props = {
  history: {
    date: string;
    members: { name: string; balance: number }[];
  }[];
};

/** 和のライン色（朱・藍・金・緑青・墨） */
const COLORS = [
  "#c1272d", // 朱
  "#22384f", // 藍
  "#a8874a", // 金
  "#3a6b5a", // 緑青
  "#5a5a60", // 墨
];

export function BalanceTrend({ history }: Props) {
  if (history.length === 0) return null;

  const memberNames = history[0].members.map((m) => m.name);

  const cumulativeByMember: Record<string, number[]> = {};
  for (const name of memberNames) cumulativeByMember[name] = [];
  const runningTotals: Record<string, number> = {};
  for (const name of memberNames) runningTotals[name] = 0;
  for (const session of history) {
    for (const m of session.members) {
      runningTotals[m.name] += m.balance;
      cumulativeByMember[m.name].push(runningTotals[m.name]);
    }
  }

  const W = 320;
  const H = 180;
  const PAD_L = 48;
  const PAD_R = 12;
  const PAD_T = 12;
  const PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const allValues = memberNames.flatMap((n) => cumulativeByMember[n]);
  const rawMax = Math.max(...allValues, 0);
  const rawMin = Math.min(...allValues, 0);
  const margin = Math.max(Math.abs(rawMax), Math.abs(rawMin)) * 0.15 || 1000;
  const yMax = rawMax + margin;
  const yMin = rawMin - margin;
  const yRange = yMax - yMin;

  const xStep = history.length > 1 ? chartW / (history.length - 1) : 0;
  const toX = (i: number) => PAD_L + i * xStep;
  const toY = (v: number) => PAD_T + chartH - ((v - yMin) / yRange) * chartH;

  const yGridStep = (() => {
    const range = yMax - yMin;
    if (range <= 5000) return 1000;
    if (range <= 20000) return 5000;
    if (range <= 50000) return 10000;
    return 20000;
  })();
  const yGridValues: number[] = [];
  for (
    let v = Math.ceil(yMin / yGridStep) * yGridStep;
    v <= yMax;
    v += yGridStep
  ) {
    yGridValues.push(v);
  }

  const paths = memberNames.map((name) => {
    const points = cumulativeByMember[name].map((v, i) => `${toX(i)},${toY(v)}`);
    return points.join(" L ");
  });

  return (
    <div>
      <h4 className="font-serif-jp text-sm font-bold text-[var(--ink)]">収支推移</h4>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full">
        {yGridValues.map((v) => (
          <g key={v}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={toY(v)}
              y2={toY(v)}
              stroke={v === 0 ? "var(--line-strong)" : "var(--line)"}
              strokeWidth={v === 0 ? 1 : 0.5}
            />
            <text
              x={PAD_L - 4}
              y={toY(v) + 3}
              textAnchor="end"
              className="text-[9px] fill-[var(--ink-subtle)]"
              fontFamily="var(--font-mono)"
            >
              {v >= 0 ? "+" : ""}{(v / 1000).toFixed(0)}k
            </text>
          </g>
        ))}

        {history.map((h, i) => {
          const showLabel =
            history.length <= 8 ||
            i === 0 ||
            i === history.length - 1 ||
            i % Math.ceil(history.length / 6) === 0;
          if (!showLabel) return null;
          return (
            <text
              key={i}
              x={toX(i)}
              y={H - 4}
              textAnchor="middle"
              className="text-[9px] fill-[var(--ink-subtle)]"
            >
              {h.date}
            </text>
          );
        })}

        {paths.map((d, i) => (
          <polyline
            key={memberNames[i]}
            points={d}
            fill="none"
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {memberNames.map((name, i) => {
          const lastIdx = cumulativeByMember[name].length - 1;
          const lastVal = cumulativeByMember[name][lastIdx];
          return (
            <circle
              key={name}
              cx={toX(lastIdx)}
              cy={toY(lastVal)}
              r={3}
              fill={COLORS[i % COLORS.length]}
            />
          );
        })}
      </svg>

      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 px-1">
        {memberNames.map((name, i) => (
          <div key={name} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-xs text-[var(--ink-muted)]">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
