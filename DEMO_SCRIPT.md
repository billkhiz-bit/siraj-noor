# Siraj Noor - Demo Video Beat Sheet

**Target:** 2:30 (hard cap 3:00)
**For:** Provision Launch × Quran Foundation Hackathon judges
**Format:** Bullet guide - hit the beats, talk naturally over the visuals
**Status (2026-04-16):** Auth end-to-end green on prelive; recording any time this week is safe.

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

## Scene 4 · Ring overlay + Today panel [0:55 → 1:20]

**Show**
- Back to `/dashboard`
- Today Panel at top: Ayah of the Day (Arabic + translation), streak, "n of 114 surahs visited"
- Slow zoom on Surah Ring - the visited surah now glows amber with a pulsing ring at its base

**Beats to hit**
- The ring remembers - visited surahs glow amber
- Date-deterministic Ayah of the Day (same ayah for every user on the same UTC day)
- Streak counter + mushaf coverage at a glance

**Caption**
`Content API: /verses/by_key  ·  User API: reading_session + streak`

---

## Scene 5 · Activity 3D - the 10th view [1:20 → 1:50]

**Show**
- Click `Activity` in sidebar (Personal section)
- Let camera auto-rotate 5 seconds over the 7×52 heatmap
- Today cell visibly pulses brighter than the rest
- Hover a cell - tooltip with date + session count
- Cut to four stat cards (streak / longest / sessions / surahs visited)

**Beats to hit**
- Tenth view, built around `reading_session` scope
- 365 days × 7 rows × session count → 3D bars, amber intensity = reading volume
- Powered entirely by the Quran Foundation User API - no local storage, no fake data

**Caption**
`365 days · pure User API · 100% static export`

---

## Scene 6 · Collections + bookmarks list [1:50 → 2:10]

**Show**
- Click `Bookmarks` in sidebar - saved verses with Arabic text and translation
- Click `Collections` - create one called "Ayahs that made me pause"
- CSS-perspective shelf renders it as a tilting card

**Beats to hit**
- Dedicated list view for bookmarks
- Collections = visual shelf, groupable by theme
- All of it synced via the `collection` scope

**Caption**
`User API: bookmark + collection scopes`

---

## Scene 7 · Exploration reel [2:10 → 2:30]

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

## Scene 8 · Close [2:30 → 2:45]

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
- Ten views, one account, every ayah one click away

---

## Recording checklist

**Before rolling**

- [ ] Sign in against the **prelive sandbox** (production client scopes not yet approved as of 2026-04-16). Both hosts produce identical-looking UI; prelive is the safe recording target.
- [ ] Pre-seed reading sessions: visit at least 5 surahs across 5 different days so the Activity heatmap shows variance. The ReadingTracker auto-fires on `/surah/[id]` mount once per chapter per session, so visiting five surahs in one sitting creates one dense cell; to get multi-day data, record over several days or use QF's API directly to backfill.
- [ ] Pre-seed 3–4 bookmarks across different surahs (Fatihah 1:1, Baqarah 2:255, Nur 24:35, Rahman 55:13 makes a visually varied demo ring)
- [ ] Create 1–2 collections so Scene 6's shelf has cards already present, and create one live on camera for the beat
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
| 2:25 | Drop Scene 7 (exploration reel) | -20s |
| 2:15 | Trim Scene 6 to bookmarks-only | -10s |
| 2:05 | Skip tooltip hover in Scene 4 | -10s |
| 2:00 | Cut Scene 5 stat-card cut | -5s |

---

## Scenes to *never* cut

1. **Scene 2 (sign-in flow)** - this is the eligibility proof. Without it on camera, judges may assume it's a content-API-only app.
2. **Scene 4 (ring overlay + Today panel)** - highest visual impact to time ratio. The amber ring read indicator is the single most memorable shot.
3. **Scene 5 (Activity 3D)** - the differentiator that makes this a ten-view app instead of a nine-view app.
