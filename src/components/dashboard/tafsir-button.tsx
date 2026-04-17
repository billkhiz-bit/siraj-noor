"use client";

// Per-verse tafsir toggle. The button lives in the verse row's action
// column alongside BookmarkButton. The actual expanded commentary
// panel renders below the row via the VerseRow wrapper - we only
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

// Per-ayah commentary panel. Renders below a verse row on
// /surah/[id] when the user toggles the tafsir button. The content
// is scholarly commentary (Sayyid Maududi by default) and the layout
// aims to read like a book page rather than a UI caption:
//   - serif stack for the body so it sits apart from the sans-serif
//     UI chrome and feels like scholarly prose
//   - amber "margin rail" on the left that signals "marginal note"
//   - generous line-height and size for long-form reading
//   - scoped typography rules for the HTML elements tafsir actually
//     uses (<p>, <sup>, <em>, <i>, inline Arabic, <blockquote>)
//   - small footer with source attribution and a deep-link back to
//     the full tafsir on Qur'an.com
export function TafsirPanel({ verseKey, tafsir, loading }: TafsirPanelProps) {
  const quranComUrl = `https://quran.com/${verseKey.replace(":", "/")}/tafsirs`;

  return (
    <section
      aria-label={`Commentary on ayah ${verseKey}`}
      className="relative mt-4 overflow-hidden rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.04] via-card to-card shadow-sm shadow-black/10"
    >
      {/* Amber margin rail - evokes the visual language of a scholar's
          marginal note without resorting to a skeuomorphic parchment
          aesthetic that would clash with the rest of the UI. */}
      <div
        aria-hidden="true"
        className="absolute bottom-5 left-0 top-5 w-[3px] rounded-full bg-gradient-to-b from-amber-500/60 via-amber-500/40 to-amber-500/10"
      />

      <div className="px-5 py-5 md:px-8 md:py-6">
        <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border/50 pb-3">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-amber-500/80">
              Commentary
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              On ayah{" "}
              <span className="font-mono text-amber-400">{verseKey}</span>
            </p>
          </div>
          {tafsir?.name && !loading && (
            <p className="text-xs text-foreground/70">
              <span className="text-muted-foreground">by </span>
              {tafsir.name}
            </p>
          )}
        </header>

        {loading && (
          <div
            className="space-y-3"
            role="status"
            aria-label="Loading commentary"
          >
            <div className="h-4 w-11/12 animate-pulse rounded bg-muted/30" />
            <div className="h-4 w-full animate-pulse rounded bg-muted/30" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-muted/30" />
            <div className="h-4 w-9/12 animate-pulse rounded bg-muted/30" />
          </div>
        )}

        {!loading && !tafsir && (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load commentary for this ayah right now.{" "}
            <a
              href={quranComUrl}
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 underline-offset-4 hover:underline"
            >
              Read on Qur&apos;an.com ↗
            </a>
          </p>
        )}

        {!loading && tafsir && (
          <>
            {/* The arbitrary-selector stack below applies scoped
                typography to the HTML tafsir text without needing a
                Tailwind plugin. Each [&_element]: rule targets
                elements inside this article. */}
            <article
              lang={tafsir.language === "english" ? "en" : tafsir.language}
              className={[
                // Base body: serif stack, comfortable size, relaxed leading
                "font-serif text-[15.5px] md:text-[16.5px]",
                "leading-[1.85] tracking-[0.005em] text-foreground/90",
                // First character gets a subtle lift to anchor the eye
                "first-letter:text-[1.35em] first-letter:font-medium first-letter:text-foreground",
                // Paragraphs breathe
                "[&_p]:mb-4 [&_p:last-child]:mb-0",
                // Footnote markers read as markers, not as part of the prose
                "[&_sup]:ml-[1px] [&_sup]:align-super [&_sup]:text-[0.65em]",
                "[&_sup]:font-mono [&_sup]:font-medium [&_sup]:text-amber-500/80",
                // Emphasis and italics stay visible against the slightly
                // muted body colour
                "[&_em]:text-foreground [&_i]:text-foreground",
                // Inline Arabic bumps size slightly and uses the mono
                // stack which has better Arabic-glyph fallback
                "[&_[dir=rtl]]:font-mono [&_[dir=rtl]]:text-[1.05em]",
                "[&_[lang=ar]]:font-mono [&_[lang=ar]]:text-[1.05em]",
                // Block quotes with a left rail matching the panel's
                "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-amber-500/30",
                "[&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-foreground/75",
                // Links inherit the amber accent
                "[&_a]:text-amber-400 [&_a]:underline-offset-4 hover:[&_a]:underline",
              ].join(" ")}
              // Tafsir text is pre-sanitised HTML from Qur'an.com's
              // API - their sanitisation pipeline strips scripts and
              // event-handler attributes.
              dangerouslySetInnerHTML={{ __html: tafsir.text }}
            />

            <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3 text-[10px]">
              <p className="font-mono uppercase tracking-[0.25em] text-muted-foreground/70">
                Source · Qur&apos;an.com tafsirs API
              </p>
              <a
                href={quranComUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono uppercase tracking-[0.2em] text-amber-500/80 underline-offset-4 hover:text-amber-400 hover:underline"
              >
                Read full ↗
              </a>
            </footer>
          </>
        )}
      </div>
    </section>
  );
}
