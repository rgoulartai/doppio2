# Task 5.4: Mobile Polish + vercel.json Final

## Objective

Finalize `vercel.json` with complete Content Security Policy headers and SPA rewrites, audit every interactive element for minimum 44px touch targets, apply `env(safe-area-inset-bottom)` to all fixed bottom elements for iOS safe area compatibility, eliminate any horizontal scroll at 375px viewport width, and verify the app is pixel-perfect on mobile via a full Playwright screenshot at 390px.

## Context

Phase 5 final polish pass. All features are implemented. This task ensures the app feels native on mobile — the primary use case. Non-technical users will use Doppio on their phones. Touch targets that are too small, content that causes horizontal scroll, or a bottom nav that hides behind the iPhone notch will all hurt the user experience. The `vercel.json` CSP headers also need final verification to ensure YouTube and TikTok embeds are not blocked in production. This is the last code change before Phase 5 regression.

## Dependencies

- Task 3.1 — `Landing.tsx` exists (audit touch targets)
- Task 3.2 — `VideoCard.tsx` and embed components exist (verify 16:9 at all widths)
- Task 4.1 — `Learn.tsx`, `LevelNav.tsx`, `CardList.tsx` exist (audit touch targets)
- Task 1.4 — `vercel.json` exists (update with final CSP)

## Blocked By

- Phase 3 must be complete (all core UI exists before a mobile polish audit is meaningful)

## Research Findings

- From `vercel-deploy-custom-domain` skill §2: `vercel.json` must include `frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.tiktok.com` in CSP and a `rewrites` SPA catch-all rule.
- From `PHASES.md Task 5.4`: All interactive elements need `min-height: 44px; touch-action: manipulation`. iOS safe area: `env(safe-area-inset-bottom)` on fixed bottom elements.
- From `DISCOVERY.md D40`: `active:scale-95` Tailwind class on CTA buttons for tactile touch feedback.
- From `pwa-vite-setup` skill §8: Video iframes must maintain 16:9 aspect ratio via `aspect-video` Tailwind class or equivalent CSS.
- From `DISCOVERY.md D21`: React 18 + Vite + Tailwind CSS — mobile-first styling patterns.
- Apple Human Interface Guidelines: Minimum touch target is 44×44pt. Apple recommends 44pt, Google recommends 48dp. Use 44px as the minimum.

## Implementation Plan

### Step 1: Finalize vercel.json with complete CSP and rewrites

Open `vercel.json` (or create it if missing). Replace with the final complete version:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self'; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.tiktok.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com; media-src 'self' blob:; worker-src 'self' blob:"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

CSP directives explained:
- `frame-src`: Allows YouTube, YouTube nocookie, and TikTok iframes — required for video embeds
- `connect-src`: Allows Supabase API calls (HTTPS + WSS for realtime), Vercel Analytics vitals endpoint
- `script-src`: Includes `https://va.vercel-scripts.com` for Vercel Analytics script (Layer 1 analytics)
- `img-src`: Allows `data:` URIs (inline images), `https:` (YouTube thumbnails), `blob:` (generated canvas images)
- `worker-src 'self' blob:`: Required for Workbox Service Worker registration
- `media-src 'self' blob:`: Allows the self-hosted teaser video in `/public`

After updating, verify locally:
1. Run `npm run dev` and open DevTools → Console
2. Navigate all routes and trigger video embeds
3. Verify ZERO CSP violation errors in console (format: "Refused to load...")
4. If any CSP violation appears, add the blocked origin to the appropriate directive

### Step 2: Touch target audit — identify all interactive elements

Open each of the following files and identify every interactive element (button, link, clickable div, form element). Each must have `min-height: 44px` and `touch-action: manipulation`:

**Files to audit**:

