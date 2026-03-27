"use client";

import { useState } from "react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <h3 className="mb-5 text-center text-lg font-bold text-gray-800">
          🀄 新しいグループ
        </h3>

        <div className="mb-4">
          <label className="mb-1 block font-bold text-gray-700">
            グループ名
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: いつメン麻雀"
            className="w-full rounded-lg border-2 border-gray-300 p-3 text-base focus:border-green-500 focus:outline-none"
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-bold text-gray-700">
            メンバー
            <span className="ml-1 text-xs font-normal text-gray-400">
              任意・カンマ区切り
            </span>
          </label>
          <textarea
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            placeholder={"例: 田中、佐藤、鈴木、山田"}
            rows={2}
            className="w-full rounded-lg border-2 border-gray-300 p-3 text-base focus:border-green-500 focus:outline-none"
          />
          {uniqueMembers.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {uniqueMembers.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                >
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="mb-4 text-sm text-gray-500">
          グループを作成したら、招待リンクを友達に共有しましょう。
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-200 py-3 text-base text-gray-700 hover:bg-gray-300"
          >
            キャンセル
          </button>
          <button
            onClick={() =>
              name.trim() &&
              onCreate(
                name.trim(),
                uniqueMembers.length > 0 ? uniqueMembers : undefined
              )
            }
            disabled={!name.trim()}
            className={`flex-1 rounded-lg py-3 text-base font-bold ${
              name.trim()
                ? "bg-green-600 text-white hover:bg-green-700"
                : "cursor-not-allowed bg-gray-300 text-gray-500"
            }`}
          >
            作成
          </button>
        </div>
      </div>
    </div>
  );
}
