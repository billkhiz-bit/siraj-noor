"use client";

import Link from "next/link";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Activity3D } from "@/components/dashboard/activity-3d";
import { useAuth } from "@/lib/auth/auth-context";
import { useReadingProgress } from "@/lib/auth/reading-progress-context";

export default function ActivityPage() {
  const { isAuthenticated, isReady, login } = useAuth();
  const { sessions, streak, readSurahs, isLoading, error } =
    useReadingProgress();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 pt-16 md:p-10">
        <header className="mb-6">
          <h1 className="font-mono text-3xl font-bold text-amber-500">
            Activity
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reading streak, history, and your year in the Qur&apos;an as a 3D
            heatmap.
          </p>
        </header>

        {!isReady ? (
          <div className="h-[400px] animate-pulse rounded-xl bg-card/40" />
        ) : !isAuthenticated ? (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            <p className="mb-3">
              Sign in to start tracking your reading streak. Each surah you
              open adds a session — your streak builds automatically.
            </p>
            <button
              type="button"
              onClick={() => login("/activity")}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
            >
              Sign in with Quran.com
            </button>
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Current streak
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-amber-500">
                  {streak.current}
                </p>
                <p className="text-xs text-muted-foreground">
                  day{streak.current === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Longest streak
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-foreground">
                  {streak.longest}
                </p>
                <p className="text-xs text-muted-foreground">
                  day{streak.longest === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Sessions logged
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-foreground">
                  {sessions.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  total reads
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Surahs visited
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-foreground">
                  {readSurahs.size}
                  <span className="ml-1 text-base text-muted-foreground">
                    /114
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((readSurahs.size / 114) * 100)}% of the
                  mushaf
                </p>
              </div>
            </div>

            {/* Heatmap */}
            {isLoading ? (
              <div className="h-[400px] animate-pulse rounded-xl bg-card/40" />
            ) : error ? (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-rose-200">
                {error}
              </div>
            ) : (
              <>
                <Activity3D sessions={sessions} />
                <p className="mt-3 text-xs text-muted-foreground/70">
                  Every cell is one day in the past year. Bar height and amber
                  intensity = number of reading sessions logged. Hover a cell
                  for details. The brightest cell is today.{" "}
                  <Link
                    href="/dashboard"
                    className="text-amber-500 underline-offset-4 hover:underline"
                  >
                    Read a surah
                  </Link>{" "}
                  to add to your streak.
                </p>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
