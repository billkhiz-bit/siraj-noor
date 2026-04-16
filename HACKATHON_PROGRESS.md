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

### Day 4 evening: Basit's reply disproves our `allowed_audiences` theory — deeper audit required

Basit replied saying his team reproduced our prelive client and confirmed Hydra IS issuing access tokens with `aud: []` for this client — BUT on his side, with that same empty-audience token, `apis-prelive.quran.foundation` accepts the request and reaches backend validation. So an empty audience by itself does not explain the 403. He asked for a minimal repro: the exact authorize URL, exact `/oauth2/token` request, exact code that selects and sends the x-auth-token header, and the result of calling `https://apis-prelive.quran.foundation/auth/v1/bookmarks?mushafId=4&first=1` with the same token.

This collapsed our previous working theory (Hydra client `allowed_audiences` is empty, Basit needs to populate it). If Basit's aud:[] reproduction works while ours fails, the difference has to be something else on our side or something client-specific in Hydra's config for `3d0bebd0-...`.

### Probe 10: Basit's exact URL with query params (still 403)
- Added `/debug/auth` probe 10 hitting `https://apis-prelive.quran.foundation/auth/v1/bookmarks?mushafId=4&first=1` with the same token and `x-client-id`.
- Result: **byte-identical HTTP 403 `invalid_token`** as probe 3. Query params are not the discriminator.

### Probe 11: Origin header hypothesis tested and disproved (server-side fetch)
- Hypothesis: maybe QF's API gateway rejects requests with browser `Origin: https://siraj-noor.pages.dev` header. Basit tested server-side (curl, no Origin), we test browser-side.
- Created `functions/api/qf/test-proxy.ts` — a Cloudflare Pages Function that forwards Basit's exact URL to QF server-side on Cloudflare Workers (no browser Origin, different egress IP than curl).
- Added probe 11 calling the proxy. Result: **byte-identical HTTP 403 `invalid_token`**. Origin header is not the discriminator either.

### Full audit of our side (static, config, dynamic, docs)
Before escalating back to Basit with weaker evidence, ran a systematic audit to be sure we had exhausted everything on our side.