| File | Interactive Elements |
|------|---------------------|
| `src/pages/Landing.tsx` | "Start Level 1" CTA button |
| `src/components/LevelNav.tsx` | Level tab buttons (Beginner, Intermediate, Advanced) |
| `src/components/VideoCard.tsx` | Video facade click area, "Mark as done" button |
| `src/components/TryItButton.tsx` | "Try it in [Tool]" button |
| `src/components/ProgressBar.tsx` | (no interactive elements — visual only) |
| `src/components/LevelCompleteScreen.tsx` | "Continue" button, "Share" button |
| `src/pages/Complete.tsx` | "Share badge" button, resource link items |
| `src/components/IOSInstallBanner.tsx` | "×" dismiss button, install CTA button |
| `src/pages/Landing.tsx` (Android install button) | "Install App" button (inline via `useAndroidInstallPrompt()`, see Task 4.4 — not a separate component file) |

For each interactive element, apply these styles. In Tailwind:

```tsx
// BEFORE — button might be too small on mobile
<button className="px-4 py-2 bg-purple-600 text-white rounded-lg">
  Start Level 1
</button>

// AFTER — guaranteed 44px minimum height, no 300ms tap delay
<button className="min-h-[44px] touch-action-manipulation px-6 py-3 bg-purple-600 text-white rounded-lg active:scale-95 transition-transform">
  Start Level 1
</button>
```

Since Tailwind does not have a `touch-action-manipulation` class by default, add it to `src/index.css` as a utility:

```css
/* src/index.css — add to @layer utilities */
@layer utilities {
  .touch-manipulation {
    touch-action: manipulation;
  }
}
```

Or apply via inline style / arbitrary Tailwind value:
```tsx
<button style={{ touchAction: 'manipulation' }} className="min-h-[44px] ...">
```

Specific elements that commonly fail the 44px minimum:

1. **Level tab buttons** — typically styled as small pill/tab. Ensure:
   ```tsx
   <button className="min-h-[44px] px-4 flex items-center justify-center ...">
   ```

2. **Dismiss "×" button on install banner** — often too small. Ensure:
   ```tsx
   <button className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xl ...">
     &times;
   </button>
   ```

3. **Resource links on Complete.tsx** — anchor tags that may be short. Ensure:
   ```tsx
   <a className="min-h-[44px] flex items-center gap-3 p-3 ...">
   ```

4. **Video facade click area** — must cover full 16:9 area (will naturally be much taller than 44px, but verify the clickable zone is the full facade)

5. **"Mark as done" checkbox/button** — if implemented as a small checkbox, replace with a full-width button or ensure the hit target is at least 44px in both dimensions.

### Step 3: iOS safe area insets — identify fixed bottom elements

iOS introduces a safe area at the bottom of the screen for the home indicator. Any `fixed bottom-0` element is obscured without safe area padding.

Identify all elements with `position: fixed` and `bottom: 0` (or `bottom-X`):

Elements that need `env(safe-area-inset-bottom)`:

1. **IOSInstallBanner** — `fixed bottom-0 left-0 right-0`:
   ```tsx
   // Add padding-bottom to the banner's container
   <div
     className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white"
     style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
   >
   ```

2. **Android install button in Landing.tsx** — The Android install button is part of Landing.tsx (see Task 4.4 — it uses `useAndroidInstallPrompt()` hook inline, not a separate component file). Since the button is inline in the header (not a fixed bottom element), it does not need `env(safe-area-inset-bottom)` padding. Verify the header is not `fixed bottom-0`; if it is fixed at the bottom, apply safe area padding to the Landing.tsx header container.

3. **Any bottom navigation bar** in `LevelNav.tsx` if it's positioned at the bottom (check the implementation):
   ```tsx
   <nav
     className="fixed bottom-0 left-0 right-0"
     style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
   >
   ```

4. **LevelCompleteScreen overlay** — if it has action buttons near the bottom of a full-screen overlay:
   ```tsx
   <div
     className="fixed inset-0 z-50 flex flex-col"
     style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
   >
   ```

Also add the `viewport-fit=cover` meta tag to `index.html` to enable safe area insets (required — without this, `env(safe-area-inset-bottom)` is always 0):

