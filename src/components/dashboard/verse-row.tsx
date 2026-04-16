"use client";

// Per-verse row on /surah/[id]. Client component because it owns
// the tafsir open/closed state and coordinates the action buttons
// with the inline commentary panel that renders below the Arabic +
// translation + transliteration trio.

import { useState } from "react";
import { BookmarkButton } from "@/components/auth/bookmark-button";
import {
  TafsirButton,
  TafsirPanel,
} from "@/components/dashboard/tafsir-button";
import { ShareVerseButton } from "@/components/dashboard/share-verse-button";
import type { Verse } from "@/lib/quran-api";
import type { Tafsir } from "@/lib/quran-api";
import { getHadithForVerse } from "@/lib/data/hadith-by-verse";

interface VerseRowProps {
  verse: Verse;
  surahEnglish?: string;
}

export function VerseRow({ verse, surahEnglish }: VerseRowProps) {
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [tafsir, setTafsir] = useState<Tafsir | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const hadiths = getHadithForVerse(verse.verse_key);

  return (
    <div
      id={`verse-${verse.verse_key}`}
      data-verse-key={verse.verse_key}
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-xs font-medium text-accent-foreground">
          {verse.verse_number}
        </span>
        <div className="flex-1 space-y-2">
          <p
            className="text-right font-mono text-xl leading-loose text-foreground"
            dir="rtl"
            lang="ar"
          >
            {verse.text_uthmani}
          </p>
          {verse.translation && (
            <p className="text-sm leading-relaxed text-foreground/80">
              {verse.translation}
            </p>
          )}
          {verse.transliteration && (
            <p className="font-mono text-xs italic leading-relaxed text-muted-foreground">
              {verse.transliteration}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <BookmarkButton verseKey={verse.verse_key} />
          <TafsirButton
            verseKey={verse.verse_key}
            open={tafsirOpen}
            onToggle={() => setTafsirOpen((prev) => !prev)}
            onTafsirLoaded={(t) => {
              setTafsir(t);
              setFetchAttempted(true);
            }}
          />
          <ShareVerseButton
            verseKey={verse.verse_key}
            arabic={verse.text_uthmani}
            translation={verse.translation}
            surahEnglish={surahEnglish}
          />
        </div>
      </div>
      {tafsirOpen && (
        <TafsirPanel
          verseKey={verse.verse_key}
          tafsir={tafsir}
          loading={!fetchAttempted}
        />
      )}
      {hadiths.length > 0 && (
        <aside className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="font-mono uppercase tracking-[0.2em] text-cyan-400/80">
              Hadith on this ayah
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              {hadiths.length} reference{hadiths.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="space-y-2.5">
            {hadiths.map((h) => (
              <li
                key={h.reference}
                className="rounded-md border border-border bg-card/40 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-relaxed text-foreground/85">
                    {h.summary}
                  </p>
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 shrink-0 items-center rounded-md border border-cyan-500/40 px-2 font-mono text-[11px] text-cyan-400 hover:bg-cyan-500/10"
                    aria-label={`Open ${h.reference} on sunnah.com`}
                  >
                    {h.reference} ↗
                  </a>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {h.collection}
                </p>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
