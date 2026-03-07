---
name: canvas-confetti-gamification
description: Gamification implementation for Doppio — confetti, progress bar, card completion, level screens. Use when implementing any celebration animation, progress indicator, or the level/final completion screens.
---

# Skill: canvas-confetti-gamification

Doppio's gamification surface is deliberately small. Three levels, nine cards, one 20-minute session. Every animation decision is constrained by mobile performance (mid-range Android), bundle size discipline, and the hackathon deadline. This skill encodes all decisions from the DISCOVERY.md authority document (section 8) and the gamification-ux research.

---

## 1. canvas-confetti Setup

### Install

```bash
npm install canvas-confetti @types/canvas-confetti
```

### Import

```typescript
import confetti from 'canvas-confetti';
```

### Why canvas-confetti and NOT react-confetti

| | canvas-confetti | react-confetti |
|---|---|---|
| Bundle (gzipped) | ~6 kB | ~14 kB |
| Re-renders | None — imperative Canvas API | Every frame via React state |
| Mobile jank | None on iOS 15+, Android mid-range | Visible on low-end Android alongside other transitions |
| API model | `confetti({ ... })` — call once from `useEffect` or event handler | Declarative `<Confetti />` component in the tree |

**NEVER use react-confetti for Doppio.** It re-renders on every animation frame through React state, which causes visible jank alongside card transitions on mid-range Android. canvas-confetti uses the Canvas API directly and is framework-agnostic.

---

## 2. Confetti — Level Completion Only

Confetti fires **3 times total** across the entire user journey: once per level completion. Do NOT fire on individual card completions. Firing confetti on each of the 9 cards destroys the dopamine hit of the finale — the "level complete" moment loses all impact.

### Standard fire (level completion screens)

```typescript
const fireConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
  });
};

// Call inside useEffect when the level completion screen mounts:
useEffect(() => {
  fireConfetti();
}, []); // empty deps — fires once on mount
```

### particleCount range

Keep `particleCount` between **80 and 120**. This is the performance-safe range for mid-range Android phones. Above 200 causes frame drops. Do not loop or sustain the animation — let canvas-confetti run to natural completion (~3 seconds). It uses `requestAnimationFrame` internally.

### Side-cannon variant (optional, for the final Level 3 screen)

```typescript
const fireFromBothSides = () => {
  confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 } });
  confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 } });
};
```

---

## 3. CSS-Only Progress Bar

No library needed. Tailwind's `transition-all duration-500 ease-out` with an inline `width` style is exactly how Duolingo's mobile web implements linear progress. Zero additional JavaScript, GPU-accelerated CSS transition.

```jsx
// Shows progress through the current level (e.g., 2/3 cards complete)
function ProgressBar({ completedCards, totalCards }) {
  const percent = Math.round((completedCards / totalCards) * 100);
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${(completedCards / totalCards) * 100}%` }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
```

The progress bar advances after a card is marked complete, driven by the 500ms `transition-all` — no JavaScript animation library required. Use `h-2` (8px) for the level progress bar shown in the top bar of each card screen.

---

## 4. Card Completion Animation

Individual card completion uses a checkmark overlay and progress bar advance. No confetti here.

### Checkmark overlay

Absolutely positioned over the card, fades in with a 300ms CSS opacity transition.

```jsx
function CardCheckmark({ visible }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center
        transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
  );
}
```

### Animation sequence for card completion

1. User taps "Mark as done"
2. Checkmark overlay fades in — CSS opacity 0 → 1 over **300ms**
3. Card dims slightly (optional: `opacity-70` on the card container)
4. Progress bar advances — CSS width transition over **500ms ease-out**
5. Next card becomes available or the level completion screen mounts

### Touch feedback on CTA buttons

Add `active:scale-95` to all CTA buttons. This provides immediate visual feedback on `touchstart`, before the `click` event fires (~300ms later on mobile). No library needed — Tailwind utility.

```jsx
<button className="... active:scale-95 transition-transform">
  Mark as done
