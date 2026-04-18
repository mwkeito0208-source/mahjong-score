"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { BalanceSection } from "@/components/settlement/BalanceSection";
import { SettlementList } from "@/components/settlement/SettlementList";
import { ExpenseSection } from "@/components/settlement/ExpenseSection";
import { ChipInputModal } from "@/components/settlement/ChipInputModal";
import { BreakdownDetails } from "@/components/settlement/BreakdownDetails";
import {
  calculateExpenseBalances,
  calculateChipBalances,
  calculateSettlements,
  generateShareText,
} from "@/lib/settlement";
import type { Expense } from "@/lib/types";
import { calculateTotals, calculateMoney, type RoundData } from "@/lib/score";
import { useAppStore } from "@/store";
import { getSession, getGroup } from "@/store/selectors";
import { useHydration } from "@/store/useHydration";
import { useSyncFromSupabase } from "@/store/useSyncFromSupabase";
import { Button, Card } from "@/components/ui";

export default function SettlementPage() {
  const router = useRouter();
  const params = useParams();
  const hydrated = useHydration();
  const synced = useSyncFromSupabase();
  const sessionId = params.id as string;

  const sessions = useAppStore((s) => s.sessions);
  const groups = useAppStore((s) => s.groups);
  const addExpense = useAppStore((s) => s.addExpense);
  const updateExpense = useAppStore((s) => s.updateExpense);
  const removeExpense = useAppStore((s) => s.removeExpense);
  const updateChipCounts = useAppStore((s) => s.updateChipCounts);

  const session = getSession(sessions, sessionId);
  const group = session ? getGroup(groups, session.groupId) : undefined;

  const [showChipInput, setShowChipInput] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!hydrated || (!session && !synced)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-sm text-[var(--ink-muted)]">読み込み中…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card padding="lg" className="text-center">
          <p className="text-[var(--ink-muted)]">対局が見つかりません</p>
          <Button variant="primary" size="md" className="mt-4" onClick={() => router.push("/")}>
            席に戻る
          </Button>
        </Card>
      </div>
    );
  }

  const { settings, chipConfig, members } = session;

  const roundDataList: RoundData[] = session.rounds.map((r) => ({
    scores: r.scores,
    tobi: r.tobi,
  }));
  const totals =
    roundDataList.length > 0
      ? calculateTotals(
          roundDataList,
          settings.returnPoints,
          settings.uma,
          settings.tobiPenalty,
          settings.startPoints,
        )
      : members.map(() => 0);
  const mahjongBalances = calculateMoney(totals, settings.rate);

  const chipBalances = chipConfig.enabled
    ? calculateChipBalances(
        session.chipCounts,
        chipConfig.startChips,
        chipConfig.pricePerChip,
      )
    : members.map(() => 0);

  const expenseBalances = calculateExpenseBalances(members, session.expenses);
  const sharedExpenseTotal = session.expenses
    .filter((e) => e.type === "shared")
    .reduce((sum, e) => sum + e.amount, 0);
  const perPersonExpense = Math.floor(sharedExpenseTotal / members.length);

  const finalBalances = members.map(
    (_, i) => mahjongBalances[i] + chipBalances[i] + expenseBalances[i],
  );

  const mahjongSettlements = calculateSettlements(members, mahjongBalances);
  const finalSettlements = calculateSettlements(members, finalBalances);

  const sessionDate = new Date(session.date);
  const dateStr = `${sessionDate.getMonth() + 1}/${sessionDate.getDate()}`;
  const sessionName = group ? `${dateStr} ${group.name}` : `${dateStr} 対局`;

  const handleAddExpense = (data: Omit<Expense, "id">) => {
    addExpense(session.id, data);
  };
  const handleUpdateExpense = (expenseId: string, patch: Partial<Omit<Expense, "id">>) => {
    updateExpense(session.id, expenseId, patch);
  };
  const handleRemoveExpense = (expenseId: string) => {
    removeExpense(session.id, expenseId);
  };

  const handleCopy = async () => {
    const text = generateShareText(
      sessionName,
      members,
      mahjongBalances,
      chipBalances,
      expenseBalances,
      finalBalances,
      finalSettlements,
      chipConfig.enabled,
    );
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-dvh pb-10">
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <button
            onClick={() => router.push(`/session/${sessionId}/score`)}
            className="inline-flex items-center gap-1 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            ← 対局へ
          </button>
          <div className="min-w-0 text-center">
            <div className="font-serif-jp text-sm font-bold tracking-widest text-[var(--ink)] truncate">
              精算
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--ink-subtle)] truncate">{sessionName}</div>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        {/* 麻雀収支 */}
        <BalanceSection
          title="麻雀収支"
          members={members}
          balances={mahjongBalances}
        />

        {/* チップ収支 */}
        {chipConfig.enabled && (
          <BalanceSection
            title="チップ収支"
            subtitle={`${chipConfig.startChips}枚 × ${chipConfig.pricePerChip}pt/枚`}
            members={members}
            balances={chipBalances}
            extra={(i) => {
              const diff = session.chipCounts[i] - chipConfig.startChips;
              return `${session.chipCounts[i]}枚 (${diff >= 0 ? "+" : ""}${diff})`;
            }}
            action={
              <Button variant="ghost" size="sm" onClick={() => setShowChipInput(true)}>
                編集
              </Button>
            }
          />
        )}

        {/* 麻雀のみの精算 */}
        <SettlementList title="麻雀精算（PayPay等）" settlements={mahjongSettlements} />

        {/* その他費用 */}
        <ExpenseSection
          members={members}
          expenses={session.expenses}
          perPersonExpense={perPersonExpense}
          onAddExpense={handleAddExpense}
          onUpdateExpense={handleUpdateExpense}
          onRemoveExpense={handleRemoveExpense}
        />

        {/* 最終精算 */}
        <SettlementList title="最終精算（全部込み）" settlements={finalSettlements} variant="highlight" />

        {/* LINEへコピー */}
        <Button
          variant={copied ? "secondary" : "primary"}
          size="lg"
          fullWidth
          onClick={handleCopy}
        >
          {copied ? "✓ コピーしました" : "LINEに送る（コピー）"}
        </Button>

        {/* 内訳 */}
        <BreakdownDetails
          members={members}
          mahjongBalances={mahjongBalances}
          chipBalances={chipBalances}
          expenseBalances={expenseBalances}
          finalBalances={finalBalances}
          chipEnabled={chipConfig.enabled}
        />
      </main>

      {showChipInput && (
        <ChipInputModal
          members={members}
          chipCounts={session.chipCounts}
          startChips={chipConfig.startChips}
          onSave={(counts) => {
            updateChipCounts(session.id, counts);
            setShowChipInput(false);
          }}
          onClose={() => setShowChipInput(false)}
        />
      )}
    </div>
  );
}
