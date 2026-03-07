# Task 6.4: Analytics Verification

## Objective

Verify that all 7 Doppio analytics events fire correctly on the production URL and are present in the Supabase `analytics_events` table after completing a full journey. Verify that Vercel Analytics is active and recording page views in the Vercel Dashboard. Confirm no events contain personal data or PII. If any event is missing or firing incorrectly, diagnose the root cause, fix the code, redeploy, and re-verify.

## Context

This task follows Task 6.3 (Supabase + progress persistence). Analytics is a two-layer system: Vercel Analytics (automatic page views, no custom events on Hobby plan) and Supabase custom events (7 learning-path events via the `track()` helper in `src/lib/analytics.ts`). Both layers must be working for the hackathon submission and for any post-launch funnel analysis.

## Dependencies

- Task 6.1 complete (full journey confirmed functional)
- Analytics implementation from Task 5.1 (`src/lib/analytics.ts`, `<Analytics />` in App.tsx)
- Supabase `analytics_events` table created (from Task 1.3 / 5.1)
- Vercel Analytics enabled in Vercel Dashboard (from Task 1.4 / 5.1)

## Blocked By

- Task 6.1

## Research Findings

- From DISCOVERY.md D27: Two-layer analytics: Vercel Analytics (Layer 1, automatic) + Supabase custom events (Layer 2, 7 events). Both cookieless. No GDPR consent banner needed.
- From skill `doppio-analytics` §Layer 1: `<Analytics />` from `@vercel/analytics/react` in App.tsx. Tracks page views automatically. Custom events (`track()` from @vercel/analytics) are Pro-only — NOT available on Hobby plan.
- From skill `doppio-analytics` §Layer 2: Table `analytics_events(id, event_name, session_id, properties jsonb, created_at)`. Track 7 events. `session_id` = `crypto.randomUUID()` stored in sessionStorage.
- From skill `doppio-analytics` — The 7 events:
  1. `page_view` — every route change, properties: `{path, referrer}`
  2. `level_started` — Level CTA click, properties: `{level}`
  3. `card_completed` — mark card done, properties: `{level, card, card_title}`
  4. `try_it_clicked` — Try it button click, properties: `{level, card, card_id, tool}`
  5. `level_completed` — level finish, properties: `{level, duration_ms}`
  6. `badge_shared` — share click, properties: `{method: 'copy_link'|'native_share'}`
  7. `pwa_installed` — appinstalled event, properties: `{platform}`
- From PHASES.md Task 5.1 (acceptance criteria): All events silenced on error (try/catch). No console errors from analytics.
- From PHASES.md Task 6.4: Verify with SQL: `select event_name, count(*) from analytics_events group by event_name`.
- Expected counts: `page_view × 1+`, `level_started ≥ 3`, `card_completed × 9`, `try_it_clicked ≥ 3`, `level_completed × 3`, `badge_shared ≥ 1`.

## Implementation Plan

This is a testing task. No new code unless bugs are found.

### Step 1: Prepare a clean analytics session

To get clean, attributable event counts for this test session, use a fresh browser context so a new `session_id` (crypto.randomUUID in sessionStorage) is created. This isolates this test run's events from previous test runs.

```
1. Playwright: new browser context (fresh sessionStorage = new session_id)
2. Navigate to: https://doppio.kookyos.com
3. Record the session_id:
   evaluate: sessionStorage.getItem('doppio_session_id')
   If null after first load: the analytics.ts module creates it lazily on first track() call.
   After the page_view fires, evaluate again to capture the UUID.
4. Log the session_id → use it in SQL queries to isolate this test session's events
```

### Step 2: Run the complete journey to generate all 7 event types

Execute all actions that trigger each event type:

**page_view:**
```
- Navigate to / → fires page_view with {path: '/', referrer: ''}
- Navigate to /learn → fires page_view with {path: '/learn', referrer: ...}
- Navigate to /complete → fires page_view with {path: '/complete', referrer: ...}
Target: ≥ 3 page_view events (one per route)
```

