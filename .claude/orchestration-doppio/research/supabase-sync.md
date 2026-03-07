# Supabase Sync Research

**Project**: Doppio
**Date**: 2026-03-06
**Status**: complete

---

## Summary

Doppio needs cross-device progress sync for anonymous users (no login required). Supabase provides a first-class `signInAnonymously()` API that creates a real JWT-backed user session for anonymous visitors — this is the correct pattern. The anonymous user's UUID is stored in Supabase's own localStorage key (`sb-<project>-auth-token`) automatically by the JS client, so there is no need to manage the user ID manually. RLS policies restrict each user to their own rows using `auth.uid()`. localStorage remains the primary source of truth for offline-first behavior; Supabase syncs on reconnect. The free tier is more than sufficient for an MVP/hackathon with this data shape. Polling (not Realtime subscriptions) is the correct choice for simplicity.

---

## Anonymous Auth Strategy

### What Supabase Anonymous Auth Is

Supabase supports true anonymous users via `supabase.auth.signInAnonymously()` (stable since Supabase Auth v2.x, ~2024). This creates a real row in `auth.users` with `is_anonymous: true`. The session (including the anonymous user's UUID) is automatically persisted in localStorage by `@supabase/auth-js` under the key `sb-<project-ref>-auth-token`.

This means:
- The user gets a stable UUID on first visit.
- The UUID persists across browser sessions (until localStorage is cleared or the user goes incognito).
- The user can later be "promoted" to a named account by calling `supabase.auth.updateUser({ email, password })` — linking their anonymous progress to a real account. (Out of scope for MVP.)

### Setup

Anonymous sign-in must be **enabled** in the Supabase Dashboard under Authentication > Providers > Anonymous Sign-Ins (toggle on). It is off by default.

### Session Persistence Behavior

`@supabase/ssr` and `@supabase/auth-js` v2 automatically persist the session in `localStorage` using the key pattern `sb-<project-ref>-auth-token`. On page reload, `supabase.auth.getSession()` reads this and restores the session silently. No manual localStorage management is needed for the auth token.

### Initialization Pattern (Vite/React)

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,           // default: true
    autoRefreshToken: true,         // default: true
    detectSessionInUrl: true,       // needed for OAuth flows, harmless here
    storage: window.localStorage,  // default on browsers
  },
})
```

### Getting/Creating the Anonymous User

```ts
// src/lib/auth.ts
import { supabase } from './supabase'

export async function getOrCreateAnonUser() {
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.user) {
    return session.user  // existing anonymous (or named) user
  }

  // No session — create anonymous user
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.user
}
```

Call this once on app boot (e.g., in a top-level React effect or context provider). Do not call it on every component mount.

### Environment Variables (Vite)

```env
# .env.local
VITE_SUPABASE_URL=https://xyzxyzxyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Both values are safe to expose to the client. The anon key is a public key intended for use in browsers. RLS is the security layer, not key secrecy.

---

## Schema Design

### Minimal Progress Table

```sql
-- Run in Supabase SQL Editor
create table public.user_progress (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  level       smallint not null check (level between 1 and 3),
  card        smallint not null check (card between 1 and 3),
  completed_at timestamptz not null default now(),
  constraint unique_user_level_card unique (user_id, level, card)
);
```

**Notes:**
- `user_id` references `auth.users(id)` — this works for both anonymous and named users.
- `on delete cascade` ensures progress is cleaned up if an anonymous user is deleted (Supabase auto-deletes anonymous users after a configurable inactivity period, default 30 days).
- The `unique` constraint on `(user_id, level, card)` means an upsert can safely be called multiple times without duplicates.
- No `updated_at` needed for MVP — `completed_at` is sufficient.
- 9 rows maximum per user (3 levels × 3 cards). Tiny footprint.

### Indexes

The unique constraint implicitly creates an index on `(user_id, level, card)`. No additional indexes needed for this query pattern.

