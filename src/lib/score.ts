export type TobiInfo = {
  /** トビした人のインデックス */
  victim: number;
  /** トビさせた人のインデックス */
  attacker: number;
};

/** 五捨六入: 100の位が6以上なら切り上げ（マイナス対応） */
export function roundScore(score: number): number {
  if (score >= 0) {
    const hundreds = Math.floor(score / 100) % 10;
    return hundreds >= 6
      ? Math.ceil(score / 1000)
      : Math.floor(score / 1000);
  }
  // マイナスの場合: -1200 → -1, -1600 → -2
  const abs = Math.abs(score);
  const hundreds = Math.floor(abs / 100) % 10;
  return hundreds >= 6
    ? -Math.ceil(abs / 1000)
    : -Math.floor(abs / 1000);
}

/** 順位を取得（同点は先着順） */
export function getRanks(scores: number[]): number[] {
  const indexed = scores.map((s, i) => ({ s, i }));
  indexed.sort((a, b) => b.s - a.s);
  const ranks = new Array<number>(scores.length);
  indexed.forEach((item, rank) => {
    ranks[item.i] = rank + 1;
  });
  return ranks;
}

/** ウマオカ計算 (返し点からの差分 + ウマ) */
export function calculateFinalScore(
  roundedScore: number,
  rank: number,
  returnPoints: number = 30,
  uma: number[] = [30, 10, -10, -30]
): number {
  const baseScore = roundedScore - returnPoints;
  return baseScore + uma[rank - 1];
}

/** 後方互換: 単一TobiInfoを配列に正規化 */
export function normalizeTobis(tobi?: TobiInfo | TobiInfo[]): TobiInfo[] {
  if (!tobi) return [];
  return Array.isArray(tobi) ? tobi : [tobi];
}

/** 半荘の生スコアから最終スコアを計算（オカ・トビ・抜け番対応） */
export function calculateRoundScores(
  rawScores: (number | null)[],
  returnPoints: number = 30,
  uma: number[] = [30, 10, -10, -30],
  topiPenalty: number = 10,
  tobi?: TobiInfo | TobiInfo[],
  startPoints: number = 25,
  inputMode?: "raw" | "points"
): number[] {
  // ポイント入力モード: スコアはそのまま最終ポイント
  if (inputMode === "points") {
    return rawScores.map((s) => s ?? 0);
  }

  // 抜け番(null)を除外して4人分で計算
  const activeIndices = rawScores.reduce<number[]>(
    (acc, s, i) => (s !== null ? [...acc, i] : acc),
    []
  );
  const activeScores = activeIndices.map((i) => rawScores[i] as number);

  const rounded = activeScores.map(roundScore);

  // ウマ合計がゼロであることを検証（カスタムウマ対応時の安全策）
  const activeUma = uma.slice(0, activeScores.length);
  const umaSum = activeUma.reduce((sum, u) => sum + u, 0);
  if (umaSum !== 0) {
    console.warn(`[score] ウマ合計が0ではありません: ${umaSum}`, activeUma);
  }

  // 五捨六入の丸め誤差を1位が負担（サムゼロ補正）
  // 素点（丸め前）で1位を判定してから補正する
  const expectedTotal = startPoints * activeScores.length;
  const roundedTotal = rounded.reduce((sum, s) => sum + s, 0);
  const rawRanks = getRanks(activeScores);
  const firstPlaceIdx = rawRanks.indexOf(1);
  rounded[firstPlaceIdx] += expectedTotal - roundedTotal;

  const ranks = getRanks(rounded);
  const activeFinals = rounded.map((score, i) =>
    calculateFinalScore(score, ranks[i], returnPoints, activeUma)
  );

  // オカ（1位ボーナス）: (返し点 - 持ち点) × 人数
  const oka = (returnPoints - startPoints) * activeScores.length;
  if (oka !== 0) {
    activeFinals[firstPlaceIdx] += oka;
  }

  // トビ賞の適用（activeIndices内でのインデックスに変換）
  for (const t of normalizeTobis(tobi)) {
    const victimActive = activeIndices.indexOf(t.victim);
    const attackerActive = activeIndices.indexOf(t.attacker);
    if (victimActive !== -1 && attackerActive !== -1) {
      activeFinals[victimActive] -= topiPenalty;
      activeFinals[attackerActive] += topiPenalty;
    }
  }

  // 元の配列長に展開（null位置は0）
  const finals = new Array<number>(rawScores.length).fill(0);
  activeIndices.forEach((origIdx, activeIdx) => {
    finals[origIdx] = activeFinals[activeIdx];
  });

  return finals;
}

export type RoundData = {
  scores: (number | null)[];
  tobi?: TobiInfo | TobiInfo[];
  inputMode?: "raw" | "points";
};

/** 全半荘の小計（オカ・トビ対応） */
export function calculateTotals(
  rounds: RoundData[],
  returnPoints: number = 30,
  uma: number[] = [30, 10, -10, -30],
  tobiPenalty: number = 10,
  startPoints: number = 25
): number[] {
  const memberCount = rounds[0]?.scores.length ?? 4;
  const totals = Array(memberCount).fill(0);
  for (const round of rounds) {
    const scores = calculateRoundScores(
      round.scores,
      returnPoints,
      uma,
      tobiPenalty,
      round.tobi,
      startPoints,
      round.inputMode
    );
    scores.forEach((score, i) => {
      totals[i] += score;
    });
  }
  return totals;
}

/** スコアから収支（pt）を計算 */
export function calculateMoney(
  totals: number[],
  ratePerPoint: number = 100
): number[] {
  return totals.map((t) => t * ratePerPoint);
}
