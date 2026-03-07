# Task 5.R: Phase 5 Regression

## Objective

Deploy to production, then run a comprehensive regression across all Phase 5 deliverables: analytics events firing correctly (verified via Supabase query), OG meta tags correct (verified via Twitter Card Validator), PWA icons and Lighthouse audit green, mobile layout pixel-perfect at 390px with no CSP violations. Fix any failures before marking this task done. This is the gate that unlocks Phase 6.

## Context

Phase 5 regression is the final quality gate before Phase 6 E2E testing begins. Phase 5 touched analytics wiring (5.1), OG share assets (5.2), PWA icons (5.3), and mobile polish + CSP (5.4). This regression task runs against the LIVE production URL `https://doppio.kookyos.com` after deploying all Phase 5 changes. Every item that passes here is safe for the hackathon submission demo. Any failure blocks Phase 6.

## Dependencies

- Task 5.1 complete — analytics.ts implemented, all 7 events wired
- Task 5.2 complete — OG meta tags in index.html, og-badge.png in public/
- Task 5.3 complete — all PWA icons generated, manifest polished, Lighthouse green
- Task 5.4 complete — vercel.json finalized, touch targets ≥ 44px, safe area insets, no horizontal scroll

## Blocked By

- ALL of Tasks 5.1, 5.2, 5.3, 5.4 must be marked complete before starting this regression

## Research Findings

- From `doppio-analytics` skill — Supabase query for event verification: `select event_name, count(*), count(distinct session_id) from analytics_events group by event_name order by count(*) desc;`
- From `doppio-analytics` skill — expected 7 event types: `page_view`, `level_started`, `card_completed`, `try_it_clicked`, `level_completed`, `badge_shared`, `pwa_installed`
- From `pwa-vite-setup` skill §10 — Lighthouse PWA audit via Chrome DevTools → Lighthouse tab → Progressive Web App category
- From `PHASES.md Task 5.R` — testing checklist: Supabase all 7 events, Vercel Analytics page views, Twitter Card Validator, Playwright mobile full journey, Lighthouse PWA all green, zero console errors
- From `vercel-deploy-custom-domain` skill — production deploy: `vercel --prod`

## Implementation Plan

### Step 1: Deploy all Phase 5 changes to production

Ensure all changes from Tasks 5.1, 5.2, 5.3, and 5.4 are committed to Git. Then deploy:

```bash
# Verify clean working tree (all Phase 5 changes committed)
git status  # should show nothing uncommitted

# Build to verify no errors before deploying
npm run build

# Deploy to production
vercel --prod
```

Wait for the deployment to complete and confirm the production URL resolves:
```bash
# Verify production is live and returning 200
curl -s -o /dev/null -w "%{http_code}" https://doppio.kookyos.com
# Expected: 200
```

### Step 2: Analytics regression — run full 9-card journey and verify Supabase

Open a fresh browser session (clear localStorage and sessionStorage first to simulate a new user). Navigate to `https://doppio.kookyos.com` and complete the following actions to generate all 7 analytics event types:

**Regression journey script for Playwright**:

