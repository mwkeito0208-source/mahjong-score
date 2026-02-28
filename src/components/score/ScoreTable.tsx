import type { TobiInfo } from "@/lib/score";

type RoundRow = {
  id: string | number;
  scores: (number | null)[];
  ranks?: (number | null)[];
  tobi?: TobiInfo;
};

type Props = {
  members: string[];
  rounds: RoundRow[];
  totals: number[];
  money: number[];
  onRoundTap?: (roundIndex: number) => void;
};

const RANK_BG = [
  "bg-yellow-50",  // 1位
  "",              // 2位（デフォルト）
  "",              // 3位
  "bg-gray-100",   // 4位
];

const RANK_BADGE = ["①", "②", "③", "④"];

const RANK_BADGE_COLOR = [
  "text-yellow-500", // 1位
  "text-gray-400",   // 2位
  "text-orange-400", // 3位
  "text-gray-300",   // 4位
];

export function ScoreTable({ members, rounds, totals, money, onRoundTap }: Props) {
  const cols = members.length + 1;
  const gridClass =
    cols === 4 ? "grid-cols-4" : cols === 5 ? "grid-cols-5" : "grid-cols-6";
  // 実際の対局人数（5人回しは4人、それ以外はmembers.length）
  const activePlayerCount = members.length === 5 ? 4 : members.length;

  // 順位分布を計算（メンバーごとに[1着,2着,...,N着]）
  const rankDist = members.map(() => Array(activePlayerCount).fill(0));
  // 参加半荘数を計算（5人回しで抜け番があるメンバー用）
  const playedRounds = members.map(() => 0);
  for (const round of rounds) {
    round.scores.forEach((score, i) => {
      if (score !== null) playedRounds[i]++;
    });
    if (!round.ranks) continue;
    round.ranks.forEach((rank, i) => {
      if (rank !== null && rank >= 1 && rank <= activePlayerCount) {
        rankDist[i][rank - 1]++;
      }
    });
  }
  const isFivePlayer = members.length === 5;

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

      {/* 順位分布 */}
      {rounds.length > 0 && (
        <div className={`grid ${gridClass} ${isFivePlayer ? "" : "border-b-2 border-green-800"} bg-green-50`}>
          <div className="p-2 text-center text-xs text-gray-500">順位</div>
          {rankDist.map((dist, i) => (
            <div key={i} className="p-2 text-center">
              <span className="font-mono text-xs font-bold tabular-nums text-gray-700">
                {dist.join("-")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 参加半荘数（5人回しの場合のみ） */}
      {isFivePlayer && rounds.length > 0 && (
        <div className={`grid ${gridClass} border-b-2 border-green-800 bg-green-50`}>
          <div className="p-2 text-center text-xs text-gray-500">参加</div>
          {playedRounds.map((count, i) => (
            <div key={i} className="p-2 text-center">
              <span className="text-xs font-bold text-gray-600">
                {count}/{rounds.length}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 各半荘のスコア */}
      {rounds.map((round, roundIndex) => (
        <div
          key={round.id}
          className={`grid ${gridClass} border-b border-gray-200 ${
            roundIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
          } ${onRoundTap ? "cursor-pointer active:bg-blue-50" : ""}`}
          onClick={() => onRoundTap?.(roundIndex)}
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
            const rank = round.ranks?.[i] ?? null;
            const isVictim = round.tobi?.victim === i;
            const isAttacker = round.tobi?.attacker === i;
            const rankBg = rank ? (RANK_BG[rank - 1] ?? "") : "";
            return (
              <div
                key={i}
                className={`p-3 text-center ${rankBg} ${
                  score < 0 ? "font-bold text-red-600" : ""
                }`}
              >
                <span className="text-base">
                  {score >= 0 ? "+" : ""}{score}
                </span>
                {rank !== null && rank <= RANK_BADGE.length && (
                  <sup className={`ml-0.5 text-[10px] font-bold ${RANK_BADGE_COLOR[rank - 1] ?? "text-gray-300"}`}>
                    {RANK_BADGE[rank - 1] ?? `⑤`}
                  </sup>
                )}
                {isVictim && (
                  <span className="ml-0.5 text-xs text-red-500">💥</span>
                )}
                {isAttacker && (
                  <span className="ml-0.5 text-xs">👑</span>
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
            {m.toLocaleString()}pt
          </div>
        ))}
      </div>
    </div>
  );
}
