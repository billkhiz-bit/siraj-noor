"use client";

// Per-verse tafsir toggle. The button lives in the verse row's action
// column alongside BookmarkButton. The actual expanded commentary
// panel renders below the row via the VerseRow wrapper — we only
// own the button + fetch here so the row component can lay the
// panel out with full width rather than being constrained to the
// narrow action-column grid cell.

import { useState } from "react";
import { fetchTafsir, type Tafsir } from "@/lib/quran-api";

interface TafsirButtonProps {
  verseKey: string;
  open: boolean;
  onToggle: () => void;
  onTafsirLoaded: (tafsir: Tafsir | null) => void;
}

export function TafsirButton({
  verseKey,
  open,
  onToggle,
  onTafsirLoaded,
}: TafsirButtonProps) {
  const [loading, setLoading] = useState(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  const handleClick = async () => {
    onToggle();
    if (fetchedOnce || loading || open) return;
    setLoading(true);
    const result = await fetchTafsir(verseKey);
    onTafsirLoaded(result);
    setFetchedOnce(true);
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-expanded={open}
      aria-label={
        open
          ? `Hide commentary on ayah ${verseKey}`
          : `Show commentary on ayah ${verseKey}`
      }
      className={
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-xs font-medium transition-colors md:h-8 md:w-8 " +
        (open
          ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
          : "border-border text-muted-foreground hover:border-amber-500/40 hover:text-amber-400")
      }
      title={open ? "Hide commentary" : "Show commentary"}
    >
      {loading ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          className="animate-spin"
          aria-hidden="true"
        >
          <circle
            cx="7"
            cy="7"
            r="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="24"
            strokeDashoffset="10"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 3h4a2 2 0 0 1 2 2v8a1.5 1.5 0 0 0-1.5-1.5H2zM14 3h-4a2 2 0 0 0-2 2v8a1.5 1.5 0 0 1 1.5-1.5H14z" />
        </svg>
      )}
    </button>
  );
}

interface TafsirPanelProps {
  verseKey: string;
  tafsir: Tafsir | null;
  loading: boolean;
}

export function TafsirPanel({ verseKey, tafsir, loading }: TafsirPanelProps) {
  return (
    <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.03] p-4">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-mono uppercase tracking-[0.2em] text-amber-500/80">
          Commentary · {verseKey}
        </span>
        <span className="text-muted-foreground">
          {tafsir?.name ?? "Tafsir"}
        </span>
      </div>
      {loading && (
        <div
          className="space-y-2"
          role="status"
          aria-label="Loading commentary"
        >
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted/30" />
          <div className="h-3 w-full animate-pulse rounded bg-muted/30" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted/30" />
        </div>
      )}
      {!loading && !tafsir && (
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load commentary for this ayah right now.
        </p>
      )}
      {!loading && tafsir && (
        <div
          className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed text-foreground/85"
          // Tafsir text is pre-sanitised HTML from Qur'an.com's API —
          // their sanitisation pipeline strips scripts and attributes.
          dangerouslySetInnerHTML={{ __html: tafsir.text }}
        />
      )}
    </div>
  );
}
