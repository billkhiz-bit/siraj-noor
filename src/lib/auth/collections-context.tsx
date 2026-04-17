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
import {
  qfApi,
  QfApiError,
  type Collection,
} from "@/lib/qf-user-api";
import { useAuth } from "./auth-context";

interface CollectionsContextValue {
  isLoading: boolean;
  error: string | null;
  collections: Collection[];
  create: (name: string, description?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  rename: (id: string, name: string) => Promise<void>;
  reload: () => Promise<void>;
}

const CollectionsContext = createContext<CollectionsContextValue | null>(null);

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isAuthenticated) {
      setCollections([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await qfApi.listCollections();
      setCollections(data.collections ?? []);
    } catch (err) {
      // Log the raw upstream detail to the console so it's available
      // for debugging. The user-facing message stays short, but the
      // raw QfApiError message (which includes status + body preview
      // for shape drift and auth failures) is preserved in the log
      // so devtools inspection during hackathon testing shows the
      // actual cause, not just the "Couldn't reach QF" banner.
      console.error("[CollectionsProvider] load failed:", err);
      if (err instanceof QfApiError) {
        console.error(
          "[CollectionsProvider] QfApiError details:",
          "status=",
          err.status,
          "message=",
          err.message
        );
      }
      setError(
        err instanceof QfApiError && err.status === 401
          ? "Sign-in session expired - sign in again."
          : "Couldn't load your collections right now."
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isReady) return;
    void reload();
  }, [isReady, isAuthenticated, reload]);

  const create = useCallback(
    async (name: string, description?: string) => {
      const trimmed = name.trim();
      if (!trimmed || !isAuthenticated) return;
      const optimisticId = `optimistic-${Date.now()}`;
      const optimistic: Collection = {
        id: optimisticId,
        name: trimmed,
        description,
        bookmarks_count: 0,
      };
      setCollections((current) => [optimistic, ...current]);
      try {
        const created = await qfApi.createCollection(trimmed, description);
        setCollections((current) =>
          current.map((c) => (c.id === optimisticId ? created : c))
        );
      } catch {
        setCollections((current) =>
          current.filter((c) => c.id !== optimisticId)
        );
        setError("Failed to create collection");
      }
    },
    [isAuthenticated]
  );

  const remove = useCallback(async (id: string) => {
    let snapshot: Collection | undefined;
    setCollections((current) => {
      snapshot = current.find((c) => c.id === id);
      return current.filter((c) => c.id !== id);
    });
    try {
      await qfApi.deleteCollection(id);
    } catch {
      if (snapshot) {
        const restored = snapshot;
        setCollections((current) =>
          current.some((c) => c.id === restored.id) ? current : [restored, ...current]
        );
      }
      setError("Failed to delete collection");
    }
  }, []);

  const rename = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    let previousName: string | undefined;
    setCollections((current) =>
      current.map((c) => {
        if (c.id !== id) return c;
        previousName = c.name;
        return { ...c, name: trimmed };
      })
    );
    try {
      await qfApi.updateCollection(id, { name: trimmed });
    } catch {
      if (previousName !== undefined) {
        const original = previousName;
        setCollections((current) =>
          current.map((c) => (c.id === id ? { ...c, name: original } : c))
        );
      }
      setError("Failed to rename collection");
    }
  }, []);

  const value = useMemo<CollectionsContextValue>(
    () => ({
      isLoading,
      error,
      collections,
      create,
      remove,
      rename,
      reload,
    }),
    [isLoading, error, collections, create, remove, rename, reload]
  );

  return (
    <CollectionsContext.Provider value={value}>
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections(): CollectionsContextValue {
  const ctx = useContext(CollectionsContext);
  if (!ctx)
    throw new Error("useCollections must be used within CollectionsProvider");
  return ctx;
}
