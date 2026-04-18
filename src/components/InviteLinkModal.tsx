"use client";

import { useState } from "react";
import type { Group } from "@/lib/types";
import { Modal, Button } from "@/components/ui";

type Props = {
  group: Group;
  onClose: () => void;
};

export function InviteLinkModal({ group, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = `${origin}/join/${group.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = inviteLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `麻雀やろう！\n「${group.name}」に参加してね\n${inviteLink}`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="招待リンク"
      size="sm"
      footer={
        <Button variant="secondary" size="md" fullWidth onClick={onClose}>
          閉じる
        </Button>
      }
    >
      <p className="text-sm text-[var(--ink-muted)]">
        「<span className="font-medium text-[var(--ink)]">{group.name}</span>」に友達を招待します。
      </p>

      <div className="mt-3 break-all rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-2)] p-3">
        <code className="num-mono text-xs text-[var(--ink)]">{inviteLink}</code>
      </div>

      <div className="mt-3 space-y-2">
        <Button
          variant={copied ? "secondary" : "primary"}
          size="md"
          fullWidth
          onClick={handleCopy}
        >
          {copied ? "✓ コピーしました" : "リンクをコピー"}
        </Button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button variant="secondary" size="md" fullWidth onClick={handleShare}>
            共有する
          </Button>
        )}
      </div>
    </Modal>
  );
}
