"use client";

// /debug/auth — diagnostic page for the QF User API 403 invalid_token issue.
//
// When signed in, this page runs a battery of probes against the user's
// current session and reports the results. Useful for:
//   - Decoding the JWT access token and inspecting iss/aud/exp/scope
//   - Probing /oauth2/userinfo as a sanity check (same token, different
//     resource server)
//   - Trying Authorization: Bearer as an alternative to x-auth-token
//   - Testing token refresh + retry
//   - Collecting a structured diagnostic report for QF support
//
// Nothing here is user-facing — the page is behind /debug/auth and
// doesn't appear in the sidebar. It's strictly a tool for debugging
// the 403 issue. Remove or hide once the underlying problem is fixed.

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
    const tokens = loadTokens();
    if (!tokens) {
      setProbes([
        {
          name: "No tokens",
          status: "error",
          detail: "localStorage has no token — sign in first.",
        },
      ]);
      return;
    }

    const results: ProbeResult[] = [];
    const push = (result: ProbeResult) => {
      results.push(result);
      setProbes([...results]);
    };

    // Probe 1: OIDC /userinfo with x-auth-token
    push({ name: "1. /userinfo with x-auth-token", status: "pending" });
    try {
      const r = await fetch(`${QF_AUTH_HOST}/userinfo`, {
        headers: {
          "x-auth-token": tokens.accessToken,
          "x-client-id": QF_CLIENT_ID,
        },
      });
      const body = await r.text();
      let parsed: unknown = body;
      try {
        parsed = JSON.parse(body);
      } catch {
        /* leave as string */
      }
      results[results.length - 1] = {
        name: "1. /userinfo with x-auth-token",
        status: r.ok ? "success" : "error",
        detail: `HTTP ${r.status}`,
        data: parsed,
      };
      setProbes([...results]);
    } catch (err) {
      results[results.length - 1] = {
        name: "1. /userinfo with x-auth-token",
        status: "error",
        detail: err instanceof Error ? err.message : String(err),
      };
      setProbes([...results]);
    }

    // Probe 2: OIDC /userinfo with Authorization: Bearer
    push({ name: "2. /userinfo with Authorization: Bearer", status: "pending" });
    try {
      const r = await fetch(`${QF_AUTH_HOST}/userinfo`, {
        headers: {
          authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      const body = await r.text();
      let parsed: unknown = body;
      try {
        parsed = JSON.parse(body);
      } catch {
        /* leave as string */
      }
      results[results.length - 1] = {
        name: "2. /userinfo with Authorization: Bearer",
        status: r.ok ? "success" : "error",
        detail: `HTTP ${r.status}`,
        data: parsed,
      };
      setProbes([...results]);
    } catch (err) {
      results[results.length - 1] = {
        name: "2. /userinfo with Authorization: Bearer",
        status: "error",
        detail: err instanceof Error ? err.message : String(err),
      };
      setProbes([...results]);
    }

    // Probe 3: User API /bookmarks with x-auth-token (current app behaviour)
    push({
      name: "3. /auth/v1/bookmarks with x-auth-token + x-client-id",
      status: "pending",
    });
    try {
      const r = await fetch(`${QF_API_BASE}/bookmarks`, {
        headers: {
          "x-auth-token": tokens.accessToken,
          "x-client-id": QF_CLIENT_ID,
        },
      });
      const body = await r.text();
      let parsed: unknown = body;
      try {
        parsed = JSON.parse(body);
      } catch {
        /* leave as string */
      }
      results[results.length - 1] = {
        name: "3. /auth/v1/bookmarks with x-auth-token + x-client-id",
        status: r.ok ? "success" : "error",
        detail: `HTTP ${r.status}`,
        data: parsed,
      };
      setProbes([...results]);
    } catch (err) {
      results[results.length - 1] = {
        name: "3. /auth/v1/bookmarks with x-auth-token + x-client-id",
        status: "error",
        detail: err instanceof Error ? err.message : String(err),
      };
      setProbes([...results]);
    }

    // Probe 4: User API /bookmarks with Authorization: Bearer + x-client-id
    push({
      name: "4. /auth/v1/bookmarks with Authorization: Bearer + x-client-id",
      status: "pending",
    });
    try {
      const r = await fetch(`${QF_API_BASE}/bookmarks`, {
        headers: {
          authorization: `Bearer ${tokens.accessToken}`,
          "x-client-id": QF_CLIENT_ID,
        },
      });
      const body = await r.text();
      let parsed: unknown = body;
      try {
        parsed = JSON.parse(body);
      } catch {
        /* leave as string */
      }
      results[results.length - 1] = {
        name: "4. /auth/v1/bookmarks with Authorization: Bearer + x-client-id",
        status: r.ok ? "success" : "error",
        detail: `HTTP ${r.status}`,
        data: parsed,
      };
      setProbes([...results]);
    } catch (err) {
      results[results.length - 1] = {
        name: "4. /auth/v1/bookmarks with Authorization: Bearer + x-client-id",
        status: "error",
        detail: err instanceof Error ? err.message : String(err),
      };
      setProbes([...results]);
    }

    // Probe 5: Refresh token, retry /bookmarks with new token
    push({
      name: "5. Refresh token + retry /bookmarks",
      status: "pending",
    });
    try {
      const refreshed = await refreshTokens();
      if (!refreshed) {
        results[results.length - 1] = {
          name: "5. Refresh token + retry /bookmarks",
          status: "error",
          detail: "Refresh returned null — refresh token rejected or absent",
        };
        setProbes([...results]);
      } else {
        const r = await fetch(`${QF_API_BASE}/bookmarks`, {
          headers: {
            "x-auth-token": refreshed.accessToken,
            "x-client-id": QF_CLIENT_ID,
          },
        });
        const body = await r.text();
        let parsed: unknown = body;
        try {
          parsed = JSON.parse(body);
        } catch {
          /* leave as string */
        }
        results[results.length - 1] = {
          name: "5. Refresh token + retry /bookmarks",
          status: r.ok ? "success" : "error",
          detail: `HTTP ${r.status} (using refreshed token)`,
          data: parsed,
        };
        setProbes([...results]);
      }
    } catch (err) {
      results[results.length - 1] = {
        name: "5. Refresh token + retry /bookmarks",
        status: "error",
        detail: err instanceof Error ? err.message : String(err),
      };
      setProbes([...results]);
    }

    // Probe 6: hit apis-prelive.quran.foundation directly (Basit pointed out 2026-04-15 that prelive uses a different API host than prod)
    const PROBE_6_NAME =
      "6. apis-prelive /auth/v1/bookmarks with x-auth-token + x-client-id";
    push({ name: PROBE_6_NAME, status: "pending" });
    try {
      const r = await fetch(
        "https://apis-prelive.quran.foundation/auth/v1/bookmarks",
        {
          headers: {
            "x-auth-token": tokens.accessToken,
            "x-client-id": QF_CLIENT_ID,
          },
        }
      );
      const body = await r.text();
      let parsed: unknown = body;
      try {
        parsed = JSON.parse(body);
      } catch {
        /* leave as string */
      }
      results[results.length - 1] = {
        name: PROBE_6_NAME,
        status: r.ok ? "success" : "error",
        detail: `HTTP ${r.status}`,
        data: parsed,
      };
      setProbes([...results]);
    } catch (err) {
      results[results.length - 1] = {
        name: PROBE_6_NAME,
        status: "error",
        detail: err instanceof Error ? err.message : String(err),
      };
      setProbes([...results]);
    }

    // Probe 7: decode id_token — if its aud has client_id while access_token has aud:[], Hydra is deliberately not setting access_token aud
    const PROBE_7_NAME = "7. Decode id_token and inspect aud/sub/iss claims";
    push({ name: PROBE_7_NAME, status: "pending" });
    try {
      if (!tokens.idToken) {
        results[results.length - 1] = {
          name: PROBE_7_NAME,
          status: "error",
          detail: "No id_token present in localStorage",
        };
      } else {
        const idDecoded = decodeJwt(tokens.idToken);
        results[results.length - 1] = {
          name: PROBE_7_NAME,
          status: "success",
          detail: "decoded locally (no network)",
          data: {
            id_token_header: idDecoded.header,
            id_token_payload: idDecoded.payload,
          },
        };
      }
      setProbes([...results]);
    } catch (err) {
      results[results.length - 1] = {
        name: PROBE_7_NAME,
        status: "error",
        detail: err instanceof Error ? err.message : String(err),
      };
      setProbes([...results]);
    }

    // Probe 8: different user API endpoint — tests whether rejection is endpoint-specific or universal
    const PROBE_8_NAME = "8. /auth/v1/streaks with x-auth-token + x-client-id";
    push({ name: PROBE_8_NAME, status: "pending" });
    try {
      const r = await fetch(`${QF_API_BASE}/streaks`, {
        headers: {
          "x-auth-token": tokens.accessToken,
          "x-client-id": QF_CLIENT_ID,
        },
      });
      const body = await r.text();
      let parsed: unknown = body;
      try {
        parsed = JSON.parse(body);
      } catch {
        /* leave as string */
      }
      results[results.length - 1] = {
        name: PROBE_8_NAME,
        status: r.ok ? "success" : "error",
        detail: `HTTP ${r.status}`,
        data: parsed,
      };
      setProbes([...results]);
    } catch (err) {
      results[results.length - 1] = {
        name: PROBE_8_NAME,
        status: "error",
        detail: err instanceof Error ? err.message : String(err),
      };
      setProbes([...results]);
    }

    // Probe 9: content API with same token — if it returns a different error than /auth/v1/*, rejection is per-path not per-token
    const PROBE_9_NAME =
      "9. /content/api/v4/chapters/1 with x-auth-token + x-client-id";
    push({ name: PROBE_9_NAME, status: "pending" });
    try {
      const r = await fetch(
        "https://apis.quran.foundation/content/api/v4/chapters/1",
        {
          headers: {
            "x-auth-token": tokens.accessToken,
            "x-client-id": QF_CLIENT_ID,
          },
        }
      );
      const body = await r.text();
      let parsed: unknown = body;
      try {
        parsed = JSON.parse(body);
      } catch {
        /* leave as string */
      }
      results[results.length - 1] = {
        name: PROBE_9_NAME,
        status: r.ok ? "success" : "error",
        detail: `HTTP ${r.status}`,
        data: parsed,
      };
      setProbes([...results]);
    } catch (err) {
      results[results.length - 1] = {
        name: PROBE_9_NAME,
        status: "error",
        detail: err instanceof Error ? err.message : String(err),
      };
      setProbes([...results]);
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
          Diagnostic probes for the QF User API 403 issue. Not linked from
          anywhere — navigate here manually when signed in.
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
          How to share this with Basit
        </h3>
        <p className="mb-2">
          Once probes finish, screenshot this page (or copy the JWT payload
          and probe outputs) and paste into the follow-up email thread.
          That gives him the exact token claims and endpoint responses he
          needs to diagnose the audience/issuer mismatch on his side.
        </p>
      </section>
    </main>
  );
}
