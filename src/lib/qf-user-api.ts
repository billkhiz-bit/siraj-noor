import type { z } from "zod";
import { QF_API_BASE, QF_CLIENT_ID } from "./auth/config";
import { loadTokens, isExpiredSoon } from "./auth/storage";
import { refreshTokens } from "./auth/qf-oauth";
import {
  listEnvelope,
  singleEnvelope,
  qfBookmarkSchema,
  qfCollectionSchema,
  qfReadingSessionSchema,
  qfTodayPlanSchema,
  qfStreakDaysSchema,
  qfCreatedIdSchema,
  qfEmptyDataSchema,
} from "./qf-schemas";

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

// qfFetch is the single chokepoint for every call to the QF User API.
//
// It takes a Zod schema for the expected response shape and validates
// the parsed JSON against that schema before returning. Shape drift
// surfaces as a loud QfApiError logged with the exact validation issue
// path, not as silent undefined fields that break UI three layers
// deep. The schema is also the single source of truth for the return
// type - callers don't need to pass a type parameter.
//
// 204 No Content responses (DELETE endpoints) short-circuit before
// validation and return undefined; the caller types the response as
// void and ignores the value.
async function qfFetch<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  init: RequestInit = {},
  retriedOnAuth = false
): Promise<z.infer<S>> {
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

  if (response.status === 204) return undefined as z.infer<S>;

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
    if (refreshed) return qfFetch(path, schema, init, true);
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
  let rawJson: unknown;
  try {
    rawJson = JSON.parse(bodyText);
  } catch {
    throw new QfApiError(
      `Non-JSON response from ${path}: ${bodyText.slice(0, 120)}`,
      502
    );
  }

  // Runtime-validate the parsed JSON. safeParse rather than parse so
  // we control the error message and log the full validation issue
  // list before throwing. The console.error is the primary signal
  // for debugging shape drift - judges or maintainers reading the
  // network tab will see a 200 with an obvious mismatch rather than
  // a cryptic type error two files away.
  const parsed = schema.safeParse(rawJson);
  if (!parsed.success) {
    console.error(
      `[qfFetch] Response shape validation failed for ${path}:`,
      parsed.error.issues,
      "\nResponse preview:",
      bodyText.slice(0, 300)
    );
    const firstIssue = parsed.error.issues[0];
    const issuePath = firstIssue?.path.join(".") || "(root)";
    const issueMsg = firstIssue?.message || "unknown";
    const preview = bodyText.slice(0, 140).replace(/\s+/g, " ");
    throw new QfApiError(
      `shape mismatch at ${issuePath}: ${issueMsg} | body: ${preview}`,
      response.status
    );
  }

  return parsed.data;
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
  // description lives client-side only. QF's POST /collections rejects
  // `additionalProperties`, so any description the user types in the
  // composer is held in memory + localStorage for this browser rather
  // than persisted to the server. See CollectionsProvider for the
  // optimistic reconciliation.
  description?: string;
  created_at?: string;
}

export interface ReadingSession {
  id: string;
  verse_key?: string;
  chapter_id?: number;
  created_at?: string;
}

// Full QF goal type enum per api-docs.quran.foundation. The UI only
// exposes QURAN_TIME today (simplest UX: "read for N minutes a day")
// but the type accepts the broader set for future expansion.
export type GoalType =
  | "QURAN_TIME"
  | "QURAN_PAGES"
  | "QURAN_RANGE"
  | "COURSE"
  | "QURAN_READING_PROGRAM"
  | "RAMADAN_CHALLENGE";

// POST /goals category enum. QURAN is the bucket for QURAN_TIME,
// QURAN_PAGES, and QURAN_RANGE goals. The other three categories map
// 1:1 to their type values and aren't used by the current UI.
export type GoalCategory =
  | "QURAN"
  | "COURSE"
  | "QURAN_READING_PROGRAM"
  | "RAMADAN_CHALLENGE";

// Shape returned by GET /goals/get-todays-plan. The server computes
// progress as a 0-1 ratio from logged reading sessions vs. the goal's
// target, so the client doesn't need to track per-day completion.
// The target amount isn't included in the response, so the UI
// persists it locally when the goal is created.
export interface TodayGoalPlan {
  hasGoal: boolean;
  progress: number;
  activityDayId?: string;
  date?: string;
  activityType?: string;
}

// ─── QF wire-format types ────────────────────────────────────────────
// Inferred directly from the Zod schemas so the compile-time and
// runtime views of the API stay in lockstep.

