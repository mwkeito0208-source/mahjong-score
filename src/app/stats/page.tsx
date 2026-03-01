"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OverviewTab } from "@/components/stats/OverviewTab";
import { MonthlyTab } from "@/components/stats/MonthlyTab";
import { OpponentsTab } from "@/components/stats/OpponentsTab";
import { GroupsTab, type GroupStat } from "@/components/stats/GroupsTab";
import { fetchGroups, fetchSessions, fetchMyGroupIds } from "@/lib/supabase-fetch";
import { useAuth } from "@/components/AuthProvider";
import {
  getAllMemberNames,
  calcOverview,
  calcMonthly,
  calcOpponents,
  calcGroups,
  type OverviewStats,
  type MonthlyStat,
  type OpponentStat,
} from "@/lib/stats-calc";
import type { Session, Group } from "@/lib/types";

const TABS = [
  { id: "overview", label: "概要" },
  { id: "monthly", label: "月別" },
  { id: "opponents", label: "対戦相手" },
  { id: "groups", label: "グループ" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SELECTED_MEMBER_KEY = "mahjong-stats-selected-member";

export default function StatsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");

  // 計算結果
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyStat[]>([]);
  const [opponents, setOpponents] = useState<OpponentStat[]>([]);
  const [groupStats, setGroupStats] = useState<GroupStat[]>([]);

  // データ取得
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const groupIds = await fetchMyGroupIds(user.id);
        const [g, s] = await Promise.all([
          fetchGroups(user.id),
          fetchSessions(groupIds),
        ]);
        setGroups(g);
        setSessions(s);

        const names = getAllMemberNames(s);
        setMemberNames(names);

        // 前回選択したメンバーを復元
        const saved = localStorage.getItem(SELECTED_MEMBER_KEY);
        if (saved && names.includes(saved)) {
          setSelectedMember(saved);
        } else if (names.length > 0) {
          setSelectedMember(names[0]);
        }
      } catch (e) {
        console.error(e);
        setError("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // 統計計算
  const recalc = useCallback(
    (member: string, sess: Session[], grps: Group[]) => {
      if (!member || sess.length === 0) {
        setOverview(null);
        setMonthly([]);
        setOpponents([]);
        setGroupStats([]);
        return;
      }
      setOverview(calcOverview(sess, member));
      setMonthly(calcMonthly(sess, member));
      setOpponents(calcOpponents(sess, member));
      setGroupStats(calcGroups(sess, grps, member));
    },
    []
  );

  useEffect(() => {
    recalc(selectedMember, sessions, groups);
  }, [selectedMember, sessions, groups, recalc]);

  const handleMemberChange = (name: string) => {
    setSelectedMember(name);
    localStorage.setItem(SELECTED_MEMBER_KEY, name);
  };

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
        <div className="mb-4 flex items-center justify-between rounded-xl bg-green-900 p-3 text-white">
          <div className="text-lg font-bold">📊 統計</div>
        </div>
        <div className="flex items-center justify-center py-20 text-gray-500">
          読み込み中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
        <div className="mb-4 flex items-center justify-between rounded-xl bg-green-900 p-3 text-white">
          <div className="text-lg font-bold">📊 統計</div>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg bg-white/20 px-4 py-2 text-sm hover:bg-white/30"
          >
            ← 戻る
          </button>
        </div>
        <div className="rounded-xl bg-red-50 p-6 text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-green-900 p-3 text-white">
        <div className="text-lg font-bold">📊 統計</div>
        <button
          onClick={() => router.push("/")}
          className="rounded-lg bg-white/20 px-4 py-2 text-sm hover:bg-white/30"
        >
          ← 戻る
        </button>
      </div>

      {/* メンバー選択 */}
      {memberNames.length > 0 && (
        <div className="mb-4 rounded-xl bg-white p-3 shadow-md">
          <label className="mb-1 block text-xs text-gray-500">
            表示するプレイヤー
          </label>
          <select
            value={selectedMember}
            onChange={(e) => handleMemberChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800"
          >
            {memberNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* データなし */}
      {sessions.length === 0 && (
        <div className="rounded-xl bg-white p-8 text-center shadow-md">
          <div className="mb-3 text-4xl">📊</div>
          <p className="text-gray-500">データがありません</p>
          <p className="mt-1 text-sm text-gray-400">
            セッションを作成して対局を記録しましょう
          </p>
        </div>
      )}

      {sessions.length > 0 && overview && (
        <>
          {/* タブ */}
          <div className="mb-4 flex gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* タブコンテンツ */}
          {activeTab === "overview" && <OverviewTab stats={overview} />}
          {activeTab === "monthly" && <MonthlyTab data={monthly} />}
          {activeTab === "opponents" && <OpponentsTab data={opponents} />}
          {activeTab === "groups" && <GroupsTab data={groupStats} />}
        </>
      )}
    </div>
  );
}
