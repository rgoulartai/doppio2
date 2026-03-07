# Task 6.5: Performance + Production Health

## Objective

Run a comprehensive production health check on `https://doppio.kookyos.com`: Lighthouse performance and PWA audit, bundle size analysis, console error sweep during a full journey, CSP violation check, and verification that the `/?ref=badge` landing banner works correctly. All results are documented. If any critical failure is found (broken feature, console error, CSP violation, or LCP > 4s), diagnose the root cause, fix the code, redeploy, and re-verify.

## Context

This is the final Phase 6 task and the last gate before hackathon submission. It covers performance (Lighthouse LCP, CLS, blocking resources), production health (console errors, CSP violations), and bundle size. It validates that the app is production-grade, not just functional. Passing this task means Doppio is ready for the demo video recording and submission.

## Dependencies

- All Phase 6 tasks (6.1–6.4) complete — production confirmed functional, analytics working, persistence verified, cross-device tested
- vercel.json with CSP headers (from Task 5.4)
- Bundle built and deployed (all phases complete)

## Blocked By

- Tasks 6.1, 6.2, 6.3, 6.4

## Research Findings

- From DISCOVERY.md D21: React 18+, Vite 5+, Tailwind CSS 3+.
- From DISCOVERY.md D22: `vite-plugin-pwa` v0.21.x, Workbox, CacheFirst for app shell.
- From DISCOVERY.md D30: Facade/lazy-load pattern for videos — critical for performance (prevents 10MB+ of upfront third-party loading).
- From PHASES.md Task 5.4: `vercel.json` has CSP headers (frame-src youtube, tiktok). All buttons min-height 44px. No horizontal scroll at 375px.
- From PHASES.md Task 6.5 (Phase 6 spec):
  - Lighthouse Performance: LCP < 2.5s, CLS < 0.1, no blocking resources
  - Console errors: ZERO on full journey
  - CSP violations: ZERO
  - Bundle: gzipped bundle < 150KB (excluding video assets)
  - Share URL `/?ref=badge`: badge banner renders correctly
  - Teaser video loads without delay
- From PHASES.md task 5.3: Chrome Lighthouse PWA audit: all green.

## Implementation Plan

This is a testing task. No new code unless bugs are found.

### Step 1: Bundle size analysis

Run from the Doppio project root:

```bash
npm run build
```

This produces the `dist/` directory. Check bundle sizes:

```bash
du -sh dist/assets/*.js
du -sh dist/assets/*.css
```

Also check gzipped sizes (more representative of real transfer size):

```bash
gzip -k dist/assets/*.js && du -sh dist/assets/*.js.gz
```

Alternatively, check the Vite build output — it prints chunk sizes directly.

**Targets:**
- Each JS chunk: < 200KB (uncompressed)
- Total JS gzipped: < 150KB (excluding vendor chunks if code-splitting is used)
- CSS: < 30KB

If any chunk exceeds the target, document the offending file and size. If it is a known large dependency (e.g., canvas-confetti, lite-youtube-embed), note it as acceptable. If it indicates code that should have been lazy-loaded, that is a potential bug.

Log all sizes to `6-5-results.md`.

### Step 2: Lighthouse Performance audit

Run Lighthouse via CLI against production:

```bash
npx lighthouse https://doppio.kookyos.com \
  --only-categories=performance,pwa,accessibility,best-practices \
  --output=json,html \
  --output-path=.claude/orchestration-doppio/reports/e2e-screenshots/6-5-lighthouse \
  --chrome-flags="--headless --no-sandbox"
```

This creates:
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-5-lighthouse.report.json`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-5-lighthouse.report.html`

Parse the JSON output and verify the following scores (0–1 scale, 1 = 100):

| Metric | Target | Acceptable Minimum |
|--------|--------|-------------------|
| Performance score | ≥ 0.80 | ≥ 0.70 |
| Accessibility score | ≥ 0.90 | ≥ 0.85 |
| Best Practices score | ≥ 0.90 | ≥ 0.85 |
| PWA installable | pass (all green) | — |

