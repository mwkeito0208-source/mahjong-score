"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Group } from "@/lib/types";
import { Card, Badge, Button } from "@/components/ui";

type Props = {
  group: Group;
  lastPlayed: string;
  totalSessions: number;
  onInvite: (group: Group) => void;
  onDelete: (group: Group) => void;
};

export function GroupCardNew({ group, lastPlayed, totalSessions, onInvite, onDelete }: Props) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const memberText =
    group.members.length > 0
      ? group.members.slice(0, 3).join("・") +
        (group.members.length > 3 ? ` 他${group.members.length - 3}` : "")
      : "メンバーなし";

  return (
    <Card
      padding="none"
      className="overflow-hidden transition-colors hover:border-[var(--ink-subtle)]"
    >
      <div
        className="cursor-pointer p-4"
        onClick={() => !showDeleteConfirm && router.push(`/group/${group.id}`)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif-jp text-lg font-bold tracking-wide text-[var(--ink)]">
              {group.name}
            </h3>
            <p className="mt-0.5 text-sm text-[var(--ink-muted)] line-clamp-1">{memberText}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onInvite(group); }}
              className="rounded-[var(--radius-sm)] p-1.5 text-[var(--ink-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
              aria-label="招待リンク"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" d="M10 14a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 6M14 10a5 5 0 0 0-7.07 0L4.1 12.83a5 5 0 0 0 7.07 7.07L13 18" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              className="rounded-[var(--radius-sm)] p-1.5 text-[var(--ink-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--negative)]"
              aria-label="削除"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
              </svg>
            </button>
          </div>
        </div>

        {!showDeleteConfirm && (
          <div className="mt-2 flex items-center gap-3 text-xs text-[var(--ink-subtle)]">
            <span>最終: {lastPlayed}</span>
            <span>・</span>
            <Badge tone="neutral" size="sm">{totalSessions}回</Badge>
          </div>
        )}
      </div>

      {showDeleteConfirm ? (
        <div className="border-t border-[var(--line)] bg-[var(--surface-2)] p-4" onClick={(e) => e.stopPropagation()}>
          <p className="mb-1 text-center text-sm font-bold text-[var(--ink)]">
            「{group.name}」を削除しますか？
          </p>
          <p className="mb-3 text-center text-xs text-[var(--ink-muted)]">
            関連するセッションも全て削除されます
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" fullWidth onClick={() => setShowDeleteConfirm(false)}>
              やめる
            </Button>
            <Button variant="danger" size="sm" fullWidth onClick={() => onDelete(group)}>
              削除する
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-[var(--line)]">
          <Link
            href={`/session/new?groupId=${group.id}`}
            className="block py-2.5 text-center text-sm font-medium text-[var(--accent)] hover:bg-[var(--surface-2)]"
          >
            半荘を始める
          </Link>
        </div>
      )}
    </Card>
  );
}
