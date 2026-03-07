# Task 6.1: Full User Journey E2E

## Objective

Run the complete Doppio user journey on the live production URL using Playwright, simulating a real non-technical user from first landing to the final "You're an AI Manager!" screen. This task verifies that every step of the learning path works end-to-end, that performance is acceptable (LCP < 3s), and that progress persists correctly across a mid-journey page refresh. If any failure is found, the agent must diagnose the root cause, fix the code, redeploy to production, and re-verify.

## Context

This is the first task in Phase 6, the final E2E testing phase. All implementation and polish phases (1–5) are complete. This task runs exclusively against `https://doppio.kookyos.com` — NOT localhost. It is the primary end-to-end smoke test covering the full happy path. Tasks 6.2–6.5 each cover a specific angle (device emulation, persistence, analytics, performance) but this task is the definitive proof the complete user journey works.

## Dependencies

- All Phase 5 tasks complete (5.1, 5.2, 5.3, 5.4)
- Phase 5 regression (5.R) complete
- Production deployment live at `https://doppio.kookyos.com`

## Blocked By

- Phase 5 regression task (5.R)

## Research Findings

Key findings relevant to this task:

- From DISCOVERY.md D2: Production URL is `https://doppio.kookyos.com` — this is the only URL to test against in Phase 6.
- From DISCOVERY.md D14: 3 levels × 3 cards = 9 cards total. Completing all 9 = full journey.
- From DISCOVERY.md D16: Each card has: title, embedded video (facade pattern), "Try it" CTA, and "Mark as done" completion trigger.
- From DISCOVERY.md D17: Level 1 CTAs open ChatGPT, Level 2 open Claude.ai, Level 3 open Claude Cowork + Perplexity.
- From DISCOVERY.md D25: localStorage is source of truth. Supabase syncs in background. Progress survives refresh from localStorage instantly.
- From DISCOVERY.md D38: Confetti fires on level completion (particleCount 80–120). Never fires on every card.
- From DISCOVERY.md D41: Level completion screen: full-screen overlay, confetti on mount, "Continue to Level N+1" CTA and "Share" button. NEVER auto-dismisses.
- From DISCOVERY.md D42: Final screen: "You're an AI Manager!" + double confetti + share badge + 5 resource links.
- From DISCOVERY.md D43: Share badge URL: `https://doppio.kookyos.com/?ref=badge`. Web Share API + clipboard fallback.
- From PHASES.md Phase 6: LCP target < 3 seconds. Screenshots saved to `.claude/orchestration-doppio/reports/e2e-screenshots/`.

## Implementation Plan

This is a testing task. There is no new code to write unless a bug is found. The agent executes a scripted Playwright session against production, captures screenshots, and documents results.

### Step 1: Prepare screenshot directory

Create the screenshot output directory if it does not exist:

```
/Users/renatosgafilho/Projects/KOOKY/Doppio/.claude/orchestration-doppio/reports/e2e-screenshots/
```

All screenshots from this task are saved there with descriptive filenames prefixed `6-1-`.

### Step 2: Clear production state (fresh run)

Before starting the journey, ensure a clean test state. Use Playwright to:

1. Navigate to `https://doppio.kookyos.com`
2. Open the browser console
3. Execute: `localStorage.clear(); sessionStorage.clear();`
4. Reload the page

This ensures the journey starts from zero progress, simulating a brand new user.

### Step 3: Landing page — load timing + screenshot

Playwright actions:

```
1. Start navigation timer
2. Navigate to: https://doppio.kookyos.com
3. Wait for: networkidle (or DOMContentLoaded + 1s)
4. Stop timer — record LCP proxy (time to interactive)
5. Wait for selector: h1 (headline text visible)
6. Evaluate: document.querySelector('h1').textContent → must contain "20 minutes"
7. Evaluate: document.querySelector('video') → must exist (teaser video element)
8. Verify: "Start Level 1" CTA button is visible
9. Screenshot: save as 6-1-01-landing.png
```

Timing assertion: total load time from navigation start to DOMContentLoaded must be under 3000ms. Log the actual value.

### Step 4: Start Level 1