Specific audit values to extract from JSON:

```bash
# Parse lighthouse JSON for key metrics
cat .claude/orchestration-doppio/reports/e2e-screenshots/6-5-lighthouse.report.json | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
cats = data['categories']
auds = data['audits']
print('Performance:', cats['performance']['score'])
print('Accessibility:', cats['accessibility']['score'])
print('Best Practices:', cats['best-practices']['score'])
print('LCP (s):', auds['largest-contentful-paint']['numericValue'] / 1000)
print('CLS:', auds['cumulative-layout-shift']['numericValue'])
print('TBT (ms):', auds['total-blocking-time']['numericValue'])
print('Speed Index:', auds['speed-index']['numericValue'] / 1000)
print('FCP (s):', auds['first-contentful-paint']['numericValue'] / 1000)
"
```

**LCP target**: < 2500ms (Lighthouse reports in ms — value < 2500)
**CLS target**: < 0.1
**TBT target**: < 300ms

If Lighthouse CLI is not available (npx fails), use Playwright to evaluate performance entries:

```javascript
// Alternative: measure LCP via PerformanceObserver in page evaluate
const lcp = await page.evaluate(() => {
  return new Promise((resolve) => {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      resolve(lastEntry.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    // Fallback if LCP doesn't fire
    setTimeout(() => resolve(null), 5000);
  });
});
console.log('LCP (ms):', lcp);
```

Document the LCP value in results.

### Step 3: Console error sweep (full journey)

```
1. Playwright: new browser context (1440×900)
2. Set up console listener BEFORE navigating:
   page.on('console', msg => {
     if (msg.type() === 'error') {
       errors.push({ text: msg.text(), url: msg.location().url })
     }
   })
3. Navigate to: https://doppio.kookyos.com
4. Wait for: networkidle
5. Complete the following actions:
   - Click "Start Level 1"
   - Click the video facade on L1C1 (loads iframe)
   - Click "Try it in ChatGPT" (verify no error)
   - Close newly opened tab, return
   - Click "Mark as done" on L1C1, L1C2, L1C3
   - Wait for Level 1 completion screen (confetti fires)
   - Click "Share", then "Continue to Level 2"
   - Click "Mark as done" on L2C1, L2C2, L2C3
   - Continue through Level 2 completion screen to Level 3
   - Click "Mark as done" on L3C1, L3C2, L3C3
   - Wait for Final screen
   - Click share badge button
   - Navigate to /?ref=badge
6. After all actions: verify the errors array is EMPTY
7. If any errors: log them ALL to 6-5-results.md with the full message text
8. Screenshot: save as 6-5-01-console-clean.png (take screenshot of the final screen)
```

**Allowed console messages:**
- `console.warn` from analytics (expected silent fail: `"Supabase auth failed, continuing in offline mode"`)
- Service Worker registration messages
- Any `console.log` from the app itself
- React development mode warnings are acceptable in dev builds; production builds should have fewer

**NOT allowed:**
- Any `console.error`
- Uncaught exceptions
- `TypeError`, `ReferenceError`, etc.
- 404 network errors for critical assets (JS, CSS, icons)

### Step 4: CSP violation check

Content Security Policy violations appear as console errors with a specific pattern. They look like:
`"Refused to load the script 'https://...' because it violates the following Content Security Policy directive: ..."`

During the same full journey from Step 3 (or a separate run):

```
1. Monitor console messages specifically for CSP-related strings
2. Filter: messages containing "Content Security Policy" or "CSP" or "Refused to frame"
3. Verify: ZERO CSP violations during:
   - Page load
   - Video facade click (YouTube iframe loads)
   - TikTok iframe loads (if any L3 cards use TikTok)
   - Confetti (canvas-confetti runs JavaScript)
   - Supabase API calls (fetch to supabase.co domain)
   - Vercel Analytics script loading
4. If violations found: check vercel.json CSP headers
5. Screenshot: save as 6-5-02-csp-clean.png
```