```javascript
// Full regression journey at production URL
await page.context().clearCookies();
await page.goto('https://doppio.kookyos.com');
await page.evaluate(() => {
  localStorage.clear();
  sessionStorage.clear();
});
await page.reload();
await page.waitForLoadState('networkidle');

// 1. page_view — fires on mount (automatic via usePageTracking)
console.log('Step 1: page_view should fire on landing page load');

// 2. level_started — click "Start Level 1"
await page.locator('text=Start Level 1').click();
await page.waitForURL('**/learn**');
console.log('Step 2: level_started (level: 1) should have fired');

// 3. try_it_clicked — click "Try it" on first card
await page.locator('[data-testid="try-it-btn"], button:has-text("Try it")').first().click();
console.log('Step 3: try_it_clicked should have fired');
// Close new tab if opened
const pages = page.context().pages();
if (pages.length > 1) await pages[pages.length - 1].close();

// 4. card_completed — mark all 3 Level 1 cards complete
const completeButtons = page.locator('[data-testid="mark-complete"], button:has-text("Mark"), button:has-text("Done")');
for (let i = 0; i < 3; i++) {
  await completeButtons.nth(i).click();
  await page.waitForTimeout(300); // wait for animation
}
console.log('Step 4: 3x card_completed should have fired');

// 5. level_completed — Level 1 completion overlay should appear
await page.waitForSelector('[data-testid="level-complete"], text=Level 1 Complete', { timeout: 5000 });
console.log('Step 5: level_completed (level: 1) should have fired');

// 6. badge_shared — click Share on Level 1 complete screen
await page.locator('button:has-text("Share")').click();
await page.waitForTimeout(500);
console.log('Step 6: badge_shared should have fired');

// 7. Continue to Level 2 and Level 3 (repeat for level_started, card_completed, level_completed)
await page.locator('button:has-text("Continue"), button:has-text("Level 2")').click();
console.log('Step 7: Continuing to Level 2');

// Level 2 — mark all 3 cards complete
await page.waitForURL('**/learn**');
const l2Cards = page.locator('[data-testid="mark-complete"], button:has-text("Mark")');
for (let i = 0; i < 3; i++) {
  await l2Cards.nth(i).click();
  await page.waitForTimeout(300);
}

// Continue to Level 3
await page.locator('button:has-text("Continue"), button:has-text("Level 3")').click();
await page.waitForTimeout(500);

// Level 3 — mark all 3 cards complete → triggers final screen
const l3Cards = page.locator('[data-testid="mark-complete"], button:has-text("Mark")');
for (let i = 0; i < 3; i++) {
  await l3Cards.nth(i).click();
  await page.waitForTimeout(300);
}

// Final share on complete screen
await page.waitForURL('**/complete**', { timeout: 5000 }).catch(() => {});
await page.locator('button:has-text("Share")').click();
console.log('Full journey complete — all events should be in analytics_events');
```

**Supabase verification — run these queries in Supabase SQL Editor**:

Query 1 — Event totals (main check):
```sql
-- Must show all 7 event types with count >= 1
select
  event_name,
  count(*)                   as total,
  count(distinct session_id) as unique_sessions
from analytics_events
group by event_name
order by total desc;
```

Expected results: All 7 event types present:

| event_name | total | unique_sessions |
|------------|-------|-----------------|
| page_view | >= 3 | >= 1 |
| card_completed | >= 9 | >= 1 |
| try_it_clicked | >= 1 | >= 1 |
| level_started | >= 3 | >= 1 |
| level_completed | >= 3 | >= 1 |
| badge_shared | >= 2 | >= 1 |
| pwa_installed | varies | varies |

Query 2 — Card completion breakdown (verify all 9 cards tracked):
```sql
select
  properties->>'level' as level,
  properties->>'card'  as card,
  count(*)             as completions
from analytics_events
where event_name = 'card_completed'
group by level, card
order by level::int, card::int;
```

Expected: 9 rows (3 per level, 1 per card), each with count >= 1.

Query 3 — Verify no PII in event properties:
```sql
-- Confirm no personal data fields in properties
select distinct jsonb_object_keys(properties) as property_key
from analytics_events
limit 50;
```

Expected keys (acceptable): `level`, `card`, `card_title`, `card_id`, `tool`, `method`, `platform`, `path`, `referrer`, `duration_ms`
Not acceptable: `email`, `ip`, `user_agent`, `name`, `phone`

Query 4 — Recent events sanity check:
```sql
select event_name, properties, created_at
from analytics_events
order by created_at desc
limit 20;
```

Verify: events have correct `properties` JSON, `session_id` is a UUID (not empty string), `created_at` is recent.

### Step 3: Vercel Analytics verification

Navigate to Vercel Dashboard → Doppio project → **Analytics** tab.

