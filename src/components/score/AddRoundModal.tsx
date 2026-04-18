"use client";

import { useState, useCallback, useMemo } from "react";
import { type TobiInfo, normalizeTobis } from "@/lib/score";
import { Modal, Button, Badge, RankBadge } from "@/components/ui";

type InputMode = "raw" | "points";

type Props = {
  members: string[];
  roundNumber: number;
  onSave: (scores: (number | null)[], tobi?: TobiInfo[], inputMode?: InputMode) => void;
  onClose: () => void;
  initialScores?: (number | null)[];
  initialTobi?: TobiInfo | TobiInfo[];
  initialInputMode?: InputMode;
  onDelete?: () => void;
  lastSitOutIndex?: number | null;
  startPoints?: number;
};

const RAW_STEPS = [10000, 1000, 100] as const;
const POINTS_STEPS = [10, 5, 1] as const;

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
  initialInputMode,
  onDelete,
  lastSitOutIndex,
  startPoints = 25,
}: Props) {
  const isEditing = !!initialScores;
  const isFivePlayer = members.length === 5;
  const [inputMode, setInputMode] = useState<InputMode>(initialInputMode ?? "raw");
  const isPointsMode = inputMode === "points";
  const defaultScore = isPointsMode ? 0 : startPoints * 1000;
  const steps = isPointsMode ? POINTS_STEPS : RAW_STEPS;

  const initSitOut = initialScores ? initialScores.findIndex((s) => s === null) : -1;
  const autoSitOut =
    isFivePlayer && !isEditing && lastSitOutIndex !== undefined && lastSitOutIndex !== null
      ? (lastSitOutIndex + 1) % members.length
      : null;
  const [sitOutIndex, setSitOutIndex] = useState<number | null>(
    initSitOut >= 0 ? initSitOut : autoSitOut,
  );
  const [scores, setScores] = useState<number[]>(
    initialScores
      ? initialScores.map((s) => s ?? defaultScore)
      : members.map(() => defaultScore),
  );
  const [tobiAttackers, setTobiAttackers] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    for (const t of normalizeTobis(initialTobi)) map[t.victim] = t.attacker;
    return map;
  });
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const activeScores = scores.filter((_, i) => !isFivePlayer || i !== sitOutIndex);
  const activePlayerCount = isFivePlayer ? 4 : members.length;
  const expectedTotal = isPointsMode ? 0 : startPoints * 1000 * activePlayerCount;
  const total = activeScores.reduce((a, b) => a + b, 0);
  const diff = expectedTotal - total;
  const isComplete = total === expectedTotal;
  const ranks = getRanks(activeScores);
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

  const tobiVictims = useMemo(
    () =>
      scores.reduce<number[]>(
        (acc, s, i) => (s < 0 && (!isFivePlayer || i !== sitOutIndex) ? [...acc, i] : acc),
        [],
      ),
    [scores, isFivePlayer, sitOutIndex],
  );
  const hasTobi = !isPointsMode && tobiVictims.length > 0;

  const effectiveAttackers = useMemo(() => {
    const map: Record<number, number> = {};
    for (const v of tobiVictims) {
      const a = tobiAttackers[v];
      if (a !== undefined && !tobiVictims.includes(a)) map[v] = a;
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

  const handleScoreInput = useCallback((index: number, value: string) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      setScores((prev) => {
        const updated = [...prev];
        updated[index] = parsed;
        return updated;
      });
    }
    setError("");
  }, []);

  const handleModeChange = useCallback((mode: InputMode) => {
    setInputMode(mode);
    const newDefault = mode === "points" ? 0 : startPoints * 1000;
    setScores(members.map(() => newDefault));
    setTobiAttackers({});
    setError("");
  }, [members, startPoints]);

  const handleSitOutChange = useCallback(
    (index: number) => {
      setSitOutIndex((prev) => {
        const newSitOut = prev === index ? null : index;
        setScores((prevScores) => {
          const updated = [...prevScores];
          if (prev !== null && prev !== newSitOut) updated[prev] = defaultScore;
          if (newSitOut !== null) updated[newSitOut] = defaultScore;
          return updated;
        });
        return newSitOut;
      });
      setTobiAttackers({});
      setError("");
    },
    [defaultScore],
  );

  const handleSave = () => {
    if (isFivePlayer && sitOutIndex === null) {
      setError("抜け番を選択してください");
      return;
    }
    if (!isComplete) {
      if (isPointsMode) {
        setError(`合計が0になる必要があります（現在: ${total >= 0 ? "+" : ""}${total}）`);
      } else {
        const diffAbs = Math.abs(diff);
        const diffLabel = diff > 0 ? `残り${diffAbs.toLocaleString()}点` : `${diffAbs.toLocaleString()}点超過`;
        setError(`合計が${total.toLocaleString()}点です（${expectedTotal.toLocaleString()}点必要 / ${diffLabel}）`);
      }
      return;
    }
    if (hasTobi && !allTobiAssigned) {
      setError("飛ばした人を全員分選択してください");
      return;
    }

    const tobis: TobiInfo[] = isPointsMode
      ? []
      : tobiVictims
          .filter((v) => effectiveAttackers[v] !== undefined)
          .map((v) => ({ victim: v, attacker: effectiveAttackers[v] }));

    const finalScores: (number | null)[] = scores.map((s, i) =>
      isFivePlayer && i === sitOutIndex ? null : s,
    );

    onSave(finalScores, tobis.length > 0 ? tobis : undefined, inputMode);
  };

  const title = isEditing ? `${roundNumber}半荘目 を修正` : `${roundNumber}半荘目 の結果`;

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="md" fullWidth onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="primary" size="md" fullWidth onClick={handleSave}>
            {isEditing ? "更新する" : "保存する"}
          </Button>
        </div>
      }
    >
      {/* 入力モード切替 */}
      <div className="mb-4 flex rounded-[var(--radius-md)] border border-[var(--line)] p-0.5">
        <button
          onClick={() => inputMode !== "raw" && handleModeChange("raw")}
          className={`flex-1 rounded-[var(--radius-sm)] py-2 text-sm font-medium transition-colors ${
            !isPointsMode
              ? "bg-[var(--accent)] text-[var(--accent-ink)]"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
          }`}
        >
          素点入力
        </button>
        <button
          onClick={() => inputMode !== "points" && handleModeChange("points")}
          className={`flex-1 rounded-[var(--radius-sm)] py-2 text-sm font-medium transition-colors ${
            isPointsMode
              ? "bg-[var(--accent)] text-[var(--accent-ink)]"
              : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
          }`}
        >
          ポイント入力
        </button>
      </div>

      {/* 抜け番選択（5人卓） */}
      {isFivePlayer && (
        <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-2)] p-3">
          <div className="mb-2 text-[11px] tracking-widest text-[var(--ink-subtle)]">抜け番</div>
          <div className="flex flex-wrap gap-1.5">
            {members.map((name, i) => {
              const selected = sitOutIndex === i;
              return (
                <button
                  key={name}
                  onClick={() => handleSitOutChange(i)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                    selected
                      ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]"
                      : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--ink-subtle)]"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* プレイヤーごとの入力 */}
      <div className="space-y-2">
        {members.map((name, i) => {
          const isSitOut = isFivePlayer && i === sitOutIndex;
          const isVictim = tobiVictims.includes(i);

          if (isSitOut) {
            return (
              <div
                key={name}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5 opacity-60"
              >
                <span className="text-sm font-medium text-[var(--ink-muted)]">{name}</span>
                <Badge tone="neutral" size="sm">抜け番</Badge>
              </div>
            );
          }

          return (
            <div
              key={name}
              className={`rounded-[var(--radius-md)] border p-3 transition-colors ${
                isVictim
                  ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))]"
                  : "border-[var(--line)] bg-[var(--surface)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {!isPointsMode && fullRanks[i] >= 1 && fullRanks[i] <= 4 && (
                    <RankBadge rank={fullRanks[i] as 1 | 2 | 3 | 4} />
                  )}
                  <span className="truncate text-sm font-medium text-[var(--ink)]">{name}</span>
                  {!isPointsMode && isVictim && (
                    <Badge tone="accent" size="sm">飛び</Badge>
                  )}
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={scores[i]}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleScoreInput(i, e.target.value)}
                  className={`w-32 rounded-[var(--radius-sm)] border border-transparent bg-transparent px-2 py-1 text-right num-mono tabular text-lg font-bold focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none ${
                    scores[i] < 0 ? "text-[var(--negative)]" : "text-[var(--ink)]"
                  }`}
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-1">
                {steps.map((step) => (
                  <div key={step} className="flex gap-0.5">
                    <button
                      onClick={() => updateScore(i, -step)}
                      className="rounded-[var(--radius-sm)] border border-[var(--line)] px-2 py-1 text-xs font-medium text-[var(--negative)] hover:bg-[var(--surface-2)]"
                    >
                      −{formatStep(step)}
                    </button>
                    <button
                      onClick={() => updateScore(i, step)}
                      className="rounded-[var(--radius-sm)] border border-[var(--line)] px-2 py-1 text-xs font-medium text-[var(--positive)] hover:bg-[var(--surface-2)]"
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

      {/* トビ選択 */}
      {hasTobi && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface))] p-3">
          <div className="mb-2 text-sm font-bold text-[var(--accent)]">
            飛ばした人は？
          </div>
          {tobiVictims.map((victimIdx) => (
            <div key={victimIdx} className="mb-2 last:mb-0">
              {tobiVictims.length > 1 && (
                <div className="mb-1 text-xs text-[var(--ink-muted)]">
                  {members[victimIdx]} を飛ばしたのは？
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
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
                      className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                        selected
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                          : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--ink-subtle)]"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
              {effectiveAttackers[victimIdx] !== undefined && (
                <div className="mt-1 text-xs text-[var(--ink-muted)]">
                  {members[victimIdx]} → {members[effectiveAttackers[victimIdx]]} に飛び賞（±10）
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 合計チェック */}
      <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5 text-center">
        <span className="text-xs text-[var(--ink-muted)]">
          合計{isFivePlayer ? `（${activePlayerCount}人）` : ""}：
        </span>
        <span
          className={`ml-2 num-mono tabular text-base font-bold ${
            isComplete ? "text-[var(--positive)]" : "text-[var(--negative)]"
          }`}
        >
          {isPointsMode ? total : `${total.toLocaleString()}点`}
        </span>
        {isComplete && <span className="ml-1 text-[var(--positive)]">✓</span>}
        {!isComplete && (
          <div className="mt-1 text-xs text-[var(--ink-subtle)]">
            {isPointsMode
              ? "合計は 0 になる必要があります"
              : diff > 0
                ? `残り ${diff.toLocaleString()} 点`
                : `超過 ${Math.abs(diff).toLocaleString()} 点`}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--negative)] bg-[color-mix(in_srgb,var(--negative)_8%,var(--surface))] px-3 py-2 text-center text-sm text-[var(--negative)]">
          {error}
        </div>
      )}

      {isEditing && onDelete && (
        <div className="mt-4">
          {!showDeleteConfirm ? (
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => setShowDeleteConfirm(true)}
              className="text-[var(--negative)] hover:text-[var(--negative)]"
            >
              この半荘を削除
            </Button>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-[var(--negative)] bg-[color-mix(in_srgb,var(--negative)_6%,var(--surface))] p-3">
              <p className="mb-2 text-center text-sm font-medium text-[var(--ink)]">
                本当に削除しますか？
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" fullWidth onClick={() => setShowDeleteConfirm(false)}>
                  やめる
                </Button>
                <Button variant="danger" size="sm" fullWidth onClick={onDelete}>
                  削除する
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
