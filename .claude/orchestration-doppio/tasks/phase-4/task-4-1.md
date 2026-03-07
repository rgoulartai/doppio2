# Task 4.1: Level Navigation & Card Flow

## Objective

Build the `Learn.tsx` page with a 3-tab level navigator and per-level card list. The page determines the current active level from user progress, allows free navigation to any level, and triggers the `LevelCompleteScreen` overlay (Task 4.2) when all 3 cards in a level are marked complete.

## Context

Phase 4 introduces the full level-flow game loop. Task 4.1 is the spine of that loop: it ties together the progress tracking from Task 3.4 (useProgress hook), the VideoCard component from Task 3.2, and sets the stage for the level completion screen (Task 4.2). All 9 cards become navigable here. This task is the first point where the user sees the complete level structure in one view.

## Dependencies

- Task 3.2 — `VideoCard` component (`src/components/VideoCard.tsx`) with facade, lazy embed, Try-it button, and completion checkmark
- Task 3.4 — `useProgress` hook (`src/hooks/useProgress.ts`) returning `{progress, markComplete, completedCount, isLevelComplete}`

## Blocked By

- Task 3.2 must be complete (VideoCard component)
- Task 3.4 must be complete (useProgress hook)

## Research Findings

Key findings from discovery and skill files relevant to this task:

- From `DISCOVERY.md D56`: Free navigation — user can tap any completed level or card to re-watch. No forced linear lock. Cards show "completed" state visually but are never locked.
- From `DISCOVERY.md D60`: Routes are `/learn` (current level) with `?level=1|2|3` query param for direct linking.
- From `DISCOVERY.md D61`: Minimal chrome. Top bar: Doppio logo left + current progress indicator right (`N of 9 complete`). No traditional navigation menu.
- From `DISCOVERY.md D15`: Level 1 = Beginner (🌱), Level 2 = Intermediate (⚡), Level 3 = Advanced (🚀).
- From `DISCOVERY.md D37`: Progress bar is CSS-only with Tailwind `transition-all duration-500 ease-out`.
- From `canvas-confetti-gamification SKILL.md §5`: Level completion triggers a full-screen overlay (`fixed inset-0 z-50`). Never auto-dismiss.
- From `doppio-content-schema SKILL.md`: `content.json` provides `levels[].emoji`, `levels[].title`, `levels[].cards[]` — import and use directly.

## Implementation Plan

### Step 1: Create `LevelNav.tsx` — the 3-tab level selector

Create `src/components/LevelNav.tsx`. This is a row of 3 tab buttons, one per level.

```tsx
// src/components/LevelNav.tsx
import content from '../data/content.json';

interface LevelNavProps {
  activeLevel: 1 | 2 | 3;
  completedCounts: Record<1 | 2 | 3, number>; // how many cards complete per level
  onSelectLevel: (level: 1 | 2 | 3) => void;
}

export function LevelNav({ activeLevel, completedCounts, onSelectLevel }: LevelNavProps) {
  return (
    <div className="flex border-b border-gray-200">
      {content.levels.map((lvl) => {
        const isActive = lvl.level === activeLevel;
        const isFullyComplete = completedCounts[lvl.level as 1 | 2 | 3] === 3;
        return (
          <button
            key={lvl.level}
            onClick={() => onSelectLevel(lvl.level as 1 | 2 | 3)}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1
              transition-colors
              ${isActive
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'}`}
            style={{ touchAction: 'manipulation' }}
          >
            <span>{lvl.emoji}</span>
            <span>{lvl.title}</span>
            {isFullyComplete && <span className="text-green-500 text-xs">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
```

Key behaviors:
- Active tab: `border-b-2 border-blue-600 text-blue-600` (clear visual active state)
- Fully complete level: checkmark `✓` appended to tab label
- All tabs always tappable — no locking

### Step 2: Create `LevelHeader.tsx` — top bar with logo and progress

Create `src/components/LevelHeader.tsx`. Renders the top bar shown on the Learn page.

```tsx
// src/components/LevelHeader.tsx
import { Link } from 'react-router-dom';

interface LevelHeaderProps {
  totalCompleted: number; // 0–9
}

export function LevelHeader({ totalCompleted }: LevelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
      <Link to="/" className="font-bold text-lg tracking-tight text-gray-900">
        Doppio
      </Link>
      <span className="text-sm text-gray-500 font-medium">
        {totalCompleted} of 9 complete
      </span>
    </div>
  );
}
```

### Step 3: Create `CardList.tsx` — renders the 3 VideoCards for a level

Create `src/components/CardList.tsx`. Receives the level's cards and the completion state, renders them as a vertical stack.

```tsx
// src/components/CardList.tsx
import { VideoCard } from './VideoCard'; // from Task 3.2
import type { Level } from '../types/content';

