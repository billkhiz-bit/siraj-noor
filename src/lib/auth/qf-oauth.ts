import {
  QF_CLIENT_ID,
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

function tokensFromResponse(resp: TokenResponse): StoredTokens {
  return {
    accessToken: resp.access_token,
    refreshToken: resp.refresh_token,
    idToken: resp.id_token,
    scope: resp.scope,
    expiresAt: Date.now() + resp.expires_in * 1000,
  };
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
    throw new Error("Missing PKCE state — start the login flow again.");
  }
  if (pkce.state !== state) {
    clearPkce();
    throw new Error("State mismatch — possible CSRF attack. Login aborted.");
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
      const text = await response.text().catch(() => "");
      throw new Error(
        `Token exchange failed (${response.status}): ${text || response.statusText}`
      );
    }

    const json: TokenResponse = await response.json();
    const tokens = tokensFromResponse(json);
    saveTokens(tokens);
    return { tokens, returnTo: pkce.returnTo };
  } finally {
    clearPkce();
  }
}

export async function refreshTokens(): Promise<StoredTokens | null> {
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
    // Network/CORS/DNS failure — keep the existing tokens so the user
    // isn't logged out by a transient connectivity blip.
    return null;
  }

  if (response.status === 400 || response.status === 401) {
    // Refresh token rejected — session is genuinely dead.
    clearTokens();
    return null;
  }

  if (!response.ok) {
    // 5xx or other transient — leave tokens in place, caller surfaces error.
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

  const params = new URLSearchParams({
    post_logout_redirect_uri: getPostLogoutRedirectUri(),
  });
  if (current?.idToken) params.set("id_token_hint", current.idToken);

  window.location.assign(`${QF_LOGOUT_URL}?${params.toString()}`);
}
