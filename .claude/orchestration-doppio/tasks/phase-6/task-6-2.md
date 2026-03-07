# Task 6.2: Cross-Device + PWA Install Test

## Objective

Verify that Doppio looks correct and is installable as a PWA on both iOS (iPhone 12 Pro emulation) and Android (Pixel 5 emulation) using Playwright device emulation. Run a Lighthouse PWA installability audit on the production URL and confirm the installability score is green. If any visual or installability failure is found, diagnose the root cause, fix the code, redeploy, and re-verify.

## Context

This task follows Task 6.1 (full user journey E2E). Where 6.1 focuses on functional completeness at desktop viewport, this task focuses on device-specific behavior: mobile viewports, PWA install banners (iOS custom banner vs. Android BeforeInstallPromptEvent), and the Lighthouse PWA audit. The PWA install experience is a core feature of Doppio (D33, D34) and must work correctly before hackathon submission.

## Dependencies

- Task 6.1 complete (production confirmed functional)
- PWA setup from Task 1.2 (manifest, SW, icons)
- iOS install banner from Task 4.4 (`IOSInstallBanner.tsx`)
- Android install hook from Task 4.4 (`useInstallPrompt.ts`)

## Blocked By

- Task 6.1

## Research Findings

- From DISCOVERY.md D33: iOS Safari — custom instructional banner. Detect: `isIOS && isSafari && !isStandalone`. Show "Add to Home Screen" step-by-step instructions.
- From DISCOVERY.md D34: Android Chrome — capture `BeforeInstallPromptEvent`, defer it, show custom "Install App" button. Chrome 115+ fires on first visit.
- From DISCOVERY.md D35: Offline behavior: app shell cached via SW. Videos show "Connect to watch" message when offline.
- From DISCOVERY.md D36: PWA icon requirements: opaque background, apple-touch-icon meta tags in `<head>`, all sizes generated.
- From PHASES.md Task 1.2 / 5.3: Chrome Lighthouse PWA audit should be "all green" (installable).
- From PHASES.md Task 5.4: iPhone 12 Pro (390×844), full journey tested at 390px width.
- From PHASES.md Task 4.4: `doppio_install_dismissed_v1` in localStorage tracks if banner was dismissed.
- From PHASES.md Task 6.2 (Phase 6 spec): Pixel 5 emulation = 393×851. iOS install banner must be present on iPhone 12 mobile simulation.

## Implementation Plan

This is a testing task. No new code unless bugs are found.

### Step 1: Prepare device viewports

Playwright device emulation profiles to use:

**iPhone 12 Pro:**
- Width: 390px, Height: 844px
- User agent: iPhone / Safari mobile user agent string
- `isMobile: true`, `hasTouch: true`
- Use Playwright's built-in device descriptor: `iPhone 12 Pro` (or equivalent)

**Pixel 5:**
- Width: 393px, Height: 851px
- User agent: Android Chrome user agent string
- `isMobile: true`, `hasTouch: true`
- Use Playwright's built-in device descriptor: `Pixel 5` (or equivalent)

### Step 2: iPhone 12 Pro — full landing page test

```
1. Launch Playwright with iPhone 12 Pro device emulation
2. Clear localStorage/sessionStorage (fresh state — iOS install banner should be visible)
3. Navigate to: https://doppio.kookyos.com
4. Wait for: networkidle
5. Verify: page renders without horizontal overflow (scroll width === viewport width)
   - evaluate: document.documentElement.scrollWidth <= 390
6. Verify: headline visible ("20 minutes from ChatGPT...")
7. Verify: "Start Level 1" CTA button visible
8. Verify: iOS install banner is visible at the bottom of the page
   - Look for: text containing "Add to Home Screen" or "Install" instructions
   - This banner should appear because: UA is iOS Safari AND not standalone AND not dismissed
9. Verify: iOS install banner has a dismiss (✕) button
10. Verify: no horizontal scrollbar visible
11. Screenshot: save as 6-2-01-iphone12pro-landing.png

12. Click: "Start Level 1"
13. Wait for: Level 1 cards visible
14. Verify: all 3 video card facades visible and not overflowing
15. Verify: each card has a "Try it" button visible and tappable (min-height ≥ 44px via CSS check)
16. Verify: progress bar visible
17. Screenshot: save as 6-2-02-iphone12pro-learn.png

18. Click: "Mark as done" on L1C1
19. Verify: checkmark appears
20. Verify: progress bar advances
21. Screenshot: save as 6-2-03-iphone12pro-card-complete.png
```

