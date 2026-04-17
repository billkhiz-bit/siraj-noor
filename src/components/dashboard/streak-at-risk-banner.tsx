"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useReadingProgress } from "@/lib/auth/reading-progress-context";

// Streak-at-risk banner. Surfaces on /dashboard when the user has a
// running streak and the clock to their local day boundary is close
// enough that they'd lose it by not reading today. Creates a gentle
// urgency signal without being a notification (no permission prompt,
// no push infrastructure, just a UI card that appears when relevant).
//
// Display logic:
//   - Only shown to signed-in users with current streak > 0.
//   - Most recent reading session timestamp is compared to "now".
//   - If the last read was more than 20 hours ago, the card shows.
//   - If no session exists at all, nothing renders (either the user
//     has never read, which is covered by the Onboarding Checklist,
//     or the API call is still loading).
//
// Timezone-correct "hours until day rollover" is computed against
// the user's local midnight, which is the boundary QF's streak
// endpoint also uses (we send x-timezone on /streaks calls).

const AT_RISK_THRESHOLD_HOURS = 20;

function mostRecentSessionMs(
  sessions: Array<{ created_at?: string }>
): number | null {
  let max = 0;
  for (const s of sessions) {
    if (!s.created_at) continue;
    const ms = new Date(s.created_at).getTime();
    if (Number.isNaN(ms)) continue;
    if (ms > max) max = ms;
  }
  return max > 0 ? max : null;
}

function hoursUntilLocalMidnight(now: Date): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return (midnight.getTime() - now.getTime()) / (1000 * 60 * 60);
}

export function StreakAtRiskBanner() {
  const { isAuthenticated, isReady } = useAuth();
  const { sessions, streak } = useReadingProgress();

  // Re-render every minute so the "X hours until midnight" label
  // stays accurate and the banner shows/hides at the right moment
  // without a full page refresh. nowTick starts at 0 and gets its
  // first real value on mount; with nowTick=0 the `now - lastMs`
  // calculation is negative, so the banner correctly stays hidden
  // until after the first effect tick. Setting Date.now() from
  // inside the effect rather than as a lazy useState initialiser
  // keeps the render path pure.
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNowTick(Date.now());
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Compute eligibility inline. React 19's compiler memoises
  // automatically, so wrapping this in useMemo would trip
  // preserve-manual-memoization without any runtime benefit.
  let state: {
    hoursSinceLast: number;
    hoursLeft: number;
    streakDays: number;
  } | null = null;

  if (isReady && isAuthenticated && streak.current > 0) {
    const lastMs = mostRecentSessionMs(sessions);
    if (lastMs !== null) {
      const now = new Date(nowTick);
      const hoursSinceLast = (now.getTime() - lastMs) / (1000 * 60 * 60);
      if (hoursSinceLast >= AT_RISK_THRESHOLD_HOURS) {
        const hoursLeft = hoursUntilLocalMidnight(now);
        state = {
          hoursSinceLast: Math.round(hoursSinceLast),
          hoursLeft: Math.max(0, Math.floor(hoursLeft)),
          streakDays: streak.current,
        };
      }
    }
  }

  if (!state) return null;

  const { hoursSinceLast, hoursLeft, streakDays } = state;
  const urgency: "low" | "high" =
    hoursLeft <= 3 ? "high" : "low";

  return (
    <aside
      role="status"
      aria-live="polite"
      className={`mb-6 rounded-xl border px-5 py-4 ${
        urgency === "high"
          ? "border-rose-500/40 bg-rose-500/[0.05]"
          : "border-amber-500/40 bg-amber-500/[0.05]"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <p
            className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
              urgency === "high" ? "text-rose-400" : "text-amber-400"
            }`}
          >
            {urgency === "high" ? "Streak at risk" : "Keep your streak alive"}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {streakDays}-day streak. Last read {hoursSinceLast} hours ago.
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {hoursLeft > 0
              ? `Read something in the next ${hoursLeft} hour${
                  hoursLeft === 1 ? "" : "s"
                } to keep today counted.`
              : "Read a surah right now to extend your streak today."}
          </p>
        </div>
        <Link
          href="/dashboard#surah-structure"
          scroll={false}
          className={`inline-flex h-11 shrink-0 items-center justify-center rounded-md px-4 text-xs font-semibold uppercase tracking-wider transition-colors md:h-10 ${
            urgency === "high"
              ? "bg-rose-500 text-black hover:bg-rose-400"
              : "border border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
          }`}
        >
          Pick a surah
        </Link>
      </div>
    </aside>
  );
}
