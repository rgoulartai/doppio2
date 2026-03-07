# Gamification UX Research

**Project**: Doppio
**Date**: 2026-03-06
**Status**: complete

---

## Summary

Doppio is a Duolingo-style PWA targeting non-technical mobile users completing 9 video cards across 3 levels in ~20 minutes. The gamification surface is deliberately small: a linear progress bar (not circular), confetti on level/course completion, and a streak counter. The critical constraints are hackathon speed (1-day build), mobile-first (iOS Safari + Android Chrome), and bundle size discipline on a Vite/React/Tailwind stack.

Key recommendations:
- **Progress bar**: CSS-only with Tailwind (`transition-all duration-500`). No library needed. Zero bundle cost.
- **Confetti**: `canvas-confetti` (6 kB gzipped). Use sparingly: once per level completion, once on course completion. Do NOT use `react-confetti` for this use case.
- **Animations**: `framer-motion` (Motion for React, v11+) if the project already has it; otherwise pure CSS transitions via Tailwind suffice for MVP.
- **Streaks**: Not applicable for a single-session 20-minute course. Omit or simplify to a "cards completed today" counter.
- **Shareable badge**: Text link with URL query params. No image generation. OG meta tags on the landing page.
- **Level completion screen**: Full-screen overlay, confetti, one emoji, two buttons. Keep it under 3 seconds of screen time before offering "Continue."
- **Mobile-first non-negotiables**: 44px minimum touch targets, no hover-dependent interactions, test on iOS Safari specifically.

---

## Progress Bar Options

### Option A: CSS-Only with Tailwind (Recommended for MVP)

A horizontal `<div>` that grows via Tailwind's `transition-all duration-500 ease-out` and a dynamic `style={{ width: '${percent}%' }}` inline style. This is exactly how Duolingo's mobile web and most modern learning apps implement linear progress.

```jsx
// Linear progress bar — zero dependencies
function ProgressBar({ completed, total }) {
  const percent = Math.round((completed / total) * 100);
  return (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div
        className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${percent}%` }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
```

**Why this wins for Doppio**:
- Zero additional JavaScript. Pure CSS transitions are GPU-accelerated.
- Tailwind already in the stack — no new dependency.
- The progress metaphor for Doppio is inherently linear (Level 1 → 2 → 3, Card 1 → 2 → 3). A horizontal bar communicates this naturally.
- Circular progress bars (e.g., react-circular-progressbar) make sense for per-task completion rings (think Apple Fitness), not for linear course progress.

### Option B: `react-circular-progressbar`

- **Bundle**: ~10 kB minified (~4 kB gzipped)
- **Use case**: Circular SVG progress rings. Good for per-card "XP" or "completion %" display.
- **For Doppio**: Overkill. The 3-card-per-level structure means a circular indicator conveys no information a horizontal bar doesn't. Skip unless design specifically calls for a ring.
- **API**: `<CircularProgressbar value={75} text="75%" />` — simple, well-documented.

### Option C: `nprogress`

- **Bundle**: ~2 kB gzipped
- **Use case**: Thin top-of-page loading bar (like YouTube's red bar during navigation). Used for page transition feedback, not for quiz/lesson progress.
- **For Doppio**: Wrong pattern. NProgress signals "content loading," not "course progress." Users would misread it as a spinner/loader.

### Option D: Custom SVG Circle

A hand-rolled SVG `<circle>` with `stroke-dashoffset` animation is viable for a circular indicator without any library. ~15 lines of code, zero bundle cost, smooth CSS animation. Worth considering if a circular design is chosen.

### Recommendation

Use **Option A (CSS-only Tailwind)** for the main course progress bar (9/9 cards total). Display it at the top of every card screen. Update it after each card is marked complete. The animation is instant, smooth, and requires no library install.

---

## Confetti & Celebration

### `canvas-confetti` (Recommended)

- **Bundle**: ~6 kB gzipped (standalone, no React dependency)
- **Weekly downloads**: ~3M+ (extremely stable, widely used)
- **Version**: 1.9.x as of mid-2025
- **Mobile behavior**: Uses HTML5 Canvas. Performant on modern mobile hardware. Falls back gracefully on very old devices. Does NOT cause jank if fired once and allowed to settle (typically 3–5 seconds of animation).
- **API**: Imperative — call `confetti({ ... })` from an event handler. Does not require React state or re-renders.

```js
import confetti from 'canvas-confetti';

