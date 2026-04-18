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
  createdAt: number;
}

// Abandoned logins leave codeVerifier + state behind in sessionStorage.
// 10 minutes covers almost every real-world auth flow (the Hydra code
// has a 60-second lifetime anyway); older entries are stale and get
// evicted so they can't be picked up by a later, unrelated login.
const PKCE_TTL_MS = 10 * 60 * 1000;

const tokenListeners = new Set<() => void>();
function notifyTokenListeners(): void {
  for (const listener of tokenListeners) listener();
}

// Snapshot cache for useSyncExternalStore. React's reconciler compares
// the result of getSnapshot by reference every render - if we return a
// fresh object each call, React treats every call as a state change and
// loops forever (React minified error #185, "Maximum update depth
// exceeded"). We parse localStorage once, then re-use the cached object
// until the raw string actually changes.
let cachedRaw: string | null = null;
let cachedTokens: StoredTokens | null = null;

function invalidateTokenCache(): void {
  cachedRaw = null;
  cachedTokens = null;
}

export function subscribeToTokenChanges(callback: () => void): () => void {
  tokenListeners.add(callback);
  function onStorage(event: StorageEvent) {
    if (event.key === TOKEN_KEY) {
      invalidateTokenCache();
      callback();
    }
  }
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    tokenListeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function saveTokens(tokens: StoredTokens): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  invalidateTokenCache();
  notifyTokenListeners();
}

export function loadTokens(): StoredTokens | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(TOKEN_KEY);
  if (raw === cachedRaw) return cachedTokens;
  cachedRaw = raw;
  if (!raw) {
    cachedTokens = null;
    return null;
  }
  try {
    cachedTokens = JSON.parse(raw) as StoredTokens;
  } catch {
    cachedTokens = null;
  }
  return cachedTokens;
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  invalidateTokenCache();
  notifyTokenListeners();
}

export function savePkce(pkce: Omit<StoredPkce, "createdAt">): void {
  if (typeof window === "undefined") return;
  const entry: StoredPkce = { ...pkce, createdAt: Date.now() };
  sessionStorage.setItem(PKCE_KEY, JSON.stringify(entry));
}

export function loadPkce(): StoredPkce | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PKCE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredPkce;
    // Reject stale entries so a login abandoned yesterday can't be
    // picked up when the user starts a fresh flow now.
    if (
      typeof parsed.createdAt !== "number" ||
      Date.now() - parsed.createdAt > PKCE_TTL_MS
    ) {
      sessionStorage.removeItem(PKCE_KEY);
      return null;
    }
    return parsed;
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
