import { surahs } from "@/lib/data/surahs";

const TOTAL_AYAT = 6236;
const GOLDEN = 0x9e3779b1;

function dateSeed(date: Date = new Date()): number {
  const utcDayIndex =
    Math.floor(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
        86_400_000
    );
  return Math.imul(utcDayIndex, GOLDEN) >>> 0;
}

export interface DailyAyahPick {
  chapter: number;
  verse: number;
  verseKey: string;
}

export function pickDailyAyah(date: Date = new Date()): DailyAyahPick {
  const index = (dateSeed(date) % TOTAL_AYAT) + 1;
  let remaining = index;
  for (const s of surahs) {
    if (remaining <= s.ayatCount) {
      return {
        chapter: s.number,
        verse: remaining,
        verseKey: `${s.number}:${remaining}`,
      };
    }
    remaining -= s.ayatCount;
  }
  return { chapter: 1, verse: 1, verseKey: "1:1" };
}
