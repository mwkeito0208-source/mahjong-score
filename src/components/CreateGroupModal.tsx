"use client";

import { useState } from "react";
import { Modal, Input, Textarea, Button, Badge } from "@/components/ui";

type Props = {
  onClose: () => void;
  onCreate: (name: string, members?: string[]) => void;
};

export function CreateGroupModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [memberInput, setMemberInput] = useState("");

  const parsedMembers = memberInput
    .split(/[,、\n]/)
    .map((m) => m.trim())
    .filter(Boolean);
  const uniqueMembers = [...new Set(parsedMembers)];

  return (
    <Modal
      open
      onClose={onClose}
      title="新しい組"
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="md" fullWidth onClick={onClose}>
            キャンセル
          </Button>
          <Button
            variant="primary"
            size="md"
            fullWidth
            disabled={!name.trim()}
            onClick={() =>
              name.trim() &&
              onCreate(
                name.trim(),
                uniqueMembers.length > 0 ? uniqueMembers : undefined,
              )
            }
          >
            作成する
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="組の名前"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: いつメン麻雀"
          autoFocus
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ink-muted)]">
            メンバー <span className="text-xs font-normal text-[var(--ink-subtle)]">任意・カンマ区切り</span>
          </label>
          <Textarea
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            placeholder={"例: 田中、佐藤、鈴木、山田"}
            rows={2}
          />
          {uniqueMembers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {uniqueMembers.map((m) => (
                <Badge key={m} tone="neutral" size="sm">{m}</Badge>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-[var(--ink-subtle)]">
          作成したら、招待リンクを友達に共有できます。
        </p>
      </div>
    </Modal>
  );
}
