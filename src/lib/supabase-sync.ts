import { supabase } from "./supabase";
import type { Group, Session, Round, Expense } from "./types";

function warn(label: string, error: unknown) {
  console.warn(`[supabase-sync] ${label}:`, error);
}

// ── Groups ──────────────────────────────────────────────

export async function syncAddGroup(
  group: Group,
  creatorUserId?: string,
  creatorName?: string
) {
  try {
    const { error } = await supabase
      .from("groups")
      .insert({ id: group.id, name: group.name, created_at: group.createdAt });
    if (error) throw error;

    if (group.members.length > 0) {
      await syncGroupMembers(group.id, group.members, creatorUserId, creatorName);
    }
  } catch (e) {
    warn("syncAddGroup", e);
  }
}

export async function syncUpdateGroup(
  id: string,
  patch: Partial<Pick<Group, "name" | "members">>
) {
  try {
    if (patch.name !== undefined) {
      const { error } = await supabase
        .from("groups")
        .update({ name: patch.name })
        .eq("id", id);
      if (error) throw error;
    }
    if (patch.members !== undefined) {
      await syncGroupMembers(id, patch.members);
    }
  } catch (e) {
    warn("syncUpdateGroup", e);
  }
}

export async function syncDeleteGroup(id: string) {
  try {
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) throw error;
  } catch (e) {
    warn("syncDeleteGroup", e);
  }
}

export async function syncGroupMembers(
  groupId: string,
  members: string[],
  newUserId?: string,
  newUserName?: string
) {
  try {
    // 既存の user_id マッピングを保持
    const { data: existing } = await supabase
      .from("members")
      .select("name, user_id")
      .eq("group_id", groupId);

    const userIdMap = new Map<string, string>();
    for (const m of existing ?? []) {
      if (m.user_id) userIdMap.set(m.name, m.user_id);
    }

    // 新規ユーザーの紐付けを追加
    if (newUserId && newUserName) {
      userIdMap.set(newUserName, newUserId);
    }

    // Delete existing members and re-insert with preserved user_ids
    const { error: delError } = await supabase
      .from("members")
      .delete()
      .eq("group_id", groupId);
    if (delError) throw delError;

    if (members.length > 0) {
      const rows = members.map((name) => ({
        id: crypto.randomUUID(),
        group_id: groupId,
        name,
        user_id: userIdMap.get(name) ?? null,
      }));
      const { error: insError } = await supabase.from("members").insert(rows);
      if (insError) throw insError;
    }
  } catch (e) {
    warn("syncGroupMembers", e);
  }
}

// ── Sessions ────────────────────────────────────────────

export async function syncCreateSession(session: Session) {
  try {
    const { error } = await supabase.from("sessions").insert({
      id: session.id,
      group_id: session.groupId,
      date: session.date,
      members: session.members,
      settings: session.settings,
      status: session.status,
      chip_config: session.chipConfig,
      chip_counts: session.chipCounts,
    });
    if (error) throw error;
  } catch (e) {
    warn("syncCreateSession", e);
  }
}

export async function syncDeleteSession(sessionId: string) {
  try {
    // 関連する rounds と expenses を先に削除（CASCADE未設定の場合に備える）
    // 各ステップが失敗してもセッション本体の削除は試行する
    try {
      await supabase.from("rounds").delete().eq("session_id", sessionId);
    } catch (e) {
      warn("syncDeleteSession:rounds", e);
    }
    try {
      await supabase.from("expenses").delete().eq("session_id", sessionId);
    } catch (e) {
      warn("syncDeleteSession:expenses", e);
    }

    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId);
    if (error) throw error;
  } catch (e) {
    warn("syncDeleteSession", e);
  }
}

export async function syncSettleSession(sessionId: string) {
  try {
    const { error } = await supabase
      .from("sessions")
      .update({ status: "settled" })
      .eq("id", sessionId);
    if (error) throw error;
  } catch (e) {
    warn("syncSettleSession", e);
  }
}

export async function syncUpdateChipCounts(
  sessionId: string,
  counts: number[]
) {
  try {
    const { error } = await supabase
      .from("sessions")
      .update({ chip_counts: counts })
      .eq("id", sessionId);
    if (error) throw error;
  } catch (e) {
    warn("syncUpdateChipCounts", e);
  }
}

// ── Rounds ──────────────────────────────────────────────

export async function syncAddRound(
  sessionId: string,
  round: Round,
  roundNumber: number
) {
  try {
    const { error } = await supabase.from("rounds").insert({
      id: round.id,
      session_id: sessionId,
      round_number: roundNumber,
      scores: round.scores,
      tobi: round.tobi ?? null,
    });
    if (error) throw error;
  } catch (e) {
    warn("syncAddRound", e);
  }
}

export async function syncUpdateRound(
  roundId: string,
  scores: (number | null)[],
  tobi?: { victim: number; attacker: number }
) {
  try {
    const { error } = await supabase
      .from("rounds")
      .update({ scores, tobi: tobi ?? null })
      .eq("id", roundId);
    if (error) throw error;
  } catch (e) {
    warn("syncUpdateRound", e);
  }
}

export async function syncDeleteRound(roundId: string) {
  try {
    const { error } = await supabase
      .from("rounds")
      .delete()
      .eq("id", roundId);
    if (error) throw error;
  } catch (e) {
    warn("syncDeleteRound", e);
  }
}

// ── Expenses ────────────────────────────────────────────

export async function syncAddExpense(sessionId: string, expense: Expense) {
  try {
    const { error } = await supabase.from("expenses").insert({
      id: expense.id,
      session_id: sessionId,
      description: expense.description,
      amount: expense.amount,
      paid_by: expense.paidBy,
      type: expense.type,
      for_members: expense.forMembers ?? null,
    });
    if (error) throw error;
  } catch (e) {
    warn("syncAddExpense", e);
  }
}

export async function syncUpdateExpense(
  expenseId: string,
  patch: Partial<Omit<Expense, "id">>
) {
  try {
    const row: Record<string, unknown> = {};
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.amount !== undefined) row.amount = patch.amount;
    if (patch.paidBy !== undefined) row.paid_by = patch.paidBy;
    if (patch.type !== undefined) row.type = patch.type;
    if (patch.forMembers !== undefined) row.for_members = patch.forMembers;

    if (Object.keys(row).length === 0) return;

    const { error } = await supabase
      .from("expenses")
      .update(row)
      .eq("id", expenseId);
    if (error) throw error;
  } catch (e) {
    warn("syncUpdateExpense", e);
  }
}

export async function syncRemoveExpense(expenseId: string) {
  try {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId);
    if (error) throw error;
  } catch (e) {
    warn("syncRemoveExpense", e);
  }
}
