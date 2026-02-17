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
      <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
        <div className="mb-4 flex items-center justify-between rounded-xl bg-orange-500 p-3 text-white">
          <div className="text-lg font-bold">💰 精算</div>
        </div>
        <p className="text-center text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
        <div className="rounded-xl bg-white p-8 text-center shadow-md">
          <p className="text-gray-500">セッションが見つかりません</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-lg bg-green-600 px-6 py-2 text-white"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  const { settings, chipConfig, members } = session;

  // Calculate mahjong balances
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
          settings.startPoints
        )
      : members.map(() => 0);
  const mahjongBalances = calculateMoney(totals, settings.rate);

  // Chip balances
  const chipBalances = chipConfig.enabled
    ? calculateChipBalances(
        session.chipCounts,
        chipConfig.startChips,
        chipConfig.pricePerChip
      )
    : members.map(() => 0);

  const expenseBalances = calculateExpenseBalances(members, session.expenses);
  const sharedExpenseTotal = session.expenses
    .filter((e) => e.type === "shared")
    .reduce((sum, e) => sum + e.amount, 0);
  const perPersonExpense = Math.floor(sharedExpenseTotal / members.length);

  const finalBalances = members.map(
    (_, i) => mahjongBalances[i] + chipBalances[i] + expenseBalances[i]
  );

  const mahjongSettlements = calculateSettlements(members, mahjongBalances);
  const finalSettlements = calculateSettlements(members, finalBalances);

  // Session name for share text
  const sessionDate = new Date(session.date);
  const dateStr = `${sessionDate.getMonth() + 1}/${sessionDate.getDate()}`;
  const sessionName = group
    ? `${dateStr} ${group.name}`
    : `${dateStr} セッション`;

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
      chipConfig.enabled
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
    <div className="mx-auto min-h-screen max-w-md bg-gray-100 p-4 font-sans">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-orange-500 p-3 text-white">
        <div className="text-lg font-bold">💰 精算</div>
        <button
          onClick={() => router.back()}
          className="rounded-lg bg-white/20 px-4 py-2 text-sm hover:bg-white/30"
        >
          ← 戻る
        </button>
      </div>

      {/* 麻雀収支 */}
      <BalanceSection
        title="麻雀収支"
        icon="🀄"
        members={members}
        balances={mahjongBalances}
      />

      {/* チップ収支 */}
      {chipConfig.enabled && (
        <BalanceSection
          title="チップ収支"
          icon="🎰"
          members={members}
          balances={chipBalances}
          subtitle={`(${chipConfig.startChips}枚スタート / ${chipConfig.pricePerChip}pt)`}
          extra={(i) => (
            <span className="text-xs text-gray-400">
              ({session.chipCounts[i]}枚 /{" "}
              {session.chipCounts[i] - chipConfig.startChips >= 0 ? "+" : ""}
              {session.chipCounts[i] - chipConfig.startChips})
            </span>
          )}
          action={
            <button
              onClick={() => setShowChipInput(true)}
              className="text-sm font-medium text-green-600 hover:text-green-700"
            >
              編集
            </button>
          }
        />
      )}

      {/* 麻雀のみの精算 */}
      <SettlementList
        title="麻雀精算（PayPay等）"
        icon="📱"
        settlements={mahjongSettlements}
      />

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
      <SettlementList
        title="最終精算（全部込み）"
        icon="💳"
        settlements={finalSettlements}
        variant="highlight"
      />

      {/* LINEコピー */}
      <button
        onClick={handleCopy}
        className={`mb-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold transition-all ${
          copied
            ? "bg-green-500 text-white"
            : "bg-green-500 text-white hover:bg-green-600"
        }`}
      >
        {copied
          ? "✓ コピーしました！LINEに貼り付けてね"
          : "📋 LINEに送る（コピー）"}
      </button>

      {/* 内訳 */}
      <BreakdownDetails
        members={members}
        mahjongBalances={mahjongBalances}
        chipBalances={chipBalances}
        expenseBalances={expenseBalances}
        finalBalances={finalBalances}
        chipEnabled={chipConfig.enabled}
      />

      {/* チップ入力モーダル */}
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
