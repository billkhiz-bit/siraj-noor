"use client";

// Floating reading-progress indicator for /surah/[id]. Watches every
// verse row via IntersectionObserver and marks a verse as "read"
// once it's been in viewport for long enough to actually be read
// (~1.5s). Shows a small sticky card with N of M verses read and a
// progress bar, updated live as the user scrolls through.
//
// We deliberately do NOT sync this to the Quran Foundation reading
// session API - that endpoint is chapter-granular and firing 286
// POSTs to log individual ayahs of Al-Baqarah would be wasteful.
// This is a purely client-side signal so the reader can feel their
// progress without cost.

import { useEffect, useRef, useState } from "react";
import type { Verse } from "@/lib/quran-api";

interface VerseProgressIndicatorProps {
  verses: Verse[];
}

const DWELL_MS = 1500;

export function VerseProgressIndicator({ verses }: VerseProgressIndicatorProps) {
  const [readCount, setReadCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const readRef = useRef<Set<string>>(new Set());
  const pendingRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const pending = pendingRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const key = entry.target.getAttribute("data-verse-key");
          if (!key) continue;
          if (readRef.current.has(key)) continue;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Start a dwell timer - verse must stay in view DWELL_MS to count
            if (!pending.has(key)) {
              const timer = window.setTimeout(() => {
                readRef.current.add(key);
                pending.delete(key);
                setReadCount(readRef.current.size);
              }, DWELL_MS);
              pending.set(key, timer);
            }
          } else {
            // Left view before dwell completed - clear the pending timer
            const timer = pending.get(key);
            if (timer !== undefined) {
              window.clearTimeout(timer);
              pending.delete(key);
            }
          }
        }
      },
      { threshold: [0, 0.5] }
    );

    const rows = document.querySelectorAll<HTMLElement>("[data-verse-key]");
    rows.forEach((row) => observer.observe(row));

    // Show the indicator once the user has actually scrolled past
    // the header into the verse list - avoids a distracting pop-in
    // before reading begins.
    const firstVerse = rows[0];
    let revealObserver: IntersectionObserver | null = null;
    if (firstVerse) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setVisible(true);
            revealObserver?.disconnect();
            revealObserver = null;
          }
        },
        { threshold: 0 }
      );
      revealObserver.observe(firstVerse);
    }

    return () => {
      observer.disconnect();
      revealObserver?.disconnect();
      pending.forEach((timer) => window.clearTimeout(timer));
      pending.clear();
    };
  }, [verses.length]);

  if (!visible || verses.length === 0) return null;

  const percent = Math.round((readCount / verses.length) * 100);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Reading progress: ${readCount} of ${verses.length} verses read`}
      className="pointer-events-none sticky top-16 z-20 mx-auto -mt-6 mb-4 w-full max-w-xs rounded-full border border-amber-500/30 bg-background/90 px-4 py-2 backdrop-blur-md md:top-4"
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/80">
          Read
        </span>
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted/40">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-xs text-foreground tabular-nums">
          {readCount}
          <span className="text-muted-foreground">/{verses.length}</span>
        </span>
      </div>
    </div>
  );
}
