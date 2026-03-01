"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { GroupCard } from "@/components/GroupCard";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { InviteLinkModal } from "@/components/InviteLinkModal";
import { NameRegistrationModal } from "@/components/NameRegistrationModal";
import { useAppStore } from "@/store";
import { getGroupSummary } from "@/store/selectors";
import { useHydration } from "@/store/useHydration";
import { useSyncFromSupabase } from "@/store/useSyncFromSupabase";
import { useAuth } from "@/components/AuthProvider";
import { fetchMyGroupIds, linkMemberUserId, fetchGroups, fetchSessions } from "@/lib/supabase-fetch";
import type { Group } from "@/lib/types";

/** ローカルグループから全メンバー名を重複排除で収集 */
function collectMemberNames(groups: Group[]): string[] {
  const names = new Set<string>();
  for (const g of groups) {
    for (const m of g.members) names.add(m);
  }
  return [...names].sort();
}

export default function Home() {
  const hydrated = useHydration();
  const synced = useSyncFromSupabase();
  const { user } = useAuth();
  const groups = useAppStore((s) => s.groups);
  const sessions = useAppStore((s) => s.sessions);
  const addGroup = useAppStore((s) => s.addGroup);
  const mergeRemoteData = useAppStore((s) => s.mergeRemoteData);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showNameRegistration, setShowNameRegistration] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);

  // 移行チェック: ローカルにグループがあるが user_id が未紐付けの場合
  useEffect(() => {
    if (!hydrated || !synced || !user || migrationChecked) return;

    (async () => {
      try {
        const myGroupIds = await fetchMyGroupIds(user.id);
        // ローカルにグループがあるのにリンク済みがゼロ → 移行が必要
        if (groups.length > 0 && myGroupIds.length === 0) {
          setShowNameRegistration(true);
        }
      } catch {
        // チェック失敗しても通常動作
      } finally {
        setMigrationChecked(true);
      }
    })();
  }, [hydrated, synced, user, groups.length, migrationChecked]);

  // 名前選択後の移行処理
  const handleNameRegistration = useCallback(
    async (name: string) => {
      if (!user) return;

      // 全ローカルグループの該当メンバーに user_id を紐付け
      for (const group of groups) {
        if (group.members.includes(name)) {
          try {
            await linkMemberUserId(group.id, name, user.id);
          } catch {
            // 個別失敗は無視
          }
        }
      }

      // 紐付け後にデータを再取得
      try {
        const groupIds = await fetchMyGroupIds(user.id);
        const [remoteGroups, remoteSessions] = await Promise.all([
          fetchGroups(user.id),
          fetchSessions(groupIds),
        ]);
        mergeRemoteData(remoteGroups, remoteSessions);
      } catch {
        // 再取得失敗しても閉じる
      }

      setShowNameRegistration(false);
    },
    [user, groups, mergeRemoteData]
  );

  const handleCreateGroup = (name: string) => {
    const newGroup = addGroup(name, undefined, user?.id);
    setShowCreateGroup(false);
    setSelectedGroup(newGroup);
    setShowInviteLink(true);
  };

  const handleShowInvite = (group: Group) => {
    setSelectedGroup(group);
    setShowInviteLink(true);
  };

  if (!hydrated) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
        <div className="mb-6 pt-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            🀄 麻雀スコア
          </h1>
          <p className="mt-1 text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
      {/* ヘッダー */}
      <div className="mb-6 pt-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
          🀄 麻雀スコア
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          グループを選択して始めましょう
        </p>
      </div>

      {/* 新規グループ作成ボタン */}
      <button
        onClick={() => setShowCreateGroup(true)}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 text-base font-bold text-white shadow-md hover:bg-green-700"
      >
        <span className="text-xl">+</span> 新しいグループを作成
      </button>

      {/* グループ一覧 */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
          グループ一覧
        </h2>

        {groups.length > 0 ? (
          groups.map((group) => {
            const summary = getGroupSummary(group, sessions);
            return (
              <GroupCard
                key={group.id}
                group={group}
                lastPlayed={summary.lastPlayed}
                totalSessions={summary.totalSessions}
                onInvite={handleShowInvite}
              />
            );
          })
        ) : (
          <div className="rounded-xl bg-white p-8 text-center shadow-md">
            <div className="mb-3 text-4xl">🀄</div>
            <p className="text-gray-500">グループがありません</p>
            <p className="mt-1 text-sm text-gray-400">
              新しいグループを作成しましょう
            </p>
          </div>
        )}
      </div>

      {/* 全体統計ボタン */}
      <div className="mt-6">
        <Link
          href="/stats"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 text-base font-bold text-gray-700 shadow-md hover:bg-gray-50"
        >
          📊 統計を見る
        </Link>
      </div>

      {/* 招待リンクから参加 */}
      <div className="mt-6 rounded-xl bg-white p-4 shadow-md">
        <h3 className="mb-2 text-sm font-bold text-gray-700">
          招待リンクをもらった？
        </h3>
        <p className="mb-3 text-sm text-gray-500">
          友達から共有されたリンクをタップすると、自動的にグループに参加できます。
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
          <span className="text-gray-400">🔗</span>
          <span className="text-sm text-gray-500">
            {typeof window !== "undefined" ? window.location.origin : ""}/join/...
          </span>
        </div>
      </div>

      {/* データリセット */}
      <div className="mt-8 mb-4 text-center">
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-sm text-gray-400 underline hover:text-red-500"
          >
            ローカルデータをリセット
          </button>
        ) : (
          <div className="rounded-xl bg-red-50 p-4">
            <p className="mb-3 text-sm font-bold text-red-600">
              ローカルデータをすべて削除しますか？
            </p>
            <p className="mb-4 text-xs text-red-500">
              この操作は元に戻せません
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("mahjong-score-storage");
                  window.location.reload();
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                削除する
              </button>
            </div>
          </div>
        )}
      </div>

      {/* モーダル */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {showInviteLink && selectedGroup && (
        <InviteLinkModal
          group={selectedGroup}
          onClose={() => {
            setShowInviteLink(false);
            setSelectedGroup(null);
          }}
        />
      )}

      {showNameRegistration && (
        <NameRegistrationModal
          memberNames={collectMemberNames(groups)}
          onSelect={handleNameRegistration}
        />
      )}
    </div>
  );
}
