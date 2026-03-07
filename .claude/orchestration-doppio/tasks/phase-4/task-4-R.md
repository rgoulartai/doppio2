# Task 4.R: Phase 4 Regression

## Objective

Deploy Phase 4 to production and run a full end-to-end regression of the complete user journey: landing page → Level 1 (3 cards) → Level 1 completion screen → Level 2 (3 cards) → Level 2 completion screen → Level 3 (3 cards) → Level 3 completion screen → `/complete` final screen. Verify confetti at each level completion, share buttons, resource links, and PWA install prompts. Fix any failures before marking this task done.

## Context

Phase 4 Regression is the final gate before Phase 5 begins. All gamification, level flow, and PWA prompts must work end-to-end on the live production URL `https://doppio.kookyos.com`. This task runs on production only — not localhost — because PWA install prompts require HTTPS and a valid deployed manifest, and because Supabase anonymous auth must be verified on the production domain.

## Dependencies

- Task 4.1 — Level Navigation & Card Flow (complete)
- Task 4.2 — Level Completion Screen (complete)
- Task 4.3 — Final Completion Screen (complete)
- Task 4.4 — PWA Install Prompts (complete)

## Blocked By

- All Phase 4 tasks (4.1, 4.2, 4.3, 4.4) must be complete before this regression runs

## Research Findings

Key references for this regression task:

- From `DISCOVERY.md D52`: "Done" criteria include: all 3 levels with 9 cards playable, progress persists across refresh, Supabase sync works, PWA installs on iOS/Android, level completion confetti + screen works, final "You're an AI Manager!" screen with share badge + resource links.
- From `PHASES.md` Phase 4 section: Regression testing steps — deploy `vercel --prod`, Playwright production full journey, confetti fires at L1/L2/L3, share button works, `/complete` route renders resource links, all 9 `user_progress` rows present after full journey, screenshots of each completion screen.
- From `canvas-confetti-gamification SKILL.md §2`: Confetti fires 3 times total across the journey — once per level completion screen. Never fires on individual card completions.
- From `pwa-vite-setup SKILL.md §10`: Chrome DevTools Application > Manifest verification, Lighthouse PWA audit.

## Implementation Plan

This task is testing-only. No new code is written unless failures are found during testing. If a failure is found, fix it, commit, redeploy, and retest.

### Step 1: Deploy to production

```bash
vercel --prod
```

Wait for deployment to complete. Confirm the deployment URL is `https://doppio.kookyos.com` or a Vercel preview URL that matches the production branch.

### Step 2: Verify build health

Before running Playwright tests:

```bash
# Confirm no TypeScript errors
npm run build

# Check for any new ESLint errors
npm run lint  # (if lint script exists)
```

### Step 3: Run Phase 4 regression checklist on production

Execute all test cases below using Playwright MCP targeting `https://doppio.kookyos.com`.

### Step 4: Fix any failures

For each failing criterion:
1. Identify the root cause in source code
2. Fix the issue
3. `npm run build` to verify fix compiles
4. `git add <changed files> && git commit -m "Task 4.R: fix <issue>"`
5. `vercel --prod` to redeploy
6. Re-run the failing test(s) on production

### Step 5: Capture screenshots

Take a Playwright screenshot of each of these screens on production:
- Landing page (`/`)
- `/learn` with Level 1 active (0 cards complete)
- `/learn` with Level 1 all 3 cards complete (just before completion screen)
- Level 1 completion screen overlay
- Level 2 completion screen overlay
- Level 3 completion screen overlay (on `/learn?level=3`)
- `/complete` final page (full page including resource links section)
- iOS install banner (with Chrome mobile emulation, iPhone user agent)

Save screenshots to: `.claude/orchestration-doppio/reports/phase-4-regression/`

## Files to Create

- `.claude/orchestration-doppio/reports/phase-4-regression/*.png` — screenshots of each major screen

## Files to Modify

- Any source files with bugs found during regression testing (commit separately from screenshots)

## Contracts

### Provides (for downstream tasks)

- Phase 4 confirmed working on production
- Phase 5 (Analytics & Polish) may begin after this regression passes
- Screenshots provide visual baseline for Phase 5 mobile polish task

### Consumes (from upstream tasks)

- All Phase 4 tasks (4.1, 4.2, 4.3, 4.4) — must all be complete and deployed

## Acceptance Criteria

### Deployment

- [ ] `vercel --prod` succeeds with no build errors
- [ ] `https://doppio.kookyos.com` loads in Playwright (HTTP 200, no blank screen)
- [ ] `npm run build` exits 0 locally

