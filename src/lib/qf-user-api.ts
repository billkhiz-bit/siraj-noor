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

async function authHeaders(): Promise<Record<string, string>> {
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
  const headers: Record<string, string> = {
    ...(await authHeaders()),
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };
  // Only advertise a JSON body when there's actually a body. Sending
  // Content-Type on a GET is harmless in most servers but looks odd in a
  // minimal repro and can trigger stricter gateways to preflight or reject.
  if (init.body !== undefined && !("Content-Type" in headers)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${QF_API_BASE}${path}`, { ...init, headers });

  if (response.status === 204) return undefined as T;

  // Read the body exactly once. QF's gateway wraps revoked-token errors
  // as 403 with `{"type":"invalid_token"}` rather than the RFC 6750
  // 401, so we have to pattern-match the payload before deciding
  // whether to retry. Hydra's own endpoints (not in this gateway path
  // today, but kept for forward compatibility) return 401 for the
  // same condition.
  const bodyText = await response.text();

  const shouldRefreshAndRetry =
    !retriedOnAuth &&
    (response.status === 401 ||
      (response.status === 403 && bodyText.includes("invalid_token")));

  if (shouldRefreshAndRetry) {
    const refreshed = await refreshTokens();
    if (refreshed) return qfFetch<T>(path, init, true);
  }

  if (!response.ok) {
    throw new QfApiError(
      `${response.status} ${response.statusText}${bodyText ? ` - ${bodyText}` : ""}`,
      response.status
    );
  }

  // QF occasionally returns HTML error pages on gateway misbehaviour
  // (Cloudflare 5xx, maintenance windows). Parsing a non-JSON body
  // with a bare JSON.parse would throw SyntaxError that callers
  // can't distinguish from a genuine API error. Wrap and map to a
  // 502 so providers surface "couldn't load" instead of bubbling an
  // unhandled rejection.
  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new QfApiError(
      `Non-JSON response from ${path}: ${bodyText.slice(0, 120)}`,
      502
    );
  }
}

// ─── Internal app-facing shapes ──────────────────────────────────────
// These are the types the UI and providers read. They use snake_case
// field names matching our pre-QF-integration mock data, so the UI
// layer is insulated from QF's camelCase/kebab-case conventions and
// the envelope wrapping. Every QF response is adapted into one of
// these shapes via the mapper functions below.

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

// ─── QF wire-format types (what the API actually returns) ────────────

interface QfListEnvelope<T> {
  success: boolean;
  data: T[];
  pagination: {
    startCursor: string | null;
    endCursor: string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface QfSingleEnvelope<T> {
  success: boolean;
  data: T;
}

interface QfBookmark {
  id: string;
  createdAt: string;
  type: string;
  key: number;
  verseNumber: number | null;
  group?: string;
  isInDefaultCollection?: boolean;
  isReading?: boolean | null;
  collectionsCount?: number;
}

interface QfCollection {
  id: string;
  updatedAt: string;
  name: string;
}

interface QfReadingSession {
  id: string;
  updatedAt: string;
  chapterNumber: number;
  verseNumber: number;
}

// Hafs (mushafId=4) is the default Arabic script for QF's User APIs and is
// required by the bookmarks GET endpoint per
// api-docs.quran.foundation → auth-get-v-1-bookmarks. Once we expose a
// per-user mushaf preference we'll thread the id through; for now it's a
// stable default that matches the Qur'an.com web experience.
const DEFAULT_MUSHAF_ID = 4;

// QF's list endpoints use cursor pagination and reject requests
// without `first` or `last` as HTTP 422 ValidationError. The OpenAPI
// spec bounds both params to the inclusive range 1–20.
const DEFAULT_PAGE_SIZE = 20;

// ─── Adapters: QF wire shape → internal app shape ────────────────────

function toBookmark(q: QfBookmark): Bookmark {
  const verse_key =
    q.type === "ayah" && q.verseNumber != null
      ? `${q.key}:${q.verseNumber}`
      : String(q.key);
  return {
    id: q.id,
    verse_key,
    created_at: q.createdAt,
  };
}

function toCollection(q: QfCollection): Collection {
  return {
    id: q.id,
    name: q.name,
    created_at: q.updatedAt,
  };
}

function toReadingSession(q: QfReadingSession): ReadingSession {
  return {
    id: q.id,
    chapter_id: q.chapterNumber,
    verse_key: `${q.chapterNumber}:${q.verseNumber}`,
    created_at: q.updatedAt,
  };
}

export const qfApi = {
  listBookmarks: async (
    mushafId: number = DEFAULT_MUSHAF_ID
  ): Promise<{ bookmarks: Bookmark[] }> => {
    const env = await qfFetch<QfListEnvelope<QfBookmark>>(
      `/bookmarks?mushafId=${mushafId}&first=${DEFAULT_PAGE_SIZE}`
    );
    return { bookmarks: env.data.map(toBookmark) };
  },
  createBookmark: async (
    verseKey: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _note?: string
  ): Promise<Bookmark> => {
    // QF POST /bookmarks takes {key, verseNumber, mushaf, type:"ayah"} -
    // no free-form `note` field (OpenAPI says additionalProperties:false,
    // so sending it would 422). We split the "chapter:verse" string the
    // UI passes in. Silently drop `note` for now; add it back if QF ever
    // exposes a note field.
    const [ch, vs] = verseKey.split(":").map((s) => parseInt(s, 10));
    if (Number.isNaN(ch) || Number.isNaN(vs)) {
      throw new QfApiError(`Invalid verse_key: ${verseKey}`, 400);
    }
    const env = await qfFetch<QfSingleEnvelope<QfBookmark>>("/bookmarks", {
      method: "POST",
      body: JSON.stringify({
        key: ch,
        verseNumber: vs,
        type: "ayah",
        mushaf: DEFAULT_MUSHAF_ID,
      }),
    });
    return toBookmark(env.data);
  },
  deleteBookmark: (id: string) =>
    qfFetch<void>(`/bookmarks/${id}`, { method: "DELETE" }),

  listCollections: async (): Promise<{ collections: Collection[] }> => {
    const env = await qfFetch<QfListEnvelope<QfCollection>>(
      `/collections?first=${DEFAULT_PAGE_SIZE}`
    );
    return { collections: env.data.map(toCollection) };
  },
  createCollection: async (
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _description?: string
  ): Promise<Collection> => {
    // QF POST /collections accepts only {name} (additionalProperties:false).
    const env = await qfFetch<QfSingleEnvelope<QfCollection>>("/collections", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    return toCollection(env.data);
  },
  updateCollection: async (
    id: string,
    body: Partial<Collection>
  ): Promise<Collection> => {
    const env = await qfFetch<QfSingleEnvelope<QfCollection>>(
      `/collections/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name: body.name }),
      }
    );
    return toCollection(env.data);
  },
  deleteCollection: (id: string) =>
    qfFetch<void>(`/collections/${id}`, { method: "DELETE" }),

  createReadingSession: async (
    chapterId: number,
    verseKey?: string
  ): Promise<ReadingSession> => {
    // QF POST /reading-sessions requires {chapterNumber, verseNumber}.
    // If the caller didn't specify a verse, default to the first.
    const vs = verseKey ? parseInt(verseKey.split(":")[1] ?? "1", 10) : 1;
    const env = await qfFetch<QfSingleEnvelope<QfReadingSession>>(
      "/reading-sessions",
      {
        method: "POST",
        body: JSON.stringify({
          chapterNumber: chapterId,
          verseNumber: Number.isNaN(vs) ? 1 : vs,
        }),
      }
    );
    return toReadingSession(env.data);
  },
  listReadingSessions: async (): Promise<{
    reading_sessions: ReadingSession[];
  }> => {
    const env = await qfFetch<QfListEnvelope<QfReadingSession>>(
      `/reading-sessions?first=${DEFAULT_PAGE_SIZE}`
    );
    return { reading_sessions: env.data.map(toReadingSession) };
  },

  getStreak: async (): Promise<{
    current_streak: number;
    longest_streak: number;
  }> => {
    // /streaks/current-streak-days returns a scalar {days}. The list
    // endpoint /streaks returns paginated history, which isn't what the
    // activity page wants. QF's User API v1 doesn't currently expose a
    // longest-streak scalar, so we return 0 as a sentinel - the UI
    // renders "-" for longest when the value is 0 rather than showing
    // an equal mirror of the current streak (which would be misleading).
    //
    // x-timezone lets the server compute "today" against the user's
    // local day boundary rather than UTC - a streak of 3 at 2300 Pacific
    // stays at 3 past midnight UTC instead of resetting. QF lists the
    // header as optional but recommended; we default to the browser's
    // IANA zone and fall back to UTC on SSR or exotic runtimes.
    const tz =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
        : "UTC";
    const env = await qfFetch<QfSingleEnvelope<{ days: number }>>(
      "/streaks/current-streak-days?type=QURAN",
      { headers: { "x-timezone": tz } }
    );
    return {
      current_streak: env.data.days,
      longest_streak: 0,
    };
  },

  // createReflection is intentionally omitted. QF's POST /posts is a
  // community-room feature, not a private notes endpoint: the schema
  // requires roomId, postAsAuthorId, publishedAt, references array,
  // mentions array, and a room-post status - see CreatePostDto in
  // api-docs.quran.foundation. Our original UX ("private note on an
  // ayah, visible only to you") doesn't map onto community posts, so
  // we removed the button rather than ship a surface that 4xxs on
  // every save. Revisit if QF exposes a private-note endpoint.
};
