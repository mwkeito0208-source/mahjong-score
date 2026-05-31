import type { Expense } from "./types";

export type Settlement = {
  from: string;
  to: string;
  amount: number;
};

/** 各メンバーの費用負担バランスを計算 */
export function calculateExpenseBalances(
  members: string[],
  expenses: Expense[]
): number[] {
  const balances = members.map(() => 0);

  for (const expense of expenses) {
    const payerIdx = members.indexOf(expense.paidBy);
    if (payerIdx === -1) continue;

    if (expense.type === "individual" && expense.forMembers && expense.forMembers.length > 0) {
      // individual: forMembersで均等割り
      const targets = expense.forMembers;
      const baseShare = Math.floor(expense.amount / targets.length);
      const remainder = expense.amount - baseShare * targets.length;

      balances[payerIdx] += expense.amount;
      for (let i = 0; i < targets.length; i++) {
        const targetIdx = members.indexOf(targets[i]);
        if (targetIdx !== -1) {
          balances[targetIdx] -= baseShare + (i < remainder ? 1 : 0);
        }
      }
    } else {
      // shared: 全員で均等割り
      const baseShare = Math.floor(expense.amount / members.length);
      const remainder = expense.amount - baseShare * members.length;

      balances[payerIdx] += expense.amount;
      for (let i = 0; i < members.length; i++) {
        balances[i] -= baseShare + (i < remainder ? 1 : 0);
      }
    }
  }

  return balances;
}

/** チップ収支を計算 */
export function calculateChipBalances(
  chipCounts: number[],
  startChips: number,
  pricePerChip: number
): number[] {
  return chipCounts.map((count) => (count - startChips) * pricePerChip);
}

/** 最小送金回数で精算を計算 */
export function calculateSettlements(
  members: string[],
  balances: number[]
): Settlement[] {
  const settlements: Settlement[] = [];
  const remaining = [...balances];

  for (;;) {
    const maxCreditorIdx = remaining.reduce((maxIdx, val, idx, arr) =>
      val > arr[maxIdx] ? idx : maxIdx, 0
    );
    const maxDebtorIdx = remaining.reduce((minIdx, val, idx, arr) =>
      val < arr[minIdx] ? idx : minIdx, 0
    );

    if (remaining[maxCreditorIdx] <= 0 || remaining[maxDebtorIdx] >= 0) break;

    const amount = Math.min(
      remaining[maxCreditorIdx],
      -remaining[maxDebtorIdx]
    );

    if (amount > 0) {
      settlements.push({
        from: members[maxDebtorIdx],
        to: members[maxCreditorIdx],
        amount,
      });
      remaining[maxCreditorIdx] -= amount;
      remaining[maxDebtorIdx] += amount;
    }
  }

  return settlements;
}

/** LINE共有用テキスト生成 */
export function generateShareText(
  sessionName: string,
  members: string[],
  mahjongTotals: number[],
  mahjongBalances: number[],
  chipBalances: number[],
  expenseBalances: number[],
  finalBalances: number[],
  finalSettlements: Settlement[],
  chipEnabled: boolean
): string {
  const fmt = (n: number) => `${n >= 0 ? "+" : ""}${n.toLocaleString()}pt`;
  const fmtScore = (n: number) => `${n >= 0 ? "+" : ""}${n.toLocaleString()}`;

  let text = `【${sessionName}】\n\n`;

  text += "麻雀結果\n";
  for (let i = 0; i < members.length; i++) {
    text += `${members[i]}　${fmtScore(mahjongTotals[i])}\n`;
  }

  if (chipEnabled) {
    text += "\nチップ\n";
    for (let i = 0; i < members.length; i++) {
      text += `${members[i]}　${fmt(chipBalances[i])}\n`;
    }
  }

  if (expenseBalances.some((b) => b !== 0)) {
    text += "\n場代等\n";
    for (let i = 0; i < members.length; i++) {
      if (expenseBalances[i] !== 0) {
        text += `${members[i]}　${fmt(expenseBalances[i])}\n`;
      }
    }
  }

  text += "\n精算\n";
  if (finalSettlements.length > 0) {
    for (const s of finalSettlements) {
      text += `${s.from} → ${s.to}　${s.amount.toLocaleString()}pt\n`;
    }
  } else {
    text += "精算なし\n";
  }

  return text;
}
