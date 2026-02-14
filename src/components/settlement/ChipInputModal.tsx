"use client";

import { useState } from "react";

type Props = {
  members: string[];
  chipCounts: number[];
  startChips: number;
  onSave: (counts: number[]) => void;
  onClose: () => void;
};

export function ChipInputModal({
  members,
  chipCounts,
  startChips,
  onSave,
  onClose,
}: Props) {
  const [temp, setTemp] = useState([...chipCounts]);
  const expectedTotal = startChips * members.length;
  const currentTotal = temp.reduce((a, b) => a + b, 0);
  const isValid = currentTotal === expectedTotal;

  const update = (index: number, value: string) => {
    const updated = [...temp];
    updated[index] = parseInt(value) || 0;
    setTemp(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <h3 className="mb-5 text-center text-lg font-bold text-gray-800">
          🎰 最終チップ枚数
        </h3>
        <p className="mb-4 text-center text-sm text-gray-500">
          スタート: {startChips}枚 × {members.length}人 = {expectedTotal}枚
        </p>

        {members.map((name, i) => (
          <div key={name} className="mb-4">
            <label className="mb-1 block font-bold text-gray-700">{name}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={temp[i]}
                onChange={(e) => update(i, e.target.value)}
                className="flex-1 rounded-lg border-2 border-gray-300 p-3 text-lg focus:border-green-500 focus:outline-none"
              />
              <span className="w-16 text-sm text-gray-500">
                {temp[i] - startChips >= 0 ? "+" : ""}
                {temp[i] - startChips}枚
              </span>
            </div>
          </div>
        ))}

        {/* 合計チェック */}
        <div
          className={`mb-4 rounded-lg p-3 text-center ${
            isValid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          <span>合計: {currentTotal}枚</span>
          {isValid ? (
            <span className="ml-2">✓</span>
          ) : (
            <span className="ml-2">（{expectedTotal}枚必要）</span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-200 py-3 text-base text-gray-700 hover:bg-gray-300"
          >
            キャンセル
          </button>
          <button
            onClick={() => onSave([...temp])}
            className="flex-1 rounded-lg bg-green-600 py-3 text-base font-bold text-white hover:bg-green-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
