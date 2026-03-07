# Task 3.3: "Try it" CTA Button

## Objective

Build the `TryItButton` component and the `tryit.ts` utility that together open the correct AI tool in a new tab, copy the card's prompt to the clipboard, and show a toast notification. The button must be rendered below each VideoCard on the `/learn` page and must always be visible (not hidden behind the video). Analytics tracking fires on every click.

## Context

The "Try it" CTA is Doppio's core engagement mechanic — it's the moment the user goes from watching to doing. Each of the 9 cards has a specific AI tool and a curated natural-language prompt. The button opens that tool in a new tab and simultaneously copies the prompt so the user can paste it immediately. This task builds both the reusable UI component (`TryItButton.tsx`) and the logic layer (`tryit.ts`). Task 3.2 (VideoCard) is the component this button sits beneath. Task 5.1 (Analytics) finalizes the analytics implementation, but `track()` from `analytics.ts` must already be called here.

## Dependencies

- Task 2.3 — `tryit.ts` logic depends on confirmed `tryItUrl` patterns from `content.json`; clipboard fallback if URL deep-link doesn't work
- Task 3.2 — `TryItButton` is rendered alongside VideoCard; must match the card data type

## Blocked By

- Task 3.2 — TryItButton must be visually co-located with VideoCard; need the card layout established

## Research Findings

- From DISCOVERY.md D18: Click opens AI tool in new tab (window.open). URL deep-link via `?q=` param tried first. Clipboard copy is always performed regardless of whether URL param is supported. Toast: "Prompt copied! Paste it in [tool name]."
- From DISCOVERY.md D55: "Clipboard copy fallback is always present." The button always copies — it is not only a fallback.
- From PHASES.md Task 3.3: Button label "Try it in [AI Tool Name] →"; `active:scale-95`; `touch-action: manipulation`; inline fallback shows prompt text if clipboard API unavailable; `toast.success("Prompt copied! Paste it in ChatGPT")`
- From canvas-confetti-gamification SKILL.md §8: `touch-action: manipulation` eliminates 300ms tap delay; apply to all interactive elements
- From doppio-architecture SKILL.md: `analytics.ts` exports `logEvent(name, properties)` — the function is called `logEvent`, but PHASES.md refers to it as `track()`. Use whatever function name `analytics.ts` exports — check the actual file.
- From PHASES.md Task 3.3: Must call `track('try_it_clicked', {level, card, aiTool})` — so the analytics function used in this task is called `track`. Reconcile by exporting both or aliasing. Confirm in `src/lib/analytics.ts`.

## Implementation Plan

### Step 0: Create analytics stub (if not yet created by Task 5.1)

Check whether `src/lib/analytics.ts` already exists. If it does not exist, create it with a minimal stub before proceeding. `TryItButton` imports `track` from this file and the build will fail without it.

```typescript
// src/lib/analytics.ts
// Stub — will be replaced by full implementation in Task 5.1
export const track = (_eventName: string, _properties?: Record<string, unknown>): void => {
  // no-op stub
};
```

If `src/lib/analytics.ts` already exists and already exports `track`, do NOT overwrite it — skip this step. Task 5.1 will replace this stub with the real implementation.

### Step 1: Create `src/lib/tryit.ts`

This module handles the open + copy logic. It is pure TypeScript with no React dependencies — easy to test in isolation.

```ts
// src/lib/tryit.ts
import type { VideoCard } from '../types/content';

export interface TryItResult {
  opened: boolean;
  copied: boolean;
  fallbackText?: string; // Set when clipboard API is unavailable
}

/**
 * Opens the AI tool in a new tab and copies the prompt to clipboard.
 * Always opens the URL. Copies prompt regardless of URL param support.
 * Never throws — all errors are caught and returned in the result.
 */
export async function openTryIt(card: VideoCard): Promise<TryItResult> {
  const result: TryItResult = { opened: false, copied: false };

  // 1. Open the AI tool URL in a new tab
  // tryItUrl should already be the full URL (base URL, with or without ?q= prompt)
  try {
    window.open(card.tryItUrl, '_blank', 'noopener,noreferrer');
    result.opened = true;
  } catch (err) {
    console.warn('Failed to open AI tool URL', err);
  }

  // 2. Copy the prompt to clipboard (always — primary delivery mechanism)
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(card.tryItPrompt);
      result.copied = true;
    } else {
      // Clipboard API not available — provide fallback text for inline display
      result.fallbackText = card.tryItPrompt;
    }
  } catch (err) {
    // Clipboard permission denied or API error — provide fallback text
    console.warn('Clipboard write failed', err);
    result.fallbackText = card.tryItPrompt;
  }

  return result;
}

/**
 * Returns a human-readable name for the AI tool based on the card's aiTool field.
 */
export function getToolDisplayName(aiTool: string): string {
  const names: Record<string, string> = {
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    perplexity: 'Perplexity',
  };
  return names[aiTool.toLowerCase()] ?? aiTool;
}
```

### Step 2: Verify `track()` is available in `src/lib/analytics.ts`

