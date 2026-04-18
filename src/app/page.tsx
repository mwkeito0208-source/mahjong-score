"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NameRegistrationModal } from "@/components/NameRegistrationModal";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { useAppStore } from "@/store";
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
import type { Group, Session } from "@/lib/types";
import { Card, CardTitle, CardSubtle, Badge, LinkButton, Button } from "@/components/ui";

let migrationDone = false;

function collectMemberNames(groups: Group[]): string[] {
  const names = new Set<string>();
  for (const g of groups) for (const m of g.members) names.add(m);
  return [...names].sort();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function Home() {
  const hydrated = useHydration();
  const synced = useSyncFromSupabase();
  const { user } = useAuth();
  const router = useRouter();
  const groups = useAppStore((s) => s.groups);
  const sessions = useAppStore((s) => s.sessions);
  const addGroup = useAppStore((s) => s.addGroup);
  const mergeRemoteData = useAppStore((s) => s.mergeRemoteData);

  const [showNameRegistration, setShowNameRegistration] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const handleCreateAndStart = (name: string, members?: string[]) => {
    const newGroup = addGroup(name, members, user?.id);
    setShowCreateGroup(false);
    router.push(`/session/new?groupId=${newGroup.id}`);
  };

  const active = useMemo(
    () => sessions.filter((s) => s.status === "active")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [sessions],
  );

  const recentSettled = useMemo(
    () => sessions
      .filter((s) => s.status === "settled")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3),
    [sessions],
  );

  const recentGroups = useMemo(() => {
    const lastPlayedByGroup = new Map<string, number>();
    for (const s of sessions) {
      const t = new Date(s.date).getTime();
      const prev = lastPlayedByGroup.get(s.groupId) ?? 0;
      if (t > prev) lastPlayedByGroup.set(s.groupId, t);
    }
    return [...groups]
      .sort((a, b) => {
        const ta = lastPlayedByGroup.get(a.id) ?? new Date(a.createdAt).getTime();
        const tb = lastPlayedByGroup.get(b.id) ?? new Date(b.createdAt).getTime();
        return tb - ta;
      })
      .slice(0, 4);
  }, [groups, sessions]);

  // 移行チェック（既存ロジックを維持）
  useEffect(() => {
    if (!hydrated || !synced || !user || migrationDone) return;
    (async () => {
      try {
        const myGroupIds = await fetchMyGroupIds(user.id);
        if (groups.length > 0 && myGroupIds.length === 0) {
          for (const group of groups) await syncAddGroup(group);
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
        // ignore
      } finally {
        migrationDone = true;
      }
    })();
  }, [hydrated, synced, user, groups, sessions]);

  const handleNameRegistration = useCallback(
    async (name: string) => {
      if (!user) return;
      for (const group of groups) {
        if (group.members.includes(name)) {
          try { await linkMemberUserId(group.id, name, user.id); } catch {}
        }
      }
      try {
        const groupIds = await fetchMyGroupIds(user.id);
        const [remoteGroups, remoteSessions] = await Promise.all([
          fetchGroups(user.id),
          fetchSessions(groupIds),
        ]);
        mergeRemoteData(remoteGroups, remoteSessions);
      } catch {}
      setShowNameRegistration(false);
    },
    [user, groups, mergeRemoteData],
  );

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Hero />
        <p className="mt-6 text-sm text-[var(--ink-muted)]">読み込み中…</p>
      </div>
    );
  }

  const hasAnything = groups.length > 0 || sessions.length > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:py-10">
      <Hero />

      {/* 続きの卓 */}
      {active.length > 0 && (
        <section className="mt-8">
          <SectionHeader title="続きの卓" sub="未清算のセッション" />
          <div className="mt-3 space-y-3">
            {active.map((s) => (
              <ActiveSessionCard key={s.id} session={s} groups={groups} />
            ))}
          </div>
        </section>
      )}

      {/* 卓を囲む（クイック）— 組が1つ以上ある場合のみ表示 */}
      {recentGroups.length > 0 && (
        <section className="mt-8">
          <SectionHeader title="卓を囲む" sub="どの組で始める?" />

          {/* ─ 新しい組で ─ */}
          <div className="mt-4">
            <h3 className="mb-2 text-[11px] font-medium tracking-[0.25em] text-[var(--ink-subtle)]">
              新しい組で
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateGroup(true)}
              className="flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--accent)] bg-[var(--surface)] p-4 text-left transition-colors hover:bg-[var(--surface-2)]"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-ink)]" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-serif-jp text-base font-bold text-[var(--ink)]">
                  新しい組を作って始める
                </div>
                <div className="text-xs text-[var(--ink-muted)]">
                  メンバーを登録すると、そのまま半荘設定へ進みます
                </div>
              </div>
              <span aria-hidden className="text-[var(--ink-subtle)]">→</span>
            </button>
          </div>

          {/* ─ 既存の組から ─ */}
          <div className="mt-6">
            <div className="mb-2 flex items-end justify-between">
              <h3 className="text-[11px] font-medium tracking-[0.25em] text-[var(--ink-subtle)]">
                既存の組から
              </h3>
              <Link href="/groups" className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]">
                すべて見る →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {recentGroups.map((g) => (
                <Link
                  key={g.id}
                  href={`/session/new?groupId=${g.id}`}
                  className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--ink-subtle)]"
                >
                  <span className="font-serif-jp text-base font-bold text-[var(--ink)]">{g.name}</span>
                  <span className="mt-0.5 text-xs text-[var(--ink-muted)] line-clamp-1">
                    {g.members.slice(0, 3).join("・") || "メンバーなし"}
                    {g.members.length > 3 ? ` 他${g.members.length - 3}` : ""}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 直近の戦績 */}
      {recentSettled.length > 0 && (
        <section className="mt-8">
          <SectionHeader
            title="直近の記録"
            sub="清算済みセッション"
            action={<Link href="/stats" className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]">戦績を見る →</Link>}
          />
          <div className="mt-3 space-y-2">
            {recentSettled.map((s) => {
              const g = groups.find((x) => x.id === s.groupId);
              return (
                <Link
                  key={s.id}
                  href={`/group/${s.groupId}`}
                  className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--surface-2)]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-serif-jp text-sm font-bold text-[var(--ink)]">
                        {g?.name ?? "—"}
                      </span>
                      <Badge tone="neutral" size="sm">{s.rounds.length}半荘</Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--ink-subtle)]">
                      {formatDate(s.date)}
                    </div>
                  </div>
                  <span className="text-[var(--ink-subtle)]">→</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {!hasAnything && (
        <section className="mt-8">
          <Card padding="lg" accent="gold" className="text-center">
            <CardTitle serif className="text-lg">ようこそ</CardTitle>
            <CardSubtle className="mt-2">
              組（仲間）を作って、半荘を囲もう。記録はそのまま番付になります。
            </CardSubtle>
            <div className="mt-5 flex justify-center">
              <Button variant="primary" size="lg" onClick={() => setShowCreateGroup(true)}>
                最初の組を作って始める
              </Button>
            </div>
          </Card>
        </section>
      )}

      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreate={handleCreateAndStart}
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

function Hero() {
  return (
    <div>
      <h1 className="font-serif-jp text-3xl font-bold tracking-wider text-[var(--ink)]">
        本日の席
      </h1>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        続きの卓、組の選択、直近の番付。
      </p>
    </div>
  );
}

function SectionHeader({
  title,
  sub,
  action,
}: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h2 className="font-serif-jp text-xl font-bold tracking-wider text-[var(--ink)]">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-[var(--ink-subtle)]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function ActiveSessionCard({ session, groups }: { session: Session; groups: Group[] }) {
  const g = groups.find((x) => x.id === session.groupId);
  return (
    <Card accent="shu" padding="md" className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-serif-jp text-base font-bold text-[var(--ink)]">
            {g?.name ?? "—"}
          </span>
          <Badge tone="accent" size="sm">対局中</Badge>
          <Badge tone="neutral" size="sm">{session.rounds.length}半荘</Badge>
        </div>
        <div className="mt-0.5 text-xs text-[var(--ink-muted)]">
          {formatDate(session.date)} {formatTime(session.date)}・{session.members.join("、")}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <LinkButton href={`/session/${session.id}/score`} variant="primary" size="sm">
          続ける
        </LinkButton>
      </div>
    </Card>
  );
}
