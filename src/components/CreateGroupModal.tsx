"use client";

import { useState } from "react";

type Props = {
  onClose: () => void;
  onCreate: (name: string) => void;
};

export function CreateGroupModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState("");

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
            onClick={() => name.trim() && onCreate(name.trim())}
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
