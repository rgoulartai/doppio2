# Task 6.3: Supabase + Progress Persistence Test

## Objective

Verify that anonymous authentication initializes correctly, that progress syncs reliably between localStorage and Supabase, that the unique constraint on `user_progress` correctly prevents duplicate rows, and that offline progress marking syncs when the browser comes back online. If any failure is found, diagnose the root cause, fix the code, redeploy, and re-verify.

## Context

This task follows Task 6.2 (cross-device + PWA). It focuses exclusively on the data layer: Supabase anonymous auth, the `user_progress` table, RLS policies, the `useProgress` hook behavior, and offline/online sync. This is critical for hackathon submission because progress persistence is listed in DISCOVERY.md D52 as a core success criterion.

## Dependencies

- Task 6.1 complete (full journey confirmed functional)
- Supabase project setup from Task 1.3
- Progress hook from Task 3.4 (`useProgress`, `markCardComplete`, `syncFromSupabase`)
- Supabase schema with unique constraint from DISCOVERY.md D26

## Blocked By

- Task 6.1

## Research Findings

- From DISCOVERY.md D24: Supabase anonymous auth via `supabase.auth.signInAnonymously()`. New Supabase project. Anonymous sign-ins must be enabled.
- From DISCOVERY.md D25: localStorage is source of truth. Supabase syncs in background. Merge strategy: union (additive — cards never un-completed). Pull from Supabase on `window.focus`.
- From DISCOVERY.md D26: Table `user_progress` has `constraint unique_user_level_card unique (user_id, level, card)`. Max 9 rows per user.
- From DISCOVERY.md D54: If `signInAnonymously()` fails, silently fall back to localStorage-only mode. No error shown. Retry on next `window.focus`.
- From skill `supabase-anonymous-progress` §4: `getOrCreateAnonUser()` — checks `getSession()` first, only calls `signInAnonymously()` if no session exists. Uses module-level cache.
- From skill `supabase-anonymous-progress` §7: `markCardComplete()` writes localStorage first, then fires async Supabase upsert. The upsert uses `ignoreDuplicates: true` — safe to call multiple times.
- From skill `supabase-anonymous-progress` §9: `syncFromSupabase()` called on app mount AND on `window.focus`.
- localStorage key: `doppio_progress_v1`
- Progress shape: `{ level_1: {card_1: bool, card_2: bool, card_3: bool}, level_2: {...}, level_3: {...} }`

## Implementation Plan

This is a testing task. No new code unless bugs are found. The agent runs Playwright tests on production and executes SQL queries in the Supabase Dashboard.

### Step 1: Test 1 — Anonymous auth re-initialization after localStorage clear

**Goal**: Verify that clearing localStorage triggers a fresh anonymous auth without creating duplicate users.

```
1. Playwright desktop (1440×900)
2. Navigate to: https://doppio.kookyos.com
3. Wait for: page fully loaded
4. Evaluate: check if an anonymous user was created
   - window.__supabaseUser (if the app exposes this for debugging)
   - OR: check if Supabase auth session is present in localStorage
     → Look for key: `sb-<project-ref>-auth-token` (Supabase client stores session here)
   - evaluate: JSON.stringify(Object.keys(localStorage))
5. Record the session/user UUID from localStorage (the `sub` field in the JWT)
6. Log the UUID as "original user UUID before clear"

7. Clear only the Doppio progress key:
   evaluate: localStorage.removeItem('doppio_progress_v1')
   (Do NOT clear the Supabase session key — we want to test session persistence, not re-creation)

8. Reload the page
9. Wait for: page fully loaded
10. Evaluate: check session key again → must be the SAME UUID (session persists)
11. Verify: progress is empty (all cards unchecked) after localStorage clear
12. Screenshot: save as 6-3-01-auth-reinit-after-clear.png
```

**Secondary test — full localStorage clear (new user creation):**

```
1. Clear ALL localStorage:
   evaluate: localStorage.clear()
2. Reload the page
3. Wait for: page fully loaded and auth initialized (~1–2 seconds)
4. Evaluate: get new session key → record new UUID
5. Verify: new UUID is DIFFERENT from original (new anonymous user was created)
6. Verify: app works normally (no visible errors, progress starts at zero)
7. Screenshot: save as 6-3-02-new-anon-user-after-full-clear.png
```

### Step 2: Test 2 — Progress close and restore across tabs

**Goal**: Verify that marking cards complete, closing the tab, and opening a new tab restores progress.

