# Siraj Noor - Deploy Runbook

End-to-end checklist for shipping the Quran Foundation Hackathon submission.
Every step is phrased so that someone cold-picking up the project can execute
without extra context.

---

## 1. Decide on the Cloudflare Pages project name

- **Project name:** `siraj-noor`
- **Live URL:** `https://siraj-noor.pages.dev`
- **Branch:** `master`
- **Build command:** `npx next build`
- **Build output directory:** `out`

The name matters because it becomes part of the OAuth redirect URI we register
with Quran Foundation. **Do not rename the project** once the API client is
approved - the redirect URI is an exact-match allow-list and a mismatch will
break sign-in.

---

## 2. Create the Cloudflare Pages project (one-time)

We use the **wrangler CLI** for everything. The Cloudflare dashboard was
reorganised recently and the "Workers & Pages" section moved - the CLI is
deterministic and doesn't depend on where a button lives this week.

```bash
# Wrangler is cached via npx on first use; no global install needed
npx wrangler login
npx wrangler pages project create siraj-noor --production-branch=master
```

`wrangler login` opens a browser OAuth flow - click Allow, then the CLI is
authenticated for the rest of the session. The project creation command is
idempotent - running it a second time fails cleanly with "project already
exists", which is fine.

### Environment variables - build-time vs runtime

The app has **two separate environment layers** because token exchange runs
on a Cloudflare Pages Function, not in the browser:

**Build-time (baked into the JS bundle by `next build`)**

Set in `.env.production` (committed, no secrets) and `.env.local` (gitignored,
may contain the pre-live client_id for dev). These are what the browser sees:

| Variable | Purpose | Committed value |
|---|---|---|
| `NEXT_PUBLIC_QF_CLIENT_ID` | Used to build the authorize URL query string | *(set locally per-dev, not committed)* |
| `NEXT_PUBLIC_QF_AUTH_HOST` | OAuth host for authorize redirect | `https://oauth2.quran.foundation` (prod) / `https://prelive-oauth2.quran.foundation` (local dev) |
| `NEXT_PUBLIC_QF_API_HOST` | User API host for `x-auth-token` requests | `https://apis.quran.foundation` |
| `NEXT_PUBLIC_QF_USE_DIRECT_TOKEN` | *(optional)* set to `"true"` to bypass the proxy and talk to QF directly - only works if the client is registered with `token_endpoint_auth_method=none` | *(unset)* |

**Runtime secrets (Cloudflare Pages Function env - never in the bundle)**

Set via `wrangler pages secret put` on the deployed project. These are read
by `functions/api/qf/token.ts` and `functions/api/qf/refresh.ts` when
exchanging codes and refreshing tokens server-side:

| Secret | Purpose |
|---|---|
| `QF_CLIENT_ID` | Used for the Basic auth header on the token endpoint |
| `QF_CLIENT_SECRET` | The confidential client secret (never leaves the edge) |
| `QF_TOKEN_ENDPOINT` | Full URL of the QF token endpoint (prelive or prod) |

Commands to set the three secrets (pipe values from stdin so they don't land
in shell history):

```bash
printf "<client_id>"     | npx wrangler pages secret put QF_CLIENT_ID --project-name=siraj-noor
printf "<client_secret>" | npx wrangler pages secret put QF_CLIENT_SECRET --project-name=siraj-noor
printf "<token_url>"     | npx wrangler pages secret put QF_TOKEN_ENDPOINT --project-name=siraj-noor
```

**Important:** secrets set via `wrangler pages secret put` apply to **future
deployments only**. After setting them you must run `npm run deploy` again
so the next build picks up the env bindings. A probe against `/api/qf/token`
will return `proxy_misconfigured` until this second deploy completes.

---

## 3. Deploy from the local machine

Once the Pages project exists, the `npm run deploy` script in `package.json`
handles the full pipeline: clean, build, push to Cloudflare.

```bash
npm run deploy
```

This is equivalent to:

```bash
npx rimraf .next out
npx next build
npx wrangler pages deploy out --project-name siraj-noor --branch master --commit-dirty=true
```

(The scripts use `rimraf` rather than `rm -rf` so the build step works identically from PowerShell, cmd, and Git Bash on Windows.)

The deploy command emits a unique preview URL **and** promotes to production
because we are deploying the `master` branch directly. For a preview-only run,
swap `--branch master` for `--branch preview`.

> **Important**: The build *must* succeed locally before pushing to the
> Cloudflare Git integration - any TypeScript or lint failure will also break
> the Cloudflare build, wasting ~2 minutes per attempt. Always run
> `npm run build` locally first.

---

## 4. Repo visibility for submission

Provision Launch requires the submission repo to be accessible to judges.
Two ways to satisfy this:

### Preferred: flip the repo public right before submitting

```bash
gh repo edit billkhiz-bit/siraj-noor --visibility public --accept-visibility-change-consequences
```

Flip it public on **Day 6 (Apr 19)** once the video is recorded and the demo
is stable. Leaving it private until then keeps scope ambiguity out of public
GitHub trending feeds and stops anyone from cloning a half-finished fork.

### Fallback: add Provision Launch as a collaborator

If there is a reason to keep the repo private long-term (e.g. you want to
iterate on the fork post-hackathon without public scrutiny):

```bash
gh api repos/billkhiz-bit/siraj-noor/collaborators/provision-launch \
  -X PUT -f permission=pull
```

Confirm Provision Launch&apos;s correct GitHub handle in their submission guide
before running this.

---

## 5. Legal URLs for the Quran Foundation API client registration

The registration form at
`https://api-docs.quran.foundation/request-access` asks for:

- **Privacy Policy URL:** `https://siraj-noor.pages.dev/privacy/`
- **Terms of Service URL:** `https://siraj-noor.pages.dev/terms/`

