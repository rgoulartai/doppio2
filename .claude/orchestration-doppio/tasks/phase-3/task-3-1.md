# Task 3.1: Landing Page

## Objective

Build the landing page at route `/` with a hero section containing an autoplay teaser video placeholder, headline, subheadline, and "Start Level 1" CTA button. The page must also detect the `?ref=badge` query parameter and render a referral banner when present. The page must be fully mobile-responsive at 390px width.

## Context

This is the first user-facing screen of Doppio. It must make an instant first impression: a looping background video (placeholder until the real Nano Banana video is produced), a strong headline, and a single clear CTA. The `/?ref=badge` variant is the sharing mechanic — when someone shares their badge, this URL is what gets shared. Phase 3 depends on this being the entry point. Task 3.2 (VideoCard), 3.3 (TryIt), and 3.4 (Progress) all live behind the `/learn` route this page navigates to.

## Dependencies

- Task 1.1 — Provides the React + Vite + Tailwind scaffold, App.tsx routing, `public/` directory
- Task 2.1 — Provides `content.json` confirming the route structure (this task does not consume content.json directly)

## Blocked By

- Task 1.1 must be complete (project must exist and build)

## Research Findings

- From DISCOVERY.md D44: Landing page structure — hero with 15-second autoplay muted teaser video → headline + subheadline → "Start Level 1" CTA → optional "How it works" section
- From DISCOVERY.md D45/D46/D47: Teaser video is self-hosted in `/public`, HTML `<video autoplay muted loop playsinline>` element. The real video is a user deliverable post-UI-build — the agent scaffolds the element and puts a tiny placeholder MP4 in `public/`.
- From DISCOVERY.md D3: One-sentence pitch: "20 minutes from ChatGPT Googler to AI coworker boss"
- From DISCOVERY.md D43: Share URL is `https://doppio.kookyos.com/?ref=badge`; the `/?ref=badge` route shows a top banner
- From DISCOVERY.md D60: React Router v6 routes — `/` is landing, `/?ref=badge` shows same landing with badge banner
- From PHASES.md Task 3.1: Headline: "20 minutes from ChatGPT user to AI manager"; Subheadline: "No coding. No prompting. Just natural language."; badge banner text (static, no dynamic name): "🎉 Someone completed Doppio and became an AI Manager! Start your journey →"

## Implementation Plan

### Step 1: Create the placeholder video file

Doppio's teaser video (`public/teaser-placeholder.mp4`) does not exist yet — the real video is produced in Nano Banana after the UI is built. Create a minimal placeholder so the `<video>` element does not show a broken source.

**Option A (CSS poster — preferred)**: Do NOT place a real MP4. Instead, use a `poster` attribute pointing to a CSS gradient image or a 1x1 transparent pixel, and rely on the `bg-gray-900` background of the hero. Set `src` to an empty string or omit `src` entirely. Add a note in code: `{/* TODO: Replace with real teaser video from Nano Banana */}`.

**Option B (tiny placeholder MP4)**: Create a 1-second black MP4 using a base64-encoded data URI inline in the `src` attribute. This avoids a 404 in the network tab.

Use Option A: leave `src` as a commented-out placeholder with the poster approach. The hero background color provides the visual fill until the real video arrives. The element must still have the correct attributes so the video plays the moment the file is dropped in.

The video element structure:
```html
<video
  autoPlay
  muted
  loop
  playsInline
  poster="/teaser-poster.jpg"
  className="absolute inset-0 w-full h-full object-cover"
>
  {/* Drop teaser-placeholder.mp4 into public/ when ready */}
  <source src="/teaser-placeholder.mp4" type="video/mp4" />
  <source src="/teaser-placeholder.webm" type="video/webm" />
</video>
```

Also create a minimal `public/teaser-poster.jpg` — a 1×1 pixel dark image (just write an empty file or use any dark-background image already in `public/`). If no image tool is available, simply omit the `poster` attribute — the `bg-gray-900` background on the hero container handles it.

### Step 2: Create `src/components/HeroVideo.tsx`

This component renders the full-bleed hero section. It is a standalone component so it can be swapped out when the real video arrives.