**Static code audit (files read and reviewed):**
- `src/lib/auth/pkce.ts` — RFC 7636 compliant: 32-byte random verifier, SHA-256 base64url challenge. No issues.
- `src/app/auth/callback/page.tsx` — standard OAuth2 callback, state/nonce validation, open-redirect prevention. **No user-provisioning step** (QF docs confirm none exists or is needed).
- `functions/api/qf/refresh.ts` — mirrors `token.ts` with `client_secret_basic`, works reliably.
- `src/lib/auth/storage.ts` — snapshot cache for React compatibility (the React #185 fix), no token corruption.
- `src/lib/qf-user-api.ts` — `authHeaders()` pattern matches the QF quickstart byte-for-byte. **One latent bug noted for follow-up**: `listBookmarks` calls `qfFetch("/bookmarks")` with zero query params, but the QF docs mark `mushafId` as required for the GET endpoint. Not what's causing the current 403 (probe 10 with `mushafId=4` still fails), but needs fixing once auth is unblocked.

**Configuration audit:**
- `.env.local` has prelive values, `.env.production` has prod values. Next.js resolves `.env.local` overriding `.env.production` at build time (build runs locally before `wrangler pages deploy`), so the deployed bundle uses `.env.local`.
- **Verified by grepping the deployed JS chunks** on `siraj-noor.pages.dev`: chunk `0zao82ol9esjj.js` has `apis.quran.foundation` and `prelive-oauth2.quran.foundation` baked in. No env-var surprises. Cloudflare Pages secrets (`QF_CLIENT_ID`, `QF_CLIENT_SECRET`) are set correctly, proven by the fact that token exchange and refresh both work reliably.

**Documentation audit via `api-docs.quran.foundation`:**
- Quickstart example (`/docs/tutorials/oidc/user-apis-quickstart`) uses exactly our header pattern (`x-auth-token` + `x-client-id`), no query params shown, no user-provisioning step.
- Bookmarks GET reference (`/docs/user_related_apis_versioned/auth-get-v-1-bookmarks`) confirms `mushafId` is marked `required`.
- No user-provisioning or onboarding endpoint documented anywhere.
- Fetched `/.well-known/openid-configuration` directly (the stored memory incorrectly said it wasn't documented — corrected in `quran_foundation_api.md`). Advertises `"none"` in `token_endpoint_auth_methods_supported` (public PKCE clients supported by platform).

**Dynamic audit via two new Pages Functions:**
- `functions/api/qf/test-userinfo.ts` — server-side probe of `/oauth2/userinfo`, tests BOTH `Authorization: Bearer <token>` AND `x-auth-token + x-client-id` header formats in parallel and returns both results.
- `functions/api/qf/test-introspect.ts` — server-side probe of `/oauth2/introspect` with our client credentials from the proxy env (client_secret_basic auth).
- Added probes 12 and 13 on `/debug/auth` calling these two functions.

### Probe 12: Hydra's own `/userinfo` rejects the token — THE KILLER FINDING
Result from a fresh run:

    bearer:
      status: 401
      body: {"error":"request_unauthorized",
             "error_description":"The request could not be authorized.
                                  Check that you provided valid credentials
                                  in the right format."}
    x_auth_token_with_client_id:
      status: 401
      body: (same as above, byte-identical)

**Hydra's own authentication server is refusing to validate an access_token that Hydra itself just issued, at the standard OIDC `/userinfo` endpoint, in BOTH standard-OIDC and QF-custom header formats.** Signature verifies against published JWKS (kid `293bb68d-...` matches), iss matches, exp is fresh (3000+ seconds remaining at probe time), scp includes `openid`, sub is correct. The only anomaly is `aud: []` — but Basit already said aud:[] works on his side with his test client.

This means the problem is deeper than `allowed_audiences`. Something on the admin-side config for client `3d0bebd0-...` makes Hydra's issuance path and Hydra's validation path fundamentally inconsistent. No client-side code change can resolve this — Hydra refuses to validate its own tokens.

### Probe 13: `/oauth2/introspect` blocked by nginx at QF edge
Result: plain HTML `<html><head><title>403 Forbidden</title></head><body>...nginx...</body></html>` rather than Hydra's JSON error format. Token endpoint and refresh endpoint on the same hostname both work fine from the same Cloudflare Worker with the same credentials. Only `/oauth2/introspect` is blocked. Classic nginx `location` rule disabling the endpoint — standard OAuth deployment practice to prevent clients from probing token state via introspection. Cannot get Hydra's ground-truth opinion on the token via this route.

### Third email to Basit — ~450 words, post-audit evidence bundle

Sent 2026-04-15 late evening. Contains:
1. **Minimal repro** Basit explicitly asked for: authorize URL with all params, the two-hop `/oauth2/token` exchange via our Pages Function proxy, the full `authHeaders()` function from `qf-user-api.ts` (both token selection AND header sending), and the exact URL pattern our user API calls use.
2. **Result of Basit's suggested URL**: tested two ways (browser + server-side proxy), both return byte-identical 403 invalid_token. Rules out browser Origin, query params, User-Agent, client-side code path.
3. **The killer finding**: Hydra's own `/userinfo` rejects the token in both header formats with identical 401 `request_unauthorized`. Plus a note that `/oauth2/introspect` is nginx-blocked at QF's edge so we couldn't get direct Hydra ground truth.
4. **Interpretation**: issuance succeeds, validation fails at every downstream Hydra endpoint (`/userinfo`, `/auth/v1/*`, `/content/api/v4/*`). This is a Hydra client configuration issue, not a user-record issue.
5. **Ask**: pull up the full Hydra admin config for client `3d0bebd0-...` (and prod `80ace9be-...`) and compare against whatever test client Basit used to reproduce. Specifically: `allowed_audiences`, `grant_types`, `response_types`, `token_endpoint_auth_method`, client-level scope list, custom metadata/flags.

Em dashes stripped from the final version per writing-style preference. Draft archived at `C:\Users\bilal\siraj-noor-email-basit-diagnostic.txt`.

### Day 4 still TODO
- Wait on Basit's reply to the third email (expected 24-48h, escalate by end of April 17 — submission is April 20).
- When the Hydra config fix lands, **fully sign out via `/oauth2/sessions/logout` before retesting**. Hydra caches client config at authentication time, not refresh time. A simple token refresh will NOT pick up new config.
- **Follow-up fix needed in `src/lib/qf-user-api.ts`**: add `mushafId` query param to `listBookmarks` (QF docs mark it `required` for the GET endpoint; our code omits it). Not the cause of the current 403, but needs fixing once auth is unblocked so production API calls don't silently fail on the first real user.
- Draft Provision Launch submission form content (target: April 18).
- Record demo video (Day 6 plan; mock preview data supports full end-to-end recording even if auth still pending).

### Diagnostic infrastructure summary (hidden, for investigation only)

The `/debug/auth` page now has **13 probes** plus three Pages Function helpers. All are hidden from the sidebar and will be removed once the investigation is resolved:

- Probes 1-5: original diagnostic battery (userinfo browser, /auth/v1/bookmarks with various headers, refresh + retry)
- Probes 6-9: hostname test, id_token decode, different user API endpoint, content API
- Probe 10: Basit's exact URL with mushafId query param from browser
- Probe 11: Basit's exact URL via `functions/api/qf/test-proxy.ts` (server-side, no browser Origin)
- Probe 12: Hydra `/userinfo` via `functions/api/qf/test-userinfo.ts` (both Bearer and x-auth-token formats in parallel)
- Probe 13: Hydra `/oauth2/introspect` via `functions/api/qf/test-introspect.ts` (with client_secret_basic from Worker env)

---

## Day 5 — 2026-04-16 (Basit's 4th reply, audit round 2, fourth email staged)

### Basit's 4th reply — ruled out two of our own conclusions

Basit replied to the third evidence bundle. On his side, his team:
- Minted a fresh prelive access token for client `3d0bebd0-110c-44bb-a097-746cf6a9615b` with `aud: []`.
- `GET https://apis-prelive.quran.foundation/auth/v1/bookmarks` → 422 (mushafId required, expected).
- `GET https://apis-prelive.quran.foundation/auth/v1/bookmarks?mushafId=4&first=1` → **200 OK**.

This rules out two narrower theories our third bundle implied:
1. `aud: []` by itself is enough to cause 403 invalid_token. It is not — Basit's token has the same `aud: []` and validates fine.
2. Tokens from client `3d0bebd0-…` are being universally rejected by downstream prelive API validation. They are not — his reproduction proves the gateway does accept tokens from this client.

Basit asked for a minimal repro: authorize URL, `/oauth2/token` exchange, token storage/refresh, header construction, and the exact bookmarks call. The difference between his successful reproduction and our failure on the same client ID must be either in how the token is minted (grant type, consent flow, admin issuance) or in a request detail we haven't surfaced. Browser vs server, hostname, query params, header format, origin, user-agent are all already ruled out by probes 6, 10, 11, 12.

### Audit round 2 — static audit of the integration code

Systematic re-read of every OAuth surface before preparing the reply. Findings:

**No bugs causing the 403.** The PKCE generation, authorize URL construction, token exchange through the Cloudflare Pages Function proxy, `client_secret_basic` Basic auth header, refresh flow, token storage with snapshot cache, callback state validation, and User API header assembly all match QF's quickstart and RFC 6749 / 7636 verbatim.

**Three cleanup items surfaced — none are the 403, all worth fixing before Basit reads our repro so he doesn't chase red herrings:**

1. **Hostname inconsistency.** `.env.local` had `NEXT_PUBLIC_QF_API_HOST=https://apis.quran.foundation` while OAuth pointed at prelive. DNS-equivalent to `apis-prelive.*` (proven by probes 6, 10), but visually inconsistent with Basit's logical split. Flipped to `apis-prelive.quran.foundation`.

2. **`listBookmarks` missing required `mushafId`.** QF docs mark `mushafId` as required on `GET /auth/v1/bookmarks`. Our code called `/bookmarks` with zero params. Probe 10 with `mushafId=4&first=1` still got 403, so not the cause — but a latent second failure waiting once auth unblocks. Added `DEFAULT_MUSHAF_ID = 4` (Hafs) and threaded it as a default parameter on `listBookmarks(mushafId = 4)`.

3. **`Content-Type: application/json` sent on every request, including GETs.** Harmless in practice but looks odd in a minimal repro and can trigger stricter gateways to preflight. Gated on `init.body !== undefined` so GETs go out clean.

Also tightened `authHeaders` return type from `HeadersInit` (broad union) to `Record<string, string>` so the spread in `qfFetch` composes without a cast.

Typecheck and ESLint both clean after changes.

### Deploy — `https://d540c153.siraj-noor.pages.dev` (2026-04-16)

`npm run deploy` succeeded first try. 134 static pages, 1174 files uploaded. Verified by grepping the deployed JS chunks linked from the landing page: only `apis-prelive.quran.foundation` appears in the user request path, no residual `apis.quran.foundation` (the `/debug/auth` page's probe 9 intentionally keeps a hardcoded `apis.quran.foundation/content/api/v4/chapters/1` for the per-path rejection check).

### Fourth email drafted, staged for send

Draft at `C:\Users\bilal\siraj-noor-email-basit-minimal-repro.txt`. Structure:

1. TL;DR up front: same 403 reproduces from both browser and server-side Worker.
2. **Section 1** — authorize URL with every param explicitly listed (PKCE S256, scopes, state, nonce, redirect_uri with trailing slash).
3. **Section 2** — exact POST the Pages Function proxy makes to `/oauth2/token`: Basic auth, form body, grant_type, code, code_verifier, redirect_uri.
4. **Section 3** — the full `authHeaders` function from `src/lib/qf-user-api.ts` showing token selection (localStorage → refresh-if-stale → throw-if-null) and header construction (`x-auth-token` + `x-client-id`, nothing else).
5. **Section 4** — the exact `GET` against `/auth/v1/bookmarks?mushafId=4`, the 403 response body, and a re-statement that probe 10 (browser, his exact URL) and probe 11 (server-side Worker, his exact URL) both return byte-identical 403 with the same token. Plus probe 12 showing Hydra's own `/userinfo` rejects in both Bearer and x-auth-token formats.
6. **Token claims block** with placeholders (sub, iat, exp, kid) to be filled from a fresh `/debug/auth` run post-deploy.
7. **Clarifying question — the sharpest ask in the whole thread:** was his reproduction via `authorization_code` + PKCE through a real Hydra consent flow (matching ours), or `client_credentials` / admin-minted? And if safe: sub, scp, iat/exp of his validated token so we can diff claim-for-claim. This is the only unexamined variable left after 13 probes.

### Pending manual steps (on next session)

1. Open `https://siraj-noor.pages.dev/` in a fresh incognito window.
2. Sign in through the full Hydra consent flow (crucial — Hydra caches client config at authentication time, not refresh).
3. Navigate to `/debug/auth`, click **Run probes**.
4. Copy sanitised JWT payload claims (sub, scp, iat, exp, kid) from the token panel into the four placeholders in the draft.
5. Verify probes 3, 10, 11 still return 403 (expected — fixes are cleanup, not a fix for the actual bug). If any flip to 200, that's a major finding and we re-assess before sending.
6. Send the draft as a reply on the `developers@quran.com` thread.

---

## Day 5 — afternoon (2026-04-16): root cause found, app end-to-end green

The email to Basit was drafted but never sent. Running the probes one last time before sending revealed that the Day 4 "killer finding" (probe 12's 401 on Hydra `/userinfo`) was a closure-capture artefact in the debug page itself, not a Hydra misconfiguration.

### What actually happened

The debug page loaded `tokens` once at the top of `runProbes`. Probe 5 called `refreshTokens()` which rotated the access token — Hydra's default `refresh_token` grant revokes the previous access token atomically. Probes 6 onward kept reading from the closure-captured `tokens.accessToken`, which pointed at the **revoked** token. Every 403 and 401 from probe 5 onward was Hydra correctly rejecting a token it had just invalidated.

Rewrote `/debug/auth/page.tsx` with Section A (all probes against the original, untouched token) then Section B (trigger refresh, then retry with both new and old tokens). Section A returned 200 on `/auth/v1/bookmarks?mushafId=4&first=1` — Basit's exact URL. Section B3 (the old token after refresh) returned the 403 we'd been chasing, confirming revocation-on-refresh.

### The production bug was compound

Once auth was cleared, three separate defects still blocked the real app:

1. **Concurrent refresh storm** — sibling providers (`BookmarksProvider`, `CollectionsProvider`, `ReadingProgressProvider`) fire reload() simultaneously on `isAuthenticated` flip. Any that trip `isExpiredSoon` each trigger an independent `refreshTokens()`. Every parallel refresh revokes the prior access token, leaving every in-flight request holding a revoked one. Fixed by adding a single-flight gate with a 5-second result cache to `refreshTokens()` in `qf-oauth.ts`.

2. **Retry-on-401 never fires** — QF's gateway wraps revoked-token errors as **403** `{"type":"invalid_token"}` not the RFC 6750 401. `qfFetch` only retried on 401. Fixed by broadening the retry condition to pattern-match `invalid_token` in 403 response bodies.

3. **API contract mismatches** surfaced once the auth plumbing was healthy:
   - `first` pagination param bounded to **1–20** by the OpenAPI spec — we'd picked 25. All list endpoints 422'd until reduced to 20.
   - `/reading_sessions` snake_case path doesn't exist; QF uses **kebab-case** for multi-word resources (`/reading-sessions`). 403 `invalid_token` there was a catch-all response for unknown path rather than an actual auth error.
   - Response shapes: QF returns `{success, data: T[], pagination}` on list endpoints and `{success, data: T}` on singletons — our code cast directly to the inner field. Built an adapter layer in `qf-user-api.ts` that unwraps the envelope and maps QF's camelCase shape (`createdAt`, `verseNumber`, `chapterNumber`, etc.) into the app's pre-existing snake_case shape. UI and providers stay untouched.
   - POST bodies: `createBookmark` was sending `{verse_key, note}` — QF requires `{key, verseNumber, mushaf, type:"ayah"}` with `additionalProperties:false`. `createCollection` was sending `{name, description}` — QF only accepts `{name}`. `createReadingSession` was sending `{chapter_id, verse_key}` — QF requires `{chapterNumber, verseNumber}`. All fixed in the adapter.
   - `getStreak` was calling `/streaks` (paginated history). The actual scalar endpoint is `/streaks/current-streak-days?type=QURAN` which returns `{success, data: {days}}`.

### Network verification on main alias (`siraj-noor.pages.dev`)

After the final deploy, a hard refresh on `/bookmarks/` produces exactly four User API calls:

| Endpoint | Status |
|---|---|
| `bookmarks?mushafId=4&first=20` | 200 |
| `collections?first=20` | 200 |
| `streaks?first=20` | 200 |
| `reading-sessions?first=20` | 200 |

No 4xx, no retries fire, no error banner in the UI.

### The OpenAPI spec check

The single highest-leverage action of the week was four lines of bash:

```bash
curl -s https://api-docs.quran.foundation/openAPI/user-related-apis/v1.json \
  -o qf-api.json
node -e "const s=require('./qf-api.json'); console.log(JSON.stringify(s.paths, null, 2))"
```

Four days of email-based debugging vs. 30 seconds of reading the machine-readable spec. Worth banking as a reflex: **when an API returns unexpected 4xx and exposes an OpenAPI URL, read the spec before asking the vendor**. The `/llms.txt` + `/openAPI/*.json` combination is the canonical AI-friendly doc surface on this kind of platform.

### Basit email — not sent

The closure email will briefly acknowledge the root cause was on our side (closure-captured token in the probe page, pagination range, path convention) and thank him for his patience. Nothing actionable for QF to do. Will draft and send separately.

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
| User API base (prelive) | `https://apis-prelive.quran.foundation/auth/v1/` |
| User API base (production) | `https://apis.quran.foundation/auth/v1/` |
| Support email | `developers@quran.com` (verified from qf-api-docs repo) |

*Note: `apis.*` and `apis-prelive.*` CNAME to the same Cloudflare origin and
behave identically (proven by probes 6 and 10 during the 403 investigation),
but QF's docs describe a logical split and Basit's reproduction path expects
prelive tokens to hit `apis-prelive.*`. As of 2026-04-16 our `.env.local`
targets `apis-prelive.*` for the prelive client.*

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

### 1. Basit's response on the grant-type question (highest priority)

Fourth email staged 2026-04-16, pending manual probe verification + claim fill-in before send. Draft at `C:\Users\bilal\siraj-noor-email-basit-minimal-repro.txt`. The narrative across the thread:

1. First diagnosis (2026-04-14 evening): `aud: []` on access_token, ask to populate `allowed_audiences`.
2. Basit replied suggesting hostname mismatch (`apis-prelive` vs `apis`).
3. Second reply (2026-04-15 afternoon): disproved hostname theory with DNS evidence + probes 6/7/8/9, proved id_token has correct aud while access_token doesn't.
4. Basit replied saying his team reproduced our client and confirmed Hydra issues aud:[] tokens, BUT on his side those tokens successfully reach backend validation on apis-prelive. So aud:[] alone isn't the cause. He asked for a minimal repro of the auth flow + API call.
5. Third reply (2026-04-15 evening): minimal repro as requested PLUS the killer finding that Hydra's own `/userinfo` rejects the token in both Bearer and x-auth-token header formats with identical 401 `request_unauthorized`.
6. Basit's 4th reply (2026-04-16 morning): on his side, `/auth/v1/bookmarks?mushafId=4&first=1` returns **200 OK** with a fresh aud:[] token from the same client. Rules out aud:[] alone and rules out universal rejection of this client's tokens. Asked for the minimal repro.
7. Fourth email staged (2026-04-16 afternoon): minimal repro in 5 named sections + the grant-type clarifying question. Preceded by audit round 2 + deploy of three cleanup fixes (hostname alignment, `mushafId` default param, `Content-Type` gating) so the code Basit reads is the cleanest possible version of our integration.

**The sharpest ask this email carries:** was Basit's reproduction via `authorization_code` + PKCE through a real Hydra consent flow (matching ours, with a user `sub`), or `client_credentials` / admin-minted (no user `sub`, or a synthetic one)? If he can share redacted sub, scp, iat, exp of his validated token we can diff claim-for-claim against ours and find the single difference. This is the only unexamined variable left after 13 probes.

**Caveat for when the fix lands:** Hydra caches client config at authentication time, not refresh time. A simple token refresh will NOT pick up the new config. Must fully sign out via `/oauth2/sessions/logout` and sign back in for Hydra to re-read the client.

**What we have exhausted on our side:** every client-side hypothesis has been definitively disproved via the 13 probes on `/debug/auth`. Static code audit clean, configuration audit clean, documentation audit confirms we match the quickstart verbatim, server-side tests rule out browser-only behaviour. There is nothing left to test that does not require QF-side admin access.

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
