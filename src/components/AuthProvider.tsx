"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  ensureAuth,
  linkGoogleIdentity,
  signInWithGoogle,
  signOut as authSignOut,
} from "@/lib/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  linkGoogle: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAnonymous: true,
  linkGoogle: async () => {},
  loginWithGoogle: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAnonymous = user?.is_anonymous ?? true;

  const linkGoogle = useCallback(async () => {
    await linkGoogleIdentity();
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const u = await ensureAuth();
        if (!cancelled) setUser(u);
      } catch (e) {
        console.error("Anonymous auth failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAnonymous, linkGoogle, loginWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
