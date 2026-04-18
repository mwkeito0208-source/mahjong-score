"use client";

import { useState } from "react";
import { Modal, Button, Input } from "@/components/ui";

type Props = {
  memberNames: string[];
  onSelect: (name: string) => void;
};

export function NameRegistrationModal({ memberNames, onSelect }: Props) {
  const [customName, setCustomName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = async (name: string) => {
    setSubmitting(true);
    await onSelect(name);
  };

  return (
    <Modal
      open
      onClose={() => {
        /* 閉じられない（必須選択） */
      }}
      title="あなたの名前"
      size="sm"
    >
      <p className="text-sm text-[var(--ink-muted)]">
        戦績の表示に使います。
      </p>

      {memberNames.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[11px] tracking-widest text-[var(--ink-subtle)]">
            既存メンバーから選ぶ
          </div>
          <div className="flex flex-wrap gap-1.5">
            {memberNames.map((name) => (
              <button
                key={name}
                onClick={() => handleSelect(name)}
                disabled={submitting}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  submitting
                    ? "cursor-not-allowed border-[var(--line)] text-[var(--ink-subtle)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="mb-2 text-[11px] tracking-widest text-[var(--ink-subtle)]">
          {memberNames.length > 0 ? "または新しい名前" : "名前"}
        </div>
        <div className="flex gap-2">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="名前を入力"
            disabled={submitting}
          />
          <Button
            variant="primary"
            size="md"
            disabled={!customName.trim() || submitting}
            onClick={() => customName.trim() && handleSelect(customName.trim())}
          >
            決定
          </Button>
        </div>
      </div>

      {submitting && (
        <p className="mt-4 text-center text-sm text-[var(--ink-muted)]">設定中…</p>
      )}
    </Modal>
  );
}
