"use client";

import { useState } from "react";
import type { Group } from "@/lib/types";

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
    if (navigator.share) {
      navigator.share({ text });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <h3 className="mb-2 text-center text-lg font-bold text-gray-800">
          🔗 招待リンク
        </h3>
        <p className="mb-4 text-center text-sm text-gray-500">
          「{group.name}」に友達を招待
        </p>

        <div className="mb-4 break-all rounded-lg bg-gray-50 p-3">
          <code className="text-sm text-gray-700">{inviteLink}</code>
        </div>

        <button
          onClick={handleCopy}
          className={`mb-3 w-full rounded-lg py-3 text-base font-bold transition-all ${
            copied
              ? "bg-green-500 text-white"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {copied ? "✓ コピーしました！" : "📋 リンクをコピー"}
        </button>

        <button
          onClick={handleShare}
          className="mb-3 w-full rounded-lg bg-green-400 py-3 text-base font-bold text-white hover:bg-green-500"
        >
          💬 LINEで共有
        </button>

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-gray-200 py-3 text-base text-gray-700 hover:bg-gray-300"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
