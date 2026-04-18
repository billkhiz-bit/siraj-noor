"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useReadingProgress } from "@/lib/auth/reading-progress-context";
import { DailyGoalCard } from "@/components/auth/daily-goal-card";
import { pickDailyAyah } from "@/lib/daily-ayah";
import { fetchVerseByKey, type Verse } from "@/lib/quran-api";
import { surahs } from "@/lib/data/surahs";
import {
  MOCK_STREAK,
  MOCK_READ_SURAHS,
} from "@/lib/data/mock-personal-data";

export function TodayPanel() {
  const { isAuthenticated, isConfigured, login } = useAuth();
  const { streak: liveStreak, readSurahs: liveReadSurahs, error } =
    useReadingProgress();

  // Signed-out visitors see a preview with mock stats so the landing
  // page looks alive. Signed-in-but-errored users now see their real
  // (possibly stale) stats plus a visible warning - previously we
  // silently substituted mock data here, which meant a user whose
  // token had quietly expired saw a fake streak and wouldn't know
  // anything was wrong.
  const showPreview = !isAuthenticated;
  const streak = showPreview ? MOCK_STREAK : liveStreak;
  const readSurahs = showPreview ? MOCK_READ_SURAHS : liveReadSurahs;
  const apiErrored = isAuthenticated && Boolean(error);

  const daily = useMemo(() => pickDailyAyah(), []);
  const surah = useMemo(
    () => surahs.find((s) => s.number === daily.chapter),
    [daily.chapter]
  );

  const [verse, setVerse] = useState<Verse | null>(null);
  const [verseError, setVerseError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchVerseByKey(daily.verseKey)
      .then((v) => {
        if (cancelled) return;
        if (!v) setVerseError(true);
        else setVerse(v);
      })
      .catch(() => {
        if (!cancelled) setVerseError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [daily.verseKey]);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  return (
    <section
      className="mb-6 grid gap-4 lg:grid-cols-3"
      aria-label="Today panel"
    >
      {/* Daily ayah card - spans 2 cols */}
      <div className="lg:col-span-2 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/70">
              Ayah of the Day
            </p>
            <p className="text-xs text-muted-foreground">{todayLabel}</p>
          </div>
          <div className="font-mono text-xs text-amber-400">
            {daily.verseKey}
          </div>
        </div>

        {verse ? (
          <>
            <p
              className="text-right font-mono text-2xl leading-loose text-foreground"
              dir="rtl"
              lang="ar"
            >
              {verse.text_uthmani}
            </p>
            {verse.translation && (
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                &ldquo;{verse.translation}&rdquo;
              </p>
            )}
          </>
        ) : verseError ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load today&apos;s ayah from Qur&apos;an.com - try
            refreshing.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted/30" />
            <div className="h-6 w-1/2 animate-pulse rounded bg-muted/30" />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {surah ? `${surah.number}. ${surah.nameEnglish}` : "-"}
          </span>
          <Link
            href={`/surah/${daily.chapter}/#verse-${daily.verseKey}`}
            className="rounded-md border border-amber-500/30 px-3 py-1.5 font-medium text-amber-400 transition-colors hover:bg-amber-500/10"
          >
            Read in context →
          </Link>
        </div>
      </div>

      {/* Streak / personal sidebar */}
      <div className="rounded-xl border border-border bg-card p-5">
        {!isConfigured ? (
          <div className="text-xs text-muted-foreground">
            Configure <code className="font-mono">NEXT_PUBLIC_QF_CLIENT_ID</code>{" "}
            to enable personal features.
          </div>
        ) : !isAuthenticated ? (
          <>
            <p className="mb-1 text-sm font-medium text-foreground">
              Build a daily habit
            </p>
            <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
              Sign in with Quran.com to track your streak, save ayahs, and pick
              up where you left off - synced across devices.
            </p>
            <button
              type="button"
              onClick={() => login("/dashboard")}
              className="w-full rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
            >
              Sign in with Quran.com
            </button>
          </>
        ) : (
          <>
            <div className="mb-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Current streak
              </p>
              <p className="mt-1 font-mono text-4xl font-bold text-amber-500">
                {streak.current}
                <span className="ml-1 text-base text-muted-foreground">
                  day{streak.current === 1 ? "" : "s"}
                </span>
              </p>
              {/* QF's v1 User API doesn't expose a longest-streak claim,
                  so signed-in users hit the `longest === 0` branch and
                  this chip stays hidden. Mock preview (unauthenticated
                  view) sets longest > 0 explicitly so the chip renders.
                  Client-side derivation from paginated sessions was
                  considered but would require fetching the full reading
                  history per page visit - wasteful for a UI chip. */}
              {streak.longest > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Longest: {streak.longest} days
                </p>
              )}
            </div>
            <div className="mb-3">
              <DailyGoalCard variant="sidebar" />
            </div>
            <div className="border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="font-mono text-foreground">
                {readSurahs.size}
              </span>{" "}
              of 114 surahs visited
            </div>
            {apiErrored && (
              <p
                role="status"
                className="mt-3 text-[10px] uppercase tracking-wider text-amber-500/70"
              >
                Sync paused - last known state shown
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
