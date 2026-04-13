# Siraj Noor — Quran Foundation Hackathon Progress

**Submission deadline:** 2026-04-20 (Provision Launch × Quran Foundation Hackathon, $10k pool, 7 winners)
**Today:** 2026-04-13 (Day 1 of 7)
**HEAD:** `3e235b9` on `master` of `billkhiz-bit/siraj-noor` (private)
**Local:** `C:\Users\bilal\projects\siraj-noor`
**Live URL:** *pending Cloudflare Pages link*

---

## Why this fork exists

The original Siraj (`billkhiz-bit/siraj` → `siraj-ept.pages.dev`) was built for Ramadan Hacks 2026 and didn't place. The Quran Foundation hackathon has a **strict eligibility gate**: submissions must use at least one Content API *and* at least one User API from Quran Foundation. Original Siraj only uses Content endpoints (via `api.quran.com/api/v4`, which is the Quran Foundation content surface), so it would fail Phase 1 screening.

Rather than modifying the frozen Ramadan Hacks artefact, this is a parallel fork in a separate repo + separate Cloudflare Pages project. Original `siraj-ept.pages.dev` stays untouched. New build deploys to `siraj-noor.pages.dev`.

**Solo submission. Scope: option 3 (full personalisation).**

---

## Day 1 — done

### Repo + infra
- Forked from `ayat/` baseline via `git archive` (only tracked files, no build artefacts)
- New private repo: `https://github.com/billkhiz-bit/siraj-noor`
- 8 commits pushed, `npm install`, `tsc --noEmit`, `eslint`, `next build` all green
- 131 static pages generating cleanly

### Architecture additions

```
src/
  app/
    activity/page.tsx              ← 10th 3D view (heatmap)
    auth/callback/page.tsx         ← OAuth PKCE redirect handler
    bookmarks/page.tsx             ← saved ayahs list
    collections/page.tsx           ← create + 3D shelf
  components/
    auth/
      bookmark-button.tsx          ← client island on each verse card
      reading-tracker.tsx          ← fire-and-forget session log on surah mount
      reflection-button.tsx        ← dialog composer for /posts API
      today-panel.tsx              ← Ayah of the Day + streak on /dashboard
      user-menu.tsx                ← sidebar sign-in / signed-in / sign-out
    dashboard/
      activity-3d.tsx              ← 7×52 extruded calendar heatmap
      surah-3d-chart.tsx           ← MODIFIED: read-surah amber overlay
      sidebar.tsx                  ← MODIFIED: Explore/Personal split + UserMenu
  lib/
    auth/
      auth-context.tsx             ← useSyncExternalStore over localStorage
      bookmarks-context.tsx        ← provider with optimistic toggle
      collections-context.tsx      ← provider with optimistic CRUD
      reading-progress-context.tsx ← provider with sessions + streak
      config.ts                    ← endpoints + env var reads
      pkce.ts                      ← Web Crypto S256 PKCE pair
      qf-oauth.ts                  ← begin/complete/refresh/logout
      storage.ts                   ← tokens + listener registry
    daily-ayah.ts                  ← deterministic date-seeded ayah picker
    qf-user-api.ts                 ← bookmarks/collections/sessions/streaks/posts
    quran-api.ts                   ← MODIFIED: added fetchVerseByKey
```

### Features shipped (option 3 in full)
- ✅ OAuth 2.0 PKCE (browser-only public client, no backend)
- ✅ User API client with auto-refresh on 401, custom `x-auth-token` + `x-client-id` headers
- ✅ Bookmarks: per-verse button, list page, optimistic toggle, surah ring indicators
- ✅ Reading sessions: fire-and-forget tracker on each `/surah/[id]` mount
- ✅ Reading progress overlay on the Surah Ring (read surahs glow amber + base ring)
- ✅ Today panel on `/dashboard`: Ayah of the Day (date-deterministic) + streak counter + "n of 114 surahs visited"
- ✅ Activity dashboard 10th 3D view (`/activity`): 7×52 extruded heatmap
- ✅ Reflections: dialog composer next to every verse, posts via Posts API
- ✅ Collections: provider, create form, CSS-perspective shelf with delete
- ✅ Sidebar reorganised into **Explore** vs **Personal** sections

### Hardening done after preflight + specialist review

**Security:**
- Open redirect blocked on `/auth/callback` (`//evil.com` style protocol-relative URLs rejected)
- PKCE state cleared in `finally` after token exchange (was leaking on failure)
- `refreshTokens` only clears tokens on 4xx, not transient 5xx (was logging users out on hiccups)
- Optimistic update revert race fixed across all 3 contexts (functional reverts target only the affected item)
- Reading progress uses `Promise.allSettled` so partial failures surface instead of silently showing empty data

**Accessibility:**
- Touch targets bumped to 44×44px on mobile (WCAG 2.5.5)
- `role="img" aria-label` on Activity 3D canvas + sr-only summary of busiest day
- `role="status" aria-live="polite"` + `aria-describedby` on reflection composer
- Visually-hidden form labels on collections create form
- `role="alert"` on error banners (bookmarks, collections, activity)
- `motion-safe:` gating on collection card hover-lift
- aria-labels formatted as "surah 2, ayah 255" instead of raw "2:255"

---

## Quran Foundation API quick reference

Full reference is in `~/.claude/projects/C--Users-bilal-projects-ayat/memory/quran_foundation_api.md`.

