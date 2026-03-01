import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { useAuth } from "@/components/AuthProvider";
import { fetchGroups, fetchSessions, fetchMyGroupIds } from "@/lib/supabase-fetch";

export function useSyncFromSupabase(): boolean {
  const [synced, setSynced] = useState(false);
  const { user } = useAuth();
  const mergeRemoteData = useAppStore((s) => s.mergeRemoteData);

  useEffect(() => {
    // ユーザーが確定するまで sync しない
    if (!user) return;

    let cancelled = false;

    (async () => {
      try {
        const groupIds = await fetchMyGroupIds(user.id);
        const [groups, sessions] = await Promise.all([
          fetchGroups(user.id),
          fetchSessions(groupIds),
        ]);
        if (!cancelled) {
          mergeRemoteData(groups, sessions);
        }
      } catch (e) {
        console.error("Failed to sync from Supabase:", e);
      } finally {
        if (!cancelled) {
          setSynced(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mergeRemoteData, user]);

  return synced;
}
