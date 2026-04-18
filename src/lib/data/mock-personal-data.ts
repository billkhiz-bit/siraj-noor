// Mock preview data for the personal companion pages.
//
// Used on /bookmarks, /collections, and /activity when:
//   1. The user is not signed in - gives them a visual preview of what the
//      feature looks like populated, before committing to OAuth.
//   2. The user is signed in but the User API is returning an error - keeps
//      the page looking complete during transient issues (e.g. prelive
//      sandbox outages) instead of showing a broken error banner.
//
// Sample verses are chosen for thematic depth, not randomness - each should
// feel like an ayah a reflective reader might actually bookmark.

import type { Bookmark, Collection, ReadingSession } from "@/lib/qf-user-api";

export interface StreakInfo {
  current: number;
  longest: number;
}

// ─── Bookmarks ─────────────────────────────────────────────────────────
// Each mock bookmark includes a note that acts as a personal reflection -
// this doubles as a subtle demonstration of the reflections feature.

export const MOCK_BOOKMARKS: Bookmark[] = [
  {
    id: "mock-bookmark-1",
    verse_key: "2:255",
    created_at: "2026-04-12T08:15:00Z",
    note: "Ayat al-Kursi - the verse I try to read before leaving the house.",
  },
  {
    id: "mock-bookmark-2",
    verse_key: "94:5",
    created_at: "2026-04-10T19:32:00Z",
    note: "So, surely with hardship comes ease.",
  },
  {
    id: "mock-bookmark-3",
    verse_key: "13:28",
    created_at: "2026-04-09T14:07:00Z",
    note: "Hearts find rest in the remembrance of Allah.",
  },
  {
    id: "mock-bookmark-4",
    verse_key: "41:34",
    created_at: "2026-04-07T22:45:00Z",
    note: "Repel evil with what is better.",
  },
  {
    id: "mock-bookmark-5",
    verse_key: "2:286",
    created_at: "2026-04-05T06:20:00Z",
    note: "Allah does not burden a soul beyond what it can bear.",
  },
  {
    id: "mock-bookmark-6",
    verse_key: "55:13",
    created_at: "2026-04-03T11:10:00Z",
    note: "Then which of the favours of your Lord will you deny?",
  },
];

// ─── Collections ───────────────────────────────────────────────────────

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: "mock-collection-1",
    name: "Verses for hard days",
    description:
      "Short reminders I turn to when the week feels heavier than usual.",
    created_at: "2026-03-28T09:00:00Z",
  },
  {
    id: "mock-collection-2",
    name: "Ayahs that made me pause",
    description:
      "Moments in recitation where I had to stop and sit with what I'd just read.",
    created_at: "2026-03-15T17:45:00Z",
  },
  {
    id: "mock-collection-3",
    name: "Before Fajr",
    description: "My short morning rotation, one surah at a time.",
    created_at: "2026-02-22T05:30:00Z",
  },
];

// ─── Reading sessions ──────────────────────────────────────────────────
// Generated deterministically so the mock heatmap looks lived-in but
// doesn't shift between renders. Distribution: heavier activity in the
// last 2-3 weeks, scattered sessions across the previous month, thin tail
// going back ~3 months. Approximates the pattern of a committed reader who
// just recently ramped up.

function isoDaysAgo(daysAgo: number, hour = 19, minute = 30): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

function mockSession(
  idSuffix: string,
  daysAgo: number,
  chapterId: number,
  verseKey?: string,
  hour = 19
): ReadingSession {
  return {
    id: `mock-session-${idSuffix}`,
    chapter_id: chapterId,
    verse_key: verseKey,
    created_at: isoDaysAgo(daysAgo, hour),
  };
}

// 28 sessions across the last ~90 days, clustered toward the present.
export const MOCK_READING_SESSIONS: ReadingSession[] = [
  // Today + yesterday: two sessions each, simulating recent momentum
  mockSession("a", 0, 2, "2:255"),
  mockSession("b", 0, 1, "1:1", 6),
  mockSession("c", 1, 36, "36:1"),
  mockSession("d", 1, 18, "18:10", 21),
  // Past week
  mockSession("e", 2, 67),
  mockSession("f", 3, 55, "55:13"),
  mockSession("g", 4, 94, "94:5"),
  mockSession("h", 4, 94, "94:5", 22),
  mockSession("i", 5, 13, "13:28"),
  mockSession("j", 6, 2, "2:286"),
  mockSession("k", 7, 12),
  // Past 2-3 weeks
  mockSession("l", 9, 36),
  mockSession("m", 10, 112),
  mockSession("n", 11, 41, "41:34"),
  mockSession("o", 13, 1),
  mockSession("p", 14, 78),
  mockSession("q", 15, 67),
  mockSession("r", 17, 55),
  mockSession("s", 19, 2, "2:255"),
  mockSession("t", 21, 36),
  // Past month
  mockSession("u", 26, 18),
  mockSession("v", 31, 55),
  mockSession("w", 35, 112),
  mockSession("x", 40, 67),
  mockSession("y", 48, 2),
  mockSession("z", 55, 36),
  mockSession("aa", 62, 1),
  mockSession("ab", 74, 18),
];

// Derived from MOCK_READING_SESSIONS - 14 unique days in the last 14, 23
// in the last 60. Current streak starts counting from day 0 backwards.
export const MOCK_STREAK: StreakInfo = {
  current: 9,
  longest: 31,
};

// Chapter IDs derived from MOCK_READING_SESSIONS - used by the surah ring
// to light up "read" surahs in preview mode.
export const MOCK_READ_SURAHS: Set<number> = new Set(
  MOCK_READING_SESSIONS.map((s) => s.chapter_id).filter(
    (id): id is number => typeof id === "number"
  )
);

// ─── Daily goal preview ────────────────────────────────────────────────
// Shown to signed-out visitors so the goal card isn't empty on the
// landing page. 60% progress on a 10-minute target shows both "a real
// goal exists" and "there's still room to grow today", which reads
// better than either 0% or 100%.
export const MOCK_GOAL = {
  targetSeconds: 600,
  progress: 0.6,
};
