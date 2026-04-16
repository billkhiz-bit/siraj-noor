// Hand-curated mapping of famous ayahs to the hadith commentary that
// Muslims most commonly associate with them. Deliberately small and
// conservative - every entry is from one of the six canonical
// collections (Bukhari, Muslim, Abu Dawud, al-Tirmidhi, al-Nasa'i,
// Ibn Majah) and is summarised from a gist the reader can verify
// against sunnah.com at the linked reference.
//
// Not exhaustive. The app surfaces these when present and renders
// nothing when a verse has no entry, so adding more references is
// purely additive - just append to the map.

export interface HadithReference {
  collection: string;
  reference: string; // e.g. "Bukhari 756"
  summary: string;
  url: string; // sunnah.com canonical URL
}

export const HADITH_BY_VERSE: Record<string, HadithReference[]> = {
  // Al-Fatihah - the opening chapter
  "1:1": [
    {
      collection: "Sahih al-Bukhari",
      reference: "Bukhari 756",
      summary:
        "The Prophet ﷺ said: there is no prayer for the one who does not recite Al-Fatihah.",
      url: "https://sunnah.com/bukhari:756",
    },
  ],
  "1:5": [
    {
      collection: "Sahih Muslim",
      reference: "Muslim 395",
      summary:
        "A hadith qudsi: Allah divides Al-Fatihah between Himself and His servant - and He says, when the servant says 'You alone we worship', 'This is between Me and My servant'.",
      url: "https://sunnah.com/muslim:395",
    },
  ],

  // Ayat al-Kursi - the greatest verse
  "2:255": [
    {
      collection: "Sahih Muslim",
      reference: "Muslim 810",
      summary:
        "The Prophet ﷺ asked Ubay ibn Ka'b which verse in the Qur'an he considered the greatest. He answered Ayat al-Kursi. The Prophet ﷺ struck him on the chest and said: 'May knowledge bring you ease, Abu al-Mundhir.'",
      url: "https://sunnah.com/muslim:810",
    },
    {
      collection: "Sahih al-Bukhari",
      reference: "Bukhari 2311",
      summary:
        "Abu Hurayrah's encounter with the shaytan who taught him that reciting Ayat al-Kursi at night keeps one protected until morning.",
      url: "https://sunnah.com/bukhari:2311",
    },
  ],

  // Last two verses of Baqarah
  "2:285": [
    {
      collection: "Sahih al-Bukhari",
      reference: "Bukhari 5009",
      summary:
        "The Prophet ﷺ said: 'Whoever recites the last two verses of Surah al-Baqarah at night, they will suffice him.'",
      url: "https://sunnah.com/bukhari:5009",
    },
  ],
  "2:286": [
    {
      collection: "Sahih Muslim",
      reference: "Muslim 126",
      summary:
        "When this verse was revealed, the Companions felt its weight. The Prophet ﷺ taught them to respond 'We hear and we obey'. Allah then revealed the closing dua.",
      url: "https://sunnah.com/muslim:126",
    },
  ],

  // Ali Imran - seeking refuge
  "3:26": [
    {
      collection: "Jami at-Tirmidhi",
      reference: "Tirmidhi 3436",
      summary:
        "Reported as part of the dua taught for asking sovereignty from the true Sovereign.",
      url: "https://sunnah.com/tirmidhi:3436",
    },
  ],

  // An-Nisa - the verse of trusts
  "4:58": [
    {
      collection: "Sahih al-Bukhari",
      reference: "Bukhari 59",
      summary:
        "The Prophet ﷺ on the signs of the Hour, including the neglect of trusts - connected to this verse's command to return trusts to their owners.",
      url: "https://sunnah.com/bukhari:59",
    },
  ],

  // Al-Ma'idah - perfection of religion
  "5:3": [
    {
      collection: "Sahih al-Bukhari",
      reference: "Bukhari 45",
      summary:
        "A Jewish man said to Umar: if this verse had been revealed to us, we would have taken that day as a festival. Umar replied that the Muslims know the day and the place it was revealed - at Arafat on a Friday.",
      url: "https://sunnah.com/bukhari:45",
    },
  ],

  // Al-An'am - the final breath
  "6:151": [
    {
      collection: "Sahih al-Bukhari",
      reference: "Bukhari 4477",
      summary:
        "Ibn Mas'ud narrated asking the Prophet ﷺ: 'Which sin is the greatest?' He answered: 'That you set up a rival unto Allah though He alone created you.' Directly linked to this verse.",
      url: "https://sunnah.com/bukhari:4477",
    },
  ],

  // Yusuf - the best of stories
  "12:3": [
    {
      collection: "Sunan Ibn Majah",
      reference: "Ibn Majah 3797",
      summary:
        "On the virtue of teaching Surah Yusuf to one's family - connected to the opening framing of the surah as 'the best of stories'.",
      url: "https://sunnah.com/ibnmajah:3797",
    },
  ],

  // Al-Isra - the night prayer
  "17:79": [
    {
      collection: "Sahih Muslim",
      reference: "Muslim 1163",
      summary:
        "The Prophet ﷺ said: the best prayer after the obligatory is the night prayer - Tahajjud. This verse commands it.",
      url: "https://sunnah.com/muslim:1163",
    },
  ],

  // Al-Kahf - the Dajjal protection
  "18:10": [
    {
      collection: "Sahih Muslim",
      reference: "Muslim 809a",
      summary:
        "The Prophet ﷺ said: whoever memorises the first ten verses of Surah al-Kahf will be protected from the Dajjal.",
      url: "https://sunnah.com/muslim:809a",
    },
  ],

  // An-Nur - the verse of light
  "24:35": [
    {
      collection: "Jami at-Tirmidhi",
      reference: "Tirmidhi 3117",
      summary:
        "Commentary narrated from Ubay ibn Ka'b on the parable of divine light - the niche, the lamp, the olive tree - as referring to the believer's heart illuminated by faith.",
      url: "https://sunnah.com/tirmidhi:3117",
    },
  ],

  // Ya-Sin - the heart of the Qur'an
  "36:1": [
    {
      collection: "Jami at-Tirmidhi",
      reference: "Tirmidhi 2887",
      summary:
        "The Prophet ﷺ said: 'Everything has a heart, and the heart of the Qur'an is Ya-Sin.'",
      url: "https://sunnah.com/tirmidhi:2887",
    },
  ],

  // Ar-Rahman - the refrain
  "55:13": [
    {
      collection: "Jami at-Tirmidhi",
      reference: "Tirmidhi 3291",
      summary:
        "The Prophet ﷺ recited Ar-Rahman to the jinn, and whenever he read the refrain 'which of the favours of your Lord will you deny', they answered: 'None of Your favours do we deny.'",
      url: "https://sunnah.com/tirmidhi:3291",
    },
  ],

  // Al-Mulk - the protector
  "67:1": [
    {
      collection: "Jami at-Tirmidhi",
      reference: "Tirmidhi 2891",
      summary:
        "The Prophet ﷺ said: a surah from the Qur'an of thirty verses intercedes for its reader until he is forgiven - Surah al-Mulk.",
      url: "https://sunnah.com/tirmidhi:2891",
    },
  ],

  // Al-Ikhlas - the oneness
  "112:1": [
    {
      collection: "Sahih al-Bukhari",
      reference: "Bukhari 5013",
      summary:
        "The Prophet ﷺ said: Al-Ikhlas is equivalent to a third of the Qur'an.",
      url: "https://sunnah.com/bukhari:5013",
    },
  ],

  // Mu'awwidhatayn - the two refuges
  "113:1": [
    {
      collection: "Sahih Muslim",
      reference: "Muslim 814",
      summary:
        "The Prophet ﷺ said: verses like these have never been revealed before - the two suras of refuge protect against every kind of harm.",
      url: "https://sunnah.com/muslim:814",
    },
  ],
  "114:1": [
    {
      collection: "Sahih Muslim",
      reference: "Muslim 814",
      summary:
        "Paired with Al-Falaq as the two suras of refuge that the Prophet ﷺ would recite at night, blowing into his hands and wiping over his body.",
      url: "https://sunnah.com/muslim:814",
    },
  ],
};

export function getHadithForVerse(verseKey: string): HadithReference[] {
  return HADITH_BY_VERSE[verseKey] ?? [];
}