**Expected CSP frame-src directives** (from Task 5.4):
```
frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.tiktok.com;
```

**Expected script-src directives** (must allow):
- `'self'` — own JS files
- `https://vercel-scripts.com` or Vercel Analytics domain (check actual domain)
- `'unsafe-inline'` may be needed for Vite's inline modules — or use nonce-based approach
- `https://*.supabase.co` — Supabase client calls

If a CSP violation is found for YouTube, the fix is to add `https://www.youtube.com` and `https://www.youtube-nocookie.com` to `frame-src` in `vercel.json`.

### Step 5: Teaser video check

```
1. Playwright: navigate to https://doppio.kookyos.com
2. Wait for: page loaded
3. Evaluate: document.querySelector('video') — verify element exists
4. Evaluate: check video attributes:
   - video.hasAttribute('autoplay') === true
   - video.hasAttribute('muted') === true
   - video.hasAttribute('loop') === true
   - video.hasAttribute('playsinline') === true
5. Evaluate: video.readyState — verify ≥ 2 (HAVE_CURRENT_DATA or higher)
   OR: video.src is not empty (video source configured)
6. Verify: no console error related to video (404 for video file = bug)
7. If video src returns 404:
   - Check: does public/teaser.mp4 or public/teaser-placeholder.mp4 exist?
   - If the real video has not been added yet (user creates it post-build), this is expected
   - Document as: "Teaser video placeholder — file not yet added (expected)"
   - Verify: page renders correctly even if video is absent (graceful degradation)
8. Screenshot: save as 6-5-03-landing-video-check.png
```

### Step 6: Badge ref link check

```
1. Playwright: navigate to https://doppio.kookyos.com/?ref=badge
2. Wait for: page loaded
3. Verify: badge banner is visible (text containing "AI Manager" or similar badge message)
4. Verify: banner appears ABOVE the hero (at top of page)
5. Verify: "Start Level 1" CTA still visible below the banner
6. Evaluate: document.querySelector('[data-testid="badge-banner"]') !== null
   OR: look for text content containing "badge" or "AI Manager" in a banner element
7. Screenshot: save as 6-5-04-badge-ref-banner.png

8. Verify: navigating to / (without ?ref=badge) does NOT show the banner
9. Navigate to https://doppio.kookyos.com (no param)
10. Verify: banner is absent
11. Screenshot: save as 6-5-05-landing-no-banner.png
```

### Step 7: Vercel Functions / server error check

```
1. Open Vercel Dashboard → Doppio project → Logs (or Functions)
2. Check for any 5xx errors from the production deployment
3. Verify: no 500/502/503 errors in recent logs
4. Note: Doppio is a fully static SPA (no serverless functions except analytics from Vercel infra)
   There should be NO function errors unless Vercel Analytics itself has an issue
5. Document: "No server-side functions in Doppio — static SPA only" if no errors found
6. Screenshot or note: 6-5-results.md
```

### Step 8: OG meta tags check

```
1. Playwright: navigate to https://doppio.kookyos.com
2. Evaluate: check all OG meta tags:
   document.querySelector('meta[property="og:title"]')?.content
   → Expected: "Doppio — Become an AI Manager in 20 Minutes"

   document.querySelector('meta[property="og:description"]')?.content
   → Expected: contains "No coding"

   document.querySelector('meta[property="og:image"]')?.content
   → Expected: https://doppio.kookyos.com/og-badge.png (or /og-badge.png)

   document.querySelector('meta[property="og:url"]')?.content
   → Expected: https://doppio.kookyos.com

   document.querySelector('meta[name="twitter:card"]')?.content
   → Expected: "summary_large_image"

3. Verify: each meta tag has a non-empty value
4. Verify: og:image URL is accessible (200 response):
   page.goto(og_image_url) → should not 404
5. Screenshot: save as 6-5-06-og-meta-tags.png (page source view or DevTools Elements)
```

### Step 9: Document all results

