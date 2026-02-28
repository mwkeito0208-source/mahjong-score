import type { Session, Group } from "./types";
import {
  roundScore,
  getRanks,
  calculateRoundScores,
  calculateMoney,
} from "./score";
import { calculateChipBalances, calculateExpenseBalances } from "./settlement";
import type { GroupStat, MemberStat } from "@/components/stats/GroupsTab";

// ── Types ───────────────────────────────────────────────

export type OverviewStats = {
  totalSessions: number;
  totalRounds: number;
  totalBalance: number;
  avgRank: number;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  fourthPlace: number;
  tobi: number;
  tobiRate: number;
};

export type MonthlyStat = {
  month: string;
  sessions: number;
  balance: number;
};

export type OpponentStat = {
  name: string;
  sessions: number;
  balance: number;
  avgRank: number;
};

// ── Helpers ─────────────────────────────────────────────

/** セッション内の1メンバーのインデックスを取得 */
function memberIndex(session: Session, name: string): number {
  return session.members.indexOf(name);
}

/** セッション1つ分のメンバー別麻雀収支を計算 */
function sessionMahjongBalances(session: Session): number[] {
  if (session.rounds.length === 0) {
    return session.members.map(() => 0);
  }

  const { settings } = session;
  const roundData = session.rounds.map((r) => ({
    scores: r.scores,
    tobi: r.tobi,
  }));

  // 各ラウンドのスコア合計
  const memberCount = session.members.length;
  const totals = Array(memberCount).fill(0);
  for (const round of roundData) {
    const scores = calculateRoundScores(
      round.scores,
      settings.returnPoints,
      settings.uma,
      settings.tobiPenalty,
      round.tobi,
      settings.startPoints
    );
    scores.forEach((s, i) => {
      totals[i] += s;
    });
  }

  return calculateMoney(totals, settings.rate);
}

/** セッション1つ分の最終収支（麻雀+チップ+費用） */
function sessionFinalBalances(session: Session): number[] {
  const mahjong = sessionMahjongBalances(session);

  const chip = session.chipConfig.enabled
    ? calculateChipBalances(
        session.chipCounts,
        session.chipConfig.startChips,
        session.chipConfig.pricePerChip
      )
    : session.members.map(() => 0);

  const expense = calculateExpenseBalances(session.members, session.expenses);

  return mahjong.map((m, i) => m + chip[i] + expense[i]);
}

/** 1ラウンドで各メンバーの順位を取得 (null=抜け番) */
function roundRanks(scores: (number | null)[]): (number | null)[] {
  const activeScores: number[] = [];
  const activeIndices: number[] = [];
  scores.forEach((s, i) => {
    if (s !== null) {
      activeScores.push(s);
      activeIndices.push(i);
    }
  });

  const rounded = activeScores.map(roundScore);
  const ranks = getRanks(rounded);

  const result: (number | null)[] = scores.map(() => null);
  activeIndices.forEach((origIdx, activeIdx) => {
    result[origIdx] = ranks[activeIdx];
  });
  return result;
}

// ── 全メンバー名を収集 ─────────────────────────────────

export function getAllMemberNames(sessions: Session[]): string[] {
  const names = new Set<string>();
  for (const s of sessions) {
    for (const m of s.members) {
      names.add(m);
    }
  }
  return [...names].sort();
}

// ── Overview ────────────────────────────────────────────

export function calcOverview(
  sessions: Session[],
  myName: string
): OverviewStats {
  let totalBalance = 0;
  let totalRounds = 0;
  let rankSum = 0;
  let rankCount = 0;
  const rankCounts = [0, 0, 0, 0]; // 1位〜4位
  let tobiCount = 0;

  const mySessions = sessions.filter((s) => s.members.includes(myName));

  for (const session of mySessions) {
    const myIdx = memberIndex(session, myName);
    const balances = sessionFinalBalances(session);
    totalBalance += balances[myIdx];

    for (const round of session.rounds) {
      const ranks = roundRanks(round.scores);
      const myRank = ranks[myIdx];
      if (myRank !== null) {
        // 自分が参加したラウンドのみカウント（5人回しの抜け番は除外）
        totalRounds++;
        rankSum += myRank;
        rankCount++;
        if (myRank >= 1 && myRank <= 4) {
          rankCounts[myRank - 1]++;
        }
      }

      // トビ判定: 自分がvictim
      if (round.tobi && round.tobi.victim === myIdx) {
        tobiCount++;
      }
    }
  }

  return {
    totalSessions: mySessions.length,
    totalRounds,
    totalBalance: Math.round(totalBalance),
    avgRank: rankCount > 0 ? rankSum / rankCount : 0,
    firstPlace: rankCounts[0],
    secondPlace: rankCounts[1],
    thirdPlace: rankCounts[2],
    fourthPlace: rankCounts[3],
    tobi: tobiCount,
    tobiRate: rankCount > 0 ? +((tobiCount / rankCount) * 100).toFixed(1) : 0,
  };
}

// ── Monthly ─────────────────────────────────────────────

export function calcMonthly(
  sessions: Session[],
  myName: string
): MonthlyStat[] {
  const monthMap = new Map<string, { sessions: number; balance: number }>();

  const mySessions = sessions.filter((s) => s.members.includes(myName));

  for (const session of mySessions) {
    const myIdx = memberIndex(session, myName);
    const balances = sessionFinalBalances(session);
    const month = session.date.slice(0, 7).replace("-", "/"); // "2026-02" → "2026/02"

    const entry = monthMap.get(month) ?? { sessions: 0, balance: 0 };
    entry.sessions++;
    entry.balance += balances[myIdx];
    monthMap.set(month, entry);
  }

  return [...monthMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, data]) => ({
      month,
      sessions: data.sessions,
      balance: Math.round(data.balance),
    }));
}