```html
<!-- index.html — update the existing viewport meta tag -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### Step 4: Eliminate horizontal scroll at 375px

Horizontal scroll on mobile is caused by elements wider than the viewport. Common culprits in React/Tailwind apps:

**Audit approach**:
```javascript
// Playwright: check for horizontal scroll
await page.setViewportSize({ width: 375, height: 812 });
await page.goto('http://localhost:5173');

const hasHorizontalScroll = await page.evaluate(() => {
  return document.documentElement.scrollWidth > document.documentElement.clientWidth;
});
console.log('Has horizontal scroll:', hasHorizontalScroll); // Must be false

// Find which element is causing overflow (if any)
const overflowingElement = await page.evaluate(() => {
  const all = document.querySelectorAll('*');
  const offenders = [];
  all.forEach(el => {
    if (el.scrollWidth > document.documentElement.clientWidth) {
      offenders.push(el.tagName + '#' + el.id + '.' + el.className.split(' ')[0]);
    }
  });
  return offenders.slice(0, 10);
});
console.log('Overflow offenders:', overflowingElement);
```

Common fixes:

1. **Video embeds**: Ensure `aspect-video` container uses `w-full`, not a fixed pixel width:
   ```tsx
   <div className="aspect-video w-full">
     <iframe className="w-full h-full" ... />
   </div>
   ```

2. **Pre-wrap text in prompts**: Long `tryItPrompt` text might overflow. Use `break-words`:
   ```tsx
   <p className="text-sm break-words">...</p>
   ```

3. **Flex/Grid overflow**: Add `overflow-hidden` to container elements where content might bleed:
   ```tsx
   <div className="w-full overflow-hidden">
   ```

4. **Fixed-width elements**: Replace any `w-[600px]` or similar fixed widths with responsive alternatives:
   ```tsx
   // Bad:  className="w-[600px]"
   // Good: className="w-full max-w-2xl"
   ```

5. **Add global overflow guard to index.css**:
   ```css
   /* src/index.css — prevent horizontal overflow globally */
   html, body {
     overflow-x: hidden;
     max-width: 100vw;
   }
   ```

Note: `overflow-x: hidden` on `html`/`body` as a global guard is safe for Doppio's single-column mobile layout since there are no intentional horizontal scroll areas.

### Step 5: Verify 16:9 aspect ratio at all mobile widths

Video cards must maintain their 16:9 ratio without CLS. Check all video embed components:

In `VideoCard.tsx` or `VideoFacade.tsx`, ensure the container uses the Tailwind `aspect-video` class (which sets `aspect-ratio: 16/9`):

```tsx
// VideoCard container — must be this pattern
<div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-900">
  {/* facade or iframe */}
</div>
```

Playwright verification:
```javascript
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://localhost:5173/learn');

// Get video container dimensions
const videoBox = await page.locator('.aspect-video').first().boundingBox();
const aspectRatio = videoBox.width / videoBox.height;
console.log('Aspect ratio:', aspectRatio.toFixed(2)); // Should be ~1.78 (16/9)
console.assert(Math.abs(aspectRatio - 16/9) < 0.1, 'Video aspect ratio is not 16:9');
```

### Step 6: Full mobile screenshot at 390px (iPhone 14 Pro width)

Use Playwright to take screenshots of every major screen at 390×844px (iPhone 14 Pro dimensions):

```javascript
// Playwright MCP — full mobile screenshot sequence
await page.setViewportSize({ width: 390, height: 844 });

// Landing page
await page.goto('http://localhost:5173');
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'screenshots/mobile-landing.png', fullPage: true });

// Learn page — Level 1
await page.goto('http://localhost:5173/learn');
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'screenshots/mobile-learn-level1.png', fullPage: true });

