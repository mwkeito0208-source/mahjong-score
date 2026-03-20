import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { fetchGroup, fetchSessions } from "@/lib/supabase-fetch";

/**
 * グループ詳細ページ用の同期フック。
 * ユーザーIDに依存せず、groupId で直接データを取得し、
 * ローカルのそのグループのデータをリモートで完全に置き換える。
 */
export function useSyncGroup(groupId: string): boolean {
  const [synced, setSynced] = useState(false);
  const replaceGroupData = useAppStore((s) => s.replaceGroupData);

  useEffect(() => {
    if (!groupId) return;

    let cancelled = false;

    (async () => {
      try {
        const [group, sessions] = await Promise.all([
          fetchGroup(groupId),
          fetchSessions([groupId]),
        ]);
        if (!cancelled && group) {
          replaceGroupData(group, sessions);
        }
      } catch (e) {
        console.error("Failed to sync group:", e);
      } finally {
        if (!cancelled) {
          setSynced(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [groupId, replaceGroupData]);

  return synced;
}