### Step 3: iPhone 12 Pro — iOS install banner dismiss persistence

```
1. (Still in iPhone 12 Pro session from Step 2)
2. Click: the ✕ dismiss button on the iOS install banner
3. Verify: banner disappears from view
4. Evaluate: localStorage.getItem('doppio_install_dismissed_v1') → must not be null/undefined
5. Reload the page
6. Verify: iOS install banner is NOT shown after reload (dismissed state persisted)
7. Screenshot: save as 6-2-04-iphone12pro-banner-dismissed.png
```

### Step 4: iPhone 12 Pro — standalone mode simulation

```
1. Navigate to: https://doppio.kookyos.com
2. Evaluate: override navigator.standalone before banner check:
   Object.defineProperty(window.navigator, 'standalone', { value: true, writable: false })
   (Or test by directly querying the DOM — the banner should not exist in standalone mode)
3. If the app reads navigator.standalone to conditionally render the banner:
   - Verify: iOS banner is NOT visible when standalone = true
   - Document result either way
4. Screenshot: save as 6-2-05-iphone12pro-standalone-no-banner.png
```

Note: Playwright cannot fully simulate iOS standalone mode, but checking the dismiss localStorage key and the standalone detection logic is sufficient. If the banner renders based on UA detection only (not `navigator.standalone`), that is acceptable — document it.

### Step 5: Pixel 5 — full landing page test

```
1. Launch NEW Playwright session with Pixel 5 device emulation
2. Clear localStorage/sessionStorage
3. Navigate to: https://doppio.kookyos.com
4. Wait for: networkidle
5. Verify: page renders without horizontal overflow (scroll width <= 393px)
6. Verify: headline visible
7. Verify: "Start Level 1" CTA visible
8. Verify: Android "Install App" button is visible in the page header
   - This button appears when BeforeInstallPromptEvent has been captured (canInstall = true)
   - NOTE: Playwright may not fire the actual BeforeInstallPromptEvent — if the button is not visible
     because the event never fired, document this as expected browser limitation (not a bug)
   - Alternative verification: check if the component renders when manually setting canInstall state
9. Verify: iOS install banner is NOT shown on Android UA
10. Verify: no horizontal scrollbar
11. Screenshot: save as 6-2-06-pixel5-landing.png

12. Click "Start Level 1"
13. Verify: Level 1 cards visible, no layout issues
14. Screenshot: save as 6-2-07-pixel5-learn.png

15. Simulate a complete mini-journey (L1C1 mark complete, verify checkmark + progress bar)
16. Screenshot: save as 6-2-08-pixel5-card-complete.png
```

### Step 6: Lighthouse PWA installability audit

Run the Lighthouse PWA audit against production using the Playwright browser:

**Option A — Playwright evaluate (chromium only):**

```javascript
// Navigate to production, then trigger Lighthouse in the DevTools Protocol
// NOTE: Lighthouse CLI via npx is the preferred method for reliable results
```

**Option B — npx Lighthouse CLI (preferred):**

Run from the Doppio project root:

```bash
npx lighthouse https://doppio.kookyos.com \
  --only-categories=pwa \
  --output=json \
  --output-path=.claude/orchestration-doppio/reports/e2e-screenshots/6-2-lighthouse-pwa.json \
  --chrome-flags="--headless"
```

