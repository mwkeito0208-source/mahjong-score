import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { fetchGroups, fetchSessions } from "@/lib/supabase-fetch";

export function useSyncFromSupabase(): boolean {
  const [synced, setSynced] = useState(false);
  const mergeRemoteData = useAppStore((s) => s.mergeRemoteData);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [groups, sessions] = await Promise.all([
          fetchGroups(),
          fetchSessions(),
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
  }, [mergeRemoteData]);

  return synced;
}