Step 0 ensured `src/lib/analytics.ts` exists with a `track` export. Confirm the import works:

```ts
import { track } from '../lib/analytics';
```

If `analytics.ts` uses a different export name (e.g., `logEvent`), alias it. Do NOT overwrite an existing implementation — Task 5.1 owns the full analytics implementation.

### Step 3: Create `src/components/TryItButton.tsx`

```tsx
// src/components/TryItButton.tsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import { openTryIt, getToolDisplayName } from '../lib/tryit';
import { track } from '../lib/analytics';
import type { VideoCard } from '../types/content';

interface TryItButtonProps {
  card: VideoCard;
  level: 1 | 2 | 3;
  cardIndex: 1 | 2 | 3;
  onTryIt?: () => void; // Optional callback for parent to react (e.g., mark as started)
}

export function TryItButton({ card, level, cardIndex, onTryIt }: TryItButtonProps) {
  // Fallback state: if clipboard API is unavailable, show prompt inline for manual copy
  const [fallbackPrompt, setFallbackPrompt] = useState<string | null>(null);

  const toolName = getToolDisplayName(card.aiTool);

  const handleClick = async () => {
    // Fire analytics event
    track('try_it_clicked', {
      level,
      card: cardIndex,
      aiTool: card.aiTool,
    });

    // Execute open + copy
    const result = await openTryIt(card);

    if (result.copied) {
      toast.success(`Prompt copied! Paste it in ${toolName}`, {
        duration: 4000,
        position: 'bottom-center',
        style: {
          background: '#1a1a2e',
          color: '#fff',
          borderRadius: '12px',
          fontSize: '14px',
        },
      });
      setFallbackPrompt(null); // Clear any previous fallback
    } else if (result.fallbackText) {
      // Clipboard API not available — show prompt inline
      setFallbackPrompt(result.fallbackText);
    }

    // Call optional parent callback
    onTryIt?.();
  };

  return (
    <div className="space-y-2">
      {/* Primary CTA button */}
      <button
        onClick={handleClick}
        className="w-full py-3 px-4 rounded-xl
          bg-indigo-600 hover:bg-indigo-700 text-white
          text-sm font-semibold
          flex items-center justify-center gap-2
          active:scale-95 transition-transform duration-150"
        style={{ touchAction: 'manipulation' }}
        aria-label={`Try it in ${toolName}`}
      >
        <span>Try it in {toolName}</span>
        <span aria-hidden="true">→</span>
      </button>

      {/* Inline fallback — only shown when clipboard API is unavailable */}
      {fallbackPrompt && (
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
          <p className="text-xs text-gray-400 mb-1 font-medium">
            Copy this prompt and paste it in {toolName}:
          </p>
          <p className="text-sm text-gray-200 leading-relaxed select-all">
            {fallbackPrompt}
          </p>
        </div>
      )}
    </div>
  );
}
```

### Step 4: Ensure `react-hot-toast` Toaster is mounted in `src/App.tsx`

`react-hot-toast` requires a `<Toaster />` component mounted at the app root for toasts to render. Add it to `src/App.tsx` if not already present:

```tsx
// src/App.tsx
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      {/* Toast notifications — must be at root level */}
      <Toaster />

      <Routes>
        {/* ... existing routes ... */}
      </Routes>
    </BrowserRouter>
  );
}
```

### Step 5: Wire TryItButton below VideoCard in the LevelScreen (preview/stub)

Task 4.1 builds the full LevelScreen, but to test TryItButton now, temporarily add it in a test render. The actual wiring pattern the LevelScreen will follow:

```tsx
// How TryItButton sits alongside VideoCard (Task 4.1 will implement this)
<div className="space-y-3">
  <VideoCard
    card={card}
    isCompleted={isCompleted}
    onComplete={() => markComplete(level, cardIndex)}
  />
  <TryItButton
    card={card}
    level={level}
    cardIndex={cardIndex}
  />
</div>
```

This pattern is the contract for Task 4.1 to follow. TryItButton is always visible below VideoCard — it does NOT disappear when the video is playing.

### Step 6: Verify build and toast behavior

```bash
npm run build
```

In dev, open the browser, navigate to a page rendering TryItButton, click it, verify:
1. A new tab opens (may be blocked by popup blocker — test with popup blocker disabled)
2. Toast appears at bottom-center with "Prompt copied! Paste it in ChatGPT" (or relevant tool)
3. Check browser DevTools → Network: verify no errors related to clipboard or analytics

## Files to Create

- `src/components/TryItButton.tsx` — The CTA button component
- `src/lib/tryit.ts` — Open URL + clipboard copy utility

## Files to Modify

- `src/lib/analytics.ts` — Add/verify `track()` export (stub implementation; finalized in Task 5.1)
- `src/App.tsx` — Add `<Toaster />` from react-hot-toast at root

## Contracts

### Provides (for downstream tasks)

- `TryItButton` component exported from `src/components/TryItButton.tsx`
  - Props: `{ card: VideoCard, level: 1|2|3, cardIndex: 1|2|3, onTryIt?: () => void }`
  - Renders below VideoCard; always visible
