# Task 5.1: Analytics Implementation

## Objective

Implement the full two-layer analytics system for Doppio: Vercel Analytics for automatic page views, and Supabase custom events for 7 key learning-path events. Complete `src/lib/analytics.ts` with `getSessionId` and `track()`, wire the `<Analytics />` component into `App.tsx`, and add `track()` calls to every relevant component so all user funnel events are captured.

## Context

Phase 5 is the polish and analytics phase. All core UI, progress tracking, and gamification are complete. This task activates visibility into the user funnel — from landing page through level completions and badge sharing. Task 1.3 created the `analytics_events` table in Supabase during scaffolding, but it needs to be verified. Vercel Analytics requires a live Vercel deploy (Task 1.4) to collect data. Downstream: Task 5.R regression verifies all 7 event types are present in Supabase.

## Dependencies

- Task 1.3 — Supabase project created, `analytics_events` table DDL run, `supabase` client exported from `src/lib/supabase.ts`
- Task 1.4 — Vercel deploy live at `https://doppio.kookyos.com`, Analytics enabled in Vercel Dashboard
- Task 3.3 — `TryItButton` component exists (needs `track('try_it_clicked', ...)`)
- Task 3.4 — `useProgress` hook and `markComplete` exist (needs `track('card_completed', ...)`)
- Task 4.2 — `LevelCompleteScreen` component exists (needs `track('level_completed', ...)`)
- Task 4.3 — `Complete.tsx` final screen exists (needs `track('badge_shared', ...)`)
- Task 4.4 — `useInstallPrompt` / install hooks exist (needs `track('pwa_installed', ...)`)

## Blocked By

- Task 1.4 (Vercel Analytics requires a deployed Vercel project to collect data)
- Task 1.3 (Supabase `analytics_events` table must exist)

## Research Findings

- From `doppio-analytics` skill: Layer 1 is `@vercel/analytics` (page views, geo, device — automatic). Layer 2 is Supabase `analytics_events` table with `track()` helper. Custom events via `@vercel/analytics` are Pro-only; the Supabase layer handles Doppio's 7 events on the free Hobby plan.
- From `DISCOVERY.md D27`: Two-layer analytics — Vercel Analytics + Supabase custom events table tracking exactly 7 events.
- From `doppio-analytics` skill: `session_id` is a `crypto.randomUUID()` stored in `sessionStorage`. Not personal data. No GDPR consent needed.
- From `doppio-analytics` skill: `track()` must always be fire-and-forget and fully silent (try/catch wraps every insert). Analytics must NEVER throw or block the user experience.

## Implementation Plan

### Step 1: Verify analytics_events table in Supabase

Before writing any code, verify the `analytics_events` table exists and has the correct schema. Navigate to the Supabase Dashboard → SQL Editor and run:

```sql
select column_name, data_type
from information_schema.columns
where table_name = 'analytics_events'
order by ordinal_position;
```

Expected columns: `id` (uuid), `event_name` (text), `session_id` (uuid), `properties` (jsonb), `created_at` (timestamptz).

If the table does NOT exist (Task 1.3 may not have run this DDL), create it now:

```sql
create table public.analytics_events (
  id         uuid        default gen_random_uuid() primary key,
  event_name text        not null,
  session_id uuid        not null,
  properties jsonb       default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

create policy "Allow insert for all"
  on public.analytics_events
  for insert
  with check (true);
```

The RLS policy allows all clients (including anonymous) to insert events, but no SELECT policy is added for anonymous users — only service role can read. This protects the event log from being scraped.

### Step 2: Create src/lib/analytics.ts

Create the file `src/lib/analytics.ts` with the `getSessionId` helper and `track()` function:

```typescript
// src/lib/analytics.ts
import { supabase } from './supabase';

const SESSION_KEY = 'doppio_session_id';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function track(
  eventName: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      session_id: getSessionId(),
      properties,
    });
  } catch {
    // Silent fail — analytics must never throw or affect user experience
  }
}
```

Key design decisions:
- `getSessionId()` is NOT exported (internal helper only)
- `track()` is `async` only so it can `await` internally — callers should NOT await it
- The outer `try/catch` catches both network errors and Supabase client errors
- `sessionStorage` resets on tab close, making the ID ephemeral and not personal data

### Step 3: Create src/hooks/usePageTracking.ts

Create the page tracking hook that fires `page_view` on every route change:

```typescript
// src/hooks/usePageTracking.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '../lib/analytics';

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    track('page_view', {
      path: location.pathname,
      referrer: document.referrer,
    });
  }, [location.pathname]);
}
```

