"use client";

import { useAuth } from "@/lib/auth/auth-context";

export function UserMenu() {
  const { isReady, isAuthenticated, isConfigured, user, login, logout } =
    useAuth();

  if (!isConfigured) {
    return (
      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/80">
        <div className="mb-1 font-medium text-amber-300">
          Personal features locked
        </div>
        <div className="leading-snug text-amber-200/70">
          Set <code className="font-mono">NEXT_PUBLIC_QF_CLIENT_ID</code> to
          enable bookmarks, collections, and streaks.
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="h-9 w-full animate-pulse rounded-md bg-muted/30" />
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => login()}
        className="flex h-9 w-full items-center justify-center rounded-md bg-amber-500 px-3 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
      >
        Sign in with Quran.com
      </button>
    );
  }

  const label = user?.name || user?.email || "Signed in";
  const initials = (label ?? "??")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 font-mono text-xs font-semibold text-amber-300">
          {initials || "QF"}
        </div>
        <div className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {label}
        </div>
      </div>
      <button
        type="button"
        onClick={logout}
        className="h-8 w-full rounded-md border border-border text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}
