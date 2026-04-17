"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useReadingProgress } from "@/lib/auth/reading-progress-context";
import { useGoals } from "@/lib/auth/goals-context";
import { qfApi } from "@/lib/qf-user-api";

interface ReadingTrackerProps {
  chapterId: number;
  // Total ayat in the surah. Used to build the activity-day range
  // string (e.g. "1:1-1:7" for Al-Fatiha). Overestimates the range
  // on a short visit, but seconds is the authoritative signal for
  // QURAN_TIME goal progress, so the range approximation is fine.
  ayatCount: number;
}

// Minimum visit time before we log an activity-day entry. Below
// this, the visit is too short to meaningfully count toward a
// reading goal (user is just browsing). Prevents the activity log
// from filling with 1- and 2-second pings.
const MIN_LOG_SECONDS = 10;

// Upper bound on a single activity-day POST. If the tab sat open
// for hours, we don't want to submit the full elapsed time as
// reading time. 30 minutes is a generous-but-sane per-session cap.
const MAX_LOG_SECONDS = 1800;

// How often to flush elapsed reading time to the server while the
// user is actively on the page. Short enough that goal progress
// updates feel responsive (user sees ticks on /dashboard focus
// return), long enough that we don't hammer QF with 1-second pings.
// Combined with the unmount/visibility flush below: if the user
// navigates away after 45 seconds, both the 30s periodic tick and
// the remaining 15s at unmount are captured.
const PERIODIC_FLUSH_MS = 30_000;

export function ReadingTracker({ chapterId, ayatCount }: ReadingTrackerProps) {
  const { isAuthenticated, isReady } = useAuth();
  const { recordRead } = useReadingProgress();
  const { reload: reloadGoals } = useGoals();

  // Tracks which chapters have had their reading-session recorded in
  // this mount. Set BEFORE the POST resolves to prevent double-fires
  // across re-renders; rolled back on failure so the next effect
  // tick can retry.
  const sessionClaimedRef = useRef<Set<number>>(new Set());

  // Tracks whether activity-day has been flushed for the current
  // chapter visit. Reset when chapterId changes.
  const activityFlushedRef = useRef(false);

  // Mount time for elapsed calculation. Initialised to 0 and
  // populated inside the time-tracking effect below. Calling
  // Date.now() as a useRef initial value is impure (re-evaluated
  // every render even though only the first result is retained)
  // and fails the react-hooks/purity lint.
  const startRef = useRef<number>(0);

  // Record the reading session once per chapter mount. This is the
  // existing /reading-sessions logging, unchanged.
  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    if (sessionClaimedRef.current.has(chapterId)) return;

    sessionClaimedRef.current.add(chapterId);
    void recordRead(chapterId).then((ok) => {
      if (!ok) sessionClaimedRef.current.delete(chapterId);
    });
  }, [chapterId, isAuthenticated, isReady, recordRead]);

  // Time-tracking effect: logs activity-day periodically while the
  // user is on the page, and flushes any remainder on tab-hidden or
  // unmount. Periodic logging means goal progress updates feel
  // responsive (a 30-second read → 30 seconds reflected in the card
  // within ~30 seconds) rather than requiring a page navigation.
  useEffect(() => {
    if (!isReady || !isAuthenticated) return;

    startRef.current = Date.now();
    activityFlushedRef.current = false;

    // Flush accumulated reading time to the server. Resets the
    // window afterwards so the next tick only counts new seconds.
    // Guarded against concurrent re-entry via a boolean flag since
    // the periodic timer, visibilitychange, pagehide, and unmount
    // can all fire near-simultaneously (e.g. closing a tab).
    let inFlight = false;
    const flushActivity = (options: { final?: boolean } = {}) => {
      if (inFlight) return;
      if (!options.final && activityFlushedRef.current) {
        // On periodic flushes we want to allow repeated flushes,
        // so we reset the guard each time. On final flush
        // (unmount/hidden) we use the guard to prevent double-fires.
      }
      const elapsedSeconds = Math.floor(
        (Date.now() - startRef.current) / 1000
      );
      if (elapsedSeconds < MIN_LOG_SECONDS) return;
      if (options.final) activityFlushedRef.current = true;

      const range = `${chapterId}:1-${chapterId}:${ayatCount}`;
      const clamped = Math.min(elapsedSeconds, MAX_LOG_SECONDS);
      // Reset the clock for the next periodic tick. The server
      // aggregates multiple activity-day POSTs for the same day,
      // so N separate 30-second entries add up correctly.
      startRef.current = Date.now();
      inFlight = true;

      qfApi
        .logActivity(clamped, [range], { keepalive: options.final })
        .then(() => {
          void reloadGoals();
        })
        .catch((err) => {
          console.error("[ReadingTracker] activity-day log failed:", err);
        })
        .finally(() => {
          inFlight = false;
        });
    };

    const periodicId = window.setInterval(
      () => flushActivity({ final: false }),
      PERIODIC_FLUSH_MS
    );

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushActivity({ final: true });
      }
    };

    // pagehide fires more reliably than unload on mobile Safari,
    // and sits alongside visibilitychange for desktop browsers that
    // don't fire hidden when a tab closes.
    const onPageHide = () => flushActivity({ final: true });

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(periodicId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      // Flush any remainder on client-side navigation too.
      flushActivity({ final: true });
    };
  }, [chapterId, ayatCount, isAuthenticated, isReady, reloadGoals]);

  return null;
}