### Optional: Denormalized completion count

For the completion screen ("You've finished all 3 levels!") you can count rows in the app, so no extra column is needed.

---

## RLS Policies

### Enable RLS

```sql
alter table public.user_progress enable row level security;
```

### Policy: Users can read only their own rows

```sql
create policy "Users can read own progress"
  on public.user_progress
  for select
  using (auth.uid() = user_id);
```

### Policy: Users can insert only for themselves

```sql
create policy "Users can insert own progress"
  on public.user_progress
  for insert
  with check (auth.uid() = user_id);
```

### Policy: Users can delete only their own rows (optional, for reset)

```sql
create policy "Users can delete own progress"
  on public.user_progress
  for delete
  using (auth.uid() = user_id);
```

### Policy: No update needed

Cards are either complete or not. Deleting and re-inserting is simpler than updating. If you want upsert support:

```sql
-- If using upsert (ON CONFLICT DO NOTHING), you need an update policy
create policy "Users can upsert own progress"
  on public.user_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### How `auth.uid()` Works for Anonymous Users

When `signInAnonymously()` is called, the JS client attaches a JWT to every subsequent request. `auth.uid()` inside RLS policies reads the `sub` claim from that JWT, which is the anonymous user's UUID. This is identical to how it works for named users — RLS does not distinguish between anonymous and named users.

**Critical**: If a request comes in without a valid JWT (i.e., before `signInAnonymously()` completes), `auth.uid()` returns `null` and all RLS policies that use it will block access. This is safe — unauthenticated requests cannot read or write any rows.

### Testing Policies

In the Supabase Dashboard > Authentication > Policies, use the "Test policies" feature or run:

```sql
-- Simulate as a specific user
set local role authenticated;
set local request.jwt.claims to '{"sub":"<some-uuid>","role":"authenticated"}';
select * from public.user_progress;
```

---

## Offline-First Pattern

### Design Principle

localStorage is the **source of truth**. Supabase is a **backup and cross-device sync layer**. The app works fully offline with no Supabase connection.

### Progress State Shape (localStorage)

```ts
// Stored in localStorage as JSON under key "doppio_progress"
interface ProgressState {
  completedCards: Record<string, true>  // key: "L1C2" (level-card)
  lastSynced: string | null             // ISO timestamp of last successful Supabase sync
  userId: string | null                 // Supabase anon user UUID, for reference
}
```

### Sync Logic

```ts
// src/lib/sync.ts
import { supabase } from './supabase'
import { getOrCreateAnonUser } from './auth'

const PROGRESS_KEY = 'doppio_progress'

interface CardCompletion {
  level: number
  card: number
}

export function loadLocalProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Object.keys(parsed.completedCards || {}))
  } catch {
    return new Set()
  }
}

export function markLocalComplete(level: number, card: number): void {
  const key = `L${level}C${card}`
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    const state = raw ? JSON.parse(raw) : { completedCards: {}, lastSynced: null }
    state.completedCards[key] = true
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to write local progress', e)
  }
}

export async function syncToSupabase(): Promise<void> {
  try {
    const user = await getOrCreateAnonUser()
    const localProgress = loadLocalProgress()

    if (localProgress.size === 0) return

    const rows = Array.from(localProgress).map(key => {
      const [, level, , card] = key.match(/L(\d+)C(\d+)/) ?? []
      return {
        user_id: user.id,
        level: parseInt(level),
        card: parseInt(card),
        completed_at: new Date().toISOString(),
      }
    })

    const { error } = await supabase
      .from('user_progress')
      .upsert(rows, { onConflict: 'user_id,level,card', ignoreDuplicates: true })

    if (error) throw error

    // Update lastSynced timestamp
    const raw = localStorage.getItem(PROGRESS_KEY)
    const state = raw ? JSON.parse(raw) : {}
    state.lastSynced = new Date().toISOString()
    state.userId = user.id
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Supabase sync failed (offline mode continues)', e)
    // Swallow error — app continues working from localStorage
  }
}

