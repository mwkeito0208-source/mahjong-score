import type { TobiInfo } from "@/lib/score";

type Props = {
  members: string[];
  rounds: { id: string | number; scores: (number | null)[]; tobi?: TobiInfo }[];
  totals: number[];
  money: number[];
};

export function ScoreTable({ members, rounds, totals, money }: Props) {
  const cols = members.length + 1;
  const gridClass = cols === 5 ? "grid-cols-5" : "grid-cols-6";

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-lg">
      {/* メンバーヘッダー */}
      <div className={`grid ${gridClass} bg-green-800 text-sm font-bold text-white`}>
        <div className="p-3 text-center">#</div>
        {members.map((name) => (
          <div key={name} className="p-3 text-center">
            {name}
          </div>
        ))}
      </div>

      {/* 各半荘のスコア */}
      {rounds.map((round, roundIndex) => (
        <div
          key={round.id}
          className={`grid ${gridClass} border-b border-gray-200 ${
            roundIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
          }`}
        >
          <div className="p-3 text-center font-bold text-gray-500">
            {roundIndex + 1}
          </div>
          {round.scores.map((score, i) => {
            if (score === null) {
              return (
                <div key={i} className="p-3 text-center text-base text-gray-300">
                  -
                </div>
              );
            }
            const isVictim = round.tobi?.victim === i;
            const isAttacker = round.tobi?.attacker === i;
            return (
              <div
                key={i}
                className={`p-3 text-center text-base ${
                  score < 0 ? "font-bold text-red-600" : ""
                }`}
              >
                {score}
                {isVictim && (
                  <span className="ml-0.5 text-xs text-red-500" title="トビ">
                    💥
                  </span>
                )}
                {isAttacker && (
                  <span className="ml-0.5 text-xs" title="飛び賞">
                    👑
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* 小計 */}
      <div
        className={`grid ${gridClass} border-t-2 border-green-800 bg-green-50 font-bold`}
      >
        <div className="p-3 text-center text-gray-500">小計</div>
        {totals.map((total, i) => (
          <div
            key={i}
            className={`p-3 text-center text-base ${
              total >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {total >= 0 ? "+" : ""}
            {total}
          </div>
        ))}
      </div>

      {/* 収支 */}
      <div className={`grid ${gridClass} bg-orange-50 font-bold`}>
        <div className="p-3 text-center text-gray-500">収支</div>
        {money.map((m, i) => (
          <div
            key={i}
            className={`p-3 text-center text-sm ${
              m >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {m >= 0 ? "+" : ""}
            {m.toLocaleString()}円
          </div>
        ))}
      </div>
    </div>
  );
}
