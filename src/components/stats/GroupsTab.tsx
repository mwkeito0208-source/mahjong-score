"use client";

import { useState } from "react";
import { RankDistribution } from "./RankDistribution";
import { BalanceTrend } from "./BalanceTrend";
import { Card, RankBadge } from "@/components/ui";

export type MemberStat = {
  name: string;
  balance: number;
  avgRank: number;
  rankCounts: number[];
};

export type GroupStat = {
  name: string;
  sessions: number;
  balance: number;
  avgRank: number;
  rankCounts: number[];
  memberRanking: MemberStat[];
  sessionHistory: {
    date: string;
    members: { name: string; balance: number }[];
  }[];
};

type Props = {
  data: GroupStat[];
};

function rankTone(rank: number): "positive" | "neutral" | "negative" {
  if (rank <= 2.0) return "positive";
  if (rank <= 2.5) return "neutral";
  return "negative";
}

export function GroupsTab({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.balance - a.balance);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  if (sorted.length === 0) {
    return (
      <Card padding="lg" className="text-center">
        <p className="text-sm text-[var(--ink-muted)]">組のデータがありません</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((group) => {
        const isOpen = expandedGroup === group.name;
        const tone = rankTone(group.avgRank);
        const toneClass =
          tone === "positive"
            ? "text-[var(--positive)]"
            : tone === "negative"
              ? "text-[var(--negative)]"
              : "text-[var(--ink-muted)]";
        return (
          <Card key={group.name} padding="none">
            <button
              onClick={() => setExpandedGroup(isOpen ? null : group.name)}
              className="w-full p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-serif-jp text-base font-bold text-[var(--ink)]">
                    {group.name}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--ink-muted)]">
                    {group.sessions}対局
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`num-mono tabular text-base font-bold ${
                      group.balance >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                    }`}
                  >
                    {group.balance >= 0 ? "+" : ""}
                    {group.balance.toLocaleString()}
                    <span className="ml-0.5 text-[10px] text-[var(--ink-subtle)]">pt</span>
                  </div>
                  <span className="text-[var(--ink-subtle)]">{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>
              <div className="mt-2 text-xs">
                <span className="text-[var(--ink-subtle)]">平均順位 </span>
                <span className={`num-mono tabular font-medium ${toneClass}`}>
                  {group.avgRank.toFixed(2)}位
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="space-y-4 border-t border-[var(--line)] px-4 pb-4 pt-3">
                <RankDistribution counts={group.rankCounts} />
                <BalanceTrend history={group.sessionHistory} />

                <div>
                  <h4 className="font-serif-jp text-sm font-bold text-[var(--ink)]">
                    メンバー別成績
                  </h4>
                  <div className="mt-2 space-y-2">
                    {group.memberRanking.map((member, i) => {
                      const mt = rankTone(member.avgRank);
                      const mtClass =
                        mt === "positive"
                          ? "text-[var(--positive)]"
                          : mt === "negative"
                            ? "text-[var(--negative)]"
                            : "text-[var(--ink-muted)]";
                      return (
                        <div
                          key={member.name}
                          className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-2)] p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {i < 4 ? (
                                <RankBadge rank={(i + 1) as 1 | 2 | 3 | 4} />
                              ) : (
                                <span className="inline-flex h-6 w-6 items-center justify-center text-[11px] text-[var(--ink-subtle)]">
                                  {i + 1}
                                </span>
                              )}
                              <span className="font-medium text-[var(--ink)]">{member.name}</span>
                            </div>
                            <span
                              className={`num-mono tabular text-sm font-bold ${
                                member.balance >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                              }`}
                            >
                              {member.balance >= 0 ? "+" : ""}
                              {member.balance.toLocaleString()}
                              <span className="ml-0.5 text-[10px] text-[var(--ink-subtle)]">pt</span>
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 pl-8 text-[11px] text-[var(--ink-muted)]">
                            <span>
                              平均 <span className={`num-mono tabular font-medium ${mtClass}`}>
                                {member.avgRank.toFixed(2)}位
                              </span>
                            </span>
                            <span className="num-mono tabular text-[var(--ink)]">
                              {member.rankCounts.join("-")}
                            </span>
                            <span className="text-[var(--ink-subtle)]">(1-2-3-4着)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
