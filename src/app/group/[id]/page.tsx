"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  SessionCard,
  type SessionSummary,
} from "@/components/group/SessionCard";
import { SessionDetailModal } from "@/components/group/SessionDetailModal";
import { useAppStore } from "@/store";
import { getGroup, getGroupSessions } from "@/store/selectors";
import { useHydration } from "@/store/useHydration";
import { useSyncGroup } from "@/store/useSyncGroup";
import {
  calculateTotals,
  calculateMoney,
  type RoundData,
} from "@/lib/score";

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

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const hydrated = useHydration();
  useSyncGroup(groupId);

  const groups = useAppStore((s) => s.groups);
  const sessions = useAppStore((s) => s.sessions);
  const deleteSession = useAppStore((s) => s.deleteSession);
  const deleteGroup = useAppStore((s) => s.deleteGroup);
  const renameMember = useAppStore((s) => s.renameMember);

  const group = getGroup(groups, groupId);
  const groupSessions = getGroupSessions(sessions, groupId);

  const [selectedSession, setSelectedSession] =
    useState<SessionSummary | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [renamingMember, setRenamingMember] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState("");

  if (!hydrated) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
        <div className="mb-4 flex items-center justify-between rounded-xl bg-green-900 p-3 text-white">
          <div className="text-lg font-bold">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
        <div className="rounded-xl bg-white p-8 text-center shadow-md">
          <p className="text-gray-500">グループが見つかりません</p>
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

  // Convert store sessions to SessionSummary for display
  const sessionSummaries: SessionSummary[] = groupSessions.map((ses) => {
    const roundDataList: RoundData[] = ses.rounds.map((r) => ({
      scores: r.scores,
      tobi: r.tobi,
    }));
    const totals =
      roundDataList.length > 0
        ? calculateTotals(
            roundDataList,
            ses.settings.returnPoints,
            ses.settings.uma,
            ses.settings.tobiPenalty,
            ses.settings.startPoints
          )
        : ses.members.map(() => 0);
    const money = calculateMoney(totals, ses.settings.rate);

    const results = ses.members
      .map((name, i) => ({
        name,
        score: totals[i],
        money: money[i],
      }))
      .sort((a, b) => b.score - a.score);

    const d = new Date(ses.date);
    const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

    const rateLabel = RATE_LABELS[ses.settings.rate] ?? `${ses.settings.rate}pt`;
    const umaLabel = formatUma(ses.settings.uma);

    return {
      id: ses.id as unknown as number,
      date: dateStr,
      members: ses.members,
      rounds: ses.rounds.length,
      results,
      settings: `${rateLabel} / ${umaLabel}`,
    };
  });

  // メンバー別累計ポイント・半荘回数を集計
  const pointsMap = new Map<string, number>();
  const roundsMap = new Map<string, number>();
  for (const ses of groupSessions) {
    const roundDataList: RoundData[] = ses.rounds.map((r) => ({
      scores: r.scores,
      tobi: r.tobi,
    }));
    if (roundDataList.length === 0) continue;
    const totals = calculateTotals(
      roundDataList,
      ses.settings.returnPoints,
      ses.settings.uma,
      ses.settings.tobiPenalty,
      ses.settings.startPoints
    );
    ses.members.forEach((name, i) => {
      pointsMap.set(name, (pointsMap.get(name) ?? 0) + totals[i]);
      roundsMap.set(name, (roundsMap.get(name) ?? 0) + ses.rounds.length);
    });
  }
  const ranking = [...pointsMap.entries()]
    .map(([name, pts]) => ({ name, pts, rounds: roundsMap.get(name) ?? 0 }))
    .sort((a, b) => b.pts - a.pts);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-green-900 p-3 text-white">
        <div>
          <div className="text-lg font-bold">{group.name}</div>
          <div className="text-xs opacity-80">
            {group.members.length}人のメンバー
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg bg-white/20 px-3 py-2 text-sm hover:bg-red-500/40"
          >
            🗑
          </button>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg bg-white/20 px-4 py-2 text-sm hover:bg-white/30"
          >
            ← 戻る
          </button>
        </div>
      </div>

      {/* グループ削除確認 */}
      {showDeleteConfirm && (
        <div className="mb-4 rounded-xl bg-red-50 p-4 shadow-md">
          <p className="mb-2 text-center text-sm font-bold text-red-600">
            「{group.name}」を削除しますか？
          </p>
          <p className="mb-3 text-center text-xs text-red-500">
            関連するセッションも全て削除されます
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 rounded-lg bg-gray-200 py-2 text-sm text-gray-700"
            >
              やめる
            </button>
            <button
              onClick={() => {
                deleteGroup(groupId);
                router.push("/");
              }}
              className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-bold text-white"
            >
              削除する
            </button>
          </div>
        </div>
      )}

      {/* ランキング */}
      <div className="mb-4 rounded-xl bg-white p-4 shadow-md">
        <h3 className="mb-3 text-sm font-bold text-gray-500">
          ランキング
          <span className="ml-2 text-xs font-normal text-gray-400">
            タップで名前変更
          </span>
        </h3>
        {ranking.length > 0 ? (
          <div className="space-y-1">
            {ranking.map((r, i) => {
              const diff = i === 0 ? 0 : r.pts - ranking[i - 1].pts;
              return (
                <button
                  key={r.name}
                  onClick={() => {
                    setRenamingMember(r.name);
                    setNewMemberName(r.name);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-gray-50 active:bg-gray-100"
                >
                  <span className={`w-6 text-center text-lg font-bold ${
                    i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-gray-300"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-800">
                    {r.name}
                    <span className="ml-1 text-xs text-gray-400">
                      {r.rounds}半荘
                    </span>
                  </span>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${
                      r.pts > 0 ? "text-green-600" : r.pts < 0 ? "text-red-500" : "text-gray-500"
                    }`}>
                      {r.pts > 0 ? "+" : ""}{r.pts.toFixed(1)}
                    </div>
                    {i > 0 && (
                      <div className="text-xs text-gray-400">
                        {diff.toFixed(1)}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            セッションを記録するとランキングが表示されます
          </p>
        )}
      </div>

      {/* メンバー名変更モーダル */}
      {renamingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="mb-4 text-center text-lg font-bold">
              メンバー名の変更
            </h3>
            <p className="mb-2 text-center text-sm text-gray-500">
              「{renamingMember}」→ 新しい名前
            </p>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
              autoFocus
            />
            {newMemberName &&
              newMemberName !== renamingMember &&
              group.members.includes(newMemberName) && (
                <p className="mb-2 text-center text-xs text-amber-600">
                  「{newMemberName}」は既に存在します。統合されます。
                </p>
              )}
            <div className="flex gap-3">
              <button
                onClick={() => setRenamingMember(null)}
                className="flex-1 rounded-lg bg-gray-200 py-3 text-base text-gray-700 hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  if (
                    newMemberName.trim() &&
                    newMemberName !== renamingMember
                  ) {
                    renameMember(groupId, renamingMember, newMemberName.trim());
                    setRenamingMember(null);
                  }
                }}
                disabled={
                  !newMemberName.trim() || newMemberName === renamingMember
                }
                className="flex-1 rounded-lg bg-green-600 py-3 text-base font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
              >
                変更する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* セッションを開始ボタン */}
      <Link
        href={`/session/new?groupId=${group.id}`}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 text-base font-bold text-white shadow-md hover:bg-green-700"
      >
        🎮 セッションを開始
      </Link>

      {/* 過去のセッション一覧 */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
          過去のセッション
        </h2>

        {sessionSummaries.length > 0 ? (
          sessionSummaries.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onClick={() => setSelectedSession(session)}
              onDelete={(id) => deleteSession(String(id))}
            />
          ))
        ) : (
          <div className="rounded-xl bg-white p-8 text-center shadow-md">
            <div className="mb-3 text-4xl">📝</div>
            <p className="text-gray-500">まだセッションがありません</p>
            <p className="mt-1 text-sm text-gray-400">
              最初のセッションを始めましょう
            </p>
          </div>
        )}
      </div>

      {/* セッション詳細モーダル */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
