# Siraj Noor — Demo Video Beat Sheet

**Target:** 2:30 (hard cap 3:00)
**For:** Provision Launch × Quran Foundation Hackathon judges
**Format:** Bullet guide — hit the beats, talk naturally over the visuals

---

## Why this structure

Impact is worth 30 points, the largest judging category. The first 60 seconds must prove this is a **Quran Foundation User API** consumer, not a content-only Qur'an viewer — that's the eligibility differentiator. OAuth flow + amber ring overlay go up front for that reason. Everything else is supporting evidence; cut from the bottom if running long.

---

## Scene 1 · Hook [0:00 → 0:10]

**Show**
- Wide cinematic pan over the Surah Ring, amber "SIRAJ" floating at centre
- No UI chrome, just the 3D scene rotating slowly

**Beats to hit**
- The Qur'an has structure you can't see on a printed page
- Siraj Noor lets you *see* it and *live inside it*

**Caption lower-third**
`Siraj Noor — a 3D Qur'an & Hadith companion`

---

## Scene 2 · Sign in with Quran.com [0:10 → 0:30]

**Show**
- Dashboard view, click `Sign in with Quran.com` in the Today Panel
- Brief pause on `prelive-oauth2.quran.foundation` consent screen
- Return to dashboard — user menu now shows signed-in state

**Beats to hit**
- OAuth 2.0 PKCE — public client, no backend, no client secrets
- Bookmarks, collections, reading sessions, reflections all live on your Quran Foundation account
- "One tap, and everything personal follows me across devices"

**Caption**
`OAuth 2.0 PKCE · public client · no server`

---

## Scene 3 · Bookmark + reflect on an ayah [0:30 → 0:55]

**Show**
- Click a surah bar in the ring → `/surah/2` opens
- Scroll to Ayat al-Kursi (2:255)
- Click bookmark star — fills amber (optimistic)
- Click reflection button → composer dialog → type one short line → submit
- Toast confirms

**Beats to hit**
- Bookmark or reflect on any ayah from any view
- Optimistic UI, but backed by `bookmark.create` scope
- Reflections post to Quran Foundation `/posts` endpoint — travels with the account

**Caption**
`User API: bookmark.create · post.create`

---

## Scene 4 · Ring overlay + Today panel [0:55 → 1:20]

**Show**
- Back to `/dashboard`
- Today Panel at top: Ayah of the Day (Arabic + translation), streak, "n of 114 surahs visited"
- Slow zoom on Surah Ring — the visited surah now glows amber with a pulsing ring at its base

**Beats to hit**
- The ring remembers — visited surahs glow amber
- Date-deterministic Ayah of the Day (same ayah for every user on the same UTC day)
- Streak counter + mushaf coverage at a glance

**Caption**
`Content API: /verses/by_key  ·  User API: reading_session + streak`

---

## Scene 5 · Activity 3D — the 10th view [1:20 → 1:50]

**Show**
- Click `Activity` in sidebar (Personal section)
- Let camera auto-rotate 5 seconds over the 7×52 heatmap
- Today cell visibly pulses brighter than the rest
- Hover a cell — tooltip with date + session count
- Cut to four stat cards (streak / longest / sessions / surahs visited)

**Beats to hit**
- Tenth view, built around `reading_session` scope
- 365 days × 7 rows × session count → 3D bars, amber intensity = reading volume
- Powered entirely by the Quran Foundation User API — no local storage, no fake data

**Caption**
`365 days · pure User API · 100% static export`

---

## Scene 6 · Collections + bookmarks list [1:50 → 2:10]

**Show**
- Click `Bookmarks` in sidebar — saved verses with Arabic text and translation
- Click `Collections` — create one called "Ayahs that made me pause"
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
- The rest is pure exploration — hadith chains, revelation geography, sacred sites, 99 Names
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

- [ ] Sign in against the **prelive sandbox** before rolling (not prod)
- [ ] Pre-seed ≥5 days of reading sessions so Activity 3D has visible data
- [ ] Pre-seed 3–4 bookmarks across different surahs so the ring has multiple amber surahs
- [ ] Hide browser bookmarks bar + extension icons
- [ ] Incognito window, dark mode forced off at OS level
- [ ] Screen capture at 1920×1080, 60 fps (OBS or equivalent)
- [ ] VO recorded separately, aligned in editor — do **not** record with system audio pickup
- [ ] Export H.264, check Provision Launch file size limit before final upload

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

1. **Scene 2 (sign-in flow)** — this is the eligibility proof. Without it on camera, judges may assume it's a content-API-only app.
2. **Scene 4 (ring overlay + Today panel)** — highest visual impact to time ratio. The amber ring read indicator is the single most memorable shot.
3. **Scene 5 (Activity 3D)** — the differentiator that makes this a ten-view app instead of a nine-view app.
