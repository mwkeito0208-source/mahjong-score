"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * セッションに対するリアルタイム変更を検知し、
 * 他ユーザーによる変更があった場合に警告を表示する
 */
export function useSessionRealtime(sessionId: string | undefined) {
  const [hasRemoteChange, setHasRemoteChange] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rounds",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          setHasRemoteChange(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          setHasRemoteChange(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const dismiss = () => setHasRemoteChange(false);

  return { hasRemoteChange, dismiss };
}
