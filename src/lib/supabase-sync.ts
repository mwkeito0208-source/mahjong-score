import { supabase } from "./supabase";
import type { Group, Session, Round, Expense } from "./types";

function warn(label: string, error: unknown) {
  console.warn(`[supabase-sync] ${label}:`, error);
}

// ── Groups ──────────────────────────────────────────────

export async function syncAddGroup(group: Group) {
  try {
    const { error } = await supabase
      .from("groups")
      .insert({ id: group.id, name: group.name, created_at: group.createdAt });
    if (error) throw error;

    if (group.members.length > 0) {
      await syncGroupMembers(group.id, group.members);
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

export async function syncGroupMembers(groupId: string, members: string[]) {
  try {
    // Delete existing members and re-insert
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