interface CardListProps {
  level: Level;
  completedCards: Record<1 | 2 | 3, boolean>; // progress[levelNumber]
  onCardComplete: (card: 1 | 2 | 3) => void;
}

export function CardList({ level, completedCards, onCardComplete }: CardListProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {level.cards.map((card) => (
        <VideoCard
          key={card.id}
          card={card}
          isCompleted={completedCards[card.card as 1 | 2 | 3] ?? false}
          onComplete={() => onCardComplete(card.card as 1 | 2 | 3)}
        />
      ))}
    </div>
  );
}
```

### Step 4: Build `Learn.tsx` — the main page

Create `src/pages/Learn.tsx`. This is the orchestrating page component.

```tsx
// src/pages/Learn.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import content from '../data/content.json';
import { useProgress } from '../hooks/useProgress'; // from Task 3.4
import type { ProgressState } from '../hooks/useProgress'; // ProgressState shape from Task 3.4
import { LevelHeader } from '../components/LevelHeader';
import { LevelNav } from '../components/LevelNav';
import { CardList } from '../components/CardList';
import { LevelCompleteScreen } from '../components/LevelCompleteScreen'; // Task 4.2

export function Learn() {
  const [searchParams] = useSearchParams();
  const { progress, markComplete, completedCount, isLevelComplete } = useProgress();

  // Determine initial level:
  // - ?level=N query param overrides everything
  // - Otherwise: first level that is not fully complete (or level 3 if all done)
  const getInitialLevel = (): 1 | 2 | 3 => {
    const param = searchParams.get('level');
    if (param === '1' || param === '2' || param === '3') {
      return parseInt(param) as 1 | 2 | 3;
    }
    // First incomplete level
    for (const n of [1, 2, 3] as const) {
      if (!isLevelComplete(n)) return n;
    }
    return 3; // All complete — stay on level 3
  };

  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(getInitialLevel);
  const [showLevelComplete, setShowLevelComplete] = useState<1 | 2 | 3 | null>(null);

  // Compute per-level completed counts for LevelNav checkmarks
  const completedCounts: Record<1 | 2 | 3, number> = {
    1: Object.values(progress.level_1 ?? {}).filter(Boolean).length,
    2: Object.values(progress.level_2 ?? {}).filter(Boolean).length,
    3: Object.values(progress.level_3 ?? {}).filter(Boolean).length,
  };

  // Total completed cards (for top bar "N of 9 complete")
  const totalCompleted = completedCounts[1] + completedCounts[2] + completedCounts[3];

  // Handle card completion — if that completes the level, show overlay
  const handleCardComplete = (level: 1 | 2 | 3, card: 1 | 2 | 3) => {
    markComplete(level, card);
    // Re-check level completeness AFTER marking
    // isLevelComplete uses progress from hook, but we need the updated state.
    // Compute locally to avoid stale closure:
    const updated = { ...(progress[`level_${level}` as keyof ProgressState] ?? {}), [card]: true };
    const allDone = [1, 2, 3].every((c) => updated[c as 1 | 2 | 3]);
    if (allDone) {
      setShowLevelComplete(level);
    }
  };

  const handleContinue = () => {
    const completed = showLevelComplete;
    setShowLevelComplete(null);
    if (completed === 3) {
      // Navigate to /complete is handled inside LevelCompleteScreen via onContinue
    } else if (completed === 1 || completed === 2) {
      setActiveLevel((completed + 1) as 1 | 2 | 3);
    }
  };

  const currentLevelData = content.levels.find((l) => l.level === activeLevel);

  if (!currentLevelData) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <LevelHeader totalCompleted={totalCompleted} />
      <LevelNav
        activeLevel={activeLevel}
        completedCounts={completedCounts}
        onSelectLevel={setActiveLevel}
      />
      <main className="flex-1 overflow-y-auto">
        <CardList
          level={currentLevelData}
          completedCards={progress[`level_${activeLevel}` as keyof ProgressState] ?? { card_1: false, card_2: false, card_3: false }}
          onCardComplete={(card) => handleCardComplete(activeLevel, card)}
        />
      </main>

      {showLevelComplete !== null && (
        <LevelCompleteScreen
          level={showLevelComplete}
          onContinue={handleContinue}
          onShare={handleShare}
        />
      )}
    </div>
  );
}

