const DEFAULT_AUTH_HOST = "https://prelive-oauth2.quran.foundation";
const DEFAULT_API_HOST = "https://apis.quran.foundation";

export const QF_CLIENT_ID =
  process.env.NEXT_PUBLIC_QF_CLIENT_ID ?? "";

export const QF_AUTH_HOST =
  process.env.NEXT_PUBLIC_QF_AUTH_HOST ?? DEFAULT_AUTH_HOST;

export const QF_API_HOST =
  process.env.NEXT_PUBLIC_QF_API_HOST ?? DEFAULT_API_HOST;

export const QF_AUTHORIZE_URL = `${QF_AUTH_HOST}/oauth2/auth`;
export const QF_LOGOUT_URL = `${QF_AUTH_HOST}/oauth2/sessions/logout`;
export const QF_API_BASE = `${QF_API_HOST}/auth/v1`;

// Token exchange routing
// QF issues confidential clients (client_secret_basic) by default, so the
// browser cannot talk to the QF token endpoint directly - a client secret
// would leak into the bundle. Token exchange and refresh are routed through
// Cloudflare Pages Functions that hold the secret server-side. Set
// NEXT_PUBLIC_QF_USE_DIRECT_TOKEN=true to bypass the proxy if QF ever
// switches the client to token_endpoint_auth_method=none.
const USE_DIRECT_TOKEN =
  process.env.NEXT_PUBLIC_QF_USE_DIRECT_TOKEN === "true";

export const QF_TOKEN_URL = USE_DIRECT_TOKEN
  ? `${QF_AUTH_HOST}/oauth2/token`
  : "/api/qf/token";

export const QF_REFRESH_URL = USE_DIRECT_TOKEN
  ? `${QF_AUTH_HOST}/oauth2/token`
  : "/api/qf/refresh";

export const QF_TOKEN_USES_PROXY = !USE_DIRECT_TOKEN;

// QF scope policy: request only what the app actually uses. The `user`
// scope granted full profile access but nothing in the UI consumes it
// (we derive name/email/picture from the id_token claims directly);
// `post` was reserved for a social-sharing feature never shipped.
// Both surface on QF's eligibility review, so we drop them. Re-adding
// requires a matching feature that exercises the scope.
export const QF_SCOPES = [
  "openid",
  "offline_access",
  "bookmark",
  "collection",
  "reading_session",
  "goal",
  "streak",
].join(" ");

export function getRedirectUri(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/auth/callback/`;
}

export function getPostLogoutRedirectUri(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/`;
}

export function isAuthConfigured(): boolean {
  return Boolean(QF_CLIENT_ID);
}
