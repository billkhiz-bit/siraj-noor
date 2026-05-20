# Siraj Noor - Demo Video Beat Sheet

**Target:** 2:45 (hard cap 3:00)
**For:** Provision Launch × Quran Foundation Hackathon judges
**Format:** Bullet guide - hit the beats, talk naturally over the visuals
**Status (2026-05-20):** Auth end-to-end green on prelive. Goals API, activity-day logging, PWA install, tafsir picker, streak-at-risk banner, and surah-of-the-day all live on production. Ready to record. Reframed habit-first per the 2026-05-05 scoring analysis.

---

## Why this structure

Judging weights are **Impact 30 / Product Quality 20 / Tech Execution 20 / Innovation 15 / API Use 15**. Two consequences drive the running order:

1. **Lead with habit-formation, not 3D.** Streaks, daily goals, the Activity heatmap, and cross-device QF account sync are the Impact story (30%, the biggest lever). The 3D visualisations are Innovation (15%, the smaller lever), so they become the *medium* the habit story is told in, not the headline. The hook opens on a year of reading rendered as a 3D heatmap, which is both the differentiator and an Impact artefact.
2. **Prove eligibility inside the first 30 seconds.** This must read as a Quran Foundation **User API** consumer, not a content-only viewer. The sign-in flow goes up front for that reason.

Everything after the habit loop is supporting evidence; cut from the bottom if running long.

One detail not given camera time but worth a narrator aside if a scene lands short: the refresh-token flow is hardened with a single-flight gate so sibling providers (BookmarksProvider, CollectionsProvider, ReadingProgressProvider) can't cascade-revoke each other's access tokens on the initial page mount. It signals to judges that the integration is production-shaped, not a weekend prototype.

### Console hygiene (only relevant if you show DevTools on camera)

Lighthouse (2026-05-20) scored Accessibility 100, SEO 100, Best Practices 96; Performance 52-57 is the expected Three.js/WebGL cost and is not worth chasing. Two benign console items exist, both artefacts of Next.js static export, neither a real bug:

