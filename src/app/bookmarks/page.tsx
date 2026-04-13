"use client";

import Link from "next/link";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useAuth } from "@/lib/auth/auth-context";
import { useBookmarks } from "@/lib/auth/bookmarks-context";
import { surahs } from "@/lib/data/surahs";

function parseVerseKey(key: string): { chapter: number; verse: number } | null {
  const [c, v] = key.split(":").map((part) => parseInt(part, 10));
  if (Number.isNaN(c) || Number.isNaN(v)) return null;
  return { chapter: c, verse: v };
}

export default function BookmarksPage() {
  const { isAuthenticated, isReady, login } = useAuth();
  const { bookmarks, isLoading, error, toggle } = useBookmarks();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 p-6 pt-16 md:p-10">
        <header className="mb-6">
          <h1 className="font-mono text-3xl font-bold text-amber-500">
            Bookmarks
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ayahs you&apos;ve saved, synced across devices via your Quran
            Foundation account.
          </p>
        </header>

        {!isReady ? (
          <div className="h-32 animate-pulse rounded-lg bg-card/40" />
        ) : !isAuthenticated ? (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            <p className="mb-3">
              Sign in to save ayahs and have them follow you across devices.
            </p>
            <button
              type="button"
              onClick={() => login("/bookmarks")}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
            >
              Sign in with Quran.com
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-lg bg-card/40" />
            <div className="h-20 animate-pulse rounded-lg bg-card/40" />
            <div className="h-20 animate-pulse rounded-lg bg-card/40" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-rose-200">
            {error}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
            <p className="mb-2 text-base text-foreground">No bookmarks yet</p>
            <p>
              Open any{" "}
              <Link
                href="/dashboard"
                className="text-amber-500 underline-offset-4 hover:underline"
              >
                surah
              </Link>{" "}
              and tap the bookmark icon next to an ayah to save it.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {bookmarks.map((bookmark) => {
              const parsed = parseVerseKey(bookmark.verse_key);
              const surah = parsed
                ? surahs.find((s) => s.number === parsed.chapter)
                : null;
              return (
                <li
                  key={bookmark.id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                        {bookmark.verse_key}
                      </div>
                      <div className="text-base font-medium text-foreground">
                        {surah
                          ? `${surah.number}. ${surah.nameEnglish}`
                          : "Unknown surah"}
                      </div>
                      {bookmark.note && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {bookmark.note}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {parsed && (
                        <Link
                          href={`/surah/${parsed.chapter}/#verse-${bookmark.verse_key}`}
                          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-amber-400"
                        >
                          Open
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => toggle(bookmark.verse_key)}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-rose-500/40 hover:text-rose-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