Then parse the output to verify:
- `categories.pwa.score` → must be non-null and green (typically score ≥ 0.9 or "passing")
- Check `audits.installable-manifest.score` → must be 1
- Check `audits.service-worker.score` → must be 1
- Check `audits.apple-touch-icon.score` → must be 1
- Check `audits.themed-omnibox.score` → must be 1

Save the Lighthouse report JSON to: `.claude/orchestration-doppio/reports/e2e-screenshots/6-2-lighthouse-pwa.json`

**If npx is unavailable or Lighthouse is not installed:**
Use Playwright to navigate to production and manually check the Chrome DevTools Application panel:
- Playwright: navigate to `https://doppio.kookyos.com`
- Evaluate: check for `window.__pwa_manifest` or navigate to Application → Manifest
- Verify: `display: "standalone"` in manifest
- Verify: at least one 192×192 icon present
- Verify: `start_url` present
- Screenshot: save as 6-2-09-pwa-manifest-panel.png

### Step 7: Offline behavior verification

```
1. Playwright desktop session (1440×900)
2. Navigate to: https://doppio.kookyos.com
3. Wait for: page fully loaded (Service Worker should have cached app shell)
4. Simulate offline: Playwright → context.setOffline(true)
   OR evaluate: Network conditions override via CDP
5. Reload the page
6. Verify: page still renders (app shell loaded from Service Worker cache)
7. Verify: headline visible
8. Verify: video cards show "Connect to watch" message (not blank or error)
9. Screenshot: save as 6-2-10-offline-app-shell.png
10. Restore online: context.setOffline(false)
```

### Step 8: Document results

Create results file at:
`.claude/orchestration-doppio/reports/e2e-screenshots/6-2-results.md`

Include:
- iPhone 12 Pro: pass/fail for each step
- Pixel 5: pass/fail for each step
- Lighthouse PWA: score values (or audit results if Lighthouse unavailable)
- Offline: pass/fail
- iOS banner dismiss: pass/fail
- Any bugs found, fixes applied, and redeployment confirmation

### Step 9: Bug fix and redeploy protocol

If any step fails:

1. Identify the failing component (most likely: `IOSInstallBanner.tsx`, `useInstallPrompt.ts`, `vite.config.ts` manifest, or CSS overflow issue)
2. Fix minimally in the source file
3. `npm run build` to verify no TS/build errors
4. `vercel --prod` to redeploy
5. Re-run the failing step on the new deployment
6. Document the fix

## Files to Create

