# Task 4.2: Level Completion Screen

## Objective

Build `LevelCompleteScreen.tsx` — a full-screen fixed overlay that fires canvas-confetti on mount, displays level-specific copy, and provides "Continue" (next level) and "Share" (badge URL) CTAs. This component is shown by `Learn.tsx` (Task 4.1) immediately when all 3 cards in a level are marked complete.

## Context

Level completion is the primary dopamine moment in Doppio's gamification loop. Each of the 3 levels has one completion screen. This component is reused for all 3 levels via a `level` prop. For levels 1 and 2, "Continue" navigates to the next level. For level 3, "Continue" navigates to `/complete` (Task 4.3). The screen never auto-dismisses — the user must tap to proceed.

## Dependencies

- Task 4.1 — `Learn.tsx` calls `<LevelCompleteScreen level={N} onContinue={...} onShare={...} />` when all 3 cards are complete
- Task 3.4 — `useProgress` is not directly used by this component, but level completion is determined by it (upstream in Learn.tsx)

## Blocked By

- Task 4.1 must be complete (Learn.tsx must exist and pass the correct props)

## Research Findings

Key findings from discovery and skill files relevant to this task:

- From `DISCOVERY.md D38`: `canvas-confetti`, particleCount 80–120, fire on level completion only, never on individual cards.
- From `DISCOVERY.md D40`: `active:scale-95` on CTA buttons. `touch-action: manipulation` on all interactive elements.
- From `DISCOVERY.md D41`: Full-screen overlay. Confetti on mount. Level-specific headline + emoji. Two buttons: primary "Continue to Level N+1" and secondary "Share". Level 3 special: "You're an AI Manager! 🎉". Never auto-dismiss.
- From `DISCOVERY.md D43`: Share URL is `https://doppio.kookyos.com/?ref=badge`. Use `navigator.share()` (Web Share API) with clipboard fallback. Toast: `react-hot-toast`.
- From `canvas-confetti-gamification SKILL.md §2`: `confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: [...] })` in `useEffect([], [])`.
- From `canvas-confetti-gamification SKILL.md §5`: Full component example — `fixed inset-0 z-50 bg-white`, animate-bounce emoji, headline, subtext, two buttons.
- From `canvas-confetti-gamification SKILL.md §6`: Web Share API + clipboard fallback pattern. `navigator.share()` MUST be called from a user gesture handler (onClick), NOT from useEffect.
- From `canvas-confetti-gamification SKILL.md §8`: `touch-action: manipulation` on all buttons. iOS safe-area-inset-bottom for fixed bottom elements.

## Implementation Plan

### Step 1: Create `LevelCompleteScreen.tsx`

Create `src/components/LevelCompleteScreen.tsx`. This is the complete component.

Level-specific copy:
- Level 1: emoji `🌱`, headline `"Level 1 Complete!"`, subtext `"You're thinking like an AI user. Time to delegate."`, CTA `"Start Level 2"`
- Level 2: emoji `⚡`, headline `"Level 2 Complete!"`, subtext `"You're delegating tasks to AI. Let's go deeper."`, CTA `"Start Level 3"`
- Level 3: emoji `🚀` / `🏆`, headline `"You're an AI Manager! 🎉"`, subtext `"You just transformed how you work. Forever."`, CTA `"See Your Badge"` (navigates to `/complete`)

