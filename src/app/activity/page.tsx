"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Loading3DScene } from "@/components/dashboard/loading-skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { useReadingProgress } from "@/lib/auth/reading-progress-context";
import {
  MOCK_READING_SESSIONS,
  MOCK_STREAK,
  MOCK_READ_SURAHS,
} from "@/lib/data/mock-personal-data";

const Activity3D = dynamic(
  () =>
    import("@/components/dashboard/activity-3d").then((m) => ({
      default: m.Activity3D,
    })),
  {
    ssr: false,
    loading: () => <Loading3DScene label="Loading Activity 3D heatmap" />,
  }
);

type DisplayMode = "loading" | "preview-signed-out" | "preview-api-down" | "live";

export default function ActivityPage() {
  const { isAuthenticated, isReady, login } = useAuth();
  const { sessions, streak, readSurahs, error } = useReadingProgress();

  const mode: DisplayMode = !isReady
    ? "loading"
    : !isAuthenticated
      ? "preview-signed-out"
      : error
        ? "preview-api-down"
        : "live";

  const isPreview =
    mode === "preview-signed-out" || mode === "preview-api-down";

  const displaySessions = isPreview ? MOCK_READING_SESSIONS : sessions;
  const displayStreak = isPreview ? MOCK_STREAK : streak;
  const displayReadSurahs = isPreview ? MOCK_READ_SURAHS : readSurahs;

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

        {mode === "preview-signed-out" && (
          <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-sm">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400">
              Preview
            </div>
            <p className="mb-3 text-foreground/90">
              This is a sample Activity view — a full-year 3D heatmap of reading
              sessions. Sign in with Quran.com to replace the sample data with
              your own streak and session history.
            </p>
            <button
              type="button"
              onClick={() => login("/activity")}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
            >
              Sign in with Quran.com
            </button>
          </div>
        )}

        {mode === "preview-api-down" && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-sm"
          >
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400">
              Showing sample data
            </div>
            <p className="text-foreground/90">
              Couldn&apos;t reach Quran Foundation just now, so we&apos;re
              showing a sample activity profile below. Your real sessions and
              streak will reappear as soon as the connection recovers.
            </p>
          </div>
        )}

        {mode === "loading" ? (
          <div className="h-[400px] animate-pulse rounded-xl bg-card/40" />
        ) : (
          <>
            {/* Stats grid */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Current streak
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-amber-500">
                  {displayStreak.current}
                </p>
                <p className="text-xs text-muted-foreground">
                  day{displayStreak.current === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Longest streak
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-foreground">
                  {displayStreak.longest > 0 ? displayStreak.longest : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {displayStreak.longest > 0
                    ? `day${displayStreak.longest === 1 ? "" : "s"}`
                    : "not yet available"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Sessions logged
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-foreground">
                  {displaySessions.length}
                </p>
                <p className="text-xs text-muted-foreground">total reads</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Surahs visited
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-foreground">
                  {displayReadSurahs.size}
                  <span className="ml-1 text-base text-muted-foreground">
                    /114
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((displayReadSurahs.size / 114) * 100)}% of the
                  mushaf
                </p>
              </div>
            </div>

            <Activity3D sessions={displaySessions} />

            <p className="mt-3 text-xs text-muted-foreground/70">
              Every cell is one day in the past year. Bar height and amber
              intensity = number of reading sessions logged. Hover a cell for
              details. The brightest cell is today.{" "}
              {!isAuthenticated ? (
                <>
                  Sign in above to start building your own streak.
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    className="text-amber-500 underline-offset-4 hover:underline"
                  >
                    Read a surah
                  </Link>{" "}
                  to add to your streak.
                </>
              )}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