export async function syncFromSupabase(): Promise<void> {
  // On return visit: pull Supabase state and merge into localStorage
  try {
    const user = await getOrCreateAnonUser()

    const { data, error } = await supabase
      .from('user_progress')
      .select('level, card')
      .eq('user_id', user.id)

    if (error) throw error
    if (!data || data.length === 0) return

    const raw = localStorage.getItem(PROGRESS_KEY)
    const state = raw ? JSON.parse(raw) : { completedCards: {}, lastSynced: null }

    for (const row of data) {
      const key = `L${row.level}C${row.card}`
      state.completedCards[key] = true
    }

    state.lastSynced = new Date().toISOString()
    state.userId = user.id
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Supabase pull failed (offline mode continues)', e)
  }
}
```

### React Integration

```tsx
// src/hooks/useProgress.ts
import { useEffect, useState, useCallback } from 'react'
import { loadLocalProgress, markLocalComplete, syncToSupabase, syncFromSupabase } from '../lib/sync'

export function useProgress() {
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  // Load local + pull from Supabase on mount
  useEffect(() => {
    const local = loadLocalProgress()
    setCompleted(local)

    // Background sync (non-blocking)
    syncFromSupabase().then(() => {
      setCompleted(loadLocalProgress())
    })
  }, [])

  const completeCard = useCallback((level: number, card: number) => {
    markLocalComplete(level, card)
    setCompleted(loadLocalProgress())
    // Background sync (non-blocking)
    syncToSupabase()
  }, [])

  return { completed, completeCard }
}
```

---

## Conflict Resolution

### The Problem

User completes cards on Device A (synced to Supabase). Opens app on Device B (localStorage empty, Supabase has data). Or: user clears localStorage but Supabase still has their progress.

### Resolution Strategy: **Union merge (additive only)**

For Doppio, progress is strictly additive — cards can only be completed, never un-completed. There is no meaningful "conflict": if either localStorage or Supabase says a card is complete, it is complete.

**Algorithm:**
1. On app boot: load localStorage progress immediately (for fast UI).
2. Pull Supabase progress in background.
3. Merge by **union**: any card marked complete in either source is marked complete in both.
4. Write merged result back to localStorage.

This is the correct approach because:
- There is no "undo" mechanic.
- There is no scenario where Supabase should overwrite a local completion.
- The union of completed cards is always the correct authoritative state.

### Edge Cases

| Scenario | Outcome |
|---|---|
| localStorage cleared, Supabase has data | `syncFromSupabase()` restores all progress |
| New device, same anonymous session (impossible — anon UUIDs are per-device) | Not applicable |
| Supabase down, local has data | App works offline, syncs next time |
| User completes card while offline | Marked locally, synced on next online sync |
| User uses incognito window | New anon UUID, fresh progress (by design) |

### Cross-Device Reality

Anonymous auth is inherently device-scoped. The Supabase session JWT is stored in localStorage, which does not roam across devices. A user opening Doppio on a new device or browser gets a new anonymous UUID and sees fresh progress. This is **expected behavior** for anonymous users, not a bug.

If cross-device sync is a future requirement, the only path is upgrading to named accounts (email/password). For MVP/hackathon, this is out of scope and should not be implemented.

---

## Free Tier Limits

### Supabase Free Tier (as of 2024–2025)

| Resource | Free Tier Limit | Doppio Usage |
|---|---|---|
| Database size | 500 MB | Negligible (9 rows/user, tiny schema) |
| API requests | 500K/month | Very low for a hackathon app |
| Auth MAUs (Monthly Active Users) | 50,000 | Sufficient for hackathon |
| Anonymous user inactivity deletion | After 30 days | Default; configurable |
| Realtime connections | 200 concurrent | Not used (polling only) |
| Storage | 1 GB | Not used |
| Edge Functions | 500K invocations | Not used |
| Bandwidth | 5 GB/month | Negligible |

### Row Count Reality

Each user creates at most 9 rows. 50,000 MAUs × 9 rows = 450,000 rows maximum. This is well within the 500 MB free tier limit (each row is ~100 bytes, so 450K rows ≈ 45 MB).

### Anonymous User Cleanup

Supabase automatically marks anonymous users for deletion after a configurable inactivity period (default: 30 days). This can be configured in the Dashboard under Authentication > Auth Providers > Anonymous. The `on delete cascade` on `user_progress.user_id` ensures orphaned rows are cleaned up automatically.

### Rate Limits

The Supabase anon key is rate-limited by Supabase's built-in protections. For a hackathon app with occasional sync calls (one on load, one on each card completion), you will never approach rate limits.

---

## Code Patterns

### Supabase Client Setup (complete)

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL')
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

The `createClient` defaults are correct for browser use: `persistSession: true`, `autoRefreshToken: true`, `storage: localStorage`. No additional options needed.

### Package Installation

```bash
npm install @supabase/supabase-js
```

Only this one package is needed. Do not install `@supabase/ssr` (that's for server-side rendering with Next.js/Remix).

### Upsert Pattern (idempotent sync)

```ts
const { error } = await supabase
  .from('user_progress')
  .upsert(
    { user_id: userId, level: 1, card: 2, completed_at: new Date().toISOString() },
    { onConflict: 'user_id,level,card', ignoreDuplicates: true }
  )