type QfBookmark = z.infer<typeof qfBookmarkSchema>;
type QfCollection = z.infer<typeof qfCollectionSchema>;
type QfReadingSession = z.infer<typeof qfReadingSessionSchema>;

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
  // QF's live server doesn't always populate the `type` field, so
  // infer ayah-level vs surah-level from verseNumber presence. A
  // non-null verseNumber means we have a precise ayah; otherwise the
  // bookmark is a surah-level save keyed by chapter number alone.
  const isAyah = q.type === "ayah" || q.verseNumber != null;
  const verse_key =
    isAyah && q.verseNumber != null
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
  // chapterNumber and verseNumber are optional in the QF response.
  // Falling back to undefined when either is missing keeps the
  // internal ReadingSession shape honest rather than emitting a
  // "undefined:undefined" verse_key string that would leak into
  // the UI as broken labels.
  const verse_key =
    q.chapterNumber !== undefined && q.verseNumber !== undefined
      ? `${q.chapterNumber}:${q.verseNumber}`
      : undefined;
  return {
    id: q.id,
    chapter_id: q.chapterNumber,
    verse_key,
    created_at: q.updatedAt,
  };
}

// Timezone helper. Used by every endpoint that depends on day
// boundaries (streaks, goals, reading sessions) so the server
// computes "today" against the user's local day, not UTC.
function currentTimezone(): string {
  return typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    : "UTC";
}