These pages live at `src/app/privacy/page.tsx` and `src/app/terms/page.tsx`
and static-export with the rest of the site. **The trailing slash is
required** because `next.config.ts` has `trailingSlash: true` - without it
Cloudflare will 308-redirect and the form may reject the URL.

If you need to point at the pages before the first Cloudflare deploy, fall
back to GitHub raw views of the page source - but the Pages URLs are the
right long-term answer.

---

## 6. OAuth redirect URIs to register

QF's registration form accepts **one redirect URI per submission** (we
learned this the hard way - the initial field table assumed two). Register
the production URL first:

- `https://siraj-noor.pages.dev/auth/callback/`

The trailing slash is mandatory - the callback route is a Next.js page that
static-exports to `auth/callback/index.html`.

To add `http://localhost:3000/auth/callback/` for local dev, **reply to the
QF approval email after it arrives** and ask support (Basit Minhas processed
our submission, `developers@quran.com` is the canonical contact). Local dev
isn't blocked in the meantime because you can iterate by redeploying to
preview branches or by running `npx wrangler pages dev` locally (which reads
`.dev.vars` for the function secrets).

Post-logout redirect URI:

- `https://siraj-noor.pages.dev/`

---

## 7. Smoke test checklist after each deploy

Run this list after every production deploy. A dropped step here is the most
common way a demo flow breaks silently.

**Pages routing (HTTP status checks, no JS required)**

```bash
for url in "https://siraj-noor.pages.dev/" \
           "https://siraj-noor.pages.dev/privacy/" \
           "https://siraj-noor.pages.dev/terms/" \
           "https://siraj-noor.pages.dev/dashboard/" \
           "https://siraj-noor.pages.dev/activity/" \
           "https://siraj-noor.pages.dev/auth/callback/"; do
  printf "%-55s " "$url"
  curl -s -o /dev/null -w "%{http_code}\n" "$url"
done
```

All six should return `200`.

**Proxy function checks**

```bash
# Token proxy: expect 400 invalid_grant on fake code (proves Basic auth succeeds)
curl -s -o /dev/null -w "token: %{http_code}\n" -X POST \
  "https://siraj-noor.pages.dev/api/qf/token" \
  -H "Content-Type: application/json" \
  -d '{"code":"probe","code_verifier":"dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk","redirect_uri":"https://siraj-noor.pages.dev/auth/callback/"}'

# Refresh proxy: same expectation
curl -s -o /dev/null -w "refresh: %{http_code}\n" -X POST \
  "https://siraj-noor.pages.dev/api/qf/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"probe"}'

# Non-POST blocked
curl -s -o /dev/null -w "method-guard: %{http_code}\n" \
  "https://siraj-noor.pages.dev/api/qf/token"
```

Expected:
- `token: 400` - fake code rejected by QF as `invalid_grant` (client auth worked)
- `refresh: 400` - same
- `method-guard: 405` - our `onRequest` guard returns `method_not_allowed`

If any proxy check returns `500 proxy_misconfigured`, the secrets aren't set
on the active deployment. Run `npm run deploy` again.

**Interactive flow (browser required)**

- [ ] Sign in button opens the Quran Foundation OAuth consent screen
- [ ] After consent, the user returns to `/dashboard/` signed in
- [ ] Bookmark a verse → refresh page → bookmark persists (round-trips the User API)
- [ ] Open a surah → return to `/dashboard/` → that surah glows amber in the ring
- [ ] Activity page shows at least one cell in the current date position
- [ ] Check `_headers` cache rules are applied: open devtools, reload a static
      asset like `/_next/static/...`, confirm `Cache-Control: public,
      max-age=31536000, immutable`

---

## 8. QF issues two client IDs, not one

QF's approval email ships **both a Pre-Production (sandbox) and a Production
(live)** client at registration time. The two behave differently:

| Environment | Client ID | Endpoint | Scopes | Use case |
|---|---|---|---|---|
| **Pre-Production** | `3d0bebd0-110c-44bb-a097-746cf6a9615b` | `https://prelive-oauth2.quran.foundation` | All User API scopes enabled by default | All development and testing |
| **Production** | `80ace9be-6835-4304-bb52-67b1bd891ff2` | `https://oauth2.quran.foundation` | Content API only by default - User API scopes require separate approval via the "Request Additional Scopes" form | Final submission deploy, once scopes are granted |

Both clients are registered with `token_endpoint_auth_method=client_secret_basic`,
so **both must be used through the Pages Function proxy**. The public PKCE
flow (no secret) is rejected on the token endpoint for both.

**Current state (as of Day 2):**

- ✅ Pre-Production client active, all scopes, Pages Function proxy wired up
- ⏳ Production user scopes pending QF approval (form submitted 2026-04-14)
- ⏳ Token endpoint auth method change to `none` requested via email to Basit - not blocking because the proxy works regardless

## 9. What to do before each phase of the hackathon

**Day 2-5 (development):** Use the Pre-Production client. Proxy secrets on
Cloudflare Pages are the pre-live values. `NEXT_PUBLIC_QF_AUTH_HOST` in
`.env.local` targets `prelive-oauth2.quran.foundation`. Iterate freely.

**Day 6 (demo video recording):** Keep Pre-Production. The demo doesn't care
whether it runs against prelive or prod - judges see the same sign-in UX.

**Day 7 (final submission):** If QF has approved Production scopes by this
point, rotate the Pages Function secrets to the Production client_id and
secret, update `NEXT_PUBLIC_QF_AUTH_HOST` to `https://oauth2.quran.foundation`
in `.env.production`, and run `npm run deploy`. If Production scopes are
still pending, submit with Pre-Production and note the status in the
submission description.