```

`ignoreDuplicates: true` means if the row already exists, do nothing (no update). This is correct since `completed_at` is set once and never needs changing.

### Polling Pattern (on app focus)

For cross-device sync to feel responsive without Realtime subscriptions, sync when the user returns to the tab:

```ts
// src/App.tsx
useEffect(() => {
  const handleFocus = () => syncFromSupabase().then(() => refreshProgress())
  window.addEventListener('focus', handleFocus)
  return () => window.removeEventListener('focus', handleFocus)
}, [])
```

This is sufficient for the use case. No Realtime needed.

### TypeScript Types

```ts
// src/types/supabase.ts
export interface Database {
  public: {
    Tables: {
      user_progress: {
        Row: {
          id: string
          user_id: string
          level: number
          card: number
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          level: number
          card: number
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          level?: number
          card?: number
          completed_at?: string
        }
      }
    }
  }
}
```

Pass to `createClient<Database>(...)` for type-safe queries. Optional for MVP but recommended.

---

## Common Pitfalls

### 1. Calling `signInAnonymously()` on every render

**Problem**: Multiple anonymous sessions created; race conditions; multiple UUIDs in the database.

**Fix**: Call `getOrCreateAnonUser()` once on app mount via a context provider or a top-level hook. Cache the result. Check `getSession()` first before calling `signInAnonymously()`.

### 2. Forgetting to enable Anonymous Sign-Ins in the Dashboard

**Problem**: `signInAnonymously()` returns an error: `"Anonymous sign-ins are disabled"`.

**Fix**: Go to Supabase Dashboard > Authentication > Providers > Anonymous, and toggle it on.

### 3. Using the service role key in the client

**Problem**: The service role key bypasses RLS entirely. If exposed in the browser, any user can read/write any row.

**Fix**: Always use the `anon` key in the browser. Never expose the `service_role` key client-side. The anon key is safe by design.

### 4. Missing RLS policies (table is inaccessible)

**Problem**: With RLS enabled but no policies, all queries return empty results (for selects) or permission denied (for writes) — even for authenticated users.

**Fix**: Always create explicit RLS policies for each operation (select, insert, update, delete) you need.

### 5. `user_id` not matching `auth.uid()` on insert

**Problem**: User tries to insert a row with a `user_id` different from their own UUID. This would be blocked by the `with check` on the insert policy.

**Fix**: Always derive `user_id` from `supabase.auth.getSession()` or `supabase.auth.getUser()`, never from user input or URL params.

### 6. Supabase sync blocking the UI

**Problem**: Awaiting Supabase calls before rendering progress creates a slow or blank UI.

**Fix**: Load from localStorage synchronously first (instant), run Supabase sync in background, update state when sync completes. Never block the UI on network calls.

### 7. Not handling offline gracefully

**Problem**: `supabase.from(...).upsert(...)` throws when offline. If not caught, it breaks the app.

**Fix**: Always wrap Supabase calls in try/catch and swallow errors gracefully. The app must work fully without Supabase.

### 8. Realtime subscriptions draining the free tier

**Problem**: Realtime uses a persistent WebSocket connection. 200 concurrent connections is the free tier limit.

**Fix**: Do not use Realtime for this use case. Polling on tab focus is sufficient and free.

### 9. Anonymous users on incognito / private browsing

**Problem**: Private browsing clears localStorage on close. Each incognito session creates a new anon user in Supabase.

**Fix**: This is expected behavior for anonymous auth. Document it as a limitation. Over time, these short-lived anonymous users accumulate but Supabase's inactivity cleanup handles them.

### 10. Supabase project URL/key in version control

**Problem**: Accidentally committing `.env.local` exposes credentials (though the anon key is public, the project URL is not secret either — but good hygiene matters).

**Fix**: Add `.env.local` to `.gitignore`. Set environment variables in Vercel/Netlify dashboard instead.

---

## Security: Preventing Progress Spoofing

### Threat Model

In an anonymous, no-auth app, "security" means: can user A read or modify user B's progress?

### How RLS Prevents Spoofing

RLS policies using `auth.uid() = user_id` mean:
- A user can only SELECT rows where `user_id` matches their JWT's `sub` claim.
- A user can only INSERT rows where `user_id` matches their JWT's `sub` claim (enforced by `with check`).
- The JWT is signed by Supabase's private key. It cannot be forged by the client.
- Even if a user knows another user's UUID (e.g., by guessing), they cannot read or write that user's rows because their JWT's `sub` is different.

### What Cannot Be Prevented

- A user can mark any card as complete for themselves (this is intentional — no server-side verification that they actually watched the video).
- A user can call the API directly (curl, Postman) with their own JWT to insert fake completions for themselves.

### Risk Assessment for Doppio

Both of the above "attacks" are **by design and acceptable**. Doppio is a learning app, not a competitive platform. There are no rewards for spoofing (no certificates, no leaderboards). The security model is sufficient.

---

## Real-time vs Polling

### Recommendation: Polling on tab focus

**Why not Realtime:**
- Supabase Realtime is for multi-user collaborative apps (chat, multiplayer, dashboards).
- Doppio progress only changes when the current user completes a card — which happens in the same browser session.
- Realtime subscriptions consume WebSocket connections (free tier limit: 200 concurrent). Not needed here.
- Added complexity: subscription management, reconnection handling.

**Why polling on focus is correct:**
- The only cross-device sync scenario is: user opens app on a second device.
- The `window.focus` event fires when the user switches back to the tab.
- Sync on focus = instant update when user returns, no continuous connection.

**Implementation** (see Code Patterns section above): one `window.addEventListener('focus', ...)` in the top-level component.

---

## References

- Supabase Anonymous Sign-Ins: https://supabase.com/docs/guides/auth/anonymous-sign-ins
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase JS v2 Client: https://supabase.com/docs/reference/javascript/introduction
- Supabase Free Tier Limits: https://supabase.com/pricing
- `@supabase/supabase-js` npm: https://www.npmjs.com/package/@supabase/supabase-js
- Supabase upsert docs: https://supabase.com/docs/reference/javascript/upsert
- Vite environment variables: https://vitejs.dev/guide/env-and-mode