Verify:
- [ ] "Analytics" tab is visible (Analytics was enabled in Task 1.4)
- [ ] Page view count shows > 0 (may take a few minutes to appear after production visits)
- [ ] Top pages shows `/` (landing page)
- [ ] Referrer data populates over time

Note: Vercel Analytics data appears with a delay of a few minutes. If the dashboard shows "No data yet", wait 5 minutes and refresh.

### Step 4: OG meta tags + Twitter Card Validator

**Twitter Card Validator**:
1. Navigate to `https://cards-dev.twitter.com/validator`
2. Enter: `https://doppio.kookyos.com`
3. Click "Preview card"

Expected result:
- Card type: "Summary Card with Large Image"
- Title: "Doppio — Become an AI Manager in 20 Minutes"
- Description: "No coding. No prompting. Just natural language superpowers."
- Image: dark purple badge image loads (1200×630px, Doppio branding)

If the card shows stale data from a previous crawl, append a cache-buster: `https://doppio.kookyos.com?v=1`

**opengraph.xyz verification**:
1. Navigate to `https://www.opengraph.xyz/`
2. Enter: `https://doppio.kookyos.com`
3. Verify all OG fields display correctly

**Playwright meta tag audit on production**:
```javascript
await page.goto('https://doppio.kookyos.com');

const metaChecks = [
  { selector: 'meta[property="og:title"]', expected: 'Doppio — Become an AI Manager in 20 Minutes' },
  { selector: 'meta[property="og:type"]', expected: 'website' },
  { selector: 'meta[property="og:url"]', expected: 'https://doppio.kookyos.com' },
  { selector: 'meta[property="og:image"]', expected: 'https://doppio.kookyos.com/og-badge.png' },
  { selector: 'meta[property="og:image:width"]', expected: '1200' },
  { selector: 'meta[property="og:image:height"]', expected: '630' },
  { selector: 'meta[name="twitter:card"]', expected: 'summary_large_image' },
  { selector: 'meta[name="twitter:image"]', expected: 'https://doppio.kookyos.com/og-badge.png' },
];

let allPass = true;
for (const { selector, expected } of metaChecks) {
  const content = await page.getAttribute(selector, 'content');
  const pass = content === expected;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${selector}: "${content}"`);
  if (!pass) allPass = false;
}
console.log(allPass ? 'All OG meta checks PASSED' : 'SOME OG meta checks FAILED');

// Verify og-badge.png is accessible
const imgResponse = await page.goto('https://doppio.kookyos.com/og-badge.png');
console.log(`og-badge.png status: ${imgResponse.status()}`); // Expected: 200
```

### Step 5: Lighthouse PWA audit on production

Run the Lighthouse PWA audit against the production URL:

1. Open `https://doppio.kookyos.com` in Chrome
2. DevTools (F12) → Lighthouse tab
3. Categories: select "Progressive Web App" only
4. Device: Mobile
5. Click "Analyze page load"

Expected: All PWA audit items green (pass):
- [ ] "Registers a service worker that controls page and start_url" — PASS
- [ ] "Current page responds with a 200 when offline" — PASS
- [ ] "start_url responds with a 200 when offline" — PASS
- [ ] "Web app manifest meets the installability requirements" — PASS (name, icons, display, start_url all valid)
- [ ] "Manifest's display property is set to standalone or fullscreen" — PASS
- [ ] "Is configured for a custom splash screen" — PASS (background_color + name + 512px icon)
- [ ] "Sets a theme color for the address bar" — PASS (theme_color set)
- [ ] "Content is sized correctly for the viewport" — PASS

If any item fails, return to the relevant task (5.3 for icon/manifest issues, 5.4 for viewport issues) to fix and redeploy.

### Step 6: Full mobile journey at 390px — no visual regressions

Run the complete user journey at 390×844px (iPhone 14 Pro) on production:

