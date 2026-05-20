# Siraj Noor - Demo Video Script (criteria-focused bullet guide)

**Target:** 2:45 (hard cap 3:00) · **Format:** talking points - say it naturally over the visuals, don't read it verbatim
**Status (2026-05-20):** App green, auth working on prelive, ready to record. Bullets ordered by what the judges score.

---

## The rubric (memorise this - it drives everything below)

| Weight | Category | What the judges want to see |
|---|---|---|
| **30%** | **Impact** | Does this keep people engaging with the Qur'an *beyond Ramadan*? Habit, retention, real behaviour change. |
| **20%** | **Product Quality** | Does it feel finished, fast, accessible, trustworthy? |
| **20%** | **Tech Execution** | Is the build solid, not a weekend prototype? |
| **15%** | **Innovation** | Is the approach novel? |
| **15%** | **API Use** | Does it use the Quran Foundation **User API** deeply, not just a save button? |

Spend screen time in proportion to weight: most of the video is the **habit loop (Impact)** and **deep User API use (API)**. The 3D is the medium, not the headline.

---

## 30-second elevator (open the video with a version of this)

- Siraj Noor is a personal Qur'an and Hadith companion for visual learners
- It makes your relationship with the Qur'an *visible*: bookmarks, streaks, daily goals, and a year of reading rendered as a 3D heatmap
- Every personal touchpoint is stored on your Quran Foundation account, so your practice follows you across devices and outlives Ramadan
- It is a companion to reading the Mushaf and studying tafsir, never a replacement
- The catch: none of the personal layer exists without the Quran Foundation User API

---

## IMPACT (30%) - spend the most time here

**Say:** the brief is about engagement *after* Ramadan. That is a habit problem, so the app is built as a habit loop.

**Show + narrate the loop, in order:**
- Open on the **Activity 3D heatmap** rotating. "A year of one person's reading, one cell per day. Every cell is a day they showed up."
- On the dashboard, **set a daily goal** (tap a 5/10/15/30-min preset). "This writes to my Quran Foundation goal scope, not local storage."
- **Read a surah** for ~20s on camera. "Reading fires a reading-session and an activity-day on my QF account."
- Back to the dashboard: **the goal progress bar has moved**, server-tracked. The **streak** ticks. The **Surah Ring glows amber** over what I've read.
- Return to the heatmap: **today's cell is taller and brighter.** "Same view from the opening shot - now you've seen exactly what builds it."

**Land the point:** set a goal, read, watch the heatmap grow and the streak hold. That loop is what brings someone back on day 8, not just during Ramadan.

**Supporting habit cues to mention:**
- Streak-at-risk banner appears when 20+ hours pass since the last session (gentle nudge, no push-permission prompt)
- Deterministic Surah of the Day + Ayah of the Day anchor every visit
- Installable PWA: "a lamp in your app drawer, not a bookmark lost in the browser" - the literal answer to "maintain the connection after Ramadan"

---

## API USE (15%) - prove depth, not a token integration

**Say:** this is a true User API consumer, not a content-only viewer. Show the sign-in on camera as eligibility proof.

**Bullets to hit:**
- **Sign in with Quran.com** via OAuth 2.0 PKCE, token exchange proxied through a Cloudflare Pages Function so the secret stays server-side
- The habit loop spans **four endpoints working together**: `/reading-sessions` (the what) → `/activity-days` (the how-long, drives goal progress) → `/goals/get-todays-plan` (versus target) → `/streaks/current-streak-days` (across days)
- Six User API resources actively read and written: **bookmark, collection, reading_session, goal, streak**, plus core identity
- Optional 2s proof insert: DevTools Network tab on a live `200 OK` for `/auth/v1/bookmarks`. **Filter to `apis-prelive` and clear the console first** (see Console hygiene)
- "We read the OpenAPI carefully: reading-sessions drive the heatmap, but activity-days drive goal progress. They are different signals, and we use both correctly."

---

## INNOVATION (15%) - the 3D, framed as the medium

**Say:** scripture has structure you cannot see on a flat page, so we do not present it flat.

**Bullets to hit (fast reel, ~3s each):**
- Ten interactive 3D views: Surah Structure ring, Isnad Network, Prophet Timeline, Revelation Map, Sacred Sites, 99 Names of Allah, Islamic Journeys, Hadith Explorer, Word Frequency, and the Activity heatmap
- Every visualisation is clickable: tap an Isnad node for the narrator's biography, a prophet for their story and Qur'anic references, a sacred site for its verse citations
- **The novel claim:** the 10th view treats Quran Foundation User API data as a 3D object. As far as we can tell, no other app renders your QF reading history as a live 3D heatmap.

