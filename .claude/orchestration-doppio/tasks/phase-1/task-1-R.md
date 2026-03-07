# Task 1.R: Phase 1 Regression

## Objective

Run a complete regression of all Phase 1 work — verifying the project scaffold, PWA configuration, Supabase integration, and Vercel deployment are all functioning correctly in both local development and production environments. Every acceptance criterion from Tasks 1.1 through 1.4 must pass before Phase 1 is declared complete. Any failures must be fixed and re-verified before moving to Phase 2.

## Context

This regression task runs after all four Phase 1 implementation tasks (1.1, 1.2, 1.3, 1.4) are marked complete. It is the gate that protects Phase 2 from building on a broken foundation. Phase 2 immediately starts writing content data and depends on: React Router routing, Tailwind CSS, TypeScript build, Supabase client, and the production URL being stable. Fixing issues found during regression is part of this task — do not skip failures.

## Dependencies

- Task 1.1 — Scaffold complete
- Task 1.2 — PWA configured
- Task 1.3 — Supabase set up
- Task 1.4 — Vercel deployed

## Blocked By

- Tasks 1.1, 1.2, 1.3, 1.4 all complete

---

## Regression Protocol

Run every check below in order. For each check:
- Mark it PASS or FAIL
- If FAIL: fix the issue, re-run the specific check, then continue
- Do not move to Phase 2 until all checks are PASS

At the end, produce a regression report summary listing all checks and their final status.

---

## Section A: Build Health

### A1: Clean Build

```bash
cd /Users/renatosgafilho/Projects/KOOKY/Doppio
rm -rf dist/
npm run build
```

Expected:
- Exit code 0
- `dist/` directory created with contents
- No TypeScript errors in output
- No Vite/Rollup warnings about missing modules

Check:
- [ ] PASS: `npm run build` exits 0
- [ ] `dist/index.html` exists
- [ ] `dist/sw.js` exists (Workbox-generated Service Worker from vite-plugin-pwa)
- [ ] `dist/assets/` contains CSS and JS bundles

### A2: TypeScript Check

```bash
npx tsc --noEmit
```

Expected: Zero errors.

- [ ] PASS: `npx tsc --noEmit` exits 0, no errors output

### A3: Dependencies Installed

Verify all required packages are in `node_modules`:

```bash
node -e "require('react-router-dom'); require('@supabase/supabase-js'); require('canvas-confetti'); require('react-hot-toast'); console.log('All packages present')"
```

Also check dev packages:

```bash
node -e "const {readFileSync}=require('fs'); const pkg=JSON.parse(readFileSync('package.json','utf8')); const deps=[...Object.keys(pkg.dependencies||{}), ...Object.keys(pkg.devDependencies||{})]; ['tailwindcss','vite-plugin-pwa','@vite-pwa/assets-generator'].forEach(d => {if(!deps.includes(d)) throw new Error('Missing: '+d)}); console.log('All dev deps present')"
```

- [ ] PASS: All runtime dependencies installed
- [ ] PASS: All dev dependencies installed
- [ ] `package.json` contains `generate-pwa-assets` script

---

## Section B: Local Development Server

Start the dev server:

```bash
npm run dev
```

Leave it running throughout Section B tests.

### B1: Route Rendering

Use Playwright MCP to test all routes:

- Navigate to `http://localhost:5173/`
  - [ ] Landing page renders (dark background, "Doppio" text visible)
  - [ ] No white flash or blank screen
  - [ ] No red console errors

- Navigate to `http://localhost:5173/learn`
  - [ ] Learn page renders ("Learn" heading or learn content visible)
  - [ ] No 404

- Navigate to `http://localhost:5173/complete`
  - [ ] Complete page renders (heading visible)
  - [ ] No 404

### B2: Tailwind CSS Verification

