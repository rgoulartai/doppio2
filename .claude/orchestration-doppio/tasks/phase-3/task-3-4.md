# Task 3.4: Progress Tracking (useProgress hook + ProgressBar UI)

## Objective

Implement the complete progress tracking system: `src/lib/progress.ts` (localStorage read/write + Supabase upsert), `src/lib/auth.ts` (anonymous auth with session cache), `src/hooks/useProgress.ts` (React hook for components), and `src/components/ProgressBar.tsx` (CSS-only animated bar). Wire up anonymous auth initialization and `window.focus` sync in `src/App.tsx`. The result is a progress system where marking a card complete is instant (localStorage), Supabase syncs in the background, and the progress bar animates smoothly.

## Context

This is the data backbone of the learning experience. Every VideoCard's "Mark as done" button triggers this system. Progress must survive page refresh (localStorage), sync across tabs/sessions (Supabase), and never block the UI (fire-and-forget pattern). The progress bar at the top of the level screen (Task 4.1) reads from this hook. The level completion detection (Task 4.2) reads `isLevelComplete` from this hook. This task also integrates Supabase anonymous auth at the app level — the auth module must be called exactly once on mount, with a module-level cache preventing duplicate calls.

## Dependencies

- Task 1.3 — Supabase project created with `user_progress` table, RLS policies, anonymous auth enabled, and `src/lib/supabase.ts` exporting the client
- Task 3.2 — VideoCard `onComplete` prop receives the `markComplete` callback from this hook

## Blocked By

- Task 1.3 — Supabase client and schema must exist before upsert calls will work
- Task 3.2 — VideoCard `onComplete` prop interface must be established first

## Research Findings

- From supabase-anonymous-progress SKILL.md §4: `getOrCreateAnonUser()` must check `getSession()` first; module-level `cachedUser` variable prevents duplicate anonymous users; returns `null` on failure (silent fallback)
- From supabase-anonymous-progress SKILL.md §7: Full `progress.ts` implementation — `loadProgress()`, `markCardComplete()`, `syncFromSupabase()`; localStorage key `'doppio_progress_v1'`; `ProgressState` interface with `level_1/2/3` → `card_1/2/3` boolean shape
- From supabase-anonymous-progress SKILL.md §8: `useProgress()` hook — `useState(() => loadProgress())` for instant initial state (no flash); `syncFromSupabase()` on mount; `markComplete` callback via `useCallback`; returns `{progress, markComplete, isLoading}`
- From supabase-anonymous-progress SKILL.md §9: App.tsx pattern — `getOrCreateAnonUser()` called once on mount; `window.focus` listener calls `syncFromSupabase()` on refocus
- From DISCOVERY.md D25: localStorage is the source of truth; Supabase sync is background; merge strategy is additive (union — cards are never un-completed)
- From DISCOVERY.md D54: If `signInAnonymously()` fails → silently fall back to localStorage-only mode; retry on next `window.focus`
- From PHASES.md Task 3.4: Progress shape `{1: {1: bool, 2: bool, 3: bool}, 2: {...}, 3: {...}}`; `markComplete(level, card)` updates localStorage → fires analytics → async Supabase upsert
- From canvas-confetti-gamification SKILL.md §3: ProgressBar CSS-only — `transition-all duration-500 ease-out`; `w-full bg-gray-200 rounded-full h-2`; `role="progressbar"` ARIA attributes

## Implementation Plan

### Step 1: Verify `src/lib/auth.ts` (created in Task 1.3)

`src/lib/auth.ts` was created in Task 1.3 with the complete `getOrCreateAnonUser()` implementation. Do NOT recreate it — doing so would silently overwrite Task 1.3's work.

Verify it exists and exports `getOrCreateAnonUser()`:

```bash
# Confirm the file exists
ls src/lib/auth.ts

# Confirm the export is present
grep -n "getOrCreateAnonUser" src/lib/auth.ts
```

If the file is missing (Task 1.3 not yet complete), block on Task 1.3 before proceeding with Step 2. Do not recreate `auth.ts` here.

Import it in `progress.ts` (Step 2) and `App.tsx` (Step 5) using:

```ts
import { getOrCreateAnonUser } from './auth';
```

### Step 2: Create `src/lib/progress.ts`

