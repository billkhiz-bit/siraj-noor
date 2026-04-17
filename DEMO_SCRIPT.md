# Siraj Noor - Demo Video Beat Sheet

**Target:** 2:45 (hard cap 3:00)
**For:** Provision Launch × Quran Foundation Hackathon judges
**Format:** Bullet guide - hit the beats, talk naturally over the visuals
**Status (2026-04-17):** Auth end-to-end green on prelive. Goals API, activity-day logging, PWA install, tafsir picker, streak-at-risk banner, and surah-of-the-day all live on production. Ready to record.

---

## Why this structure

Impact is worth 30 points, the largest judging category. The first 60 seconds must prove this is a **Quran Foundation User API** consumer, not a content-only Qur'an viewer - that's the eligibility differentiator. OAuth flow + amber ring overlay go up front for that reason. Everything else is supporting evidence; cut from the bottom if running long.

One thing the script does *not* make time for in-camera but worth having ready as a narrator aside if a scene lands short: the refresh-token flow is hardened with a single-flight gate so sibling providers (BookmarksProvider, CollectionsProvider, ReadingProgressProvider) can't cascade-revoke each other's access tokens on the initial page mount. It's the kind of detail that shows judges the integration is production-shaped, not a weekend prototype.

---

## Scene 1 · Hook [0:00 → 0:10]

**Show**
- Wide cinematic pan over the Surah Ring, amber "SIRAJ" floating at centre
- No UI chrome, just the 3D scene rotating slowly

**Beats to hit**
- The Qur'an has structure you can't see on a printed page
- Siraj Noor lets you *see* it and *live inside it*

**Caption lower-third**
`Siraj Noor - a 3D Qur'an & Hadith companion`

---

## Scene 2 · Sign in with Quran.com [0:10 → 0:30]

**Show**
- Dashboard view, click `Sign in with Quran.com` in the Today Panel
- Brief pause on `prelive-oauth2.quran.foundation` consent screen
- Return to dashboard - user menu now shows signed-in state

**Beats to hit**
- OAuth 2.0 PKCE with a Cloudflare Pages Function token proxy - secret stays server-side, browser only ever holds the access + refresh tokens
- Bookmarks, collections, reading sessions, reflections all live on your Quran Foundation account via the `/auth/v1/*` endpoints
- "One tap, and everything personal follows me across devices"

**Caption**
`OAuth 2.0 PKCE · Cloudflare Pages Function proxy · zero persistent server`

---

## Scene 3 · Bookmark an ayah [0:30 → 0:55]

**Show**
- Click a surah bar in the ring → `/surah/2` opens
- Scroll to Ayat al-Kursi (2:255)
- Click bookmark star - fills amber (optimistic UI)
- Cut to DevTools Network tab briefly: `POST /auth/v1/bookmarks` → 200 with the canonical `{key, verseNumber, type:"ayah", mushaf:4}` body
- Navigate to `/bookmarks` - the saved verse is already there

**Beats to hit**
- Bookmark any ayah from any of the ten views
- Optimistic UI locally, persisted server-side via the `bookmark` scope on the Quran Foundation account
- Same account, same state, across every device the user signs into

**Caption**
`User API: POST /auth/v1/bookmarks · mushafId=4 (Hafs)`

---

## Scene 4 · Dashboard anchors + daily goal [0:55 → 1:25]