function fireLevelComplete() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#6366f1', '#a78bfa', '#f59e0b', '#34d399'],
  });
}
```

**Performance guidance for Doppio**:
- Fire once per level completion (3 times max in the entire user journey).
- Keep `particleCount` at 80–120. Above 200 causes frame drops on mid-range Android phones.
- Do not loop or sustain. Let it run to completion naturally (~3s).
- Use `requestAnimationFrame`-based firing (canvas-confetti does this internally).
- On iOS Safari: Canvas performance is excellent since iOS 15. No special handling needed.

**Side-cannon variant** for celebration screen (optional):
```js
function fireFromBothSides() {
  confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 } });
  confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 } });
}
```

### `react-confetti`

- **Bundle**: ~14 kB gzipped (includes React component overhead)
- **Weekly downloads**: ~800K
- **API**: Declarative React component `<Confetti width={width} height={height} />` rendered in the component tree.
- **Mobile behavior**: Measures window dimensions, uses `requestAnimationFrame`. More expensive than canvas-confetti because it re-renders on each frame via React state. On low-end Android, this can cause visible jank alongside other UI transitions.
- **When to prefer it**: When you want confetti integrated into a specific container/card rather than full-window. Also easier to combine with `numberOfPieces` countdown to zero for "settling" animation.

**Verdict for Doppio**: Use **`canvas-confetti`**. It is smaller, faster, framework-agnostic, and the imperative API pairs cleanly with `useEffect` or event handlers. React-confetti's component model is convenient but costs more on mobile.

### Pure CSS Celebration (Fallback/Alternative)

For a hackathon MVP, a CSS-only keyframe "burst" of emoji (🎉✨) can substitute for confetti entirely:

```css
@keyframes burst {
  0%   { opacity: 0; transform: scale(0) translateY(0); }
  60%  { opacity: 1; transform: scale(1.3) translateY(-40px); }
  100% { opacity: 0; transform: scale(1) translateY(-80px); }
}
```

This requires zero JS and zero bundle cost. For a hackathon, it can ship in 20 minutes and look polished with the right easing. Combine with Tailwind `animate-bounce` on completion badges.

---

## Streak Mechanics

### Is a Streak Applicable to Doppio?

A traditional streak (Duolingo-style, "Day 3") tracks **daily return visits**. Doppio's intended experience is **one 20-minute session** to complete the entire course. A day-based streak counter would show "Streak: 1" for the vast majority of users — meaningless and potentially demoralizing for users who don't return.

**Recommendation**: Reframe "streaks" for Doppio as one of:

1. **"Cards in a row" counter** (momentum, not daily): Show "3 in a row!" after completing 3 consecutive cards without leaving the app. Reset if user exits. Uses `sessionStorage` or React state only — no persistence needed.

2. **Per-session momentum display**: "You're on a roll! 2 levels complete." No real "streak" mechanic, just encouragement copy that updates as the user progresses.

3. **Return visitor streak** (only if Supabase sync is enabled): Track `lastActiveDate` in Supabase. On return, if `today !== lastActiveDate`, increment `streakDays`. Display on the progress screen. Requires auth.

### Simple localStorage Streak Implementation (if desired)

```js
function updateStreak() {
  const today = new Date().toISOString().slice(0, 10); // "2026-03-06"
  const { lastDate, streakCount } = JSON.parse(
    localStorage.getItem('doppioStreak') || '{"lastDate":null,"streakCount":0}'
  );
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let newStreak;
  if (lastDate === today) {
    newStreak = streakCount; // already counted today
  } else if (lastDate === yesterday) {
    newStreak = streakCount + 1; // consecutive day
  } else {
    newStreak = 1; // reset
  }

  localStorage.setItem('doppioStreak', JSON.stringify({
    lastDate: today,
    streakCount: newStreak,
  }));
  return newStreak;
}
```

### Visual Treatment for Streaks

If shown, keep it minimal:
- Fire emoji (🔥) + number: "🔥 3" — universally understood
- Display in the header or on the progress bar row — not as a prominent UI element
- Animate the number with a brief scale-up (`transform: scale(1.4)` then back) when incremented
- Duolingo uses an orange flame SVG with a counter — visually clear at a glance

**For Doppio MVP**: Skip the daily streak mechanic entirely. Use encouragement copy instead ("You're 2/3 done — almost there!"). Saves dev time and avoids the empty-streak problem for first-time users.

---

## Card Completion Animations

### The "Tap to Complete" → "Card Done" Transition

When a user returns from the "Try it" tab and a card is marked complete, the interaction must feel satisfying and clear. Three viable patterns:

#### Pattern 1: Checkmark Reveal (Recommended)

A green circle with a checkmark animates onto the card. The card dims slightly. Progress bar advances.

```jsx
// Using CSS transition + Tailwind
function CardCheckmark({ visible }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center
        transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center
        justify-center shadow-lg scale-100 transition-transform duration-200">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
            d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
  );
}
```

**Animation sequence**: card opacity 100% → 70% → checkmark fades in (300ms) → progress bar advances (500ms ease-out) → next card slides into view or next-level CTA appears.

#### Pattern 2: Card Slide-Out / Slide-In

Completed card slides left off screen; next card slides in from the right. Classic "swipe to next" feel — familiar from Tinder, Duolingo cards.

```css
@keyframes slideOutLeft {
  to { transform: translateX(-100%); opacity: 0; }
}
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
```

**Pros**: Clear progression metaphor. Feels native app-like.
**Cons**: Slightly more complex state management (card order, direction). For 3 cards per level, viable. For MVP, adds dev time.

#### Pattern 3: Framer Motion `AnimatePresence` (if library is included)

```jsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence>
  {!isComplete && (
    <motion.div
      key={cardId}
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* card content */}
    </motion.div>
  )}