Create `.claude/orchestration-doppio/reports/e2e-screenshots/6-5-results.md`:

Include:
- **Bundle sizes**: list each JS and CSS file with uncompressed and gzipped sizes
- **Lighthouse scores**: Performance, Accessibility, Best Practices, PWA (exact scores)
- **LCP**: actual value in ms
- **CLS**: actual value
- **TBT**: actual value in ms
- **Console errors**: count (target: 0), list any found
- **CSP violations**: count (target: 0), list any found
- **Teaser video**: present and functional, or documented absence
- **Badge ref link**: banner visible at /?ref=badge — PASS/FAIL
- **OG meta tags**: each tag value verified — PASS/FAIL
- **Vercel logs**: no 5xx errors — PASS/FAIL
- **Final verdict**: READY FOR SUBMISSION or BLOCKERS FOUND (list blockers)
- Any bugs found, fixes applied, redeployment confirmation

### Step 10: Bug fix and redeploy protocol

**Performance issues (LCP > 3s):**
- Check: is the teaser video loading eagerly and blocking LCP? If so, add `loading="lazy"` to the video
- Check: are there large above-the-fold images? Optimize with `loading="lazy"` or compress
- Check: is there a large JS chunk blocking render? Consider code splitting

**CSP violations:**
- Fix in `vercel.json` — add the missing domain to the relevant directive
- `frame-src` for YouTube/TikTok
- `connect-src` for Supabase API calls (`*.supabase.co`)
- `script-src` for Vercel Analytics

**Console errors:**
- Fix the specific component where the error originates
- Common causes: missing prop, null reference, failed import

**Bundle too large:**
- Check if canvas-confetti is imported eagerly — lazy import on level completion
- Check if lite-youtube-embed is bundled (should be external CDN or local package)

Fix, build (`npm run build`), redeploy (`vercel --prod`), re-verify.

## Files to Create

- `.claude/orchestration-doppio/reports/e2e-screenshots/6-5-lighthouse.report.json`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-5-lighthouse.report.html`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-5-01-console-clean.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-5-02-csp-clean.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-5-03-landing-video-check.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-5-04-badge-ref-banner.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-5-05-landing-no-banner.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-5-06-og-meta-tags.png`
- `.claude/orchestration-doppio/reports/e2e-screenshots/6-5-results.md`

## Files to Modify

Only if bugs are found:
- `vercel.json` — CSP headers
- `index.html` — OG meta tags, apple-touch-icon tags
- `src/` — component files for console error fixes
- `vite.config.ts` — bundle splitting if size exceeds target
- `public/teaser.mp4` or `public/teaser-placeholder.mp4` — if video 404

## Contracts

### Provides (for downstream tasks)

This is the final task. It provides:
- Final production health report
- Confirmed: Lighthouse Performance ≥ 80, PWA green, Accessibility ≥ 90
- Confirmed: zero console errors on full journey
- Confirmed: zero CSP violations
- Confirmed: bundle sizes within target
- Confirmed: badge ref link works
- Confirmed: OG meta tags correct
- Final verdict: READY FOR SUBMISSION

### Consumes (from upstream tasks)

- All Phase 6 tasks (6.1–6.4): production functional, analytics verified, persistence verified, cross-device verified
- Task 5.4: vercel.json CSP headers, mobile polish
- Task 5.2: OG meta tags in index.html
- Task 5.3: PWA icons

## Acceptance Criteria

