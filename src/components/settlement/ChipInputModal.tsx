"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";

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
    <Modal
      open
      onClose={onClose}
      title="最終チップ枚数"
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="md" fullWidth onClick={onClose}>キャンセル</Button>
          <Button variant="primary" size="md" fullWidth disabled={!isValid} onClick={() => onSave([...temp])}>
            保存する
          </Button>
        </div>
      }
    >
      <p className="text-sm text-[var(--ink-muted)]">
        スタート <span className="num-mono">{startChips}</span> 枚 × {members.length}人 = 合計 <span className="num-mono">{expectedTotal}</span> 枚
      </p>

      <div className="mt-3 space-y-3">
        {members.map((name, i) => {
          const diff = temp[i] - startChips;
          return (
            <div key={name}>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--ink)]">{name}</label>
                <span
                  className={`num-mono tabular text-xs font-medium ${
                    diff > 0 ? "text-[var(--positive)]" : diff < 0 ? "text-[var(--negative)]" : "text-[var(--ink-subtle)]"
                  }`}
                >
                  {diff >= 0 ? "+" : ""}{diff}枚
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => adjust(i, -5)}
                  className="rounded-[var(--radius-sm)] border border-[var(--line)] px-2 py-2 text-xs font-medium text-[var(--negative)] hover:bg-[var(--surface-2)]"
                >−5</button>
                <button
                  onClick={() => adjust(i, -1)}
                  className="rounded-[var(--radius-sm)] border border-[var(--line)] px-2 py-2 text-xs font-medium text-[var(--negative)] hover:bg-[var(--surface-2)]"
                >−1</button>
                <input
                  type="number"
                  inputMode="numeric"
                  value={temp[i]}
                  onChange={(e) => update(i, e.target.value)}
                  className="flex-1 rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] px-2 py-2 text-center num-mono tabular text-base font-bold text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                />
                <button
                  onClick={() => adjust(i, 1)}
                  className="rounded-[var(--radius-sm)] border border-[var(--line)] px-2 py-2 text-xs font-medium text-[var(--positive)] hover:bg-[var(--surface-2)]"
                >+1</button>
                <button
                  onClick={() => adjust(i, 5)}
                  className="rounded-[var(--radius-sm)] border border-[var(--line)] px-2 py-2 text-xs font-medium text-[var(--positive)] hover:bg-[var(--surface-2)]"
                >+5</button>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={`mt-4 rounded-[var(--radius-md)] border px-3 py-2 text-center text-sm ${
          isValid
            ? "border-[var(--positive)] text-[var(--positive)]"
            : "border-[var(--negative)] text-[var(--negative)]"
        }`}
      >
        合計: <span className="num-mono tabular font-bold">{currentTotal}</span> 枚
        {isValid ? " ✓" : ` (${currentTotal > expectedTotal ? "+" : ""}${currentTotal - expectedTotal} / ${expectedTotal}必要)`}
      </div>
    </Modal>
  );
}
