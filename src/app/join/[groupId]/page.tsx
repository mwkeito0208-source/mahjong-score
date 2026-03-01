"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchGroup, addMemberToGroup, fetchGroups, fetchSessions, linkMemberUserId, fetchMyGroupIds } from "@/lib/supabase-fetch";
import { useAppStore } from "@/store";
import { useHydration } from "@/store/useHydration";
import { useAuth } from "@/components/AuthProvider";
import type { Group } from "@/lib/types";

export default function JoinGroupPage() {
  const router = useRouter();
  const params = useParams();
  const hydrated = useHydration();
  const groupId = params.groupId as string;

  const { user } = useAuth();
  const importGroup = useAppStore((s) => s.importGroup);
  const mergeRemoteData = useAppStore((s) => s.mergeRemoteData);
  const groups = useAppStore((s) => s.groups);

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  /** Supabaseからユーザーのデータを取得してローカルストアに同期 */
  const syncAllData = async () => {
    if (!user?.id) return;
    try {
      const groupIds = await fetchMyGroupIds(user.id);
      const [remoteGroups, remoteSessions] = await Promise.all([
        fetchGroups(user.id),
        fetchSessions(groupIds),
      ]);
      mergeRemoteData(remoteGroups, remoteSessions);
    } catch {
      // 同期失敗しても呼び出し元の処理は継続
    }
  };

  // グループ情報を取得
  useEffect(() => {
    (async () => {
      try {
        const g = await fetchGroup(groupId);
        if (!g) {
          setError("グループが見つかりません");
        } else {
          setGroup(g);
        }
      } catch {
        setError("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  // 既にローカルにグループがあるかチェック
  const alreadyHasGroup = hydrated && groups.some((g) => g.id === groupId);

  const handleJoin = async () => {
    if (!group || !name.trim()) return;

    const trimmedName = name.trim();

    // 既に同名のメンバーがいるかチェック
    if (group.members.includes(trimmedName)) {
      // 名前が一致 → user_id を紐付けてローカルに取り込み
      if (user?.id) {
        try {
          await linkMemberUserId(group.id, trimmedName, user.id);
        } catch {
          // 紐付け失敗しても参加は継続
        }
      }
      importGroup(group);
      await syncAllData();
      setJoined(true);
      setTimeout(() => router.push(`/group/${group.id}`), 1000);
      return;
    }

    setJoining(true);
    try {
      await addMemberToGroup(group.id, trimmedName, user?.id);

      // ローカルストアに反映
      const updatedGroup: Group = {
        ...group,
        members: [...group.members, trimmedName],
      };
      importGroup(updatedGroup);
      await syncAllData();

      setJoined(true);
      setTimeout(() => router.push(`/group/${group.id}`), 1000);
    } catch {
      setError("参加に失敗しました。もう一度お試しください。");
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
        <div className="flex items-center justify-center py-20 text-gray-500">
          読み込み中...
        </div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
        <div className="rounded-xl bg-white p-8 text-center shadow-md">
          <div className="mb-3 text-4xl">😢</div>
          <p className="mb-2 font-bold text-gray-700">{error}</p>
          <p className="mb-4 text-sm text-gray-500">
            リンクが無効か、グループが削除された可能性があります
          </p>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!group) return null;

  // 参加完了
  if (joined) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
        <div className="rounded-xl bg-white p-8 text-center shadow-md">
          <div className="mb-3 text-4xl">🎉</div>
          <p className="text-lg font-bold text-gray-800">参加しました！</p>
          <p className="mt-1 text-sm text-gray-500">
            「{group.name}」にリダイレクトしています...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
      {/* グループ情報 */}
      <div className="mb-6 rounded-xl bg-white p-6 text-center shadow-md">
        <div className="mb-2 text-4xl">🀄</div>
        <h1 className="mb-1 text-xl font-bold text-gray-800">{group.name}</h1>
        <p className="text-sm text-gray-500">への招待</p>
      </div>

      {/* メンバー一覧 */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-md">
        <h3 className="mb-2 text-sm font-bold text-gray-500">現在のメンバー</h3>
        <div className="flex flex-wrap gap-2">
          {group.members.map((m) => (
            <span
              key={m}
              className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
            >
              {m}
            </span>
          ))}
          {group.members.length === 0 && (
            <span className="text-sm text-gray-400">まだメンバーがいません</span>
          )}
        </div>
      </div>

      {/* 既に参加済み */}
      {alreadyHasGroup ? (
        <div className="rounded-xl bg-green-50 p-6 text-center shadow-md">
          <p className="mb-3 font-bold text-green-700">
            このグループは既に登録されています
          </p>
          <button
            onClick={async () => {
              await syncAllData();
              router.push(`/group/${group.id}`);
            }}
            className="rounded-lg bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
          >
            グループページへ
          </button>
        </div>
      ) : (
        /* 参加フォーム */
        <div className="rounded-xl bg-white p-6 shadow-md">
          <h3 className="mb-3 text-base font-bold text-gray-700">
            参加する名前を入力
          </h3>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="名前を入力"
            className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            autoFocus
          />

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={!name.trim() || joining}
            className={`w-full rounded-lg py-3 text-base font-bold transition-all ${
              name.trim() && !joining
                ? "bg-green-600 text-white hover:bg-green-700"
                : "cursor-not-allowed bg-gray-300 text-gray-500"
            }`}
          >
            {joining ? "参加中..." : "🀄 参加する"}
          </button>

          <p className="mt-3 text-center text-xs text-gray-400">
            既にメンバーに登録されている名前を入力すると、そのまま参加できます
          </p>
        </div>
      )}
    </div>
  );
}
