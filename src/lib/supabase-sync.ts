import { supabase } from "./supabase";
import type { Group, Session, Round, Expense } from "./types";
import { notifySyncError } from "./sync-status";

function warn(label: string, error: unknown) {
  console.warn(`[supabase-sync] ${label}:`, error);
  notifySyncError(label);
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
    // RPC があれば一括削除を試みる（トランザクション安全）
    const { error: rpcError } = await supabase.rpc("delete_group_cascade", {
      group_id: id,
    });

    if (!rpcError) return;

    // RPC が未定義の場合はフォールバックで手動削除
    console.warn("[supabase-sync] RPC未定義、手動cascade削除にフォールバック");

    const { data: sessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("group_id", id);

    const sessionIds = (sessions ?? []).map((s) => s.id);

    // rounds と expenses を並列削除
    if (sessionIds.length > 0) {
      await Promise.allSettled([
        supabase.from("rounds").delete().in("session_id", sessionIds),
        supabase.from("expenses").delete().in("session_id", sessionIds),
      ]);
    }

    // sessions と members を並列削除
    await Promise.allSettled([
      supabase.from("sessions").delete().eq("group_id", id),
      supabase.from("members").delete().eq("group_id", id),
    ]);

    // グループ本体を削除
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

/** グループ内のメンバー名を一括変更（members, sessions, expenses） */
export async function syncRenameMember(
  groupId: string,
  oldName: string,
  newName: string
) {
  try {
    // 1. members テーブル: 名前を変更
    const { data: existing } = await supabase
      .from("members")
      .select("id, name")
      .eq("group_id", groupId)
      .eq("name", oldName);

    const { data: duplicate } = await supabase
      .from("members")
      .select("id")
      .eq("group_id", groupId)
      .eq("name", newName);

    if (duplicate && duplicate.length > 0 && existing) {
      // 統合: 旧名のメンバー行を削除
      await supabase
        .from("members")
        .delete()
        .eq("group_id", groupId)
        .eq("name", oldName);
    } else if (existing && existing.length > 0) {
      // リネーム: 名前を更新
      await supabase
        .from("members")
        .update({ name: newName })
        .eq("group_id", groupId)
        .eq("name", oldName);
    }

    // 2. sessions テーブル: members JSON配列内の名前を置換
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, members")
      .eq("group_id", groupId);

    for (const ses of sessions ?? []) {
      const members = ses.members as string[] | null;
      if (!members || !members.includes(oldName)) continue;
      const updated = members.map((m: string) => (m === oldName ? newName : m));
      // 統合時に重複を排除
      const deduped = [...new Set(updated)];
      await supabase
        .from("sessions")
        .update({ members: deduped })
        .eq("id", ses.id);
    }

    // 3. expenses テーブル: paid_by と for_members を更新
    const sessionIds = (sessions ?? []).map((s) => s.id);
    if (sessionIds.length > 0) {
      await supabase
        .from("expenses")
        .update({ paid_by: newName })
        .eq("paid_by", oldName)
        .in("session_id", sessionIds);

      const { data: expenses } = await supabase
        .from("expenses")
        .select("id, for_members")
        .in("session_id", sessionIds);

      for (const exp of expenses ?? []) {
        const fm = exp.for_members as string[] | null;
        if (!fm || !fm.includes(oldName)) continue;
        const updated = [...new Set(fm.map((m: string) => (m === oldName ? newName : m)))];
        await supabase
          .from("expenses")
          .update({ for_members: updated })
          .eq("id", exp.id);
      }
    }
  } catch (e) {
    warn("syncRenameMember", e);
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
    // DB上の最大round_numberを取得して衝突を防ぐ
    const { data: existing } = await supabase
      .from("rounds")
      .select("round_number")
      .eq("session_id", sessionId)
      .order("round_number", { ascending: false })
      .limit(1);
    const dbMax = existing?.[0]?.round_number ?? 0;
    const safeRoundNumber = Math.max(roundNumber, dbMax + 1);

    const { error } = await supabase.from("rounds").insert({
      id: round.id,
      session_id: sessionId,
      round_number: safeRoundNumber,
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
  tobi?: { victim: number; attacker: number } | { victim: number; attacker: number }[]
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