```ts
// src/lib/progress.ts
import { supabase } from './supabase';
import { getOrCreateAnonUser } from './auth';

const STORAGE_KEY = 'doppio_progress_v1';

export interface ProgressState {
  level_1: { card_1: boolean; card_2: boolean; card_3: boolean };
  level_2: { card_1: boolean; card_2: boolean; card_3: boolean };
  level_3: { card_1: boolean; card_2: boolean; card_3: boolean };
}

function emptyProgress(): ProgressState {
  return {
    level_1: { card_1: false, card_2: false, card_3: false },
    level_2: { card_1: false, card_2: false, card_3: false },
    level_3: { card_1: false, card_2: false, card_3: false },
  };
}

/**
 * Read progress from localStorage synchronously.
 * Always instant. Works offline. Returns emptyProgress() if nothing stored.
 */
export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    // Spread over emptyProgress() ensures all keys exist even if stored data
    // is from an older version missing some keys
    return { ...emptyProgress(), ...JSON.parse(raw) };
  } catch {
    return emptyProgress();
  }
}

function writeProgress(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[doppio] Failed to write progress to localStorage', err);
  }
}

/**
 * Mark a card complete: synchronous localStorage write, then fire-and-forget Supabase upsert.
 * The UI never waits on network. Works offline.
 */
export function markCardComplete(level: 1 | 2 | 3, card: 1 | 2 | 3): void {
  // 1. Synchronous write — instant UI update
  const state = loadProgress();
  const levelKey = `level_${level}` as keyof ProgressState;
  const cardKey = `card_${card}` as string;
  (state[levelKey] as Record<string, boolean>)[cardKey] = true;
  writeProgress(state);

  // 2. Fire-and-forget Supabase upsert (non-blocking)
  void (async () => {
    try {
      const user = await getOrCreateAnonUser();
      if (!user) return; // Offline mode — skip silently

      const { error } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: user.id,
            level,
            card,
            completed_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,level,card',
            ignoreDuplicates: true,
          }
        );

      if (error) throw error;
    } catch (err) {
      // Swallow — localStorage write already succeeded; Supabase sync retries on focus
      console.warn('[doppio] Supabase upsert failed (offline mode continues)', err);
    }
  })();
}

/**
 * Pull all completed rows from Supabase and merge into localStorage (additive union).
 * Cards are never un-completed. Safe to call multiple times.
 */
export async function syncFromSupabase(): Promise<void> {
  try {
    const user = await getOrCreateAnonUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_progress')
      .select('level, card')
      .eq('user_id', user.id);

    if (error) throw error;
    if (!data || data.length === 0) return;

    // Merge: set any Supabase-completed cards to true in localStorage
    const state = loadProgress();
    for (const row of data) {
      const levelKey = `level_${row.level}` as keyof ProgressState;
      const cardKey = `card_${row.card}`;
      if (levelKey in state) {
        (state[levelKey] as Record<string, boolean>)[cardKey] = true;
      }
    }
    writeProgress(state);
  } catch (err) {
    // Swallow — app continues from localStorage
    console.warn('[doppio] Supabase sync failed (offline mode continues)', err);
  }
}

/**
 * Convenience: get completed card count for a specific level.
 */
export function getLevelCompletedCount(state: ProgressState, level: 1 | 2 | 3): number {
  const levelKey = `level_${level}` as keyof ProgressState;
  return Object.values(state[levelKey]).filter(Boolean).length;
}

/**
 * Convenience: check if all 3 cards in a level are complete.
 */
export function isLevelComplete(state: ProgressState, level: 1 | 2 | 3): boolean {
  return getLevelCompletedCount(state, level) === 3;
}

/**
 * Convenience: get total completed cards across all levels.
 */
export function getTotalCompletedCount(state: ProgressState): number {
  return (
    getLevelCompletedCount(state, 1) +
    getLevelCompletedCount(state, 2) +
    getLevelCompletedCount(state, 3)
  );
}
```

### Step 3: Create `src/hooks/useProgress.ts`

