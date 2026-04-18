import {
  QF_CLIENT_ID,
  QF_AUTH_HOST,
  QF_AUTHORIZE_URL,
  QF_TOKEN_URL,
  QF_REFRESH_URL,
  QF_TOKEN_USES_PROXY,
  QF_LOGOUT_URL,
  QF_SCOPES,
  getRedirectUri,
  getPostLogoutRedirectUri,
} from "./config";
import { generatePkcePair, randomUrlSafe } from "./pkce";
import {
  savePkce,
  loadPkce,
  clearPkce,
  saveTokens,
  loadTokens,
  clearTokens,
  type StoredTokens,
} from "./storage";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

interface IdTokenClaims {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  nonce?: string;
}

function tokensFromResponse(resp: TokenResponse): StoredTokens {
  return {
    accessToken: resp.access_token,
    refreshToken: resp.refresh_token,
    idToken: resp.id_token,
    scope: resp.scope,
    expiresAt: Date.now() + resp.expires_in * 1000,
  };
}

// Decode the unverified payload of a JWT. We don't verify the signature
// here - id_tokens come through a TLS-protected back channel from a
// trusted IdP, and we only use the payload for OIDC spec-mandated claim
// checks (aud, iss, exp, nonce). A full JWKS-based signature check would
// require bundling a JWT lib and pulling the JWKS endpoint on every
// login; not worth it for a browser-only flow where the token would
// have to tamper with the TLS connection to reach us.
function decodeIdTokenClaims(idToken: string): IdTokenClaims | null {
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "===".slice((b64.length + 3) % 4);
    return JSON.parse(atob(padded)) as IdTokenClaims;
  } catch {
    return null;
  }
}

function verifyIdTokenClaims(
  idToken: string | undefined,
  expectedNonce: string
): void {
  if (!idToken) return; // id_token is technically optional; only verify when present
  const claims = decodeIdTokenClaims(idToken);
  if (!claims) {
    throw new Error("id_token could not be decoded - sign-in aborted.");
  }

  // Issuer must match the IdP host we authenticated against. Prevents an
  // id_token minted by a different IdP from being accepted.
  if (claims.iss !== QF_AUTH_HOST) {
    throw new Error(
      `id_token issuer mismatch (expected ${QF_AUTH_HOST}, got ${claims.iss}). Sign-in aborted.`
    );
  }

  // Audience must include our client_id. Prevents a token minted for a
  // different client from being accepted.
  const aud = claims.aud;
  const audOk =
    typeof aud === "string"
      ? aud === QF_CLIENT_ID
      : Array.isArray(aud) && aud.includes(QF_CLIENT_ID);
  if (!audOk) {
    throw new Error("id_token audience mismatch - sign-in aborted.");
  }

  // Expiry must be in the future. 60s skew allows for small clock drift
  // between our machine and the IdP.
  if (typeof claims.exp !== "number" || Date.now() / 1000 > claims.exp + 60) {
    throw new Error("id_token has expired - sign-in aborted.");
  }

  // Nonce must match the one we generated and stored in PKCE state. This
  // is the OIDC-spec-mandated replay protection: without this check, a
  // captured id_token from another session could bind here.
  if (claims.nonce !== expectedNonce) {
    throw new Error(
      "id_token nonce mismatch - possible replay attack. Sign-in aborted."
    );
  }
}

export async function beginLogin(returnTo: string = "/"): Promise<void> {
  if (!QF_CLIENT_ID) {
    throw new Error(
      "NEXT_PUBLIC_QF_CLIENT_ID is not configured. Register at https://api-docs.quran.foundation/request-access"
    );
  }

  const { codeVerifier, codeChallenge } = await generatePkcePair();
  const state = randomUrlSafe(16);
  const nonce = randomUrlSafe(16);
  const redirectUri = getRedirectUri();

  savePkce({ codeVerifier, state, nonce, redirectUri, returnTo });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: QF_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: QF_SCOPES,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  window.location.assign(`${QF_AUTHORIZE_URL}?${params.toString()}`);
}

