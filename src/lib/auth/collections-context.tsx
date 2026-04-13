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
      const message =
        err instanceof QfApiError
          ? err.message
          : "Failed to load collections";
      setError(message);
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
      const optimistic: Collection = {
        id: `optimistic-${Date.now()}`,
        name: trimmed,
        description,
        bookmarks_count: 0,
      };
      const previous = collections;
      setCollections([optimistic, ...previous]);
      try {
        const created = await qfApi.createCollection(trimmed, description);
        setCollections((current) =>
          current.map((c) => (c.id === optimistic.id ? created : c))
        );
      } catch {
        setCollections(previous);
        setError("Failed to create collection");
      }
    },
    [collections, isAuthenticated]
  );

  const remove = useCallback(
    async (id: string) => {
      const previous = collections;
      setCollections(previous.filter((c) => c.id !== id));
      try {
        await qfApi.deleteCollection(id);
      } catch {
        setCollections(previous);
        setError("Failed to delete collection");
      }
    },
    [collections]
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const previous = collections;
      setCollections(
        previous.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
      );
      try {
        await qfApi.updateCollection(id, { name: trimmed });
      } catch {
        setCollections(previous);
        setError("Failed to rename collection");
      }
    },
    [collections]
  );

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