```ts
// src/hooks/useProgress.ts
import { useEffect, useState, useCallback } from 'react';
import {
  loadProgress,
  markCardComplete,
  syncFromSupabase,
  getLevelCompletedCount,
  isLevelComplete as checkLevelComplete,
  getTotalCompletedCount,
  type ProgressState,
} from '../lib/progress';

interface UseProgressReturn {
  progress: ProgressState;
  markComplete: (level: 1 | 2 | 3, card: 1 | 2 | 3) => void;
  isLoading: boolean;
  completedCount: (level: 1 | 2 | 3) => number;
  totalCount: number;                                 // Always 9
  totalCompleted: number;                             // 0-9
  isLevelComplete: (level: 1 | 2 | 3) => boolean;
}

export function useProgress(): UseProgressReturn {
  // Synchronous initial read from localStorage — no loading flash
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  // isLoading = true until Supabase sync completes on mount
  const [isLoading, setIsLoading] = useState(true);

  // On mount: run background Supabase sync then update state
  useEffect(() => {
    syncFromSupabase().then(() => {
      setProgress(loadProgress());
      setIsLoading(false);
    });
  }, []);

  const markComplete = useCallback((level: 1 | 2 | 3, card: 1 | 2 | 3) => {
    markCardComplete(level, card);
    // Refresh from localStorage immediately after write — instant UI update
    setProgress(loadProgress());
  }, []);

  return {
    progress,
    markComplete,
    isLoading,
    completedCount: (level: 1 | 2 | 3) => getLevelCompletedCount(progress, level),
    totalCount: 9,
    totalCompleted: getTotalCompletedCount(progress),
    isLevelComplete: (level: 1 | 2 | 3) => checkLevelComplete(progress, level),
  };
}
```

### Step 4: Create `src/components/ProgressBar.tsx`

CSS-only Tailwind progress bar. No JavaScript animation library. The width transition is handled by CSS `transition-all duration-500 ease-out`.

```tsx
// src/components/ProgressBar.tsx
interface ProgressBarProps {
  completedCards: number; // 0, 1, 2, or 3
  totalCards?: number;    // Default 3
  className?: string;
}

export function ProgressBar({
  completedCards,
  totalCards = 3,
  className = '',
}: ProgressBarProps) {
  const percent = totalCards > 0
    ? Math.round((completedCards / totalCards) * 100)
    : 0;
  const widthPercent = totalCards > 0
    ? (completedCards / totalCards) * 100
    : 0;

  return (
    <div
      className={`w-full bg-gray-700 rounded-full h-2 overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${completedCards} of ${totalCards} cards completed`}
    >
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  );
}
```

### Step 5: Update `src/App.tsx` — auth init + window.focus sync

Add two `useEffect` calls to `App.tsx`:

1. On mount: call `getOrCreateAnonUser()` (once, cached) and `syncFromSupabase()` (non-blocking background sync)
2. On `window.focus`: call `syncFromSupabase()` (cross-device/tab sync trigger)

```tsx
// src/App.tsx — add to the App function body
import { useEffect } from 'react';
import { getOrCreateAnonUser } from './lib/auth';
import { syncFromSupabase } from './lib/progress';

function App() {
  // Initialize anonymous auth on app mount (called once — cached in auth.ts)
  useEffect(() => {
    void getOrCreateAnonUser();   // Fire-and-forget — auth result cached in module
    void syncFromSupabase();      // Background sync on first load
  }, []); // Empty deps: runs once on mount

  // Re-sync when user returns to the tab (e.g., after using a Try-it tool in a new tab)
  useEffect(() => {
    const handleFocus = () => {
      void syncFromSupabase();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // ... rest of App (routes, Toaster, etc.)
}
```

Do not add `getOrCreateAnonUser` to the `window.focus` handler — auth is already cached. Only `syncFromSupabase` needs to re-run on focus.

### Step 6: Wire `onComplete` prop in VideoCard integration

VideoCard calls `onComplete()` when the user clicks "Mark as done". The parent component (LevelScreen / Task 4.1) receives the `markComplete` from `useProgress()` and passes it down. The pattern:

```tsx
// In LevelScreen.tsx (Task 4.1) — this is the contract to follow
const { progress, markComplete } = useProgress();

<VideoCard
  card={card}
  isCompleted={progress[`level_${level}` as keyof typeof progress][`card_${cardIndex}` as keyof typeof progress.level_1]}
  onComplete={() => {
    markComplete(level, cardIndex as 1 | 2 | 3);
    track('card_completed', { level, card: cardIndex });
  }}
/>
```