</AnimatePresence>
```

**When to use**: If framer-motion is already in the bundle for other features, this adds zero marginal cost and produces silky animations.

### Micro-Interactions on the "Try it" Button

- Add a subtle scale pulse on tap: `active:scale-95` (Tailwind) — provides immediate tactile feedback
- Button state changes: `idle` → `loading` (spinner, 200ms delay) → `return` (different label "Back? Mark complete")
- On the "return and complete" tap: brief haptic-ish visual shake or pulse before the checkmark appears

### Card State Visual System

| State | Visual |
|-------|--------|
| Locked | Gray card, lock icon, opacity 50% |
| Available | Full opacity, shadow, animated subtle pulse border |
| In progress | Indigo border, no pulse |
| Complete | Green tint, checkmark overlay, opacity 80% |

---

## Level Completion Screen

### Common Patterns

Duolingo's level completion screen is the gold standard for this type of app:
1. Full-screen overlay (modal or route)
2. Large celebration emoji or animation
3. One-line achievement message ("Level 1 Complete!")
4. Sub-message with encouragement ("You're on your way to AI mastery")
5. XP / progress indicator
6. One primary CTA ("Continue")
7. Optional secondary CTA ("Share")

### Doppio-Specific Recommendation

Given the 3-level structure and hackathon timeline, implement a single `LevelCompleteScreen` component that receives props for level number and is reused. The final screen (Level 3 complete) gets special treatment with "You're now an AI manager!" copy and the share badge.

```jsx
function LevelCompleteScreen({ level, onContinue, onShare }) {
  const isFinal = level === 3;

  useEffect(() => {
    // Fire confetti on mount
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 z-50">
      {/* Celebration emoji — large, animated bounce */}
      <div className="text-8xl mb-6 animate-bounce">
        {isFinal ? '🏆' : ['🌱', '⚡', '🚀'][level - 1]}
      </div>

      {/* Level name */}
      <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
        {isFinal ? "You're an AI Manager!" : `Level ${level} Complete!`}
      </h1>

      {/* Encouragement copy */}
      <p className="text-lg text-gray-500 text-center mb-10 max-w-xs">
        {isFinal
          ? "You now know how to delegate work to AI agents like a pro."
          : `${['Beginner', 'Intermediate', 'Advanced'][level - 1]} unlocked. Keep going!`}
      </p>

      {/* Primary CTA */}
      <button
        onClick={onContinue}
        className="w-full max-w-xs bg-indigo-600 text-white text-lg font-semibold
          py-4 rounded-2xl mb-4 active:scale-95 transition-transform"
      >
        {isFinal ? 'Try the Playground' : `Start Level ${level + 1}`}
      </button>

      {/* Share (only on final) */}
      {isFinal && (
        <button
          onClick={onShare}
          className="w-full max-w-xs border-2 border-indigo-600 text-indigo-600
            text-lg font-semibold py-4 rounded-2xl active:scale-95 transition-transform"
        >
          Share My Badge
        </button>
      )}
    </div>
  );
}
```

### "Celebration Moment" Timing

The screen should feel rewarding but not trap users:
- Confetti fires immediately on mount
- No auto-advance. Let the user choose when to continue (respects autonomy).
- Do not auto-dismiss the screen after N seconds (users on mobile may be distracted)
- The "Continue" button should be immediately visible without scrolling on any screen size (use `max-h-screen` and `overflow-hidden` on the container)

---

## Shareable Badge (Text Link)

### PRD Decision

The PRD explicitly states: **"Badge sharing: text link (no image generation)"**. This means no server-side image rendering (no Puppeteer/Playwright screenshot, no `@vercel/og`), just a URL with query parameters and OG meta tags.

### URL Format

```
https://doppio.app/?badge=ai-manager&level=3&name=Renato
```

Or, cleaner with a dedicated route:

```
https://doppio.app/badge/ai-manager?name=Renato
```

**Parameters**:
- `badge`: badge slug (`ai-manager`, `beginner`, `intermediate`)
- `name`: user's name (optional — entered or omitted)
- `level`: completed level number

### OG Meta Tags for Link Preview

When the shareable URL is opened in iMessage, WhatsApp, Twitter/X, Slack, etc., the platform fetches OG metadata to generate a preview card. Since Doppio has zero backend for MVP, these tags must be **static** in the `index.html`.

**Static OG approach (MVP)**:
```html
<!-- In index.html -->
<meta property="og:title" content="I just became an AI Manager with Doppio!" />
<meta property="og:description" content="Complete 3 levels of AI mastery in 20 minutes. No coding. No prompts. Just natural language." />
<meta property="og:image" content="https://doppio.app/og-badge.png" />
<meta property="og:url" content="https://doppio.app" />
<meta name="twitter:card" content="summary_large_image" />
```

For MVP, `og-badge.png` is a **pre-designed static image** (e.g., 1200×630px "You're an AI Manager! | Doppio" graphic) committed to the repo and deployed as a static asset. No dynamic generation needed.

**Dynamic OG with Vercel Edge (optional, post-MVP)**:
Vercel's `@vercel/og` library generates dynamic OG images at the Edge in ~50ms. You'd create `/api/og?name=Renato&level=3` that returns a PNG. This would allow personalized badge images ("Renato is an AI Manager!") without a dedicated server. Out of scope for hackathon day.

### Share API

Use the Web Share API (supported on all modern mobile browsers) with a fallback to clipboard copy:

```js
async function sharebadge(userName) {
  const shareData = {
    title: "I'm now an AI Manager!",
    text: `I just completed Doppio — the Duolingo of AI. ${userName ? userName + ' is' : 'I am'} now an AI manager. Try it in 20 minutes:`,
    url: `https://doppio.app/?ref=badge`,
  };

  if (navigator.share && navigator.canShare(shareData)) {
    await navigator.share(shareData); // native share sheet on iOS/Android
  } else {
    await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
    // Show "Copied!" toast
  }
}
```

The Web Share API triggers the native share sheet on iOS and Android, which is the highest-friction-lowest-effort path to sharing. Desktop users get clipboard copy.

---

## Mobile-First Patterns

### Touch Targets

Apple HIG and Google Material both specify **minimum 44×44pt (CSS px on 1x display) interactive targets**. On mobile with typical text-sized buttons, this is often violated.

For Doppio:
- All card CTAs: `min-h-[44px]` or `py-3` with `text-base` (typically ~48px)
- "Try it" button: full-width, `py-4` (~56px) — this is the primary CTA, make it finger-friendly
- Progress dots or level indicators: if tappable, pad them to 44px tap area via `p-3`

```jsx
// Correct: tap target wraps small visual element
<button className="p-3 -m-3"> {/* negative margin offsets visual, preserves layout */}
  <div className="w-3 h-3 rounded-full bg-indigo-500" />
</button>
```

### Swipe Gestures

For card navigation, consider swipe-left to advance if cards are horizontally arranged. However, swipe gesture handling on iOS has nuances:
- iOS's horizontal scroll gesture conflicts with swipe navigation unless you explicitly prevent `touchmove` on the container
- For MVP: use explicit "Continue" / "Next" buttons. Do not add swipe until you've tested on real iOS Safari.

If swipe is added post-MVP, use `@use-gesture/react` (part of the react-spring ecosystem, ~5 kB gzipped) to handle touch events correctly across browsers.

### Tap vs Click

On mobile browsers, `click` fires ~300ms after `touchend` (legacy behavior from double-tap-to-zoom detection). Modern approaches:
- Use Tailwind's `active:scale-95` — provides visual feedback on `touchstart`, before the click fires. This makes the UI feel responsive immediately.
- For critical paths (the "Try it" CTA), consider adding `touch-action: manipulation` CSS to disable double-tap zoom and eliminate the 300ms delay:
```css
.try-it-btn { touch-action: manipulation; }
```
Or globally in Tailwind config if the app should never double-tap-zoom.

### Scroll Behavior

- Use `scroll-smooth` on level transitions: `document.querySelector('.next-card').scrollIntoView({ behavior: 'smooth' })`
- Avoid `position: fixed` elements that overlap scrollable content without proper `padding-bottom` on the scroll container (common iOS bug)
- For the video embed cards: set `overflow: hidden` and `aspect-ratio: 16/9` on the embed container to prevent layout shift as iframes load

### Viewport & Safe Areas

PWA standalone mode on iPhone X+ has a bottom safe area (home indicator). Use CSS env():
```css
padding-bottom: env(safe-area-inset-bottom);
/* Or with Tailwind plugin: pb-safe */
```

Add to the `manifest.json`: `"display": "standalone"` and `"viewport-fit": "cover"` in the HTML meta viewport tag.

### Font Size

Never set base font below 16px on mobile. iOS Safari will auto-zoom input fields with `font-size < 16px`. Tailwind's `text-base` is 16px — safe. Use `text-sm` (14px) only for labels and metadata, never for interactive elements.

---

## Recommended Libraries (with bundle sizes)

All gzipped sizes listed. Doppio's full Tailwind + React + Vite baseline is ~45-60 kB gzipped before any additional libraries.

| Library | Gzipped | Weekly DLs | Purpose | Doppio Verdict |
|---------|---------|------------|---------|---------------|
| `canvas-confetti` | ~6 kB | ~3M | Celebration confetti | **Use** |
| `framer-motion` (full) | ~45 kB | ~6M | Full animation suite | Avoid for MVP |
| `motion` (v11+, tree-shakeable) | ~15-25 kB | Part of FM | Micro-interactions | **Use if animations needed** |
| `react-spring` | ~30 kB | ~1.5M | Physics-based animations | Overkill for MVP |
| `@use-gesture/react` | ~5 kB | ~1M | Touch/swipe gestures | Post-MVP only |
| `react-circular-progressbar` | ~4 kB | ~900K | Circular SVG progress | Skip — CSS-only suffices |
| `react-confetti` | ~14 kB | ~800K | React confetti component | Skip — use canvas-confetti |
| `nprogress` | ~2 kB | ~2M | Page-load progress bar | Wrong pattern for Doppio |
| `react-hot-toast` | ~4 kB | ~1.5M | Toast notifications | **Use** (for "Copied!" etc.) |
| `zustand` | ~3 kB | ~4M | Global state (progress) | **Use** over Redux/Context |
| `vite-plugin-pwa` | dev-only | ~500K | PWA manifest + SW | **Use** (already planned) |

### Optimal Library Budget for Doppio MVP

```
React + ReactDOM:     ~45 kB
Tailwind (purged):    ~8-15 kB
canvas-confetti:      ~6 kB
react-hot-toast:      ~4 kB
zustand:              ~3 kB
motion (selective):   ~15 kB (optional)
─────────────────────────────
Total (no motion):    ~78 kB gzipped
Total (with motion):  ~93 kB gzipped
```

Target: stay under 100 kB gzipped for fast load on 3G (common for hackathon demos in conference venues).

### Animation Strategy Without Framer Motion

For MVP without adding any animation library:
- `transition-all duration-300 ease-out` on card state changes
- `animate-bounce` on celebration emoji (Tailwind built-in)
- `animate-pulse` on "available" card border indicator
- CSS `@keyframes` for the checkmark draw-on effect (20 lines of CSS)
- `transition-transform duration-200 active:scale-95` on all buttons

This approach costs zero additional bundle bytes and produces a polished, tactile feel.

---

## Common Pitfalls

### 1. Confetti on Every Card Completion

Firing confetti on each of the 9 cards kills the delight of the level/course completion. Reserve confetti for level completions and the final "AI Manager" screen only. Use a simpler micro-animation (checkmark + progress bar advance) for individual card completions.

### 2. Auto-Advancing the Completion Screen

Auto-dismissing the celebration screen after 3 seconds feels disrespectful of the user's moment. Some users want to screenshot it, share it, or just absorb it. Always require an explicit tap to continue.

### 3. Using `react-confetti` Inside a Card Container

`react-confetti` measures `window.innerWidth/innerHeight` and fills the entire viewport. Placing it inside a card container requires manual width/height calculations that break on orientation change. Use `canvas-confetti` (full-window, no sizing needed) instead.

### 4. Ignoring iOS Safari PWA Quirks

- `localStorage` persists across PWA sessions on iOS, but clears if the app is uninstalled and reinstalled.
- `navigator.share()` on iOS requires a user gesture (cannot be called in a `useEffect` without a triggering click).
- The iOS PWA status bar covers the top of the viewport. Add `<meta name="apple-mobile-web-app-status-bar-style" content="default">` and `env(safe-area-inset-top)` padding.
- `position: fixed` bugs on iOS: avoid using `fixed` inside scrollable containers. Prefer `sticky` for headers.

### 5. Progress State Living Only in React State

If progress lives only in React state and not in `localStorage`, a user who accidentally closes the tab loses all progress. Write to `localStorage` on every card completion — not just at level completion. Use a `useEffect` that syncs state → localStorage on any progress change.

### 6. Framer Motion AnimatePresence Causing Unmount Race Conditions

When cards exit and new cards enter simultaneously with `AnimatePresence`, exit animations can conflict with entering animations if the `key` prop is not correctly set. Always give each card a stable, unique `key` (not array index) and test the transition in both directions.

### 7. Touch Target Too Small on Level Indicator Dots

If you show level progress as 3 dots (L1 ◉ L2 ◎ L3 ◎), the dots are typically 8-12px — far below the 44px minimum. Either make them non-interactive (decorative only) or pad them to 44px as described in the Mobile section.

### 8. Streak Counter Shown as "1" Forever

For a single-session app, a streak counter that reads "1" for 95% of users provides no motivational value and may confuse them ("1 what?"). If including streak mechanics, gate them behind at least 2 days of data before displaying. For MVP, omit entirely.

### 9. OG Image Not Cached

When a user shares the link on WhatsApp or iMessage, those platforms cache the OG image aggressively. If you update the image after sharing, the old preview may persist for days. Version the OG image URL: `og-badge-v2.png` to bust the cache.

### 10. Video Embeds Causing Layout Shift

Embedded iframes (YouTube, TikTok) load asynchronously and have no intrinsic height before loading. Without a defined aspect ratio container, they cause Cumulative Layout Shift (CLS) that pushes content around. Always wrap embeds in:
```css
.video-wrapper {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  overflow: hidden;
}
.video-wrapper iframe {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
}
```

---

## References

**Libraries**:
- canvas-confetti: https://github.com/catdad/canvas-confetti — imperative canvas-based confetti, 6 kB gzipped
- react-circular-progressbar: https://github.com/kevinsqi/react-circular-progressbar — SVG circle progress, ~4 kB
- framer-motion / motion: https://motion.dev — full animation suite, tree-shakeable v11+
- react-spring: https://react-spring.dev — physics-based animations
- react-hot-toast: https://react-hot-toast.com — lightweight toast, ~4 kB
- zustand: https://github.com/pmndrs/zustand — minimal state management, ~3 kB

**Patterns & UX**:
- Duolingo Engineering Blog — gamification and mobile UX decisions (various posts 2023-2025)
- Apple Human Interface Guidelines — Touch targets, safe areas: https://developer.apple.com/design/human-interface-guidelines/
- Google Material Design — Touch target guidance: https://m3.material.io/foundations/accessible-design/accessibility-basics
- Web Share API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
- Open Graph Protocol: https://ogp.me
- Vercel OG (post-MVP reference): https://vercel.com/docs/og-image-generation

**Performance**:
- Web Vitals / CLS for iframes: https://web.dev/cls/
- Canvas performance on mobile: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- iOS Safari PWA status bar: https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
