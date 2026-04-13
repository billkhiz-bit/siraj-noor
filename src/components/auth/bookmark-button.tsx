"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useBookmarks } from "@/lib/auth/bookmarks-context";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  verseKey: string;
  size?: "sm" | "md";
}

export function BookmarkButton({ verseKey, size = "md" }: BookmarkButtonProps) {
  const { isAuthenticated, isConfigured, login } = useAuth();
  const { isBookmarked, toggle } = useBookmarks();

  const active = isAuthenticated && isBookmarked(verseKey);
  const dimensions = size === "sm" ? "h-7 w-7" : "h-8 w-8";

  function handleClick() {
    if (!isConfigured) return;
    if (!isAuthenticated) {
      void login(window.location.pathname);
      return;
    }
    void toggle(verseKey);
  }

  if (!isConfigured) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        active ? `Remove bookmark from ${verseKey}` : `Bookmark ${verseKey}`
      }
      aria-pressed={active}
      title={active ? "Bookmarked" : "Bookmark this ayah"}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md border transition-colors",
        dimensions,
        active
          ? "border-amber-500/60 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
          : "border-border text-muted-foreground hover:border-amber-500/40 hover:text-amber-400"
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3.5 2.5h9v12L8 11.5l-4.5 3z" />
      </svg>
    </button>
  );
}
