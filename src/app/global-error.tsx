"use client";

// Global error boundary — this is Next.js App Router's special file for
// catching errors in the root layout itself. `app/error.tsx` catches errors
// in `page.tsx` components and their descendants, but it cannot catch
// errors thrown in `layout.tsx` because `error.tsx` is mounted *inside*
// the layout. `global-error.tsx` replaces the entire document (including
// its own <html> and <body>) and is the only boundary that catches layout
// crashes.
//
// See: https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-global-errors

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[global-error.tsx] Root layout error caught:", error);
    if (error.stack) console.error("[global-error.tsx] Stack:", error.stack);
    if (error.digest) console.error("[global-error.tsx] Digest:", error.digest);
  }, [error]);

  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const search =
    typeof window !== "undefined" ? window.location.search : "";

  // Note: global-error.tsx MUST render its own <html> and <body> because it
  // replaces the entire document when it catches an error in the root layout.
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#050510",
          color: "#f1f5f9",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: "1.875rem",
            fontWeight: 700,
            color: "#f59e0b",
            marginBottom: "1.5rem",
          }}
        >
          Siraj Noor
        </div>

        <div
          role="alert"
          style={{
            maxWidth: "36rem",
            width: "100%",
            border: "1px solid rgba(244, 63, 94, 0.4)",
            backgroundColor: "rgba(244, 63, 94, 0.05)",
            borderRadius: "0.5rem",
            padding: "1.25rem 1.5rem",
            fontSize: "0.875rem",
            textAlign: "left",
          }}
        >
          <div
            style={{
              marginBottom: "0.5rem",
              fontWeight: 500,
              color: "#fb7185",
            }}
          >
            Root layout crash caught by global-error.tsx
          </div>
          <p style={{ marginBottom: "0.75rem", color: "#94a3b8" }}>
            Siraj Noor&apos;s root layout threw an error before any page could
            mount. This is almost always one of the auth context providers
            crashing on initial render. Details below so we can pinpoint the
            throw.
          </p>

          <dl
            style={{
              fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
              fontSize: "0.75rem",
              display: "grid",
              gap: "0.75rem",
            }}
          >
            <div>
              <dt style={{ color: "rgba(148, 163, 184, 0.7)" }}>Path</dt>
              <dd style={{ margin: "0.125rem 0 0", wordBreak: "break-all" }}>
                {pathname || "(unknown)"}
                {search}
              </dd>
            </div>
            <div>
              <dt style={{ color: "rgba(148, 163, 184, 0.7)" }}>Error name</dt>
              <dd style={{ margin: "0.125rem 0 0", wordBreak: "break-all" }}>
                {error.name || "(unset)"}
              </dd>
            </div>
            <div>
              <dt style={{ color: "rgba(148, 163, 184, 0.7)" }}>
                Error message
              </dt>
              <dd style={{ margin: "0.125rem 0 0", wordBreak: "break-all" }}>
                {error.message || "(empty)"}
              </dd>
            </div>
            {error.digest && (
              <div>
                <dt style={{ color: "rgba(148, 163, 184, 0.7)" }}>
                  Next.js digest
                </dt>
                <dd style={{ margin: "0.125rem 0 0", wordBreak: "break-all" }}>
                  {error.digest}
                </dd>
              </div>
            )}
            {error.stack && (
              <div>
                <dt style={{ color: "rgba(148, 163, 184, 0.7)" }}>Stack</dt>
                <dd
                  style={{
                    margin: "0.125rem 0 0",
                    maxHeight: "14rem",
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    color: "rgba(241, 245, 249, 0.8)",
                  }}
                >
                  {error.stack}
                </dd>
              </div>
            )}
          </dl>

          <div
            style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem" }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: "1px solid rgba(148, 163, 184, 0.3)",
                backgroundColor: "transparent",
                color: "#f1f5f9",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                borderRadius: "0.375rem",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
            <a
              href="/"
              style={{
                border: "1px solid rgba(148, 163, 184, 0.3)",
                color: "#f1f5f9",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                borderRadius: "0.375rem",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Return home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
