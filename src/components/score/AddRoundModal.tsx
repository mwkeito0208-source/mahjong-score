"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { type TobiInfo, normalizeTobis } from "@/lib/score";

type Props = {
  members: string[];
  roundNumber: number;
  onSave: (scores: (number | null)[], tobi?: TobiInfo[]) => void;
  onClose: () => void;
  /** 編集モード用: 既存のスコア */
  initialScores?: (number | null)[];
  /** 編集モード用: 既存のトビ情報 */
  initialTobi?: TobiInfo | TobiInfo[];
  /** 編集モード用: 削除ハンドラ */
  onDelete?: () => void;
  /** 前回の抜け番インデックス（5人回しローテーション用） */
  lastSitOutIndex?: number | null;
  /** 持ち点（千点単位、例: 25 = 25000点） */
  startPoints?: number;
};

const STEPS = [10000, 1000, 100] as const;

const RANK_BADGE = [
  "bg-yellow-400 text-yellow-900",
  "bg-gray-300 text-gray-700",
  "bg-orange-300 text-orange-900",
  "bg-gray-200 text-gray-600",
  "bg-gray-200 text-gray-600",
];

function getRanks(scores: number[]): number[] {
  const indexed = scores.map((s, i) => ({ s, i }));
  indexed.sort((a, b) => b.s - a.s);
  const ranks = new Array<number>(scores.length);
  indexed.forEach((item, rank) => {
    ranks[item.i] = rank + 1;
  });
  return ranks;
}

function formatStep(step: number): string {
  if (step >= 10000) return `${step / 10000}万`;
  if (step >= 1000) return `${step / 1000}千`;
  return String(step);
}

