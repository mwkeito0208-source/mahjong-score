"use client";

import { useState } from "react";
import type { Expense } from "@/lib/types";
import { Card, Modal, Button, Input } from "@/components/ui";

type Props = {
  members: string[];
  expenses: Expense[];
  perPersonExpense: number;
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  onUpdateExpense: (expenseId: string, patch: Partial<Omit<Expense, "id">>) => void;
  onRemoveExpense: (expenseId: string) => void;
};

type ModalState = { mode: "add" } | { mode: "edit"; expense: Expense };

export function ExpenseSection({
  members,
  expenses,
  perPersonExpense,
  onAddExpense,
  onUpdateExpense,
  onRemoveExpense,
}: Props) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(members[0]);
  const [expenseType, setExpenseType] = useState<"shared" | "individual">("shared");
  const [forMembers, setForMembers] = useState<string[]>([]);

  const openAddModal = () => {
    setDescription("");
    setAmount("");
    setPaidBy(members[0]);
    setExpenseType("shared");
    setForMembers([]);
    setModal({ mode: "add" });
  };

  const openEditModal = (expense: Expense) => {
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setPaidBy(expense.paidBy);
    setExpenseType(expense.type);
    setForMembers(expense.forMembers ?? []);
    setModal({ mode: "edit", expense });
  };

  const toggleForMember = (name: string) => {
    setForMembers((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name],
    );
  };

  const handleSubmit = () => {
    if (!description || !amount) return;
    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const data: Omit<Expense, "id"> = {
      description,
      amount: parsedAmount,
      paidBy,
      type: expenseType,
      ...(expenseType === "individual" ? { forMembers } : {}),
    };

    if (modal?.mode === "add") onAddExpense(data);
    else if (modal?.mode === "edit") onUpdateExpense(modal.expense.id, data);
    setModal(null);
  };

  const formatExpenseLabel = (expense: Expense) => {
    if (expense.type === "individual" && expense.forMembers && expense.forMembers.length > 0) {
      return `${expense.paidBy}が ${expense.forMembers.join("・")} の分を立替`;
    }
    return `${expense.paidBy}が立替`;
  };

  const canSubmit =
    description.trim() !== "" &&
    amount.trim() !== "" &&
    parseInt(amount) > 0 &&
    (expenseType === "shared" || forMembers.length > 0);

  return (
    <>
      <Card padding="md">
        <div className="flex items-center justify-between">
          <h3 className="font-serif-jp text-base font-bold text-[var(--ink)]">その他費用</h3>
          <Button variant="ghost" size="sm" onClick={openAddModal}>＋ 追加</Button>
        </div>

        {expenses.length > 0 ? (
          <div className="mt-3 divide-y divide-[var(--line)]">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between gap-2 py-2.5">
                <button
                  type="button"
                  onClick={() => openEditModal(expense)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="truncate text-sm text-[var(--ink)]">{expense.description}</div>
                  <div className="mt-0.5 truncate text-[11px] text-[var(--ink-subtle)]">
                    {formatExpenseLabel(expense)}
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="num-mono tabular text-sm font-medium text-[var(--ink)]">
                    {expense.amount.toLocaleString()}
                    <span className="ml-0.5 text-[10px] text-[var(--ink-subtle)]">pt</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveExpense(expense.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--ink-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--negative)]"
                    aria-label="削除"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 py-2 text-center text-sm text-[var(--ink-muted)]">費用なし</p>
        )}

        {expenses.some((e) => e.type === "shared") && (
          <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-center text-xs text-[var(--ink-muted)]">
            割り勘 1人あたり{" "}
            <span className="num-mono tabular font-bold text-[var(--ink)]">
              {perPersonExpense.toLocaleString()}
            </span>
            <span className="ml-0.5 text-[10px] text-[var(--ink-subtle)]">pt</span>
          </div>
        )}
      </Card>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "費用を編集" : "費用を追加"}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="md" fullWidth onClick={() => setModal(null)}>
              キャンセル
            </Button>
            <Button variant="primary" size="md" fullWidth disabled={!canSubmit} onClick={handleSubmit}>
              {modal?.mode === "edit" ? "保存する" : "追加する"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* タイプ */}
          <div>
            <div className="mb-1.5 text-[11px] tracking-widest text-[var(--ink-subtle)]">タイプ</div>
            <div className="flex rounded-[var(--radius-md)] border border-[var(--line)] p-0.5">
              <button
                type="button"
                onClick={() => setExpenseType("shared")}
                className={`flex-1 rounded-[var(--radius-sm)] py-2 text-sm font-medium transition-colors ${
                  expenseType === "shared"
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
              >
                全員で割り勘
              </button>
              <button
                type="button"
                onClick={() => setExpenseType("individual")}
                className={`flex-1 rounded-[var(--radius-sm)] py-2 text-sm font-medium transition-colors ${
                  expenseType === "individual"
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
              >
                個別支払い
              </button>
            </div>
          </div>

          <Input
            label="内容"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例: カレー"
          />

          <Input
            label="金額 (pt)"
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="例: 1200"
          />

          <div>
            <div className="mb-1.5 text-[11px] tracking-widest text-[var(--ink-subtle)]">
              {expenseType === "shared" ? "立替者" : "支払者"}
            </div>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2.5 text-base text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
            >
              {members.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {expenseType === "individual" && (
            <div>
              <div className="mb-1.5 text-[11px] tracking-widest text-[var(--ink-subtle)]">
                対象メンバー
              </div>
              <div className="flex flex-wrap gap-1.5">
                {members.map((name) => {
                  const selected = forMembers.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleForMember(name)}
                      className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                        selected
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                          : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--ink-subtle)]"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
              {forMembers.length === 0 && (
                <p className="mt-1 text-xs text-[var(--negative)]">対象メンバーを選択してください</p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
