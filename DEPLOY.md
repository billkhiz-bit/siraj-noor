# Siraj Noor — Deploy Runbook

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
approved — the redirect URI is an exact-match allow-list and a mismatch will
break sign-in.

---

## 2. Create the Cloudflare Pages project (one-time)

Two routes — pick whichever is faster for the moment.

### Option A · Create via the Cloudflare dashboard (recommended)

1. Go to `https://dash.cloudflare.com` → Workers & Pages → Create → Pages → Connect to Git.
2. Select `billkhiz-bit/siraj-noor`. If the repo is private, Cloudflare will
   prompt you to install the Cloudflare GitHub App and grant it access.
3. Framework preset: **Next.js (Static HTML Export)**. This populates the
   build command and output directory automatically.
4. Environment variables (set on **both** Production and Preview environments
   — Cloudflare treats them separately):

   | Variable | Value | Notes |
   |---|---|---|
   | `NEXT_PUBLIC_QF_CLIENT_ID` | *(paste after step 4)* | Blocking on hackathon API registration |
   | `NEXT_PUBLIC_QF_AUTH_HOST` | `https://oauth2.quran.foundation` | Production only. Leave unset on Preview to hit the prelive sandbox. |
   | `NEXT_PUBLIC_QF_API_HOST` | `https://apis.quran.foundation` | Same on prod and prelive. |

5. Hit **Save and Deploy**. The first build will fail the OAuth flow because
   the client_id is empty, but the site will still render — that is fine.

### Option B · Create via wrangler from the CLI (faster if you already have wrangler)

```bash
npm install -g wrangler
wrangler login
wrangler pages project create siraj-noor --production-branch=master
```

Then link env vars:

```bash
wrangler pages secret put NEXT_PUBLIC_QF_CLIENT_ID --project-name=siraj-noor
wrangler pages secret put NEXT_PUBLIC_QF_AUTH_HOST --project-name=siraj-noor
```

(`secret put` is fine for `NEXT_PUBLIC_` vars — Cloudflare treats them all as
build-time substitutions.)

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
> Cloudflare Git integration — any TypeScript or lint failure will also break
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
required** because `next.config.ts` has `trailingSlash: true` — without it
Cloudflare will 308-redirect and the form may reject the URL.

If you need to point at the pages before the first Cloudflare deploy, fall
back to GitHub raw views of the page source — but the Pages URLs are the
right long-term answer.

---

## 6. OAuth redirect URIs to register

Register **both** of these in one shot to avoid a second approval cycle:

- `http://localhost:3000/auth/callback/`
- `https://siraj-noor.pages.dev/auth/callback/`

Trailing slashes are mandatory for both — the callback route is a Next.js
page that static-exports to `auth/callback/index.html`.

Post-logout redirect URI:

- `https://siraj-noor.pages.dev/`

---

## 7. Smoke test checklist after each deploy

Run this list after every production deploy. A dropped step here is the most
common way a demo flow breaks silently.

- [ ] `https://siraj-noor.pages.dev/` renders the landing page
- [ ] `https://siraj-noor.pages.dev/privacy/` renders
- [ ] `https://siraj-noor.pages.dev/terms/` renders
- [ ] `https://siraj-noor.pages.dev/dashboard/` renders the Surah Ring
- [ ] `https://siraj-noor.pages.dev/activity/` renders the Activity 3D heatmap
- [ ] Sign in button opens the Quran Foundation OAuth consent screen
- [ ] After consent, the user returns to `/dashboard/` signed in
- [ ] Bookmark a verse → refresh page → bookmark persists (round-trips the User API)
- [ ] Open a surah → return to `/dashboard/` → that surah glows amber in the ring
- [ ] Activity page shows at least one cell in the current date position
- [ ] Check `_headers` cache rules are applied: open devtools, reload a static
      asset like `/_next/static/...`, confirm `Cache-Control: public,
      max-age=31536000, immutable`

---

## 8. When everything is wired up

The three external values you need to have in hand before Day 4 (Apr 16) are:

1. `NEXT_PUBLIC_QF_CLIENT_ID` — from Quran Foundation API registration
2. Cloudflare Pages project created and pointing at `billkhiz-bit/siraj-noor`
3. Redirect URIs approved in the OAuth client config

If any of those three is missing, the live sign-in flow is blocked — that
cascades into every personal feature (bookmarks, streak, activity, reflections).
Front-load fixing them over any UI polish.
