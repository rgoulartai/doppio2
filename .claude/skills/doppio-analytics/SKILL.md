---
name: doppio-analytics
description: Two-layer analytics for Doppio (Vercel Analytics + Supabase custom events). Use when implementing event tracking, adding the Analytics component, or creating the analytics_events table.
---

# Skill: doppio-analytics

## Overview

Doppio uses a two-layer analytics architecture (defined in DISCOVERY.md §5, D27):

- **Layer 1 — Vercel Analytics**: automatic page views, referrers, geo, and device data. Zero configuration. Cookieless. Free on Hobby plan.
- **Layer 2 — Supabase custom events**: one table, one helper file, 7 key learning-path events. Uses the existing Supabase client. No new dependencies.

Both layers are fully cookieless. No personal data is collected. No GDPR consent banner is required.

---

## Layer 1 — Vercel Analytics

### Install

```bash
npm install @vercel/analytics
```

### Add to App.tsx

Add the `<Analytics />` component once at the root of the app. It must render on every page.

```tsx
// src/App.tsx
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      {/* ... existing app JSX ... */}
      <Analytics />
    </>
  );
}

export default App;
```

If the project uses a root layout file (e.g. `src/main.tsx` wrapping `<App />`), place `<Analytics />` inside the outermost JSX fragment there instead — either location works as long as it renders on every route.

### What it tracks automatically

Vercel Analytics captures the following with zero additional code:

- Page views (including SPA client-side route transitions)
- Unique visitors (hash-based, daily reset — not stored permanently, cannot re-identify users)
- Bounce rate
- Top pages and top referrers
- Geographic breakdown (country, region, city)
- Device OS, browser, device type (mobile / desktop / tablet)

### Enable in Vercel Dashboard

After deploying, go to: **Vercel Dashboard → Project → Analytics → Enable**

Analytics data is not collected until this is enabled in the dashboard.

### Privacy

Vercel Analytics uses a daily-expiring hash derived from IP + user agent. This hash is not stored permanently and cannot re-identify users across sessions or sites. No cookies are set. No GDPR cookie consent banner is required.

### Hobby plan limitation

Custom events (the `track()` function from `@vercel/analytics`) are a **Pro-plan only** feature. On the free Hobby plan, page views are tracked automatically but custom event dashboards are not available. This is why Layer 2 (Supabase) handles the 7 Doppio-specific events.

---

## Layer 2 — Supabase Custom Events

### SQL DDL — Create the table

Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query):

```sql
create table public.analytics_events (
  id         uuid        default gen_random_uuid() primary key,
  event_name text        not null,
  session_id text        not null,
  properties jsonb       default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Option A: No RLS needed (insert-only, no personal data, service role reads)
-- Leave RLS disabled if you are comfortable with public inserts via anon key.

-- Option B: Enable RLS with an insert-for-all policy (recommended)
alter table public.analytics_events enable row level security;

create policy "Allow insert for all"
  on public.analytics_events
  for insert
  with check (true);

-- No SELECT policy for anonymous users — only service role can read.
-- This means the data is write-only from the client, protecting the event log
-- from being scraped via the public API.
```

Column notes:
- `session_id`: a `crypto.randomUUID()` value stored in `sessionStorage`. It is ephemeral (cleared on tab close), not tied to any identity, and not personal data under GDPR.
- `properties`: a flexible JSONB column. Only put in data you explicitly choose — never put IP addresses, email, or user-agent strings here.

### analytics.ts — The track() helper

Create this file at `src/lib/analytics.ts`. It wraps every insert in a `try/catch` so analytics failures are always silent and never break the app.

```ts
// src/lib/analytics.ts
import { supabase } from './supabase'; // existing Supabase client

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
    // Silent fail — analytics must never throw or affect the user experience
  }
}
```

Key design decisions:
- **Fire-and-forget**: callers do not need to `await` the result. The function is `async` only so it can use `await` internally; callers can call it without awaiting.
- **Always silent**: the outer `try/catch` catches both network errors and Supabase client errors. The app must never crash due to analytics.
- **Session ID**: `crypto.randomUUID()` is available in all modern browsers. It is stored in `sessionStorage` (not `localStorage`) so it resets when the tab is closed, making it ephemeral and not personal data.

### The 7 Key Events

These are the minimum viable signal set for Doppio's funnel analysis:

| Event Name | Trigger | Properties |
|---|---|---|
| `page_view` | Every route change | `{ path: string, referrer: string }` |
| `level_started` | User clicks "Start Level N" CTA | `{ level: 1 \| 2 \| 3 }` |
| `card_completed` | User marks card as done | `{ level: number, card: number, card_title: string }` |
| `try_it_clicked` | User clicks "Try it" on a card | `{ level: number, card: number, card_id: string, tool: 'chatgpt' \| 'claude' \| 'perplexity' }` |
| `level_completed` | User finishes all 3 cards in a level | `{ level: number, duration_ms: number }` |
| `badge_shared` | User shares completion badge | `{ method: 'copy_link' \| 'native_share' }` |
| `pwa_installed` | `beforeinstallprompt` accepted or `appinstalled` fires | `{ platform: 'ios' \| 'android' \| 'desktop' }` |

---

## Usage Examples

### Page views (route changes)

