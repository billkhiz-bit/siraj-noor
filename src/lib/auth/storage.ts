const TOKEN_KEY = "qf.tokens.v1";
const PKCE_KEY = "qf.pkce.v1";

export interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  scope?: string;
  expiresAt: number;
}

export interface StoredPkce {
  codeVerifier: string;
  state: string;
  nonce: string;
  redirectUri: string;
  returnTo: string;
}

export function saveTokens(tokens: StoredTokens): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function loadTokens(): StoredTokens | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function savePkce(pkce: StoredPkce): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PKCE_KEY, JSON.stringify(pkce));
}

export function loadPkce(): StoredPkce | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PKCE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredPkce;
  } catch {
    return null;
  }
}

export function clearPkce(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PKCE_KEY);
}

export function isExpiredSoon(tokens: StoredTokens, skewMs = 60_000): boolean {
  return Date.now() + skewMs >= tokens.expiresAt;
}
