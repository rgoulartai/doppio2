# Task 1.4: Vercel Deploy + Custom Domain

## Objective

Deploy the Doppio app to Vercel, configure `doppio.kookyos.com` as the production domain via a Hostgator DNS CNAME record, set Supabase environment variables in the Vercel Dashboard, enable Vercel Analytics, and verify the live production URL loads the app over HTTPS. This task requires two human checkpoints and several human-action steps for DNS and Vercel Dashboard configuration.

## Context

This is the final infrastructure task in Phase 1. After this task completes, `https://doppio.kookyos.com` is the canonical production URL for all remaining phases. Every subsequent deploy command (`vercel --prod`) pushes to this URL. Vercel provides automatic HTTPS, preview deploys per branch, and the free Hobby plan covers all Doppio needs. The DNS configuration is on Hostgator (managed by the user) — the agent handles everything Vercel-side and guides the user through the DNS record creation.

## Dependencies

- Task 1.1 — buildable project with `vite build` working
- Task 1.2 — `vercel.json` must include CSP headers for YouTube/TikTok iframes (added in this task)
- Task 1.3 — `.env.local` with real Supabase credentials (needed to set as Vercel env vars)

## Blocked By

- Task 1.1 (needs a project that builds)

---

## Research Findings

- **D2** (DISCOVERY.md): Production URL is `https://doppio.kookyos.com`. DNS is on Hostgator.
- **D28**: Vercel Hobby plan. Custom domain via DNS CNAME on Hostgator pointing to Vercel's CNAME target.
- **D27**: Vercel Analytics — layer 1 of analytics. Enable via `@vercel/analytics` package. Enable in Dashboard.
- **D53**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set in Vercel Dashboard for Production and Preview environments.
- **vercel-deploy-custom-domain skill**: Complete `vercel.json`, deploy commands, domain setup steps. Follow it precisely.
- **pwa-vite-setup skill**: `navigateFallback` in the SW and the `rewrites` rule in `vercel.json` must both be set for SPA routing to work on Vercel.

---

## Implementation Plan

### HUMAN CHECKPOINT 1: Verify Vercel Account

**STOP HERE. Ask the user:**

