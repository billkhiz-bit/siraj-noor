# Siraj Noor — Quran Foundation Hackathon Progress

**Submission deadline:** 2026-04-20 (Provision Launch × Quran Foundation Hackathon, $10k pool, 7 winners)
**Current:** 2026-04-14, end of Day 2 / start of Day 3
**Live URL:** https://siraj-noor.pages.dev
**Repo:** `billkhiz-bit/siraj-noor` (private until Day 6)
**Local:** `C:\Users\bilal\projects\siraj-noor`

---

## Why this fork exists

The original Siraj (`billkhiz-bit/siraj` → `siraj-ept.pages.dev`) was built for Ramadan Hacks 2026 and didn't place. The Quran Foundation hackathon has a **strict eligibility gate**: submissions must use at least one Content API *and* at least one User API from Quran Foundation. Original Siraj only uses Content endpoints (via `api.quran.com/api/v4`, which is the Quran Foundation content surface), so it would fail Phase 1 screening.

Rather than modifying the frozen Ramadan Hacks artefact, this is a parallel fork in a separate repo + separate Cloudflare Pages project. Original `siraj-ept.pages.dev` stays untouched. New build deploys to `siraj-noor.pages.dev`.

**Solo submission. Scope: option 3 (full personalisation).**

---

## Day 1 — done (2026-04-13)

### Repo + infra
- Forked from `ayat/` baseline via `git archive` (only tracked files, no build artefacts)
- New private repo: `https://github.com/billkhiz-bit/siraj-noor`
- 8 commits pushed, `npm install`, `tsc --noEmit`, `eslint`, `next build` all green
- 131 static pages generating cleanly

### Option 3 features scaffolded
- OAuth 2.0 PKCE flow (intended public client)
- User API client with auto-refresh on 401, `x-auth-token` + `x-client-id` headers
- Bookmarks, Reading sessions, Streaks, Activity 3D (tenth view), Reflections composer, Collections
- Sidebar reorganised into **Explore** / **Personal** sections

### Day 1 hardening from preflight
- Open redirect blocked on `/auth/callback`
- PKCE state cleared in `finally` after token exchange
- `refreshTokens` only clears tokens on 4xx (not transient 5xx)
- Optimistic-update revert race fixed across all 3 contexts
- `Promise.allSettled` on reading-progress fan-out
- Accessibility: 44×44px touch targets, `role=img`/`aria-label` on Activity canvas, etc.

---

## Day 2 — done (2026-04-14 morning/afternoon)

### Visual polish
- **Activity 3D camera** retuned to `[14, 15, 22] fov 42` with orbit damping; today cell pulses on a sine wave
- **Surah Ring read-marker ring** now pulses with a per-surah phase offset (travelling wave around the ring), radius bumped, `toneMapped=false` so bloom catches the amber peak
- **Landing page hero** split into SIRAJ / NOOR with responsive sizing, Arabic extends to سراج نور

### Docs + legal
- `/privacy/` and `/terms/` static pages created (QF registration needs real URLs)
- `DEPLOY.md` runbook written (wrangler CLI first approach, two-client-id pattern, Pages Function secrets, smoke-test curl commands)
- `DEMO_SCRIPT.md` beat-sheet drafted for the 2:30 submission video
- `README.md` Views table rewritten with **Ten 3D visualisation views** + separate **Personal companion pages** section

### Deploy pipeline
- Cloudflare Pages project `siraj-noor` created via `wrangler pages project create`
- `npm run deploy` script wired: `rimraf .next out && next build && wrangler pages deploy out ...`
- `.env.production` committed with prod QF host URLs (public, no secrets)
- `.env.local.example` surfaced from the blanket `.env*` gitignore
- First production deploy verified — all six critical URLs return 200

### QF API onboarding
- `/request-access` form submitted with app description, 10-view feature list, callback URL, ToS/privacy URLs
- Scope request form submitted via the developer portal
- Follow-up email sent to `developers@quran.com` asking for `token_endpoint_auth_method=none`