```javascript
await page.setViewportSize({ width: 390, height: 844 });

// Check for CSP violations throughout journey
const cspViolations = [];
page.on('console', msg => {
  if (msg.text().includes('Refused to')) cspViolations.push(msg.text());
});

// Landing page
await page.goto('https://doppio.kookyos.com');
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'screenshots/regression-mobile-landing.png', fullPage: true });

// Verify no horizontal scroll on landing
const landingHScroll = await page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth
);
console.log(`Landing horizontal scroll: ${landingHScroll}`); // Must be false

// Learn page
await page.goto('https://doppio.kookyos.com/learn');
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'screenshots/regression-mobile-learn.png', fullPage: true });

// Verify no horizontal scroll on learn page
const learnHScroll = await page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth
);
console.log(`Learn horizontal scroll: ${learnHScroll}`); // Must be false

// Trigger video embed (click facade) — check for CSP violations
await page.locator('.aspect-video, [data-testid="video-facade"]').first().click();
await page.waitForTimeout(3000);
await page.screenshot({ path: 'screenshots/regression-mobile-video-loaded.png' });

// Complete page
await page.goto('https://doppio.kookyos.com/complete');
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'screenshots/regression-mobile-complete.png', fullPage: true });

// Final CSP violation check
console.log(`CSP violations detected: ${cspViolations.length}`);
if (cspViolations.length > 0) {
  console.error('CSP VIOLATIONS:', cspViolations);
}
```

Review all screenshots:
- [ ] Landing page: hero, headline, CTA button all visible at 390px
- [ ] Learn page: level tabs visible, video facades render, Try-it buttons visible
- [ ] Video loaded: iframe appears without CSP error after facade click
- [ ] Complete page: "You're an AI Manager!" heading visible, resource links visible

### Step 7: Chrome DevTools console — zero errors

```javascript
// Check for ANY console errors on production full journey
const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

await page.goto('https://doppio.kookyos.com');
await page.locator('text=Start Level 1').click();
await page.waitForURL('**/learn**');

// Trigger common interactions
await page.locator('button').first().click();
await page.waitForTimeout(1000);

console.log(`Console errors: ${consoleErrors.length}`);
consoleErrors.forEach(e => console.error(e));
// PASS: consoleErrors.length === 0
```

Acceptable console output (not errors): `[SW] Registered`, informational logs
Not acceptable: any `Error:`, `TypeError:`, `Refused to load`, `NetworkError`, `Uncaught`

### Step 8: Fix any failures and redeploy

If any of the above checks fail:

1. Identify the failing check and which Phase 5 task introduced the issue
2. Fix the issue in the relevant file
3. Commit: `git commit -m "Task 5.R: Fix [description of fix]"`
4. Redeploy: `vercel --prod`
5. Re-run the specific failing check to verify the fix
6. Proceed to the next regression item

Do NOT mark this task complete until ALL regression items pass.

## Files to Create

None — this is a regression task. All files were created/modified in Tasks 5.1–5.4.

## Files to Modify

Any files identified as failing during regression testing. Document fixes in the commit message.

## Contracts

### Provides (for downstream tasks)

- Production URL `https://doppio.kookyos.com` passes all Phase 5 criteria — prerequisite for Phase 6 E2E testing
- All 7 analytics event types confirmed in Supabase — Phase 6 Task 6.4 can rely on this baseline
- Lighthouse PWA: all green — Phase 6 Task 6.2 builds on this
- Zero console errors, zero CSP violations — Phase 6 Task 6.5 uses this as baseline

### Consumes (from upstream tasks)

- Task 5.1: analytics.ts + 7 events wired
- Task 5.2: OG meta tags in index.html + og-badge.png in public/
- Task 5.3: All PWA icons generated + manifest polished
- Task 5.4: vercel.json finalized + mobile touch targets + safe area insets

## Acceptance Criteria

