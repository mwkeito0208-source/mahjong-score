"use client";

import { useState, useRef } from "react";
import { Card, Badge, Button } from "@/components/ui";

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

export function SessionCardNew({ session, onClick, onDelete }: Props) {
  const [showDelete, setShowDelete] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    longPressTimer.current = setTimeout(() => setShowDelete(true), 600);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (dx < -60 && dy < 30) setShowDelete(true);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete?.(session.id);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDelete(false);
    setConfirmDelete(false);
  };

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Card
        padding="md"
        className="cursor-pointer transition-colors hover:border-[var(--ink-subtle)]"
        onClick={showDelete ? () => { setShowDelete(false); setConfirmDelete(false); } : onClick}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-serif-jp text-base font-bold text-[var(--ink)]">
              {session.date}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-muted)]">
              <span>{session.settings}</span>
              <span className="text-[var(--ink-subtle)]">・</span>
              <Badge tone="neutral" size="sm">{session.rounds}半荘</Badge>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] tracking-widest text-[var(--ink-subtle)]">参加者</div>
            <div className="text-xs text-[var(--ink-muted)]">
              {session.members.slice(0, 2).join("・")}
              {session.members.length > 2 ? ` 他${session.members.length - 2}` : ""}
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2 border-t border-[var(--line)] pt-3" style={{ gridTemplateColumns: `repeat(${session.results.length}, minmax(0, 1fr))` }}>
          {session.results.map((result) => (
            <div key={result.name} className="text-center">
              <div className="truncate text-[11px] text-[var(--ink-subtle)]">{result.name}</div>
              <div className={`num-mono tabular text-sm font-bold ${result.score >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                {result.score >= 0 ? "+" : ""}{result.score.toFixed(1)}
              </div>
            </div>
          ))}
        </div>

        {showDelete && (
          <div
            className="mt-3 flex items-center justify-end gap-2 border-t border-[var(--line)] pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="secondary" size="sm" onClick={handleCancel}>キャンセル</Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              {confirmDelete ? "本当に削除する" : "削除"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
