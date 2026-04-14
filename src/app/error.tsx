"use client";

// Root-level error boundary — catches any thrown error anywhere in the
// app tree that hasn't been handled by a more specific segment boundary.
// Exists primarily so we never again see Next.js's generic "This page
// couldn't load" with no details; any crash shows the actual error name,
// message, stack, and digest so we can debug from logs or screenshots.

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[app/error.tsx] Root error boundary caught:", error);
    if (error.stack) console.error("[app/error.tsx] Stack:", error.stack);
    if (error.digest) console.error("[app/error.tsx] Digest:", error.digest);
  }, [error]);

  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const search =
    typeof window !== "undefined" ? window.location.search : "";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-8 text-center">
      <div className="font-mono text-3xl font-bold text-amber-500">
        Siraj Noor
      </div>

      <div
        role="alert"
        className="max-w-xl rounded-lg border border-rose-500/40 bg-rose-500/5 px-6 py-5 text-left text-sm"
      >
        <div className="mb-2 font-medium text-rose-400">
          Something went wrong
        </div>
        <p className="mb-3 text-muted-foreground">
          Siraj Noor hit an unexpected error. Details below — please
          screenshot if you&apos;re reporting it.
        </p>

        <dl className="space-y-3 font-mono text-xs">
          <div>
            <dt className="text-muted-foreground/70">Path</dt>
            <dd className="mt-0.5 break-all text-foreground">
              {pathname || "(unknown)"}
              {search}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground/70">Error name</dt>
            <dd className="mt-0.5 break-all text-foreground">
              {error.name || "(unset)"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground/70">Error message</dt>
            <dd className="mt-0.5 break-all text-foreground">
              {error.message || "(empty)"}
            </dd>
          </div>
          {error.digest && (
            <div>
              <dt className="text-muted-foreground/70">Next.js digest</dt>
              <dd className="mt-0.5 break-all text-foreground">
                {error.digest}
              </dd>
            </div>
          )}
          {error.stack && (
            <div>
              <dt className="text-muted-foreground/70">Stack</dt>
              <dd className="mt-0.5 max-h-56 overflow-auto whitespace-pre-wrap break-all text-foreground/80">
                {error.stack}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Retry
          </button>
          <Link
            href="/"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
