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
      <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
        <div className="mb-4 flex items-center justify-between rounded-xl bg-green-900 p-3 text-white">
          <div className="text-lg font-bold">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
        <div className="rounded-xl bg-white p-8 text-center shadow-md">
          <p className="text-gray-500">セッションが見つかりません</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-lg bg-green-600 px-6 py-2 text-white"
          >
            ホームに戻る
          </button>
        </div>
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
          settings.startPoints
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
      round.inputMode
    );

    // ポイント入力モード: スコアから順位を算出
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

    // 素点入力モード: 五捨六入した素点から順位を算出
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
  const dateStr = `${sessionDate.getMonth() + 1}/${sessionDate.getDate()}`;
  const title = group ? `${dateStr} ${group.name}` : `${dateStr} セッション`;
  const rateLabel = RATE_LABELS[settings.rate] ?? `${settings.rate}pt`;
  const umaLabel = formatUma(settings.uma);
  const subtitle = `${rateLabel} / ${umaLabel} / ${settings.startPoints * 1000}持ち`;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-green-900 p-3 text-white">
        <div>
          <div className="text-lg font-bold">{title}</div>
          <div className="text-xs opacity-80">{subtitle}</div>
        </div>
        <button
          onClick={() => router.push(group ? `/group/${group.id}` : "/")}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          終了
        </button>
      </div>

      {/* 他ユーザーによる変更通知 */}
      {hasRemoteChange && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800 shadow">
          <span>他の端末で変更がありました。ページを再読み込みしてください。</span>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-yellow-600 px-3 py-1 text-xs font-bold text-white"
            >
              再読み込み
            </button>
            <button
              onClick={dismissRemoteChange}
              className="text-xs text-yellow-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* スコアテーブル */}
      <ScoreTable
        members={session.members}
        rounds={roundScoresPerRound}
        totals={totals}
        money={money}
        onRoundTap={(i) => setEditingRoundIndex(i)}
      />

      {/* ボタンエリア */}
      <div className="mt-5 flex flex-col gap-3">
        <button
          onClick={() => setShowInputModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-900 py-4 text-base font-bold text-white hover:bg-green-800"
        >
          <span className="text-xl">+</span> 半荘を追加
        </button>

        <Link
          href={`/session/${params.id}/settlement`}
          className="block w-full rounded-xl bg-orange-500 py-4 text-center text-base font-bold text-white hover:bg-orange-600"
        >
          💰 精算を見る
        </Link>

        {!showRestartConfirm ? (
          <button
            onClick={() => {
              if (session.rounds.length === 0) {
                deleteSession(session.id);
                router.push(`/session/new?groupId=${session.groupId}`);
              } else {
                setShowRestartConfirm(true);
              }
            }}
            className="w-full rounded-xl border border-gray-300 bg-white py-3 text-sm text-gray-500 hover:bg-gray-50"
          >
            🔄 メンバーを変更して作り直す
          </button>
        ) : (
          <div className="rounded-xl bg-red-50 p-4">
            <p className="mb-2 text-center text-sm font-bold text-red-600">
              {session.rounds.length}半荘分のデータが削除されます
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="flex-1 rounded-lg bg-gray-200 py-2 text-sm text-gray-700"
              >
                やめる
              </button>
              <button
                onClick={() => {
                  deleteSession(session.id);
                  router.push(`/session/new?groupId=${session.groupId}`);
                }}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-bold text-white"
              >
                作り直す
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 新規入力モーダル */}
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

      {/* 編集モーダル */}
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
