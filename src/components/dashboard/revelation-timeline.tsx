"use client";

// Revelation timeline scrubber. Horizontal slider along the dashboard
// showing all 114 surahs in chronological revelation order (not the
// mushaf's canonical order - the order in which they were revealed
// to the Prophet ﷺ between 610 and 632 CE). Dragging the playhead
// visually spreads the reveal: each surah lights up in amber as it
// crosses the playhead, and the Meccan-to-Medinan transition at
// the Hijrah (revelation #88 in standard sequencing - just before
// Al-Baqarah) shows as a colour shift from cyan to violet.
//
// Intentionally kept 2D and independent of the 3D Surah Ring -
// modifying the ring's reveal state mid-scene was too risky this
// close to submission. The scrubber communicates the same insight
// standalone.

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { surahs, type Surah } from "@/lib/data/surahs";

// Playback speed presets. 1x = ~18 seconds for the full 114-surah
// sweep (160ms per surah). 0.5x gives you space to read each
// revelation's name; 4x is useful for a quick re-scrub or as a
// time-lapse demo on a video. Milliseconds per step are rounded
// to whole numbers so the RAF scheduling stays predictable.
const PLAYBACK_SPEEDS = [
  { label: "0.5×", value: 0.5, msPerStep: 320 },
  { label: "1×", value: 1, msPerStep: 160 },
  { label: "2×", value: 2, msPerStep: 80 },
  { label: "4×", value: 4, msPerStep: 40 },
] as const;

type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number]["value"];

function classify(
  surah: Surah,
  revealedCount: number,
  playheadIdx: number
): "past" | "current" | "future" {
  const idx = surah.revelationOrder - 1;
  if (idx === playheadIdx) return "current";
  if (idx < revealedCount) return "past";
  return "future";
}

export function RevelationTimeline() {
  const ordered = useMemo(
    () => [...surahs].sort((a, b) => a.revelationOrder - b.revelationOrder),
    []
  );
  const [playheadIdx, setPlayheadIdx] = useState(ordered.length - 1); // default: everything revealed
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const rafRef = useRef<number | null>(null);
  // Kept in sync with speed state so the RAF loop reads the latest
  // value without having to be torn down and restarted when the
  // user changes speed mid-playback.
  const speedRef = useRef<PlaybackSpeed>(1);

  const revealedCount = playheadIdx + 1;
  const current = ordered[playheadIdx];

  // Meccan/Medinan split point for colour transition. The first Medinan
  // surah in revelation order is Al-Baqarah (revelationOrder 87 in the
  // standard sequence), so anything before index 86 is Meccan era.
  const firstMedinanIdx = ordered.findIndex((s) => s.type === "medinan");

  function playPause() {
    if (autoPlaying) {
      setAutoPlaying(false);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    setAutoPlaying(true);
    // Start from beginning if we're at the end
    if (playheadIdx >= ordered.length - 1) setPlayheadIdx(0);

    let last = performance.now();
    const step = (now: number) => {
      const elapsed = now - last;
      // Interval scales with playback speed. Reading speedRef.current
      // at each tick means in-flight speed changes take effect on the
      // next frame without resetting the animation.
      const currentMsPerStep =
        PLAYBACK_SPEEDS.find((s) => s.value === speedRef.current)?.msPerStep ??
        160;
      if (elapsed >= currentMsPerStep) {
        last = now;
        setPlayheadIdx((prev) => {
          const next = prev + 1;
          if (next >= ordered.length) {
            setAutoPlaying(false);
            rafRef.current = null;
            return ordered.length - 1;
          }
          return next;
        });
      }
      if (rafRef.current !== null) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }

  function handleSpeedChange(next: PlaybackSpeed) {
    setSpeed(next);
    speedRef.current = next;
  }

  return (
    <section
      aria-label="Revelation timeline"
      className="mb-6 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] via-card to-card p-5"
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/80">
            Revelation timeline
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            Watch the Qur&apos;an arrive
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            All 114 surahs in chronological revelation order. The colour shift
            marks the Hijrah, after which the Medinan surahs begin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Playback speed"
            className="flex items-center rounded-md border border-border bg-card/60 p-0.5"
          >
            {PLAYBACK_SPEEDS.map((preset) => {
              const isActive = speed === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleSpeedChange(preset.value)}
                  aria-pressed={isActive}
                  aria-label={`Set playback speed to ${preset.label}`}
                  className={`inline-flex h-10 min-w-[44px] items-center justify-center rounded-sm px-2 font-mono text-xs font-medium transition-colors md:h-8 ${
                    isActive
                      ? "bg-amber-500/20 text-amber-300"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={playPause}
            aria-label={
              autoPlaying ? "Pause timeline sweep" : "Play timeline sweep"
            }
            className="inline-flex h-11 items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-4 text-xs font-semibold uppercase tracking-wider text-amber-400 transition-colors hover:bg-amber-500/20 md:h-9"
          >
            {autoPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      {/* Current surah callout */}
      {current && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-mono text-xs text-muted-foreground">
            #{current.revelationOrder} revealed:
          </span>
          <Link
            href={`/surah/${current.number}`}
            className="font-semibold text-foreground underline-offset-4 hover:underline hover:text-amber-400"
          >
            {current.number}. {current.nameEnglish}
          </Link>
          <span
            className="font-mono text-sm text-muted-foreground"
            dir="rtl"
            lang="ar"
          >
            {current.nameArabic}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
              current.type === "meccan"
                ? "bg-cyan-500/20 text-cyan-300"
                : "bg-violet-500/20 text-violet-300"
            }`}
          >
            {current.type}
          </span>
          <span className="text-xs text-muted-foreground">
            {current.ayatCount} ayat
          </span>
        </div>
      )}

      {/* Timeline strip */}
      <div className="relative h-12 w-full">
        {/* Hijrah marker (vertical line at the Meccan → Medinan boundary) */}
        {firstMedinanIdx > 0 && (
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-amber-500/40"
            style={{
              left: `${(firstMedinanIdx / (ordered.length - 1)) * 100}%`,
            }}
            aria-hidden="true"
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-mono uppercase tracking-wider text-amber-500/60">
              Hijrah
            </div>
          </div>
        )}

        {/* Tick rail */}
        <div className="absolute inset-x-0 top-5 flex h-2 items-end gap-[1px]">
          {ordered.map((surah) => {
            const state = classify(surah, revealedCount, playheadIdx);
            const colour =
              state === "future"
                ? "rgba(148, 163, 184, 0.15)"
                : surah.type === "meccan"
                  ? state === "current"
                    ? "#22d3ee"
                    : "rgba(34, 211, 238, 0.55)"
                  : state === "current"
                    ? "#a78bfa"
                    : "rgba(167, 139, 250, 0.55)";
            const height = state === "current" ? "100%" : "70%";
            return (
              <div
                key={surah.number}
                className="flex-1"
                style={{
                  height,
                  backgroundColor: colour,
                  minWidth: "2px",
                  transition: "background-color 180ms ease",
                }}
                title={`${surah.revelationOrder}. ${surah.nameEnglish}`}
              />
            );
          })}
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={ordered.length - 1}
        value={playheadIdx}
        onChange={(e) => {
          setAutoPlaying(false);
          if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
          setPlayheadIdx(Number(e.target.value));
        }}
        aria-label="Scrub through revelation order"
        className="mt-2 w-full accent-amber-500"
      />

      <div className="mt-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <span>1. Al-&apos;Alaq (610 CE)</span>
        <span>
          {revealedCount} of {ordered.length} revealed
        </span>
        <span>114. Al-Nasr (632 CE)</span>
      </div>
    </section>
  );
}
