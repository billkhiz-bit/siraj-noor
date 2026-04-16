# Siraj Noor — Provision Launch × Quran Foundation Hackathon 2026 Submission

Draft copy for the submission form. Fields ordered to match the typical hackathon portal structure; adjust bindings when the real form is in front of you.

---

## Project Basics

**Project Name**
Siraj Noor (سراج نور) — The Lamp of Light

**One-Sentence Tagline**
A 3D Qur'an and Hadith companion with personal bookmarks, collections, streaks, and reflections powered end-to-end by the Quran Foundation User API.

**Short Description (200–400 words)**

Siraj Noor turns the Qur'an and Hadith into explorable 3D data visualisations and layers a personal companion experience on top. Ten interactive views — Surah Structure ring, Word Frequency sphere, Isnad chain network, Prophet timeline, Hadith tower, Revelation map, Islamic journey routes, 99 Names of Allah, Sacred Sites, and a new Activity heatmap — make the structure of Islamic scripture tangible and navigable.

Every personal data touchpoint is backed by the Quran Foundation User API. Sign in with Quran.com via OAuth 2.0 with PKCE, and the app reads and writes to your real account: bookmarks on any ayah from any view, themed collections of saved verses, a daily reading streak that lights up surahs you've visited on the 3D ring, and full reading-session history rendered as a 3D year-in-review heatmap. No local storage, no fake data — every bookmark, every session, every streak day travels with you across devices via QF's infrastructure.

The 10th view, Activity, is the differentiator. A full-year 7×52 3D heatmap renders one cell per day; bar height and amber intensity represent reading session count, pulled live from the `/reading-sessions` endpoint. It turns the intangible habit of daily Qur'an into a three-dimensional artefact the user can inspect.

Siraj Noor is not a replacement for reading the mushaf or studying hadith from their original sources. It is a companion tool that makes the *structure* of scripture visible — and the judging-panel eligibility differentiator is that none of this works without the Quran Foundation User API.

---

## Links

- **GitHub Repository**: https://github.com/billkhiz-bit/siraj-noor (public, MIT)
- **Live Demo**: https://siraj-noor.pages.dev
- **OpenAPI integration reference**: https://api-docs.quran.foundation/openAPI/user-related-apis/v1.json

---

## Hackathon Details

