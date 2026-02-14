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
  const hydrated = useHydration();
  const groupId = params.id as string;

  const groups = useAppStore((s) => s.groups);
  const sessions = useAppStore((s) => s.sessions);
  const deleteSession = useAppStore((s) => s.deleteSession);

  const group = getGroup(groups, groupId);
  const groupSessions = getGroupSessions(sessions, groupId);

  const [selectedSession, setSelectedSession] =
    useState<SessionSummary | null>(null);

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
      .sort((a, b) => b.money - a.money);

    const d = new Date(ses.date);
    const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

    const rateLabel = RATE_LABELS[ses.settings.rate] ?? `${ses.settings.rate}円`;
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
        <button
          onClick={() => router.push("/")}
          className="rounded-lg bg-white/20 px-4 py-2 text-sm hover:bg-white/30"
        >
          ← 戻る
        </button>
      </div>

      {/* メンバー一覧 */}
      <div className="mb-4 rounded-xl bg-white p-4 shadow-md">
        <h3 className="mb-2 text-sm font-bold text-gray-500">メンバー</h3>
        <div className="flex flex-wrap gap-2">
          {group.members.map((name) => (
            <span
              key={name}
              className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
            >
              {name}
            </span>
          ))}
          {group.members.length === 0 && (
            <span className="text-sm text-gray-400">
              セッション開始時にメンバーが追加されます
            </span>
          )}
        </div>
      </div>

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