export const qfApi = {
  listBookmarks: async (
    mushafId: number = DEFAULT_MUSHAF_ID
  ): Promise<{ bookmarks: Bookmark[] }> => {
    const env = await qfFetch(
      `/bookmarks?mushafId=${mushafId}&first=${DEFAULT_PAGE_SIZE}`,
      listEnvelope(qfBookmarkSchema)
    );
    return { bookmarks: env.data.map(toBookmark) };
  },
  createBookmark: async (verseKey: string): Promise<Bookmark> => {
    // QF POST /bookmarks takes {key, verseNumber, mushaf, type:"ayah"} -
    // no free-form `note` field (OpenAPI says additionalProperties:false,
    // so sending it would 422). Notes are kept client-side by the
    // BookmarksProvider; the QF trip does not carry reflection text.
    const [ch, vs] = verseKey.split(":").map((s) => parseInt(s, 10));
    if (Number.isNaN(ch) || Number.isNaN(vs)) {
      throw new QfApiError(`Invalid verse_key: ${verseKey}`, 400);
    }
    const env = await qfFetch(
      "/bookmarks",
      singleEnvelope(qfBookmarkSchema),
      {
        method: "POST",
        body: JSON.stringify({
          key: ch,
          verseNumber: vs,
          type: "ayah",
          mushaf: DEFAULT_MUSHAF_ID,
        }),
      }
    );
    return toBookmark(env.data);
  },
  deleteBookmark: async (id: string): Promise<void> => {
    // 204 No Content on success. The schema is never consulted on a
    // 204 (qfFetch short-circuits), so any schema that matches "no
    // body expected" is fine here. We pass a singleEnvelope over an
    // empty object as a conservative stand-in for any non-204 error
    // response body that might sneak through.
    await qfFetch(
      `/bookmarks/${id}`,
      singleEnvelope(qfCreatedIdSchema),
      { method: "DELETE" }
    );
  },

  listCollections: async (): Promise<{ collections: Collection[] }> => {
    const env = await qfFetch(
      `/collections?first=${DEFAULT_PAGE_SIZE}`,
      listEnvelope(qfCollectionSchema)
    );
    return { collections: env.data.map(toCollection) };
  },
  createCollection: async (name: string): Promise<Collection> => {
    // QF POST /collections accepts only {name} (additionalProperties:false).
    // Descriptions the user types in the composer are kept client-side
    // by CollectionsProvider, not sent to QF.
    const env = await qfFetch(
      "/collections",
      singleEnvelope(qfCollectionSchema),
      {
        method: "POST",
        body: JSON.stringify({ name }),
      }
    );
    return toCollection(env.data);
  },
  updateCollection: async (
    id: string,
    body: Partial<Collection>
  ): Promise<Collection> => {
    const env = await qfFetch(
      `/collections/${id}`,
      singleEnvelope(qfCollectionSchema),
      {
        method: "PATCH",
        body: JSON.stringify({ name: body.name }),
      }
    );
    return toCollection(env.data);
  },
  deleteCollection: async (id: string): Promise<void> => {
    await qfFetch(
      `/collections/${id}`,
      singleEnvelope(qfCreatedIdSchema),
      { method: "DELETE" }
    );
  },

  createReadingSession: async (
    chapterId: number,
    verseKey?: string
  ): Promise<ReadingSession> => {
    // QF POST /reading-sessions requires {chapterNumber, verseNumber}.
    // If the caller didn't specify a verse, default to the first.
    const vs = verseKey ? parseInt(verseKey.split(":")[1] ?? "1", 10) : 1;
    const env = await qfFetch(
      "/reading-sessions",
      singleEnvelope(qfReadingSessionSchema),
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
    const env = await qfFetch(
      `/reading-sessions?first=${DEFAULT_PAGE_SIZE}`,
      listEnvelope(qfReadingSessionSchema)
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
    // stays at 3 past midnight UTC instead of resetting.
    const env = await qfFetch(
      "/streaks/current-streak-days?type=QURAN",
      singleEnvelope(qfStreakDaysSchema),
      { headers: { "x-timezone": currentTimezone() } }
    );
    return {
      current_streak: env.data.days,
      longest_streak: 0,
    };
  },

  getTodaysGoalPlan: async (
    type: GoalType = "QURAN_TIME"
  ): Promise<TodayGoalPlan> => {
    // QF's live server requires mushafId on this endpoint even though
    // the published OpenAPI lists only `type` as required. Sending
    // DEFAULT_MUSHAF_ID (Hafs) matches the rest of the goals surface.
    const env = await qfFetch(
      `/goals/get-todays-plan?type=${encodeURIComponent(type)}&mushafId=${DEFAULT_MUSHAF_ID}`,
      singleEnvelope(qfTodayPlanSchema),
      { headers: { "x-timezone": currentTimezone() } }
    );
    return {
      hasGoal: env.data.hasGoal,
      progress: env.data.progress ?? 0,
      activityDayId: env.data.id,
      date: env.data.date,
      activityType: env.data.type,
    };
  },

  createGoal: async (
    type: GoalType,
    amount: number | string,
    category: GoalCategory = "QURAN",
    options: { mushafId?: number; duration?: number } = {}
  ): Promise<{ id: string }> => {
    const mushafId = options.mushafId ?? DEFAULT_MUSHAF_ID;
    const body: Record<string, unknown> = { type, amount, category };
    if (options.duration !== undefined) body.duration = options.duration;
    const env = await qfFetch(
      `/goals?mushafId=${mushafId}`,
      singleEnvelope(qfCreatedIdSchema),
      {
        method: "POST",
        headers: { "x-timezone": currentTimezone() },
        body: JSON.stringify(body),
      }
    );
    return { id: env.data.id };
  },

  deleteGoal: async (
    id: string,
    category: GoalCategory = "QURAN"
  ): Promise<void> => {
    await qfFetch(
      `/goals/${id}?category=${encodeURIComponent(category)}`,
      singleEnvelope(qfCreatedIdSchema),
      {
        method: "DELETE",
        headers: { "x-timezone": currentTimezone() },
      }
    );
  },

  // POST /activity-days QURAN variant.
  //
  // This is the endpoint that actually drives QURAN_TIME goal
  // progress. POST /reading-sessions logs "user was at this verse at
  // this time" which powers the activity heatmap and streaks, but
  // progress against a time-based goal only moves when the server
  // receives an activity-day entry carrying an explicit `seconds`
  // count plus the ayah `ranges` covered.
  //
  // Multiple calls on the same day aggregate server-side; the
  // caller doesn't need to track cumulative totals.
  //
  // The `keepalive` hint in the RequestInit keeps the fetch alive
  // across a page unload (up to 64KB payload, per the Fetch spec).
  // Useful for the ReadingTracker's visibilitychange/unmount flush.
  logActivity: async (
    seconds: number,
    ranges: string[],
    options: { mushafId?: number; keepalive?: boolean } = {}
  ): Promise<void> => {
    const mushafId = options.mushafId ?? DEFAULT_MUSHAF_ID;
    // QF's OpenAPI requires seconds >= 1. Guard against zero-duration
    // calls (e.g., an aborted navigation before any real time passed).
    const safeSeconds = Math.max(1, Math.min(3600, Math.floor(seconds)));
    await qfFetch(
      "/activity-days",
      singleEnvelope(qfEmptyDataSchema),
      {
        method: "POST",
        headers: { "x-timezone": currentTimezone() },
        body: JSON.stringify({
          type: "QURAN",
          seconds: safeSeconds,
          ranges,
          mushafId,
        }),
        ...(options.keepalive ? { keepalive: true } : {}),
      }
    );
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