### Step 4: Update src/App.tsx — add Analytics component and page tracking

Open `src/App.tsx` and make two additions:

1. Import and render `<Analytics />` from `@vercel/analytics/react`
2. Call `usePageTracking()` inside the App component (requires being inside `<Router>`)

```tsx
// src/App.tsx
import { Analytics } from '@vercel/analytics/react';
import { usePageTracking } from './hooks/usePageTracking';

function AppRoutes() {
  usePageTracking(); // Must be inside Router context
  return (
    // ... existing route JSX ...
  );
}

function App() {
  return (
    <>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Analytics />
    </>
  );
}
```

Note: `usePageTracking` calls `useLocation()` which requires being inside a `<Router>`. If App.tsx already wraps routes in a Router, ensure `usePageTracking` is called inside that context. The pattern above splits into `AppRoutes` (inside Router) and `App` (outside Router) to satisfy this requirement.

### Step 5: Add track() to Landing.tsx — level_started

In `src/pages/Landing.tsx`, find the "Start Level 1" CTA button handler. Add a `track('level_started', { level: 1 })` call before the navigation:

```tsx
import { track } from '../lib/analytics';

// In the CTA button handler:
const handleStartLevel1 = () => {
  track('level_started', { level: 1 });
  navigate('/learn');
};
```

Also wire `level_started` to the level tab navigation in `src/components/LevelNav.tsx` or wherever the user taps to switch to Level 2 or Level 3 for the first time. Fire `track('level_started', { level: n })` when the user actively clicks into a new level.

### Step 6: Add track() to useProgress.ts or VideoCard — card_completed

Open `src/hooks/useProgress.ts` (or `src/lib/progress.ts`). Find the `markComplete(level, card)` function. Add the analytics call immediately after updating localStorage, before the async Supabase upsert.

IMPORTANT: Do NOT add a third `cardTitle` parameter to `markComplete()`. The signature `markComplete(level, card)` from Task 3.4 must remain unchanged to avoid breaking Task 4.1's callers. Instead, look up the card title from the content.json import using `level` and `card` as keys.

```typescript
import { track } from './analytics';
import content from '../data/content.json'; // import to look up card title

function markComplete(level: number, card: number) {
  // 1. Update localStorage (sync, immediate)
  const updated = { ...progress, [`level_${level}`]: { ...progress[`level_${level}` as keyof ProgressState], [`card_${card}`]: true } };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
  setProgress(updated);

  // 2. Track analytics (async, fire-and-forget)
  // Look up card title from content.json — do NOT change markComplete signature
  const levelData = content.levels.find(l => l.level === level);
  const cardData = levelData?.cards.find(c => c.card === card);
  track('card_completed', { level, card, card_title: cardData?.title ?? '' });

  // 3. Sync to Supabase (async, fire-and-forget)
  if (navigator.onLine) {
    supabase.from('user_progress').upsert({...}).catch(() => {});
  }
}

### Step 7: Add track() to TryItButton.tsx — try_it_clicked

Open `src/components/TryItButton.tsx`. Find the click handler. The analytics call must fire before `window.open()`:

```tsx
import { track } from '../lib/analytics';

const handleClick = () => {
  track('try_it_clicked', {
    level: card.level,
    card: card.card,
    card_id: card.id,
    tool: card.aiTool, // 'chatgpt' | 'claude' | 'perplexity'
  });
  window.open(card.tryItUrl, '_blank');
  navigator.clipboard.writeText(card.tryItPrompt).catch(() => {});
  // toast notification
};
```

### Step 8: Add track() to LevelCompleteScreen.tsx — level_completed

Open `src/components/LevelCompleteScreen.tsx`. The `level_completed` event must fire on component mount (when the overlay appears), not on the "Continue" button click. Use a `useEffect` with empty dependency array:

```tsx
import { useEffect } from 'react';
import { track } from '../lib/analytics';

