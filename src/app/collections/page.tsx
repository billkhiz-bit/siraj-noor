"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { useAuth } from "@/lib/auth/auth-context";

export default function CollectionsPage() {
  const { isAuthenticated, login } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10">
        <header className="mb-6">
          <h1 className="font-mono text-3xl font-bold text-amber-500">
            Collections
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated sets of ayahs — themed, personal, shareable.
          </p>
        </header>

        {!isAuthenticated ? (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            <p className="mb-3">
              Sign in to create collections and organise ayahs your own way.
            </p>
            <button
              type="button"
              onClick={() => login("/collections")}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
            >
              Sign in with Quran.com
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
            3D collections shelf — coming next.
          </div>
        )}
      </main>
    </div>
  );
}