</button>
```

### Card state visual system

| State | Visual treatment |
|---|---|
| Available | Full opacity, shadow, subtle `animate-pulse` border |
| In progress | Indigo border, no pulse |
| Complete | Green tint, checkmark overlay, `opacity-80` |

---

## 5. Level Completion Screen

### Structure

- Full-screen overlay: `fixed inset-0 z-50 bg-white`
- Confetti fires on component mount via `useEffect`
- Large emoji (animated bounce) + level-specific headline
- Encouragement subtext
- Primary CTA button: "Continue to Level N+1" (or "Start Level N+1")
- Secondary CTA button: "Share" (appears on all level completions)
- Level 3 special headline: **"You're an AI Manager! 🎉"**
- **NEVER auto-dismiss** — always require an explicit tap. Users may want to screenshot or share before continuing.

```jsx
import confetti from 'canvas-confetti';

const LEVEL_EMOJIS = ['🌱', '⚡', '🚀'];
const LEVEL_NAMES = ['Beginner', 'Intermediate', 'Advanced'];

function LevelCompleteScreen({ level, onContinue, onShare }) {
  const isFinal = level === 3;

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8">
      {/* Celebration emoji */}
      <div className="text-8xl mb-6 animate-bounce">
        {isFinal ? '🏆' : LEVEL_EMOJIS[level - 1]}
      </div>

      {/* Headline */}
      <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
        {isFinal ? "You're an AI Manager! 🎉" : `Level ${level} Complete!`}
      </h1>

      {/* Encouragement */}
      <p className="text-lg text-gray-500 text-center mb-10 max-w-xs">
        {isFinal
          ? 'You now know how to delegate work to AI agents like a pro.'
          : `${LEVEL_NAMES[level - 1]} unlocked. Keep going!`}
      </p>

      {/* Primary CTA */}
      <button
        onClick={onContinue}
        className="w-full max-w-xs bg-blue-600 text-white text-lg font-semibold
          py-4 rounded-2xl mb-4 active:scale-95 transition-transform"
        style={{ touchAction: 'manipulation' }}
      >
        {isFinal ? 'View Resources' : `Start Level ${level + 1}`}
      </button>

      {/* Share CTA */}
      <button
        onClick={onShare}
        className="w-full max-w-xs border-2 border-blue-600 text-blue-600
          text-lg font-semibold py-4 rounded-2xl active:scale-95 transition-transform"
        style={{ touchAction: 'manipulation' }}
      >
        Share
      </button>
    </div>
  );
}
```

### Why no auto-dismiss

Auto-dismissing after N seconds is disrespectful of the user's moment. Some users want to screenshot, share, or simply absorb the screen. On mobile, users may be momentarily distracted (notification, incoming call). The "Continue" button must be immediately visible without scrolling on any screen size — use `max-h-screen overflow-hidden` on the container if needed.

---

## 6. Share Button Implementation

### Web Share API with clipboard fallback

The Web Share API triggers the native share sheet on iOS and Android. Desktop browsers fall back to clipboard copy.

```typescript
const SHARE_URL = 'https://doppio.kookyos.com/?ref=badge';

async function handleShare() {
  const shareData = {
    title: "I'm now an AI Manager!",
    text: "I just completed Doppio — the Duolingo of AI. I'm now an AI manager. Try it in 20 minutes:",
    url: SHARE_URL,
  };

  try {
    if (navigator.share && navigator.canShare(shareData)) {
      await navigator.share(shareData); // native share sheet on iOS/Android
    } else {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      showToast('Link copied to clipboard!');
    }
  } catch (err) {
    // User cancelled share — not an error, do nothing
    if ((err as Error).name !== 'AbortError') {
      // Fallback to clipboard if share failed for a non-cancellation reason
      await navigator.clipboard.writeText(SHARE_URL);
      showToast('Link copied to clipboard!');
    }
  }
}
```

### Share URL

```
https://doppio.kookyos.com/?ref=badge
```

This is the canonical share URL defined in DISCOVERY.md D43. The OG badge image (`og-badge.png`, 1200x630px) is a static asset committed to `/public` — no dynamic image generation needed for MVP.

### Toast on clipboard copy

Use `react-hot-toast` (~4 kB gzipped) for the "Copied!" notification:

```typescript
import toast from 'react-hot-toast';

