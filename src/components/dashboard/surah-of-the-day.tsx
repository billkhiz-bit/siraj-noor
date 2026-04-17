"use client";

import Link from "next/link";
import { useMemo } from "react";
import { pickDailySurahNumber } from "@/lib/daily-ayah";
import { surahs } from "@/lib/data/surahs";

// Surah-of-the-Day card. Shows one deterministically-chosen surah
// per UTC day on the dashboard. The goal is a gentle daily-return
// anchor: users who visit every day get a fresh recommendation
// without the app having to build a personalisation model around
// their reading history. Because the pick is deterministic on the
// date, cold-cache visitors and returning users see the same thing
// in the same 24-hour window, which also makes the card safe to
// server-render if we ever move it out of a client boundary.
//
// Positioned above the Surah Structure ring on /dashboard so it
// sits alongside the Ayah of the Day card but reads as a
// complementary prompt ("try reading this today") rather than a
// duplicate.
export function SurahOfTheDay() {
  const surah = useMemo(() => {
    const number = pickDailySurahNumber();
    return surahs.find((s) => s.number === number) ?? surahs[0];
  }, []);

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
    <aside
      aria-labelledby="surah-of-day-heading"
      className="mb-6 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.04] via-card to-card p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <p
            id="surah-of-day-heading"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/80"
          >
            Surah of the day · {todayLabel}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-2xl font-bold text-foreground">
              {surah.number}. {surah.nameEnglish}
            </h2>
            <span
              className="font-mono text-xl text-muted-foreground"
              dir="rtl"
              lang="ar"
            >
              {surah.nameArabic}
            </span>
          </div>
          <p className="mt-1 text-sm italic text-muted-foreground">
            &ldquo;{surah.meaning}&rdquo;
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono uppercase tracking-wider ${
                surah.type === "meccan"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "bg-violet-500/20 text-violet-300"
              }`}
            >
              {surah.type}
            </span>
            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 font-mono uppercase tracking-wider text-muted-foreground">
              {surah.ayatCount} ayat
            </span>
            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 font-mono uppercase tracking-wider text-muted-foreground">
              Revealed #{surah.revelationOrder}
            </span>
          </div>
        </div>
        <Link
          href={`/surah/${surah.number}`}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10 px-5 text-xs font-semibold uppercase tracking-wider text-amber-400 transition-colors hover:bg-amber-500/20 md:h-10"
        >
          Read {surah.nameEnglish} →
        </Link>
      </div>
    </aside>
  );
}