```tsx
// src/hooks/usePageTracking.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '@/lib/analytics';

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

Call `usePageTracking()` once inside the root `<App />` component or a layout wrapper.

### Level started

```tsx
// In the landing page or level navigation component
import { track } from '@/lib/analytics';

function StartLevelButton({ level }: { level: number }) {
  const handleClick = () => {
    track('level_started', { level });
    // ... navigate to level
  };

  return (
    <button onClick={handleClick}>
      Start Level {level}
    </button>
  );
}
```

### Card completed

```tsx
// In the card component
import { track } from '@/lib/analytics';

function CardCompleteButton({ level, card, cardTitle }: CardProps) {
  const handleComplete = () => {
    track('card_completed', {
      level,
      card,
      card_title: cardTitle,
    });
    // ... update progress state
  };

  return (
    <button onClick={handleComplete} className="active:scale-95">
      Mark as done
    </button>
  );
}
```

### Try it clicked

```tsx
// In the card "Try it" CTA
import { track } from '@/lib/analytics';

function TryItButton({ level, card, cardId, tool, url, prompt }: TryItProps) {
  const handleClick = () => {
    track('try_it_clicked', { level, card, card_id: cardId, tool });
    window.open(url, '_blank');
    navigator.clipboard.writeText(prompt).catch(() => {});
  };

  return (
    <button onClick={handleClick}>
      Try it →
    </button>
  );
}
```

### Level completed

```tsx
// In the level completion logic (e.g. progress store or level screen)
import { track } from '@/lib/analytics';

function onLevelComplete(level: number, startedAt: number) {
  track('level_completed', {
    level,
    duration_ms: Date.now() - startedAt,
  });
  // ... show level completion overlay + confetti
}
```

### Badge shared

```tsx
// In the final completion screen
import { track } from '@/lib/analytics';

async function handleShare() {
  const url = 'https://doppio.kookyos.com/?ref=badge';

  if (navigator.share) {
    try {
      await navigator.share({ url, title: "I'm an AI Manager!" });
      track('badge_shared', { method: 'native_share' });
    } catch {
      // User cancelled native share — do not track
    }
  } else {
    await navigator.clipboard.writeText(url);
    track('badge_shared', { method: 'copy_link' });
  }
}
```

### PWA installed

```tsx
// In the PWA install hook
import { track } from '@/lib/analytics';

// Android / Desktop: BeforeInstallPromptEvent
window.addEventListener('appinstalled', () => {
  track('pwa_installed', { platform: 'android' });
});

// iOS: no event fires — track when the user taps the install instructions CTA
function handleIOSInstallInstructionsShown() {
  track('pwa_installed', { platform: 'ios' });
}
```

---

## Querying the Data

Run these in the Supabase SQL Editor (Dashboard → SQL Editor) to analyze the funnel during the demo:

```sql
-- Event totals + unique sessions per event
select
  event_name,
  count(*)                     as total,
  count(distinct session_id)   as unique_sessions
from analytics_events
group by event_name
order by total desc;

-- Card completion breakdown
select
  properties->>'level'  as level,
  properties->>'card'   as card,
  count(*)              as completions
from analytics_events
where event_name = 'card_completed'
group by level, card
order by level, card;

-- Drop-off: sessions that started level 1 but never completed it
select count(distinct session_id)
from analytics_events
where event_name = 'level_started'
  and properties->>'level' = '1'
  and session_id not in (
    select session_id from analytics_events
    where event_name = 'level_completed'
      and properties->>'level' = '1'
  );

-- PWA install count
select count(*) from analytics_events where event_name = 'pwa_installed';

-- Badge share count
select count(*) from analytics_events where event_name = 'badge_shared';
```

---

## Privacy Summary

| Dimension | Vercel Analytics | Supabase Custom Events |
|---|---|---|
| Cookieless | Yes | Yes |
| Personal data collected | No | No (session_id is ephemeral UUID) |
| GDPR consent banner needed | No | No |
| Data ownership | Vercel | You (own DB) |
| Data used by third party | No (Vercel aggregates only) | No |

The `session_id` is a `crypto.randomUUID()` value stored only in `sessionStorage`. It resets on tab close and is not tied to any user identity. It is not personal data under GDPR. No IP addresses, emails, or user-agent strings are stored in any event properties.

---

## Implementation Checklist

- [ ] `npm install @vercel/analytics`
- [ ] Add `<Analytics />` to `src/App.tsx` (or root layout)
- [ ] Enable Analytics in Vercel Dashboard: Project → Analytics → Enable
- [ ] Run the `analytics_events` DDL in Supabase SQL Editor
- [ ] Create `src/lib/analytics.ts` with the `track()` helper
- [ ] Add `usePageTracking()` hook to root layout
- [ ] Call `track('level_started', ...)` on level CTA click
- [ ] Call `track('card_completed', ...)` on card completion
- [ ] Call `track('try_it_clicked', ...)` on Try it button click
- [ ] Call `track('level_completed', ...)` on level finish
- [ ] Call `track('badge_shared', ...)` on share action
- [ ] Call `track('pwa_installed', ...)` on install event

---

## References

- DISCOVERY.md §5, D27 — Analytics decision
- research/analytics.md — Full options comparison and rationale
- Vercel Analytics docs: https://vercel.com/docs/analytics
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
