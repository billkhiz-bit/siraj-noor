"use client";

// Fullscreen celebration overlay that fires once when the user hits
// a streak milestone (7, 30, 100 days). Keyed on the JWT sub claim
// in localStorage so each user gets to experience each milestone
// exactly once. Self-dismisses after ~4s or on click. Intentionally
// subtle - no confetti blasts - to stay coherent with the dark
// amber aesthetic.

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useReadingProgress } from "@/lib/auth/reading-progress-context";

const MILESTONES = [7, 30, 100, 365] as const;
const STORAGE_KEY_PREFIX = "siraj-noor.streak-milestone.";

interface Milestone {
  days: number;
  title: string;
  blurb: string;
}

const MILESTONE_DATA: Record<number, Milestone> = {
  7: {
    days: 7,
    title: "A week of light",
    blurb:
      "Seven consecutive days with the Qur'an. The habit is starting to shape itself around you.",
  },
  30: {
    days: 30,
    title: "Thirty days",
    blurb:
      "A full lunar cycle of reading. This is the rhythm that carries a reader for a lifetime.",
  },
  100: {
    days: 100,
    title: "One hundred",
    blurb:
      "Three months and change. You've built something real. May the next hundred be steadier still.",
  },
  365: {
    days: 365,
    title: "A full year",
    blurb:
      "Every day of the past year, you opened a surah. This is sirah-scale discipline.",
  },
};

export function StreakCelebration() {
  const { user, isReady, isAuthenticated } = useAuth();
  const { streak } = useReadingProgress();
  const [active, setActive] = useState<Milestone | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    const current = streak.current;
    if (current === 0) return;

    const hit = MILESTONES.find((m) => current === m);
    if (!hit) return;

    const sub = user?.sub ?? "anonymous";
    const key = `${STORAGE_KEY_PREFIX}${sub}.${hit}`;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(key) === "true") return;

    localStorage.setItem(key, "true");
    setActive(MILESTONE_DATA[hit]);

    const timer = window.setTimeout(() => setActive(null), 5500);
    return () => window.clearTimeout(timer);
    // streak is a plain StreakInfo object (not a ref) — depending on
    // streak.current is correct and does re-trigger on context updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isAuthenticated, streak.current, user?.sub]);

  if (!active) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Streak milestone: ${active.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-500"
      onClick={() => setActive(null)}
    >
      <div className="relative max-w-md px-8 text-center">
        {/* Rings */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="absolute h-64 w-64 animate-ping rounded-full border border-amber-500/40" />
          <div
            className="absolute h-80 w-80 animate-ping rounded-full border border-amber-500/25"
            style={{ animationDelay: "0.4s" }}
          />
          <div
            className="absolute h-96 w-96 animate-ping rounded-full border border-amber-500/15"
            style={{ animationDelay: "0.8s" }}
          />
          <div className="h-40 w-40 rounded-full bg-amber-500/20 blur-2xl" />
        </div>

        <div className="relative">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.3em] text-amber-400">
            Milestone reached
          </div>
          <div className="mb-4 font-mono text-7xl font-bold text-amber-500">
            {active.days}
            <span className="ml-2 text-2xl text-muted-foreground">days</span>
          </div>
          <h2 className="mb-3 text-2xl font-semibold text-foreground">
            {active.title}
          </h2>
          <p className="text-sm leading-relaxed text-foreground/80">
            {active.blurb}
          </p>
          <button
            type="button"
            onClick={() => setActive(null)}
            className="mt-6 inline-flex h-10 items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-4 text-xs font-semibold uppercase tracking-wider text-amber-400 hover:bg-amber-500/20"
          >
            Continue reading
          </button>
        </div>
      </div>
    </div>
  );
}
