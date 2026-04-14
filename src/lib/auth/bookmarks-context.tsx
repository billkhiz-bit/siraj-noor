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
import { qfApi, QfApiError, type Bookmark } from "@/lib/qf-user-api";
import { useAuth } from "./auth-context";

interface BookmarksContextValue {
  isLoading: boolean;
  error: string | null;
  bookmarks: Bookmark[];
  bookmarkedKeys: Set<string>;
  isBookmarked: (verseKey: string) => boolean;
  toggle: (verseKey: string, note?: string) => Promise<void>;
  reload: () => Promise<void>;
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isAuthenticated) {
      setBookmarks([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await qfApi.listBookmarks();
      setBookmarks(data.bookmarks ?? []);
    } catch (err) {
      // Log the raw upstream detail to the console so it's available for
      // debugging, but show a short, user-friendly message in the UI.
      console.error("[BookmarksProvider] load failed:", err);
      setError(
        err instanceof QfApiError && err.status === 401
          ? "Sign-in session expired — sign in again."
          : "Couldn't load your bookmarks right now."
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isReady) return;
    void reload();
  }, [isReady, isAuthenticated, reload]);

  const bookmarkedKeys = useMemo(
    () => new Set(bookmarks.map((b) => b.verse_key)),
    [bookmarks]
  );

  const isBookmarked = useCallback(
    (verseKey: string) => bookmarkedKeys.has(verseKey),
    [bookmarkedKeys]
  );

  const toggle = useCallback(
    async (verseKey: string, note?: string) => {
      if (!isAuthenticated) return;
      const existing = bookmarks.find((b) => b.verse_key === verseKey);

      if (existing) {
        // Optimistic remove — functional update so concurrent toggles
        // can't stomp each other's revert state.
        setBookmarks((current) => current.filter((b) => b.id !== existing.id));
        try {
          await qfApi.deleteBookmark(existing.id);
        } catch {
          // Re-insert only this bookmark on failure.
          setBookmarks((current) =>
            current.some((b) => b.id === existing.id)
              ? current
              : [existing, ...current]
          );
          setError("Failed to remove bookmark");
        }
        return;
      }

      // Optimistic add
      const optimisticId = `optimistic-${verseKey}-${Date.now()}`;
      const optimistic: Bookmark = {
        id: optimisticId,
        verse_key: verseKey,
        note,
      };
      setBookmarks((current) => [optimistic, ...current]);
      try {
        const created = await qfApi.createBookmark(verseKey, note);
        setBookmarks((current) =>
          current.map((b) => (b.id === optimisticId ? created : b))
        );
      } catch {
        // Remove only the optimistic placeholder — leave any other
        // in-flight or successful items untouched.
        setBookmarks((current) =>
          current.filter((b) => b.id !== optimisticId)
        );
        setError("Failed to save bookmark");
      }
    },
    [bookmarks, isAuthenticated]
  );

  const value = useMemo<BookmarksContextValue>(
    () => ({
      isLoading,
      error,
      bookmarks,
      bookmarkedKeys,
      isBookmarked,
      toggle,
      reload,
    }),
    [isLoading, error, bookmarks, bookmarkedKeys, isBookmarked, toggle, reload]
  );

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks(): BookmarksContextValue {
  const ctx = useContext(BookmarksContext);
  if (!ctx)
    throw new Error("useBookmarks must be used within BookmarksProvider");
  return ctx;
}