**Show**
- Back to `/dashboard`
- Today Panel at top: Ayah of the Day (Arabic + translation). Right column: Current streak counter, **Daily goal card** with preset buttons (5 / 10 / 15 / 30 min)
- Click `10 min` - the buttons flip to a progress bar showing "0 min / 10 min"
- Scroll a touch: Surah of the Day card (today's deterministic pick)
- Slow zoom on Surah Ring - visited surahs glow amber with a pulsing ring at the base

**Beats to hit**
- Tap a preset to set today's reading target - persists to your QF account via the `goal` scope
- Deterministic Surah of the Day + Ayah of the Day anchor returning visitors
- Streak counter + mushaf coverage + goal progress all at a glance
- The ring remembers - visited surahs glow amber
- Narrator aside (optional): "If you haven't read in 20+ hours, a streak-at-risk banner will sit at the top of this dashboard. Gentle urgency without a push notification permission prompt."

**Caption**
`User API: goal + reading_session + streak  ·  deterministic daily pickers`

---

## Scene 5 · Read a surah, progress fills [1:25 → 1:55]

**Show**
- Click a surah bar in the ring - `/surah/1` (Al-Fatihah) or similar short surah opens
- Scroll a couple of ayahs, let ~20 seconds of dwell time elapse on camera (shorten in post if needed)
- **Aside (3s)**: click the commentary icon on an ayah. Tafsir panel opens with a three-chip picker (Ibn Kathir / Ma'arif / Tazkirul). Tap Ma'arif - body re-fetches instantly, typography lands in a readable serif.
- Click back to `/dashboard`
- Cut to the Daily Goal card - progress bar has moved from 0 to roughly 20% (server-tracked, not simulated)

**Beats to hit**
- Reading the surah fires `POST /reading-sessions` (drives the heatmap + streak) AND `POST /activity-days` (drives QURAN_TIME goal progress). Two distinct signals, two distinct User API endpoints.
- Periodic 30-second flushes on the surah page plus a keepalive-enabled final flush on navigation. Progress updates while you're reading, not only when you navigate away.
- Tafsir picker ships three scholars (Ibn Kathir 169, Ma'arif al-Qur'an 168, Tazkirul Quran 817) via QF's Content API tafsirs endpoint. Choice persists in localStorage so the next verse remembers.

**Caption**
`User API: reading_session + activity_days + goal  ·  Content API: tafsirs × 3`

---

## Scene 6 · Activity 3D - the 10th view [1:55 → 2:20]

**Show**
- Click `Activity` in sidebar (Personal section)
- Let camera auto-rotate 5 seconds over the 7×52 heatmap
- Today cell visibly pulses brighter than the rest
- Daily Goal banner above the heatmap shows the updated progress from Scene 5

**Beats to hit**
- Tenth view, built around `reading_session` + `activity-days` scopes
- 365 days × 7 rows × session count → 3D bars, amber intensity = reading volume
- Powered entirely by the Quran Foundation User API - no local storage, no fake data

**Caption**
`365 days · pure User API · 100% static export`

---

## Scene 7 · Collections + install as a PWA [2:20 → 2:40]

**Show**
- Quick cut: `Bookmarks` sidebar link - saved verses with Arabic text and translation
- Cut to `Collections` - create one called "Ayahs that made me pause"; CSS-perspective shelf renders it as a tilting card
- Address bar: Chrome's install icon appears. Click it. OS install dialog → confirm
- Cut to the installed standalone window launching - **no URL bar, no tabs**, amber lamp icon in the taskbar / dock
- 1-second shot: navigate inside the installed app. It feels native.

**Beats to hit**
- Bookmarks + collections synced via the `bookmark` + `collection` scopes
- Install Siraj Noor in one tap. Works offline after first visit via a service worker that precaches the shell.
- This is the "maintain the connection after Ramadan" payoff - a lamp that sits in your app drawer, not a bookmark that gets lost in the browser.

**Caption**
`PWA install · offline-ready · bookmarks + collections synced`

---

## Scene 8 · Exploration reel [2:40 → 2:55]

Fast cuts, ~3 seconds each. Pure eye candy, no auth.

- Isnad Network → click a narrator node, biography slides in
- Revelation Map → Makkah/Madinah toggle, click a surah dot
- Sacred Sites → Ka'bah wireframe rotating with tawaf particle ring
- Names of Allah → 99-sphere with Allah at centre

**Beats to hit**
- The rest is pure exploration - hadith chains, revelation geography, sacred sites, 99 Names
- Every visualisation is clickable
- Every click is a new lens on scripture

---

## Scene 9 · Close [2:55 → 3:00]

**Show**
- Wide shot of the Surah Ring, camera pulls back
- Fade to end card:
  ```
  Siraj Noor
  See the structure. Build the habit.

  siraj-noor.pages.dev
  github.com/billkhiz-bit/siraj-noor

  Built for the Quran Foundation Hackathon 2026
  ```

**Beats to hit**
- "See the structure, build the habit"
- Ten views, one account, every ayah one click away, installable as a real app

---

## Recording checklist

**Before rolling**

- [ ] Sign in against the **prelive sandbox** (production client scopes not yet approved as of 2026-04-17). Both hosts produce identical-looking UI; prelive is the safe recording target.
- [ ] Pre-seed reading sessions: visit at least 5 surahs across 5 different days so the Activity heatmap shows variance. ReadingTracker auto-fires periodic activity-day flushes every 30s; to get multi-day data, record over several days or backfill via QF's API directly.
- [ ] Pre-seed 3–4 bookmarks across different surahs (Fatihah 1:1, Baqarah 2:255, Nur 24:35, Rahman 55:13 makes a visually varied demo ring)
- [ ] Create 1–2 collections so Scene 7's shelf has cards already present, and create one live on camera for the beat
- [ ] **Before Scene 4**: make sure the current session's goal is unset (`/dashboard` shows the preset buttons, not a progress bar). Delete any lingering goal via `/dashboard` → "Change" → then don't re-set until the camera is rolling.
- [ ] **Before Scene 5**: close any in-flight activity-day flushes by reloading once so the goal progress starts from 0% on camera. The 30s periodic flush means the moment you open a surah, the timer starts.
- [ ] **Before Scene 7**: uninstall any prior PWA install of Siraj Noor so Chrome shows the "Install" icon in the address bar fresh. On Windows: Chrome menu → Apps → right-click Siraj Noor → Uninstall.
- [ ] Hide browser bookmarks bar + extension icons
- [ ] Fresh incognito window with cookies from a prior signed-in session preserved (or sign in cleanly if you want the OAuth flow on camera - recommended for Scene 2)
- [ ] Dark mode forced off at OS level (the app forces dark on its own; OS-level light mode prevents dev-tool panels from appearing dark in any system-chrome shots)
- [ ] Screen capture at 1920×1080, 60 fps (OBS or equivalent)
- [ ] VO recorded separately, aligned in editor - do **not** record with system audio pickup
- [ ] Export H.264, check Provision Launch file size limit before final upload

**During recording**

- [ ] Open DevTools Network tab filtered by `apis-prelive` **just before** Scene 2 and let it record silently in the background; useful to cut a 2-second insert shot in Scene 4 or 5 showing a live `200 OK` on `/auth/v1/bookmarks?mushafId=4&first=20` as proof the integration is real, not mocked.
- [ ] Between scenes: if the app state drifts (phantom bookmarks, stale streak), hard-refresh rather than stop-start - providers remount on hard refresh and pull fresh state from the API.

---

## Cut-down order if running long

| Target | Action | Saves |
|---|---|---|
| 2:45 | Drop Scene 8 (exploration reel) | -15s |
| 2:30 | Trim Scene 7 to bookmarks + install, skip collection creation | -10s |
| 2:15 | Skip tafsir picker aside in Scene 5 | -3s |
| 2:10 | Collapse Scene 6 heatmap camera rotation to 3s | -5s |

---

## Scenes to *never* cut

1. **Scene 2 (sign-in flow)** - this is the eligibility proof. Without it on camera, judges may assume it's a content-API-only app.
2. **Scene 4 + 5 (daily goal set → progress fills after reading)** - this is the narrative spine. Four User API endpoints flowing through a single coherent habit loop is the clearest "this app uses QF deeply" argument.
3. **Scene 6 (Activity 3D)** - the differentiator that makes this a ten-view app instead of a nine-view app.
4. **Scene 7 (PWA install)** - direct visual answer to "maintain the connection after Ramadan". Not just another viewer; a real app the user can install.
