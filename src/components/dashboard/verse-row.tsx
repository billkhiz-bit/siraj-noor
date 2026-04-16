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

interface VerseRowProps {
  verse: Verse;
  surahEnglish?: string;
}

export function VerseRow({ verse, surahEnglish }: VerseRowProps) {
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [tafsir, setTafsir] = useState<Tafsir | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  return (
    <div
      id={`verse-${verse.verse_key}`}
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
    </div>
  );
}
