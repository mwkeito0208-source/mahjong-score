"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchGroup, addMemberToGroup, fetchGroups, fetchSessions, linkMemberUserId, fetchMyGroupIds } from "@/lib/supabase-fetch";
import { useAppStore } from "@/store";
import { useHydration } from "@/store/useHydration";
import { useAuth } from "@/components/AuthProvider";
import type { Group } from "@/lib/types";
import { Card, Button, Input, Badge } from "@/components/ui";

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
      // ignore
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const g = await fetchGroup(groupId);
        if (!g) setError("組が見つかりません");
        else setGroup(g);
      } catch {
        setError("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  const alreadyHasGroup = hydrated && groups.some((g) => g.id === groupId);

  const handleJoin = async () => {
    if (!group || !name.trim()) return;
    const trimmedName = name.trim();

    if (group.members.includes(trimmedName)) {
      if (user?.id) {
        try { await linkMemberUserId(group.id, trimmedName, user.id); } catch {}
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
      const updatedGroup: Group = { ...group, members: [...group.members, trimmedName] };
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
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-sm text-[var(--ink-muted)]">読み込み中…</p>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <Card padding="lg" className="text-center">
          <p className="font-serif-jp text-lg font-bold text-[var(--ink)]">{error}</p>
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            リンクが無効か、組が削除された可能性があります。
          </p>
          <Button variant="primary" size="md" className="mt-4" onClick={() => router.push("/")}>
            席に戻る
          </Button>
        </Card>
      </div>
    );
  }

  if (!group) return null;

  if (joined) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <Card padding="lg" accent="gold" className="text-center">
          <p className="font-serif-jp text-xl font-bold text-[var(--ink)]">参加しました</p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            「{group.name}」へ移動しています…
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-10">
      <Card padding="lg" className="text-center">
        <p className="text-[11px] tracking-[0.3em] text-[var(--ink-subtle)]">INVITATION</p>
        <h1 className="mt-2 font-serif-jp text-2xl font-bold tracking-wider text-[var(--ink)]">
          {group.name}
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">への招待</p>
      </Card>

      <Card padding="md">
        <h3 className="font-serif-jp text-sm font-bold text-[var(--ink)]">現在のメンバー</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {group.members.length > 0 ? (
            group.members.map((m) => (
              <Badge key={m} tone="neutral">{m}</Badge>
            ))
          ) : (
            <span className="text-xs text-[var(--ink-subtle)]">まだメンバーがいません</span>
          )}
        </div>
      </Card>

      {alreadyHasGroup ? (
        <Card padding="lg" accent="gold" className="text-center">
          <p className="font-medium text-[var(--ink)]">既に登録されています</p>
          <Button
            variant="primary"
            size="md"
            className="mt-4"
            onClick={async () => {
              await syncAllData();
              router.push(`/group/${group.id}`);
            }}
          >
            組のページへ →
          </Button>
        </Card>
      ) : (
        <Card padding="md">
          <h3 className="font-serif-jp text-base font-bold text-[var(--ink)]">参加する名前を入力</h3>
          <div className="mt-3">
            <Input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder="名前を入力"
              autoFocus
              error={error ?? undefined}
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="mt-4"
            disabled={!name.trim() || joining}
            onClick={handleJoin}
          >
            {joining ? "参加中…" : "参加する"}
          </Button>
          <p className="mt-3 text-center text-xs text-[var(--ink-subtle)]">
            既に登録されている名前を入力すると、そのまま参加できます
          </p>
        </Card>
      )}
    </div>
  );
}