**level_started:**
```
- Click "Start Level 1" CTA on landing → fires level_started {level: 1}
- Click Level 2 tab/CTA after L1 completion → fires level_started {level: 2}
- Click Level 3 tab/CTA after L2 completion → fires level_started {level: 3}
Target: level_started count ≥ 3 (fires at least once per level; may fire more if user revisits
level tabs — this is expected behavior)
```

**card_completed:**
```
- Mark each of the 9 cards complete → fires card_completed for each
  card_completed {level: 1, card: 1, card_title: "..."}
  ... (9 total)
Target: exactly 9 card_completed events
```

**try_it_clicked:**
```
- Click "Try it" on at least one card per level:
  - L1: Try it in ChatGPT → fires try_it_clicked {level: 1, card: 1, tool: 'chatgpt'}
  - L2: Try it in Claude → fires try_it_clicked {level: 2, card: 1, tool: 'claude'}
  - L3: Try it → fires try_it_clicked {level: 3, card: 1, tool: 'claude'|'perplexity'}
Target: ≥ 3 try_it_clicked events (one per level minimum)
Close newly opened tabs each time to keep focus on main tab
```

**level_completed:**
```
- Complete all 3 L1 cards → fires level_completed {level: 1, duration_ms: N}
- Complete all 3 L2 cards → fires level_completed {level: 2, duration_ms: N}
- Complete all 3 L3 cards → fires level_completed {level: 3, duration_ms: N}
Target: exactly 3 level_completed events
```

**badge_shared:**
```
- On Level 1 completion screen: click "Share" → fires badge_shared {method: 'copy_link'|'native_share'}
- On Final screen: click share badge → fires badge_shared again
Target: ≥ 1 badge_shared event
```

**pwa_installed:**
```
- This event fires only on actual PWA installation. In this test context:
  - Playwright cannot trigger the actual appinstalled browser event
  - Verify: the event listener is registered in the code
  - Verify: no console error from analytics related to pwa_installed
  - Document: "pwa_installed will fire on actual device install — not testable in headless browser"
  - Consider: if iOS install banner has a "tap here to install" CTA that tracks pwa_installed, test that
Target: document as expected-not-fired in headless context (not a bug)
```

### Step 3: SQL verification in Supabase Dashboard

After the full journey above, run these SQL queries in the Supabase Dashboard → SQL Editor:

**Query 1 — Event totals grouped by name for this session:**

```sql
SELECT
  event_name,
  COUNT(*) AS total
FROM public.analytics_events
WHERE session_id = '<your-session-id-from-step-1>'
GROUP BY event_name
ORDER BY total DESC;
```

Expected results:

| event_name      | total |
|-----------------|-------|
| card_completed  | 9     |
| level_started   | ≥ 3   |
| level_completed | 3     |
| try_it_clicked  | ≥ 3   |
| page_view       | ≥ 3   |
| badge_shared    | ≥ 1   |
| pwa_installed   | 0 (expected in headless) |

Document the actual vs expected in `6-4-results.md`.

**Query 2 — Full event log for this session (audit properties for PII):**

```sql
SELECT
  event_name,
  session_id,
  properties,
  created_at
FROM public.analytics_events
WHERE session_id = '<your-session-id>'
ORDER BY created_at ASC;
```

For each row, verify:
- `properties` does NOT contain: email, IP address, full name, user agent string, geolocation coordinates
- `session_id` is a UUID (not linked to any personal identifier)
- `properties` for `card_completed` contains only: `{level, card, card_title}` (no user data)
- `properties` for `try_it_clicked` contains only: `{level, card, card_id, tool}` (no prompt text, no URL)
- `properties` for `badge_shared` contains only: `{method}` (no URL with user data)

**Query 3 — Verify analytics table schema:**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'analytics_events'
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

Expected columns: `id (uuid)`, `event_name (text)`, `session_id (text)`, `properties (jsonb)`, `created_at (timestamptz)`

**Query 4 — All-time event breakdown (for demo visibility):**