```
1. Start fresh Playwright session (new context, new localStorage)
2. Navigate to: https://doppio.kookyos.com
3. Complete cards L1C1, L1C2, L1C3, L2C1, L2C2 (5 cards):
   - For each: click "Mark as done" and verify checkmark

4. Wait 2 seconds (give Supabase async upsert time to complete)
5. Evaluate: localStorage.getItem('doppio_progress_v1') → record state
   Expected shape:
   {
     "level_1": {"card_1": true, "card_2": true, "card_3": true},
     "level_2": {"card_1": true, "card_2": true, "card_3": false},
     "level_3": {"card_1": false, "card_2": false, "card_3": false}
   }
6. Screenshot: save as 6-3-03-progress-after-5-cards.png

7. Close the tab context (or simulate via full reload)
8. Open a NEW Playwright context with the SAME browser storage (same browser profile)
   Note: Playwright contexts share localStorage by default within the same browser instance.
   Use `browser.newContext({ storageState })` if needed to pass storage between contexts.

9. Navigate to: https://doppio.kookyos.com
10. Wait for: page fully loaded
11. Verify: L1 shows all 3 checkmarks (cards 1–3 complete)
12. Verify: L2 shows 2 checkmarks (cards 1–2 complete, card 3 not)
13. Verify: L3 shows 0 checkmarks
14. Verify: progress bar reflects 5/9 total
15. Screenshot: save as 6-3-04-progress-restored-new-session.png
```

### Step 3: Test 3 — localStorage progress shape inspection

**Goal**: Verify the exact localStorage data structure.

```
1. Navigate to: https://doppio.kookyos.com
2. Complete L1C1, L1C2, L1C3 (full Level 1)
3. Evaluate and log:
   JSON.parse(localStorage.getItem('doppio_progress_v1'))
4. Verify shape matches exactly:
   {
     "level_1": {"card_1": true, "card_2": true, "card_3": true},
     "level_2": {"card_1": false, "card_2": false, "card_3": false},
     "level_3": {"card_1": false, "card_2": false, "card_3": false}
   }
5. Log the raw value to the results file
6. Verify: no extra keys present in the progress object
7. Verify: localStorage key is exactly `doppio_progress_v1` (not `doppio_progress` or other variant)
8. Screenshot: save as 6-3-05-localstorage-shape.png (DevTools Application tab view if available, otherwise note in results)
```

### Step 4: Test 4 — Supabase row count after full journey

**Goal**: Verify exactly 9 rows in `user_progress` after completing all 9 cards.

```
1. (Complete a full journey as in Task 6.1, or reuse a known-complete test user session)
2. Open Supabase Dashboard: https://supabase.com → your Doppio project
3. Navigate to: SQL Editor → New Query
4. Run the following SQL:

   SELECT count(*) as total_rows FROM public.user_progress;

5. Verify: count = 9 (one row per card for the test user)
   Note: This may show more rows if multiple test users have been created. In that case, run:

   SELECT user_id, count(*) as rows_per_user
   FROM public.user_progress
   GROUP BY user_id
   ORDER BY rows_per_user DESC
   LIMIT 5;

   Verify: at least one user has 9 rows.

6. Also run:
   SELECT user_id, level, card, completed_at
   FROM public.user_progress
   WHERE user_id = '<the test user UUID from Step 1>'
   ORDER BY level, card;

7. Verify: exactly 9 rows (level 1–3, card 1–3 for each level)
8. Verify: `completed_at` timestamps are plausible (recent)
9. Screenshot/copy: save query results as text in 6-3-results.md
```

### Step 5: Test 5 — Unique constraint enforcement

**Goal**: Verify that the `unique_user_level_card` constraint prevents duplicate progress rows.

Run the following SQL in the Supabase SQL Editor:

```sql
-- First: get the UUID of a known test user who has at least one progress row
-- (From Step 4 above)
-- Replace <user_uuid> with the actual UUID

-- Attempt to insert a duplicate row
INSERT INTO public.user_progress (user_id, level, card, completed_at)
VALUES ('<user_uuid>', 1, 1, now());
```

Expected result:
- Supabase returns an error: `duplicate key value violates unique constraint "unique_user_level_card"`
- The error code should be `23505` (PostgreSQL unique violation)

Verify this by checking the SQL Editor response.

Also test via the upsert path (which is what the app actually uses):

```sql
-- This should succeed silently (ignoreDuplicates = true in the app)
-- But verify via the JS client behavior

-- The app uses:
-- .upsert({ user_id, level, card, completed_at }, { onConflict: 'user_id,level,card', ignoreDuplicates: true })
-- This means a second insert of the same (user_id, level, card) is silently ignored
-- Verify: run the same card completion twice in Playwright:
```