- [ ] Landing page has dark background (confirms Tailwind utility classes applied)
- In browser DevTools: inspect the Landing page root element — computed background should be dark (#1a1a2e or similar gray-900)

### B3: PWA Manifest

Use Playwright to open Chrome DevTools:

- Navigate to `http://localhost:5173/`
- DevTools → Application → Manifest
- [ ] `name` field shows "Doppio - AI Literacy"
- [ ] `short_name` shows "Doppio"
- [ ] `display` shows "standalone"
- [ ] `start_url` shows "/"
- [ ] `theme_color` shows "#1a1a2e"
- [ ] Icons section shows at least 3 icon entries (192px, 512px, maskable 512px)
- [ ] Icons render without broken image placeholders
- [ ] No red error text in the Manifest panel
- [ ] Screenshot: Manifest panel

### B4: Service Worker

- DevTools → Application → Service Workers
- [ ] Service Worker is listed and shows status "activated and is running"
- [ ] No "redundant" or "error" status
- [ ] SW source file shown (sw.js or workbox-*.js)

### B5: Offline Behavior

- Navigate to `http://localhost:5173/` in Chrome with DevTools open
- DevTools → Network → Throttling → select "Offline"
- Reload the page (`Cmd+Shift+R` or `Ctrl+Shift+R` for hard reload)
- [ ] App shell renders (dark background visible) — NOT a network error page
- [ ] No blank white screen
- Navigate to `http://localhost:5173/learn`
- [ ] Learn page renders from Service Worker cache
- Re-enable network (set throttling back to "No throttling")

### B6: iOS Install Banner (Mobile Emulation)

Use Playwright with iPhone 12 viewport and iOS Safari user agent:
- Set user agent to: `Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1`
- Set viewport: 390×844
- Navigate to `http://localhost:5173/`
- [ ] `IOSInstallBanner` component is present in DOM (check for `fixed bottom-0` element)
- Verify banner content visible: "Install Doppio" text, instructions mentioning "Share" and "Add to Home Screen"

### B7: PWA Icon Files

Verify generated icon files exist and are non-empty:

Read each of these files and confirm non-zero content:
- [ ] `public/icons/pwa-192x192.png` — exists, non-empty
- [ ] `public/icons/pwa-512x512.png` — exists, non-empty
- [ ] `public/icons/maskable-512x512.png` — exists, non-empty
- [ ] `public/icons/apple-touch-icon-180x180.png` — exists, non-empty

### B8: Index.html Meta Tags

Read `index.html` and verify:
- [ ] `<meta name="apple-mobile-web-app-capable" content="yes">` present
- [ ] `<meta name="apple-mobile-web-app-status-bar-style" content="default">` present
- [ ] `<meta name="apple-mobile-web-app-title" content="Doppio">` present
- [ ] `<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png">` present
- [ ] `<meta name="theme-color" content="#1a1a2e">` present

---

## Section C: Supabase Integration

### C1: Environment Variables Present

- [ ] `.env.local` exists in project root
- Read `.env.local`:
  - [ ] `VITE_SUPABASE_URL` is set (not the placeholder text, contains `supabase.co`)
  - [ ] `VITE_SUPABASE_ANON_KEY` is set (starts with `eyJ`)
- [ ] `.env.local` is in `.gitignore` (verify it does NOT appear in `git status`)

### C2: Supabase Client Files

Read and verify each file:

- `src/lib/supabase.ts`:
  - [ ] Imports `createClient` from `@supabase/supabase-js`
  - [ ] Reads `import.meta.env.VITE_SUPABASE_URL`
  - [ ] Exports `supabase` client

- `src/lib/auth.ts`:
  - [ ] Exports `getOrCreateAnonUser()` function
  - [ ] Contains module-level `cachedUser` variable
  - [ ] Calls `supabase.auth.getSession()` before `signInAnonymously()`
  - [ ] Has try/catch with silent fallback (returns `null` on error)

- `src/App.tsx`:
  - [ ] Imports and calls `getOrCreateAnonUser()` in `useEffect` on mount

### C3: Anonymous Auth in Browser

Use Playwright to verify auth:
- Navigate to `http://localhost:5173/` with dev server running
- Wait 3 seconds for auth to initialize
- Evaluate in browser context:
  ```javascript
  Object.keys(localStorage).filter(k => k.startsWith('sb-'))
  ```
- [ ] Result is a non-empty array (Supabase session stored in localStorage)
- Screenshot: DevTools → Application → Local Storage showing `sb-*` key

### C4: Supabase Tables

Navigate to Supabase Dashboard SQL Editor and run verification queries:
`https://supabase.com/dashboard/project/<project-ref>/sql/new`

```sql
-- Verify tables exist
select table_name from information_schema.tables
where table_schema = 'public'
and table_name in ('user_progress', 'analytics_events');
```
- [ ] Both `user_progress` and `analytics_events` returned

```sql
-- Verify user_progress columns
select column_name, data_type
from information_schema.columns
where table_name = 'user_progress'
order by ordinal_position;
```
- [ ] Columns: `id` (uuid), `user_id` (uuid), `level` (smallint), `card` (smallint), `completed_at` (timestamp with time zone)

```sql
-- Verify RLS policies
select policyname, cmd from pg_policies
where tablename = 'user_progress';
```
- [ ] 3 policies returned: one for SELECT, one for INSERT, one for UPDATE

```sql
-- Verify anonymous user created (app must have loaded in browser first)
select count(*) from auth.users where is_anonymous = true;
```
- [ ] Count > 0 (at least one anonymous user created by the dev app)

### C5: Anonymous Sign-in Test

In Supabase Dashboard → Authentication → Users:
- [ ] At least one user entry visible with `Anonymous: Yes` (or similar indicator)
- Screenshot: Auth users page

---

## Section D: Vercel Production

### D1: Production URL Live

Use Playwright:
- Navigate to: `https://doppio.kookyos.com`
- [ ] Page loads (HTTP 200, not a Vercel error page)
- [ ] URL stays `https://doppio.kookyos.com` (no redirects to wrong domain)
- [ ] HTTPS confirmed (URL starts with `https://`)
- [ ] Dark background visible (Tailwind CSS loaded in production build)
- Screenshot: Production landing page

### D2: SPA Routing on Production

These tests verify the `rewrites` rule in `vercel.json` is working:

- Navigate directly to: `https://doppio.kookyos.com/learn`
- [ ] Learn page renders — NOT a Vercel 404 page
- Navigate directly to: `https://doppio.kookyos.com/complete`
- [ ] Complete page renders — NOT a Vercel 404 page

### D3: Environment Variables Active on Production

Verify Supabase auth works on the production URL:
- Navigate to: `https://doppio.kookyos.com`
- Wait 3 seconds
- Evaluate in browser:
  ```javascript
  Object.keys(localStorage).filter(k => k.startsWith('sb-'))
  ```
- [ ] Non-empty result (session stored — means `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present in production build)

If the result is empty, the env vars are likely missing in Vercel Dashboard. Fix by: Vercel Dashboard → Project → Settings → Environment Variables → verify both vars are present, then `vercel --prod` to redeploy.

### D4: CSP Headers on Production

- Navigate to: `https://doppio.kookyos.com`
- DevTools → Network → select the root document request (doppio.kookyos.com)
- Response Headers tab
- [ ] `Content-Security-Policy` header present
- [ ] CSP value includes `frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.tiktok.com`

### D5: PWA on Production

- Navigate to: `https://doppio.kookyos.com`
- DevTools → Application → Manifest
- [ ] Manifest loaded correctly (not empty, no "No manifest detected")
- DevTools → Application → Service Workers
- [ ] SW active on production URL
- Screenshot: Application panel on production

### D6: Vercel Analytics Enabled

- Navigate to Vercel Dashboard → your Doppio project → Analytics tab
- [ ] Analytics is enabled (not "Enable Analytics" button — should show a graph or "Waiting for data" state)
- [ ] `<Analytics />` component present in `src/App.tsx`

### D7: DNS Verification

```bash
dig CNAME doppio.kookyos.com
```

Expected output contains: `cname.vercel-dns.com`

- [ ] CNAME record resolves to Vercel's CNAME target
- [ ] SSL certificate valid (HTTPS without browser security warnings)

---

## Section E: File Structure Verification

Verify the complete project file structure matches the architecture contract:

- [ ] `src/pages/Landing.tsx` exists
- [ ] `src/pages/Learn.tsx` exists
- [ ] `src/pages/Complete.tsx` exists
- [ ] `src/components/IOSInstallBanner.tsx` exists
- [ ] `src/components/AndroidInstallBanner.tsx` exists
- [ ] `src/hooks/usePWAInstall.ts` exists
- [ ] `src/hooks/useOnlineStatus.ts` exists
- [ ] `src/lib/supabase.ts` exists
- [ ] `src/lib/auth.ts` exists
- [ ] `src/data/` directory exists (content.json goes here in Task 2.1)
- [ ] `src/components/` directory exists (components go here in Phase 3)
- [ ] `src/hooks/` directory exists
- [ ] `public/icons/` directory with icon files
- [ ] `supabase/migrations/001_initial.sql` exists
- [ ] `.env.example` exists with placeholder variable names
- [ ] `.env.local` exists with real values (NOT committed to git)
- [ ] `vercel.json` exists with CSP headers and rewrites
- [ ] `tailwind.config.js` exists with correct content array
- [ ] `vite.config.ts` includes VitePWA plugin

---

## Section F: Git State Check

Verify the repository is clean and all Phase 1 work is committed:

```bash
git status
git log --oneline -10
```

- [ ] No uncommitted files (except `.env.local` which should be gitignored)
- [ ] At least one commit per task (or a single Phase 1 commit — either is fine)
- [ ] `.env.local` does NOT appear in `git status` (it is gitignored)
- [ ] `.vercel/` does NOT appear in `git status` (it is gitignored)

---

## Failure Handling

If any check fails:

1. **Identify the failure**: Note which specific check failed and what the actual vs expected output was.
2. **Fix the root cause**: Go back to the relevant task (1.1, 1.2, 1.3, or 1.4) and apply the fix.
3. **Re-deploy if needed**: If the fix affects production, run `npm run build && vercel --prod`.
4. **Re-run only the failed section**: You do not need to re-run all checks — re-run just the section where the failure occurred.
5. **Document the fix**: Note what was wrong and what was changed in the regression report.

Common failure patterns:
- Build fails: TypeScript error in new files → fix type errors
- SW not active in dev: `devOptions.enabled: true` missing in vite.config.ts
- Production 404 on `/learn`: `rewrites` missing or wrong in `vercel.json`
- Supabase session empty on production: env vars not set in Vercel Dashboard → add them and redeploy
- Anonymous user not in Supabase: anonymous auth not enabled in Dashboard → enable it

---

## Regression Report

After completing all checks, produce a short summary in this format:

```
Phase 1 Regression Report
Date: [date]
Overall: PASS / FAIL

Section A: Build Health — PASS / FAIL (N/N checks passed)
Section B: Local Dev Server — PASS / FAIL (N/N checks passed)
Section C: Supabase Integration — PASS / FAIL (N/N checks passed)
Section D: Vercel Production — PASS / FAIL (N/N checks passed)
Section E: File Structure — PASS / FAIL (N/N checks passed)
Section F: Git State — PASS / FAIL (N/N checks passed)

Failures found and fixed: [list any]
Phase 2 ready: YES / NO
```

Phase 2 must NOT start until "Phase 2 ready: YES".

---

## Acceptance Criteria

- [ ] All Section A checks pass (build health)
- [ ] All Section B checks pass (local dev)
- [ ] All Section C checks pass (Supabase)
- [ ] All Section D checks pass (production)
- [ ] All Section E checks pass (file structure)
- [ ] All Section F checks pass (git)
- [ ] Regression report produced and stored (as output message or in a file)
- [ ] Production URL `https://doppio.kookyos.com` loading correctly

---

## Screenshots to Capture

Capture and save these as evidence:

1. `localhost:5173/` — Landing page in local dev
2. `localhost:5173/` — Chrome DevTools → Application → Manifest panel
3. `localhost:5173/` — Chrome DevTools → Application → Service Workers panel
4. `https://doppio.kookyos.com` — Production landing page
5. Supabase Dashboard → Authentication → Users (showing anonymous user)
6. Vercel Dashboard → Project → Analytics (enabled state)

---

## Skills to Read

No new skills needed for regression. Refer back to:
- `.claude/skills/doppio-architecture/SKILL.md` — for file structure expectations
- `.claude/skills/pwa-vite-setup/SKILL.md` — for PWA debugging guidance
- `.claude/skills/supabase-anonymous-progress/SKILL.md` — for Supabase troubleshooting
- `.claude/skills/vercel-deploy-custom-domain/SKILL.md` — for deploy troubleshooting

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D52 (success criteria) for the full picture of what "done" means

---

## Git

- Branch: same branch as Task 1.4 (or `phase-1/regression`)
- Commit message prefix: `Task 1.R:`
- Example: `Task 1.R: Phase 1 regression passed — all infra verified`
- Only commit if fixes were made during regression (e.g., fixed a missing config)
- After all checks pass, tag: `git tag v0.1.0-phase1-complete`
