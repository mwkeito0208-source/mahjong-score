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
import {
  syncAddGroup,
  syncCreateSession,
  syncAddRound,
  syncAddExpense,
} from "@/lib/supabase-sync";
import type { Group } from "@/lib/types";

/** ページ遷移で再マウントされてもリセットされないようモジュールレベルで保持 */
let migrationDone = false;

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
  const { user, isAnonymous, linkGoogle, signOut } = useAuth();
  const groups = useAppStore((s) => s.groups);
  const sessions = useAppStore((s) => s.sessions);
  const addGroup = useAppStore((s) => s.addGroup);
  const deleteGroup = useAppStore((s) => s.deleteGroup);
  const mergeRemoteData = useAppStore((s) => s.mergeRemoteData);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showNameRegistration, setShowNameRegistration] = useState(false);
  const [showLoginBanner, setShowLoginBanner] = useState(false);

  // 匿名ユーザーにログインバナーを表示（dismissしたら7日間非表示）
  useEffect(() => {
    if (!isAnonymous) return;
    const dismissed = localStorage.getItem("login-banner-dismissed");
    if (dismissed && Date.now() < Number(dismissed)) return;
    setShowLoginBanner(true);
  }, [isAnonymous]);

  const dismissLoginBanner = () => {
    setShowLoginBanner(false);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem("login-banner-dismissed", String(Date.now() + sevenDays));
  };

  // 移行チェック: ローカルにグループがあるが user_id が未紐付けの場合
  useEffect(() => {
    if (!hydrated || !synced || !user || migrationDone) return;

    (async () => {
      try {
        const myGroupIds = await fetchMyGroupIds(user.id);
        // ローカルにグループがあるのにリンク済みがゼロ → 移行が必要
        if (groups.length > 0 && myGroupIds.length === 0) {
          // まずローカルデータをSupabaseにプッシュ（テーブルが空の場合に対応）
          for (const group of groups) {
            await syncAddGroup(group);
          }
          for (const session of sessions) {
            await syncCreateSession(session);
            for (let i = 0; i < session.rounds.length; i++) {
              await syncAddRound(session.id, session.rounds[i], i + 1);
            }
            for (const expense of session.expenses) {
              await syncAddExpense(session.id, expense);
            }
          }
          setShowNameRegistration(true);
        }
      } catch {
        // チェック失敗しても通常動作
      } finally {
        migrationDone = true;
      }
    })();
  }, [hydrated, synced, user, groups, sessions]);

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
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            🀄 麻雀スコア
          </h1>
          {isAnonymous ? (
            <button
              onClick={linkGoogle}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow hover:bg-gray-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              ログイン
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {user?.email ?? ""}
              </span>
              <button
                onClick={signOut}
                className="rounded-lg bg-gray-200 px-2.5 py-1 text-xs font-bold text-gray-500 hover:bg-gray-300"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          グループを選択して始めましょう
        </p>
      </div>

      {/* ログイン促進バナー */}
      {showLoginBanner && isAnonymous && (
        <div className="mb-4 rounded-xl bg-blue-50 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-800">
                Googleアカウントを連携しませんか？
              </p>
              <p className="mt-1 text-xs text-blue-600">
                ログインすると、ブラウザを閉じてもデータが失われません。
              </p>
            </div>
            <button
              onClick={dismissLoginBanner}
              className="ml-2 text-blue-400 hover:text-blue-600"
              aria-label="閉じる"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button
            onClick={linkGoogle}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Googleでログイン
          </button>
        </div>
      )}

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
                onDelete={(group) => deleteGroup(group.id)}
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
