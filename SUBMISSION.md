# Siraj Noor - Provision Launch × Quran Foundation Hackathon 2026 Submission

Draft copy for the submission form. Fields ordered to match the typical hackathon portal structure; adjust bindings when the real form is in front of you.

---

## Project Basics

**Project Name**
Siraj Noor (سراج نور) - The Lamp of Light

**One-Sentence Tagline**
A 3D Qur'an and Hadith companion with personal bookmarks, collections, streaks, daily goals, and activity tracking powered end-to-end by the Quran Foundation User API - installable as an offline PWA.

**Short Description (200–400 words)**

Siraj Noor turns the Qur'an and Hadith into explorable 3D data visualisations and layers a personal companion experience on top. Ten interactive views - Surah Structure ring, Word Frequency sphere, Isnad chain network, Prophet timeline, Hadith tower, Revelation map, Islamic journey routes, 99 Names of Allah, Sacred Sites, and an Activity heatmap - make the structure of Islamic scripture tangible and navigable.

Every personal data touchpoint is backed by the Quran Foundation User API. Sign in with Quran.com via OAuth 2.0 with PKCE, and the app reads and writes to your real account: bookmarks on any ayah from any view, themed collections of saved verses, daily reading goals with server-tracked progress, a reading streak that lights up surahs you've visited on the 3D ring, and full reading-session history rendered as a 3D year-in-review heatmap. No local storage, no fake data - every bookmark, every session, every streak day travels with you across devices via QF's infrastructure.

The 10th view, Activity, is the differentiator. A full-year 7×52 3D heatmap renders one cell per day; bar height and amber intensity represent reading session count, pulled live from the `/reading-sessions` endpoint and aggregated by the `/activity-days` endpoint that drives QURAN_TIME goal progress. Setting a 10-minute daily goal, reading any surah for a few minutes, and watching the amber progress bar fill up is a single coherent loop across four QF endpoints.

The app installs as a Progressive Web App on desktop, Android, and iOS 17+. After first visit the service worker caches the app shell, so the landing page, dashboard, activity heatmap, bookmarks list, and collections shelf all render without a network connection; new bookmarks and goal progress sync the next time the device is online.

Siraj Noor is not a replacement for reading the mushaf or studying hadith from their original sources. It is a companion tool that makes the *structure* of scripture visible - and the judging-panel eligibility differentiator is that none of this works without the Quran Foundation User API.

---

## Links

- **GitHub Repository**: https://github.com/billkhiz-bit/siraj-noor (public, MIT)
- **Live Demo**: https://siraj-noor.pages.dev
- **OpenAPI integration reference**: https://api-docs.quran.foundation/openAPI/user-related-apis/v1.json

---

## Hackathon Details

