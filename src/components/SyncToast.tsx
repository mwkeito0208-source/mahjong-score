"use client";

import { useState, useEffect, useCallback } from "react";
import { subscribeSyncStatus, clearSyncError } from "@/lib/sync-status";

export function SyncToast() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeSyncStatus((err) => {
      setError(err);
      if (err) {
        const timer = setTimeout(() => {
          clearSyncError();
        }, 5000);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  const handleQuota = useCallback(() => {
    setError("ストレージ容量が不足しています。古いセッションの削除を検討してください。");
  }, []);

  useEffect(() => {
    window.addEventListener("storage-quota-exceeded", handleQuota);
    return () => window.removeEventListener("storage-quota-exceeded", handleQuota);
  }, [handleQuota]);

  if (!error) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-md">
      <div className="flex items-center justify-between rounded-xl bg-red-600 px-4 py-3 text-sm text-white shadow-lg">
        <span>⚠️ {error}</span>
        <button
          onClick={() => {
            clearSyncError();
            setError(null);
          }}
          className="ml-2 rounded px-2 py-1 text-xs hover:bg-red-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
