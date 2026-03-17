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

/**
 * 匿名ユーザーに Google ID をリンクする（user_id を維持したまま Google 認証を紐付け）
 * linkIdentity が失敗した場合（既に別ユーザーに紐付け済み）は signInWithOAuth にフォールバック
 */
export async function linkGoogleIdentity() {
  const redirectTo = `${window.location.origin}/auth/callback`;

  // まず linkIdentity を試みる（匿名ユーザーの ID を維持）
  const { error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: { redirectTo },
  });

  if (error) {
    // linkIdentity 失敗 → 通常の OAuth ログインにフォールバック
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (oauthError) throw oauthError;
  }
}

/** Google OAuth でサインイン（新規デバイスで既存アカウントにログインする場合） */
export async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
}

/** サインアウト（次回アクセス時に匿名ユーザーが新規作成される） */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