function LevelCompleteScreen({ level, startedAt, onContinue, onShare }: Props) {
  useEffect(() => {
    track('level_completed', {
      level,
      duration_ms: startedAt ? Date.now() - startedAt : undefined,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ...
}
```

`startedAt` should be a timestamp (from `Date.now()`) set when the user first clicked "Start Level N". Pass it as a prop or read from a ref/context.

### Step 9: Add track() to Complete.tsx and share handlers — badge_shared

Open `src/pages/Complete.tsx`. Find the share handler. Track the `badge_shared` event with the method used:

```tsx
import { track } from '../lib/analytics';

async function handleShare() {
  const url = 'https://doppio.kookyos.com/?ref=badge';

  if (navigator.share) {
    try {
      await navigator.share({ url, title: "I'm an AI Manager!" });
      track('badge_shared', { method: 'native_share' });
    } catch {
      // User cancelled — do not track
    }
  } else {
    await navigator.clipboard.writeText(url).catch(() => {});
    track('badge_shared', { method: 'copy_link' });
    // toast: "Link copied!"
  }
}
```

Also add the same pattern to `LevelCompleteScreen.tsx`'s share button (levels 1 and 2 also have share buttons).

### Step 10: Add track() for pwa_installed — in install hooks

Open `src/hooks/useInstallPrompt.ts` (or `usePWAInstall.ts`). Wire the `pwa_installed` event:

```typescript
import { track } from '../lib/analytics';

// Android/Desktop: appinstalled event
useEffect(() => {
  const handleAppInstalled = () => {
    track('pwa_installed', { platform: 'android' });
    setDeferredPrompt(null);
    setShowBanner(false);
  };
  window.addEventListener('appinstalled', handleAppInstalled);
  return () => window.removeEventListener('appinstalled', handleAppInstalled);
}, []);

// After BeforeInstallPromptEvent accepted:
const { outcome } = await deferredPrompt.userChoice;
if (outcome === 'accepted') {
  track('pwa_installed', { platform: 'android' });
}
```

For iOS, fire the event when the user interacts with the iOS install banner (taps "Add to Home Screen" instructions):

```tsx
// In IOSInstallBanner.tsx
// Since iOS has no install event, track when user taps the banner CTA
<button onClick={() => {
  track('pwa_installed', { platform: 'ios' });
  // show instructions / dismiss
}}>
  Show me how
</button>
```

### Step 11: Enable Analytics in Vercel Dashboard

After deploying (or verifying the existing deploy), navigate to:
- Vercel Dashboard → Project → **Analytics** tab → Click **Enable Analytics**

This activates data collection. The `<Analytics />` component is a no-op if Analytics is not enabled in the dashboard.

### Step 12: Verify in Supabase Dashboard

After completing a full test journey (landing → mark 1 card complete → click Try it → complete level), run this query in the Supabase SQL Editor:

```sql
select event_name, count(*), count(distinct session_id) as unique_sessions
from analytics_events
group by event_name
order by count(*) desc;
```

Expected results: rows for `page_view`, `level_started`, `card_completed`, `try_it_clicked`, `level_completed`.

## Files to Create

- `src/lib/analytics.ts` — `getSessionId()` internal helper + exported `track()` function
- `src/hooks/usePageTracking.ts` — `usePageTracking()` hook using `useLocation()`

## Files to Modify

- `src/App.tsx` — import `<Analytics />` from `@vercel/analytics/react`, call `usePageTracking()`
- `src/pages/Landing.tsx` — add `track('level_started', { level: 1 })` on CTA click
- `src/components/LevelNav.tsx` (or wherever level switching occurs) — add `track('level_started', { level: n })` when user navigates to a new level
- `src/hooks/useProgress.ts` (or `src/lib/progress.ts`) — add `track('card_completed', ...)` in `markComplete()`
- `src/components/TryItButton.tsx` — add `track('try_it_clicked', ...)` in click handler
- `src/components/LevelCompleteScreen.tsx` — add `track('level_completed', ...)` on mount via `useEffect`, add `track('badge_shared', ...)` in share handler
- `src/pages/Complete.tsx` — add `track('badge_shared', ...)` in share handler
- `src/hooks/useInstallPrompt.ts` (or `usePWAInstall.ts`) — add `track('pwa_installed', ...)` on `appinstalled` event and after `userChoice === 'accepted'`
- `src/components/IOSInstallBanner.tsx` — add `track('pwa_installed', { platform: 'ios' })` on install CTA tap

## Contracts

### Provides (for downstream tasks)

- `track(eventName, properties)`: `(string, Record<string, unknown>) => Promise<void>` — exported from `src/lib/analytics.ts`, available to all components
- `analytics_events` table populated with 7 event types — queryable in Supabase Dashboard for Task 5.R and Phase 6

### Consumes (from upstream tasks)

- `supabase` client from `src/lib/supabase.ts` (Task 1.3) — used to insert into `analytics_events`
- `analytics_events` table in Supabase (Task 1.3) — must exist with schema: `id (uuid), event_name (text), session_id (uuid), properties (jsonb), created_at (timestamptz)`
- `TryItButton` component (Task 3.3) — modified to call `track('try_it_clicked', ...)`
- `useProgress` hook (Task 3.4) — modified to call `track('card_completed', ...)`
- `LevelCompleteScreen` component (Task 4.2) — modified to call `track('level_completed', ...)` and `track('badge_shared', ...)`
- `Complete.tsx` page (Task 4.3) — modified to call `track('badge_shared', ...)`
- Install hooks (Task 4.4) — modified to call `track('pwa_installed', ...)`

## Acceptance Criteria

- [ ] `src/lib/analytics.ts` exists with `track()` exported and `getSessionId()` as private helper
- [ ] `<Analytics />` from `@vercel/analytics/react` renders in `App.tsx` on every route
- [ ] `usePageTracking()` fires `page_view` event on every route change
- [ ] `track('level_started', { level: 1 })` fires when user clicks "Start Level 1" on Landing page
- [ ] `track('level_started', { level: 2 })` and `track('level_started', { level: 3 })` fire when user navigates to levels 2 and 3
- [ ] `track('card_completed', { level, card, card_title })` fires on every card completion
- [ ] `track('try_it_clicked', { level, card, card_id, tool })` fires on every "Try it" button click
- [ ] `track('level_completed', { level, duration_ms })` fires when level completion overlay appears
- [ ] `track('badge_shared', { method })` fires on share at both level completions and final screen
- [ ] `track('pwa_installed', { platform })` fires on `appinstalled` event and iOS banner tap
- [ ] All `track()` calls are fire-and-forget (not awaited by callers)
- [ ] All analytics failures are silenced — no console errors from analytics on any user action
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] Supabase Dashboard: after test journey, `select event_name, count(*) from analytics_events group by event_name` shows all 7 event types

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npm run build` succeeds (no TS errors in analytics.ts, usePageTracking.ts, or any modified component)
- [ ] `tsc --noEmit` passes

### Browser Testing (Playwright MCP)

- Start: `npm run dev` (localhost:5173)
- Navigate to: `http://localhost:5173`
- Actions and verify:
  1. Open browser console (DevTools → Console tab). Clear it.
  2. Navigate to `/` — verify NO console errors related to analytics
  3. Click "Start Level 1" — verify no errors thrown in console
  4. On `/learn`, click the "Mark as done" / completion button on card 1 of level 1
  5. Click "Try it in ChatGPT" — verify new tab opens, verify no console error from analytics
  6. Complete all 3 cards in Level 1 — verify Level Complete overlay appears
  7. Click "Share" on the Level Complete overlay — verify no error
  8. Click "Continue to Level 2" — proceed through Level 2 cards
  9. Navigate to `/complete` directly — verify page renders, verify no analytics errors
  10. Verify ZERO console errors of type: "analytics", "analytics_events", "Supabase insert"

### External Service Verification — Supabase Dashboard

After the Playwright journey above, open the Supabase Dashboard → SQL Editor and run:

```sql
-- Full funnel check
select event_name, count(*) as total, count(distinct session_id) as sessions
from analytics_events
group by event_name
order by total desc;
```

Expected: At least these event names present with count >= 1:
- `page_view`
- `level_started`
- `card_completed`
- `try_it_clicked`
- `level_completed`

Also run the card completion breakdown:
```sql
select properties->>'level' as level, properties->>'card' as card, count(*)
from analytics_events
where event_name = 'card_completed'
group by level, card
order by level, card;
```

### External Service Verification — Vercel Dashboard

Navigate to `https://vercel.com/dashboard` → select Doppio project → **Analytics** tab. Verify page views are appearing (may take a few minutes to appear after production visits).

### Edge Case Testing

- [ ] Test with no network: go offline in DevTools → Network → Offline. Click "Mark as done" on a card. Verify no console errors (analytics silently fails). Come back online — no pending retry needed (fire-and-forget).
- [ ] Verify no PII in events: inspect each row in `analytics_events` table. Confirm `properties` column contains no email, IP, or user-agent strings.

## Skills to Read

- `doppio-analytics` — Complete implementation reference: DDL, track() code, 7 event definitions, usage examples, Supabase queries
- `supabase-anonymous-progress` — Supabase client pattern, RLS setup (analytics table follows same approach)

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D27 (analytics decision), D53 (env vars)

## Git

- Branch: `feat/phase-5-analytics`
- Commit message prefix: `Task 5.1:`