### Level Navigation (Task 4.1)

- [ ] `/learn` renders Level 1 by default on fresh session (cleared localStorage)
- [ ] `/learn?level=2` renders Level 2 active tab
- [ ] `/learn?level=3` renders Level 3 active tab
- [ ] All 3 level tabs visible: 🌱 Beginner, ⚡ Intermediate, 🚀 Advanced
- [ ] Clicking a tab switches the card list to the correct level
- [ ] Top bar shows "Doppio" logo and "N of 9 complete" counter
- [ ] Progress bar visible under tabs, shows correct fraction for active level

### Level Completion Screens (Task 4.2)

- [ ] Completing all 3 Level 1 cards triggers Level 1 completion overlay immediately
- [ ] Canvas confetti element present in DOM when Level 1 overlay appears
- [ ] Level 1 overlay headline: "Level 1 Complete!"
- [ ] Level 1 overlay CTA: "Start Level 2"
- [ ] Clicking "Start Level 2": overlay dismissed, Level 2 tab becomes active
- [ ] Completing all 3 Level 2 cards triggers Level 2 completion overlay
- [ ] Level 2 overlay headline: "Level 2 Complete!"
- [ ] Level 2 overlay CTA: "Start Level 3"
- [ ] Completing all 3 Level 3 cards triggers Level 3 completion overlay
- [ ] Level 3 overlay headline: "You're an AI Manager! 🎉"
- [ ] Level 3 overlay CTA: "See Your Badge" (navigates to /complete)
- [ ] No completion screen auto-dismisses (wait 5 seconds — still visible)
- [ ] "Share" button on completion screen: triggers share or clipboard + toast

### Final Completion Screen (Task 4.3)

- [ ] `/complete` route renders without error
- [ ] Double confetti burst fires on `/complete` mount (center burst + side cannons)
- [ ] Headline: "You're an AI Manager! 🎉"
- [ ] Subheadline: "You just transformed how you work. Forever."
- [ ] "Share My Badge" button visible above fold on 390px viewport
- [ ] "Share My Badge" clipboard fallback toast appears on desktop
- [ ] 5 resource links rendered in "Keep Learning" section
- [ ] Each resource link has emoji + title + description
- [ ] Resource links open in new tab (verified by checking `target="_blank"` attribute)

### PWA Install Prompts (Task 4.4)

- [ ] iOS emulation (iPhone UA): `IOSInstallBanner` visible at bottom of landing page
- [ ] iOS banner shows "Add to Home Screen" instruction
- [ ] iOS banner dismiss: ✕ button hides banner
- [ ] iOS banner dismissal persists in `localStorage['doppio_install_dismissed_v1']`
- [ ] iOS banner does NOT reappear after reload (post-dismiss)
- [ ] Standalone simulation: banner NOT shown when `navigator.standalone === true`
- [ ] Production Android Chrome: Chrome DevTools Application > Manifest shows "Installable" badge

### Progress Persistence

- [ ] After completing all 9 cards: Supabase Dashboard shows 9 rows in `user_progress` for the test session's anonymous user
- [ ] Refresh mid-journey: progress restored from localStorage (no regression)
- [ ] Top bar counter "N of 9 complete" accurate throughout the journey

### No Regressions

- [ ] No console errors on any of: `/`, `/learn`, `/learn?level=2`, `/learn?level=3`, `/complete`
- [ ] No TypeScript compile errors
- [ ] No missing imports or broken module references

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npm run build` succeeds (run before deploying)
- [ ] `tsc --noEmit` passes

### Full Journey Playwright Test — Production

Start: Production URL `https://doppio.kookyos.com`

**Step 0: Verify deployment is live**
- Run: `vercel --prod` and wait for the deployment URL to be printed
- Navigate to https://doppio.kookyos.com in Playwright
- Verify the page returns HTTP 200 and has a `<title>` tag containing 'Doppio'
- Only proceed with regression tests after this passes

**Full journey (automated, simulates real user):**

1. Navigate to `https://doppio.kookyos.com/learn`
2. Clear localStorage (to simulate fresh user): `localStorage.clear()`
3. Reload page
4. Verify: Level 1 active, "0 of 9 complete" in top bar
5. Screenshot: Level 1 landing state

**Level 1 completion flow:**
6. For each of the 3 Level 1 cards: click "Mark as done" / completion trigger
7. After card 1: verify progress bar at ~33%, "1 of 9 complete"
8. After card 2: verify progress bar at ~67%, "2 of 9 complete"
9. After card 3: Level 1 completion overlay appears
10. Screenshot: Level 1 completion screen
11. Verify: Canvas element in DOM (confetti)
12. Verify: Headline "Level 1 Complete!"
13. Click "Start Level 2"
14. Verify: Overlay gone, Level 2 tab active

