"use client";

import Link from "next/link";
import { Modal, Badge, RankBadge } from "@/components/ui";
import type { SessionSummary } from "./SessionCardNew";

type Props = {
  session: SessionSummary;
  onClose: () => void;
};

export function SessionDetailModalNew({ session, onClose }: Props) {
  const sorted = [...session.results].sort((a, b) => b.money - a.money);

  return (
    <Modal
      open
      onClose={onClose}
      title={session.date}
      size="md"
      footer={
        <Link
          href={`/session/${session.id}/score`}
          className="block w-full rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] py-2.5 text-center text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-2)]"
        >
          詳細スコアを見る →
        </Link>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="text-[11px] tracking-widest text-[var(--ink-subtle)]">ルール</div>
          <div className="mt-1 text-sm text-[var(--ink)]">{session.settings}</div>
        </div>

        <div>
          <div className="text-[11px] tracking-widest text-[var(--ink-subtle)]">参加者</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {session.members.map((name) => (
              <Badge key={name} tone="neutral">{name}</Badge>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] tracking-widest text-[var(--ink-subtle)]">半荘数</div>
          <div className="mt-1 font-serif-jp text-xl font-bold text-[var(--ink)]">{session.rounds}半荘</div>
        </div>

        <div>
          <div className="mb-2 text-[11px] tracking-widest text-[var(--ink-subtle)]">最終結果</div>
          <div className="space-y-1.5">
            {sorted.map((result, i) => {
              const rank = (Math.min(i + 1, 4) as 1 | 2 | 3 | 4);
              return (
                <div
                  key={result.name}
                  className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <RankBadge rank={rank} />
                    <span className="font-medium text-[var(--ink)]">{result.name}</span>
                  </div>
                  <div className="text-right">
                    <div className={`num-mono tabular text-base font-bold ${result.money >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                      {result.money >= 0 ? "+" : ""}{result.money.toLocaleString()}pt
                    </div>
                    <div className="num-mono tabular text-xs text-[var(--ink-subtle)]">
                      ({result.score >= 0 ? "+" : ""}{result.score})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
