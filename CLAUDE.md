@AGENTS.md

# Siraj Noor (سراج نور) - Qur'an & Hadith 3D Data Visualisation + Personal Companion

## Project Overview
Fork of Siraj built for the Quran Foundation Hackathon 2026 (Provision Launch, deadline 2026-04-20). Adds a personal companion layer on top of the original exploratory 3D views: OAuth authentication, bookmarks, collections, streak tracking, reading progress, reflections, and an Activity dashboard - all powered by Quran Foundation User APIs.

**Live URL**: https://siraj-noor.pages.dev (pending first deploy)
**GitHub**: https://github.com/billkhiz-bit/siraj-noor (private)
**Parent project**: https://github.com/billkhiz-bit/siraj (original Siraj, frozen for Ramadan Hacks)
**Local dev**: `cd C:\Users\bilal\projects\siraj-noor && npx next dev --port 3000`

## Hackathon Eligibility
The Quran Foundation Hackathon requires at least one Content API *and* one User API from Quran Foundation. Original Siraj only uses Content endpoints (via Qur'an.com API v4, which is the Quran Foundation content surface). This fork adds the User API layer to meet Phase 1 eligibility screening.

## Stack
- **Framework**: Next.js 16 (App Router, static export)
- **3D**: Three.js via @react-three/fiber + @react-three/drei + @react-three/postprocessing
- **Maps**: MapLibre GL + react-map-gl (CARTO Dark Matter no-labels tiles)
- **UI**: shadcn/ui (base-ui) + Tailwind CSS v4 + Geist fonts
- **Data**: Qur'an.com API v4 (verified), free hadith API, static TypeScript datasets
- **Hosting**: Cloudflare Pages (free tier, static export)

## Architecture
```
src/
  app/
    page.tsx              - Cinematic landing (Bismillah → SIRAJ) + Ayah of the Day
    dashboard/            - Surah Structure (3D cylindrical ring, 114 surahs, reading progress overlay)
    words/                - Word Frequency (3D Fibonacci sphere, click for ayahs)
    isnad/                - Isnad Network (3D layered graph, click for biographies)
    prophets/             - Prophet Timeline (3D timeline, click for stories)
    hadith/               - Hadith Explorer (3D towers, side panel with topics + sample hadiths)
    map/                  - Revelation Map (MapLibre, clickable surah dots)
    journeys/             - Islamic Journeys (10 routes, key figures, all-journeys view)
    names/                - Names of Allah (3D sphere, Allah at centre, filterable)
    sites/                - Sacred Sites (5 wireframe 3D models with particles, annotations, elevation profiles)
    activity/             - Activity dashboard (10th 3D view, reading heatmap, streak, goals)
    bookmarks/            - Saved ayahs list with reflections
    collections/          - 3D shelf of user-created collections
    surah/[id]/           - Surah detail (114 pages, Arabic + translation + transliteration, bookmark button)
    auth/callback/        - OAuth redirect handler (PKCE token exchange)
  components/dashboard/   - All visualisation components
  components/auth/        - Login button, user menu, auth context provider
  lib/data/               - Static datasets (surahs, words, prophets, narrators, names, journeys, hadith, sacred-sites)
  lib/quran-api.ts        - Qur'an.com API client (parallel fetch for translations + transliteration)
  lib/auth/qf-oauth.ts    - Quran Foundation OAuth2 PKCE flow (authorize, exchange, refresh)
  lib/qf-user-api.ts      - Quran Foundation User API client (bookmarks, collections, sessions, etc)
  hooks/                  - Keyboard navigation hook, useAuth hook
```

## Deploy
```bash
rm -rf .next out && npx next build
npx wrangler pages deploy out --project-name siraj-noor --branch main --commit-dirty=true
git add -A && git commit -m "message" && git push origin master
```

## Quran Foundation User APIs
Full reference lives in `C:\Users\bilal\.claude\projects\C--Users-bilal-projects-ayat\memory\quran_foundation_api.md`. Key facts:
- **OAuth**: PKCE public-client flow (no backend/secret needed). Authorize at `https://oauth2.quran.foundation/oauth2/auth`, token exchange at `https://oauth2.quran.foundation/oauth2/token`. Use prelive-oauth2 sandbox during dev.
- **API base**: `https://apis.quran.foundation/auth/v1/`
- **Auth headers**: `x-auth-token: <access_token>` + `x-client-id: <client_id>` - NOT `Authorization: Bearer`.
- **Env var**: `NEXT_PUBLIC_QF_CLIENT_ID` (public, not a secret - safe to inline in the bundle).
- **Token lifetime**: 3600s. Refresh via `offline_access` scope.
- **Scopes used**: `openid offline_access user bookmark collection reading_session goal streak post`.

## Data Sources & Accuracy
- **Surah metadata**: Verified against Qur'an.com API v4 (Egyptian Standard / Al-Azhar)
- **Verse text**: Uthmani script from Qur'an.com API
- **Translation**: Sahih International (ID 20) - previously ID 131 which stopped working
- **Transliteration**: Word-by-word from Qur'an.com API (separate request, merged by verse_key)
- **Hadith samples**: fawazahmed0/hadith-api on jsDelivr (free, no key needed)
- **99 Names**: Sahih al-Bukhari 2736, Sahih Muslim 2677
- **Journeys**: Ibn Hisham, al-Tabari, Martin Lings
- **Narrators**: 37 across 4 generations with biographies
- Always verify against Qur'an.com API before changing surah/verse data
- Use ﷺ when referencing the Prophet Muhammad
- Use (RA) suffix for all Sahaba (companions) - e.g. Abu Bakr (RA), Aisha (RA)
- No country labels on maps (no-labels tile style)

## Responsive Design
- Mobile-first Tailwind - base classes for mobile, `md:` prefixes restore desktop layout
- **Sidebar**: collapsible drawer on mobile (hamburger button), static on `md:`+
- **3D canvases**: `h-[350px]` on mobile, `h-[560px]` on `md:`+
- **Side panels** (hadith, prophet, isnad, words): stack below canvas via `flex-col md:flex-row`
- **Map overlays**: narrower and repositioned on mobile; key figures panel hidden on mobile
- **Landing stats**: flex-wrap with tighter gaps on mobile
- **Viewport**: `h-dvh` instead of `h-screen` to handle mobile browser chrome
- **Breakpoint**: `md:` (768px) is the single breakpoint - below is mobile, above is desktop

## Key Interaction Patterns
- **Click-to-pin** on verse bars (click bar to pin ayah card, click empty space to dismiss)
- **Click-to-explore** on surah bars (navigates to /surah/[id])
- **Click-to-biography** on Isnad nodes and Prophet nodes (opens side panel)
- **Click-to-search** on Word Frequency words (searches Qur'an.com API for ayahs)
- **Arrow keys** navigate surahs, Enter drills in, Escape deselects
- **Ctrl+K** global search across all datasets

## Design
- Dark theme (#030308/#0a0a1a backgrounds), amber accent (#f59e0b)
- Cyan = Meccan, Violet = Medinan colour coding throughout
- Bloom post-processing on all 3D views
- Project Backbone-inspired overlay panels for map views
- Geist Sans for UI, Geist Mono for data

## Cloudflare Pages
- `trailingSlash: true` in next.config.ts is **required** - without it, Next.js exports both `page.html` and `page/index.html`, causing routing ambiguity and mass 4xx errors on Cloudflare
- `public/_headers` sets cache rules: `_next/static/*` gets 1-year immutable cache, HTML gets `must-revalidate`
- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy) applied via `_headers` file

## Gotchas
- Qur'an.com API: adding `words=true` drops `translations` from response - must use two parallel fetches
- Translation ID 131 (Khattab) stopped working - use ID 20 (Sahih International)
- `style jsx` causes hydration errors in Next.js App Router - use globals.css
- `pointer-events-none` on tooltips prevents scrolling - use `pointer-events-auto`
- Tooltip hover lock pattern causes 3D scene to freeze - use click-to-pin instead
- Use `onPointerMissed` on Canvas to dismiss pinned items on empty click
- OrbitControls captures arrow keys - add `keyEvents={false}`
- Billboard component prevents text mirroring (vs manual lookAt which flips)
- `useEffect` + `setState` triggers ESLint `react-hooks/set-state-in-effect` - close sidebar via `onClick` on Links instead
- `h-screen` on mobile cuts off content behind browser chrome - use `h-dvh` for dynamic viewport height