**Level 2 completion flow:**
15. Complete all 3 Level 2 cards
16. Level 2 completion overlay appears
17. Screenshot: Level 2 completion screen
18. Verify: Headline "Level 2 Complete!"
19. Click "Start Level 3"

**Level 3 completion flow:**
20. Complete all 3 Level 3 cards
21. Level 3 completion overlay appears
22. Screenshot: Level 3 completion screen overlay
23. Verify: Headline "You're an AI Manager! 🎉"
24. Click "See Your Badge"
25. Verify: URL is now `https://doppio.kookyos.com/complete`

**/complete screen:**
26. Verify: "You're an AI Manager! 🎉" headline
27. Verify: Double confetti (canvas element present)
28. Verify: "Share My Badge" button visible
29. Click "Share My Badge" → verify toast appears
30. Scroll down → verify 5 resource links visible
31. Screenshot: /complete page (above fold)
32. Screenshot: /complete page scrolled to resource links

**Share button regression:**
33. On a completion screen (any level), click "Share"
34. Verify: `navigator.share()` called OR clipboard write called (no uncaught errors)
35. Verify: Toast "Link copied! Share your progress 🎉" appears if clipboard path taken

**Progress persistence:**
36. After completing all 9 cards, refresh the page (`/complete`)
37. Navigate to `/learn`
38. Verify: All 3 level tabs show ✓ checkmark
39. Verify: Top bar shows "9 of 9 complete"
40. Open Supabase Dashboard (or run SQL query): `SELECT count(*) FROM user_progress WHERE user_id = '<anonymous_uid>'` → must equal 9

**PWA install prompts:**
41. Set Playwright viewport to iPhone 12 (390×844), set user agent to iOS Safari
42. Navigate to `https://doppio.kookyos.com/`
43. Verify: `IOSInstallBanner` component in DOM
44. Screenshot: iOS install banner on landing page
45. Click ✕ on banner → verify hidden
46. Reload → verify banner does not reappear
47. Check `localStorage.getItem('doppio_install_dismissed_v1')` equals `'true'`

**Mobile regression (390px viewport):**
48. On all screens: verify no horizontal overflow (no `document.documentElement.scrollWidth > 390`)
49. Verify level tabs fit in 390px without text clipping
50. Verify completion screen buttons are fully visible and above fold

### Screenshot Inventory (save to `.claude/orchestration-doppio/reports/phase-4-regression/`)

| Filename | Screen | Viewport |
|----------|--------|----------|
| `01-learn-level1-fresh.png` | `/learn` Level 1, 0 complete | 390×844 |
| `02-level1-complete-screen.png` | Level 1 completion overlay | 390×844 |
| `03-level2-complete-screen.png` | Level 2 completion overlay | 390×844 |
| `04-level3-complete-screen.png` | Level 3 completion overlay | 390×844 |
| `05-complete-page-hero.png` | `/complete` above fold | 390×844 |
| `06-complete-page-resources.png` | `/complete` scrolled to resources | 390×844 |
| `07-ios-install-banner.png` | Landing page with iOS banner | 390×844 |
| `08-learn-all-complete.png` | `/learn` with all 9 complete (all ✓ tabs) | 390×844 |

### External Service Verification

- **Supabase Dashboard**: After completing the full journey, query:
  ```sql
  SELECT level, card, completed_at
  FROM user_progress
  WHERE user_id = auth.uid()
  ORDER BY level, card;
  ```
  Verify: 9 rows total (level 1 cards 1-3, level 2 cards 1-3, level 3 cards 1-3)

- **Chrome DevTools Application tab** (on production):
  - Manifest section: all fields populated, "Installable" badge green
  - Service Workers: SW active and running
  - No red errors in Manifest or SW sections

## Skills to Read

- `canvas-confetti-gamification` — verify confetti implementation and level completion screen behavior
- `pwa-vite-setup` — verify PWA install prompt conditions and testing methodology (Section 10)
- `doppio-architecture` — orientation to codebase for debugging any issues found

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D52 (done criteria checklist)
- `.claude/orchestration-doppio/PHASES.md` — Phase 4 section and Task 4.R testing list

## Git

- Branch: `phase-4/regression` (or merge all Phase 4 branches first)
- Commit message prefix: `Task 4.R:`
- Any bug fixes from regression: `Task 4.R: fix <short description>`
