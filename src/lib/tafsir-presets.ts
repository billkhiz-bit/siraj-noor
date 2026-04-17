// Tafsir preset definitions for the per-verse commentary picker.
//
// IDs verified against the live Quran Foundation Content API at
// api.quran.com/api/v4/resources/tafsirs?language=en. The selection
// spans three complementary traditions so users can triangulate
// meaning:
//
//   169 - Ibn Kathir (Abridged). Classical 14th-century exegesis,
//         canonical reference point across the Muslim world.
//   168 - Ma'arif al-Qur'an. Mid-20th-century Deobandi tafsir by
//         Mufti Muhammad Shafi, known for jurisprudential depth.
//   817 - Tazkirul Quran. Contemporary tafsir by Maulana Wahid
//         Uddin Khan, written in plain modern English.

export interface TafsirPreset {
  id: number;
  label: string;
  author: string;
  blurb: string;
}

export const TAFSIR_PRESETS: TafsirPreset[] = [
  {
    id: 169,
    label: "Ibn Kathir",
    author: "Hafiz Ibn Kathir",
    blurb: "Abridged · classical",
  },
  {
    id: 168,
    label: "Ma'arif",
    author: "Mufti Muhammad Shafi",
    blurb: "Ma'arif al-Qur'an · detailed",
  },
  {
    id: 817,
    label: "Tazkirul",
    author: "Maulana Wahid Uddin Khan",
    blurb: "Tazkirul Quran · modern",
  },
];

export const DEFAULT_TAFSIR_ID = 169;

const STORAGE_KEY = "siraj-noor-tafsir-preset:v1";

// Reads the user's saved tafsir preference, falling back to the
// classical default. SSR-safe: returns the default when window
// is not available, so first paint matches between server and
// client. The picker hydrates to the saved value after mount.
export function loadTafsirPreference(): number {
  if (typeof window === "undefined") return DEFAULT_TAFSIR_ID;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TAFSIR_ID;
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return DEFAULT_TAFSIR_ID;
    // Only accept ids we've presetted. If the stored id is from a
    // stale deployment that offered a different tafsir, fall back
    // rather than making the fetch fail silently.
    return TAFSIR_PRESETS.some((p) => p.id === parsed)
      ? parsed
      : DEFAULT_TAFSIR_ID;
  } catch {
    return DEFAULT_TAFSIR_ID;
  }
}

export function saveTafsirPreference(id: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(id));
  } catch {
    // localStorage can throw in private browsing. Ignoring is
    // acceptable - the next mount simply reverts to default.
  }
}