```sql
SELECT
  event_name,
  COUNT(*) AS total,
  COUNT(DISTINCT session_id) AS unique_sessions
FROM public.analytics_events
GROUP BY event_name
ORDER BY total DESC;
```

This shows the aggregate funnel data — useful for the hackathon demo.

**Query 5 — card_completed breakdown:**

```sql
SELECT
  properties->>'level' AS level,
  properties->>'card'  AS card,
  COUNT(*)             AS completions
FROM public.analytics_events
WHERE event_name = 'card_completed'
  AND session_id = '<your-session-id>'
GROUP BY level, card
ORDER BY level, card;
```

Expected: 9 rows, one for each (level 1–3, card 1–3).

### Step 4: Verify Vercel Analytics page views

```
1. Navigate to: https://vercel.com/dashboard
2. Open the Doppio project → Analytics tab
3. Verify: page views are showing (should have at least the test run's visits)
4. Verify: Analytics is "Enabled" (not showing "Enable Analytics" prompt)
5. Screenshot: save as 6-4-01-vercel-analytics-dashboard.png
   Note: Playwright can be used to screenshot the Vercel Dashboard if logged in,
   OR manually verify and note in 6-4-results.md
6. Verify: top pages include "/" and "/learn"
```

Note: Vercel Analytics data may have a delay of up to a few minutes. If the Dashboard shows 0 views,
wait 5 minutes and check again before declaring a failure.

### Step 5: Verify analytics silence on error (no console errors)

```
1. Playwright: navigate to https://doppio.kookyos.com
2. Listen for console errors: page.on('console', msg => if msg.type() === 'error' log it)
3. Complete the full journey (all 9 cards, share buttons)
4. Verify: NO console.error messages related to:
   - "analytics"
   - "track"
   - "analytics_events"
   - Supabase insert errors
5. Some console.warn messages from analytics are acceptable (they are expected silent fails)
6. Verify: NO console.error at all on the entire journey
7. Screenshot: save as 6-4-02-console-no-errors.png (DevTools console showing empty/clean log)
```

### Step 6: Verify try_it_clicked properties per AI tool

```
1. In Supabase SQL Editor:
SELECT
  properties->>'tool' AS tool,
  COUNT(*) AS clicks
FROM public.analytics_events
WHERE event_name = 'try_it_clicked'
  AND session_id = '<your-session-id>'
GROUP BY tool;

Expected tools present: 'chatgpt', 'claude' (and possibly 'perplexity' if L3 uses it)
Verify: NO 'undefined' or null values in the tool field
```

### Step 7: Document results

Create `.claude/orchestration-doppio/reports/e2e-screenshots/6-4-results.md`:

Include:
- Session ID used for this test run
- SQL Query 1 results (actual event counts vs expected) — table format
- SQL Query 2 — PII audit: confirm no personal data found
- SQL Query 3 — schema verification: columns match expected
- SQL Query 4 — all-time breakdown (copy-paste results)
- SQL Query 5 — per-card breakdown (all 9 rows confirmed)
- Vercel Analytics: enabled status, page views visible (Y/N)
- Console errors during journey: 0 confirmed
- try_it_clicked tool breakdown: tools present
- pwa_installed: documented as expected-not-fired in headless
- Any bugs found, fixes applied, redeployment confirmation

### Step 8: Bug fix and redeploy protocol

If any event is missing or has wrong properties:

1. Check `src/lib/analytics.ts` — `track()` helper implementation
2. Check the component where the event should fire (e.g., `TryItButton.tsx` for `try_it_clicked`)
3. Check `src/App.tsx` — `<Analytics />` placement for page views
4. Check Supabase Dashboard — RLS policy on `analytics_events` (must allow insert from anon users)
5. Fix, build, redeploy
6. Re-run the specific failing step
7. Document

If the `analytics_events` RLS policy is missing or wrong:
```sql
-- Verify RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'analytics_events';

-- If no insert policy, create it:
CREATE POLICY "Allow insert for all"
  ON public.analytics_events
  FOR INSERT
  WITH CHECK (true);
```

