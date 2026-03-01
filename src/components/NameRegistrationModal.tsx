"use client";

import { useState } from "react";

type Props = {
  /** ローカルストアのグループから収集したメンバー名一覧 */
  memberNames: string[];
  /** 名前が選択されたときのコールバック */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <h3 className="mb-2 text-center text-lg font-bold text-gray-800">
          あなたの名前を選択
        </h3>
        <p className="mb-5 text-center text-sm text-gray-500">
          統計やデータの表示に使用します
        </p>

        {memberNames.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 text-sm font-bold text-gray-600">
              既存のメンバーから選択
            </div>
            <div className="flex flex-wrap gap-2">
              {memberNames.map((name) => (
                <button
                  key={name}
                  onClick={() => handleSelect(name)}
                  disabled={submitting}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    submitting
                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 text-sm font-bold text-gray-600">
            {memberNames.length > 0 ? "または新しい名前を入力" : "名前を入力"}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="名前を入力"
              disabled={submitting}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
            <button
              onClick={() => customName.trim() && handleSelect(customName.trim())}
              disabled={!customName.trim() || submitting}
              className={`rounded-lg px-4 py-2 text-sm font-bold ${
                customName.trim() && !submitting
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "cursor-not-allowed bg-gray-300 text-gray-500"
              }`}
            >
              決定
            </button>
          </div>
        </div>

        {submitting && (
          <div className="mt-4 text-center text-sm text-gray-500">
            設定中...
          </div>
        )}
      </div>
    </div>
  );
}