This pattern documents the contract for Task 4.1.

### Step 7: Verify Supabase integration

After implementing, test that rows appear in the Supabase Dashboard:

1. Run the app locally
2. Open `http://localhost:5173/` in browser
3. Open DevTools Console
4. Run: `supabase.auth.getSession()` — should return a session with a UUID user
5. Mark a card complete
6. Open Supabase Dashboard → Table Editor → `user_progress`
7. Verify: a row exists with the correct `user_id`, `level`, `card`, `completed_at`

If the row does NOT appear:
- Check the browser console for Supabase error messages
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env.local`
- Verify anonymous auth is enabled in Supabase Dashboard → Authentication → Settings
- Verify RLS policies exist (all 3 from Task 1.3)

## Files to Create

- `src/lib/progress.ts` — `loadProgress()`, `markCardComplete()`, `syncFromSupabase()`, helper utilities
- `src/hooks/useProgress.ts` — React hook returning `{progress, markComplete, isLoading, completedCount, totalCount, totalCompleted, isLevelComplete}`
- `src/components/ProgressBar.tsx` — CSS-only animated progress bar

Note: `src/lib/auth.ts` was created in Task 1.3. Do NOT recreate it here — verify it exists and exports `getOrCreateAnonUser()`.

## Files to Modify

- `src/App.tsx` — Add auth init `useEffect` and `window.focus` sync listener
- `src/lib/supabase.ts` — Verify it exports `supabase` client (should exist from Task 1.3; do NOT recreate, only read and confirm)

## Contracts

### Provides (for downstream tasks)

- `useProgress()` hook from `src/hooks/useProgress.ts`
  - Returns: `{ progress, markComplete, isLoading, completedCount, totalCount, totalCompleted, isLevelComplete }`
  - `markComplete(level, card)` updates localStorage immediately and syncs to Supabase in background
- `ProgressBar` component from `src/components/ProgressBar.tsx`
  - Props: `{ completedCards: number, totalCards?: number, className?: string }`
- `loadProgress()` from `src/lib/progress.ts` — synchronous localStorage read
- `syncFromSupabase()` from `src/lib/progress.ts` — async Supabase pull (called by App.tsx)
- `isLevelComplete(state, level)` from `src/lib/progress.ts` — consumed by Task 4.2 (LevelCompleteScreen trigger)
- `getLevelCompletedCount(state, level)` — consumed by ProgressBar calculation

### Consumes (from upstream tasks)

- Task 1.3: `src/lib/supabase.ts` exports `supabase` client; `user_progress` table exists with correct schema; anonymous auth enabled; RLS policies active; `src/lib/auth.ts` exports `getOrCreateAnonUser()` (do NOT recreate)
- Task 3.2: VideoCard `onComplete` prop interface established (no-arg callback `() => void`)

## Acceptance Criteria

- [ ] `npm run build` exits 0 with no TypeScript errors
- [ ] `loadProgress()` returns `ProgressState` with all 9 card booleans initialized to `false` on first run
- [ ] `markCardComplete(1, 1)` immediately writes `level_1.card_1: true` to `localStorage['doppio_progress_v1']`
- [ ] After `markCardComplete`, `loadProgress()` returns the updated state
- [ ] `useProgress().progress` is populated from localStorage on first render (no blank state)
- [ ] `useProgress().markComplete(1, 1)` updates `progress.level_1.card_1` to `true`
- [ ] Page refresh after marking card complete: progress bar still reflects the completed card
- [ ] `ProgressBar` with `completedCards={1}` shows the bar at 33% width
- [ ] `ProgressBar` with `completedCards={3}` shows the bar at 100% width
- [ ] ProgressBar has `transition-all duration-500 ease-out` CSS class on the inner bar div
- [ ] Supabase: after marking a card complete, row appears in `user_progress` table (verify in Dashboard within ~5 seconds)
- [ ] `getOrCreateAnonUser()` called once on mount; calling it a second time returns cached user (no new Supabase requests)
- [ ] `window.focus` event triggers `syncFromSupabase()` — verify by switching tabs then returning
- [ ] If `VITE_SUPABASE_URL` is invalid/missing: app still loads and progress works (localStorage-only mode)
- [ ] No console errors on normal app usage (Supabase errors are `console.warn` only)

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` passes