// Complete page
await page.goto('http://localhost:5173/complete');
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'screenshots/mobile-complete.png', fullPage: true });
```

Review each screenshot for:
- [ ] No horizontal scroll visible (content fits within viewport width)
- [ ] All buttons are visibly tappable (adequate padding, not tiny)
- [ ] Text is readable at mobile size (not clipped, not overflowing)
- [ ] Video cards display at correct 16:9 ratio
- [ ] Bottom UI elements are not obscured (visible above the bottom edge)
- [ ] Progress bar is visible
- [ ] Navigation tabs are large enough to tap

### Step 7: CSP violation check in browser console

```javascript
// Playwright — check for CSP violations on full journey
const cspViolations = [];
page.on('console', msg => {
  if (msg.type() === 'error' && msg.text().includes('Refused to')) {
    cspViolations.push(msg.text());
  }
});

await page.goto('http://localhost:5173/learn');
// Click a video facade to trigger iframe load
await page.locator('[data-testid="video-facade"]').first().click();
await page.waitForTimeout(2000);

if (cspViolations.length > 0) {
  console.error('CSP VIOLATIONS FOUND:', cspViolations);
} else {
  console.log('PASS: No CSP violations');
}
```

## Files to Create

None — this task modifies existing files only.

## Files to Modify

- `vercel.json` — complete final CSP (frame-src, connect-src, script-src, worker-src, media-src) + rewrites rule + security headers
- `src/index.css` — add `.touch-manipulation` utility class, add `html { overflow-x: hidden }` global guard
- `index.html` — update viewport meta tag to include `viewport-fit=cover`
- `src/components/IOSInstallBanner.tsx` — add `paddingBottom: 'env(safe-area-inset-bottom)'` to container
- `src/pages/Landing.tsx` — the Android install button is inline here (not a separate component); verify no safe area issues with the header placement (see Task 4.4)
- `src/components/LevelNav.tsx` (if fixed bottom nav) — add safe area padding
- `src/components/LevelCompleteScreen.tsx` — add safe area padding to bottom action area
- `src/pages/Landing.tsx` — ensure CTA button has `min-h-[44px] touch-manipulation`
- `src/components/VideoCard.tsx` — ensure video container uses `aspect-video w-full`
- `src/components/TryItButton.tsx` — ensure `min-h-[44px] touch-manipulation`
- Other components as needed based on touch target audit findings

## Contracts

### Provides (for downstream tasks)

- `vercel.json` finalized — production-ready CSP and rewrites; prerequisite for Task 5.R
- Zero CSP violations in console — all video embeds and Supabase connections allowed
- All touch targets ≥ 44px — mobile UX passes Apple/Google standards
- Zero horizontal scroll at 375px — no mobile overflow bugs
- Safe area insets applied — app renders correctly on iPhone X and newer

### Consumes (from upstream tasks)

- All Phase 3 components (Tasks 3.1, 3.2, 3.3, 3.4) — audited for touch targets and mobile rendering
- `LevelNav.tsx`, `LevelCompleteScreen.tsx` (Task 4.1, 4.2) — audited for safe area and touch targets
- `IOSInstallBanner.tsx` (Task 1.2/4.4) — modified for safe area insets; Android install button is inline in `Landing.tsx` (not a separate component file, see Task 4.4)
- `vercel.json` from Task 1.4 — updated with final complete CSP

## Acceptance Criteria

- [ ] `vercel.json` has `frame-src` for youtube.com, youtube-nocookie.com, and tiktok.com
- [ ] `vercel.json` has `connect-src` for `*.supabase.co` and Vercel Analytics endpoint
- [ ] `vercel.json` has `rewrites` SPA catch-all rule (`/(.*) → /index.html`)
- [ ] `index.html` viewport meta tag includes `viewport-fit=cover`
- [ ] IOSInstallBanner: `paddingBottom: 'env(safe-area-inset-bottom)'` applied to container div
- [ ] Android install button is inline in `Landing.tsx` (not a separate AndroidInstallBanner component — see Task 4.4); verify safe area is not needed for the header location
- [ ] All level tab buttons: `min-height: 44px` (Tailwind: `min-h-[44px]`)
- [ ] "Start Level 1" CTA button: `min-height: 44px`
- [ ] TryItButton: `min-height: 44px`, `touch-action: manipulation`
- [ ] LevelCompleteScreen "Continue" and "Share" buttons: `min-height: 44px`
- [ ] Video embed containers: use `aspect-video w-full` (no fixed pixel width/height)
- [ ] Playwright at 375px width: `document.documentElement.scrollWidth <= document.documentElement.clientWidth` (no horizontal scroll)
- [ ] Playwright at 390px: screenshot shows no visual regressions — all content fits, all buttons visible
- [ ] Chrome DevTools Console: ZERO "Refused to load" CSP violation errors when triggering a YouTube or TikTok embed
- [ ] `npm run build` succeeds

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npm run build` succeeds
- [ ] `tsc --noEmit` passes