// Share handler (defined outside component to avoid re-render issues)
async function handleShare() {
  const SHARE_URL = 'https://doppio.kookyos.com/?ref=badge';
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
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      await navigator.clipboard.writeText(SHARE_URL).catch(() => {});
    }
  }
}
```

Important notes:
- `?level=N` query param enables direct linking to a specific level (D60)
- Level completion detection: compute locally after `markComplete` to avoid stale closure
- `showLevelComplete` state drives the overlay — it is set to the level number, not a boolean
- `handleShare` calls `navigator.share()` — must stay in event handler chain, not in useEffect

### Step 5: Wire `Learn.tsx` into React Router

Ensure `App.tsx` routes `/learn` to the `Learn` page. This was set up as a placeholder in Task 1.1 — replace the placeholder with the real import:

```tsx
// src/App.tsx (update existing route)
import { Learn } from './pages/Learn';

// Inside <Routes>:
<Route path="/learn" element={<Learn />} />
```

### Step 6: Add ProgressBar component to the level view (optional enhancement)

The progress bar (from Task 3.4 / canvas-confetti-gamification SKILL.md §3) showing `completedCards / 3` for the active level can be added below the LevelNav. This is optional if Task 3.4 already included it; add if missing.

```tsx
// Inside Learn.tsx, after <LevelNav>:
<div className="px-4 pt-3 pb-1">
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
      style={{ width: `${(completedCounts[activeLevel] / 3) * 100}%` }}
      role="progressbar"
      aria-valuenow={completedCounts[activeLevel]}
      aria-valuemin={0}
      aria-valuemax={3}
    />
  </div>
</div>
```

## Files to Create

- `src/components/LevelNav.tsx` — 3-tab level selector with active state and completion checkmarks
- `src/components/LevelHeader.tsx` — top bar: Doppio logo + "N of 9 complete"
- `src/components/CardList.tsx` — vertical stack of 3 VideoCards for the active level
- `src/pages/Learn.tsx` — main page orchestrating all above components

## Files to Modify

- `src/App.tsx` — replace placeholder `/learn` route with real `<Learn />` import

## Contracts

### Provides (for downstream tasks)

- `Learn.tsx` page: renders at `/learn`, supports `?level=1|2|3` query param for direct linking
- `showLevelComplete` state: set to level number (1|2|3) when all 3 cards in that level complete — triggers LevelCompleteScreen overlay (Task 4.2 receives `level`, `onContinue`, `onShare` props)
- `LevelNav` component: exported, reusable, accepts `activeLevel`, `completedCounts`, `onSelectLevel`
- `CardList` component: exported, reusable, renders VideoCards for a level
- `LevelHeader` component: exported, reusable, shows total progress

### Consumes (from upstream tasks)

- `VideoCard` component from Task 3.2: `{card: VideoCard, isCompleted: boolean, onComplete: () => void}`
- `useProgress` hook from Task 3.4: `{progress, markComplete, completedCount, isLevelComplete}`
- `content.json` from Task 2.1: `levels[].emoji`, `levels[].title`, `levels[].cards[]`
- `LevelCompleteScreen` from Task 4.2: `{level: 1|2|3, onContinue: () => void, onShare: () => void}` — this creates a forward dependency; Task 4.2 must be implemented before Task 4.1 can be fully tested

## Acceptance Criteria

- [ ] `/learn` renders Level 1 by default on a fresh session (no prior progress)
- [ ] `/learn?level=2` renders Level 2 tab active
- [ ] `/learn` with progress showing L1 complete renders Level 2 as default active tab
- [ ] Top bar shows "Doppio" logo left and "N of 9 complete" right (e.g., "3 of 9 complete")
- [ ] 3 level tabs visible: 🌱 Beginner, ⚡ Intermediate, 🚀 Advanced
- [ ] Active tab has blue bottom border and blue text; inactive tabs are gray
- [ ] Tabs with all 3 cards complete show a green ✓ after the level name
- [ ] Clicking a level tab switches the card list to that level's 3 cards
- [ ] All 3 cards are visible and scrollable on mobile (iPhone 390px width)
- [ ] Cards are NOT locked — previously completed cards can be re-watched
- [ ] Marking the 3rd card in a level complete triggers LevelCompleteScreen overlay
- [ ] LevelCompleteScreen overlay does NOT appear if less than 3 cards in a level are complete
- [ ] Level progress bar below tabs shows correct fraction (e.g., 1/3, 2/3, 3/3) with CSS transition
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] No console errors in browser on page load

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npm run build` succeeds
- [ ] `tsc --noEmit` passes