- ~13 `404`s on `__next.<route>.__PAGE__.txt?_rsc=…` - these are RSC prefetch payloads that static export does not emit; `<Link>` falls back to a full navigation and everything still works.
- React minified error `#418` - a hydration text mismatch from date-derived content (today's heatmap cell, streak, deterministic Surah/Ayah of the Day rendering against the build date). React recovers on the client.

Neither affects the user-visible app. But if you open DevTools for the proof-of-integration insert, **filter the Network tab to `apis-prelive` and clear the Console first**, so the RSC 404s and the hydration warning don't appear on camera next to the genuine `200 OK` QF calls.

---

## Scene 1 · Hook - a year of reading, in 3D [0:00 → 0:12]

**Show**
- Open cold on the Activity 3D heatmap slowly auto-rotating, amber cells of varying height across the 7×52 grid
- No UI chrome, just the scene

**Beats to hit**
- "This is a year of one person's relationship with the Qur'an, rendered in 3D. Every cell is a day they showed up."
- Siraj Noor makes your connection to the Qur'an *visible*, and helps it last beyond Ramadan
- The catch: none of this exists without the Quran Foundation User API

**Caption lower-third**
`Siraj Noor - a personal Qur'an companion, powered by the Quran Foundation User API`

---

## Scene 2 · Sign in with Quran.com [0:12 → 0:30]

**Show**
- Dashboard view, click `Sign in with Quran.com` in the Today Panel
- Brief pause on `prelive-oauth2.quran.foundation` consent screen
- Return to dashboard - user menu now shows signed-in state

**Beats to hit**
- OAuth 2.0 PKCE with a Cloudflare Pages Function token proxy - the secret stays server-side, the browser only ever holds the access + refresh tokens
- Bookmarks, collections, reading sessions, goals, and streaks all live on your Quran Foundation account via the `/auth/v1/*` endpoints
- "One tap, and everything personal follows me across every device"

**Caption**
`OAuth 2.0 PKCE · Cloudflare Pages Function proxy · zero persistent server`

---

## Scene 3 · Set today's reading goal [0:30 → 1:00]

**Show**
- Today Panel at the top: Ayah of the Day (Arabic + translation). Right column: Current streak counter, **Daily goal card** with preset buttons (5 / 10 / 15 / 30 min)
- Click `10 min` - the buttons flip to a progress bar showing "0 min / 10 min"
- Scroll a touch: Surah of the Day card (today's deterministic pick)

**Beats to hit**
- Tap a preset to set today's reading target - it persists to your QF account via the `goal` scope, not local storage
- Deterministic Surah of the Day + Ayah of the Day anchor every visit, no personalisation model required
- Streak counter, mushaf coverage, and goal progress all at a glance
- Narrator aside (optional): "If you haven't read in 20+ hours, a streak-at-risk banner sits at the top of this dashboard. Gentle urgency, no push-permission prompt."

**Caption**
`User API: goal + streak  ·  deterministic daily pickers`

---

## Scene 4 · Read a surah, progress fills [1:00 → 1:35]

**Show**
- Click a surah bar in the ring - `/surah/1` (Al-Fatihah) or a similar short surah opens
- Scroll a couple of ayahs, let ~20 seconds of dwell time elapse on camera (shorten in post if needed)
- **Aside (3s)**: click the commentary icon on an ayah. Tafsir panel opens with a three-chip picker (Ibn Kathir / Ma'arif / Tazkirul). Tap Ma'arif - the body re-fetches instantly, typography lands in a readable serif.
- Click back to `/dashboard`
- Cut to the Daily Goal card - the progress bar has moved from 0 to roughly 20% (server-tracked, not simulated)

**Beats to hit**
- Reading the surah fires `POST /reading-sessions` (drives the heatmap + streak) AND `POST /activity-days` (drives QURAN_TIME goal progress). Two distinct signals, two distinct User API endpoints.
- Periodic 30-second flushes on the surah page plus a keepalive final flush on navigation. Progress updates while you read, not only when you leave.
- Tafsir picker ships three scholars (Ibn Kathir 169, Ma'arif al-Qur'an 168, Tazkirul Quran 817) via QF's Content API tafsirs endpoint. The choice persists in localStorage so the next verse remembers.

**Caption**
`User API: reading_session + activity_days + goal  ·  Content API: tafsirs × 3`

---

## Scene 5 · The heatmap fills - habit made visible [1:35 → 1:55]

**Show**
- Click `Activity` in the sidebar (Personal section)
- Let the camera auto-rotate 5 seconds over the 7×52 heatmap
- Today's cell visibly pulses brighter than the rest, taller after the Scene 4 read
- Daily Goal banner above the heatmap shows the updated progress from Scene 4

**Beats to hit**
- This is the same view from the cold open - now the judges have seen exactly what builds it
- The 10th view, built entirely on the `reading_session` + `activity-days` scopes
- 365 days × 7 rows × session count → 3D bars, amber intensity = reading volume
- No local storage, no fake data - every cell is a real Quran Foundation reading session
- The habit loop closes here: set a goal → read → the heatmap grows, the streak ticks, the surah glows on the ring. Four QF endpoints, one coherent loop.

**Caption**
`365 days · pure User API · the habit loop, closed`

---

## Scene 6 · Reflect and keep it - bookmarks, collections, PWA install [1:55 → 2:25]

**Show**
- Click a surah bar → `/surah/2`, scroll to Ayat al-Kursi (2:255), click the bookmark star - it fills amber (optimistic UI)
- Optional 2s insert: DevTools Network tab showing `POST /auth/v1/bookmarks` → 200 with the canonical `{key, verseNumber, type:"ayah", mushaf:4}` body. **Filter the tab to `apis-prelive` first** (see Console hygiene below) so only the real QF calls show.
- Cut to `Collections` - create one called "Ayahs that made me pause"; the CSS-perspective shelf renders it as a tilting card
- Address bar: Chrome's install icon appears. Click it. OS install dialog → confirm
- Cut to the installed standalone window launching - no URL bar, no tabs, amber lamp icon in the taskbar / dock

**Beats to hit**
- Bookmark any ayah from any view; group bookmarks into themed collections - both synced via the `bookmark` + `collection` scopes, across every device
- Install Siraj Noor in one tap. Works offline after first visit via a service worker that precaches the shell.
- This is the "maintain the connection after Ramadan" payoff - a lamp in your app drawer, not a bookmark lost in the browser

**Caption**
`User API: bookmark + collection  ·  PWA install · offline-ready`

---

## Scene 7 · The structure, explorable - ten 3D views [2:25 → 2:45]

Fast cuts, ~3 seconds each. This is where the 3D depth lives, framed as the medium the companion is built in.

- Surah Structure ring with visited surahs glowing amber
- Isnad Network → click a narrator node, biography slides in
- Revelation Map → Makkah / Madinah toggle, click a surah dot
- Sacred Sites → Ka'bah wireframe rotating with a tawaf particle ring
- Names of Allah → 99-sphere with Allah at the centre

**Beats to hit**
- The structure of scripture is not flat - so it's not presented flat. Ten interactive 3D views.
- Every visualisation is clickable; every click is a new lens on the Qur'an and Hadith
- A companion to reading the Mushaf and studying tafsir, built for visual learners - never a replacement for either

---

## Scene 8 · Close [2:45 → 3:00]

**Show**
- Wide shot of the Surah Ring, camera pulls back
- Fade to end card:
  ```
  Siraj Noor
  Build the habit. See the structure.

  siraj-noor.pages.dev
  github.com/billkhiz-bit/siraj-noor

  Built for the Quran Foundation Hackathon 2026
  ```

**Beats to hit**
- "Build the habit, see the structure"
- One account, every ayah one click away, a year of reading you can watch grow, installable as a real app

---

## Recording checklist

**Before rolling**

- [ ] Sign in against the **prelive sandbox** (production client user-scopes not yet approved as of 2026-05-20). Both hosts produce identical-looking UI; prelive is the safe recording target.
- [ ] Pre-seed reading sessions: visit at least 5 surahs across 5 different days so the Activity heatmap shows variance in the Scene 1 cold open and Scene 5. ReadingTracker auto-fires periodic activity-day flushes every 30s; to get multi-day data, record over several days or backfill via QF's API directly.
- [ ] Pre-seed 3-4 bookmarks across different surahs (Fatihah 1:1, Baqarah 2:255, Nur 24:35, Rahman 55:13 makes a visually varied demo ring)
- [ ] Create 1-2 collections so Scene 6's shelf has cards already present, and create one live on camera for the beat
- [ ] **Before Scene 3**: make sure the current session's goal is unset (`/dashboard` shows the preset buttons, not a progress bar). Delete any lingering goal via `/dashboard` → "Change", then don't re-set until the camera is rolling.
- [ ] **Before Scene 4**: close any in-flight activity-day flushes by reloading once so the goal progress starts from 0% on camera. The 30s periodic flush means the moment you open a surah, the timer starts.
- [ ] **Before Scene 6**: uninstall any prior PWA install of Siraj Noor so Chrome shows the "Install" icon in the address bar fresh. On Windows: Chrome menu → Apps → right-click Siraj Noor → Uninstall.
- [ ] Hide browser bookmarks bar + extension icons
- [ ] Fresh incognito window with cookies from a prior signed-in session preserved (or sign in cleanly if you want the OAuth flow on camera - recommended for Scene 2)
- [ ] Dark mode forced off at OS level (the app forces dark on its own; OS-level light mode prevents dev-tool panels from appearing dark in any system-chrome shots)
- [ ] Screen capture at 1920×1080, 60 fps (OBS or equivalent)
- [ ] VO recorded separately, aligned in editor - do **not** record with system audio pickup
- [ ] Export H.264, check the Provision Launch file size limit before final upload

**During recording**

- [ ] Open DevTools Network tab filtered by `apis-prelive` **just before** Scene 2 and let it record silently in the background; useful for the 2-second `200 OK` insert on `/auth/v1/bookmarks?mushafId=4&first=20` in Scene 6, as proof the integration is real, not mocked. Clear the Console pane too - the RSC 404s and the React #418 hydration warning (both benign, see Console hygiene) should not be on camera.
- [ ] Between scenes: if the app state drifts (phantom bookmarks, stale streak), hard-refresh rather than stop-start - providers remount on hard refresh and pull fresh state from the API.

---

## Cut-down order if running long

| Target | Action | Saves |
|---|---|---|
| 2:45 | Drop Scene 7 (exploration reel) to 4 cuts | -5s |
| 2:30 | Trim Scene 6 to bookmark + install, skip collection creation | -10s |
| 2:15 | Skip the tafsir picker aside in Scene 4 | -3s |
| 2:10 | Collapse Scene 5 heatmap camera rotation to 3s | -5s |

---

## Scenes to *never* cut

1. **Scene 2 (sign-in flow)** - the eligibility proof. Without it on camera, judges may assume it's a content-API-only app.
2. **Scene 3 + 4 (set goal → progress fills after reading)** - the narrative spine. Four User API endpoints flowing through one coherent habit loop is the clearest "this app uses QF deeply" argument, and the Impact (30%) centrepiece.
3. **Scene 1 + 5 (the Activity heatmap, cold open and payoff)** - the differentiator that makes this a ten-view, habit-forming app rather than a nine-view viewer. The cold open is what frames the whole video as an Impact story.
4. **Scene 6 (PWA install)** - the direct visual answer to "maintain the connection after Ramadan". Not just another viewer; a real app the user installs.
