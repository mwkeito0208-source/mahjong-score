"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Card } from "@/components/ui";

const TABS = [
  { id: "overview", label: "概要" },
  { id: "monthly", label: "月別" },
  { id: "opponents", label: "対戦相手" },
  { id: "groups", label: "組別" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SELECTED_MEMBER_KEY = "mahjong-stats-selected-member";

export default function StatsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");

  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyStat[]>([]);
  const [opponents, setOpponents] = useState<OpponentStat[]>([]);
  const [groupStats, setGroupStats] = useState<GroupStat[]>([]);

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
    [],
  );

  useEffect(() => {
    recalc(selectedMember, sessions, groups);
  }, [selectedMember, sessions, groups, recalc]);

  const handleMemberChange = (name: string) => {
    setSelectedMember(name);
    localStorage.setItem(SELECTED_MEMBER_KEY, name);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:py-10">
      <div>
        <p className="text-xs tracking-[0.3em] text-[var(--ink-subtle)]">STATS</p>
        <h1 className="mt-1 font-serif-jp text-3xl font-bold tracking-wider text-[var(--ink)]">
          戦績
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          通算収支、順位分布、対戦相手・組別の成績。
        </p>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-[var(--ink-muted)]">読み込み中…</p>
      ) : error ? (
        <Card padding="lg" className="mt-6 text-center">
          <p className="text-[var(--negative)]">{error}</p>
        </Card>
      ) : sessions.length === 0 ? (
        <Card padding="lg" accent="gold" className="mt-6 text-center">
          <p className="text-sm font-medium text-[var(--ink)]">記録がありません</p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            組を作って対局を記録すると、ここに戦績が残ります。
          </p>
        </Card>
      ) : (
        <>
          {memberNames.length > 0 && (
            <div className="mt-6">
              <div className="mb-1.5 text-[11px] tracking-widest text-[var(--ink-subtle)]">
                表示するプレイヤー
              </div>
              <select
                value={selectedMember}
                onChange={(e) => handleMemberChange(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2.5 text-base font-medium text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
              >
                {memberNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {overview && (
            <>
              <div className="mt-5 flex overflow-x-auto border-b border-[var(--line)]">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap px-4 py-2.5 font-serif-jp text-sm font-medium tracking-wider transition-colors ${
                      activeTab === tab.id
                        ? "border-b-2 border-[var(--accent)] text-[var(--ink)]"
                        : "border-b-2 border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                {activeTab === "overview" && <OverviewTab stats={overview} />}
                {activeTab === "monthly" && <MonthlyTab data={monthly} />}
                {activeTab === "opponents" && <OpponentsTab data={opponents} />}
                {activeTab === "groups" && <GroupsTab data={groupStats} />}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