```
1. Click: "Start Level 1" CTA button
2. Wait for URL to contain: /learn
3. Wait for: Level 1 cards visible (look for level heading or first video facade)
4. Verify: page shows "Beginner" level heading (or Level 1 tab active)
5. Verify: 3 video card facades visible
6. Verify: progress bar shows 0 of 3 complete
7. Screenshot: save as 6-1-02-level1-start.png
```

### Step 5: Level 1, Card 1 — video facade + Try it + completion

```
1. Scroll to Card 1 (L1C1)
2. Screenshot: save as 6-1-03-level1-card1-facade.png
3. Click: video facade / play button on L1C1
4. Wait for: iframe to appear (YouTube lite-embed or TikTok iframe loaded)
5. Verify: facade is no longer the only visible element (iframe rendered)
6. Screenshot: save as 6-1-04-level1-card1-video-loaded.png

7. Click: "Try it in ChatGPT" button (or "Try it →" button)
8. Wait for: new tab to open (or window.open called)
9. Verify: toast notification appears ("Prompt copied" or similar)
10. Screenshot: save as 6-1-05-level1-card1-tryit-toast.png
11. Close the newly opened tab (switch back to main tab)

12. Click: "Mark as done" button on L1C1
13. Verify: checkmark overlay visible on L1C1 (green circle with checkmark)
14. Verify: progress bar advances to ~33% (1 of 3 cards complete)
15. Screenshot: save as 6-1-06-level1-card1-complete.png
```

### Step 6: Level 1, Cards 2 and 3 — complete remaining cards

For L1C2:
```
1. Click: "Mark as done" on L1C2 (video play optional — just mark complete)
2. Verify: checkmark visible on L1C2
3. Verify: progress bar advances to ~66%
```

For L1C3:
```
1. Click: "Mark as done" on L1C3
2. Verify: checkmark visible on L1C3
3. Verify: progress bar advances to 100% / 3 of 3
```

### Step 7: Level 1 completion screen

```
1. Wait for: level completion overlay to appear (triggered by completing all 3 L1 cards)
2. Verify: full-screen overlay is visible (not auto-dismissed)
3. Verify: confetti fires (canvas element exists in DOM, or particles visible)
4. Verify: headline contains "Level 1 Complete" (and "Beginner" or seedling emoji)
5. Verify: "Continue" button visible (labeled "Start Level 2" or "Continue to Level 2")
6. Verify: "Share" button visible
7. Screenshot: save as 6-1-07-level1-completion-screen.png

8. Click: "Share" button
9. Verify: toast appears ("Link copied" or native share dialog)
10. Screenshot: save as 6-1-08-level1-share-toast.png

11. Click: "Continue to Level 2" button (or "Start Level 2")
12. Verify: overlay dismissed, Level 2 cards visible
13. Verify: Level 2 tab/heading is active
14. Screenshot: save as 6-1-09-level2-start.png
```

### Step 8: Level 2 — complete all 3 cards

```
For each of L2C1, L2C2, L2C3:
  1. Click "Try it in Claude" on at least one L2 card (verify new tab opens)
  2. Click "Mark as done"
  3. Verify checkmark appears

After all 3 complete:
  1. Wait for: Level 2 completion overlay
  2. Verify: headline contains "Level 2 Complete"
  3. Verify: confetti fires
  4. Screenshot: save as 6-1-10-level2-completion-screen.png
  5. Click "Continue to Level 3"
  6. Screenshot: save as 6-1-11-level3-start.png
```

### Step 9: Mid-journey refresh — progress persistence test

Before completing Level 3, test that progress survives a refresh:

```
1. Current state: Levels 1 and 2 fully complete, Level 3 not started
2. Refresh the page (window.location.reload())
3. Wait for: page fully loaded
4. Verify: Level 1 and 2 cards still show checkmarks (progress restored from localStorage)
5. Verify: progress bar reflects completed state
6. Verify: no loading spinner or flash of empty state
7. Screenshot: save as 6-1-12-progress-restored-after-refresh.png
8. Navigate back to Level 3
```

### Step 10: Level 3 — complete all 3 cards