---

## PRODUCT QUALITY (20%) - let the polish speak, name a few things

**Show, and mention in passing:**
- Cinematic, considered visual design; one-click from the landing splash into the habit dashboard
- Tafsir on any ayah from a three-scholar picker (Ibn Kathir, Ma'arif al-Qur'an, Tazkirul Quran), preference remembered
- Accessibility: Lighthouse 100 on accessibility and SEO, keyboard skip link, ARIA on the 3D canvases, 44px tap targets, reduced-motion support
- Honest about scope: deployed on the QF prelive environment, hadith samples limited to Book 1 - say it plainly if asked

---

## TECH EXECUTION (20%) - the "production-shaped, not a prototype" beats

**Mention as narrator asides where a scene runs short:**
- Runtime validation at every QF API boundary with Zod; shape drift surfaces as a loud structured error, not a silent undefined
- Token refresh hardened with a single-flight gate so sibling providers cannot cascade-revoke each other's access tokens on mount
- Static export, 131+ pre-rendered pages, sitemap, service-worker offline shell
- Optimistic UI with correct revert on failure across bookmarks, collections, and reading progress

---

## Suggested running order (maps the bullets to ~2:45)

1. **0:00-0:15** Elevator + cold-open on the Activity heatmap (Impact framing)
2. **0:15-0:35** Sign in with Quran.com (API eligibility proof)
3. **0:35-1:05** Set a daily goal on the dashboard (Impact)
4. **1:05-1:40** Read a surah, tafsir aside, progress fills (Impact + API)
5. **1:40-2:00** Heatmap fills, streak ticks, ring glows (Impact payoff)
6. **2:00-2:25** Bookmark + collection + PWA install (Impact + API + Quality)
7. **2:25-2:45** 3D exploration reel (Innovation)
8. **2:45-3:00** Close card: "Build the habit. See the structure."

**Cut from the bottom if long:** trim the exploration reel first, then the collection-creation beat, then the tafsir aside. Never cut sign-in, the goal-set-to-progress loop, or the heatmap.

---

## Console hygiene (only if you show DevTools on camera)

Lighthouse (2026-05-20): Accessibility 100, SEO 100, Best Practices 96; Performance 52-57 is the expected Three.js cost and not worth chasing. Two benign console items, both Next.js static-export artefacts, neither a real bug:

- ~13 `404`s on `__next.<route>.__PAGE__.txt?_rsc=…` - RSC prefetch payloads static export does not emit; navigation falls back to a full load and works.
- React minified `#418` - a hydration text mismatch from date-derived content (today's cell, streak, daily pickers vs the build date). React recovers on the client.

If you open DevTools, **filter the Network tab to `apis-prelive` and clear the Console** so this noise stays off camera next to the real QF `200 OK`s.

---

## Recording checklist

**Before rolling**
- [ ] Sign in against the **prelive sandbox** (production user-scopes not yet approved). Identical-looking UI, safe recording target.
- [ ] Pre-seed reading sessions across 5+ different days so the heatmap shows variance in the cold open and payoff.
- [ ] Pre-seed 3-4 bookmarks (Fatihah 1:1, Baqarah 2:255, Nur 24:35, Rahman 55:13 makes a varied ring) and 1-2 collections.
- [ ] Unset the current day's goal before the goal-setting beat, so the preset buttons show (not a progress bar).
- [ ] Reload once before the read beat so goal progress starts from 0% on camera.
- [ ] Uninstall any prior PWA install so Chrome shows the fresh "Install" icon.
- [ ] Hide the bookmarks bar and extension icons; OS in light mode; capture 1920×1080 at 60fps.
- [ ] Record voiceover separately and align in the editor; do not pick up system audio.
- [ ] Export H.264; check the Provision Launch file-size limit before upload.

**During recording**
- [ ] If state drifts between takes (phantom bookmark, stale streak), hard-refresh rather than stop-start; providers remount and pull fresh state.
- [ ] Keep takes short and re-runnable; you are hitting talking points, not reading a script.

**After**
- [ ] Upload unlisted to YouTube or Loom (Drive risks permission walls); paste the URL into the form's links page.