```tsx
// src/components/LevelCompleteScreen.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

const LEVEL_CONFIG = {
  1: {
    emoji: '🌱',
    headline: 'Level 1 Complete!',
    subtext: "You're thinking like an AI user. Time to delegate.",
    ctaLabel: 'Start Level 2',
  },
  2: {
    emoji: '⚡',
    headline: 'Level 2 Complete!',
    subtext: "You're delegating tasks to AI. Let's go deeper.",
    ctaLabel: 'Start Level 3',
  },
  3: {
    emoji: '🏆',
    headline: "You're an AI Manager! 🎉",
    subtext: 'You just transformed how you work. Forever.',
    ctaLabel: 'See Your Badge',
  },
} as const;

const SHARE_URL = 'https://doppio.kookyos.com/?ref=badge';

interface LevelCompleteScreenProps {
  level: 1 | 2 | 3;
  onContinue: () => void;
  onShare: () => void;
}

export function LevelCompleteScreen({ level, onContinue, onShare }: LevelCompleteScreenProps) {
  const navigate = useNavigate();
  const config = LEVEL_CONFIG[level];

  // Fire confetti on mount — imperative canvas-confetti call
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    });
  }, []); // empty dep array — fires once on mount

  // "Continue" handler:
  // - Levels 1 & 2: call onContinue (parent advances to next level)
  // - Level 3: navigate to /complete
  const handleContinue = () => {
    if (level === 3) {
      navigate('/complete');
    } else {
      onContinue();
    }
  };

  // Share handler — MUST be called from onClick, not useEffect (iOS Safari requirement)
  const handleShare = async () => {
    const shareData = {
      title: "I'm now an AI Manager!",
      text: "I just completed a Doppio level — the Duolingo of AI. Try it in 20 minutes:",
      url: SHARE_URL,
    };
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast.success('Link copied! Share your progress 🎉');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(SHARE_URL).catch(() => {});
        toast.success('Link copied! Share your progress 🎉');
      }
    }
    // Fire analytics event (Task 5.1 will wire the full analytics module; call track() here)
    try {
      const { track } = await import('../lib/analytics');
      track('badge_shared');
    } catch {
      // analytics module may not exist yet in earlier phases — silent fail
    }
    // Also call the parent's onShare for any additional handling
    onShare();
  };

  return (
    // Fixed full-screen overlay — z-50 ensures it covers all content
    // No click-outside-to-dismiss: user must tap a button explicitly
    <div
      className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8"
      // Prevent click-through to cards underneath
      onClick={(e) => e.stopPropagation()}
    >
      {/* Celebration emoji — animate-bounce for delight */}
      <div className="text-8xl mb-6 animate-bounce" role="img" aria-label={config.headline}>
        {config.emoji}
      </div>

      {/* Level-specific headline */}
      <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
        {config.headline}
      </h1>

      {/* Encouragement subtext */}
      <p className="text-lg text-gray-500 text-center mb-10 max-w-xs">
        {config.subtext}
      </p>

      {/* Primary CTA — continue to next level or /complete */}
      <button
        onClick={handleContinue}
        className="w-full max-w-xs bg-blue-600 text-white text-lg font-semibold
          py-4 rounded-2xl mb-4 active:scale-95 transition-transform"
        style={{ touchAction: 'manipulation' }}
      >
        {config.ctaLabel}
      </button>

      {/* Secondary CTA — share badge */}
      <button
        onClick={handleShare}
        className="w-full max-w-xs border-2 border-blue-600 text-blue-600
          text-lg font-semibold py-4 rounded-2xl active:scale-95 transition-transform"
        style={{ touchAction: 'manipulation' }}
      >
        Share
      </button>

      {/* iOS safe area padding for bottom buttons */}
      <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
    </div>
  );
}
```

### Step 2: Verify analytics.track('badge_shared') wiring

The component attempts a dynamic import of `../lib/analytics` and calls `track('badge_shared')`. This import is wrapped in try/catch so it silently fails if the analytics module does not exist yet (Task 5.1 implements it fully). No changes to analytics.ts needed for this task.

### Step 3: Add react-hot-toast Toaster to App.tsx (if not already present)

For the share clipboard fallback toast to render, `<Toaster />` must be in the React tree. Verify it exists in `src/App.tsx`:

```tsx
// src/App.tsx — verify this exists (was added in Task 3.3)
import { Toaster } from 'react-hot-toast';

// Inside the JSX tree:
<Toaster position="bottom-center" />
```

If `<Toaster />` is already present from Task 3.3, no change needed.

### Step 4: Verify `LevelCompleteScreen` import in `Learn.tsx` (Task 4.1)

`Learn.tsx` must import and render `LevelCompleteScreen`. If Task 4.1 was completed before this component existed (with a stub), replace the stub now:

```tsx
// src/pages/Learn.tsx — ensure this import is live
import { LevelCompleteScreen } from '../components/LevelCompleteScreen';
```

## Files to Create

- `src/components/LevelCompleteScreen.tsx` — full-screen overlay component with confetti, level-specific copy, Continue and Share CTAs

## Files to Modify

- `src/App.tsx` — verify `<Toaster />` is present (add if missing from Task 3.3)
- `src/pages/Learn.tsx` — replace any stub `LevelCompleteScreen` import with the real component (if stub was used in Task 4.1)

## Contracts

### Provides (for downstream tasks)

- `LevelCompleteScreen` component: exported from `src/components/LevelCompleteScreen.tsx`
  - Props: `{ level: 1 | 2 | 3, onContinue: () => void, onShare: () => void }`
  - For level 3: internally navigates to `/complete` via `useNavigate()` on "Continue" tap, does NOT call `onContinue()`
  - Fires confetti on mount
  - Never auto-dismisses
- `badge_shared` analytics event: fires via dynamic import of `track()` on share button click

### Consumes (from upstream tasks)