### Browser Testing (Playwright MCP)

**Start dev server**: `npm run dev` (localhost:5173)

**Test 1 — localStorage write on card complete:**
1. Navigate to `http://localhost:5173/`
2. If `/learn` page is available: navigate there and click "Mark as done" on card 1
3. If not yet available: call `markCardComplete(1, 1)` via browser console
4. Open DevTools → Application → Local Storage → `http://localhost:5173`
5. Find key `doppio_progress_v1`
6. Verify: value contains `"level_1":{"card_1":true,...}`

**Test 2 — Progress persists across refresh:**
1. Mark card 1.1 complete (via UI or console)
2. Hard refresh the page (`Ctrl+Shift+R`)
3. Verify: `localStorage.getItem('doppio_progress_v1')` still contains `card_1: true`
4. If ProgressBar is rendered: verify it still shows 33%

**Test 3 — ProgressBar renders at correct width:**
1. Navigate to a page rendering `<ProgressBar completedCards={1} totalCards={3} />`
2. Inspect the inner bar div
3. Verify: `style.width` is approximately `33.33%`
4. Mark another card complete
5. Verify: bar transitions to `66.67%` width with CSS animation

**Test 4 — Supabase row appears:**
1. Clear localStorage: `localStorage.removeItem('doppio_progress_v1')` in browser console
2. Reload the page
3. Wait 2 seconds for auth to initialize
4. In console: call `markCardComplete(1, 1)` (or click UI button)
5. Wait 3 seconds
6. Open Supabase Dashboard → Table Editor → `user_progress`
7. Verify: a row exists with `level=1`, `card=1`

**Test 5 — Anonymous auth is called once:**
1. Open DevTools → Network tab, filter by `supabase`
2. Reload the page
3. Verify: exactly ONE request to `/auth/v1/token?grant_type=anonymous` (or `getSession` returning existing session)
4. Switch to another tab and return (trigger `window.focus`)
5. Verify: `syncFromSupabase` fires (look for `user_progress` GET request in Network tab)
6. Verify: NO second anonymous auth request fires on focus

**Test 6 — Offline mode (localStorage still works):**
1. Open DevTools → Network → Offline
2. Navigate to `http://localhost:5173/`
3. Mark a card complete
4. Verify: localStorage is updated (no error)
5. Verify: no error toast or console error (only `console.warn` about Supabase)
6. Bring network back online
7. Verify: Supabase sync fires on `window.focus` and the row appears in Dashboard

### Supabase Dashboard Verification

After completing browser tests:
1. Open Supabase Dashboard → Table Editor → `user_progress`
2. Verify rows exist for the current browser session's `user_id`
3. Verify row structure: `id` (uuid), `user_id` (uuid), `level` (1-3), `card` (1-3), `completed_at` (timestamp)
4. Attempt to insert a duplicate via Dashboard SQL editor:
   ```sql
   insert into user_progress (user_id, level, card) values ('<existing-user-id>', 1, 1);
   ```
5. Verify: error "duplicate key value violates unique constraint"

### Edge Cases

- `loadProgress()` called when localStorage is corrupt JSON → returns `emptyProgress()` (no crash)
- `markCardComplete` called when Supabase is unreachable → localStorage write succeeds; `console.warn` only
- `useProgress` hook called in a component that unmounts before `syncFromSupabase` resolves → no state update called on unmounted component (React 18 handles this; verify no memory leak warnings in console)
- `localStorage.setItem` throws (storage quota exceeded) → `writeProgress` catches and logs; no user-visible error

## Skills to Read

- `supabase-anonymous-progress` — Complete implementation reference for auth.ts (§4), progress.ts (§7), useProgress.ts (§8), App.tsx sync pattern (§9), common pitfalls (§12)
- `doppio-architecture` — Progress state data flow diagram (§Key Data Flows), key files table

## Git

- Branch: `feat/phase-3-progress-tracking`
- Commit message prefix: `Task 3.4:`
- Example commit: `Task 3.4: Add progress tracking with localStorage, Supabase sync, useProgress hook, and ProgressBar component`
