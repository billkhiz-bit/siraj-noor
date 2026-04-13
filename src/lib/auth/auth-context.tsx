"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadTokens, type StoredTokens } from "./storage";
import { beginLogin, logout as oauthLogout } from "./qf-oauth";
import { isAuthConfigured } from "./config";

export interface AuthUser {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
}

interface AuthContextValue {
  isReady: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  tokens: StoredTokens | null;
  user: AuthUser | null;
  login: (returnTo?: string) => Promise<void>;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeJwtPayload(token: string): AuthUser | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded + "===".slice((padded.length + 3) % 4));
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

const STORAGE_EVENT_KEY = "qf.tokens.v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<StoredTokens | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(() => {
    setTokens(loadTokens());
  }, []);

  useEffect(() => {
    refresh();
    setIsReady(true);
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_EVENT_KEY) refresh();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const user = useMemo<AuthUser | null>(() => {
    if (!tokens?.idToken) return null;
    return decodeJwtPayload(tokens.idToken);
  }, [tokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      isAuthenticated: Boolean(tokens?.accessToken),
      isConfigured: isAuthConfigured(),
      tokens,
      user,
      login: (returnTo?: string) => beginLogin(returnTo ?? window.location.pathname),
      logout: oauthLogout,
      refresh,
    }),
    [isReady, tokens, user, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