// ── Opponents ───────────────────────────────────────────

export function calcOpponents(
  sessions: Session[],
  myName: string
): OpponentStat[] {
  const opponentMap = new Map<
    string,
    { sessions: Set<string>; balance: number; rankSum: number; rankCount: number }
  >();

  const mySessions = sessions.filter((s) => s.members.includes(myName));

  for (const session of mySessions) {
    const myIdx = memberIndex(session, myName);
    const balances = sessionFinalBalances(session);

    // 自分の収支
    const myBalance = balances[myIdx];

    // 自分の順位
    for (const opponent of session.members) {
      if (opponent === myName) continue;

      const entry = opponentMap.get(opponent) ?? {
        sessions: new Set<string>(),
        balance: 0,
        rankSum: 0,
        rankCount: 0,
      };
      entry.sessions.add(session.id);
      entry.balance += myBalance;

      // この対戦相手とのセッションでの自分の平均順位
      for (const round of session.rounds) {
        const ranks = roundRanks(round.scores);
        const myRank = ranks[myIdx];
        if (myRank !== null) {
          entry.rankSum += myRank;
          entry.rankCount++;
        }
      }

      opponentMap.set(opponent, entry);
    }
  }

  return [...opponentMap.entries()].map(([name, data]) => ({
    name,
    sessions: data.sessions.size,
    balance: Math.round(data.balance),
    avgRank: data.rankCount > 0 ? data.rankSum / data.rankCount : 0,
  }));
}

// ── Groups ──────────────────────────────────────────────

export function calcGroups(
  sessions: Session[],
  groups: Group[],
  myName: string
): GroupStat[] {
  const groupMap = new Map<string, Group>();
  for (const g of groups) {
    groupMap.set(g.id, g);
  }

  // セッションをグループ別に分類
  const sessionsByGroup = new Map<string, Session[]>();
  for (const session of sessions) {
    if (!session.members.includes(myName)) continue;
    const list = sessionsByGroup.get(session.groupId) ?? [];
    list.push(session);
    sessionsByGroup.set(session.groupId, list);
  }

  const result: GroupStat[] = [];

  for (const [groupId, groupSessions] of sessionsByGroup) {
    const group = groupMap.get(groupId);
    const groupName = group?.name ?? "不明なグループ";

    // 全メンバーを収集
    const allMembers = new Set<string>();
    for (const s of groupSessions) {
      for (const m of s.members) allMembers.add(m);
    }

    // 自分の集計
    let myBalance = 0;
    let myRankSum = 0;
    let myRankCount = 0;
    const myRankCounts: [number, number, number, number] = [0, 0, 0, 0];

    // メンバー別集計
    const memberStats = new Map<
      string,
      { balance: number; rankSum: number; rankCount: number; rankCounts: [number, number, number, number] }
    >();

    for (const member of allMembers) {
      memberStats.set(member, {
        balance: 0,
        rankSum: 0,
        rankCount: 0,
        rankCounts: [0, 0, 0, 0],
      });
    }

    // セッション履歴（日付順にソート）
    const sortedSessions = [...groupSessions].sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    const sessionHistory: GroupStat["sessionHistory"] = [];

    for (const session of sortedSessions) {
      const balances = sessionFinalBalances(session);
      const myIdx = memberIndex(session, myName);
      myBalance += balances[myIdx];

      // セッション履歴エントリ
      const dateStr = formatShortDate(session.date);
      sessionHistory.push({
        date: dateStr,
        members: session.members.map((m, i) => ({
          name: m,
          balance: Math.round(balances[i]),
        })),
      });

      // メンバー別収支
      for (let i = 0; i < session.members.length; i++) {
        const stat = memberStats.get(session.members[i]);
        if (stat) {
          stat.balance += balances[i];
        }
      }

      // ラウンド別順位集計
      for (const round of session.rounds) {
        const ranks = roundRanks(round.scores);

        // 自分
        const myRank = ranks[myIdx];
        if (myRank !== null) {
          myRankSum += myRank;
          myRankCount++;
          if (myRank >= 1 && myRank <= 4) myRankCounts[myRank - 1]++;
        }

        // 各メンバー
        for (let i = 0; i < session.members.length; i++) {
          const rank = ranks[i];
          if (rank !== null) {
            const stat = memberStats.get(session.members[i]);
            if (stat) {
              stat.rankSum += rank;
              stat.rankCount++;
              if (rank >= 1 && rank <= 4) stat.rankCounts[rank - 1]++;
            }
          }
        }
      }
    }

    // メンバーランキング（収支降順）
    const memberRanking: MemberStat[] = [...memberStats.entries()]
      .map(([name, stat]) => ({
        name,
        balance: Math.round(stat.balance),
        avgRank: stat.rankCount > 0 ? stat.rankSum / stat.rankCount : 0,
        rankCounts: stat.rankCounts,
      }))
      .sort((a, b) => b.balance - a.balance);

    result.push({
      name: groupName,
      sessions: groupSessions.length,
      balance: Math.round(myBalance),
      avgRank: myRankCount > 0 ? myRankSum / myRankCount : 0,
      rankCounts: myRankCounts,
      memberRanking,
      sessionHistory,
    });
  }

  return result;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
