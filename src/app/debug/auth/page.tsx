"use client";

// /debug/auth — diagnostic page for the QF User API 403 invalid_token issue.
//
// When signed in, this page runs a battery of probes against the user's
// current session and reports the results. Section A runs every network
// check with the ORIGINAL, untouched access token. Section B then
// triggers refreshTokens() and re-tests, to prove whether Hydra's
// refresh_token grant revokes the old access token (which would explain
// the 403s we've been chasing).
//
// Nothing here is user-facing — the page is behind /debug/auth and
// doesn't appear in the sidebar. Remove or hide once the underlying
// problem is fixed.

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadTokens } from "@/lib/auth/storage";
import { refreshTokens } from "@/lib/auth/qf-oauth";
import { QF_API_BASE, QF_AUTH_HOST, QF_CLIENT_ID } from "@/lib/auth/config";

interface ProbeResult {
  name: string;
  status: "pending" | "success" | "error";
  detail?: string;
  data?: unknown;
}

function formatJson(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function decodeJwt(token: string): {
  header?: unknown;
  payload?: unknown;
  error?: string;
} {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { error: "Not a JWT (wrong number of parts)" };
  }
  try {
    const decode = (segment: string): unknown => {
      const padded =
        segment.replace(/-/g, "+").replace(/_/g, "/") +
        "===".slice((segment.length + 3) % 4);
      return JSON.parse(atob(padded));
    };
    return {
      header: decode(parts[0]),
      payload: decode(parts[1]),
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

const PRELIVE_API = "https://apis-prelive.quran.foundation/auth/v1";

export default function DebugAuthPage() {
  const [probes, setProbes] = useState<ProbeResult[]>([]);
  const [tokenInfo, setTokenInfo] = useState<{
    hasTokens: boolean;
    accessTokenPrefix?: string;
    accessTokenLength?: number;
    expiresAt?: number;
    secondsUntilExpiry?: number;
    refreshTokenPresent?: boolean;
    idTokenPresent?: boolean;
    scope?: string;
    decoded?: { header?: unknown; payload?: unknown; error?: string };
  }>({ hasTokens: false });

  // One-shot post-hydration sync from localStorage: a useState lazy init would run during SSG where localStorage is undefined and crash the build.
  useEffect(() => {
    const tokens = loadTokens();
    if (!tokens) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTokenInfo({ hasTokens: false });
      return;
    }

    const decoded = decodeJwt(tokens.accessToken);
    setTokenInfo({
      hasTokens: true,
      accessTokenPrefix: tokens.accessToken.slice(0, 40),
      accessTokenLength: tokens.accessToken.length,
      expiresAt: tokens.expiresAt,
      secondsUntilExpiry: Math.round((tokens.expiresAt - Date.now()) / 1000),
      refreshTokenPresent: Boolean(tokens.refreshToken),
      idTokenPresent: Boolean(tokens.idToken),
      scope: tokens.scope,
      decoded,
    });
  }, []);

  async function runProbes() {
    const originalTokens = loadTokens();
    if (!originalTokens) {
      setProbes([
        {
          name: "No tokens",
          status: "error",
          detail: "localStorage has no token — sign in first.",
        },
      ]);
      return;
    }

    const originalToken = originalTokens.accessToken;
    const results: ProbeResult[] = [];
    const push = (result: ProbeResult) => {
      results.push(result);
      setProbes([...results]);
    };
    const updateLast = (patch: Partial<ProbeResult>) => {
      results[results.length - 1] = {
        ...results[results.length - 1],
        ...patch,
      };
      setProbes([...results]);
    };

    // Wraps a single network probe with consistent error handling, JSON
    // parsing, and status-code → success/error mapping. Every Section A
    // probe uses this helper so the closure only ever captures
    // originalToken — no accidental state changes between calls.
    async function probe(
      name: string,
      fetcher: () => Promise<Response>,
      detailSuffix = ""
    ): Promise<void> {
      push({ name, status: "pending" });
      try {
        const r = await fetcher();
        const body = await r.text();
        let parsed: unknown = body;
        try {
          parsed = JSON.parse(body);
        } catch {
          /* leave as string */
        }
        updateLast({
          status: r.ok ? "success" : "error",
          detail: `HTTP ${r.status}${detailSuffix}`,
          data: parsed,
        });
      } catch (err) {
        updateLast({
          status: "error",
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // ══ Section A — original, untouched token ═══════════════════════════
    // If any of these return 422 (validation) or 200 (success), the token
    // is valid and the 403s we've been chasing are something else.

    await probe(
      "A1. apis-prelive /bookmarks?mushafId=4&first=1 (Basit's valid repro URL)",
      () =>
        fetch(`${PRELIVE_API}/bookmarks?mushafId=4&first=1`, {
          headers: {
            "x-auth-token": originalToken,
            "x-client-id": QF_CLIENT_ID,
          },
        })
    );

    await probe(
      "A2. apis-prelive /bookmarks (no mushafId — 422 here proves auth passed)",
      () =>
        fetch(`${PRELIVE_API}/bookmarks`, {
          headers: {
            "x-auth-token": originalToken,
            "x-client-id": QF_CLIENT_ID,
          },
        })
    );

    await probe(
      "A3. apis-prelive /streaks (different User API path)",
      () =>
        fetch(`${PRELIVE_API}/streaks`, {
          headers: {
            "x-auth-token": originalToken,
            "x-client-id": QF_CLIENT_ID,
          },
        })
    );

    await probe(
      "A4. apis-prelive /collections (different User API path)",
      () =>
        fetch(`${PRELIVE_API}/collections`, {
          headers: {
            "x-auth-token": originalToken,
            "x-client-id": QF_CLIENT_ID,
          },
        })
    );

    await probe(
      "A5. apis-prelive /bookmarks?mushafId=4&first=1 via Pages Function (server-side, no browser Origin)",
      () =>
        fetch("/api/qf/test-proxy", {
          headers: {
            "x-auth-token": originalToken,
            "x-client-id": QF_CLIENT_ID,
          },
        }),
      " (via proxy)"
    );

    await probe(
      "A6. Server-side Hydra /oauth2/userinfo (parallel Bearer + x-auth-token)",
      () =>
        fetch("/api/qf/test-userinfo", {
          headers: {
            "x-auth-token": originalToken,
            "x-client-id": QF_CLIENT_ID,
          },
        }),
      " (via proxy)"
    );

    await probe(
      "A7. apis.quran.foundation /content/api/v4/chapters/1",
      () =>
        fetch(
          "https://apis.quran.foundation/content/api/v4/chapters/1",
          {
            headers: {
              "x-auth-token": originalToken,
              "x-client-id": QF_CLIENT_ID,
            },
          }
        )
    );

    await probe(
      "A8. apis-prelive /bookmarks with Authorization: Bearer (format check)",
      () =>
        fetch(`${PRELIVE_API}/bookmarks`, {
          headers: {
            authorization: `Bearer ${originalToken}`,
            "x-client-id": QF_CLIENT_ID,
          },
        })
    );

    await probe(
      "A9. Browser Hydra /userinfo with x-auth-token (CORS expected)",
      () =>
        fetch(`${QF_AUTH_HOST}/userinfo`, {
          headers: {
            "x-auth-token": originalToken,
            "x-client-id": QF_CLIENT_ID,
          },
        })
    );

    await probe(
      "A10. Browser Hydra /userinfo with Authorization: Bearer (CORS expected)",
      () =>
        fetch(`${QF_AUTH_HOST}/userinfo`, {
          headers: {
            authorization: `Bearer ${originalToken}`,
          },
        })
    );

    await probe(
      "A11. QF_API_BASE /bookmarks (whatever env host the build baked in)",
      () =>
        fetch(`${QF_API_BASE}/bookmarks?mushafId=4&first=1`, {
          headers: {
            "x-auth-token": originalToken,
            "x-client-id": QF_CLIENT_ID,
          },
        })
    );

    // A12: decode id_token locally (no network)
    push({
      name: "A12. Decode id_token (local, no network)",
      status: "pending",
    });
    if (!originalTokens.idToken) {
      updateLast({ status: "error", detail: "No id_token in localStorage" });
    } else {
      const idDecoded = decodeJwt(originalTokens.idToken);
      updateLast({
        status: "success",
        detail: "decoded locally",
        data: {
          id_token_header: idDecoded.header,
          id_token_payload: idDecoded.payload,
        },
      });
    }

    // ══ Section B — refresh and test whether the old token is now revoked ═
    // Hydra defaults to revoking the prior access token when a
    // refresh_token grant is used. If that's the bug, B3 will return 403
    // invalid_token on the SAME URL where A1 just succeeded.

    push({
      name: "B1. refreshTokens() — rotate access token",
      status: "pending",
    });
    let refreshed: Awaited<ReturnType<typeof refreshTokens>> = null;
    try {
      refreshed = await refreshTokens();
      if (!refreshed) {
        updateLast({
          status: "error",
          detail: "refresh returned null — refresh token rejected",
        });
      } else {
        updateLast({
          status: "success",
          detail: "refreshed ok",
          data: {
            new_token_prefix: refreshed.accessToken.slice(0, 40) + "…",
            new_token_length: refreshed.accessToken.length,
            new_is_same_as_original:
              refreshed.accessToken === originalToken,
          },
        });
      }
    } catch (err) {
      updateLast({
        status: "error",
        detail: err instanceof Error ? err.message : String(err),
      });
    }

    if (refreshed) {
      const newToken = refreshed.accessToken;

      await probe(
        "B2. Retry A1 with NEW token (expect same result as A1)",
        () =>
          fetch(`${PRELIVE_API}/bookmarks?mushafId=4&first=1`, {
            headers: {
              "x-auth-token": newToken,
              "x-client-id": QF_CLIENT_ID,
            },
          })
      );

      await probe(
        "B3. Retry A1 with ORIGINAL token (403 here = Hydra revoked it on refresh)",
        () =>
          fetch(`${PRELIVE_API}/bookmarks?mushafId=4&first=1`, {
            headers: {
              "x-auth-token": originalToken,
              "x-client-id": QF_CLIENT_ID,
            },
          })
      );
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 font-mono text-sm">
      <div className="mb-6">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.2em] text-amber-500/80 hover:text-amber-400"
        >
          ← Siraj Noor
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-amber-500">
          Auth Debug
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Diagnostic probes for the QF User API 403 issue. Section A tests
          the original token; Section B triggers refresh and re-tests to
          isolate whether Hydra revokes access tokens on refresh. Not
          linked from anywhere — navigate here manually when signed in.
        </p>
      </div>

      <section className="mb-8 rounded-lg border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold text-foreground">
          Token in localStorage
        </h2>
        {!tokenInfo.hasTokens ? (
          <p className="text-xs text-muted-foreground">
            No tokens in localStorage. Sign in first, then reload this page.
          </p>
        ) : (
          <dl className="grid gap-2 text-xs">
            <div className="grid grid-cols-[10rem_1fr] gap-3">
              <dt className="text-muted-foreground">Prefix</dt>
              <dd className="break-all">{tokenInfo.accessTokenPrefix}…</dd>
            </div>
            <div className="grid grid-cols-[10rem_1fr] gap-3">
              <dt className="text-muted-foreground">Length</dt>
              <dd>{tokenInfo.accessTokenLength} chars</dd>
            </div>
            <div className="grid grid-cols-[10rem_1fr] gap-3">
              <dt className="text-muted-foreground">Seconds to expiry</dt>
              <dd>{tokenInfo.secondsUntilExpiry ?? "?"}</dd>
            </div>
            <div className="grid grid-cols-[10rem_1fr] gap-3">
              <dt className="text-muted-foreground">Refresh token</dt>
              <dd>{tokenInfo.refreshTokenPresent ? "present" : "absent"}</dd>
            </div>
            <div className="grid grid-cols-[10rem_1fr] gap-3">
              <dt className="text-muted-foreground">ID token</dt>
              <dd>{tokenInfo.idTokenPresent ? "present" : "absent"}</dd>
            </div>
            <div className="grid grid-cols-[10rem_1fr] gap-3">
              <dt className="text-muted-foreground">Scope</dt>
              <dd className="break-all">{tokenInfo.scope ?? "(absent)"}</dd>
            </div>
            <div className="mt-3">
              <dt className="mb-1 text-muted-foreground">JWT header</dt>
              <dd>
                <pre className="overflow-auto rounded border border-border bg-background p-2 text-[10px]">
                  {formatJson(tokenInfo.decoded?.header ?? tokenInfo.decoded?.error ?? "(none)")}
                </pre>
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-muted-foreground">JWT payload (claims)</dt>
              <dd>
                <pre className="overflow-auto rounded border border-border bg-background p-2 text-[10px]">
                  {formatJson(tokenInfo.decoded?.payload ?? tokenInfo.decoded?.error ?? "(none)")}
                </pre>
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Probes</h2>
          <button
            type="button"
            onClick={runProbes}
            disabled={!tokenInfo.hasTokens}
            className="rounded-md bg-amber-500 px-4 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Run probes
          </button>
        </div>
        <ul className="space-y-3">
          {probes.length === 0 && (
            <li className="rounded-lg border border-dashed border-border bg-card/40 p-5 text-center text-xs text-muted-foreground">
              Click &ldquo;Run probes&rdquo; to test token against multiple
              endpoints and header formats.
            </li>
          )}
          {probes.map((probe, i) => (
            <li
              key={i}
              className={`rounded-lg border p-4 ${
                probe.status === "success"
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : probe.status === "error"
                    ? "border-rose-500/40 bg-rose-500/5"
                    : "border-border bg-card"
              }`}
            >
              <div className="mb-1 flex items-start justify-between gap-3">
                <div className="font-medium text-foreground">
                  {probe.name}
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    probe.status === "success"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : probe.status === "error"
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {probe.status}
                </span>
              </div>
              {probe.detail && (
                <div className="text-xs text-muted-foreground">
                  {probe.detail}
                </div>
              )}
              {probe.data !== undefined && (
                <pre className="mt-2 max-h-40 overflow-auto rounded border border-border bg-background p-2 text-[10px]">
                  {formatJson(probe.data)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="text-xs text-muted-foreground">
        <h3 className="mb-2 font-semibold text-foreground">
          How to read Section A vs Section B
        </h3>
        <p className="mb-2">
          If any Section A probe returns 422 or 200 on a User API path, the
          original token is valid — the 403s across the app are caused by
          something that happens later in the lifecycle, not by a bad token
          at mint time. If B3 returns 403 invalid_token on the exact URL
          where A1 succeeded, Hydra is revoking the old access token on
          refresh and the fix is to always use the latest token returned
          from refresh rather than the closure-captured one.
        </p>
      </section>
    </main>
  );
}