```
For each of L3C1, L3C2, L3C3:
  1. Click "Try it" on at least L3C1 (verify it opens Claude Cowork or Perplexity — NOT ChatGPT)
  2. Click "Mark as done"
  3. Verify checkmark

After L3C3 complete:
  1. Verify: Level 3 completion does NOT show the standard "Level N Complete" screen
  2. Instead: final completion screen appears (or navigate to /complete)
  3. Screenshot: save as 6-1-13-final-screen.png
```

### Step 11: Final "You're an AI Manager!" screen

```
1. Verify: headline contains "You're an AI Manager!" (exact or near-exact)
2. Verify: confetti fires (more intense — double burst expected)
3. Verify: share badge button visible
4. Verify: 5 resource links visible (count them)
5. Verify: each resource link has a title and is clickable
6. Screenshot: save as 6-1-14-final-screen-resources.png

7. Click: share badge button
8. Verify: toast ("Link copied" or native share) OR native share dialog opens
9. Evaluate: clipboard content (if clipboard API available) → must contain "doppio.kookyos.com/?ref=badge"
10. Screenshot: save as 6-1-15-final-share-toast.png

11. Click: first resource link
12. Verify: opens in new tab
13. Close new tab, return to main
```

### Step 12: Badge ref link verification

```
1. Navigate to: https://doppio.kookyos.com/?ref=badge
2. Wait for: page load
3. Verify: badge banner visible — use selector [data-testid="badge-banner"]
4. Verify: banner text matches exactly: "🎉 Someone completed Doppio and became an AI Manager! Start your journey →"
5. Screenshot: save as 6-1-16-badge-ref-landing.png
```

### Step 13: Document results

After all steps complete, create a results file at:
`.claude/orchestration-doppio/reports/e2e-screenshots/6-1-results.md`

Include:
- Pass/Fail status for each major step
- Actual LCP timing measured
- List of screenshots captured
- Any bugs found (with description and fix applied)
- If any fix was applied: git commit hash and Vercel deployment URL

### Step 14: Bug fix and redeploy protocol

If any Playwright assertion fails:

1. Identify the failing component from the stack trace and screenshot
2. Navigate to the relevant source file in the Doppio project
3. Fix the bug (minimal surgical change)
4. Run `npm run build` to verify the fix compiles
5. Run `vercel --prod` to redeploy
6. Wait for deployment to complete (poll `https://doppio.kookyos.com`)
7. Re-run the failing test step(s) to verify the fix
8. Document the bug and fix in the results file

## Files to Create

- `.claude/orchestration-doppio/reports/e2e-screenshots/` (directory)
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-01-landing.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-02-level1-start.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-03-level1-card1-facade.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-04-level1-card1-video-loaded.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-05-level1-card1-tryit-toast.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-06-level1-card1-complete.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-07-level1-completion-screen.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-08-level1-share-toast.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-09-level2-start.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-10-level2-completion-screen.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-11-level3-start.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-12-progress-restored-after-refresh.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-13-final-screen.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-14-final-screen-resources.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-15-final-share-toast.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-16-badge-ref-landing.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-1-results.md`

## Files to Modify

Only if bugs are found during testing:
- `src/` — whichever component or hook contains the bug
- After fix: `vercel --prod` redeploy required

## Contracts

### Provides (for downstream tasks)

- Confirmed: full user journey is functional on production
- Screenshots: 16 production screenshots in `reports/e2e-screenshots/`
- `6-1-results.md`: documented pass/fail for each step
- Confirmed: LCP timing measurement (actual value documented)

### Consumes (from upstream tasks)

- Production deployment from Phase 5 regression (5.R)
- All 9 cards implemented and functional (Phases 2–4)
- Analytics firing (Phase 5.1)
- Progress hook (`useProgress`) from Task 3.4
- Level completion screens from Task 4.2
- Final completion screen from Task 4.3

## Acceptance Criteria

- [ ] Landing page loads and LCP proxy is under 3000ms (logged)
- [ ] "Start Level 1" CTA navigates to `/learn`
- [ ] L1C1 video facade visible; clicking play loads the iframe
- [ ] "Try it in ChatGPT" opens new tab to `chat.openai.com` domain
- [ ] Toast notification appears after Try it click
- [ ] "Mark as done" on L1C1 shows checkmark and advances progress bar to ~33%
- [ ] Completing all 3 L1 cards triggers Level 1 completion screen
- [ ] Level 1 completion screen shows confetti, headline, Continue and Share buttons
- [ ] Share button on L1 completion triggers toast or native share dialog
- [ ] Continuing from L1 completion shows Level 2 cards
- [ ] All Level 2 cards completable; Level 2 completion screen appears
- [ ] Page refresh mid-journey restores progress from localStorage (no blank state)
- [ ] All Level 3 cards completable; final "You're an AI Manager!" screen appears
- [ ] Final screen shows: headline, confetti, share badge button, 5 resource links
- [ ] Share badge button produces clipboard content or native share with badge URL
- [ ] `/?ref=badge` route shows the badge banner (`[data-testid="badge-banner"]` present, text: "🎉 Someone completed Doppio and became an AI Manager! Start your journey →")
- [ ] All 16 screenshots saved to `reports/e2e-screenshots/`
- [ ] `6-1-results.md` documents all results

## Testing Protocol

### Browser Testing (Playwright MCP)

- Target URL: `https://doppio.kookyos.com`
- Viewport: 1440×900 (desktop default for this task; mobile tested in 6.2)
- Start: Navigate to production URL directly
- Pre-condition: Clear localStorage and sessionStorage before starting

