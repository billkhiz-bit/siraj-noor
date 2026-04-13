"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { useAuth } from "@/lib/auth/auth-context";

export default function ActivityPage() {
  const { isAuthenticated, login } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10">
        <header className="mb-6">
          <h1 className="font-mono text-3xl font-bold text-amber-500">
            Activity
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reading streak, goals, and your year in the Qur&apos;an as a 3D
            heatmap.
          </p>
        </header>

        {!isAuthenticated ? (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            <p className="mb-3">
              Sign in to start tracking your reading streak and goals.
            </p>
            <button
              type="button"
              onClick={() => login("/activity")}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
            >
              Sign in with Quran.com
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">
            Activity dashboard — coming next.
          </div>
        )}
      </main>
    </div>
  );
}
