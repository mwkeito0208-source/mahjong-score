"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Google OAuth コールバックページ
 * Supabase がリダイレクトで付与したハッシュフラグメントを処理し、
 * セッション確立後にトップページへ遷移する
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        router.replace("/");
      }
    });

    // フォールバック: 3秒後にトップへ戻る（既にセッションがある場合など）
    const timer = setTimeout(() => router.replace("/"), 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-xl bg-white p-8 text-center shadow-md">
        <div className="mb-4 text-4xl">🔄</div>
        <p className="text-gray-600">ログイン処理中...</p>
      </div>
    </div>
  );
}
