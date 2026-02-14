"use client";

import { useState } from "react";
import { RankDistribution } from "./RankDistribution";
import { BalanceTrend } from "./BalanceTrend";

export type MemberStat = {
  name: string;
  balance: number;
  avgRank: number;
  rankCounts: [number, number, number, number]; // 1位〜4位の回数
};

export type GroupStat = {
  name: string;
  sessions: number;
  balance: number;
  avgRank: number;
  rankCounts: [number, number, number, number]; // 1位〜4位の回数
  memberRanking: MemberStat[];
  /** メンバー別のセッション収支履歴 */
  sessionHistory: {
    date: string;
    members: { name: string; balance: number }[];
  }[];
};

type Props = {
  data: GroupStat[];
};

function getRankColor(rank: number): string {
  if (rank <= 2.0) return "text-green-600";
  if (rank <= 2.5) return "text-yellow-600";
  return "text-red-600";
}

const MEDAL = ["🥇", "🥈", "🥉"];

export function GroupsTab({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.balance - a.balance);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {sorted.map((group) => {
        const isOpen = expandedGroup === group.name;
        return (
          <div key={group.name} className="rounded-xl bg-white shadow-md">
            {/* サマリー（タップで開閉） */}
            <div
              onClick={() =>
                setExpandedGroup(isOpen ? null : group.name)
              }
              className="cursor-pointer p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="font-bold text-gray-800">{group.name}</div>
                  <div className="text-sm text-gray-500">
                    {group.sessions}セッション
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`text-lg font-bold ${group.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {group.balance >= 0 ? "+" : ""}
                    {group.balance.toLocaleString()}円
                  </div>
                  <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">平均順位:</span>
                <span
                  className={`font-medium ${getRankColor(group.avgRank)}`}
                >
                  {group.avgRank.toFixed(2)}位
                </span>
              </div>
            </div>

            {/* 詳細（展開時） */}
            {isOpen && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
                {/* 順位分布 */}
                <RankDistribution counts={group.rankCounts} />

                {/* 収支推移 */}
                <BalanceTrend history={group.sessionHistory} />

                {/* メンバー別成績 */}
                <div>
                  <h4 className="mb-2 text-sm font-bold text-gray-500">
                    メンバー別成績
                  </h4>
                  <div className="space-y-2">
                    {group.memberRanking.map((member, i) => (
                      <div
                        key={member.name}
                        className="rounded-lg bg-gray-50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 text-center text-sm">
                              {i < 3 ? MEDAL[i] : `${i + 1}.`}
                            </span>
                            <span className="font-medium text-gray-800">
                              {member.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <span
                              className={`font-bold ${member.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {member.balance >= 0 ? "+" : ""}
                              {member.balance.toLocaleString()}円
                            </span>
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 pl-8 text-xs text-gray-500">
                          <span>
                            平均{" "}
                            <span
                              className={`font-medium ${getRankColor(member.avgRank)}`}
                            >
                              {member.avgRank.toFixed(2)}位
                            </span>
                          </span>
                          <span className="font-mono tabular-nums text-gray-600">
                            {member.rankCounts.join("-")}
                          </span>
                          <span className="text-gray-400">
                            (1着-2着-3着-4着)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
