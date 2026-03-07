# Task 3.R: Phase 3 Regression

## Objective

Deploy the Phase 3 implementation to production and run a full regression test across every acceptance criterion from Tasks 3.1, 3.2, 3.3, and 3.4. All tests run on the live production URL `https://doppio.kookyos.com`. No Phase 3 task is considered done until it passes on production. Fix any failures before marking this regression complete.

## Context

Phase 3 introduces the complete Core Learning UI: Landing page, VideoCard with facade pattern, Try-it CTA, and progress tracking. These components are interconnected — VideoCard uses `useProgress`, TryItButton fires analytics, Landing renders the badge banner. Regressions must be caught now before Phase 4 (level navigation and gamification) builds on top. This task also validates that Supabase works correctly in the production environment (different origin than localhost).

## Dependencies

- Task 3.1 complete — Landing page deployed
- Task 3.2 complete — VideoCard deployed
- Task 3.3 complete — TryItButton deployed
- Task 3.4 complete — Progress tracking deployed

## Blocked By

- All of Tasks 3.1, 3.2, 3.3, 3.4 must be merged and building without errors before deployment

## Research Findings

- From DISCOVERY.md D2: Production URL is `https://doppio.kookyos.com`
- From DISCOVERY.md D54: Supabase anonymous auth must work on the production domain (Supabase's CORS allowlist may need updating)
- From PHASES.md Task 3.R: Deploy via `vercel --prod`; test marking cards complete across levels; verify Supabase Dashboard shows production progress rows; take screenshots of 3 levels visible with progress bar states
- From supabase-anonymous-progress SKILL.md §11: Supabase Dashboard must have the production domain added to Auth → URL Configuration if it isn't already (Vercel deploy URL or custom domain)

## Implementation Plan

### Step 1: Pre-deployment verification

Before deploying to production, run the full local build + smoke test:

```bash
# From project root
npm run build
```

If the build fails, fix all TypeScript errors before proceeding. Do NOT deploy a broken build.

After build succeeds, optionally run the dev server for a final local check:

```bash
npm run dev
```

Quick smoke test on localhost:5173:
- [ ] Landing page renders at `/`
- [ ] `/?ref=badge` shows yellow banner
- [ ] VideoCard facade renders (YouTube or TikTok thumbnail visible)
- [ ] Click facade → iframe loads (video plays)
- [ ] "Mark as done" button updates progress bar
- [ ] "Try it in ChatGPT →" button fires toast notification
- [ ] No console errors

### Step 2: Deploy to production

```bash
vercel --prod
```

If the Vercel CLI is not installed or not logged in:
```bash
npx vercel --prod
```

Wait for the deployment to complete. Vercel will output the production URL. Confirm it matches `https://doppio.kookyos.com` (or the Vercel-assigned URL if the custom domain is not yet active).

Set production environment variables if not already set (should have been done in Task 1.4):
- `VITE_SUPABASE_URL` → Production Supabase project URL
- `VITE_SUPABASE_ANON_KEY` → Production Supabase anon key

### Step 3: Verify Supabase CORS for production domain

Supabase restricts anonymous auth sign-ins by allowed URL origins. Verify the production domain is allowed:

1. Open Supabase Dashboard → Authentication → URL Configuration
2. Under "Redirect URLs": confirm `https://doppio.kookyos.com` is listed (or `*` wildcard is enabled for the anon key)
3. Under "Site URL": confirm it points to the production domain

If anonymous auth fails on production (and works on localhost), this is almost certainly the CORS/URL configuration issue. Add `https://doppio.kookyos.com` to the allowed list and redeploy.

### Step 4: Full production regression via Playwright

Open Playwright MCP browser. Navigate to `https://doppio.kookyos.com`.

#### 4.1 — Landing Page (Task 3.1 regression)

1. Navigate to `https://doppio.kookyos.com`
2. Verify: dark hero section loads
3. Verify: headline "20 minutes from ChatGPT user to AI manager" is visible
4. Verify: subheadline "No coding. No prompting. Just natural language." is visible
5. Verify: "Start Level 1 →" button is visible and clickable
6. Inspect DOM: verify `<video>` element has `autoplay`, `muted`, `loop`, `playsinline` attributes
7. Take screenshot: `regression-3-1-landing-desktop.png`

8. Navigate to `https://doppio.kookyos.com/?ref=badge`
9. Verify: yellow badge referral banner appears at top
10. Verify: banner text mentions "AI Manager"
11. Take screenshot: `regression-3-1-landing-badge.png`

12. Set viewport to 390×844 (iPhone 14 Pro)
13. Navigate to `https://doppio.kookyos.com`
14. Verify: no horizontal scroll, content fits within 390px
15. Verify: CTA button is full-width and tappable-sized
16. Take screenshot: `regression-3-1-landing-mobile.png`

#### 4.2 — VideoCard (Task 3.2 regression)

Note: The functional `/learn` page with VideoCards fully rendered is not built until Task 4.1 (Phase 4). This regression test only verifies that the `/learn` route loads without error. A blank or placeholder state is acceptable here — VideoCard rendering is completed in Phase 4, Task 4.1.

1. Navigate to `https://doppio.kookyos.com/learn`
2. Verify: `/learn` route loads without error (no 404, no crash, no unhandled exception in console)
3. Blank page, "coming soon" placeholder, or partial UI is acceptable — full VideoCard rendering is not expected until Task 4.1 is complete
4. Take screenshot: `regression-3-2-learn-route-loads.png`

If VideoCards happen to be partially rendered (e.g., Task 4.1 was deployed ahead of schedule):
5. Verify: no JavaScript console errors from VideoCard, YouTubeEmbed, or TikTokEmbed components
6. Verify: no broken layout or overflow at 390px viewport

Offline and iframe tests for VideoCard are deferred to Task 4.1's regression (Phase 4).

#### 4.3 — TryItButton (Task 3.3 regression)

Note: TryItButton is rendered alongside VideoCards on the `/learn` page, which is built in Task 4.1. If Task 4.1 is not yet deployed, TryItButton may not be visible via the production `/learn` route. In that case, test TryItButton in isolation using the approach below.

If `/learn` shows TryItButton (Task 4.1 complete):
1. Navigate to `/learn` (Level 1)
2. Verify: "Try it in ChatGPT →" button is visible below each VideoCard
3. Ensure popup blocker is disabled for `doppio.kookyos.com`
4. Click "Try it in ChatGPT →" on Card 1
5. Verify: a new tab opens
6. Verify: new tab URL starts with `https://chat.openai.com`
7. Verify: a toast notification appears with "Prompt copied" text
8. In the original tab: paste clipboard into an input field to confirm prompt text copied
9. Take screenshot: `regression-3-3-tryit-toast.png`

10. Navigate to Level 2 (if available)
11. Verify: "Try it in Claude →" button label
12. Click and verify new tab opens to `https://claude.ai`

If `/learn` does NOT show TryItButton (Task 4.1 not yet deployed):
- Verify the component builds cleanly (`npm run build` exits 0)
- Verify no TypeScript errors in `TryItButton.tsx` or `tryit.ts`
- Document that full integration testing is deferred to Task 4.1's regression

#### 4.4 — Progress Tracking (Task 3.4 regression)

1. Navigate to `https://doppio.kookyos.com` on a fresh session (clear localStorage first in DevTools → Application → Clear storage, or use incognito)
2. Navigate to `/learn`
3. Mark Level 1 Card 1 as complete (click "Mark as done")
4. Verify: checkmark overlay appears on the card
5. Verify: progress bar advances to 33% (one bar segment filled)
6. Take screenshot: `regression-3-4-progress-1-of-3.png`

7. Hard refresh the page (`Ctrl+Shift+R`)
8. Verify: progress bar still at 33% (card 1.1 still marked)
9. Verify: checkmark still visible on card 1.1
10. Take screenshot: `regression-3-4-progress-after-refresh.png`

11. Mark Card 2 complete → verify 66%
12. Mark Card 3 complete → verify 100% (or level completion if Task 4.2 is implemented)

13. Verify Supabase rows:
    - Open Supabase Dashboard → Table Editor → `user_progress`
    - Verify rows exist for the production anonymous user
    - Rows should have `level=1`, `card=1`, `card=2`, `card=3`
    - Take screenshot of Supabase dashboard showing the rows: `regression-3-4-supabase-rows.png`

14. Test window.focus sync:
    - Mark card 1.1 complete in production tab
    - Open the same URL in a second incognito tab (different localStorage)
    - In the second tab: trigger window.focus (click on the tab)
    - Wait 3 seconds for sync to complete
    - Note: incognito has separate localStorage; this test verifies the sync call fires, not that it merges across windows (different user IDs)

#### 4.5 — No console errors full journey

1. Navigate to `https://doppio.kookyos.com`
2. Open Chrome DevTools → Console
3. Complete this full journey: landing → click CTA → `/learn` → click video facade → play video → click "Try it" → mark card done
4. Verify: ZERO errors in console (warnings acceptable if they are `[doppio]` prefixed Supabase offline-mode warnings)
5. Note any errors found and fix before marking regression complete

### Step 5: Document results

After running all tests, create a brief results entry. For any failure:
1. Identify the root cause
2. Fix the code
3. Run `npm run build` again
4. Re-deploy: `vercel --prod`
5. Re-run the failing test(s)
6. Confirm fixed before marking regression DONE

## Files to Create

None — this is a testing task. No source files created.

## Files to Modify

Fix any files needed to address regression failures. Common Phase 3 regression failures and their likely causes:

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Anonymous auth fails on production | Supabase URL Configuration missing production domain | Add `https://doppio.kookyos.com` to Auth → URL Configuration |
| Badge banner not visible on `/?ref=badge` | `useSearchParams` not reading `ref` param correctly | Check React Router `BrowserRouter` vs `HashRouter` setup |
| Video facade not showing thumbnail | CSP `img-src` missing YouTube CDN domain | Update `vercel.json` header |
| iframe blocked in console | CSP `frame-src` not allowing `youtube.com` or `tiktok.com` | Update `vercel.json` CSP headers |
| Toast not showing | `<Toaster />` not mounted in App.tsx | Add `<Toaster />` to App root |
| Progress not persisting on production | `VITE_SUPABASE_URL` env var not set in Vercel production | Add to Vercel Dashboard → Settings → Environment Variables |
| Supabase upsert failing with RLS error | RLS policies not applied in production Supabase project | Run policy SQL in Supabase SQL Editor |

## Contracts

### Provides (for downstream tasks)

- Confirmed working production deployment of Phase 3 UI
- Screenshots documenting current production state
- Supabase `user_progress` rows confirming end-to-end progress tracking works on production
- Phase 4 can now safely build on Phase 3 without unknown regressions

### Consumes (from upstream tasks)

- Tasks 3.1–3.4 all complete and building without errors

## Acceptance Criteria

- [ ] `vercel --prod` deployment succeeds
- [ ] `https://doppio.kookyos.com` loads with no HTTP errors (200 OK)
- [ ] Landing page: headline, subheadline, and CTA visible on production
- [ ] `/?ref=badge`: yellow referral banner appears on production
- [ ] `<video autoplay muted loop playsinline>` element verified in production DOM
- [ ] `/learn` route loads without error (blank or placeholder state is acceptable — VideoCard rendering is completed in Phase 4, Task 4.1)
- [ ] VideoCard component builds cleanly with no TypeScript errors (full rendering tested in Task 4.1's regression)
- [ ] TryItButton: clicking opens correct AI tool in new tab (if Task 4.1 is deployed; otherwise verify build only)
- [ ] TryItButton: toast notification appears after click on production (if Task 4.1 is deployed; otherwise verify build only)
- [ ] Progress: marking card complete advances progress bar
- [ ] Progress: page refresh maintains progress (localStorage persists)
- [ ] Progress: Supabase Dashboard shows rows after cards marked complete on production
- [ ] ZERO JavaScript console errors on full user journey through landing → video → try-it → mark done
- [ ] No CSP violations in console
- [ ] Mobile (390px): all above criteria pass (test via Playwright viewport emulation)
- [ ] Screenshots captured for landing, badge banner, video facade, video playing, progress bar, Supabase rows

## Testing Protocol

### Build/Deploy

- [ ] `npm run build` — exits 0
- [ ] `vercel --prod` — deployment successful, URL confirmed

### Production Smoke Test (Playwright MCP)

All tests run against `https://doppio.kookyos.com` (NOT localhost).

Full test sequence as documented in Implementation Plan §4 above:
- [ ] 4.1: Landing page regression — 16 checks, 3 screenshots
- [ ] 4.2: VideoCard regression — verify /learn route loads without error (full rendering deferred to Task 4.1), 1 screenshot
- [ ] 4.3: TryItButton regression — full integration test if Task 4.1 is deployed; build verification only if not
- [ ] 4.4: Progress tracking regression — 14 checks, 3 screenshots + Supabase verification
- [ ] 4.5: Zero console errors on full journey

### Supabase Dashboard Verification

- [ ] Table Editor → `user_progress`: rows visible after production testing
- [ ] Rows show correct `level`, `card`, `user_id`, `completed_at` values
- [ ] Authentication → Users: anonymous users appear with UUIDs (from production sessions)

## Skills to Read

- `doppio-architecture` — Overall architecture reference for debugging
- `video-embed-facade` — CSP headers in vercel.json (§8) for iframe blocking issues
- `supabase-anonymous-progress` — Dashboard setup checklist (§11), common pitfalls (§12)

## Git

- Branch: `feat/phase-3-regression` or merge directly to main after all tasks complete
- Commit message prefix: `Task 3.R:`
- Example commit: `Task 3.R: Fix production CSP header for YouTube iframe and Supabase URL config`
- Note: Only commit fix files, not test artifacts (screenshots stay local or in a `/test-results/` directory)
