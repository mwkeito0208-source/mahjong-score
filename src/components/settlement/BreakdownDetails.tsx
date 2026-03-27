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
    <details className="mb-4 rounded-xl bg-white shadow-md">
      <summary className="cursor-pointer rounded-xl p-4 font-bold text-gray-700 hover:bg-gray-50">
        📋 最終収支の内訳
        <span className="ml-2 text-xs font-normal text-gray-400">
          ※五捨六入で計算
        </span>
      </summary>
      <div className="px-4 pb-4">
        <div className="space-y-2">
          {members.map((name, i) => (
            <div
              key={name}
              className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0"
            >
              <span className="text-gray-700">{name}</span>
              <div className="text-right">
                <span
                  className={`font-bold ${finalBalances[i] >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {fmt(finalBalances[i])}pt
                </span>
                <div className="mt-0.5 space-x-2 text-xs text-gray-400">
                  <span>麻雀{fmt(mahjongBalances[i])}</span>
                  {chipEnabled && <span>チップ{fmt(chipBalances[i])}</span>}
                  <span>費用{fmt(expenseBalances[i])}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