Playwright test:

```
1. Navigate to: https://doppio.kookyos.com
2. Mark L1C1 complete
3. Wait 2 seconds
4. Click "Mark as done" on L1C1 AGAIN (it may be disabled — verify it's not double-counting)
5. Verify: progress bar did not go above 33% from double-clicking
6. Wait 2 seconds
7. In Supabase: verify still only 1 row for (user_id, level=1, card=1)
```

Document results in 6-3-results.md.

### Step 6: Test 6 — Offline progress + online sync

**Goal**: Verify that cards marked complete while offline sync to Supabase when the browser comes back online.

```
1. Start fresh Playwright session (new context)
2. Navigate to: https://doppio.kookyos.com
3. Wait for: page fully loaded and SW registered
4. Note: the anonymous user UUID (from localStorage auth session key)
5. Simulate offline: context.setOffline(true) OR CDP network offline

6. Verify: page still renders (SW cache serving app shell)
7. Mark L1C1 complete while offline:
   - Click "Mark as done"
   - Verify: checkmark appears immediately (localStorage write succeeded)
   - Verify: progress bar advances to 33%
   - Verify: NO error toast shown to user (silent failure on Supabase call)
8. Screenshot: save as 6-3-06-offline-card-complete.png

9. Mark L1C2 complete while offline:
   - Verify: checkmark appears
   - Progress bar advances to 66%

10. Restore online: context.setOffline(false)
11. Wait 3 seconds (allow Supabase sync on reconnect)
    Note: The app syncs on window.focus. Simulate by:
    evaluate: window.dispatchEvent(new Event('focus'))
    OR: just wait — the background async upsert may have queued and will retry

12. Navigate to Supabase Dashboard SQL Editor
13. Run:
    SELECT level, card FROM public.user_progress
    WHERE user_id = '<the test user UUID>'
    ORDER BY level, card;

14. Verify: rows exist for (level=1, card=1) and (level=1, card=2)
    Note: If the app does not retry failed upserts on reconnect, only the window.focus sync will
    push these rows. Trigger window.focus in Playwright:
    evaluate: window.dispatchEvent(new Event('focus'))
    Then wait 2 seconds and re-query Supabase.

15. Screenshot/log: Supabase query results in 6-3-results.md
16. Screenshot: save as 6-3-07-online-sync-verified.png
```

### Step 7: Test 7 — window.focus sync trigger

**Goal**: Verify that switching back to the Doppio tab (simulated via focus event) triggers Supabase sync.

```
1. Start fresh Playwright session
2. Navigate to: https://doppio.kookyos.com
3. Mark L1C1, L1C2 complete (from device A simulation)
4. Wait 2 seconds (Supabase upsert completes)

5. MANUALLY insert a row for L1C3 directly in Supabase SQL Editor:
   INSERT INTO public.user_progress (user_id, level, card, completed_at)
   VALUES ('<user_uuid>', 1, 3, now());

6. In Playwright: trigger window focus:
   evaluate: window.dispatchEvent(new Event('focus'))
7. Wait 2 seconds

8. Verify: L1C3 now shows checkmark in the UI (pulled from Supabase)
9. Verify: progress bar shows 3/3 for Level 1 (100%)
10. Screenshot: save as 6-3-08-window-focus-sync.png
```

### Step 8: Document results

Create `.claude/orchestration-doppio/reports/e2e-screenshots/6-3-results.md`:

Include:
- Test 1 (auth re-init): user UUID before/after clear — PASS/FAIL
- Test 2 (close + restore): progress shape verified — PASS/FAIL
- Test 3 (localStorage shape): exact JSON value logged — PASS/FAIL
- Test 4 (row count): SQL results pasted — PASS/FAIL
- Test 5 (unique constraint): error message received — PASS/FAIL
- Test 6 (offline sync): rows appeared after reconnect — PASS/FAIL
- Test 7 (window.focus sync): checkmark appeared after manual insert — PASS/FAIL
- Any bugs found, fixes applied, redeployment confirmation

### Step 9: Bug fix and redeploy protocol

If any step fails:

1. For auth issues: check `src/lib/auth.ts` — `getOrCreateAnonUser()` pattern
2. For sync issues: check `src/lib/progress.ts` — `markCardComplete()`, `syncFromSupabase()`
3. For schema issues: check Supabase Dashboard — table schema, RLS policies
4. For hook issues: check `src/hooks/useProgress.ts`
5. Fix, build (`npm run build`), redeploy (`vercel --prod`)
6. Re-run failing test
7. Document

