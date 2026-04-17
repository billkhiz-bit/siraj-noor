const BASE_URL = "https://api.quran.com/api/v4";

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  transliteration?: string;
  juz_number: number;
  hizb_number: number;
  ruku_number: number;
  page_number: number;
  sajdah_number: number | null;
  translation?: string;
}

export interface ChapterInfo {
  id: number;
  chapter_id: number;
  text: string;
  short_text: string;
  source: string;
}

export async function fetchVerses(
  chapterId: number,
  page = 1,
  perPage = 50
): Promise<{ verses: Verse[]; totalCount: number }> {
  // Two parallel requests: one for translations, one for transliteration (words)
  const [transRes, wordsRes] = await Promise.all([
    fetch(
      `${BASE_URL}/verses/by_chapter/${chapterId}?language=en&translations=20&fields=text_uthmani,verse_key&per_page=${perPage}&page=${page}`,
      { cache: "force-cache" }
    ),
    fetch(
      `${BASE_URL}/verses/by_chapter/${chapterId}?language=en&fields=verse_key&words=true&word_fields=transliteration&per_page=${perPage}&page=${page}`,
      { cache: "force-cache" }
    ),
  ]);

  if (!transRes.ok) throw new Error(`Failed to fetch verses for chapter ${chapterId}`);

  const transData = await transRes.json();
  const wordsData = wordsRes.ok ? await wordsRes.json() : { verses: [] };

  // Build transliteration map keyed by verse_key
  interface ApiWord {
    transliteration?: { text: string | null };
  }
  interface ApiWordVerse {
    verse_key: string;
    words?: ApiWord[];
  }

  const translitMap: Record<string, string> = {};
  (wordsData.verses || []).forEach((wv: ApiWordVerse) => {
    const words = (wv.words || [])
      .filter((w: ApiWord) => w.transliteration?.text)
      .map((w: ApiWord) => w.transliteration!.text!);
    if (words.length > 0) {
      translitMap[wv.verse_key as string] = words.join(" ");
    }
  });

  const verses: Verse[] = transData.verses.map(
    (v: Record<string, unknown> & { translations?: Array<{ text: string }> }) => ({
      id: v.id,
      verse_number: v.verse_number,
      verse_key: v.verse_key,
      text_uthmani: v.text_uthmani,
      transliteration: translitMap[v.verse_key as string] || undefined,
      juz_number: v.juz_number,
      hizb_number: v.hizb_number,
      ruku_number: v.ruku_number,
      page_number: v.page_number,
      sajdah_number: v.sajdah_number,
      translation: v.translations?.[0]?.text?.replace(/<[^>]*>/g, "") ?? undefined,
    })
  );

  return {
    verses,
    totalCount: transData.pagination?.total_records ?? verses.length,
  };
}

export async function fetchAllVerses(chapterId: number): Promise<Verse[]> {
  const allVerses: Verse[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { verses, totalCount } = await fetchVerses(chapterId, page, 50);
    allVerses.push(...verses);
    hasMore = allVerses.length < totalCount;
    page++;
  }

  return allVerses;
}

export async function fetchChapterInfo(chapterId: number): Promise<ChapterInfo | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/chapters/${chapterId}/info?language=en`,
      { cache: "force-cache" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.chapter_info;
  } catch {
    return null;
  }
}

// Mishary Rashid al-Afasy (Murattal). Qur'an.com's default reciter -
// distinctive, clear, widely recognised. id 7 per /recitations.
const DEFAULT_RECITER_ID = 7;

export interface ChapterAudio {
  audioUrl: string;
  durationSeconds: number;
  reciterId: number;
}

// Default tafsir is Ibn Kathir (Abridged, English), id 169. Verified
// against api.quran.com/api/v4/resources/tafsirs?language=en. The
// picker in the TafsirPanel lets the user switch between this,
// Ma'arif al-Qur'an (168), and Tazkirul Quran (817). Full preset
// list and localStorage persistence live in lib/tafsir-presets.ts.
const DEFAULT_TAFSIR_ID = 169;

export interface Tafsir {
  verseKey: string;
  name: string;
  language: string;
  text: string; // HTML - may contain <p>, <br>, etc.
}

export async function fetchTafsir(
  verseKey: string,
  tafsirId: number = DEFAULT_TAFSIR_ID
): Promise<Tafsir | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/tafsirs/${tafsirId}/by_ayah/${verseKey}`,
      { cache: "force-cache" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      tafsir?: {
        verse_key: string;
        resource_name?: string;
        language_name?: string;
        text?: string;
      };
    };
    if (!data.tafsir?.text) return null;
    return {
      verseKey: data.tafsir.verse_key,
      name: data.tafsir.resource_name ?? "Commentary",
      language: data.tafsir.language_name ?? "en",
      text: data.tafsir.text,
    };
  } catch {
    return null;
  }
}

export async function fetchChapterAudio(
  chapterId: number,
  reciterId: number = DEFAULT_RECITER_ID
): Promise<ChapterAudio | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/chapter_recitations/${reciterId}/${chapterId}`,
      { cache: "force-cache" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      audio_file?: { audio_url?: string; duration?: number };
    };
    const audioUrl = data.audio_file?.audio_url;
    if (!audioUrl) return null;
    return {
      audioUrl,
      durationSeconds: data.audio_file?.duration ?? 0,
      reciterId,
    };
  } catch {
    return null;
  }
}

export async function fetchVerseByKey(verseKey: string): Promise<Verse | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/verses/by_key/${verseKey}?language=en&translations=20&fields=text_uthmani,verse_key,verse_number,juz_number,hizb_number,ruku_number,page_number,sajdah_number`,
      { cache: "force-cache" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const v = data.verse as Record<string, unknown> & {
      translations?: Array<{ text: string }>;
    };
    if (!v) return null;
    return {
      id: v.id as number,
      verse_number: v.verse_number as number,
      verse_key: v.verse_key as string,
      text_uthmani: v.text_uthmani as string,
      juz_number: v.juz_number as number,
      hizb_number: v.hizb_number as number,
      ruku_number: v.ruku_number as number,
      page_number: v.page_number as number,
      sajdah_number: (v.sajdah_number as number | null) ?? null,
      translation: v.translations?.[0]?.text?.replace(/<[^>]*>/g, "") ?? undefined,
    };
  } catch {
    return null;
  }
}