export async function completeLogin(
  code: string,
  state: string
): Promise<{ tokens: StoredTokens; returnTo: string }> {
  const pkce = loadPkce();
  if (!pkce) {
    throw new Error("Missing PKCE state - start the login flow again.");
  }
  if (pkce.state !== state) {
    clearPkce();
    throw new Error("State mismatch - possible CSRF attack. Login aborted.");
  }

  // Once state is validated, the authorization code + code_verifier are
  // single-use. Always clear PKCE on exit so a failed exchange can't be
  // retried with the same verifier (or trigger a stale-state replay later).
  try {
    // Two request shapes: the proxy (default) wants JSON because it's our
    // own Pages Function, while the direct-token fallback (opt-in via
    // NEXT_PUBLIC_QF_USE_DIRECT_TOKEN) has to speak the RFC6749 form-encoded
    // dialect directly to QF.
    const response = QF_TOKEN_USES_PROXY
      ? await fetch(QF_TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirect_uri: pkce.redirectUri,
            code_verifier: pkce.codeVerifier,
          }),
        })
      : await fetch(QF_TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: QF_CLIENT_ID,
            code,
            redirect_uri: pkce.redirectUri,
            code_verifier: pkce.codeVerifier,
          }).toString(),
        });

    if (!response.ok) {
      // Truncate upstream body aggressively before bubbling. Hydra error
      // payloads can echo the authorisation `code`, request fragments,
      // and internal debug strings, any of which can leak into the
      // callback page UI + the console if we pass the full text through.
      // 160 chars is enough to preserve the OAuth error name + a short
      // message without relaying credentials.
      const text = await response.text().catch(() => "");
      const trimmed = text.length > 160 ? `${text.slice(0, 160)}…` : text;
      throw new Error(
        `Token exchange failed (${response.status}): ${trimmed || response.statusText}`
      );
    }

    const json: TokenResponse = await response.json();
    // Verify id_token claims before storing. If verification fails we
    // throw from here - the finally {} clause clears PKCE so the same
    // auth code can't be re-exchanged. Tokens never reach storage on
    // failure.
    verifyIdTokenClaims(json.id_token, pkce.nonce);
    const tokens = tokensFromResponse(json);
    saveTokens(tokens);
    return { tokens, returnTo: pkce.returnTo };
  } finally {
    clearPkce();
  }
}

// Single-flight gate + short-TTL result cache for refresh_token grants.
// Hydra revokes the previous access token atomically on every refresh,
// so two parallel refreshes from sibling API calls in the same tick
// would rotate TWICE - the first caller ends up holding a revoked
// token. The gate collapses bursts: while one refresh is in flight,
// every other caller awaits the same promise. After it settles, the
// result is served from cache for a brief window to absorb late
// arrivals (e.g. a 403-retry path that kicks off ~1s after another
// caller's refresh just completed).
let inflightRefresh: Promise<StoredTokens | null> | null = null;
let cachedRefreshResult: StoredTokens | null = null;
let cachedRefreshUntil = 0;
const REFRESH_CACHE_TTL_MS = 5_000;

// Cross-tab invalidation: if another tab changes the token state (e.g.
// user signs in from a second tab while this tab has a cached `null`
// refresh result from a rejected refresh), clear our cache so the next
// API call re-reads localStorage rather than serving the stale null.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "qf.tokens.v1") {
      inflightRefresh = null;
      cachedRefreshResult = null;
      cachedRefreshUntil = 0;
    }
  });
}

export async function refreshTokens(): Promise<StoredTokens | null> {
  if (inflightRefresh) return inflightRefresh;
  if (Date.now() < cachedRefreshUntil) return cachedRefreshResult;

  inflightRefresh = doRefresh();
  try {
    const result = await inflightRefresh;
    cachedRefreshResult = result;
    cachedRefreshUntil = Date.now() + REFRESH_CACHE_TTL_MS;
    return result;
  } finally {
    inflightRefresh = null;
  }
}

async function doRefresh(): Promise<StoredTokens | null> {
  const current = loadTokens();
  if (!current?.refreshToken) return null;

  let response: Response;
  try {
    response = QF_TOKEN_USES_PROXY
      ? await fetch(QF_REFRESH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: current.refreshToken }),
        })
      : await fetch(QF_REFRESH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: QF_CLIENT_ID,
            refresh_token: current.refreshToken,
          }).toString(),
        });
  } catch {
    // Network/CORS/DNS failure - keep the existing tokens so the user
    // isn't logged out by a transient connectivity blip.
    return null;
  }

  if (response.status === 400 || response.status === 401) {
    // Refresh token rejected - session is genuinely dead.
    clearTokens();
    return null;
  }

  if (!response.ok) {
    // 5xx or other transient - leave tokens in place, caller surfaces error.
    return null;
  }

  const json: TokenResponse = await response.json();
  const next: StoredTokens = {
    ...tokensFromResponse(json),
    refreshToken: json.refresh_token ?? current.refreshToken,
  };
  saveTokens(next);
  return next;
}

export function logout(): void {
  const current = loadTokens();
  clearTokens();
  clearPkce();

  // Revoke the refresh token server-side via the Pages Function proxy
  // (Hydra's /oauth2/revoke requires client_secret_basic, so we can't
  // call it directly from the browser). Use sendBeacon rather than
  // fetch so the POST survives the page unload that immediately
  // follows - sendBeacon is designed for exactly this pattern and
  // preserves the Content-Type from the Blob so our proxy's JSON
  // parse still works. If sendBeacon isn't available (very old
  // browsers) we fall through; Hydra's session logout still happens,
  // the refresh token just stays live until it expires naturally.
  if (current?.refreshToken && typeof navigator !== "undefined") {
    const body = new Blob(
      [
        JSON.stringify({
          token: current.refreshToken,
          token_type_hint: "refresh_token",
        }),
      ],
      { type: "application/json" }
    );
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/qf/revoke", body);
    }
  }

  const params = new URLSearchParams({
    post_logout_redirect_uri: getPostLogoutRedirectUri(),
  });
  if (current?.idToken) params.set("id_token_hint", current.idToken);

  window.location.assign(`${QF_LOGOUT_URL}?${params.toString()}`);
}