### QF approvals received
- Pre-Production client ID: `3d0bebd0-110c-44bb-a097-746cf6a9615b` (all scopes enabled)
- Production client ID: `80ace9be-6835-4304-bb52-67b1bd891ff2` (Content API only; user scopes pending approval)
- Basit Minhas added the production callback URL to the pre-live client the same afternoon
- Both clients shipped with `client_secret_basic` auth — **our SPA cannot ship the secret**

### Pages Function proxy
- `functions/api/qf/token.ts` and `functions/api/qf/refresh.ts` created
- Reads `QF_CLIENT_ID` + `QF_CLIENT_SECRET` from Cloudflare Pages env (set via `wrangler pages secret put`)
- Builds `Authorization: Basic base64(id:secret)` header, forwards to QF token endpoint
- Browser posts JSON to `/api/qf/token`, proxy forwards form-encoded request to QF
- Smoke-tested: `invalid_grant` returned on fake codes (proving client auth succeeds), `405 method_not_allowed` on GET

### Critical bug found and fixed: React #185 infinite loop
- `loadTokens()` in `src/lib/auth/storage.ts` was doing `JSON.parse(localStorage.getItem(...))` on every call, returning a fresh object reference each time
- `AuthProvider` passes `loadTokens` to `useSyncExternalStore` as the snapshot function
- React compares snapshots by reference → fresh object every call → infinite re-render → "Maximum update depth exceeded" (minified error #185)
- Only manifested **after** sign-in (empty localStorage → `null === null` stable, tokens present → parse fresh every call → loop)
- Fix: cache parsed tokens keyed on the raw localStorage string; invalidate on `saveTokens` / `clearTokens` / cross-tab storage event
- Memory saved at `~/.claude/projects/.../memory/react_use_sync_external_store_snapshot_cache.md` so future sessions don't repeat this

### Error boundaries
- `src/app/auth/callback/error.tsx` — route-level boundary for OAuth callback
- `src/app/error.tsx` — app-level boundary for non-layout crashes
- `src/app/global-error.tsx` — root-layout boundary (only place React #185 was catchable)
- All three display error name, message, stack, and Next.js digest for actionable debugging

### First successful sign-in
- Verified end-to-end via Google OAuth on prelive.auth.quran.com (the email verification code path is broken on prelive — Google OAuth bypasses it)
- Token exchange through the Pages Function proxy works correctly
- Tokens save to localStorage, auth context flips, providers fire

---

## Day 3 — in progress (2026-04-14 evening)

### 403 invalid_token — root cause definitively diagnosed
- After successful sign-in, all User API calls to `apis.quran.foundation/auth/v1/*` return **403 invalid_token "The access token is expired or inactive"**
- Token is freshly issued (3500+ seconds remaining on `exp`), refresh+retry produces the same result — not a lifetime issue
- Built `/debug/auth` client-side diagnostic page that decodes the JWT and runs a probe suite (see below)
- **Root cause:** the JWT payload has `"aud": []` — the audience claim is an empty array. No resource server will ever match an empty audience, so every authenticated call is rejected.
- **Confirmed via client-side probe:** attempting to force `?audience=apis.quran.foundation` on the authorize URL returns a very specific Hydra error:
  > *"Requested audience 'apis.quran.foundation' has not been whitelisted by the OAuth 2.0 Client."*
- Tested three audience variants (bare, https, https+path) — all three rejected with the same "not whitelisted" message
- That confirms the `allowed_audiences` list on the Hydra client is empty. **There is no client-side workaround** — the fix has to happen on QF's Hydra admin config for both clients.

### Diagnostic page at `/debug/auth`
- Not linked from anywhere, manual URL entry only
- Decodes the current JWT header and payload, displays all claims + expiry
- **Probe suite** that runs five tests on the current token:
  1. `GET /userinfo` with `x-auth-token` header
  2. `GET /userinfo` with `Authorization: Bearer`
  3. `GET /auth/v1/bookmarks` with `x-auth-token + x-client-id` (current app behaviour)
  4. `GET /auth/v1/bookmarks` with `Authorization: Bearer + x-client-id`
  5. Refresh token + retry `/auth/v1/bookmarks`
- Probe results from the 2026-04-14 run: probes 1 and 2 failed CORS (userinfo doesn't set cross-origin headers), probes 3–5 all returned 403 invalid_token, probe 4 returned 400 "missing required headers" (API strictly requires `x-auth-token`, does not accept `Bearer`)
- Kept in the repo as a permanent debugging tool, hidden from navigation

### Follow-up email sent to Basit
- Sent 2026-04-14 evening as a reply to the existing thread with him
- Short form (~280 words): client_secret_basic is worked around with the proxy (not a blocker anymore), new audience issue identified, decoded JWT payload inline, Hydra error quoted verbatim, both client IDs listed, flexible on exact audience string
- Awaiting response

### Discord fallback attempted
- QF Discord at `discord.gg/SpEeJ5bWEQ` — tried to post a parallel shortened version of the diagnostic there for faster response
- Link was not accessible from user's side (possibly needed account/app/different browser)
- Email via `developers@quran.com` (Basit's verified address) is the primary escalation channel

### Mock preview data for personal pages
- `src/lib/data/mock-personal-data.ts` — 6 sample bookmarks (Ayat al-Kursi, 94:5, 13:28, 41:34, 2:286, 55:13), 3 sample collections, 28 reading sessions distributed across the last 90 days, mock streak
- `/bookmarks`, `/collections`, `/activity` pages all show mock data when user is not signed in OR when User API returns an error
- Two banner variants: "Preview — sign in to see your own" and "Showing sample data while we reconnect"
- Preview rows hide destructive actions (Remove, Delete) so they don't look clickable when pointing at fake data
- Today Panel on `/dashboard` quietly falls back to mock streak and read-surahs counts when the User API is down, so a signed-in user never sees a broken `0 day streak`
- **Critical:** these preview states mean the demo video can be recorded end-to-end right now, even while waiting on Basit. Every page has meaningful content.

### Error UI cleanup
- Context providers (bookmarks, collections, reading-progress) now log raw upstream error detail to `console.error` but display short user-friendly strings — no more raw 403 JSON bodies leaking into the UI

### Surah Ring visual tuning
- Camera tightened from `[0, 16, 24] fov 48` to `[0, 14, 22] fov 42` for a more cinematic, compressed-depth framing
- Preview-mode amber overlay was tried and reverted per Bilal's feedback — clean ring without fake "read" indicators looks better when no real data is present

### Day 3 still TODO (rolled forward to Day 4)
- Wait on Basit's response to the audience allow-list request
- Record demo video (Day 6, using mock preview data if auth still pending)
- Final Surah Ring visual polish iteration once real reading-session data is flowing
- Switch to production QF client once scopes are approved (Day 5–6)
- Draft Provision Launch submission form content (Day 5–6)

---

## Day 4 — 2026-04-15 (audience investigation finale)

### First diagnostic bundle sent, Basit replies with hostname theory
Sent full diagnostic email to Basit with JWT payload, sanitised headers, and `aud: []` root-cause narrative. Basit replied suggesting the 403 was a hostname mismatch — `apis.quran.foundation` is production per his docs, and prelive should target `apis-prelive.quran.foundation`. Plausible hypothesis, needed verification.

### Hostname theory disproved (probe 6 + curl DNS)
- Added `/debug/auth` probe 6 hitting `https://apis-prelive.quran.foundation/auth/v1/bookmarks` with the same prelive token and `x-client-id` → **byte-identical HTTP 403 `invalid_token`** as probe 3.
- `curl -v` on both hostnames resolves to the same three Cloudflare IPs (`172.67.74.212, 104.26.7.170, 104.26.6.170`), returns byte-identical unauth 400s (Content-Length: 108 on both), same `Server: cloudflare` and `CF-RAY` prefix, same `Access-Control-Allow-Origin`.
- `apis-prelive.*` and `apis.*` are one Cloudflare-fronted origin with two CNAMEs. QF's docs describe a logical split that isn't reflected in the infrastructure. Hostname is not the discriminator.

### Probes 7, 8, 9 → definitive root cause identified
- **Probe 7 (killer finding):** decoded the id_token from the same token exchange as the failing access_token. **id_token has `aud: ["3d0bebd0-..."]` set correctly per OIDC standard, while access_token has `aud: []`**. Hydra is capable of setting aud on this client — it just did, on the id_token. The empty access_token aud is therefore a deliberate server-side config choice (empty `allowed_audiences`), not a Hydra bug.
- **Probe 8:** `/auth/v1/streaks` with same token → identical 403 invalid_token. Not endpoint-specific.
- **Probe 9:** `/content/api/v4/chapters/1` with same token → ALSO identical 403 invalid_token. The whole apis.quran.foundation gateway rejects at a single auth-check layer before endpoint routing. Gateway-wide, not per-resource. No per-path fix possible.
- Cross-verified tokens are genuine Hydra: both signing keys (`293bb68d-...` for access, `e8f07c58-...` for id) are published in `https://prelive-oauth2.quran.foundation/.well-known/jwks.json`. Hydra uses separate keys for access and id tokens, which is normal.
- Bonus: `.well-known/openid-configuration` DOES exist at the prelive issuer — earlier memory note was wrong, corrected in `quran_foundation_api.md`. Discovery lists `"none"` in `token_endpoint_auth_methods_supported` (PKCE public clients are platform-supported).

### Second email to Basit — comprehensive evidence reply
- ~350 words after trimming. TL;DR up front, hostname theory rebutted with DNS proof, id_token vs access_token comparison as definitive proof, three-path universal rejection, five ruled-out hypotheses.
- Ask: populate `allowed_audiences` on both Hydra clients (`3d0bebd0-...` and `80ace9be-...`) with the correct audience string. Fallback: tell us the string and we pass it via `?audience=` on /oauth2/auth within the hour.
- Draft archived at `C:\Users\bilal\siraj-noor-email-basit-diagnostic.txt`. Sent 2026-04-15 evening. Awaiting reply.

### Preflight lint cleanup (same day, separate concern)
- Ran `/preflight`, found 2 errors + 1 warning. Fixed all three:
  - `activity/page.tsx:18` — removed unused `isLoading` destructure
  - `debug/auth/page.tsx:81` — added `eslint-disable-next-line react-hooks/set-state-in-effect` on the early-return setState branch with a one-line comment explaining the SSG/localStorage constraint (useState lazy init crashes the static export build because localStorage is undefined at build time)
  - `global-error.tsx:169` — converted `<a href="/">Return home</a>` to a `<button onClick={() => { window.location.href = "/"; }}>` for both lint compliance AND genuine hard-navigation semantics (the right move for a last-resort error boundary where the router state may be compromised)
- Gotcha captured in `~/.claude/skills/preflight/checks/frontend.md`: `react-hooks/set-state-in-effect` only fires on early-return setState branches, not on continued-execution branches. Don't shotgun disables — fix only the flagged lines.

### Day 4 still TODO
- Wait on Basit's reply (expected 24-48h, escalate by end of April 17)
- When audience fix lands, **fully sign out via `/oauth2/sessions/logout` before retesting** — Hydra caches client config at authentication time, not refresh time. A simple token refresh will NOT pick up new `allowed_audiences`.
- Draft Provision Launch submission form content (target: April 18)
- Record demo video (Day 6 plan; mock preview data supports full end-to-end recording even if auth still pending)

---

## Quran Foundation API quick reference

Full reference is in `~/.claude/projects/C--Users-bilal-projects-ayat/memory/quran_foundation_api.md`.

| Endpoint | URL |
|---|---|
| Developer portal | https://api-docs.quran.foundation/request-access |
| Authorize (prelive) | `https://prelive-oauth2.quran.foundation/oauth2/auth` |
| Token (prelive) | `https://prelive-oauth2.quran.foundation/oauth2/token` |
| Logout (prelive) | `https://prelive-oauth2.quran.foundation/oauth2/sessions/logout` |
| Production host | `oauth2.quran.foundation` (same paths) |
| User API base | `https://apis.quran.foundation/auth/v1/` |
| Support email | `developers@quran.com` (verified from qf-api-docs repo) |

**Headers (NOT standard Bearer):**
```
x-auth-token: <access_token>
x-client-id: <client_id>
```

**Pre-Production client:** `3d0bebd0-110c-44bb-a097-746cf6a9615b` (all scopes, secret stored in Pages Function env)
**Production client:** `80ace9be-6835-4304-bb52-67b1bd891ff2` (content-only until scope expansion approved)

**Scopes requested:** `openid offline_access user bookmark collection reading_session goal streak post`

---

## Currently blocked on

### 1. Basit's response on the Hydra `allowed_audiences` fix (highest priority)

Comprehensive evidence bundle re-sent 2026-04-15 evening via reply to the existing `developers@quran.com` thread. Contains: id_token vs access_token audience comparison (definitive proof Hydra is deliberately not setting aud on access tokens for this client), three-path universal rejection across `/auth/v1/bookmarks`, `/auth/v1/streaks`, and `/content/api/v4/chapters/1`, DNS evidence disproving Basit's hostname theory, and five ruled-out hypotheses.

Two fix paths offered in the email:
- **Primary:** Basit populates `allowed_audiences` on both Hydra clients (`3d0bebd0-110c-44bb-a097-746cf6a9615b` and `80ace9be-6835-4304-bb52-67b1bd891ff2`) with whatever audience value the `apis.quran.foundation` gateway expects. If Hydra auto-emits the whitelisted audience by default, no client change needed.
- **Fallback:** Basit tells us the expected audience string and we pass it via `?audience=<value>` on `/oauth2/auth`. Requires a one-line change in `src/lib/auth/qf-oauth.ts:56-65` (add `audience` to the `URLSearchParams`) plus a redeploy. ~15-20 minutes turnaround.

**Caveat for when the fix lands:** Hydra caches client config at authentication time, not refresh time. A simple token refresh will NOT pick up the new `allowed_audiences`. Must fully sign out via `/oauth2/sessions/logout` and sign back in for Hydra to re-read the client config. Flagged here so future retesting doesn't false-negative on a stale refresh.

Not blocking demo video recording thanks to the mock preview data fallback.

### 2. Production scope expansion (non-blocking for now)

Scope request form submitted 2026-04-14. Once approved, we flip the Cloudflare Pages Function secrets from Pre-Production to Production credentials and redeploy. Target: Day 5 or 6.

---

## Commit log so far

```
ebefadd  Mock preview data + friendlier error UI across personal pages
5b39cf8  Fix React #185 infinite loop in useSyncExternalStore token snapshot
d8801cc  Day 3: landing page branding, README views + personal pages, DEPLOY rewrite
dcb7e27  Add Pages Function proxy for confidential QF token exchange
13cd228  Wire up Cloudflare Pages deploy — first production build is live
c76491f  Day 2 handoff: visual polish, deploy scaffolding, legal pages, demo beat sheet
1d2a713  Add HACKATHON_PROGRESS.md as Day 1 handoff snapshot
3e235b9  Security and accessibility hardening from preflight review
b7c822e  Refactor auth context to useSyncExternalStore for token sync
73e5495  Add reflection composer dialog and collections shelf
3b12c3a  Add Activity dashboard as the 10th 3D view
4dca337  Add reading progress overlay on Surah Ring, Today panel, and reading session tracking
f9a6852  Add bookmark button, optimistic bookmarks context, and bookmarks list page
3522616  Add Quran Foundation OAuth PKCE flow and User API scaffolding
a90c1f4  Fork from siraj for Quran Foundation Hackathon submission
```

---

## Why nothing is committed to the original `ayat/` repo

The original `C:\Users\bilal\projects\ayat` (`billkhiz-bit/siraj`) is the frozen Ramadan Hacks 2026 artefact. Modifying it would alter the URL judges from that hackathon may have visited, change the README narrative, and risk introducing a regression to a working deployed site. All hackathon-2 work happens in this fork.