**User-emulating flow** (real non-technical user simulation):

1. User opens `https://doppio.kookyos.com` for the first time
2. Sees headline "20 minutes from ChatGPT user to AI manager"
3. Sees the teaser video playing (muted, autoplay)
4. Clicks "Start Level 1"
5. Lands on the learn page, sees 3 video card facades
6. Clicks play on card 1 video — watches it (simulated: just click and verify iframe loads)
7. Clicks "Try it in ChatGPT" — new tab opens, toast appears
8. Returns to main tab
9. Clicks "Mark as done" on card 1
10. Repeats for cards 2 and 3 in Level 1
11. Sees the Level 1 completion screen with confetti
12. Clicks Share, sees toast
13. Clicks "Start Level 2"
14. Completes all 3 Level 2 cards
15. Sees Level 2 completion screen
16. Continues to Level 3
17. Refreshes the page intentionally (tests that progress is saved)
18. Verifies all progress is still there
19. Completes all 3 Level 3 cards
20. Arrives at "You're an AI Manager!" screen
21. Clicks Share badge button
22. Scrolls down to see all 5 resource links
23. Clicks first resource link (verifies opens in new tab)
24. Navigates to `/?ref=badge` (simulates someone clicking a shared link)

**Key assertions per Playwright call:**

```
waitForSelector('h1')                          → headline visible
evaluate(() => performance.now())              → timing
waitForURL('**/learn**')                       → navigation
waitForSelector('[data-testid="video-facade"]') → facade present (or equivalent selector)
waitForSelector('iframe')                      → video loaded
waitForSelector('[role="alert"]')              → toast visible
waitForSelector('.checkmark, [data-done]')     → card marked complete
waitForSelector('[data-level-complete]')        → completion overlay
evaluate(() => localStorage.getItem('doppio_progress_v1'))  → progress shape
```

Note: Prefer `data-testid` selectors where available:
- `[data-testid="badge-banner"]` → badge referral banner (use this, not text matching)
- `getByText('Start Level 1')` → CTA button
- `getByText('Mark as done')` → completion button
- `getByText("You're an AI Manager")` → final screen
- `getByText('Try it in ChatGPT')` → Try it button

**Screenshots**: Take screenshot at every major milestone (16 total as listed above).

### Build/Lint/Type Checks

Only run if a bug fix is applied:

- [ ] `npm run build` succeeds in the Doppio project root
- [ ] No TypeScript errors introduced by any fix

## Skills to Read

- `doppio-architecture` — overall file structure and data flows (orientation)
- `supabase-anonymous-progress` — progress hook behavior for understanding what to verify in localStorage
- `canvas-confetti-gamification` — confetti behavior and level completion screen contracts

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D14–D19 (content structure), D25 (localStorage), D37–D43 (gamification UX), D52 (success criteria)
- `.claude/orchestration-doppio/PHASES.md` — Phase 6 section (testing requirements)

## Git

- Branch: `main` (testing only — no new branch unless a bug fix requires a commit)
- Commit message prefix (if fix needed): `Fix(6.1):`
