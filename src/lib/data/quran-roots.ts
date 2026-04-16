// Top triliteral roots in the Qur'an by occurrence count. Counts
// from the Quranic Arabic Corpus (corpus.quran.com) - their
// morphological analysis, which is the canonical reference.
// Roots are written with hyphens between the three radicals for
// clarity (ر-ح-م rather than رحم) so each radical reads left-to-right
// when the whole glyph is visually read right-to-left.
//
// This is a curated subset - the top ~20 by occurrence - not
// exhaustive. The goal is to give readers a feel for the lexical
// spine of the Qur'an: which semantic fields recur most.

export interface QuranRoot {
  arabic: string; // The root in Arabic script, hyphen-separated
  transliteration: string; // e.g. "R-Ḥ-M"
  meaning: string; // Short English gist
  occurrences: number; // From corpus.quran.com
  // A verse where the root appears prominently, used as a way in.
  exemplar: {
    verseKey: string;
    reason: string;
  };
}

export const TOP_QURAN_ROOTS: QuranRoot[] = [
  {
    arabic: "ق-و-ل",
    transliteration: "Q-W-L",
    meaning: "to say, to speak",
    occurrences: 1722,
    exemplar: {
      verseKey: "2:30",
      reason:
        "When your Lord SAID to the angels - the verb qala opens one of the most famous dialogues in the Qur'an.",
    },
  },
  {
    arabic: "إ-ل-ه",
    transliteration: "ʾ-L-H",
    meaning: "deity, the worshipped one",
    occurrences: 2853,
    exemplar: {
      verseKey: "2:255",
      reason: "Allah - there is no ILAH but He. The declaration of tawhid.",
    },
  },
  {
    arabic: "ر-ب",
    transliteration: "R-B",
    meaning: "Lord, sustainer, master",
    occurrences: 975,
    exemplar: {
      verseKey: "1:2",
      reason: "All praise is due to Allah, RABB of the worlds.",
    },
  },
  {
    arabic: "ع-ل-م",
    transliteration: "ʿ-L-M",
    meaning: "knowledge, to know",
    occurrences: 854,
    exemplar: {
      verseKey: "2:32",
      reason:
        "'We have no knowledge except what You taught us' - the angels'  response to being taught the names.",
    },
  },
  {
    arabic: "ك-و-ن",
    transliteration: "K-W-N",
    meaning: "to be, to become",
    occurrences: 1358,
    exemplar: {
      verseKey: "2:117",
      reason: "'Be' and it is - KUN fa-yakun, the creative command.",
    },
  },
  {
    arabic: "ر-ح-م",
    transliteration: "R-Ḥ-M",
    meaning: "mercy, compassion",
    occurrences: 339,
    exemplar: {
      verseKey: "1:3",
      reason: "Ar-Rahman, Ar-Rahim - both forms of the root open every surah.",
    },
  },
  {
    arabic: "ك-ت-ب",
    transliteration: "K-T-B",
    meaning: "to write, book, decree",
    occurrences: 319,
    exemplar: {
      verseKey: "2:183",
      reason: "Fasting was written - KUTIBA - upon those before you.",
    },
  },
  {
    arabic: "د-ع-و",
    transliteration: "D-ʿ-W",
    meaning: "to call, to invoke, prayer",
    occurrences: 212,
    exemplar: {
      verseKey: "2:186",
      reason: "When My servants ask you about Me - I respond to the DU'A of the supplicant.",
    },
  },
  {
    arabic: "ح-ق",
    transliteration: "Ḥ-Q",
    meaning: "truth, right, reality",
    occurrences: 287,
    exemplar: {
      verseKey: "17:81",
      reason: "Truth has come and falsehood has vanished.",
    },
  },
  {
    arabic: "ء-م-ن",
    transliteration: "ʾ-M-N",
    meaning: "faith, security, to believe",
    occurrences: 879,
    exemplar: {
      verseKey: "2:285",
      reason: "Amana - the Messenger believed in what was revealed to him.",
    },
  },
  {
    arabic: "ص-ب-ر",
    transliteration: "Ṣ-B-R",
    meaning: "patience, perseverance",
    occurrences: 103,
    exemplar: {
      verseKey: "2:153",
      reason: "Seek help through SABR and prayer - Allah is with the patient.",
    },
  },
  {
    arabic: "ش-ك-ر",
    transliteration: "Sh-K-R",
    meaning: "gratitude, thankfulness",
    occurrences: 75,
    exemplar: {
      verseKey: "14:7",
      reason: "If you are thankful I will add more to you - the gratitude promise.",
    },
  },
  {
    arabic: "ن-ور",
    transliteration: "N-W-R",
    meaning: "light",
    occurrences: 194,
    exemplar: {
      verseKey: "24:35",
      reason: "Allah is the NUR of the heavens and the earth.",
    },
  },
  {
    arabic: "ع-د-ل",
    transliteration: "ʿ-D-L",
    meaning: "justice, balance, equity",
    occurrences: 28,
    exemplar: {
      verseKey: "16:90",
      reason: "Allah commands justice - AL-'ADL.",
    },
  },
  {
    arabic: "ع-ب-د",
    transliteration: "ʿ-B-D",
    meaning: "to worship, servant",
    occurrences: 275,
    exemplar: {
      verseKey: "1:5",
      reason: "You alone we worship - NA'BUDU.",
    },
  },
  {
    arabic: "س-ل-م",
    transliteration: "S-L-M",
    meaning: "peace, submission (Islam)",
    occurrences: 140,
    exemplar: {
      verseKey: "2:208",
      reason: "Enter into Islam completely - AL-SILM kaffah.",
    },
  },
  {
    arabic: "خ-ل-ق",
    transliteration: "Kh-L-Q",
    meaning: "to create, creation",
    occurrences: 261,
    exemplar: {
      verseKey: "96:1",
      reason: "Read - in the name of your Lord who CREATED.",
    },
  },
  {
    arabic: "ه-د-ي",
    transliteration: "H-D-Y",
    meaning: "guidance, to guide",
    occurrences: 316,
    exemplar: {
      verseKey: "1:6",
      reason: "Guide us - IHDINA - to the straight path.",
    },
  },
];