```tsx
// src/components/HeroVideo.tsx
export function HeroVideo() {
  return (
    <div className="relative w-full h-[60vh] min-h-[360px] bg-gray-900 overflow-hidden">
      {/* Background video — drop real file into public/ when ready */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        aria-hidden="true"
      >
        <source src="/teaser-placeholder.mp4" type="video/mp4" />
        <source src="/teaser-placeholder.webm" type="video/webm" />
      </video>

      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />

      {/* Hero text content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4 max-w-2xl">
          20 minutes from ChatGPT user<br className="hidden sm:block" /> to AI manager
        </h1>
        <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-md">
          No coding. No prompting. Just natural language.
        </p>
      </div>
    </div>
  );
}
```

### Step 3: Create `src/pages/Landing.tsx`

This page composes the HeroVideo, the "Start Level 1" CTA, and the optional badge banner. It uses React Router's `useSearchParams` to detect `?ref=badge`.

```tsx
// src/pages/Landing.tsx
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HeroVideo } from '../components/HeroVideo';

export function Landing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isBadgeRef = searchParams.get('ref') === 'badge';

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Badge referral banner — only visible when ?ref=badge */}
      {isBadgeRef && (
        <div
          data-testid="badge-banner"
          className="w-full bg-yellow-400 text-yellow-900 text-sm font-semibold
          py-3 px-4 text-center"
        >
          🎉 Someone completed Doppio and became an AI Manager! Start your journey →
        </div>
      )}

      {/* Hero section with video */}
      <HeroVideo />

      {/* CTA section */}
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <button
          onClick={() => navigate('/learn')}
          className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white
            text-lg font-bold py-4 px-8 rounded-2xl
            active:scale-95 transition-transform shadow-lg"
          style={{ touchAction: 'manipulation' }}
        >
          Start Level 1 →
        </button>

        <p className="mt-6 text-sm text-gray-400 max-w-xs">
          9 curated video lessons. 3 levels. One transformation.
        </p>
      </div>

    </div>
  );
}
```

### Step 4: Register the route in `src/App.tsx`

Ensure the `/` route renders `<Landing />`. React Router's `useSearchParams` on the Landing component automatically handles `/?ref=badge` without a separate route definition.

```tsx
// src/App.tsx — route registration (add if not already present)
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
// ... other imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/complete" element={<Complete />} />
      </Routes>
    </BrowserRouter>
  );
}
```

If `App.tsx` already has routes defined from Task 1.1, update the existing `"/"` route to use `<Landing />` instead of any placeholder.

### Step 5: Mobile responsiveness check

The hero section uses:
- `h-[60vh] min-h-[360px]` — fills most of the viewport on mobile without overflowing
- `px-6` — 24px horizontal padding on all sizes
- `text-4xl sm:text-5xl` — smaller headline on 390px, larger on tablet+
- `max-w-2xl` — constrains headline width on desktop without affecting mobile
- `w-full max-w-xs` on the CTA button — full width on mobile (fits 390px), constrained on desktop

At 390px (iPhone 14 Pro):
- The hero takes ~234px height (60vh of 390px viewport height)
- Headline is 36px (`text-4xl`), fits 2 lines comfortably
- CTA button is full width with 44px+ height (`py-4` = 32px padding + 28px line height ≈ 60px total)

### Step 6: Verify build and routes

After implementing:
1. Run `npm run build` — must exit 0 with no TypeScript errors
2. Start dev server: `npm run dev`
3. Navigate to `http://localhost:5173/` — verify landing page renders with dark background and CTA
4. Navigate to `http://localhost:5173/?ref=badge` — verify yellow banner appears above the hero

## Files to Create

- `src/pages/Landing.tsx` — Main landing page component
- `src/components/HeroVideo.tsx` — Hero section with video element

## Files to Modify

- `src/App.tsx` — Register `/` route pointing to `<Landing />` (update if placeholder exists)

## Files to Note (not create, just ensure exist)

- `public/teaser-placeholder.mp4` — Leave as non-existent; the `<source>` tag simply produces a silent 404 which is acceptable for the placeholder phase. The video element renders with the dark background as fallback.

## Contracts

### Provides (for downstream tasks)