- [ ] `npm run build` succeeds in project root
- [ ] Each JS chunk < 200KB uncompressed (document all chunk sizes)
- [ ] Total gzipped JS < 150KB (excluding large vendor chunks — document all sizes)
- [ ] Lighthouse Performance score ≥ 0.80 (80)
- [ ] Lighthouse Accessibility score ≥ 0.90 (90)
- [ ] Lighthouse PWA: installable-manifest = pass
- [ ] LCP < 2500ms (Lighthouse value)
- [ ] CLS < 0.10
- [ ] Zero `console.error` messages during full journey on production
- [ ] Zero CSP violations during full journey on production
- [ ] YouTube iframe loads without CSP violation
- [ ] Teaser video element exists with autoplay/muted/loop/playsinline attributes (or graceful absence documented)
- [ ] `/?ref=badge` shows badge banner above the hero
- [ ] `/` (without ref=badge) does NOT show the badge banner
- [ ] All 5 OG meta tags present and non-empty (`og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`)
- [ ] `og:image` URL is accessible (not 404)
- [ ] No 5xx errors in Vercel production logs
- [ ] All 8 screenshots (6 PNGs + Lighthouse JSON + HTML) saved to `reports/e2e-screenshots/`
- [ ] `6-5-results.md` contains final verdict: READY FOR SUBMISSION or BLOCKERS FOUND

## Testing Protocol

### Build/Lint/Type Checks

```bash
# Run from Doppio project root
npm run build

# Check bundle output (Vite prints chunk sizes)
# Manually run du on dist/assets if needed
```

### CLI Tool Checks

```bash
# Lighthouse CLI (run from any directory)
npx lighthouse https://doppio.kookyos.com \
  --only-categories=performance,pwa,accessibility,best-practices \
  --output=json,html \
  --output-path=/Users/renatosgafilho/Projects/KOOKY/Doppio/.claude/orchestration-doppio/reports/e2e-screenshots/6-5-lighthouse \
  --chrome-flags="--headless --no-sandbox"

# Bundle size analysis (run from Doppio project root)
npm run build && du -sh dist/assets/*.js dist/assets/*.css

# Gzipped sizes
for f in dist/assets/*.js; do
  echo "$f: $(gzip -c $f | wc -c) bytes gzipped"
done
```

### Browser Testing (Playwright MCP)

- Target URL: `https://doppio.kookyos.com`
- Viewport: 1440×900

**Key Playwright evaluations:**

```javascript
// OG meta tags
const ogTitle = await page.evaluate(() =>
  document.querySelector('meta[property="og:title"]')?.content
);
const ogImage = await page.evaluate(() =>
  document.querySelector('meta[property="og:image"]')?.content
);
const twitterCard = await page.evaluate(() =>
  document.querySelector('meta[name="twitter:card"]')?.content
);

// Video element attributes
const videoCheck = await page.evaluate(() => {
  const v = document.querySelector('video');
  if (!v) return { exists: false };
  return {
    exists: true,
    autoplay: v.hasAttribute('autoplay'),
    muted: v.hasAttribute('muted'),
    loop: v.hasAttribute('loop'),
    playsinline: v.hasAttribute('playsinline'),
    src: v.src || v.querySelector('source')?.src,
  };
});

// Badge banner check
const badgeBanner = await page.evaluate(() => {
  // Look for any element with "AI Manager" or "badge" text in a banner context
  const allText = document.body.innerText;
  return allText.includes('AI Manager') || document.querySelector('[data-testid="badge-banner"]') !== null;
});
```

**Console error listener pattern:**

```javascript
const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') {
    consoleErrors.push({
      text: msg.text(),
      location: msg.location(),
    });
  }
});

// After full journey:
console.log(`Total console errors: ${consoleErrors.length}`);
// Target: 0
```

### External Service Verification

- Vercel Dashboard: `https://vercel.com` → Doppio project → Logs → check for 5xx
- Supabase Dashboard: not needed for this task (covered in 6.3 and 6.4)

## Skills to Read

- `doppio-architecture` — overall file structure, understanding what `vercel.json` controls
- `pwa-vite-setup` — PWA manifest, Service Worker (for understanding Lighthouse PWA audit requirements)

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D21–D22 (tech stack), D28 (Vercel deployment), D43 (share badge og-image), D52 (done criteria)
- `.claude/orchestration-doppio/PHASES.md` — Task 5.2 (OG meta tags), 5.4 (vercel.json CSP), Phase 6 Task 6.5 spec

## Git

- Branch: `main` (testing only)
- Commit message prefix (if fix needed): `Fix(6.5):`