**Tracks**: Islamic Education, Habit Formation, User Experience, Data Visualisation
*(adjust to match the form's exact track list)*

**Team**: Solo submission — Bilal Khizar

**Timezone**: UTC+00:00 (United Kingdom)

---

## Build Info

**What You Built During the Hackathon**

The entire Siraj Noor fork was built from scratch during the hackathon. It forks the original Siraj (3D Qur'an viewer from Ramadan Hacks 2026, content-API only) and adds the full Quran Foundation User API integration layer: OAuth 2.0 PKCE sign-in flow, Cloudflare Pages Function proxy for confidential client token exchange, concurrency-safe token refresh with single-flight de-duplication, bookmark create/list/delete, collection create/list/delete, reading session tracking with auto-logging on surah view, daily streak via `/streaks/current-streak-days` with timezone-aware day boundaries, and the new Activity 3D heatmap page.

The non-auth visualisations (Surah Structure, Word Frequency, Isnad Network, Prophet Timeline, Hadith Explorer, Revelation Map, Islamic Journeys, 99 Names, Sacred Sites) are preserved from the Ramadan Hacks base. Each now integrates with the bookmarking flow — click any ayah in any surah detail page to save it to your QF account.

**Content API integration**: verse text, translations (Sahih International), transliteration, chapter metadata via `v4/*` endpoints.
**User API integration**: `bookmark`, `collection`, `reading_session`, `streak` scopes via `/auth/v1/*` endpoints.
Both eligibility gates cleared.

**Tech Stack**

Next.js 16 (App Router, static export), React, TypeScript, Three.js via @react-three/fiber + @react-three/drei + @react-three/postprocessing, MapLibre GL, shadcn/ui, Tailwind CSS v4, Geist Fonts, Cloudflare Pages (static hosting) + Cloudflare Pages Functions (OAuth token proxy), Quran Foundation User APIs v1 + Content API v4.

**How to Run Locally**

```bash
git clone https://github.com/billkhiz-bit/siraj-noor.git
cd siraj-noor
npm install
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_QF_CLIENT_ID from your QF developer account
npm run dev
```

Requires a Quran Foundation OAuth client with the following configuration:
- Redirect URI: `http://localhost:3000/auth/callback/`
- Scopes requested at sign-in: `openid offline_access user bookmark collection reading_session goal streak post` (only `bookmark`, `collection`, `reading_session`, `streak`, plus the core `openid`/`offline_access`/`user` are currently exercised by the UI — `goal` and `post` scopes are reserved for future features)
- Token endpoint auth: `client_secret_basic` (Cloudflare Pages Function proxies the token exchange to keep the secret server-side)

**Contracts Deployed**: N/A — this is not a Web3 submission.

---

## Impact & Evaluation

**Problem Statement**

Most Muslim apps present the Qur'an as flat scrollable text with a separate feature list bolted on — search here, bookmarks there, audio in another tab. The Qur'an's 114 surahs, the thematic networks, the chains of narration in Hadith, the geography of revelation — none of these are visible in a linear reading experience. Simultaneously, the Quran Foundation's User API exposes a rich personalisation surface (bookmarks, collections, streaks, reading sessions, reflections) that most client apps don't fully exploit.

Siraj Noor addresses both gaps at once. The 3D visualisations make scriptural structure inspectable; the User API integration makes that exploration *stick* — every click builds toward a habit that follows the user across devices.

**Target Users & Expected Impact**

Primary: Muslim students, Islamic studies educators, and curious practitioners who have a foundation in reading Qur'an and Hadith and want to explore deeper structural connections. Particularly valuable for:

- **Teachers** who need visual aids for structural concepts (surah order, isnad chains, revelation geography)
- **Habit-builders** who want a visible, persistent reading streak and coverage metric
- **Data-literate users** who engage better with interactive 3D media than with pages of text

Expected Impact (the 30-point category):
- **Long-term engagement**: The Activity heatmap and streak counter are explicit habit-formation mechanics. Pulling data from QF's User API means the habit follows the user across devices and survives a local cache wipe.
- **Educational use**: Ten distinct visualisation modes, each grounded in authenticated primary sources (Sahih al-Bukhari, Sahih Muslim, al-Tabari, Ibn Hisham).
- **Accessibility of scholarship**: Biographies of 37 hadith narrators and 25 prophets are one click from their nodes in the 3D scene.

**What Makes It Novel**

Siraj Noor is the first application (as far as we could determine) to treat Quran Foundation User API data as a 3D visualisation. The Activity page renders 365 days × 7 rows of reading sessions as a live 3D heatmap — the 10th view in the app, and the only one that cannot exist without the User API. Creating a bookmark, visiting a surah, or logging a reading session all cause geometry changes in the 3D scenes. The distinction between "Content" and "Personal" in the sidebar reflects the distinction between Content API and User API data sources.

No existing Qur'an application bridges 3D data visualisation with Islamic scholarship and Quran Foundation account infrastructure.

**Metrics or Validation**

- Live and deployed at https://siraj-noor.pages.dev, publicly accessible, free.
- Full audit pass: 0 TypeScript errors, 0 ESLint errors.
- All Quranic data verified against Quran.com API v4 (Al-Azhar Egyptian Standard).
- Full end-to-end test against Quran Foundation prelive User API: `/bookmarks`, `/collections`, `/streaks/current-streak-days`, `/reading-sessions` all return 200 on a fresh sign-in with no 4xx in the network waterfall.
- OAuth flow hardened with single-flight token refresh and retry-on-revoked-token recovery (detailed in the commit history).

---

## Licence & Assets

**Licence**: MIT

**Use of Third-Party Assets**

- Quran Foundation User API v1 + Content API v4 (verse text, translations, transliteration, bookmarks, collections, reading sessions, streaks, posts — open access with OAuth).
- Hadith sample data from fawazahmed0/hadith-api via jsDelivr (MIT).
- Map tiles from CARTO Dark Matter no-labels (BSD, open-source).
- MapLibre GL JS (BSD-3-Clause).
- Three.js (MIT), @react-three/fiber / @react-three/drei / @react-three/postprocessing (MIT).
- shadcn/ui (MIT).
- Geist font family (SIL Open Font Licence).
- Surah metadata verified against Al-Azhar Egyptian Standard.
- 99 Names sourced from Sahih al-Bukhari 2736 and Sahih Muslim 2677.
- Journey and prophet data compiled from Ibn Hisham, al-Tabari, and Martin Lings.

---

## Known Limitations

- 3D visualisations are GPU-intensive; older or low-end mobile devices may run slowly.
- Currently deployed against the Quran Foundation **prelive** environment pending production client scope approval. Functional parity with production once approved.
- Hadith samples are limited to Book 1 of each collection (fawazahmed0 API scope).
- Not all 25 prophets have full biographies yet.
- "Longest streak" mirrors "current streak" because QF's `/streaks/current-streak-days` endpoint returns the scalar current value only; will surface the real longest value when/if QF exposes it.
- No audio recitation, no offline support, no user-facing pagination UI for bookmarks above 20 items (cursor-based pagination is wired but the UI currently caps at the default page).

## Next Steps

1. Switch from prelive to production Quran Foundation client once user-scope approval arrives.
2. Audio recitation via Quran.com Audio API on surah detail pages.
3. Tafsir (commentary) alongside translations.
4. Expand hadith coverage beyond Book 1 using sunnah.com's offline data dump.
5. Complete biographies for all 25 prophets.
6. Progressive Web App manifest for offline access to the 3D visualisations.

## Additional Notes

Siraj Noor was built entirely during the Provision Launch × Quran Foundation Hackathon window as a labour of love. It is open source (MIT) and designed as a companion to reading the Qur'an and Hadith from their original sources — not a replacement. Every Quranic data point is verified against the Quran Foundation Content API v4 (Al-Azhar Egyptian Standard). We are happy to collaborate with Quran Foundation on upstreaming any 3D visualisation components that could serve the broader Quran.com ecosystem.

---

*Draft prepared 2026-04-16. Review and adapt exact wording to the form's field limits before submitting.*
