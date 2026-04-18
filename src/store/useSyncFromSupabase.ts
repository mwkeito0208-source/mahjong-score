import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { useAuth } from "@/components/AuthProvider";
import { fetchGroups, fetchSessions, fetchMyGroupIds } from "@/lib/supabase-fetch";

/**
 * Supabase からのリモートデータ取得を複数箇所から呼ばれても1回にまとめるため、
 * モジュールレベルで in-flight promise を共有。
 */
let syncInFlight: Promise<void> | null = null;
let lastSyncedUserId: string | null = null;

export function useSyncFromSupabase(): boolean {
  const [synced, setSynced] = useState(false);
  const { user } = useAuth();
  const mergeRemoteData = useAppStore((s) => s.mergeRemoteData);

  useEffect(() => {
    if (!user) return;

    // 同じユーザーで既に完了していれば即座に synced 化
    if (lastSyncedUserId === user.id && !syncInFlight) {
      setSynced(true);
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (!syncInFlight || lastSyncedUserId !== user.id) {
        lastSyncedUserId = user.id;
        syncInFlight = (async () => {
          try {
            const groupIds = await fetchMyGroupIds(user.id);
            const [groups, sessions] = await Promise.all([
              fetchGroups(user.id),
              fetchSessions(groupIds),
            ]);
            mergeRemoteData(groups, sessions);
          } catch (e) {
            console.error("Failed to sync from Supabase:", e);
          } finally {
            syncInFlight = null;
          }
        })();
      }
      await syncInFlight;
      if (!cancelled) setSynced(true);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [mergeRemoteData, user]);

  return synced;
}
