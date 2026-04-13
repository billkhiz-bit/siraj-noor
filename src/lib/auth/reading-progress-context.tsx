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
    try {
      const [sessionsResp, streakResp] = await Promise.all([
        qfApi.listReadingSessions().catch(() => ({ reading_sessions: [] })),
        qfApi.getStreak().catch(() => null),
      ]);
      setSessions(sessionsResp.reading_sessions ?? []);
      if (streakResp) {
        setStreak({
          current: streakResp.current_streak ?? 0,
          longest: streakResp.longest_streak ?? 0,
        });
      }
    } catch (err) {
      const message =
        err instanceof QfApiError
          ? err.message
          : "Failed to load reading progress";
      setError(message);
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

      // Optimistic — add to read set immediately
      const optimistic: ReadingSession = {
        id: `optimistic-${chapterId}-${Date.now()}`,
        chapter_id: chapterId,
        verse_key: verseKey,
        created_at: new Date().toISOString(),
      };
      const previous = sessions;
      setSessions((current) => [optimistic, ...current]);

      try {
        const created = await qfApi.createReadingSession(chapterId, verseKey);
        setSessions((current) =>
          current.map((s) => (s.id === optimistic.id ? created : s))
        );
      } catch {
        setSessions(previous);
      }
    },
    [isAuthenticated, sessions]
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