| Endpoint | URL |
|---|---|
| Registration portal | https://api-docs.quran.foundation/request-access |
| Authorize | `https://oauth2.quran.foundation/oauth2/auth` |
| Token | `https://oauth2.quran.foundation/oauth2/token` |
| Logout | `https://oauth2.quran.foundation/oauth2/sessions/logout` |
| Sandbox | `prelive-oauth2.quran.foundation` (same paths) |
| User API base | `https://apis.quran.foundation/auth/v1/` |

**Headers (NOT standard Bearer):**
```
x-auth-token: <access_token>
x-client-id: <client_id>
```

**PKCE:** ✅ public client supported. **Access token:** 3600s. **Refresh:** via `offline_access` scope.

**Scopes used:** `openid offline_access user bookmark collection reading_session goal streak post`

---

## Now blocked on you

### 1. Register the API client at https://api-docs.quran.foundation/request-access

Fields:
- **App Name:** `Siraj Noor`
- **Email:** your usual
- **Client URL:** `https://siraj-noor.pages.dev` (doesn't need to exist yet)
- **Redirect URIs (both):**
  - `http://localhost:3000/auth/callback/` ← trailing slash REQUIRED (`next.config.ts` has `trailingSlash: true`)
  - `https://siraj-noor.pages.dev/auth/callback/` ← trailing slash REQUIRED
- **Post-logout redirect URI:** `https://siraj-noor.pages.dev/`
- **Privacy Policy / ToS:** point at the README or use placeholders, ask if rejected
- **Scopes:** request the full set in one go to avoid re-approval — `openid offline_access user bookmark collection reading_session goal streak post`
- **Client type:** pick **Public / SPA / PKCE** if offered (no client secret needed)
- **Notes box:** "This is for the Quran Foundation Hackathon 2026 (Provision Launch). Submission deadline Apr 20 — appreciate expedited review if possible."
- **Support email if delayed:** `Hackathon@quran.com`

**Action:** reply with the `client_id` as soon as you receive it.

### 2. Create the Cloudflare Pages project

- Linked to GitHub repo `billkhiz-bit/siraj-noor`, branch `master`
- **Build command:** `npx next build`
- **Build output directory:** `out`
- **Environment variables (Production AND Preview):**
  - `NEXT_PUBLIC_QF_CLIENT_ID` = your client_id from step 1
  - `NEXT_PUBLIC_QF_AUTH_HOST` = `https://oauth2.quran.foundation` (production only — leave UNSET for sandbox)
  - `NEXT_PUBLIC_QF_API_HOST` = `https://apis.quran.foundation` (default, only set if you need to override)

### 3. Local `.env.local` for development

```dotenv
NEXT_PUBLIC_QF_CLIENT_ID=<your_client_id>
# Defaults to prelive sandbox if these are unset:
# NEXT_PUBLIC_QF_AUTH_HOST=https://prelive-oauth2.quran.foundation
# NEXT_PUBLIC_QF_API_HOST=https://apis.quran.foundation
```

A template is at `.env.local.example` in the repo root.

---

## Days 2–7 plan

| Day | Date | Goals |
|---|---|---|
| 2 | Apr 14 | Live test against prelive sandbox once `client_id` is in. Fix any API-shape mismatches. Polish empty/error states based on real responses. |
| 3 | Apr 15 | Iterate on visuals — Activity 3D camera, surah ring read indicator, Today panel layout. Real device testing. |
| 4 | Apr 16 | Switch `NEXT_PUBLIC_QF_AUTH_HOST` to prod. Deploy to `siraj-noor.pages.dev`. End-to-end test on the live URL. |
| 5 | Apr 17 | Stretch features if time permits — bookmark→collection assignment, reflection feed on /bookmarks, reading goals UI. |
| 6 | Apr 18 | Record 2–3 min demo video. Draft submission copy. |
| 7 | Apr 19 | Submit via Provision Launch form (24h buffer before Apr 20 deadline). |

---

## Submission checklist (Provision Launch form)

- [ ] Project title: `Siraj Noor`
- [ ] Team members: solo (Bilal Khan)
- [ ] Short description (1–2 sentences)
- [ ] Detailed explanation of the idea
- [ ] Live demo link (`siraj-noor.pages.dev` — once deployed)
- [ ] GitHub repo (`billkhiz-bit/siraj-noor` — needs to be made public OR add Provision Launch as collaborator before submission)
- [ ] 2–3 minute demo video
- [ ] API usage description (name every Quran Foundation Content + User endpoint hit)

---

## Commit log so far

```
3e235b9  Security and accessibility hardening from preflight review
b7c822e  Refactor auth context to useSyncExternalStore for token sync
73e5495  Add reflection composer dialog and collections shelf
3b12c3a  Add Activity dashboard as the 10th 3D view
4dca337  Add reading progress overlay on Surah Ring, Today panel, reading session tracking
f9a6852  Add bookmark button, optimistic bookmarks context, and bookmarks list page
3522616  Add Quran Foundation OAuth PKCE flow and User API scaffolding
a90c1f4  Fork from siraj for Quran Foundation Hackathon submission
```

---

## Why nothing was committed to the original `ayat/` repo

The original `C:\Users\bilal\projects\ayat` (`billkhiz-bit/siraj`) is the frozen Ramadan Hacks 2026 artefact. Modifying it would alter the URL judges from that hackathon may have visited, change the README narrative, and risk introducing a regression to a working deployed site. All hackathon-2 work happens in this fork. If you want to mirror this progress doc to that repo as well, say so and I'll do it — but my recommendation is to leave `ayat/` untouched.
