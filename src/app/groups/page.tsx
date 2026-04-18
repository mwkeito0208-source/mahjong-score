"use client";

import { useState } from "react";
import { GroupCardNew } from "@/components/GroupCardNew";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { InviteLinkModal } from "@/components/InviteLinkModal";
import { useAppStore } from "@/store";
import { getGroupSummary } from "@/store/selectors";
import { useHydration } from "@/store/useHydration";
import { useAuth } from "@/components/AuthProvider";
import type { Group } from "@/lib/types";
import { Button, Card } from "@/components/ui";

export default function GroupsPage() {
  const hydrated = useHydration();
  const { user } = useAuth();
  const groups = useAppStore((s) => s.groups);
  const sessions = useAppStore((s) => s.sessions);
  const addGroup = useAppStore((s) => s.addGroup);
  const deleteGroup = useAppStore((s) => s.deleteGroup);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const handleCreateGroup = (name: string, members?: string[]) => {
    const newGroup = addGroup(name, members, user?.id);
    setShowCreateGroup(false);
    setSelectedGroup(newGroup);
    setShowInviteLink(true);
  };

  const handleShowInvite = (group: Group) => {
    setSelectedGroup(group);
    setShowInviteLink(true);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-[var(--ink-subtle)]">GROUPS</p>
          <h1 className="mt-1 font-serif-jp text-3xl font-bold tracking-wider text-[var(--ink)]">
            組
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            麻雀仲間の集まり。組ごとに番付が残ります。
          </p>
        </div>
        {hydrated && groups.length > 0 && (
          <Button variant="primary" size="md" onClick={() => setShowCreateGroup(true)}>
            ＋ 新しい組
          </Button>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {!hydrated ? (
          <p className="text-sm text-[var(--ink-muted)]">読み込み中…</p>
        ) : groups.length > 0 ? (
          groups.map((group) => {
            const summary = getGroupSummary(group, sessions);
            return (
              <GroupCardNew
                key={group.id}
                group={group}
                lastPlayed={summary.lastPlayed}
                totalSessions={summary.totalSessions}
                onInvite={handleShowInvite}
                onDelete={(g) => deleteGroup(g.id)}
              />
            );
          })
        ) : (
          <Card padding="lg" accent="gold" className="text-center">
            <div className="mb-2 font-serif-jp text-3xl text-[var(--ink-subtle)]">🀄</div>
            <p className="text-sm font-medium text-[var(--ink)]">まだ組がありません</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              いつもの仲間を組にして、番付を残していこう。
            </p>
            <Button
              variant="primary"
              size="md"
              className="mt-4"
              onClick={() => setShowCreateGroup(true)}
            >
              最初の組を作る
            </Button>
          </Card>
        )}
      </div>

      {/* 招待リンクで参加の案内 */}
      <Card padding="md" className="mt-8">
        <h3 className="font-serif-jp text-base font-bold text-[var(--ink)]">招待リンクをもらった？</h3>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          友達から共有されたリンクを開くと、自動的に組に参加できます。
        </p>
      </Card>

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
    </div>
  );
}