> "Task 1.4 deploys Doppio to Vercel. Before we start:
> 1. Do you have a Vercel account? (https://vercel.com — free Hobby plan is sufficient)
> 2. Is this project in a Git repository? If yes, is it pushed to GitHub/GitLab/Bitbucket?
>    (Vercel can deploy from Git for auto-deploys on push, OR from the local directory via CLI)
>
> Please answer both questions so I know which deploy path to use."

Based on the user's answer:
- **If Git repo**: Use Git integration (Vercel links to the repo and auto-deploys on every push to main)
- **If no Git repo**: Use CLI deploy from the local directory (`vercel --prod` from project root)

Both approaches result in the same production URL. Proceed with whichever the user confirms.

### Step 1: Install Vercel CLI

Check if `vercel` is already installed:

```bash
vercel --version
```

If not installed, install globally:

```bash
npm install -g vercel
```

### Step 2: Create `vercel.json`

Create `vercel.json` in the project root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.tiktok.com; script-src 'self' 'unsafe-inline' https://www.youtube.com;"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Why this config is required:
- **`frame-src`**: YouTube (`lite-youtube-embed` embeds) and TikTok iframes require explicit CSP frame-src allowlisting. Without this, browsers block the iframes.
- **`X-Frame-Options: SAMEORIGIN`**: Prevents Doppio itself from being embedded as an iframe (clickjacking protection).
- **`rewrites`**: SPA catch-all — serves `index.html` for all paths. Without this, navigating directly to `/learn` or `/complete` on Vercel returns a 404 because those are not real files. React Router handles routing client-side from `index.html`.

### Step 3: Verify Build Locally Before Deploying

```bash
npm run build
```

Confirm:
- Exit code 0
- `dist/` directory created
- `dist/sw.js` exists (Service Worker from vite-plugin-pwa)
- `dist/index.html` exists

If the build fails, fix all errors before proceeding. Do not deploy a broken build.

### Step 4: Log in to Vercel CLI and Link Project

```bash
vercel login
```

Follow the CLI prompts to authenticate (browser opens for OAuth with GitHub/GitLab/email).

Then link the project:

```bash
cd /Users/renatosgafilho/Projects/KOOKY/Doppio
vercel
```

When prompted by the Vercel CLI:
- **Set up and deploy**: Yes
- **Which scope**: Your personal account (not a team)
- **Link to existing project**: No (create a new project)
- **Project name**: `doppio` (or accept default)
- **In which directory is your code located**: `./` (current directory)
- **Framework preset**: Vite (Vercel should auto-detect from `vite.config.ts`)
- **Build command**: `vite build` (or `tsc && vite build` — either works; Vercel runs `npm run build` by default)
- **Output directory**: `dist`
- **Install command**: `npm install`

This creates a `.vercel/` directory with project metadata. Do NOT commit `.vercel/` to Git (it should already be in `.gitignore` from Task 1.1).

The initial `vercel` command also does a preview deploy. Note the preview URL (something like `https://doppio-xxxx-username.vercel.app`).

### Step 5: Set Environment Variables in Vercel Dashboard

The Supabase credentials must be set in the Vercel project settings. Use Playwright to navigate to the Dashboard:

**Navigate to**: `https://vercel.com/dashboard` → click on the `doppio` project → click **Settings** → click **Environment Variables**

Add the following two variables, checking BOTH `Production` and `Preview` environments for each:

| Name | Value | Environments |
|------|-------|--------------|
| `VITE_SUPABASE_URL` | `<from user's .env.local>` | Production + Preview |
| `VITE_SUPABASE_ANON_KEY` | `<from user's .env.local>` | Production + Preview |

Steps in the Dashboard UI:
1. Click "Add" or "Add New"
2. Enter the variable name
3. Enter the variable value (paste from `.env.local`)
4. Check the checkboxes for "Production" and "Preview" (leave "Development" optional)
5. Click "Save"
6. Repeat for the second variable

After saving both variables, the next deploy will include them in the build.

If Playwright cannot navigate the Dashboard, provide these exact instructions to the user and wait for confirmation:

> "Please set these two environment variables in your Vercel project:
> 1. Go to https://vercel.com/dashboard → your Doppio project → Settings → Environment Variables
> 2. Add VITE_SUPABASE_URL with your Supabase project URL, for Production and Preview
> 3. Add VITE_SUPABASE_ANON_KEY with your Supabase anon key, for Production and Preview
> 4. Click Save after each
> Let me know when done."

### Step 6: Add Custom Domain in Vercel Dashboard

**Navigate to**: Vercel project → Settings → Domains

Click "Add Domain" and enter: `doppio.kookyos.com`

Vercel will display the DNS record to configure. Note the CNAME target — it will be `cname.vercel-dns.com` (confirm the exact value shown in Vercel's UI, as it can vary).

Screenshot or note the exact CNAME target value that Vercel shows.

### HUMAN CHECKPOINT 2: DNS CNAME Record on Hostgator

**STOP HERE. Ask the user:**

> "Vercel needs a CNAME DNS record added to your Hostgator DNS. Vercel shows this CNAME target: `cname.vercel-dns.com` (confirm this matches what Vercel shows you).
>
> Please:
> 1. Log in to Hostgator cPanel (https://hostgator.com → Log in → cPanel)
> 2. Navigate to: Domains → Zone Editor (or 'DNS Zone Editor')
> 3. Find the zone for 'kookyos.com'
> 4. Add a new CNAME record:
>    - Name / Host: `doppio`
>    - Type: `CNAME`
>    - Points To / Value: `cname.vercel-dns.com`
>    - TTL: `3600` (or leave as default)
> 5. Save the record
>
> DNS propagation typically takes 5-30 minutes but can take up to 24 hours. Let me know when you've added the record."

Wait for user confirmation before running DNS verification steps.

### Step 7: Verify DNS Propagation

Check DNS propagation. Run in a shell (or use Playwright to navigate to a DNS checker):

```bash
dig CNAME doppio.kookyos.com
```

Expected output: `doppio.kookyos.com CNAME cname.vercel-dns.com`

If `dig` is not available, use Playwright to navigate to `https://dnschecker.org/#CNAME/doppio.kookyos.com` and take a screenshot of the propagation status.

If DNS has not propagated yet, wait and retry. DNS propagation is typically fast (5-30 minutes) but may take up to 24 hours in rare cases. Do not block the task — proceed with production deploy in the next step, and re-check DNS after.

### Step 8: Production Deploy

Deploy to production:

```bash
vercel --prod
```

This builds the project using the environment variables set in the Vercel Dashboard and deploys to the production domain. Watch the output for:
- "Build successful"
- Production URL: `https://doppio.kookyos.com`
- Deployment ID

### Step 9: Enable Vercel Analytics

**Navigate to**: Vercel project dashboard → click **Analytics** in the left sidebar → click **Enable Analytics**

The free Hobby plan includes page view analytics at no cost.

After enabling in the Dashboard, verify the `@vercel/analytics` package integration in the codebase. The `Analytics` component should be rendered in `App.tsx`. Add it if not already present:

```tsx
// src/App.tsx — add Analytics import and component
import { Analytics } from '@vercel/analytics/react'

function App() {
  // ... existing useEffect for auth ...

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/complete" element={<Complete />} />
      </Routes>
      <IOSInstallBanner />
      <AndroidInstallBanner />
      <Analytics />
    </BrowserRouter>
  )
}
```

After adding `<Analytics />`, do another production deploy:

```bash
npm run build && vercel --prod
```

### Step 10: Verify Production URL

Use Playwright to verify the production deployment:

1. Navigate to: `https://doppio.kookyos.com`
2. Verify: Page loads (Doppio landing page, dark background)
3. Verify: HTTPS (green lock icon in address bar, no mixed-content warnings)
4. Navigate to: `https://doppio.kookyos.com/learn`
5. Verify: Learn page renders (not a 404)
6. Navigate to: `https://doppio.kookyos.com/complete`
7. Verify: Complete page renders (not a 404)
8. Open DevTools → Console: verify no red errors on page load
9. Screenshot: Landing page on production URL

**Supabase auth on production**: After the production deploy, verify anonymous auth works:
- Open DevTools → Application → Local Storage → `https://doppio.kookyos.com`
- Look for a key starting with `sb-` (Supabase session storage)
- If present: anonymous auth initialized successfully on production
- If not present after ~3 seconds: check Console for errors

---

## Files to Create

- `vercel.json` — CSP headers + SPA rewrite rule
- `.vercel/` — Created by Vercel CLI (do NOT commit)

## Files to Modify

- `src/App.tsx` — Add `<Analytics />` from `@vercel/analytics/react`
- `.gitignore` — Ensure `.vercel/` is excluded (should already be from Task 1.1)

---

## Contracts

### Provides (for downstream tasks)

- **Production URL**: `https://doppio.kookyos.com` — live, HTTPS, SPA routing working
- **Preview deploys**: Any branch → unique preview URL automatically
- **`vercel.json`**: CSP headers allowing YouTube/TikTok frames — Tasks 3.2, 5.4 depend on these being correct
- **Vercel Analytics**: Enabled and receiving data — Task 5.1 verifies event counts
- **Env vars in Vercel**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set for all deploys

### Consumes (from upstream tasks)

- Task 1.1 — `npm run build` working, project structure established
- Task 1.2 — `vite-plugin-pwa` in build pipeline (SW in `dist/`)
- Task 1.3 — real Supabase credentials in `.env.local` (to be set in Vercel Dashboard)

---

## Acceptance Criteria

- [ ] `vercel.json` exists with `frame-src` CSP header and `rewrites` rule
- [ ] Vercel project created and linked (`.vercel/` directory exists locally)
- [ ] `VITE_SUPABASE_URL` set in Vercel Dashboard for Production + Preview
- [ ] `VITE_SUPABASE_ANON_KEY` set in Vercel Dashboard for Production + Preview
- [ ] `vercel --prod` deploys successfully (exit 0, no build errors)
- [ ] `https://doppio.kookyos.com` loads (HTTP 200, not 404 or error)
- [ ] HTTPS active (SSL certificate provisioned by Vercel)
- [ ] `https://doppio.kookyos.com/learn` renders Learn page (not a 404)
- [ ] `https://doppio.kookyos.com/complete` renders Complete page (not a 404)
- [ ] Vercel Analytics enabled in Dashboard
- [ ] `<Analytics />` component from `@vercel/analytics/react` in `src/App.tsx`
- [ ] DNS CNAME record `doppio` → `cname.vercel-dns.com` added to Hostgator
- [ ] DevTools Console: no errors on production page load

---

## Testing Protocol

### Build Verification

- [ ] `npm run build` — exits 0, `dist/` created
- [ ] `dist/sw.js` exists (PWA Service Worker in output)

### Vercel Deploy Verification

- [ ] `vercel --prod` output shows "Deployment complete"
- [ ] Output shows production URL: `https://doppio.kookyos.com`

### Browser Testing (Playwright MCP)

**Production smoke test:**
- Navigate to: `https://doppio.kookyos.com`
- Verify: Page loads with HTTP 200 (not a Vercel error page)
- Verify: Dark background visible (Tailwind CSS loaded)
- Verify: "Doppio" or landing page content visible
- Verify: HTTPS (check `page.url()` starts with `https://`)
- Open DevTools → Console: no red errors

**SPA routing test (critical — verifies `rewrites` rule in vercel.json):**
- Navigate directly to: `https://doppio.kookyos.com/learn`
- Verify: Learn page renders (NOT a "404 Not Found" from Vercel)
- Navigate directly to: `https://doppio.kookyos.com/complete`
- Verify: Complete page renders (NOT a 404)

**PWA on production:**
- Navigate to: `https://doppio.kookyos.com`
- DevTools → Application → Service Workers
- Verify: SW is registered and active on the production URL

**Supabase auth on production:**
- Navigate to: `https://doppio.kookyos.com`
- Wait 3-5 seconds for auth to initialize
- DevTools → Application → Local Storage → `https://doppio.kookyos.com`
- Verify: A key starting with `sb-` appears (Supabase session stored)

**CSP header verification:**
- Navigate to: `https://doppio.kookyos.com`
- DevTools → Network → click on the `doppio.kookyos.com` root document request
- Headers tab → Response Headers
- Verify: `Content-Security-Policy` header is present with `frame-src` including `youtube.com` and `tiktok.com`

### DNS Verification

```bash
dig CNAME doppio.kookyos.com
```

Expected: `doppio.kookyos.com CNAME cname.vercel-dns.com`

Or use `https://dnschecker.org/#CNAME/doppio.kookyos.com` to check global propagation.

### Screenshot Captures

- Screenshot 1: `https://doppio.kookyos.com` — proof of live production
- Screenshot 2: Vercel Dashboard → project page showing production deployment
- Screenshot 3: Vercel Dashboard → Analytics enabled
- Screenshot 4: Vercel Dashboard → Environment Variables (names visible, values masked)

---

## Skills to Read

- `.claude/skills/vercel-deploy-custom-domain/SKILL.md` — Complete deploy steps, `vercel.json` config, DNS setup. Read in full.
- `.claude/skills/doppio-architecture/SKILL.md` — Tech stack and production URL confirmation.

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D2, D27, D28, D53

---

## Git

- Branch: `phase-1/vercel-deploy`
- Commit message prefix: `Task 1.4:`
- Example: `Task 1.4: add vercel.json with CSP headers, wire Analytics component, deploy to production`
- Commit BEFORE running `vercel --prod`: commit `vercel.json` and updated `src/App.tsx`
- The deploy itself is not a git commit — it is a Vercel operation
- After confirming production is live, create a git tag: `git tag phase-1-deployed`
