import { QF_API_BASE, QF_CLIENT_ID } from "./auth/config";
import { loadTokens, isExpiredSoon } from "./auth/storage";
import { refreshTokens } from "./auth/qf-oauth";

export class QfApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "QfApiError";
    this.status = status;
  }
}

async function authHeaders(): Promise<HeadersInit> {
  let tokens = loadTokens();
  if (tokens && isExpiredSoon(tokens)) {
    tokens = await refreshTokens();
  }
  if (!tokens) throw new QfApiError("Not authenticated", 401);
  return {
    "x-auth-token": tokens.accessToken,
    "x-client-id": QF_CLIENT_ID,
  };
}

async function qfFetch<T>(
  path: string,
  init: RequestInit = {},
  retriedOnAuth = false
): Promise<T> {
  const headers = {
    ...(await authHeaders()),
    "Content-Type": "application/json",
    ...(init.headers ?? {}),
  };

  const response = await fetch(`${QF_API_BASE}${path}`, { ...init, headers });

  if (response.status === 401 && !retriedOnAuth) {
    const refreshed = await refreshTokens();
    if (refreshed) return qfFetch<T>(path, init, true);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new QfApiError(
      `${response.status} ${response.statusText}${text ? ` — ${text}` : ""}`,
      response.status
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface Bookmark {
  id: string;
  verse_key: string;
  created_at?: string;
  note?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  bookmarks_count?: number;
  created_at?: string;
}

export interface ReadingSession {
  id: string;
  verse_key?: string;
  chapter_id?: number;
  duration_seconds?: number;
  created_at: string;
}

export const qfApi = {
  listBookmarks: () => qfFetch<{ bookmarks: Bookmark[] }>("/bookmarks"),
  createBookmark: (verseKey: string, note?: string) =>
    qfFetch<Bookmark>("/bookmarks", {
      method: "POST",
      body: JSON.stringify({ verse_key: verseKey, note }),
    }),
  deleteBookmark: (id: string) =>
    qfFetch<void>(`/bookmarks/${id}`, { method: "DELETE" }),

  listCollections: () =>
    qfFetch<{ collections: Collection[] }>("/collections"),
  createCollection: (name: string, description?: string) =>
    qfFetch<Collection>("/collections", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),
  updateCollection: (id: string, body: Partial<Collection>) =>
    qfFetch<Collection>(`/collections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteCollection: (id: string) =>
    qfFetch<void>(`/collections/${id}`, { method: "DELETE" }),

  createReadingSession: (chapterId: number, verseKey?: string) =>
    qfFetch<ReadingSession>("/reading_sessions", {
      method: "POST",
      body: JSON.stringify({ chapter_id: chapterId, verse_key: verseKey }),
    }),
  listReadingSessions: () =>
    qfFetch<{ reading_sessions: ReadingSession[] }>("/reading_sessions"),

  getStreak: () =>
    qfFetch<{ current_streak: number; longest_streak: number }>("/streaks"),

  createReflection: (verseKey: string, text: string) =>
    qfFetch<{ id: string }>("/posts", {
      method: "POST",
      body: JSON.stringify({ verse_key: verseKey, body: text }),
    }),
};
