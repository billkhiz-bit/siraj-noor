"use client";

// Lexical root explorer. A grid of the top triliteral roots in the
// Qur'an with their occurrence counts, glosses, and an exemplar
// verse that anchors each root to somewhere readers know. Clicking
// a root expands it to show the exemplar and link through to the
// surah detail page. Pairs with the Word Frequency 3D sphere on
// /words - the sphere shows individual words, this grid shows the
// deeper morphological structure.

import { useState } from "react";
import Link from "next/link";
import { TOP_QURAN_ROOTS, type QuranRoot } from "@/lib/data/quran-roots";

function parseVerse(key: string): { chapter: number; verse: number } | null {
  const [c, v] = key.split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(c) || Number.isNaN(v)) return null;
  return { chapter: c, verse: v };
}

export function RootExplorer() {
  const [selected, setSelected] = useState<QuranRoot | null>(null);

  return (
    <section
      aria-labelledby="root-explorer-heading"
      className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] via-card to-card p-5"
    >
      <div className="mb-4">
        <h2
          id="root-explorer-heading"
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/80"
        >
          Root explorer
        </h2>
        <p className="mt-1 text-base font-semibold text-foreground">
          The lexical spine of the Qur&apos;an
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Arabic words are built from triliteral roots - three consonants that
          bear the core meaning across every verb form and noun derived from
          them. The roots below recur most across the Qur&apos;anic text.
          Counts are from the Quranic Arabic Corpus.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {TOP_QURAN_ROOTS.map((root) => {
          const isSelected = selected?.arabic === root.arabic;
          return (
            <button
              key={root.arabic}
              type="button"
              onClick={() =>
                setSelected((prev) =>
                  prev?.arabic === root.arabic ? null : root
                )
              }
              aria-pressed={isSelected}
              className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? "border-amber-500/60 bg-amber-500/10"
                  : "border-border bg-card hover:border-amber-500/40 hover:bg-amber-500/5"
              }`}
            >
              <span
                className="font-mono text-lg text-amber-400"
                dir="rtl"
                lang="ar"
              >
                {root.arabic}
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                {root.transliteration}
              </span>
              <span className="text-xs font-medium text-foreground/90">
                {root.meaning}
              </span>
              <span className="mt-auto font-mono text-[11px] text-amber-500/70 tabular-nums">
                {root.occurrences.toLocaleString()}×
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          aria-live="polite"
          className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/[0.04] p-4"
        >
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-3">
              <span
                className="font-mono text-3xl text-amber-400"
                dir="rtl"
                lang="ar"
              >
                {selected.arabic}
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {selected.transliteration}
              </span>
              <span className="text-sm font-medium text-foreground">
                {selected.meaning}
              </span>
            </div>
            <span className="font-mono text-sm text-amber-500/80 tabular-nums">
              {selected.occurrences.toLocaleString()} occurrences
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/85">
            <span className="font-mono text-xs text-amber-500/70 mr-2">
              {selected.exemplar.verseKey} -
            </span>
            {selected.exemplar.reason}
          </p>
          {(() => {
            const parsed = parseVerse(selected.exemplar.verseKey);
            if (!parsed) return null;
            return (
              <div className="mt-3">
                <Link
                  href={`/surah/${parsed.chapter}/#verse-${selected.exemplar.verseKey}`}
                  className="inline-flex h-10 items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-semibold uppercase tracking-wider text-amber-400 transition-colors hover:bg-amber-500/20"
                >
                  Read this verse →
                </Link>
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}
