import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Group,
  Session,
  SessionSettings,
  ChipConfig,
  Round,
  Expense,
  TobiInfo,
} from "@/lib/types";
import {
  syncAddGroup,
  syncUpdateGroup,
  syncDeleteGroup,
  syncCreateSession,
  syncDeleteSession,
  syncAddRound,
  syncUpdateRound,
  syncDeleteRound,
  syncUpdateChipCounts,
  syncAddExpense,
  syncUpdateExpense,
  syncRemoveExpense,
  syncSettleSession,
} from "@/lib/supabase-sync";

type State = {
  groups: Group[];
  sessions: Session[];
};

type Actions = {
  addGroup: (name: string, members?: string[]) => Group;
  importGroup: (group: Group) => void;
  updateGroup: (id: string, patch: Partial<Pick<Group, "name" | "members">>) => void;
  deleteGroup: (id: string) => void;
  createSession: (params: {
    groupId: string;
    members: string[];
    settings: SessionSettings;
    chipConfig: ChipConfig;
  }) => Session;
  deleteSession: (sessionId: string) => void;
  addRound: (sessionId: string, scores: (number | null)[], tobi?: TobiInfo) => void;
  updateRound: (sessionId: string, roundId: string, scores: (number | null)[], tobi?: TobiInfo) => void;
  deleteRound: (sessionId: string, roundId: string) => void;
  updateChipCounts: (sessionId: string, counts: number[]) => void;
  addExpense: (sessionId: string, expense: Omit<Expense, "id">) => void;
  updateExpense: (sessionId: string, expenseId: string, patch: Partial<Omit<Expense, "id">>) => void;
  removeExpense: (sessionId: string, expenseId: string) => void;
  settleSession: (sessionId: string) => void;
};

export const useAppStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      groups: [],
      sessions: [],

      addGroup: (name, members = []) => {
        const group: Group = {
          id: crypto.randomUUID(),
          name,
          members,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ groups: [group, ...s.groups] }));
        syncAddGroup(group);
        return group;
      },

      importGroup: (group) => {
        set((s) => {
          // 既にあればスキップ
          if (s.groups.some((g) => g.id === group.id)) return s;
          return { groups: [group, ...s.groups] };
        });
      },

      updateGroup: (id, patch) => {
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        }));
        syncUpdateGroup(id, patch);
      },

      deleteGroup: (id) => {
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== id),
          sessions: s.sessions.filter((ses) => ses.groupId !== id),
        }));
        syncDeleteGroup(id);
      },

      createSession: ({ groupId, members, settings, chipConfig }) => {
        const session: Session = {
          id: crypto.randomUUID(),
          groupId,
          date: new Date().toISOString(),
          members,
          settings,
          chipConfig,
          rounds: [],
          chipCounts: members.map(() => chipConfig.startChips),
          expenses: [],
          status: "active",
        };
        set((s) => ({ sessions: [session, ...s.sessions] }));
        syncCreateSession(session);
        return session;
      },

      deleteSession: (sessionId) => {
        set((s) => ({
          sessions: s.sessions.filter((ses) => ses.id !== sessionId),
        }));
        syncDeleteSession(sessionId);
      },

      addRound: (sessionId, scores, tobi) => {
        const round: Round = {
          id: crypto.randomUUID(),
          scores,
          tobi,
        };
        set((s) => ({
          sessions: s.sessions.map((ses) =>
            ses.id === sessionId
              ? { ...ses, rounds: [...ses.rounds, round] }
              : ses
          ),
        }));
        const session = get().sessions.find((s) => s.id === sessionId);
        const roundNumber = session ? session.rounds.length : 1;
        syncAddRound(sessionId, round, roundNumber);
      },

      updateRound: (sessionId, roundId, scores, tobi) => {
        set((s) => ({
          sessions: s.sessions.map((ses) =>
            ses.id === sessionId
              ? {
                  ...ses,
                  rounds: ses.rounds.map((r) =>
                    r.id === roundId ? { ...r, scores, tobi } : r
                  ),
                }
              : ses
          ),
        }));
        syncUpdateRound(roundId, scores, tobi);
      },

      deleteRound: (sessionId, roundId) => {
        set((s) => ({
          sessions: s.sessions.map((ses) =>
            ses.id === sessionId
              ? { ...ses, rounds: ses.rounds.filter((r) => r.id !== roundId) }
              : ses
          ),
        }));
        syncDeleteRound(roundId);
      },

      updateChipCounts: (sessionId, counts) => {
        set((s) => ({
          sessions: s.sessions.map((ses) =>
            ses.id === sessionId ? { ...ses, chipCounts: counts } : ses
          ),
        }));
        syncUpdateChipCounts(sessionId, counts);
      },

      addExpense: (sessionId, expense) => {
        const newExpense: Expense = {
          ...expense,
          id: crypto.randomUUID(),
        };
        set((s) => ({
          sessions: s.sessions.map((ses) =>
            ses.id === sessionId
              ? { ...ses, expenses: [...ses.expenses, newExpense] }
              : ses
          ),
        }));
        syncAddExpense(sessionId, newExpense);
      },

      updateExpense: (sessionId, expenseId, patch) => {
        set((s) => ({
          sessions: s.sessions.map((ses) =>
            ses.id === sessionId
              ? {
                  ...ses,
                  expenses: ses.expenses.map((e) =>
                    e.id === expenseId ? { ...e, ...patch } : e
                  ),
                }
              : ses
          ),
        }));
        syncUpdateExpense(expenseId, patch);
      },

      removeExpense: (sessionId, expenseId) => {
        set((s) => ({
          sessions: s.sessions.map((ses) =>
            ses.id === sessionId
              ? {
                  ...ses,
                  expenses: ses.expenses.filter((e) => e.id !== expenseId),
                }
              : ses
          ),
        }));
        syncRemoveExpense(expenseId);
      },

      settleSession: (sessionId) => {
        set((s) => ({
          sessions: s.sessions.map((ses) =>
            ses.id === sessionId ? { ...ses, status: "settled" as const } : ses
          ),
        }));
        syncSettleSession(sessionId);
      },
    }),
    {
      name: "mahjong-score-storage",
    }
  )
);
