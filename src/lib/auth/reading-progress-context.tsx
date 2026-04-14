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
  type ReadingSession,
} from "@/lib/qf-user-api";
import { useAuth } from "./auth-context";

interface StreakInfo {
  current: number;
  longest: number;
}

interface ReadingProgressContextValue {
  isLoading: boolean;
  error: string | null;
  sessions: ReadingSession[];
  readSurahs: Set<number>;
  streak: StreakInfo;
  isRead: (chapterId: number) => boolean;
  recordRead: (chapterId: number, verseKey?: string) => Promise<void>;
  reload: () => Promise<void>;
}

const ReadingProgressContext =
  createContext<ReadingProgressContextValue | null>(null);

export function ReadingProgressProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [streak, setStreak] = useState<StreakInfo>({ current: 0, longest: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isAuthenticated) {
      setSessions([]);
      setStreak({ current: 0, longest: 0 });
      return;
    }
    setIsLoading(true);
    setError(null);
    const failures: string[] = [];
    try {
      const [sessionsResult, streakResult] = await Promise.allSettled([
        qfApi.listReadingSessions(),
        qfApi.getStreak(),
      ]);

      if (sessionsResult.status === "fulfilled") {
        setSessions(sessionsResult.value.reading_sessions ?? []);
      } else {
        console.error(
          "[ReadingProgressProvider] sessions fetch failed:",
          sessionsResult.reason
        );
        failures.push("reading sessions");
      }

      if (streakResult.status === "fulfilled") {
        setStreak({
          current: streakResult.value.current_streak ?? 0,
          longest: streakResult.value.longest_streak ?? 0,
        });
      } else {
        console.error(
          "[ReadingProgressProvider] streak fetch failed:",
          streakResult.reason
        );
        failures.push("streak");
      }

      if (failures.length > 0) {
        setError(`Couldn't load ${failures.join(" and ")}`);
      }
    } catch (err) {
      console.error("[ReadingProgressProvider] reload threw:", err);
      setError(
        err instanceof QfApiError && err.status === 401
          ? "Sign-in session expired — sign in again."
          : "Couldn't load your reading progress right now."
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isReady) return;
    void reload();
  }, [isReady, isAuthenticated, reload]);

  const readSurahs = useMemo(() => {
    const set = new Set<number>();
    for (const s of sessions) {
      if (typeof s.chapter_id === "number") set.add(s.chapter_id);
    }
    return set;
  }, [sessions]);

  const isRead = useCallback(
    (chapterId: number) => readSurahs.has(chapterId),
    [readSurahs]
  );

  const recordRead = useCallback(
    async (chapterId: number, verseKey?: string) => {
      if (!isAuthenticated) return;

      const optimisticId = `optimistic-${chapterId}-${Date.now()}`;
      const optimistic: ReadingSession = {
        id: optimisticId,
        chapter_id: chapterId,
        verse_key: verseKey,
        created_at: new Date().toISOString(),
      };
      setSessions((current) => [optimistic, ...current]);

      try {
        const created = await qfApi.createReadingSession(chapterId, verseKey);
        setSessions((current) =>
          current.map((s) => (s.id === optimisticId ? created : s))
        );
      } catch {
        // Remove only this optimistic entry on failure.
        setSessions((current) => current.filter((s) => s.id !== optimisticId));
        setError("Couldn't log this reading session");
      }
    },
    [isAuthenticated]
  );

  const value = useMemo<ReadingProgressContextValue>(
    () => ({
      isLoading,
      error,
      sessions,
      readSurahs,
      streak,
      isRead,
      recordRead,
      reload,
    }),
    [isLoading, error, sessions, readSurahs, streak, isRead, recordRead, reload]
  );

  return (
    <ReadingProgressContext.Provider value={value}>
      {children}
    </ReadingProgressContext.Provider>
  );
}

export function useReadingProgress(): ReadingProgressContextValue {
  const ctx = useContext(ReadingProgressContext);
  if (!ctx)
    throw new Error(
      "useReadingProgress must be used within ReadingProgressProvider"
    );
  return ctx;
}