- [ ] `vercel --prod` completes successfully, production URL returns HTTP 200
- [ ] Supabase: `select event_name, count(*) from analytics_events group by event_name` shows all 7 event types with count >= 1 after a full 9-card journey
- [ ] Supabase: card_completed events show all 9 cards (3 per level) after full journey
- [ ] Supabase: no PII in event properties (no email, IP, or user-agent fields)
- [ ] Vercel Dashboard → Analytics: page views appearing (> 0 after production visits)
- [ ] Twitter Card Validator: OG preview shows "summary_large_image" format with Doppio title, description, and image
- [ ] `https://doppio.kookyos.com/og-badge.png` returns HTTP 200, content-type image/png
- [ ] Playwright: all 8 OG/Twitter meta tag checks pass on production
- [ ] Lighthouse PWA audit: all items green on production
- [ ] Chrome DevTools Application → Manifest: no errors, installable badge green
- [ ] Playwright at 390px: zero horizontal scroll on `/`, `/learn`, `/complete`
- [ ] Playwright at 390px: screenshots show correct layout on all major screens
- [ ] Chrome DevTools Console: ZERO errors and ZERO CSP violations during full journey
- [ ] After fixing any failures: `vercel --prod` redeployed, all checks re-run and passing
- [ ] `npm run build` on final codebase succeeds with no TypeScript errors

## Testing Protocol

### All testing is external service + Playwright (no unit tests for this regression task)

**Step 0: Verify deployment is live**
- Run: `vercel --prod` and wait for the deployment URL to be printed
- Navigate to https://doppio.kookyos.com in Playwright
- Verify the page returns HTTP 200 and has a `<title>` tag containing 'Doppio'
- Only proceed with regression tests after this passes

See Implementation Plan above for the complete step-by-step testing protocol.

### Final regression checklist (must all be checked before marking DONE):

- [ ] Step 1: Production deployed and accessible
- [ ] Step 2: Analytics — Supabase queries show all 7 event types
- [ ] Step 3: Vercel Analytics — page views visible in dashboard
- [ ] Step 4: OG tags — Twitter Card Validator and opengraph.xyz pass
- [ ] Step 5: Lighthouse PWA — all green on production
- [ ] Step 6: Mobile journey — full Playwright run at 390px, no visual regressions, no CSP violations
- [ ] Step 7: Zero console errors on production full journey
- [ ] Step 8: Any failures fixed, redeployed, and re-verified

### Key Supabase Queries (run in Supabase SQL Editor → Dashboard)

```sql
-- PRIMARY CHECK: All 7 event types present
select event_name, count(*) as total, count(distinct session_id) as sessions
from analytics_events
group by event_name
order by total desc;

-- CARD COMPLETION: All 9 cards tracked
select properties->>'level' as level, properties->>'card' as card, count(*)
from analytics_events
where event_name = 'card_completed'
group by level, card
order by level::int, card::int;

-- PII CHECK: No personal data in properties
select distinct jsonb_object_keys(properties) as key
from analytics_events;

-- RECENT EVENTS: Sanity check on latest entries
select event_name, session_id, properties, created_at
from analytics_events
order by created_at desc
limit 20;
```

### External Services

- **Twitter Card Validator**: `https://cards-dev.twitter.com/validator` — enter `https://doppio.kookyos.com`
- **opengraph.xyz**: `https://www.opengraph.xyz/` — enter `https://doppio.kookyos.com`
- **Vercel Dashboard Analytics**: `https://vercel.com/dashboard` → Doppio project → Analytics tab

## Skills to Read

- `doppio-analytics` — Supabase query patterns for regression verification
- `vercel-deploy-custom-domain` — Production deploy command, environment variable setup
- `pwa-vite-setup` — Lighthouse audit checklist, common failures and fixes

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D52 (success criteria for "done"), D27 (analytics event list), D43 (share badge spec)
- `.claude/orchestration-doppio/PHASES.md` — Task 5.R testing checklist

## Git

- Branch: `feat/phase-5-regression` (or fix branches as needed: `fix/phase-5-[issue]`)
- Commit message prefix: `Task 5.R:`
