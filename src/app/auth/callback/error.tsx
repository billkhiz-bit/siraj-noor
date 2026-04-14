"use client";

// Route-level error boundary for the /auth/callback/ segment. Next.js App
// Router catches thrown errors from the page component or its data/render
// paths and mounts this component instead of the generic built-in fallback.
//
// Why this exists: the built-in fallback just says "This page couldn't load"
// with no details, which is useless for debugging OAuth round-trip issues.
// This boundary exposes the error name, message, stack, and the reset
// function so we can actually see what went wrong during the token exchange.

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AuthCallbackError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[auth/callback] Route error boundary caught:", error);
    if (error.stack) console.error("[auth/callback] Stack:", error.stack);
    if (error.digest) console.error("[auth/callback] Digest:", error.digest);
  }, [error]);

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
          Sign-in callback crashed during render
        </div>
        <p className="mb-3 text-muted-foreground">
          The OAuth round-trip from Quran Foundation landed here but the
          callback page threw an error while trying to finish the token
          exchange. Full details below so you can paste them into the
          hackathon troubleshooting thread.
        </p>

        <dl className="space-y-3 font-mono text-xs">
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
              <dd className="mt-0.5 max-h-48 overflow-auto whitespace-pre-wrap break-all text-foreground/80">
                {error.stack}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground/70">Callback query</dt>
            <dd className="mt-0.5 break-all text-foreground/80">
              {search || "(empty — no code/state in URL)"}
            </dd>
          </div>
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
