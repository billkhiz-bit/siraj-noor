# Siraj Noor (سراج نور) - The Lamp of Light

**Interactive 3D Qur'an & Hadith Data Visualisation + Personal Companion**

> "We sent you as a shining lamp" (Qur'an 33:46)

**Live**: [siraj-noor.pages.dev](https://siraj-noor.pages.dev)

Built for the [Quran Foundation Hackathon 2026](https://hackathon.provisionlaunch.com) by Provision Launch × Quran Foundation. Fork of the original [Siraj](https://github.com/billkhiz-bit/siraj), which was built for Ramadan Hacks 2026.

## What is Siraj Noor?

Siraj Noor illuminates the structure, patterns, and geography of the Qur'an and Hadith through interactive 3D data visualisation - and now goes further by layering a personal companion experience on top. Bookmark ayahs from any 3D view, save them into collections, set a daily reading goal and watch the progress fill as you read, track your streak, and see your reading progress light up the Surah Ring. All personal data is stored on your Quran Foundation account (via the User APIs) so it travels with you across devices.

Install it. Siraj Noor is a Progressive Web App - one tap on desktop Chrome or Android to install as a standalone app, or Share → Add to Home Screen on iOS 17+. After first visit the service worker caches the shell, so the dashboard, activity heatmap, bookmarks, collections, and visited surahs render offline.

Most Islamic apps focus on reading and listening. Siraj Noor lets you *see* the data **and** build a lasting relationship with what you've explored.

## Views

### Ten 3D visualisation views

| View | Description |
|------|-------------|
| **Surah Structure** | 114 surahs as glowing 3D cylinders in a ring. Height = ayat count. Cyan = Meccan, violet = Medinan. Sort by canonical, revelation, or length order. Read surahs glow amber with a pulsing base ring once you've visited them. |
| **Word Frequency** | Key Qur'anic terms as a 3D floating word cloud. Click any word to search for ayahs containing it via the Qur'an.com API. |
| **Isnad Network** | Hadith narrator chains from the Prophet ﷺ to the Tabi' al-Tabi'in. Click any node for their biography, titles, and key events. |
| **Prophet Timeline** | 25 prophets in the Qur'an arranged chronologically. Click for their story and surah references. |
| **Hadith Explorer** | 6 canonical collections compared as 3D towers. Click for topic breakdown and sample hadiths. |
| **Revelation Map** | Real map showing Makkah (86 Meccan surahs) and Madinah (28 Medinan surahs) with toggleable layers. Click any surah dot to explore. |
| **Islamic Journeys** | 10 historical routes from 615-632 CE with waypoints, key figures, and biographies. View all routes simultaneously or individually. |
| **Names of Allah** | 99 Names arranged in a 3D sphere with Allah at the centre. Filter by Jamal (Beauty), Jalal (Majesty), or Kamal (Perfection). |
| **Sacred Sites** | 5 wireframe 3D models of holy sites: Masjid al-Nabawi, Mount Uhud, Cave of Hira, Cave of Thawr, and the Plain of Arafat. Interactive annotations, particle overlays, elevation profiles, compass, and Qur'anic references. |
| **Activity** *(new in Siraj Noor)* | Full-year 7×52 3D heatmap of your reading sessions. Every cell is a day, bar height and amber intensity represent session count. Powered by the Quran Foundation `reading_session` scope - no local storage, no fake data. |

### Personal companion pages

| Page | Description |
|------|-------------|
| **Surah Detail** | Click any surah from the Surah Structure ring for Arabic text, English translation (Sahih International), transliteration, chapter recitation audio, and a 3D verse structure chart. Click-to-pin any ayah, bookmark any verse, open commentary from a three-option tafsir picker (Ibn Kathir, Ma'arif al-Qur'an, Tazkirul Quran - choice persists across verses). |
| **Today Panel** | Dashboard header showing a date-deterministic Ayah of the Day, your current streak, daily goal progress, and how much of the mushaf you've visited this year. Powered by the `reading_session`, `streak`, and `goal` scopes. |
| **Daily Goal Card** | Set a 5/10/15/30-minute daily reading target, see progress as you read. Server-tracked via `/goals/get-todays-plan` + `/activity-days`. Renders in both the Today Panel sidebar and as a banner above the Activity heatmap. |
| **Surah of the Day** | Deterministic rotating recommendation, fresh every UTC day. Uncorrelated seed from Ayah of the Day so returning visitors get two distinct daily anchors. |
| **Streak-at-Risk Banner** | Surfaces on the dashboard when a running streak is within 20 hours of resetting. Urgency escalates from amber to rose as local-midnight rollover approaches. In-app nudge, no push-notification permission required. |
| **Bookmarks** | Dedicated list view of every ayah you've saved. Click a bookmark to jump back to its surah. Stored on your Quran.com account via the `bookmark` scope. |
| **Collections** | Themed groupings of bookmarks rendered as a CSS-perspective 3D shelf. Name a collection, drop saved ayahs into it. Synced via the `collection` scope. |

## Mobile Responsive

Siraj is fully responsive across phones, tablets, and desktops. On mobile (<768px):
- Sidebar collapses into a hamburger menu
- 3D canvases and side panels stack vertically
- Map overlays resize to fit smaller screens
- Landing page stats wrap to multiple rows

Desktop layout is unchanged - all responsive behaviour uses the `md:` Tailwind breakpoint.

## Data Accuracy

All data is sourced from authoritative references:

- **Surah metadata**: Qur'an.com API v4 (Egyptian Standard / Al-Azhar)
- **Verse text**: Uthmani script via Qur'an.com API
- **Translation**: Sahih International via Qur'an.com API
- **Transliteration**: Word-by-word via Qur'an.com API
- **Hadith**: fawazahmed0/hadith-api (6 canonical collections)
- **99 Names**: Sahih al-Bukhari 2736, Sahih Muslim 2677
- **Journeys**: Ibn Hisham's Sirah, al-Tabari, Martin Lings

## Tech Stack

- **Next.js 16** (App Router, static export), React 19, TypeScript
- **Zod 4** for runtime validation at every QF API boundary - shape drift surfaces as a loud structured error, not a silent undefined
- **Three.js** via React Three Fiber + Drei + Post-processing
- **MapLibre GL** + react-map-gl (CARTO Dark Matter no-labels tiles)
- **shadcn/ui** on base-ui + Tailwind CSS v4 + Geist fonts
- **Quran Foundation User APIs v1** (OAuth 2.0 PKCE, bookmarks, collections, reading sessions, streaks, goals, activity-days) + Content API v4 (verse text, translations, transliteration, tafsir, chapter audio, search)
- **Progressive Web App**: web manifest with maskable icon, service worker with precache + cache-first static + network-first HTML, `beforeinstallprompt` install card with 14-day dismiss cooldown
- **Cloudflare Pages** (static hosting) + **Cloudflare Pages Functions** (OAuth token proxy for confidential client secret)

## Running Locally

```bash
npm install
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_QF_CLIENT_ID from your QF developer account
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Personal features require a Quran Foundation OAuth client with `http://localhost:3000/auth/callback/` registered as a redirect URI.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Ctrl+K** | Global search |
| **Left/Right** | Navigate surahs |
| **Up/Down** | Zoom in/out |
| **Enter** | Explore selected surah |
| **Escape** | Deselect |

## Licence

MIT - see the submission notes or LICENSE in the repository root.