## Files to Create

- `.claude/orchestration-doppio/reports/e2e-screenshots/6-3-01-auth-reinit-after-clear.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-3-02-new-anon-user-after-full-clear.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-3-03-progress-after-5-cards.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-3-04-progress-restored-new-session.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-3-05-localstorage-shape.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-3-06-offline-card-complete.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-3-07-online-sync-verified.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-3-08-window-focus-sync.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-3-results.md`

## Files to Modify

Only if bugs are found:
- `src/lib/auth.ts` — auth initialization logic
- `src/lib/progress.ts` — `markCardComplete()`, `syncFromSupabase()`
- `src/hooks/useProgress.ts` — React hook state management
- `src/App.tsx` — mount-time auth + window.focus listener

## Contracts

### Provides (for downstream tasks)

- Confirmed: anonymous auth works and is stable on production
- Confirmed: progress saves to localStorage immediately
- Confirmed: Supabase receives all 9 rows after full journey
- Confirmed: unique constraint blocks duplicate rows
- Confirmed: offline progress syncs when back online
- SQL query results documented in 6-3-results.md

### Consumes (from upstream tasks)

- Task 1.3: Supabase schema, RLS, anonymous auth enabled
- Task 3.4: progress hook implementation
- Task 6.1: production confirmed functional (prerequisite)

## Acceptance Criteria

- [ ] Clearing `doppio_progress_v1` key from localStorage resets progress to zero on reload
- [ ] Clearing all localStorage creates a new anonymous user UUID on reload (new user, not error)
- [ ] Supabase auth session key persists across page reloads (same UUID until full clear)
- [ ] Marking 5 cards complete and reloading restores exactly 5 checkmarks
- [ ] localStorage `doppio_progress_v1` shape is exactly as specified in skill (nested level/card booleans)
- [ ] Supabase has exactly 9 rows after completing all 9 cards (one row per card per user)
- [ ] Inserting a duplicate (level=1, card=1) row directly via SQL returns unique constraint error
- [ ] Marking same card complete twice does NOT create 2 Supabase rows
- [ ] Marking cards offline shows checkmarks immediately (localStorage write succeeds)
- [ ] No user-visible error when offline + card marked complete
- [ ] After coming back online + window.focus event: offline-marked cards appear in Supabase
- [ ] Manual Supabase insert triggers checkmark in UI after window.focus
- [ ] All 8 screenshots saved to `reports/e2e-screenshots/`
- [ ] `6-3-results.md` documents all SQL results and pass/fail

## Testing Protocol

### External Service Verification

**Supabase SQL Editor queries to run:**

```sql
-- 1. Count all progress rows
SELECT count(*) as total_rows FROM public.user_progress;

-- 2. Rows per user (to identify test user)
SELECT user_id, count(*) as rows_per_user
FROM public.user_progress
GROUP BY user_id
ORDER BY rows_per_user DESC
LIMIT 10;

-- 3. Full progress for a specific user
SELECT user_id, level, card, completed_at
FROM public.user_progress
WHERE user_id = '<uuid>'
ORDER BY level, card;

-- 4. Unique constraint test (run this — expect error 23505)
INSERT INTO public.user_progress (user_id, level, card, completed_at)
VALUES ('<uuid>', 1, 1, now());
-- Expected: ERROR: duplicate key value violates unique constraint "unique_user_level_card"

-- 5. Verify analytics_events table also exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Expected: both user_progress and analytics_events present
```

### Browser Testing (Playwright MCP)

- Target URL: `https://doppio.kookyos.com`
- Viewport: 1440×900
- Key evaluate calls:

```javascript
// Check localStorage progress
JSON.parse(localStorage.getItem('doppio_progress_v1'))

// Check Supabase session key exists
Object.keys(localStorage).filter(k => k.includes('auth-token'))

// Trigger window focus sync
window.dispatchEvent(new Event('focus'))

// Check offline
// context.setOffline(true) — use Playwright context method, not evaluate
```

### Build/Lint/Type Checks

Only if a bug fix is applied:

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors in `src/lib/auth.ts`, `src/lib/progress.ts`, `src/hooks/useProgress.ts`

## Skills to Read

- `supabase-anonymous-progress` — complete implementation reference (auth, schema, RLS, hook, sync)
- `doppio-architecture` — file locations

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D24–D26 (Supabase schema), D54 (auth failure handling), D57 (no reset button), D59 (rate limits)

## Git

- Branch: `main` (testing only)
- Commit message prefix (if fix needed): `Fix(6.3):`
