"use client";

import Link from "next/link";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useAuth } from "@/lib/auth/auth-context";
import { useBookmarks } from "@/lib/auth/bookmarks-context";
import { surahs } from "@/lib/data/surahs";
import { MOCK_BOOKMARKS } from "@/lib/data/mock-personal-data";
import type { Bookmark } from "@/lib/qf-user-api";

function parseVerseKey(key: string): { chapter: number; verse: number } | null {
  const [c, v] = key.split(":").map((part) => parseInt(part, 10));
  if (Number.isNaN(c) || Number.isNaN(v)) return null;
  return { chapter: c, verse: v };
}

type DisplayMode = "loading" | "preview-signed-out" | "preview-api-down" | "empty" | "live";

export default function BookmarksPage() {
  const { isAuthenticated, isReady, login } = useAuth();
  const { bookmarks, isLoading, error, toggle } = useBookmarks();

  const mode: DisplayMode = !isReady
    ? "loading"
    : !isAuthenticated
      ? "preview-signed-out"
      : error
        ? "preview-api-down"
        : isLoading
          ? "loading"
          : bookmarks.length === 0
            ? "empty"
            : "live";

  const displayBookmarks: Bookmark[] =
    mode === "preview-signed-out" || mode === "preview-api-down"
      ? MOCK_BOOKMARKS
      : bookmarks;

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

        {/* Preview banner — only appears in preview modes */}
        {mode === "preview-signed-out" && (
          <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-sm">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400">
              Preview
            </div>
            <p className="mb-3 text-foreground/90">
              Here&apos;s what Bookmarks looks like once you start saving ayahs.
              Sign in with your Quran.com account to replace this preview with
              your real saves, synced across devices.
            </p>
            <button
              type="button"
              onClick={() => login("/bookmarks")}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
            >
              Sign in with Quran.com
            </button>
          </div>
        )}

        {mode === "preview-api-down" && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-sm"
          >
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400">
              Showing sample data
            </div>
            <p className="text-foreground/90">
              Couldn&apos;t reach Quran Foundation just now, so we&apos;re
              showing sample bookmarks below. Your real saves will reappear
              automatically as soon as the connection recovers.
            </p>
          </div>
        )}

        {mode === "loading" ? (
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-lg bg-card/40" />
            <div className="h-20 animate-pulse rounded-lg bg-card/40" />
            <div className="h-20 animate-pulse rounded-lg bg-card/40" />
          </div>
        ) : mode === "empty" ? (
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
            {displayBookmarks.map((bookmark) => {
              const parsed = parseVerseKey(bookmark.verse_key);
              const surah = parsed
                ? surahs.find((s) => s.number === parsed.chapter)
                : null;
              const isPreviewRow =
                mode === "preview-signed-out" || mode === "preview-api-down";

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
                          className="inline-flex h-11 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-amber-400 md:h-8"
                        >
                          Open
                        </Link>
                      )}
                      {!isPreviewRow && (
                        <button
                          type="button"
                          onClick={() => toggle(bookmark.verse_key)}
                          className="inline-flex h-11 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-rose-500/40 hover:text-rose-400 md:h-8"
                        >
                          Remove
                        </button>
                      )}
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
