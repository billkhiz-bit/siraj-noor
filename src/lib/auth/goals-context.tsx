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
  type TodayGoalPlan,
} from "@/lib/qf-user-api";
import { useAuth } from "./auth-context";

// QF's GET /goals/get-todays-plan returns a 0-1 progress ratio but
// does NOT echo back the target amount the user set. To display
// "7 of 10 minutes" the UI needs the target. /v1/goals has no list
// endpoint on the public OpenAPI, so we persist the target locally
// alongside the goal id at creation time. Progress stays
// server-authoritative; the target is the single piece of client
// state we care about.
const LOCAL_STORAGE_KEY = "siraj-noor-goal:v1";

interface LocalGoalShadow {
  id: string;
  targetSeconds: number;
  createdAt: string;
}

function loadShadow(): LocalGoalShadow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalGoalShadow;
    if (
      typeof parsed.id === "string" &&
      typeof parsed.targetSeconds === "number" &&
      parsed.targetSeconds > 0
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveShadow(shadow: LocalGoalShadow): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(shadow));
}

function clearShadow(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
}

interface GoalsContextValue {
  isLoading: boolean;
  error: string | null;
  // Server-reported presence of a goal for today. Authoritative.
  hasGoal: boolean;
  // Server-computed progress ratio 0-1 for today's plan.
  progress: number;
  // Target amount in seconds (for QURAN_TIME goals). null when no
  // local shadow exists, e.g. after localStorage wipe or
  // cross-device sign-in. UI degrades gracefully to "% complete"
  // when target is unknown.
  targetSeconds: number | null;
  goalId: string | null;
  // Creates a daily QURAN_TIME goal. `seconds` is the per-day target.
  setDailyTimeGoal: (seconds: number) => Promise<void>;
  clearGoal: () => Promise<void>;
  reload: () => Promise<void>;
}

const GoalsContext = createContext<GoalsContextValue | null>(null);

const COMMON_PRESETS_SECONDS = [300, 600, 900, 1800] as const;
export const GOAL_PRESETS = COMMON_PRESETS_SECONDS;

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const [plan, setPlan] = useState<TodayGoalPlan>({
    hasGoal: false,
    progress: 0,
  });
  const [shadow, setShadow] = useState<LocalGoalShadow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate the local shadow once on mount so SSR renders without it
  // and the client picks it up after first paint (avoids hydration
  // mismatch on the first render).
  useEffect(() => {
    setShadow(loadShadow());
  }, []);

  const reload = useCallback(async () => {
    if (!isAuthenticated) {
      setPlan({ hasGoal: false, progress: 0 });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const next = await qfApi.getTodaysGoalPlan("QURAN_TIME");
      setPlan(next);
      // If the server says there's no goal but we still have a local
      // shadow, the goal was probably deleted from another device.
      // Clear the shadow so the UI reflects truth.
      if (!next.hasGoal) {
        clearShadow();
        setShadow(null);
      }
    } catch (err) {
      console.error("[GoalsProvider] load failed:", err);
      const detail =
        err instanceof QfApiError
          ? `${err.status} ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err);
      setError(
        err instanceof QfApiError && err.status === 401
          ? "Sign-in session expired - sign in again."
          : `Couldn't load your daily goal: ${detail.slice(0, 220)}`
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isReady) return;
    void reload();
  }, [isReady, isAuthenticated, reload]);

  // Refetch goal progress when the user returns to the tab or the
  // window regains focus. Progress is aggregated server-side from
  // activity-days entries posted during reading sessions, so coming
  // back to the dashboard after reading a surah should reflect the
  // latest ratio without a manual refresh. Belt-and-braces alongside
  // ReadingTracker's explicit reload call: covers cross-tab reads
  // and the race where page-hide flushes activity but the goal GET
  // fires before the server has processed the POST.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAuthenticated) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void reload();
    };
    const onFocus = () => void reload();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, reload]);

  const setDailyTimeGoal = useCallback(
    async (seconds: number) => {
      if (!isAuthenticated || seconds <= 0) return;

      // Best-effort: if a previous goal exists, delete it first so
      // QF doesn't reject the new POST with a duplicate-goal 4xx.
      // Silently ignore failures here - the new POST will either
      // succeed or surface the real error.
      const existing = loadShadow();
      if (existing) {
        try {
          await qfApi.deleteGoal(existing.id, "QURAN");
        } catch (err) {
          console.warn("[GoalsProvider] stale goal cleanup failed:", err);
        }
      }

      try {
        const { id } = await qfApi.createGoal(
          "QURAN_TIME",
          seconds,
          "QURAN"
        );
        const next: LocalGoalShadow = {
          id,
          targetSeconds: seconds,
          createdAt: new Date().toISOString(),
        };
        saveShadow(next);
        setShadow(next);
        await reload();
      } catch (err) {
        console.error("[GoalsProvider] create goal failed:", err);
        setError(
          err instanceof QfApiError && err.status >= 400 && err.status < 500
            ? "Couldn't save that goal - please try a different duration."
            : "Couldn't reach Quran Foundation - try again shortly."
        );
        throw err;
      }
    },
    [isAuthenticated, reload]
  );

  const clearGoal = useCallback(async () => {
    const current = loadShadow();
    if (!current) {
      // Nothing local - still reload so the server view is fresh.
      await reload();
      return;
    }
    try {
      await qfApi.deleteGoal(current.id, "QURAN");
    } catch (err) {
      console.error("[GoalsProvider] delete goal failed:", err);
      // Don't throw: if the server returns 404 the goal is already
      // gone, and reloading will reflect that truth. For other errors
      // keep the shadow so the user can retry.
    } finally {
      clearShadow();
      setShadow(null);
      await reload();
    }
  }, [reload]);

  const value = useMemo<GoalsContextValue>(
    () => ({
      isLoading,
      error,
      hasGoal: plan.hasGoal,
      progress: plan.progress,
      targetSeconds: shadow?.targetSeconds ?? null,
      goalId: shadow?.id ?? null,
      setDailyTimeGoal,
      clearGoal,
      reload,
    }),
    [isLoading, error, plan, shadow, setDailyTimeGoal, clearGoal, reload]
  );

  return (
    <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
  );
}

export function useGoals(): GoalsContextValue {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("useGoals must be used within GoalsProvider");
  return ctx;
}
