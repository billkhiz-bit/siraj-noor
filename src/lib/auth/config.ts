const DEFAULT_AUTH_HOST = "https://prelive-oauth2.quran.foundation";
const DEFAULT_API_HOST = "https://apis.quran.foundation";

export const QF_CLIENT_ID =
  process.env.NEXT_PUBLIC_QF_CLIENT_ID ?? "";

export const QF_AUTH_HOST =
  process.env.NEXT_PUBLIC_QF_AUTH_HOST ?? DEFAULT_AUTH_HOST;

export const QF_API_HOST =
  process.env.NEXT_PUBLIC_QF_API_HOST ?? DEFAULT_API_HOST;

export const QF_AUTHORIZE_URL = `${QF_AUTH_HOST}/oauth2/auth`;
export const QF_TOKEN_URL = `${QF_AUTH_HOST}/oauth2/token`;
export const QF_LOGOUT_URL = `${QF_AUTH_HOST}/oauth2/sessions/logout`;
export const QF_API_BASE = `${QF_API_HOST}/auth/v1`;

export const QF_SCOPES = [
  "openid",
  "offline_access",
  "user",
  "bookmark",
  "collection",
  "reading_session",
  "goal",
  "streak",
  "post",
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
