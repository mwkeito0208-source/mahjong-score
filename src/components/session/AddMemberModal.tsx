"use client";

import { useState } from "react";

type Props = {
  existingMembers: string[];
  onAdd: (name: string) => void;
  onClose: () => void;
};

export function AddMemberModal({ existingMembers, onAdd, onClose }: Props) {
  const [name, setName] = useState("");

  const isValid = name.trim() !== "" && !existingMembers.includes(name.trim());

  const handleAdd = () => {
    if (isValid) {
      onAdd(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <h3 className="mb-5 text-center text-lg font-bold text-gray-800">
          新しいメンバー
        </h3>

        <div className="mb-4">
          <label className="mb-1 block font-bold text-gray-700">名前</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 山本"
            className="w-full rounded-lg border-2 border-gray-300 p-3 text-base focus:border-green-500 focus:outline-none"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-200 py-3 text-base text-gray-700 hover:bg-gray-300"
          >
            キャンセル
          </button>
          <button
            onClick={handleAdd}
            disabled={!isValid}
            className={`flex-1 rounded-lg py-3 text-base font-bold ${
              isValid
                ? "bg-green-600 text-white hover:bg-green-700"
                : "cursor-not-allowed bg-gray-300 text-gray-500"
            }`}
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
