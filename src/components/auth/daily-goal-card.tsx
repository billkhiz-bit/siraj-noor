"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useGoals, GOAL_PRESETS } from "@/lib/auth/goals-context";
import { MOCK_GOAL } from "@/lib/data/mock-personal-data";

function formatMinutes(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

// Format the "completed so far" side of the ratio. Progress is 0-1
// from the server. Rounding to the nearest whole minute matches the
// granularity the user picked the goal at.
function formatCompleted(targetSeconds: number, progress: number): string {
  const completedSeconds = Math.round(targetSeconds * progress);
  if (completedSeconds < 60) return `${completedSeconds}s`;
  const mins = Math.floor(completedSeconds / 60);
  return `${mins} min`;
}

interface DailyGoalCardProps {
  // "sidebar" for the compact variant inside TodayPanel's personal
  // column, "banner" for the full-width variant above the Activity
  // heatmap. The banner variant leads with the progress bar; the
  // sidebar variant leads with the target.
  variant?: "sidebar" | "banner";
}

export function DailyGoalCard({ variant = "sidebar" }: DailyGoalCardProps) {
  const { isAuthenticated, isConfigured, login } = useAuth();
  const {
    hasGoal,
    progress,
    targetSeconds,
    isLoading,
    error,
    setDailyTimeGoal,
    clearGoal,
  } = useGoals();
  const [pendingSeconds, setPendingSeconds] = useState<number | null>(null);

  // Signed-out preview mirrors the MOCK_GOAL shape so the card shows
  // the same visual states the signed-in card can reach.
  const previewMode = !isAuthenticated;
  const displayTarget = previewMode
    ? MOCK_GOAL.targetSeconds
    : targetSeconds ?? null;
  const displayProgress = previewMode ? MOCK_GOAL.progress : progress;
  const displayHasGoal = previewMode || hasGoal;

  const pctComplete = useMemo(
    () => Math.min(100, Math.round(displayProgress * 100)),
    [displayProgress]
  );
  const isComplete = pctComplete >= 100;

  const handlePreset = async (seconds: number) => {
    if (!isAuthenticated) {
      login("/dashboard");
      return;
    }
    setPendingSeconds(seconds);
    try {
      await setDailyTimeGoal(seconds);
    } catch {
      // error is surfaced via the goals context; keep the UI stable
    } finally {
      setPendingSeconds(null);
    }
  };

  const handleClear = async () => {
    if (!isAuthenticated) return;
    await clearGoal();
  };

  const containerClasses =
    variant === "banner"
      ? "rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.06] via-card to-card p-5"
      : "rounded-lg border border-amber-500/20 bg-amber-500/[0.03] p-4";

  if (!isConfigured) {
    return (
      <div className={containerClasses} aria-label="Daily reading goal">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/70">
          Daily goal
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Configure <code className="font-mono">NEXT_PUBLIC_QF_CLIENT_ID</code>{" "}
          to enable daily goals.
        </p>
      </div>
    );
  }

  // Rendering branch 1: the user has a goal (or we're in preview).
  // Show progress even when displayTarget is unknown (signed in on a
  // different browser, localStorage cleared) - the server-reported
  // percentage is still meaningful on its own.
  if (displayHasGoal) {
    return (
      <div
        className={containerClasses}
        role="region"
        aria-label="Daily reading goal progress"
      >
        <div className="mb-2 flex items-baseline justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/70">
            Daily goal
            {previewMode && (
              <span className="ml-2 text-[9px] uppercase text-amber-500/50">
                preview
              </span>
            )}
          </p>
          <p className="font-mono text-xs text-amber-400">
            {displayTarget
              ? `${formatCompleted(displayTarget, displayProgress)} / ${formatMinutes(displayTarget)}`
              : `${pctComplete}%`}
          </p>
        </div>

        <div
          role="progressbar"
          aria-valuenow={pctComplete}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Daily reading goal ${pctComplete}% complete`}
          className="h-2 w-full overflow-hidden rounded-full bg-muted/30"
        >
          <div
            className={`h-full transition-all duration-500 ${
              isComplete
                ? "bg-gradient-to-r from-amber-400 to-amber-300"
                : "bg-amber-500"
            }`}
            style={{ width: `${pctComplete}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          <p className="text-muted-foreground">
            {isComplete
              ? "Goal reached - masha'Allah."
              : previewMode
                ? "Sample progress - sign in to set yours."
                : `${pctComplete}% of today's goal`}
          </p>
          {previewMode ? (
            <button
              type="button"
              onClick={() => login("/dashboard")}
              className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-medium text-amber-400 hover:bg-amber-500/20"
            >
              Sign in
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground underline-offset-4 hover:text-rose-400 hover:underline"
            >
              Change
            </button>
          )}
        </div>

        {error && !previewMode && (
          <p
            role="status"
            className="mt-2 text-[10px] uppercase tracking-wider text-amber-500/70"
          >
            Sync paused
          </p>
        )}
      </div>
    );
  }

  // Rendering branch 2: signed in, no goal set. Show presets.
  return (
    <div className={containerClasses} aria-label="Set a daily reading goal">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/70">
        Daily goal
      </p>
      <p className="mt-2 mb-3 text-sm text-foreground">
        Set a daily reading target to anchor your habit.
      </p>
      <div className="flex flex-wrap gap-2">
        {GOAL_PRESETS.map((seconds) => {
          const isPending = pendingSeconds === seconds;
          return (
            <button
              key={seconds}
              type="button"
              onClick={() => handlePreset(seconds)}
              disabled={isLoading || pendingSeconds !== null}
              className="inline-flex h-10 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/5 px-3 text-xs font-medium text-amber-400 transition-colors hover:border-amber-500/60 hover:bg-amber-500/10 disabled:opacity-50 md:h-8"
            >
              {isPending ? "Saving..." : formatMinutes(seconds)}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