## Files to Create

- `.claude/orchestration-doppio/reports/e2e-screenshots/6-4-01-vercel-analytics-dashboard.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-4-02-console-no-errors.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-4-results.md`

## Files to Modify

Only if bugs are found:
- `src/lib/analytics.ts` — `track()` helper, session ID logic
- `src/App.tsx` — `<Analytics />` component placement
- Component files where events should fire (e.g., `TryItButton.tsx`, `LevelCompleteScreen.tsx`)
- Supabase Dashboard: RLS policy on `analytics_events`

## Contracts

### Provides (for downstream tasks)

- Confirmed: all 7 event types fire correctly on production
- Confirmed: Vercel Analytics is active and tracking page views
- Confirmed: no PII in event properties
- Confirmed: no console errors from analytics during full journey
- SQL query results documented in 6-4-results.md

### Consumes (from upstream tasks)

- Task 5.1: analytics.ts implementation, `<Analytics />` in App.tsx, `analytics_events` table
- Task 6.1: production functional (prerequisite)

## Acceptance Criteria

- [ ] `page_view` fires at least once per route visited (min 3 for landing + learn + complete)
- [ ] `level_started` fires at least 3 times in the test session (once per level minimum; revisiting level tabs may produce additional events — this is expected behavior)
- [ ] `card_completed` fires exactly 9 times in the test session (once per card)
- [ ] `try_it_clicked` fires at least 3 times (one per level) in the test session
- [ ] `level_completed` fires exactly 3 times in the test session (once per level)
- [ ] `badge_shared` fires at least 1 time in the test session
- [ ] `pwa_installed` documented as expected-not-fired in headless context
- [ ] All events have non-null `session_id` (UUID format)
- [ ] No event properties contain PII (email, IP, full name, user agent)
- [ ] `try_it_clicked` events have non-null, non-undefined `tool` property
- [ ] Vercel Analytics tab shows page views (enabled and active)
- [ ] Zero console.error messages during full journey on production
- [ ] Supabase `analytics_events` table schema matches expected columns
- [ ] All 2 screenshots saved to `reports/e2e-screenshots/`
- [ ] `6-4-results.md` documents all SQL results with actual counts vs expected

## Testing Protocol

### External Service Verification

**Supabase SQL Editor** (run all 5 queries from Step 3):

```sql
-- Primary verification query (run after full journey):
SELECT event_name, COUNT(*) AS total
FROM public.analytics_events
WHERE session_id = '<session-id>'
GROUP BY event_name
ORDER BY total DESC;
-- Assertion: level_started total >= 3 (not = 3; revisiting level tabs may produce extra events)
```

**Vercel Dashboard:**
- URL: `https://vercel.com/dashboard` → Doppio project → Analytics
- Verify: page views visible and count is non-zero

### Browser Testing (Playwright MCP)

- Target URL: `https://doppio.kookyos.com`
- Viewport: 1440×900
- New browser context per test (fresh sessionStorage)

**Key Playwright actions for event triggering:**

```javascript
// Capture session_id after first track() fires (lazy init)
const sessionId = await page.evaluate(() => sessionStorage.getItem('doppio_session_id'));

// Listen for console errors
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log('CONSOLE ERROR:', msg.text());
  }
});

// Listen for console warns (to see analytics silent fails — they are expected to warn not error)
page.on('console', msg => {
  if (msg.type() === 'warning') {
    console.log('CONSOLE WARN:', msg.text());
  }
});
```

### Build/Lint/Type Checks

Only if a bug fix is applied:

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors in `src/lib/analytics.ts`

## Skills to Read

- `doppio-analytics` — complete analytics implementation reference (both layers, all 7 events, SQL queries)
- `supabase-anonymous-progress` — Supabase client and RLS context

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D27 (analytics design decision), D52 (success criteria: Supabase events firing)

## Git

- Branch: `main` (testing only)
- Commit message prefix (if fix needed): `Fix(6.4):`