### Browser Testing (Playwright MCP)

- Start: `npm run dev` (localhost:5173)

**Test 1: Horizontal scroll check (375px — iPhone SE)**
```javascript
await page.setViewportSize({ width: 375, height: 667 });
const routes = ['/', '/learn', '/complete'];
for (const route of routes) {
  await page.goto(`http://localhost:5173${route}`);
  await page.waitForLoadState('networkidle');
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  console.log(`${route}: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}, overflow=${scrollWidth > clientWidth}`);
  // PASS: scrollWidth must equal clientWidth
}
```

**Test 2: Touch target size audit (390px)**
```javascript
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://localhost:5173');

const buttons = await page.locator('button, a[role="button"]').all();
for (const btn of buttons) {
  const box = await btn.boundingBox();
  if (box && box.height < 44) {
    const text = await btn.textContent();
    console.warn(`FAIL: Button "${text?.trim()}" is only ${box.height}px tall (< 44px)`);
  }
}
```

**Test 3: CSP violation check with video embed**
```javascript
const violations = [];
page.on('console', msg => {
  if (msg.text().includes('Refused to')) violations.push(msg.text());
});

await page.goto('http://localhost:5173/learn');
await page.locator('[data-testid="video-facade"], .video-facade, .aspect-video').first().click();
await page.waitForTimeout(3000);

console.log(`CSP violations: ${violations.length}`);
violations.forEach(v => console.error(v));
// PASS: violations.length === 0
```

**Test 4: Full mobile screenshot sequence (390px)**
```javascript
await page.setViewportSize({ width: 390, height: 844 });

const screens = [
  { path: '/', name: 'landing' },
  { path: '/learn', name: 'learn-level1' },
  { path: '/learn?level=2', name: 'learn-level2' },
  { path: '/complete', name: 'complete' },
];

for (const { path, name } of screens) {
  await page.goto(`http://localhost:5173${path}`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `screenshots/mobile-${name}-390px.png`, fullPage: true });
  console.log(`Screenshot saved: mobile-${name}-390px.png`);
}
```

Review all screenshots for visual correctness.

**Test 5: 16:9 video aspect ratio verification**
```javascript
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://localhost:5173/learn');
const videoContainer = await page.locator('.aspect-video').first().boundingBox();
if (videoContainer) {
  const ratio = videoContainer.width / videoContainer.height;
  console.log(`Video aspect ratio: ${ratio.toFixed(3)} (expected ~1.778 for 16:9)`);
  // PASS: ratio within 0.1 of 1.778
}
```

### External Service Verification

After deploying to production (`vercel --prod`):

- **Chrome DevTools Console on production**: Open `https://doppio.kookyos.com`, navigate to `/learn`, click a video facade. Verify zero CSP violation errors in Console tab.
- **Chrome DevTools Application → Manifest**: Verify `viewport-fit=cover` is reflected in device emulation mode.

## Skills to Read

- `pwa-vite-setup` — Offline behavior, viewport meta tags, aspect-video pattern for video embeds
- `vercel-deploy-custom-domain` — vercel.json CSP headers, SPA rewrites

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D40 (touch feedback, active:scale-95), D35 (offline behavior), D21 (tech stack)

## Git

- Branch: `feat/phase-5-mobile-polish`
- Commit message prefix: `Task 5.4:`
