"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Loading3DScene } from "@/components/dashboard/loading-skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { useReadingProgress } from "@/lib/auth/reading-progress-context";
import { surahs } from "@/lib/data/surahs";
import type { ReadingSession } from "@/lib/qf-user-api";
import {
  MOCK_READING_SESSIONS,
  MOCK_STREAK,
  MOCK_READ_SURAHS,
} from "@/lib/data/mock-personal-data";

function dayIsoFromSession(session: ReadingSession): string | null {
  if (!session.created_at) return null;
  const d = new Date(session.created_at);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function formatSessionTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

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
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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

  // Group sessions by day so the drill-down panel can show every read
  // on the selected cell. Grouping is cheap (365 cells × N sessions)
  // so we memoise on the raw sessions array rather than on selectedDay.
  const sessionsByDay = useMemo(() => {
    const map = new Map<string, ReadingSession[]>();
    for (const s of displaySessions) {
      const key = dayIsoFromSession(s);
      if (!key) continue;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    // Sort each day's sessions by time so the list reads
    // earliest-to-latest, matching how the user experienced them.
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return ta - tb;
      });
    }
    return map;
  }, [displaySessions]);

  const selectedSessions = selectedDay
    ? sessionsByDay.get(selectedDay) ?? []
    : [];
  const selectedDate = selectedDay ? new Date(selectedDay + "T00:00:00Z") : null;

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

            <Activity3D
              sessions={displaySessions}
              selectedIsoDate={selectedDay}
              onDaySelect={setSelectedDay}
            />

            <p className="mt-3 text-xs text-muted-foreground/70">
              Every cell is one day in the past year. Bar height and amber
              intensity = number of reading sessions logged. Hover to see the
              date, click to pin a day and see every surah you read.{" "}
              {!isAuthenticated ? (
                <>Sign in above to start building your own streak.</>
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

            {selectedDate && (
              <section
                aria-label="Selected day detail"
                className="mt-6 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.04] via-card to-card p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/80">
                      {selectedSessions.length === 0
                        ? "No activity"
                        : `${selectedSessions.length} reading session${selectedSessions.length === 1 ? "" : "s"}`}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-foreground">
                      {selectedDate.toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    aria-label="Close day detail"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-rose-500/40 hover:text-rose-400 md:h-8 md:w-8"
                  >
                    ×
                  </button>
                </div>

                {selectedSessions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
                    <p className="mb-1 text-foreground">Nothing logged this day</p>
                    <p>
                      {!isAuthenticated ? (
                        <>Sign in and read a surah to start filling this in.</>
                      ) : (
                        <>
                          Pick any{" "}
                          <Link
                            href="/dashboard"
                            className="text-amber-500 underline-offset-4 hover:underline"
                          >
                            surah
                          </Link>{" "}
                          to log a session against a future date.
                        </>
                      )}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {selectedSessions.map((session) => {
                      const surah = surahs.find(
                        (s) => s.number === session.chapter_id
                      );
                      const verseLabel =
                        session.verse_key ??
                        (surah ? `${surah.number}:1` : undefined);
                      const chapter = session.chapter_id;
                      return (
                        <li
                          key={session.id}
                          className="flex items-center gap-4 py-3"
                        >
                          <span className="font-mono text-xs text-muted-foreground w-16 shrink-0 tabular-nums">
                            {formatSessionTime(session.created_at)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {surah
                                ? `${surah.number}. ${surah.nameEnglish}`
                                : `Surah ${chapter ?? "?"}`}
                              {surah?.nameArabic && (
                                <span
                                  className="ml-2 font-mono text-xs text-muted-foreground"
                                  dir="rtl"
                                  lang="ar"
                                >
                                  {surah.nameArabic}
                                </span>
                              )}
                            </p>
                            {session.verse_key && (
                              <p className="text-xs text-muted-foreground">
                                starting at ayah {session.verse_key.split(":")[1] ?? "?"}
                              </p>
                            )}
                          </div>
                          {chapter && (
                            <Link
                              href={`/surah/${chapter}${
                                verseLabel ? `/#verse-${verseLabel}` : ""
                              }`}
                              className="inline-flex h-11 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-amber-400 md:h-8"
                            >
                              Revisit
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