### Browser Testing (Playwright MCP)

Start: `npm run dev` (localhost:5173)

**Test 1: Default level display**
- Navigate to `http://localhost:5173/learn`
- Verify: 3 level tabs visible at top
- Verify: Level 1 tab is active (has blue border/text)
- Verify: 3 video card facades are rendered below the tabs
- Verify: Top bar shows "Doppio" and "0 of 9 complete"

**Test 2: Tab switching**
- Click the ⚡ Intermediate tab
- Verify: Intermediate tab becomes active (blue border)
- Verify: The 3 cards shown change to Level 2 cards (different titles)
- Click 🚀 Advanced tab
- Verify: Advanced tab active, Level 3 cards shown

**Test 3: Direct level link**
- Navigate to `http://localhost:5173/learn?level=2`
- Verify: Intermediate tab is active on page load (not Level 1)

**Test 4: Level completion trigger**
- Navigate to `/learn` (Level 1)
- Mark card 1 complete (click "Mark as done" / completion trigger on VideoCard)
- Verify: Progress bar advances to 33%
- Verify: "1 of 9 complete" shows in top bar
- Mark card 2 complete
- Verify: Progress bar at 67%, "2 of 9 complete"
- Mark card 3 complete
- Verify: LevelCompleteScreen overlay appears immediately
- Verify: Canvas element exists in DOM (confetti firing)

**Test 5: Level completion checkmark on tab**
- After completing all 3 L1 cards (or simulate via localStorage):
  - Set localStorage: `doppio_progress = {"level_1":{"card_1":true,"card_2":true,"card_3":true},"level_2":{"card_1":false,"card_2":false,"card_3":false},"level_3":{"card_1":false,"card_2":false,"card_3":false}}`
  - Reload `/learn`
- Verify: 🌱 Beginner tab shows a ✓ checkmark after the label
- Verify: ⚡ Intermediate and 🚀 Advanced tabs do NOT show ✓

**Test 6: Mobile layout**
- Set viewport to 390×844 (iPhone 12)
- Navigate to `/learn`
- Verify: Cards stack vertically (no horizontal scroll)
- Verify: All 3 cards visible (need to scroll to see all 3)
- Verify: Tab bar fits in 390px width without clipping

**User-emulating flow:**
1. Open `http://localhost:5173/learn`
2. Observe Level 1 tabs, 3 card facades
3. Tap ⚡ Intermediate tab — see Level 2 cards
4. Tap 🌱 Beginner tab — back to Level 1 cards
5. Complete card 1 (watch video, mark done)
6. Complete card 2
7. Complete card 3 — level complete screen appears

### External Service Verification

- None for this task (no new Supabase interactions — progress tracking is handled by Task 3.4's useProgress hook)

## Skills to Read

- `doppio-architecture` — orientation, file structure, data flows (read before starting ANY task)
- `canvas-confetti-gamification` — level completion screen contracts, progress bar pattern, card completion sequence (Section 3, 4, 5)
- `doppio-content-schema` — content.json Level interface, how to access levels and cards

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D15, D37, D40, D41, D56, D60, D61

## Git

- Branch: `phase-4/task-4-1-level-navigation`
- Commit message prefix: `Task 4.1:`
