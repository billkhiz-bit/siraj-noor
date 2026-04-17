"use client";

// Chapter-level audio player for surah detail pages. Loads a single
// mp3 from Qur'an.com's chapter_recitations endpoint (Mishary al-Afasy
// by default). Keeps to a native <audio> element so we inherit the
// browser's built-in keyboard controls, volume remembering, media
// session API integration (iOS lock-screen controls work
// automatically), and accessible transport surface - no bespoke
// state machine needed.

import { useEffect, useState } from "react";
import { fetchChapterAudio, type ChapterAudio } from "@/lib/quran-api";

interface ChapterAudioPlayerProps {
  chapterId: number;
  surahName: string;
}

type Status = "idle" | "loading" | "ready" | "error";

export function ChapterAudioPlayer({
  chapterId,
  surahName,
}: ChapterAudioPlayerProps) {
  const [audio, setAudio] = useState<ChapterAudio | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    let cancelled = false;
    // Reset to loading when chapterId changes so the UI doesn't flash the
    // previous surah's player during the fetch transition. setState-in-effect
    // is intentional here; the async .then() paths aren't flagged by the rule.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading");
    fetchChapterAudio(chapterId)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setStatus("error");
          setAudio(null);
          return;
        }
        setAudio(result);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  if (status === "error") {
    return (
      <div
        role="status"
        className="mt-2 rounded-md border border-dashed border-border bg-card/40 px-3 py-2 text-xs text-muted-foreground"
      >
        Recitation audio is unavailable right now.
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] via-card to-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <div className="font-mono uppercase tracking-[0.2em] text-amber-500/80">
          Recitation
        </div>
        <div className="text-muted-foreground">Mishary al-Afasy</div>
      </div>
      {status === "loading" || !audio ? (
        <div
          role="status"
          aria-label={`Loading recitation for ${surahName}`}
          className="h-10 animate-pulse rounded bg-muted/30"
        />
      ) : (
        <audio
          controls
          preload="metadata"
          src={audio.audioUrl}
          className="w-full"
          aria-label={`Recitation of ${surahName}`}
        >
          Your browser does not support audio playback. Download the recitation
          at{" "}
          <a
            href={audio.audioUrl}
            className="text-amber-500 underline"
            target="_blank"
            rel="noreferrer"
          >
            this URL
          </a>
          .
        </audio>
      )}
    </div>
  );
}
