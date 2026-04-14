"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useAuth } from "@/lib/auth/auth-context";
import { useCollections } from "@/lib/auth/collections-context";
import { MOCK_COLLECTIONS } from "@/lib/data/mock-personal-data";
import type { Collection } from "@/lib/qf-user-api";

type DisplayMode =
  | "loading"
  | "preview-signed-out"
  | "preview-api-down"
  | "empty"
  | "live";

export default function CollectionsPage() {
  const { isAuthenticated, isReady, login } = useAuth();
  const { collections, isLoading, error, create, remove } = useCollections();
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!draftName.trim()) return;
    await create(draftName, draftDescription || undefined);
    setDraftName("");
    setDraftDescription("");
  }

  const mode: DisplayMode = !isReady
    ? "loading"
    : !isAuthenticated
      ? "preview-signed-out"
      : error
        ? "preview-api-down"
        : isLoading && collections.length === 0
          ? "loading"
          : collections.length === 0
            ? "empty"
            : "live";

  const displayCollections: Collection[] =
    mode === "preview-signed-out" || mode === "preview-api-down"
      ? MOCK_COLLECTIONS
      : collections;

  const isPreview =
    mode === "preview-signed-out" || mode === "preview-api-down";

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 pt-16 md:p-10">
        <header className="mb-6">
          <h1 className="font-mono text-3xl font-bold text-amber-500">
            Collections
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated sets of ayahs — themed, personal, and synced via your
            Quran.com account.
          </p>
        </header>

        {mode === "preview-signed-out" && (
          <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-sm">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400">
              Preview
            </div>
            <p className="mb-3 text-foreground/90">
              Collections let you group saved ayahs into themes — like
              &ldquo;Verses for hard days&rdquo; or &ldquo;Before Fajr&rdquo;.
              Sign in to replace this preview with your own.
            </p>
            <button
              type="button"
              onClick={() => login("/collections")}
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
              showing sample collections below. Your real collections will
              reappear as soon as the connection recovers.
            </p>
          </div>
        )}

        {/* Create form — only visible for real live sessions */}
        {!isPreview && isAuthenticated && (
          <form
            onSubmit={handleCreate}
            className="mb-8 rounded-xl border border-border bg-card p-5"
          >
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              New collection
            </h2>
            <div className="grid gap-3 md:grid-cols-[2fr_3fr_auto]">
              <div>
                <label htmlFor="collection-name" className="sr-only">
                  Collection name
                </label>
                <input
                  id="collection-name"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Name (e.g. Patience)"
                  maxLength={80}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                  required
                />
              </div>
              <div>
                <label htmlFor="collection-description" className="sr-only">
                  Collection description
                </label>
                <input
                  id="collection-description"
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  placeholder="Optional description"
                  maxLength={200}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                />
              </div>
              <button
                type="submit"
                disabled={!draftName.trim()}
                className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Shelf */}
        {mode === "loading" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl bg-card/40"
              />
            ))}
          </div>
        ) : mode === "empty" ? (
          <div className="rounded-lg border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
            <p className="mb-1 text-base text-foreground">
              No collections yet
            </p>
            <p>Create your first one above to start grouping ayahs.</p>
          </div>
        ) : (
          <div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            style={{ perspective: "1200px" }}
          >
            {displayCollections.map((collection, i) => (
              <article
                key={collection.id}
                className="group relative rounded-xl border border-border bg-gradient-to-br from-amber-500/5 via-card to-card p-5 shadow-[0_8px_30px_-12px_rgba(245,158,11,0.25)] transition-transform duration-300 motion-safe:hover:-translate-y-1"
                style={{
                  transform: `rotateY(${((i % 3) - 1) * 2}deg)`,
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="font-mono text-lg font-semibold text-amber-400">
                    {collection.name}
                  </h3>
                  {!isPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `Delete the collection "${collection.name}"? This cannot be undone.`
                          )
                        ) {
                          void remove(collection.id);
                        }
                      }}
                      aria-label={`Delete ${collection.name}`}
                      className="text-xs text-muted-foreground/60 transition-colors hover:text-rose-400"
                    >
                      Delete
                    </button>
                  )}
                </div>
                {collection.description && (
                  <p className="mb-4 text-sm text-muted-foreground">
                    {collection.description}
                  </p>
                )}
                <div className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span className="font-mono text-foreground">
                    {collection.bookmarks_count ?? 0}
                  </span>{" "}
                  ayah{collection.bookmarks_count === 1 ? "" : "s"}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
