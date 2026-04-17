import { z } from "zod";

// Runtime schemas for Quran Foundation User API responses.
//
// These sit between the wire (raw JSON from apis.quran.foundation) and
// the rest of the app. Every qfFetch call runs its response through
// one of these schemas via safeParse, so any shape drift surfaces as a
// loud validation error at the exact call site rather than silently
// yielding undefined fields that break UI three layers deep.
//
// Design notes:
//
//   - Default Zod mode strips unknown keys rather than rejecting them.
//     This is deliberate: QF may add new fields to list items at any
//     time (new bookmark metadata, new streak fields), and we don't
//     want every additive schema change on their side to break our
//     deployed bundle. Only field removals or type changes will fail
//     validation.
//
//   - Nullable vs optional matches the wire behaviour. A field sent
//     as null (e.g. bookmark.verseNumber for non-ayah bookmarks) is
//     .nullable(); a field that may be entirely absent from the
//     payload (e.g. bookmark.group) is .optional(). Mixing the two
//     catches bugs where we'd previously treated "null" and
//     "undefined" as interchangeable.
//
//   - Schema is the single source of truth for wire types. The
//     TypeScript interfaces in qf-user-api.ts derive via z.infer so
//     there is no chance of the runtime check and the compile-time
//     type going out of sync.

// Pagination envelope. The QF OpenAPI doesn't mark any of these
// fields as required, and in practice empty-list responses can omit
// cursors entirely rather than sending null. Every field is
// therefore optional + nullable to avoid the list endpoints hitting
// a validation failure when the user has zero items yet.
const paginationSchema = z.object({
  startCursor: z.string().nullable().optional(),
  endCursor: z.string().nullable().optional(),
  hasNextPage: z.boolean().optional(),
  hasPreviousPage: z.boolean().optional(),
});

// Envelope factories. `data` is required because every caller needs
// it (we can't render a list we don't have), but `success` and
// `pagination` are marked optional because the QF OpenAPI lists no
// required fields at the envelope level. Some list responses omit
// pagination entirely when the list is empty or when the endpoint
// doesn't support cursor paging; other responses omit the success
// flag on cached or proxied hops. Either omission used to trip the
// whole envelope validation and cascade to the mock-data fallback.
export function listEnvelope<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    success: z.boolean().optional(),
    data: z.array(item),
    pagination: paginationSchema.optional(),
  });
}

export function singleEnvelope<T extends z.ZodTypeAny>(data: T) {
  return z.object({
    success: z.boolean().optional(),
    data,
  });
}

// ─── Individual resource schemas ──────────────────────────────────────

export const qfBookmarkSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  type: z.string(),
  key: z.number(),
  // verseNumber is optional AND nullable per the QF schema. Surah-
  // level bookmarks (type !== "ayah") omit it entirely, and ayah
  // bookmarks with unusual metadata may send it as null.
  verseNumber: z.number().nullable().optional(),
  group: z.string().optional(),
  isInDefaultCollection: z.boolean().optional(),
  isReading: z.boolean().nullable().optional(),
  collectionsCount: z.number().optional(),
});

export const qfCollectionSchema = z.object({
  id: z.string(),
  updatedAt: z.string(),
  name: z.string(),
});

export const qfReadingSessionSchema = z.object({
  id: z.string(),
  updatedAt: z.string(),
  // chapterNumber and verseNumber are optional per the QF schema.
  // The only fields QF guarantees on every ReadingSession item are
  // id and updatedAt; positional data is populated when the session
  // was logged with explicit verse info but can be absent.
  chapterNumber: z.number().optional(),
  verseNumber: z.number().optional(),
});

// get-todays-plan is deliberately permissive. The `hasGoal` field is
// the discriminator; all other fields may be absent when hasGoal is
// false, and when hasGoal is true the server populates a subset per
// the OpenAPI oneOf schema (which Zod doesn't need to express since
// we treat the whole thing as a bag of optional fields and read only
// what we need).
export const qfTodayPlanSchema = z.object({
  hasGoal: z.boolean(),
  id: z.string().optional(),
  date: z.string().optional(),
  progress: z.number().optional(),
  type: z.string().optional(),
});

// Streak scalar. `/streaks/current-streak-days` returns exactly {days}.
export const qfStreakDaysSchema = z.object({
  days: z.number(),
});

// POST /bookmarks, POST /collections, POST /goals all echo back the
// created resource id inside data. We only need the id; the rest of
// the resource is read via a subsequent GET if the UI cares.
export const qfCreatedIdSchema = z.object({
  id: z.string(),
});

// POST /activity-days succeeds with {success: true, data: {}}. The
// empty object schema (in default strip mode) accepts any shape the
// server might grow into without breaking us.
export const qfEmptyDataSchema = z.object({});