- `canvas-confetti` package (installed in Task 1.1)
- `react-hot-toast` package (installed in Task 1.1) + `<Toaster />` in App.tsx (Task 3.3)
- `react-router-dom` `useNavigate` hook (installed in Task 1.1)
- Task 4.1 `Learn.tsx`: passes `level`, `onContinue`, `onShare` props

## Acceptance Criteria

- [ ] `LevelCompleteScreen` renders as a `fixed inset-0 z-50` overlay (covers all content)
- [ ] Overlay appears immediately when level complete (no animation delay on mount)
- [ ] canvas-confetti fires on mount (100 particles, Doppio color palette)
- [ ] Level 1: headline "Level 1 Complete!", CTA label "Start Level 2", emoji 🌱
- [ ] Level 2: headline "Level 2 Complete!", CTA label "Start Level 3", emoji ⚡
- [ ] Level 3: headline "You're an AI Manager! 🎉", CTA label "See Your Badge", emoji 🏆
- [ ] "Continue" on Level 1 → dismisses overlay, Learn.tsx advances to Level 2 tab
- [ ] "Continue" on Level 2 → dismisses overlay, Learn.tsx advances to Level 3 tab
- [ ] "Continue" on Level 3 → navigates to `/complete` route
- [ ] "Share" button: calls `navigator.share()` if available, else copies to clipboard
- [ ] "Share" clipboard fallback: shows toast "Link copied! Share your progress 🎉"
- [ ] `analytics.track('badge_shared')` called on share button tap
- [ ] Screen NEVER auto-dismisses — no setTimeout, no auto-navigation
- [ ] Clicking outside the overlay (on the cards beneath) does NOT dismiss it
- [ ] All buttons ≥ 44px tall, `touch-action: manipulation` applied
- [ ] `active:scale-95` visible on button tap (tactile feedback)
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] No console errors on render

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npm run build` succeeds
- [ ] `tsc --noEmit` passes

### Browser Testing (Playwright MCP)

Start: `npm run dev` (localhost:5173)

**Test 1: Level 1 completion overlay**
- Navigate to `http://localhost:5173/learn`
- Simulate completing all 3 Level 1 cards (trigger `onComplete` for all 3 VideoCards)
- Verify: Overlay appears with `fixed inset-0 z-50` CSS
- Verify: Canvas element exists in DOM (confetti canvas)
- Verify: Headline text is "Level 1 Complete!"
- Verify: 🌱 emoji visible and animating
- Verify: Primary button label is "Start Level 2"
- Verify: Secondary button label is "Share"

**Test 2: Continue navigation (Level 1 → Level 2)**
- (After Level 1 overlay appears) Click "Start Level 2"
- Verify: Overlay disappears
- Verify: Learn.tsx active tab changes to ⚡ Intermediate (Level 2)
- Verify: Level 2 cards are now rendered

**Test 3: Continue navigation (Level 3 → /complete)**
- Set localStorage: `doppio_progress = {"1":{"1":true,"2":true,"3":true},"2":{"1":true,"2":true,"3":true},"3":{"1":true,"2":true}}`
- Navigate to `/learn?level=3`
- Mark card 3 of Level 3 complete
- Verify: Level 3 completion overlay appears with "You're an AI Manager! 🎉" headline
- Click "See Your Badge"
- Verify: Page navigates to `/complete`

**Test 4: Share button — clipboard fallback (desktop)**
- On the Level 1 completion overlay, click "Share"
- Verify: Toast notification appears with text containing "Link copied"
- Verify (optional): `navigator.clipboard.readText()` contains `doppio.kookyos.com/?ref=badge`

**Test 5: Never auto-dismiss**
- After Level 1 completion overlay appears
- Wait 10 seconds without clicking anything
- Verify: Overlay is still visible after 10 seconds (no auto-dismiss)

**Test 6: Click-outside does NOT dismiss**
- Playwright: attempt to click on the area outside the buttons (on the overlay background)
- Verify: Overlay remains visible

**User-emulating flow:**
1. Open `/learn`
2. Complete all 3 Level 1 cards one by one
3. Level complete screen appears
4. Read the headline and subtext
5. Tap "Share" — see toast or native share sheet
6. Tap "Start Level 2" — overlay disappears, Level 2 cards appear

### External Service Verification

- None (share clipboard is browser API; analytics track is fire-and-forget)

## Skills to Read

- `canvas-confetti-gamification` — complete skill file, especially Sections 2 (confetti setup), 5 (Level Completion Screen component), 6 (Share Button), 8 (Mobile pitfalls)
- `doppio-architecture` — orientation and file structure

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D38, D40, D41, D43

## Git

- Branch: `phase-4/task-4-2-level-complete-screen`
- Commit message prefix: `Task 4.2:`
