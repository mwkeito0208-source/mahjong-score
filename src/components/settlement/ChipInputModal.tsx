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
    const parsed = parseInt(value);
    updated[index] = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setTemp(updated);
  };

  const adjust = (index: number, delta: number) => {
    const updated = [...temp];
    updated[index] = Math.max(0, updated[index] + delta);
    setTemp(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white">
        <div className="flex-shrink-0 px-6 pt-6">
        <h3 className="mb-5 text-center text-lg font-bold text-gray-800">
          🎰 最終チップ枚数
        </h3>
        <p className="mb-4 text-center text-sm text-gray-500">
          スタート: {startChips}枚 × {members.length}人 = {expectedTotal}枚
        </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
        {members.map((name, i) => {
          const diff = temp[i] - startChips;
          return (
            <div key={name} className="mb-4">
              <div className="mb-1 flex items-center justify-between">
                <label className="font-bold text-gray-700">{name}</label>
                <span
                  className={`text-sm font-medium ${
                    diff > 0
                      ? "text-green-600"
                      : diff < 0
                        ? "text-red-600"
                        : "text-gray-400"
                  }`}
                >
                  {diff >= 0 ? "+" : ""}
                  {diff}枚
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjust(i, -5)}
                  className="rounded-lg bg-red-50 px-2 py-2.5 text-sm font-bold text-red-600 active:bg-red-100"
                >
                  -5
                </button>
                <button
                  onClick={() => adjust(i, -1)}
                  className="rounded-lg bg-red-50 px-2 py-2.5 text-sm font-bold text-red-600 active:bg-red-100"
                >
                  -1
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  value={temp[i]}
                  onChange={(e) => update(i, e.target.value)}
                  className="w-full flex-1 rounded-lg border-2 border-gray-300 p-2.5 text-center text-lg font-bold focus:border-green-500 focus:outline-none"
                />
                <button
                  onClick={() => adjust(i, 1)}
                  className="rounded-lg bg-blue-50 px-2 py-2.5 text-sm font-bold text-blue-600 active:bg-blue-100"
                >
                  +1
                </button>
                <button
                  onClick={() => adjust(i, 5)}
                  className="rounded-lg bg-blue-50 px-2 py-2.5 text-sm font-bold text-blue-600 active:bg-blue-100"
                >
                  +5
                </button>
              </div>
            </div>
          );
        })}

        {/* 合計チェック */}
        <div
          className={`mb-4 rounded-lg p-3 text-center ${
            isValid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          <span className="font-medium">合計: {currentTotal}枚</span>
          {isValid ? (
            <span className="ml-2">✓</span>
          ) : (
            <span className="ml-2">
              （{currentTotal > expectedTotal ? "+" : ""}
              {currentTotal - expectedTotal}枚 / {expectedTotal}枚必要）
            </span>
          )}
        </div>

        </div>{/* /flex-1 scrollable */}

        <div className="flex-shrink-0 px-6 pb-6 pt-3">
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-200 py-3 text-base text-gray-700 hover:bg-gray-300"
          >
            キャンセル
          </button>
          <button
            onClick={() => onSave([...temp])}
            disabled={!isValid}
            className={`flex-1 rounded-lg py-3 text-base font-bold transition-all ${
              isValid
                ? "bg-green-600 text-white hover:bg-green-700"
                : "cursor-not-allowed bg-gray-300 text-gray-500"
            }`}
          >
            保存
          </button>
        </div>
        </div>{/* /flex-shrink-0 footer */}
      </div>
    </div>
  );
}