// Replace showToast above with:
toast.success('Link copied to clipboard!');
```

**Important**: `navigator.share()` MUST be called within a user gesture handler (a click/tap event). It cannot be triggered from `useEffect` — iOS Safari will block it.

---

## 7. Final Completion Screen (after Level 3)

The final completion screen is the same `LevelCompleteScreen` component with `level={3}`, plus an additional curated resource links section rendered below the buttons.

```jsx
function FinalCompleteScreen({ onShare }) {
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="flex flex-col items-center justify-start p-8 pt-16 min-h-full">
        {/* Trophy + headline */}
        <div className="text-8xl mb-6 animate-bounce">🏆</div>
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
          You're an AI Manager! 🎉
        </h1>
        <p className="text-lg text-gray-500 text-center mb-10 max-w-xs">
          You now know how to delegate work to AI agents like a pro.
        </p>

        {/* Share badge */}
        <button
          onClick={onShare}
          className="w-full max-w-xs bg-blue-600 text-white text-lg font-semibold
            py-4 rounded-2xl mb-4 active:scale-95 transition-transform"
          style={{ touchAction: 'manipulation' }}
        >
          Share My Badge
        </button>

        {/* Curated resource links — sourced from content curation research */}
        <div className="w-full max-w-xs mt-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Keep Learning
          </h2>
          {/* Resource links rendered from content.json or a static array */}
          {CURATED_RESOURCES.map((resource) => (
            <a
              key={resource.url}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0
                text-gray-700 hover:text-blue-600 active:opacity-70"
              style={{ touchAction: 'manipulation' }}
            >
              <span className="text-xl">{resource.emoji}</span>
              <div>
                <div className="font-medium text-sm">{resource.title}</div>
                <div className="text-xs text-gray-400">{resource.description}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Resource links come from content curation research (Skill Leap AI, Matt Wolfe, Anthropic Official, The Rundown AI, etc.) stored in `content.json` to allow updates without code changes.

---

## 8. Mobile Pitfalls

### touch-action: manipulation on buttons

Eliminates the 300ms tap delay caused by double-tap-to-zoom detection. Apply to all interactive elements in the gamification flow:

```css
/* In your global CSS or Tailwind base layer */
button, a {
  touch-action: manipulation;
}
```

Or inline on individual buttons as shown in the examples above:
```jsx
style={{ touchAction: 'manipulation' }}
```

### iOS safe-area-inset-bottom for fixed bottom bars

Any `fixed` element at the bottom of the screen (a "Continue" bar, bottom CTA) must account for the iPhone X+ home indicator:

```css
/* CSS */
.fixed-bottom-bar {
  padding-bottom: env(safe-area-inset-bottom);
}
```

```jsx
/* Tailwind — requires the tailwindcss-safe-area plugin, or inline style */
<div
  className="fixed bottom-0 left-0 right-0 bg-white p-4"
  style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
>
  <button className="...">Continue</button>
</div>
```

Also add `"viewport-fit": "cover"` to the HTML meta viewport tag in `index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

### Minimum touch targets

All gamification buttons must meet the 44px minimum:
- Level completion CTA buttons: `py-4` (~56px height) — correct
- Card "Mark as done" button: `py-3` + `text-base` (~48px) — correct
- Progress dots or indicators: if tappable, use `p-3 -m-3` to expand tap area without affecting layout

### navigator.share() must be called from a user gesture

Do NOT call `navigator.share()` from `useEffect`. iOS Safari blocks share attempts that are not directly triggered by a user interaction (click/touch event). The share handler must be wired to `onClick` on a button.

---

## 9. Decision Log (from DISCOVERY.md)

| Decision | Source | Rationale |
|---|---|---|
| canvas-confetti, not react-confetti | D38, gamification-ux.md | 6 kB vs 14 kB; no per-frame React re-renders |
| particleCount 80-120 | D38, gamification-ux.md | Performance-safe on mid-range Android |
| Confetti on level completion only | D38, gamification-ux.md | Preserves dopamine hit for the finale |
| CSS-only progress bar | D37, gamification-ux.md | Zero bundle cost; Tailwind already in stack |
| Checkmark overlay, 300ms fade | D40 | Satisfying without adding animation library |
| No auto-dismiss on completion screens | D41, gamification-ux.md | Respects user autonomy; mobile distraction reality |
| Level 3 headline: "You're an AI Manager! 🎉" | D41, D42 | Brand moment; matches share badge copy |
| Share URL: doppio.kookyos.com/?ref=badge | D43 | Canonical from DISCOVERY.md |
| Web Share API + clipboard fallback | D43, gamification-ux.md | Native share sheet on mobile; graceful desktop fallback |
| No streaks mechanic | D39 | Wrong pattern for a single-session app; would always show "1" |
| Curated resource links on final screen | D42 | 3-5 links from content curation research stored in content.json |