- `openTryIt(card)` async function exported from `src/lib/tryit.ts`
  - Returns `{ opened: boolean, copied: boolean, fallbackText?: string }`
- `getToolDisplayName(aiTool)` exported from `src/lib/tryit.ts`
- `track(eventName, properties)` exported from `src/lib/analytics.ts`
  - Consumed by TryItButton and by Task 3.4 (progress tracking), Task 5.1 (analytics finalization)

### Consumes (from upstream tasks)

- Task 2.3: `tryItUrl` and `tryItPrompt` fields in `VideoCard` (via content.json)
- Task 2.1: `VideoCard` type from `src/types/content.ts` (specifically: `aiTool`, `tryItUrl`, `tryItPrompt`)
- Task 3.2: `VideoCard` layout establishes where TryItButton is placed (below the card)
- Task 1.1: `react-hot-toast` npm package installed

## Acceptance Criteria

- [ ] `npm run build` exits 0 with no TypeScript errors
- [ ] `TryItButton` renders with label "Try it in ChatGPT →" for Level 1 cards
- [ ] `TryItButton` renders with label "Try it in Claude →" for Level 2 cards
- [ ] `TryItButton` renders with label "Try it in Perplexity →" (or Claude) for Level 3 cards
- [ ] Clicking the button opens a new tab (verify with `window.open` — may need popup blocker disabled)
- [ ] Clicking the button copies `card.tryItPrompt` to clipboard
- [ ] `toast.success("Prompt copied! Paste it in ChatGPT")` toast appears after click
- [ ] Toast uses `react-hot-toast` (verify `<Toaster />` is in App.tsx)
- [ ] `track('try_it_clicked', {level, card, aiTool})` is called on every click (verify via console.log in DEV mode)
- [ ] `active:scale-95` Tailwind class on button
- [ ] `style={{ touchAction: 'manipulation' }}` inline style on button
- [ ] If clipboard API unavailable (simulated): inline prompt text appears below button
- [ ] Button is visible below VideoCard (not hidden behind video)
- [ ] No console errors on click

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` passes

### Browser Testing (Playwright MCP)

**Start dev server**: `npm run dev` (localhost:5173)

**Setup note**: If `/learn` page (Task 4.1) is not yet built, temporarily render a `TryItButton` directly in `App.tsx` with a hardcoded Level 1 card from `content.json` for isolated testing.

**Test 1 — Button renders with correct label:**
1. Navigate to the page rendering TryItButton for a Level 1 card
2. Verify: button text contains "ChatGPT" and "→"
3. Verify: button background is indigo/blue, not gray

**Test 2 — New tab opens on click:**
1. Ensure popup blocker is disabled for localhost
2. Click "Try it in ChatGPT →" button
3. Verify: a new browser tab opens
4. Verify: new tab URL starts with `https://chat.openai.com`

**Test 3 — Clipboard copy:**
1. Click the TryItButton
2. In Playwright `evaluate()`: `await navigator.clipboard.readText()`
3. Verify: clipboard text matches the `tryItPrompt` from the card's content.json entry

**Test 4 — Toast notification:**
1. Click the TryItButton
2. Verify: a toast element appears in the DOM (look for react-hot-toast's portal div)
3. Verify: toast text contains "Prompt copied" and the tool name
4. Wait 4100ms, verify: toast disappears

**Test 5 — Analytics event fires:**
1. Open browser console (Playwright `console_messages()`)
2. Click the TryItButton
3. Verify: console contains `[analytics] try_it_clicked` with `{level, card, aiTool}` properties (in DEV mode)

**Test 6 — Touch feedback:**
1. Verify: button has `active:scale-95` CSS class in DOM
2. Simulate a touch press (hold click): button should visually scale down to 95%

**Test 7 — 390px mobile viewport:**
1. Set viewport to 390×844
2. Navigate to the page
3. Verify: button is full-width on mobile, readable font size

### External Service Verification

- Clipboard API: verified in Test 3 above via `navigator.clipboard.readText()`
- New tab opens: verified in Test 2 (Playwright browser_tabs to verify new tab)

### Edge Cases

- Click button rapidly (3 times in 1 second) — each click should fire analytics and open a new tab (no debouncing by design — user controls this)
- `tryItPrompt` contains special characters (apostrophes, quotes, newlines) — verify clipboard receives the exact string without escaping issues
- Popup blocker active — `window.open` may be silently blocked; clipboard copy and toast still happen; no error shown to user
- `card.aiTool` is an unrecognized string — `getToolDisplayName` returns the raw string (not a crash)

## Skills to Read

- `doppio-architecture` — analytics.ts pattern, tryit.ts role in the data flow
- `canvas-confetti-gamification` — touch feedback patterns (§8), `touch-action: manipulation` requirement

## Git

- Branch: `feat/phase-3-tryit-button`
- Commit message prefix: `Task 3.3:`
- Example commit: `Task 3.3: Add TryItButton component with clipboard copy, toast notification, and analytics tracking`
