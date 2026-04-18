import { type TobiInfo, normalizeTobis } from "@/lib/score";

type RoundRow = {
  id: string | number;
  scores: (number | null)[];
  ranks?: (number | null)[];
  tobi?: TobiInfo | TobiInfo[];
};

type Props = {
  members: string[];
  rounds: RoundRow[];
  totals: number[];
  money: number[];
  onRoundTap?: (roundIndex: number) => void;
};

/** 位を漢数字の組版に（1=一, 2=二, 3=三, 4=四） */
const RANK_KANJI = ["一", "二", "三", "四"];

/** 順位別のテキスト色（和モダン） */
const RANK_TEXT = [
  "text-[color:var(--gold)]",       // 一位
  "text-[var(--ink-muted)]",        // 二位
  "text-[color:var(--color-ai-500)]", // 三位
  "text-[var(--ink-subtle)]",       // 四位
];

/** 順位別の背景色（薄い） */
const RANK_BG = [
  "bg-[color:var(--color-kin-100)]",       // 一位 = 金の淡
  "",
  "",
  "bg-[var(--surface-2)]",                 // 四位 = わずかに沈める
];

export function ScoreTable({ members, rounds, totals, money, onRoundTap }: Props) {
  const gridCols = `minmax(3rem,auto) repeat(${members.length}, minmax(0, 1fr))`;
  const activePlayerCount = members.length === 5 ? 4 : members.length;
  const isFivePlayer = members.length === 5;

  const rankDist = members.map(() => Array(activePlayerCount).fill(0));
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

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)]">
      {/* メンバーヘッダー */}
      <div
        className="grid bg-[var(--ink)] text-[var(--surface)]"
        style={{ gridTemplateColumns: gridCols }}
      >
        <div className="px-3 py-2.5 text-center font-serif-jp text-xs tracking-widest text-[var(--ink-subtle)]">
          局
        </div>
        {members.map((name) => (
          <div
            key={name}
            className="truncate px-2 py-2.5 text-center font-serif-jp text-sm font-bold"
          >
            {name}
          </div>
        ))}
      </div>

      {/* 順位分布 */}
      {rounds.length > 0 && (
        <div
          className={`grid bg-[var(--bg-subtle)] ${isFivePlayer ? "" : "border-b border-[var(--line-strong)]"}`}
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="px-3 py-1.5 text-center text-[10px] tracking-widest text-[var(--ink-subtle)]">
            位分布
          </div>
          {rankDist.map((dist, i) => (
            <div key={i} className="px-2 py-1.5 text-center">
              <span className="num-mono tabular text-[11px] text-[var(--ink-muted)]">
                {dist.join("-")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 参加半荘数（5人回し） */}
      {isFivePlayer && rounds.length > 0 && (
        <div
          className="grid border-b border-[var(--line-strong)] bg-[var(--bg-subtle)]"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="px-3 py-1.5 text-center text-[10px] tracking-widest text-[var(--ink-subtle)]">
            出場
          </div>
          {playedRounds.map((count, i) => (
            <div key={i} className="px-2 py-1.5 text-center">
              <span className="num-mono tabular text-[11px] text-[var(--ink-muted)]">
                {count}/{rounds.length}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 各半荘のスコア */}
      {rounds.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-[var(--ink-subtle)]">
          半荘を追加するとここに表示されます
        </div>
      ) : (
        rounds.map((round, roundIndex) => (
          <div
            key={round.id}
            className={`grid items-stretch border-b border-[var(--line)] last:border-b-0 ${onRoundTap ? "cursor-pointer hover:bg-[var(--surface-2)]" : ""}`}
            style={{ gridTemplateColumns: gridCols }}
            onClick={() => onRoundTap?.(roundIndex)}
          >
            <div className="flex items-center justify-center px-3 py-2.5 font-serif-jp text-sm text-[var(--ink-muted)]">
              <span className="num-mono tabular">{roundIndex + 1}</span>
            </div>
            {round.scores.map((score, i) => {
              if (score === null) {
                return (
                  <div key={i} className="px-2 py-2.5 text-center text-base text-[var(--ink-subtle)]">
                    —
                  </div>
                );
              }
              const rank = round.ranks?.[i] ?? null;
              const tobis = normalizeTobis(round.tobi);
              const isVictim = tobis.some((t) => t.victim === i);
              const isAttacker = tobis.some((t) => t.attacker === i);
              const bg = rank ? RANK_BG[rank - 1] ?? "" : "";
              return (
                <div
                  key={i}
                  className={`flex items-center justify-center gap-0.5 px-2 py-2.5 text-center ${bg}`}
                >
                  <span
                    className={`num-mono tabular text-sm font-bold ${
                      score < 0 ? "text-[var(--negative)]" : "text-[var(--ink)]"
                    }`}
                  >
                    {score >= 0 ? "+" : ""}{score}
                  </span>
                  {rank !== null && rank <= 4 && (
                    <sup className={`font-serif-jp text-[10px] font-bold ${RANK_TEXT[rank - 1] ?? ""}`}>
                      {RANK_KANJI[rank - 1]}
                    </sup>
                  )}
                  {isVictim && (
                    <span className="text-[10px] text-[var(--negative)]" title="飛び">●</span>
                  )}
                  {isAttacker && (
                    <span className="text-[10px] text-[color:var(--gold)]" title="飛ばし">◆</span>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}

      {/* 小計 */}
      <div
        className="grid border-t border-[var(--line-strong)] bg-[var(--bg-subtle)]"
        style={{ gridTemplateColumns: gridCols }}
      >
        <div className="px-3 py-2.5 text-center font-serif-jp text-xs tracking-widest text-[var(--ink-subtle)]">
          小計
        </div>
        {totals.map((total, i) => (
          <div
            key={i}
            className={`px-2 py-2.5 text-center num-mono tabular text-sm font-bold ${
              total >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
            }`}
          >
            {total >= 0 ? "+" : ""}{total}
          </div>
        ))}
      </div>

      {/* 収支 */}
      <div
        className="grid border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))]"
        style={{ gridTemplateColumns: gridCols }}
      >
        <div className="px-3 py-2.5 text-center font-serif-jp text-xs tracking-widest text-[var(--ink-subtle)]">
          収支
        </div>
        {money.map((m, i) => (
          <div
            key={i}
            className={`px-2 py-2.5 text-center num-mono tabular text-xs font-bold ${
              m >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
            }`}
          >
            {m >= 0 ? "+" : ""}{m.toLocaleString()}
            <span className="ml-0.5 text-[9px] text-[var(--ink-subtle)]">pt</span>
          </div>
        ))}
      </div>
    </div>
  );
}