- Route `/` renders `Landing.tsx` — all tasks can link back to landing
- Route `/?ref=badge` shows badge referral banner — Task 4.2 and Task 4.3 (share mechanic) depend on this existing
- `<HeroVideo />` component exported from `src/components/HeroVideo.tsx` — can be updated independently when real video arrives

### Consumes (from upstream tasks)

- Task 1.1: React Router installed, `src/App.tsx` exists, `public/` directory exists, Tailwind configured

## Acceptance Criteria

- [ ] Landing page renders at `http://localhost:5173/`
- [ ] Dark hero section visible (gray-950 or black background)
- [ ] `<video>` element has `autoPlay muted loop playsInline` attributes (verify in DevTools Elements panel)
- [ ] `<source src="/teaser-placeholder.mp4" type="video/mp4" />` present in DOM
- [ ] Headline text: "20 minutes from ChatGPT user to AI manager"
- [ ] Subheadline text: "No coding. No prompting. Just natural language."
- [ ] "Start Level 1 →" button is visible and tappable
- [ ] Clicking "Start Level 1 →" navigates to `/learn`
- [ ] Navigating to `/?ref=badge` shows the yellow badge referral banner above the hero
- [ ] Banner is NOT visible on `/` without `?ref=badge`
- [ ] Page renders correctly at 390px viewport width (no horizontal scroll, no overflow)
- [ ] Page renders correctly at 1440px viewport width
- [ ] `npm run build` exits 0 with no TypeScript errors
- [ ] No console errors at `/` or `/?ref=badge`

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npm run build` succeeds (run from project root)
- [ ] `npx tsc --noEmit` passes (no TypeScript errors)

### Browser Testing (Playwright MCP)

**Start dev server first**: `npm run dev` (starts on localhost:5173)

**Test 1 — Landing page renders:**
1. Navigate to `http://localhost:5173/`
2. Verify: headline "20 minutes from ChatGPT user to AI manager" is visible
3. Verify: subheadline "No coding. No prompting. Just natural language." is visible
4. Verify: "Start Level 1 →" button is visible
5. Verify: badge banner is NOT visible (no `?ref=badge` param)
6. Take screenshot: `landing-desktop.png`

**Test 2 — CTA navigation:**
1. From `http://localhost:5173/`
2. Click "Start Level 1 →" button
3. Verify: URL changes to `http://localhost:5173/learn`
4. Verify: no 404, page renders (even if placeholder)

**Test 3 — Badge referral banner:**
1. Navigate to `http://localhost:5173/?ref=badge`
2. Verify: yellow/amber banner appears at the top of the page
3. Verify: banner has `[data-testid="badge-banner"]` attribute and contains text: "🎉 Someone completed Doppio and became an AI Manager! Start your journey →"
4. Take screenshot: `landing-badge-banner.png`

**Test 4 — Mobile viewport (390px):**
1. Set viewport to 390×844 (iPhone 14 Pro)
2. Navigate to `http://localhost:5173/`
3. Verify: no horizontal scrollbar
4. Verify: headline is readable (not overflowing or cut off)
5. Verify: CTA button is full-width and large enough to tap
6. Take screenshot: `landing-mobile-390.png`

**Test 5 — Video element attributes:**
1. Navigate to `http://localhost:5173/`
2. Using `evaluate()`: `document.querySelector('video')?.autoplay` → should be `true`
3. Using `evaluate()`: `document.querySelector('video')?.muted` → should be `true`
4. Using `evaluate()`: `document.querySelector('video')?.loop` → should be `true`

### Edge Cases

- Navigate to `/?ref=xyz` (invalid ref value) — banner should NOT appear (only `ref=badge` triggers it)
- Navigate to `/?ref=badge&utm_source=twitter` — banner should appear (ref=badge present)
- Resize from 1440px to 390px while on landing — no layout breakage

## Skills to Read

- `doppio-architecture` — Project file structure, routing, key design decisions
- `canvas-confetti-gamification` — Landing page is the entry point to the gamification journey; understanding the share mechanic (badge URL) is context

## Git

- Branch: `feat/phase-3-landing-page`
- Commit message prefix: `Task 3.1:`
- Example commit: `Task 3.1: Add Landing page with hero video placeholder and badge referral banner`
