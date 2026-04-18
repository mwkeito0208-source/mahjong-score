"use client";

import { useState } from "react";
import { Modal, Input, Button } from "@/components/ui";

type Props = {
  existingMembers: string[];
  onAdd: (name: string) => void;
  onClose: () => void;
};

export function AddMemberModal({ existingMembers, onAdd, onClose }: Props) {
  const [name, setName] = useState("");
  const trimmed = name.trim();
  const isDuplicate = trimmed !== "" && existingMembers.includes(trimmed);
  const isValid = trimmed !== "" && !isDuplicate;

  return (
    <Modal
      open
      onClose={onClose}
      title="新しいメンバー"
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
            onClick={() => isValid && onAdd(trimmed)}
            disabled={!isValid}
          >
            追加
          </Button>
        </div>
      }
    >
      <Input
        label="名前"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="例: 山本"
        autoFocus
        error={isDuplicate ? "既に存在する名前です" : undefined}
      />
    </Modal>
  );
}
