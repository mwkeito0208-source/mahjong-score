"use client";

import { useState, useRef } from "react";

export type SessionResult = {
  name: string;
  score: number;
  money: number;
};

export type SessionSummary = {
  id: number;
  date: string;
  members: string[];
  rounds: number;
  results: SessionResult[];
  settings: string;
};

type Props = {
  session: SessionSummary;
  onClick: () => void;
  onDelete?: (id: number) => void;
};

export function SessionCard({ session, onClick, onDelete }: Props) {
  const [showDelete, setShowDelete] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    longPressTimer.current = setTimeout(() => {
      setShowDelete(true);
    }, 600);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);

    // Cancel long press on any movement
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Swipe left detection
    if (dx < -60 && dy < 30) {
      setShowDelete(true);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete?.(session.id);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDelete(false);
    setConfirmDelete(false);
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="cursor-pointer rounded-xl bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
        onClick={showDelete ? () => { setShowDelete(false); setConfirmDelete(false); } : onClick}
      >
        <div className="mb-2 flex items-start justify-between">
          <div>
            <div className="font-bold text-gray-800">{session.date}</div>
            <div className="text-xs text-gray-500">
              {session.settings} • {session.rounds}半荘
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">参加者</div>
            <div className="text-sm text-gray-600">
              {session.members.slice(0, 2).join(", ")}
              {session.members.length > 2 ? "..." : ""}
            </div>
          </div>
        </div>

        {/* 結果サマリー */}
        <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
          {session.results.map((result) => (
            <div key={result.name} className="flex-1 text-center">
              <div className="truncate text-xs text-gray-500">{result.name}</div>
              <div
                className={`text-sm font-bold ${result.money >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {result.money >= 0 ? "+" : ""}
                {result.money.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* 削除UI */}
        {showDelete && (
          <div
            className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCancel}
              className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              キャンセル
            </button>
            <button
              onClick={handleDelete}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold text-white ${
                confirmDelete
                  ? "bg-red-700 hover:bg-red-800"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {confirmDelete ? "本当に削除する" : "削除"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