- `.claude/orchestration-doppio/reports/e2e-screenshots/6-2-01-iphone12pro-landing.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-2-02-iphone12pro-learn.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-2-03-iphone12pro-card-complete.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-2-04-iphone12pro-banner-dismissed.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-2-05-iphone12pro-standalone-no-banner.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-2-06-pixel5-landing.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-2-07-pixel5-learn.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-2-08-pixel5-card-complete.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-2-09-pwa-manifest-panel.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-2-10-offline-app-shell.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-2-lighthouse-pwa.json`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-2-results.md`

## Files to Modify

Only if bugs are found:
- `src/components/IOSInstallBanner.tsx` — banner visibility logic
- `src/hooks/useInstallPrompt.ts` — BeforeInstallPromptEvent capture
- `vite.config.ts` — PWA manifest configuration
- `index.html` — apple-touch-icon meta tags
- `src/index.css` — CSS overflow fixes

## Contracts

### Provides (for downstream tasks)

- Confirmed: mobile layout works on iPhone 12 Pro (390×844) and Pixel 5 (393×851)
- Confirmed: iOS install banner appears and is dismissable
- Confirmed: PWA manifest is valid and Lighthouse installability passes
- Confirmed: app shell works offline
- Screenshots: 10 mobile/PWA screenshots in `reports/e2e-screenshots/`

### Consumes (from upstream tasks)

- Task 6.1: production confirmed functional (prerequisite)
- Task 1.2: PWA manifest, Service Worker, icons
- Task 4.4: `IOSInstallBanner.tsx`, `useInstallPrompt.ts`
- Task 5.3: PWA icons generated, manifest polished
- Task 5.4: mobile polish, CSS, touch targets

## Acceptance Criteria

- [ ] iPhone 12 Pro (390×844): landing page renders without horizontal overflow
- [ ] iPhone 12 Pro: all text and CTA buttons visible without zooming
- [ ] iPhone 12 Pro: iOS install banner visible at bottom (first visit, not dismissed)
- [ ] iPhone 12 Pro: iOS install banner has dismiss (✕) button
- [ ] iPhone 12 Pro: dismissal persists in localStorage (`doppio_install_dismissed_v1`)
- [ ] iPhone 12 Pro: banner NOT shown after dismiss + reload
- [ ] iPhone 12 Pro: Level 1 cards render correctly, "Try it" buttons visible
- [ ] Pixel 5 (393×851): landing page renders without horizontal overflow
- [ ] Pixel 5: iOS install banner is NOT shown (wrong UA)
- [ ] Pixel 5: "Install App" button present in header (or documented as expected-not-present due to emulation limitation)
- [ ] Lighthouse PWA audit: `installable-manifest` = pass
- [ ] Lighthouse PWA audit: `service-worker` = pass
- [ ] Lighthouse PWA audit: `apple-touch-icon` = pass
- [ ] Offline: app shell renders after going offline + reload
- [ ] Offline: video cards show "Connect to watch" message (not blank/crashed)
- [ ] All 10 screenshots saved to `reports/e2e-screenshots/`
- [ ] `6-2-results.md` documents all results with pass/fail

## Testing Protocol

### Browser Testing (Playwright MCP)

**iPhone 12 Pro session:**
- Device: `iPhone 12 Pro` (Playwright built-in descriptor) OR manual: 390×844, mobile UA, touch enabled
- URL: `https://doppio.kookyos.com`
- Pre-condition: localStorage cleared

**Pixel 5 session:**
- Device: `Pixel 5` (Playwright built-in descriptor) OR manual: 393×851, Android Chrome UA, touch enabled
- URL: `https://doppio.kookyos.com`
- Pre-condition: localStorage cleared

**Offline test:**
- Device: desktop 1440×900
- Use `context.setOffline(true)` OR Chrome DevTools Protocol network conditions

**Key Playwright evaluations:**

```javascript
// Check no horizontal overflow
document.documentElement.scrollWidth <= window.innerWidth

// Check iOS install banner visible
document.querySelector('[data-testid="ios-install-banner"]') !== null
// OR: look for text "Add to Home Screen" or "Install"

// Check localStorage dismiss key
localStorage.getItem('doppio_install_dismissed_v1')

// Check manifest via DOM
document.querySelector('link[rel="manifest"]')?.href

// Check SW registered
navigator.serviceWorker.controller !== null
```

**PWA installability check via manifest:**

```javascript
// Fetch and parse the manifest
const manifestUrl = document.querySelector('link[rel="manifest"]').href;
const manifest = await fetch(manifestUrl).then(r => r.json());
// Verify: manifest.display === 'standalone'
// Verify: manifest.icons.some(i => i.sizes.includes('192x192'))
// Verify: manifest.start_url exists
// Verify: manifest.name === 'Doppio'
```

### External Service Verification

- Lighthouse CLI: `npx lighthouse https://doppio.kookyos.com --only-categories=pwa --output=json`
- Check output for: `audits.installable-manifest.score === 1`

### Build/Lint/Type Checks

Only if a bug fix is applied:

- [ ] `npm run build` succeeds
- [ ] No TypeScript errors

## Skills to Read

- `pwa-vite-setup` — PWA manifest, Service Worker, iOS/Android install prompt logic
- `doppio-architecture` — component file locations

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D33–D36 (PWA, offline, icons), D51 (scope exclusions)
- `.claude/orchestration-doppio/PHASES.md` — Task 1.2, 4.4, 5.3, 5.4 (PWA setup requirements)

## Git

- Branch: `main` (testing only)
- Commit message prefix (if fix needed): `Fix(6.2):`
