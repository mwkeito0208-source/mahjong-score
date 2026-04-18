"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ScoreTable } from "@/components/score/ScoreTable";
import { AddRoundModal } from "@/components/score/AddRoundModal";
import {
  roundScore,
  getRanks,
  calculateRoundScores,
  calculateTotals,
  calculateMoney,
  type TobiInfo,
  type RoundData,
} from "@/lib/score";
import { useAppStore } from "@/store";
import { getSession, getGroup } from "@/store/selectors";
import { useHydration } from "@/store/useHydration";
import { useSyncFromSupabase } from "@/store/useSyncFromSupabase";
import { useSessionRealtime } from "@/store/useSessionRealtime";
import { Button, Card, Modal } from "@/components/ui";

const RATE_LABELS: Record<number, string> = {
  0: "ノーレート",
  50: "テンゴ",
  100: "テンピン",
  200: "点2",
  500: "点5",
};

function formatUma(uma: number[]): string {
  if (uma.every((v) => v === 0)) return "ナシ";
  return `${Math.abs(uma[1])}-${Math.abs(uma[0])}`;
}

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const hydrated = useHydration();
  const synced = useSyncFromSupabase();
  const sessionId = params.id as string;

  const sessions = useAppStore((s) => s.sessions);
  const groups = useAppStore((s) => s.groups);
  const addRound = useAppStore((s) => s.addRound);
  const updateRound = useAppStore((s) => s.updateRound);
  const deleteRound = useAppStore((s) => s.deleteRound);

  const session = getSession(sessions, sessionId);
  const group = session ? getGroup(groups, session.groupId) : undefined;
  const { hasRemoteChange, dismiss: dismissRemoteChange } = useSessionRealtime(sessionId);

  const [showInputModal, setShowInputModal] = useState(false);
  const [editingRoundIndex, setEditingRoundIndex] = useState<number | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const deleteSession = useAppStore((s) => s.deleteSession);

  if (!hydrated || (!session && !synced)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm text-[var(--ink-muted)]">読み込み中…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card padding="lg" className="text-center">
          <p className="text-[var(--ink-muted)]">対局が見つかりません</p>
          <Button variant="primary" size="md" className="mt-4" onClick={() => router.push("/")}>
            席に戻る
          </Button>
        </Card>
      </div>
    );
  }

  const { settings } = session;
  const roundDataList: RoundData[] = session.rounds.map((r) => ({
    scores: r.scores,
    tobi: r.tobi,
    inputMode: r.inputMode,
  }));
  const totals =
    roundDataList.length > 0
      ? calculateTotals(
          roundDataList,
          settings.returnPoints,
          settings.uma,
          settings.tobiPenalty,
          settings.startPoints,
        )
      : session.members.map(() => 0);
  const money = calculateMoney(totals, settings.rate);

  const roundScoresPerRound = session.rounds.map((round) => {
    const finalScores = calculateRoundScores(
      round.scores,
      settings.returnPoints,
      settings.uma,
      settings.tobiPenalty,
      round.tobi,
      settings.startPoints,
      round.inputMode,
    );

    if (round.inputMode === "points") {
      const activeScores = round.scores.filter((s): s is number => s !== null);
      const activeRanks = getRanks(activeScores);
      let activeIdx = 0;
      const ranks = round.scores.map((s) => {
        if (s === null) return null;
        return activeRanks[activeIdx++];
      });
      return {
        id: round.id,
        scores: finalScores.map((s, i) => (round.scores[i] === null ? null : s)),
        ranks,
        tobi: round.tobi,
      };
    }

    const rounded = round.scores.map((s) => (s !== null ? roundScore(s) : null));
    const activeRounded = rounded.filter((s): s is number => s !== null);
    const activeRanks = getRanks(activeRounded);
    let activeIdx = 0;
    const ranks = rounded.map((s) => {
      if (s === null) return null;
      return activeRanks[activeIdx++];
    });

    return {
      id: round.id,
      scores: finalScores.map((s, i) => (round.scores[i] === null ? null : s)),
      ranks,
      tobi: round.tobi,
    };
  });

  const handleAddRound = (rawScores: (number | null)[], tobi?: TobiInfo[], inputMode?: "raw" | "points") => {
    addRound(session.id, rawScores, tobi, inputMode);
    setShowInputModal(false);
  };

  const handleEditRound = (rawScores: (number | null)[], tobi?: TobiInfo[], inputMode?: "raw" | "points") => {
    if (editingRoundIndex === null) return;
    const round = session.rounds[editingRoundIndex];
    updateRound(session.id, round.id, rawScores, tobi, inputMode);
    setEditingRoundIndex(null);
  };

  const handleDeleteRound = () => {
    if (editingRoundIndex === null) return;
    const round = session.rounds[editingRoundIndex];
    deleteRound(session.id, round.id);
    setEditingRoundIndex(null);
  };

  const sessionDate = new Date(session.date);
  const dateStr = `${sessionDate.getMonth() + 1}月${sessionDate.getDate()}日`;
  const rateLabel = RATE_LABELS[settings.rate] ?? `${settings.rate}pt`;
  const umaLabel = formatUma(settings.uma);
  const subtitle = `${rateLabel}・ウマ${umaLabel}・${(settings.startPoints * 1000).toLocaleString()}持ち`;

  return (
    <div className="min-h-dvh pb-44">
      {/* 集中モード用ヘッダー */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <button
            onClick={() => router.push(group ? `/group/${group.id}` : "/")}
            className="inline-flex items-center gap-1 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            ← 戻る
          </button>
          <div className="min-w-0 text-center">
            <div className="font-serif-jp text-sm font-bold tracking-widest text-[var(--ink)] truncate">
              {dateStr}・{group?.name ?? "対局"}
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--ink-subtle)] truncate">{subtitle}</div>
          </div>
          <div className="w-14 text-right">
            <button
              onClick={() => router.push(group ? `/group/${group.id}` : "/")}
              className="text-xs text-[var(--ink-muted)] hover:text-[var(--accent)]"
            >
              終了
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        {hasRemoteChange && (
          <Card padding="sm" accent="shu" className="flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--ink)]">他の端末で変更がありました</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                再読み込み
              </Button>
              <button
                onClick={dismissRemoteChange}
                className="text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>
          </Card>
        )}

        <ScoreTable
          members={session.members}
          rounds={roundScoresPerRound}
          totals={totals}
          money={money}
          onRoundTap={(i) => setEditingRoundIndex(i)}
        />

        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--line-strong)] bg-transparent px-3 py-2 text-center text-xs text-[var(--ink-subtle)]">
          半荘のセルをタップすると修正できます
        </div>
      </main>

      {/* 固定フッター：主要操作 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_95%,transparent)] backdrop-blur pb-safe">
        <div className="mx-auto max-w-2xl space-y-2 px-4 py-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setShowInputModal(true)}
          >
            ＋ 半荘を追加
          </Button>
          <div className="flex gap-2">
            <Link
              href={`/session/${params.id}/settlement`}
              className="flex-1 rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] py-2.5 text-center text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-2)]"
            >
              精算を見る →
            </Link>
            <button
              onClick={() => {
                if (session.rounds.length === 0) {
                  deleteSession(session.id);
                  router.push(`/session/new?groupId=${session.groupId}`);
                } else {
                  setShowRestartConfirm(true);
                }
              }}
              className="flex-1 rounded-[var(--radius-md)] border border-[var(--line)] bg-transparent py-2.5 text-center text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              作り直す
            </button>
          </div>
        </div>
      </div>

      {/* 作り直す確認 */}
      <Modal
        open={showRestartConfirm}
        onClose={() => setShowRestartConfirm(false)}
        title="対局を作り直しますか？"
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="md" fullWidth onClick={() => setShowRestartConfirm(false)}>
              やめる
            </Button>
            <Button
              variant="danger"
              size="md"
              fullWidth
              onClick={() => {
                deleteSession(session.id);
                router.push(`/session/new?groupId=${session.groupId}`);
              }}
            >
              作り直す
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--ink)]">
          記録した <span className="font-bold">{session.rounds.length}半荘分</span> のデータが削除されます。
        </p>
        <p className="mt-2 text-xs text-[var(--ink-muted)]">
          メンバー・ルールを変更して新しい対局を始めたいときに使います。
        </p>
      </Modal>

      {/* 新規入力 */}
      {showInputModal && (
        <AddRoundModal
          members={session.members}
          roundNumber={session.rounds.length + 1}
          onSave={handleAddRound}
          onClose={() => setShowInputModal(false)}
          lastSitOutIndex={(() => {
            if (session.members.length !== 5 || session.rounds.length === 0) return null;
            const idx = session.rounds[session.rounds.length - 1].scores.findIndex((s) => s === null);
            return idx >= 0 ? idx : null;
          })()}
          startPoints={settings.startPoints}
        />
      )}

      {/* 編集 */}
      {editingRoundIndex !== null && session.rounds[editingRoundIndex] && (
        <AddRoundModal
          key={`edit-${session.rounds[editingRoundIndex].id}`}
          members={session.members}
          roundNumber={editingRoundIndex + 1}
          initialScores={session.rounds[editingRoundIndex].scores}
          initialTobi={session.rounds[editingRoundIndex].tobi}
          initialInputMode={session.rounds[editingRoundIndex].inputMode}
          onSave={handleEditRound}
          onClose={() => setEditingRoundIndex(null)}
          onDelete={handleDeleteRound}
          startPoints={settings.startPoints}
        />
      )}
    </div>
  );
}
