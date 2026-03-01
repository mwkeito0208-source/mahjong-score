import { supabase } from "./supabase";

/** セッションがなければ匿名サインインし、User を返す */
export async function ensureAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return session.user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}

/** 現在のユーザー ID を返す（未認証なら null） */
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
