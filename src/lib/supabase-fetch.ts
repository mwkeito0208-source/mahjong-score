import { supabase } from "./supabase";
import type {
  Group,
  Session,
  SessionSettings,
  ChipConfig,
  Round,
  Expense,
} from "./types";

/** Supabaseから単一グループを取得 */
export async function fetchGroup(groupId: string): Promise<Group | null> {
  const { data: group, error: gErr } = await supabase
    .from("groups")
    .select("id, name, created_at")
    .eq("id", groupId)
    .single();

  if (gErr || !group) return null;

  const { data: members } = await supabase
    .from("members")
    .select("name")
    .eq("group_id", groupId);

  return {
    id: group.id,
    name: group.name,
    members: members?.map((m) => m.name) ?? [],
    createdAt: group.created_at,
  };
}

/** Supabaseのグループにメンバーを追加 */
export async function addMemberToGroup(
  groupId: string,
  name: string,
  userId?: string
): Promise<void> {
  const row: Record<string, unknown> = {
    id: crypto.randomUUID(),
    group_id: groupId,
    name,
  };
  if (userId) row.user_id = userId;

  const { error } = await supabase.from("members").insert(row);
  if (error) throw error;
}

/** 指定ユーザーが所属するグループ ID 一覧を取得 */
export async function fetchMyGroupIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("members")
    .select("group_id")
    .eq("user_id", userId);

  if (error) throw error;
  // 重複排除
  return [...new Set((data ?? []).map((d) => d.group_id))];
}

/** 特定メンバーに user_id を紐付け */
export async function linkMemberUserId(
  groupId: string,
  memberName: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("members")
    .update({ user_id: userId })
    .eq("group_id", groupId)
    .eq("name", memberName);

  if (error) throw error;
}

/** Supabaseからグループを取得（userId指定時は所属グループのみ） */
export async function fetchGroups(userId?: string): Promise<Group[]> {
  // userId が指定されている場合、所属グループのみに絞る
  let groupIds: string[] | null = null;
  if (userId) {
    groupIds = await fetchMyGroupIds(userId);
    if (groupIds.length === 0) return [];
  }

  let query = supabase
    .from("groups")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (groupIds) {
    query = query.in("id", groupIds);
  }

  const { data: groups, error: gErr } = await query;

  if (gErr) throw gErr;
  if (!groups) return [];

  const groupIdList = groups.map((g) => g.id);
  const { data: members, error: mErr } = await supabase
    .from("members")
    .select("group_id, name")
    .in("group_id", groupIdList);

  if (mErr) throw mErr;

  const membersByGroup = new Map<string, string[]>();
  for (const m of members ?? []) {
    const list = membersByGroup.get(m.group_id) ?? [];
    list.push(m.name);
    membersByGroup.set(m.group_id, list);
  }

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    members: membersByGroup.get(g.id) ?? [],
    createdAt: g.created_at,
  }));
}

/** Supabaseからセッションを取得（groupIds指定時は対象グループのみ） */
export async function fetchSessions(groupIds?: string[]): Promise<Session[]> {
  let query = supabase
    .from("sessions")
    .select("id, group_id, date, members, settings, status, chip_config, chip_counts")
    .order("date", { ascending: false });

  if (groupIds) {
    if (groupIds.length === 0) return [];
    query = query.in("group_id", groupIds);
  }

  const { data: sessions, error: sErr } = await query;

  if (sErr) throw sErr;
  if (!sessions) return [];

  const sessionIds = sessions.map((s) => s.id);

  // rounds と expenses を一括取得
  const [roundsRes, expensesRes] = await Promise.all([
    supabase
      .from("rounds")
      .select("id, session_id, round_number, scores, tobi")
      .in("session_id", sessionIds)
      .order("round_number", { ascending: true }),
    supabase
      .from("expenses")
      .select("id, session_id, description, amount, paid_by, type, for_members")
      .in("session_id", sessionIds),
  ]);

  if (roundsRes.error) throw roundsRes.error;
  if (expensesRes.error) throw expensesRes.error;

  const roundsBySession = new Map<string, Round[]>();
  for (const r of roundsRes.data ?? []) {
    const list = roundsBySession.get(r.session_id) ?? [];
    list.push({
      id: r.id,
      scores: r.scores,
      tobi: r.tobi ?? undefined,
    });
    roundsBySession.set(r.session_id, list);
  }

  const expensesBySession = new Map<string, Expense[]>();
  for (const e of expensesRes.data ?? []) {
    const list = expensesBySession.get(e.session_id) ?? [];
    list.push({
      id: e.id,
      description: e.description,
      amount: e.amount,
      paidBy: e.paid_by,
      type: e.type ?? "shared",
      forMembers: e.for_members ?? undefined,
    });
    expensesBySession.set(e.session_id, list);
  }

  // sessions テーブルに members カラムがないケースに備え、
  // group の members で補完する。
  const relevantGroupIds = [...new Set(sessions.map((s) => s.group_id))];
  const { data: allMembers } = relevantGroupIds.length > 0
    ? await supabase
        .from("members")
        .select("group_id, name")
        .in("group_id", relevantGroupIds)
    : { data: [] };

  const membersByGroup = new Map<string, string[]>();
  for (const m of allMembers ?? []) {
    const list = membersByGroup.get(m.group_id) ?? [];
    list.push(m.name);
    membersByGroup.set(m.group_id, list);
  }

  return sessions.map((s) => {
    const rounds = roundsBySession.get(s.id) ?? [];
    const settings = s.settings as SessionSettings;
    const chipConfig = s.chip_config as ChipConfig;

    // メンバー: セッションに保存されていればそれを使い、なければグループから取得
    const members = (s.members as string[] | null) ?? membersByGroup.get(s.group_id) ?? [];

    return {
      id: s.id,
      groupId: s.group_id,
      date: s.date,
      members,
      settings,
      chipConfig,
      rounds,
      chipCounts: s.chip_counts ?? members.map(() => chipConfig.startChips),
      expenses: expensesBySession.get(s.id) ?? [],
      status: (s.status ?? "active") as "active" | "settled",
    };
  });
}