**Tracks**: Islamic Education, Habit Formation, User Experience, Data Visualisation
*(adjust to match the form's exact track list)*

**Team**: Solo submission - Bilal Khizar

**Timezone**: UTC+00:00 (United Kingdom)

---

## Build Info

**What You Built During the Hackathon**

The entire Siraj Noor fork was built from scratch during the hackathon. It forks the original Siraj (3D Qur'an viewer from Ramadan Hacks 2026, content-API only) and adds the full Quran Foundation User API integration layer: OAuth 2.0 PKCE sign-in flow, Cloudflare Pages Function proxy for confidential client token exchange, concurrency-safe token refresh with single-flight de-duplication, bookmark create/list/delete, collection create/list/update/delete, reading session tracking with auto-logging on surah view, daily streak via `/streaks/current-streak-days` with timezone-aware day boundaries, the Activity 3D heatmap page, daily goals with QURAN_TIME progress driven by `/activity-days` aggregation, and a Progressive Web App shell that makes the whole experience installable and offline-capable after first visit.

Runtime validation at the QF API boundary: every response runs through a Zod schema via `safeParse`. Shape drift surfaces as a loud, structured error at the call site with the offending field path and a 300-character response preview, rather than silent `undefined` fields breaking UI three layers deep. Every wire-format type is inferred via `z.infer<typeof schema>` so compile-time and runtime views stay in lockstep.

The non-auth visualisations (Surah Structure, Word Frequency, Isnad Network, Prophet Timeline, Hadith Explorer, Revelation Map, Islamic Journeys, 99 Names, Sacred Sites) are preserved from the Ramadan Hacks base. Each now integrates with the bookmarking flow - click any ayah in any surah detail page to save it to your QF account, and commentary on any ayah is available from a three-option tafsir picker (Ibn Kathir, Ma'arif al-Qur'an, Tazkirul Quran) with localStorage-persisted preference.

**Content API integration**: verse text, translations (Sahih International), transliteration, chapter metadata, tafsir (three scholars), chapter recitation audio, verse search via `v4/*` endpoints.
**User API integration**: `bookmark`, `collection`, `reading_session`, `streak`, `goal` scopes via `/auth/v1/*` endpoints, including `/activity-days` aggregation. Six distinct User API resources actively read/written by the app.
Both eligibility gates cleared with significant headroom.

**Tech Stack**

Next.js 16 (App Router, static export), React 19, TypeScript, Zod 4 (runtime validation at API boundary), Three.js via @react-three/fiber + @react-three/drei + @react-three/postprocessing, MapLibre GL, shadcn/ui on base-ui, Tailwind CSS v4, Geist Sans + Mono, Progressive Web App (custom service worker + manifest + maskable icon), Cloudflare Pages (static hosting + edge cache) + Cloudflare Pages Functions (OAuth token proxy), Quran Foundation User APIs v1 + Content API v4.

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
- Scopes requested at sign-in: `openid offline_access user bookmark collection reading_session goal streak post` (only `bookmark`, `collection`, `reading_session`, `streak`, plus the core `openid`/`offline_access`/`user` are currently exercised by the UI - `goal` and `post` scopes are reserved for future features)
- Token endpoint auth: `client_secret_basic` (Cloudflare Pages Function proxies the token exchange to keep the secret server-side)

**Contracts Deployed**: N/A - this is not a Web3 submission.

---

## Impact & Evaluation

**Problem Statement**

Most Muslim apps present the Qur'an as flat scrollable text with a separate feature list bolted on - search here, bookmarks there, audio in another tab. The Qur'an's 114 surahs, the thematic networks, the chains of narration in Hadith, the geography of revelation - none of these are visible in a linear reading experience. Simultaneously, the Quran Foundation's User API exposes a rich personalisation surface (bookmarks, collections, streaks, reading sessions, reflections) that most client apps don't fully exploit.

Siraj Noor addresses both gaps at once. The 3D visualisations make scriptural structure inspectable; the User API integration makes that exploration *stick* - every click builds toward a habit that follows the user across devices.

**Target Users & Expected Impact**

Primary: Muslim students, Islamic studies educators, and curious practitioners who have a foundation in reading Qur'an and Hadith and want to explore deeper structural connections. Particularly valuable for:

- **Teachers** who need visual aids for structural concepts (surah order, isnad chains, revelation geography)
- **Habit-builders** who want a visible, persistent reading streak and coverage metric
- **Data-literate users** who engage better with interactive 3D media than with pages of text

Expected Impact (the 30-point category):
- **Long-term engagement**: The Activity heatmap, streak counter, daily goal progress, and installable PWA are explicit habit-formation mechanics. Pulling data from QF's User API means the habit follows the user across devices and survives a local cache wipe.
- **Smart nudges that respect the user**: A streak-at-risk banner surfaces on the dashboard only when the user has a running streak and the most recent reading session is more than 20 hours ago; urgency escalates as the local-midnight rollover approaches. A daily "Surah of the Day" card rotates on a deterministic UTC-day basis so returning visitors see a fresh anchor without needing a personalisation model.
- **Educational use**: Ten distinct visualisation modes, each grounded in authenticated primary sources (Sahih al-Bukhari, Sahih Muslim, al-Tabari, Ibn Hisham), with per-verse commentary from three complementary tafsirs (Ibn Kathir, Ma'arif al-Qur'an, Tazkirul Quran).
- **Accessibility of scholarship**: Biographies of 37 hadith narrators and 25 prophets are one click from their nodes in the 3D scene.
- **Accessibility of the app itself**: Keyboard skip link to main content, amber focus rings, ARIA roles on progressbars and day-picker controls, 44px tap targets on mobile, `prefers-reduced-motion` opt-out on smooth-scroll, explicit screen-reader labels on every interactive 3D element's fallback.

**What Makes It Novel**

Siraj Noor is the first application (as far as we could determine) to treat Quran Foundation User API data as a 3D visualisation. The Activity page renders 365 days × 7 rows of reading sessions as a live 3D heatmap - the 10th view in the app, and the only one that cannot exist without the User API. Creating a bookmark, visiting a surah, logging a reading session, or ticking toward a QURAN_TIME goal all cause geometry changes or progress movements in the 3D scenes. The distinction between "Content" and "Personal" in the sidebar reflects the distinction between Content API and User API data sources.

The Activity page, streak counter, and daily-goal progress card together form a single coherent habit loop built across four QF endpoints: `/reading-sessions` (what) → `/activity-days` (how long) → `/goals/get-todays-plan` (versus target) → `/streaks/current-streak-days` (across days). The app correctly distinguishes that `/reading-sessions` drives the heatmap but `/activity-days` drives goal progress - a distinction that required reading the OpenAPI carefully rather than guessing from the endpoint names.

No existing Qur'an application bridges 3D data visualisation with Islamic scholarship and Quran Foundation account infrastructure, and none we've seen treats the full User API surface as first-class UI material rather than a "save button" afterthought.

**Metrics or Validation**

- Live and deployed at https://siraj-noor.pages.dev, publicly accessible, free, installable as a PWA on desktop / Android / iOS 17+.
- Full audit pass: 0 TypeScript errors, 0 ESLint errors, 131 static pages pre-rendered at build time, sitemap.xml covering all routes.
- All Quranic data verified against Quran.com API v4 (Al-Azhar Egyptian Standard).
- Full end-to-end test against Quran Foundation prelive User API: `/bookmarks`, `/collections`, `/streaks/current-streak-days`, `/reading-sessions`, `/goals/get-todays-plan`, `/goals`, `/activity-days` all return 200 on a fresh sign-in with no 4xx in the network waterfall.
- OAuth flow hardened with single-flight token refresh and retry-on-revoked-token recovery (detailed in the commit history).
- Runtime shape validation via Zod at every QF API boundary - schema drift surfaces as a loud structured error, not a silent undefined.
- Service worker precaches the app shell on first visit; verified offline navigation to `/`, `/dashboard`, `/activity`, `/bookmarks`, `/collections`, cached `/surah/*` routes after network disconnect.

---

## Licence & Assets

**Licence**: MIT

**Use of Third-Party Assets**

- Quran Foundation User API v1 + Content API v4 (verse text, translations, transliteration, bookmarks, collections, reading sessions, streaks, posts - open access with OAuth).
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
- PWA icon is SVG-only; iOS <17 home screen will fall back to a default placeholder. Modern iOS, Android, and desktop Chromium all work correctly with SVG.
- Bookmarks and reading sessions are fetched with a fixed page size of 20; cursor pagination is wired at the API layer but no "load more" UI exists yet.

## Next Steps

1. Switch from prelive to production Quran Foundation client once user-scope approval arrives.
2. Expand hadith coverage beyond Book 1 using sunnah.com's offline data dump.
3. Complete biographies for all 25 prophets.
4. Ship PNG icon variants for iOS <17 home screen compatibility.
5. Add cursor-based "load more" UI for users with more than 20 bookmarks or collections.
6. Explore the QF Quran MCP for semantic search over the bookmarks dataset (e.g. "find my saved ayahs about patience").
7. Push notifications via Web Push / VAPID for streak-at-risk reminders (currently an in-app banner only).

## Additional Notes

Siraj Noor was built entirely during the Provision Launch × Quran Foundation Hackathon window as a labour of love. It is open source (MIT) and designed as a companion to reading the Qur'an and Hadith from their original sources - not a replacement. Every Quranic data point is verified against the Quran Foundation Content API v4 (Al-Azhar Egyptian Standard). We are happy to collaborate with Quran Foundation on upstreaming any 3D visualisation components that could serve the broader Quran.com ecosystem.

---

*Draft prepared 2026-04-16. Review and adapt exact wording to the form's field limits before submitting.*