export function AddRoundModal({
  members,
  roundNumber,
  onSave,
  onClose,
  initialScores,
  initialTobi,
  onDelete,
  lastSitOutIndex,
  startPoints = 25,
}: Props) {
  const isEditing = !!initialScores;
  const isFivePlayer = members.length === 5;
  const defaultScore = startPoints * 1000;

  // 初期値を算出（編集時は既存の抜け番、新規時は前回の次の人をローテーション）
  const initSitOut = initialScores
    ? initialScores.findIndex((s) => s === null)
    : -1;
  const autoSitOut =
    isFivePlayer && !isEditing && lastSitOutIndex !== undefined && lastSitOutIndex !== null
      ? (lastSitOutIndex + 1) % members.length
      : null;
  const [sitOutIndex, setSitOutIndex] = useState<number | null>(
    initSitOut >= 0 ? initSitOut : autoSitOut
  );
  const [scores, setScores] = useState<number[]>(
    initialScores
      ? initialScores.map((s) => s ?? defaultScore)
      : members.map(() => defaultScore)
  );
  const [tobiAttackers, setTobiAttackers] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    for (const t of normalizeTobis(initialTobi)) {
      map[t.victim] = t.attacker;
    }
    return map;
  });
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 抜け番以外のスコアだけで合計・判定
  const activeScores = scores.filter((_, i) => !isFivePlayer || i !== sitOutIndex);
  const activePlayerCount = isFivePlayer ? 4 : members.length;
  const expectedTotal = defaultScore * activePlayerCount;
  const total = activeScores.reduce((a, b) => a + b, 0);
  const diff = expectedTotal - total;
  const isComplete = total === expectedTotal;
  const ranks = getRanks(activeScores);
  // activeScoresの順位をmembers全体に展開
  const fullRanks = useMemo(() => {
    const result = new Array<number>(members.length).fill(0);
    let activeIdx = 0;
    for (let i = 0; i < members.length; i++) {
      if (isFivePlayer && i === sitOutIndex) continue;
      result[i] = ranks[activeIdx];
      activeIdx++;
    }
    return result;
  }, [members.length, isFivePlayer, sitOutIndex, ranks]);

  // トビした人を自動検出（スコアがマイナスの人、抜け番除外）
  const tobiVictims = useMemo(
    () =>
      scores.reduce<number[]>(
        (acc, s, i) =>
          s < 0 && (!isFivePlayer || i !== sitOutIndex) ? [...acc, i] : acc,
        []
      ),
    [scores, isFivePlayer, sitOutIndex]
  );
  const hasTobi = tobiVictims.length > 0;

  // 有効なトビ情報を構築（victimが解消されたらattackerをリセット）
  const effectiveAttackers = useMemo(() => {
    const map: Record<number, number> = {};
    for (const v of tobiVictims) {
      const a = tobiAttackers[v];
      if (a !== undefined && !tobiVictims.includes(a)) {
        map[v] = a;
      }
    }
    return map;
  }, [tobiVictims, tobiAttackers]);
  const allTobiAssigned = hasTobi && tobiVictims.every((v) => effectiveAttackers[v] !== undefined);

  const updateScore = useCallback((index: number, delta: number) => {
    setScores((prev) => {
      const updated = [...prev];
      updated[index] = updated[index] + delta;
      return updated;
    });
    setError("");
  }, []);

  const startEditing = useCallback((index: number, currentScore: number) => {
    setEditingIndex(index);
    setEditingValue(String(currentScore));
    setError("");
    // フォーカスは次のレンダー後に設定
    setTimeout(() => inputRef.current?.select(), 0);
  }, []);

  const commitEditing = useCallback(() => {
    if (editingIndex === null) return;
    const parsed = parseInt(editingValue, 10);
    if (!isNaN(parsed)) {
      setScores((prev) => {
        const updated = [...prev];
        updated[editingIndex] = parsed;
        return updated;
      });
    }
    setEditingIndex(null);
    setEditingValue("");
    setError("");
  }, [editingIndex, editingValue]);

  const handleSitOutChange = useCallback(
    (index: number) => {
      setSitOutIndex((prev) => {
        const newSitOut = prev === index ? null : index;
        // 抜け番変更時は旧抜け番と新抜け番のスコアだけリセットし、他は保持
        setScores((prevScores) => {
          const updated = [...prevScores];
          // 旧抜け番を復帰させる（デフォルトスコアに）
          if (prev !== null && prev !== newSitOut) {
            updated[prev] = defaultScore;
          }
          // 新抜け番もデフォルトに（表示はされないが内部値をリセット）
          if (newSitOut !== null) {
            updated[newSitOut] = defaultScore;
          }
          return updated;
        });
        return newSitOut;
      });
      setTobiAttackers({});
      setError("");
    },
    [defaultScore]
  );

  const handleSave = () => {
    if (isFivePlayer && sitOutIndex === null) {
      setError("抜け番を選択してください");
      return;
    }
    if (!isComplete) {
      const diffAbs = Math.abs(diff);
      const diffLabel = diff > 0 ? `残り${diffAbs.toLocaleString()}点` : `${diffAbs.toLocaleString()}点超過`;
      setError(`合計が${total.toLocaleString()}点です（${expectedTotal.toLocaleString()}点必要 / ${diffLabel}）`);
      return;
    }
    if (hasTobi && !allTobiAssigned) {
      setError("トビが発生しています。飛ばした人を全員分選択してください");
      return;
    }

    const tobis: TobiInfo[] = tobiVictims
      .filter((v) => effectiveAttackers[v] !== undefined)
      .map((v) => ({ victim: v, attacker: effectiveAttackers[v] }));

    const finalScores: (number | null)[] = scores.map((s, i) =>
      isFivePlayer && i === sitOutIndex ? null : s
    );

    onSave(finalScores, tobis.length > 0 ? tobis : undefined);
  };

  const handleClose = () => {
    setScores(members.map(() => defaultScore));
    setSitOutIndex(null);
    setTobiAttackers({});
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5">
        <h3 className="mb-4 text-center text-lg font-bold text-green-900">
          {isEditing ? `${roundNumber}半荘目を修正` : `${roundNumber}半荘目の結果`}
        </h3>

        {/* 抜け番選択（5人の場合のみ） */}
        {isFivePlayer && (
          <div className="mb-4 rounded-lg border-2 border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 text-sm font-bold text-gray-700">
              抜け番を選択
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map((name, i) => {
                const selected = sitOutIndex === i;
                return (
                  <button
                    key={name}
                    onClick={() => handleSitOutChange(i)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      selected
                        ? "bg-gray-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {members.map((name, i) => {
            const isSitOut = isFivePlayer && i === sitOutIndex;
            const isVictim = tobiVictims.includes(i);

            if (isSitOut) {
              return (
                <div
                  key={name}
                  className="rounded-lg bg-gray-100 p-3 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500">
                      {name}
                    </span>
                    <span className="text-sm text-gray-400">抜け番</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={name}
                className={`rounded-lg p-3 ${
                  isVictim ? "bg-red-50 ring-2 ring-red-300" : "bg-gray-50"
                }`}
              >
                {/* 名前 + 順位 + スコア */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${RANK_BADGE[fullRanks[i] - 1]}`}
                    >
                      {fullRanks[i]}
                    </span>
                    <span className="text-sm font-bold text-gray-700">
                      {name}
                    </span>
                    {isVictim && (
                      <span className="rounded bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                        トビ
                      </span>
                    )}
                  </div>
                  {editingIndex === i ? (
                    <input
                      ref={inputRef}
                      type="number"
                      inputMode="numeric"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={commitEditing}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitEditing();
                        }
                      }}
                      className="w-28 rounded border border-green-400 bg-white px-2 py-1 text-right text-lg font-bold tabular-nums text-gray-900 outline-none focus:ring-2 focus:ring-green-400"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditing(i, scores[i])}
                      className={`rounded px-2 py-1 text-right text-lg font-bold tabular-nums hover:bg-gray-200 ${
                        scores[i] < 0 ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {scores[i].toLocaleString()}
                    </button>
                  )}
                </div>

                {/* +/- ボタン行 */}
                <div className="flex items-center justify-end gap-1">
                  {STEPS.map((step) => (
                    <div key={step} className="flex gap-0.5">
                      <button
                        onClick={() => updateScore(i, -step)}
                        className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 active:bg-red-100"
                      >
                        -{formatStep(step)}
                      </button>
                      <button
                        onClick={() => updateScore(i, step)}
                        className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 active:bg-blue-100"
                      >
                        +{formatStep(step)}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* トビ選択（各victimごとにattackerを選択） */}
        {hasTobi && (
          <div className="mt-4 rounded-lg border-2 border-red-200 bg-red-50 p-3">
            <div className="mb-2 text-sm font-bold text-red-700">
              💥 トビ発生！ 飛ばした人は？
            </div>
            {tobiVictims.map((victimIdx) => (
              <div key={victimIdx} className="mb-2 last:mb-0">
                {tobiVictims.length > 1 && (
                  <div className="mb-1 text-xs text-red-600">
                    {members[victimIdx]} を飛ばしたのは？
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {members.map((name, i) => {
                    if (tobiVictims.includes(i)) return null;
                    if (isFivePlayer && i === sitOutIndex) return null;
                    const selected = effectiveAttackers[victimIdx] === i;
                    return (
                      <button
                        key={name}
                        onClick={() =>
                          setTobiAttackers((prev) => ({ ...prev, [victimIdx]: i }))
                        }
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                          selected
                            ? "bg-red-600 text-white"
                            : "bg-white text-gray-700 hover:bg-red-100"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
                {effectiveAttackers[victimIdx] !== undefined && (
                  <div className="mt-1 text-xs text-red-600">
                    {members[victimIdx]} → {members[effectiveAttackers[victimIdx]]}{" "}
                    に飛び賞 (±10)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 合計表示 */}
        <div className="mb-4 mt-4 rounded-lg bg-gray-100 p-3">
          <div className="text-center">
            <span className="text-gray-600">合計{isFivePlayer ? `(${activePlayerCount}人分)` : ""}: </span>
            <span
              className={`font-bold ${isComplete ? "text-green-700" : "text-red-700"}`}
            >
              {total.toLocaleString()}点
            </span>
            {isComplete && <span className="ml-2 text-green-700">✓</span>}
          </div>
          {!isComplete && (
            <div className="mt-1 text-center text-sm">
              <span className="text-gray-500">
                {diff > 0
                  ? `残り: ${diff.toLocaleString()}点`
                  : `超過: ${Math.abs(diff).toLocaleString()}点`}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 削除ボタン（編集モード時） */}
        {isEditing && onDelete && (
          <div className="mb-3">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full rounded-lg border border-red-200 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                この半荘を削除
              </button>
            ) : (
              <div className="rounded-lg bg-red-50 p-3">
                <p className="mb-2 text-center text-sm font-bold text-red-600">
                  本当に削除しますか？
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-lg bg-gray-200 py-2 text-sm text-gray-700"
                  >
                    やめる
                  </button>
                  <button
                    onClick={onDelete}
                    className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-bold text-white"
                  >
                    削除する
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 rounded-lg bg-gray-200 py-3 text-base text-gray-700 hover:bg-gray-300"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-green-900 py-3 text-base font-bold text-white hover:bg-green-800"
          >
            {isEditing ? "更新" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
