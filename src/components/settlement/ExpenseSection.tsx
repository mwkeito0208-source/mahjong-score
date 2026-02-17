"use client";

import { useState } from "react";
import type { Expense } from "@/lib/types";

type Props = {
  members: string[];
  expenses: Expense[];
  perPersonExpense: number;
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  onUpdateExpense: (expenseId: string, patch: Partial<Omit<Expense, "id">>) => void;
  onRemoveExpense: (expenseId: string) => void;
};

type ModalState =
  | { mode: "add" }
  | { mode: "edit"; expense: Expense };

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

  const closeModal = () => {
    setModal(null);
  };

  const toggleForMember = (name: string) => {
    setForMembers((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
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

    if (modal?.mode === "add") {
      onAddExpense(data);
    } else if (modal?.mode === "edit") {
      onUpdateExpense(modal.expense.id, data);
    }
    closeModal();
  };

  const formatExpenseLabel = (expense: Expense) => {
    if (expense.type === "individual" && expense.forMembers && expense.forMembers.length > 0) {
      return `(${expense.paidBy}が${expense.forMembers.join(",")}の分を支払い)`;
    }
    return `(${expense.paidBy}が立替)`;
  };

  return (
    <>
      <div className="mb-4 rounded-xl bg-white p-4 shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-gray-700">
            🍜 その他費用
          </h3>
          <button
            onClick={openAddModal}
            className="text-sm font-medium text-orange-500 hover:text-orange-600"
          >
            + 追加
          </button>
        </div>

        {expenses.length > 0 ? (
          <div className="mb-3 space-y-2">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between border-b border-gray-100 py-2"
              >
                <button
                  type="button"
                  onClick={() => openEditModal(expense)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="text-gray-700">{expense.description}</span>
                  <span className="ml-2 text-sm text-gray-400">
                    {formatExpenseLabel(expense)}
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">
                    {expense.amount.toLocaleString()}pt
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveExpense(expense.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-3 py-2 text-center text-gray-500">費用なし</p>
        )}

        {expenses.some((e) => e.type === "shared") && (
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <span className="text-gray-500">割り勘 1人あたり: </span>
            <span className="font-bold text-gray-700">
              {perPersonExpense.toLocaleString()}pt
            </span>
          </div>
        )}
      </div>

      {/* 費用追加/編集モーダル */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="mb-5 text-center text-lg font-bold text-gray-800">
              {modal.mode === "add" ? "費用を追加" : "費用を編集"}
            </h3>

            {/* タイプ選択 */}
            <div className="mb-4">
              <label className="mb-1 block font-bold text-gray-700">タイプ</label>
              <div className="flex rounded-lg border-2 border-gray-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpenseType("shared")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    expenseType === "shared"
                      ? "bg-orange-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  全員割り勘
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseType("individual")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    expenseType === "individual"
                      ? "bg-orange-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  個別支払い
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1 block font-bold text-gray-700">内容</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例: カレー"
                className="w-full rounded-lg border-2 border-gray-300 p-3 text-base focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block font-bold text-gray-700">金額</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="例: 1200"
                className="w-full rounded-lg border-2 border-gray-300 p-3 text-base focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block font-bold text-gray-700">
                {expenseType === "shared" ? "立替者" : "支払者"}
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-300 p-3 text-base focus:border-orange-500 focus:outline-none"
              >
                {members.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* 個別支払いの場合：対象メンバー選択 */}
            {expenseType === "individual" && (
              <div className="mb-4">
                <label className="mb-1 block font-bold text-gray-700">
                  対象メンバー
                </label>
                <div className="flex flex-wrap gap-2">
                  {members.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleForMember(name)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        forMembers.includes(name)
                          ? "bg-orange-500 text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                {forMembers.length === 0 && (
                  <p className="mt-1 text-xs text-red-400">対象メンバーを選択してください</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 rounded-lg bg-gray-200 py-3 text-base text-gray-700 hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={expenseType === "individual" && forMembers.length === 0}
                className="flex-1 rounded-lg bg-orange-500 py-3 text-base font-bold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {modal.mode === "add" ? "追加" : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
