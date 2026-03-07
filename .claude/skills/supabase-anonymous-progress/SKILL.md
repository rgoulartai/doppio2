---
name: supabase-anonymous-progress
description: Supabase anonymous auth + offline-first progress sync for Doppio. Use when implementing progress tracking, Supabase schema, or the useProgress hook.
---

# Skill: Supabase Anonymous Auth + Progress Sync

## Overview

This skill provides the complete implementation for Doppio's offline-first progress tracking using Supabase anonymous auth. localStorage is the source of truth; Supabase is the background sync layer. The app must work fully without a Supabase connection.

**Authority**: All decisions in this skill are derived from DISCOVERY.md (D24, D25, D26, D53, D54) and the supabase-sync.md research file.

---

## 1. Package Installation

```bash
npm install @supabase/supabase-js
```

Only this one package. Do NOT install `@supabase/ssr` — that is for server-side rendering frameworks (Next.js, Remix) and is not needed in a Vite/React SPA.

---

## 2. Environment Variables

Add to `.env.local` (never commit this file):

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Both values are safe to expose client-side. The anon key is a public key designed for browser use. RLS policies are the security layer — not key secrecy. The service role key must NEVER appear in client code.

---

## 3. Supabase Client — `src/lib/supabase.ts`

```ts
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

The `createClient` defaults are correct for browser use: `persistSession: true`, `autoRefreshToken: true`, `storage: localStorage`. No additional options object is needed.

---

## 4. Anonymous Auth Pattern — `src/lib/auth.ts`

### Critical Rule: NEVER call `signInAnonymously()` more than once

Calling `signInAnonymously()` multiple times creates multiple anonymous users in `auth.users`, causes race conditions, and produces multiple UUIDs in the database. Always check for an existing session first.

```ts
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

// Module-level cache — once resolved, never re-fetched within the session
let cachedUser: User | null = null

export async function getOrCreateAnonUser(): Promise<User | null> {
  // Return cached result immediately if available
  if (cachedUser) return cachedUser

  try {
    // Step 1: Check for existing session (restored from localStorage by the client)
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      cachedUser = session.user
      return cachedUser
    }

    // Step 2: No session exists — create anonymous user (called at most once)
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error

    cachedUser = data.user
    return cachedUser
  } catch (err) {
    // Auth failed — return null, caller falls back to localStorage-only mode
    console.warn('Supabase auth failed, continuing in offline mode', err)
    return null
  }
}
```

**Call this once on app mount** via the top-level component or a React context provider. Never call it inside individual card components or on every render.

---

## 5. Database Schema (exact DDL from DISCOVERY.md D26)

Run this in the Supabase Dashboard SQL Editor:

```sql
-- Create the progress table
create table public.user_progress (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  level        smallint not null check (level between 1 and 3),
  card         smallint not null check (card between 1 and 3),
  completed_at timestamptz not null default now(),
  constraint unique_user_level_card unique (user_id, level, card)
);
```

Notes:
- `on delete cascade` — when Supabase auto-deletes an inactive anonymous user (default: after 30 days), their progress rows are cleaned up automatically.
- The `unique_user_level_card` constraint makes upserts safe and idempotent.
- No `updated_at` column needed — `completed_at` is set once and never changes.
- Maximum 9 rows per user (3 levels × 3 cards). Negligible storage footprint.

---

## 6. RLS Policies (3 policies required)

Run these in the Supabase Dashboard SQL Editor after creating the table:

```sql
-- Enable RLS on the table (required before policies take effect)
alter table public.user_progress enable row level security;

-- Policy 1: SELECT — users can read only their own rows
create policy "Users can read own progress"
  on public.user_progress
  for select
  using (auth.uid() = user_id);

-- Policy 2: INSERT — users can insert only for themselves
create policy "Users can insert own progress"
  on public.user_progress
  for insert
  with check (auth.uid() = user_id);

-- Policy 3: UPDATE — required for upsert (ON CONFLICT DO UPDATE) to work
create policy "Users can upsert own progress"
  on public.user_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**How `auth.uid()` works for anonymous users**: When `signInAnonymously()` creates a session, the JS client attaches a JWT to every subsequent Supabase request. `auth.uid()` reads the `sub` claim from that JWT, which is the anonymous user's UUID. This is identical to how named users work — RLS does not distinguish between anonymous and named users.

**Warning**: With RLS enabled but no policies, ALL queries return empty results or permission denied — even for authenticated users. All three policies above are required.

---

## 7. Progress Module — `src/lib/progress.ts`

### localStorage Key and Progress Shape

```ts
const STORAGE_KEY = 'doppio_progress_v1'

// Shape stored in localStorage
interface ProgressState {
  level_1: { card_1: boolean; card_2: boolean; card_3: boolean }
  level_2: { card_1: boolean; card_2: boolean; card_3: boolean }
  level_3: { card_1: boolean; card_2: boolean; card_3: boolean }
}

function emptyProgress(): ProgressState {
  return {
    level_1: { card_1: false, card_2: false, card_3: false },
    level_2: { card_1: false, card_2: false, card_3: false },
    level_3: { card_1: false, card_2: false, card_3: false },
  }
}
```

### Full `src/lib/progress.ts` Implementation

```ts
import { supabase } from './supabase'
import { getOrCreateAnonUser } from './auth'

const STORAGE_KEY = 'doppio_progress_v1'

export interface ProgressState {
  level_1: { card_1: boolean; card_2: boolean; card_3: boolean }
  level_2: { card_1: boolean; card_2: boolean; card_3: boolean }
  level_3: { card_1: boolean; card_2: boolean; card_3: boolean }
}

function emptyProgress(): ProgressState {
  return {
    level_1: { card_1: false, card_2: false, card_3: false },
    level_2: { card_1: false, card_2: false, card_3: false },
    level_3: { card_1: false, card_2: false, card_3: false },
  }
}

// Read from localStorage synchronously — always instant, works offline
export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress()
    return { ...emptyProgress(), ...JSON.parse(raw) }
  } catch {
    return emptyProgress()
  }
}

function writeProgress(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Failed to write progress to localStorage', err)
  }
}

// Write to localStorage immediately, then fire-and-forget Supabase upsert
export function markCardComplete(level: 1 | 2 | 3, card: 1 | 2 | 3): void {
  // 1. Synchronous localStorage write (instant UI update)
  const state = loadProgress()
  const levelKey = `level_${level}` as keyof ProgressState
  const cardKey = `card_${card}` as keyof ProgressState[typeof levelKey]
  ;(state[levelKey] as Record<string, boolean>)[cardKey] = true
  writeProgress(state)

  // 2. Fire-and-forget Supabase upsert (non-blocking)
  void (async () => {
    try {
      const user = await getOrCreateAnonUser()
      if (!user) return // offline mode — skip silently

      const { error } = await supabase
        .from('user_progress')
        .upsert(
          { user_id: user.id, level, card, completed_at: new Date().toISOString() },
          { onConflict: 'user_id,level,card', ignoreDuplicates: true }
        )

      if (error) throw error
    } catch (err) {
      // Swallow all errors — localStorage write already succeeded
      console.warn('Supabase upsert failed (offline mode continues)', err)
    }
  })()
}

// Pull all rows from Supabase and merge into localStorage by union (additive only)
// Cards can only be completed, never un-completed. Union is always correct.
export async function syncFromSupabase(): Promise<void> {
  try {
    const user = await getOrCreateAnonUser()
    if (!user) return // auth failed — skip silently

    const { data, error } = await supabase
      .from('user_progress')
      .select('level, card')
      .eq('user_id', user.id)

    if (error) throw error
    if (!data || data.length === 0) return

    // Merge: union of localStorage and Supabase (additive only)
    const state = loadProgress()
    for (const row of data) {
      const levelKey = `level_${row.level}` as keyof ProgressState
      const cardKey = `card_${row.card}`
      if (levelKey in state) {
        ;(state[levelKey] as Record<string, boolean>)[cardKey] = true
      }
    }
    writeProgress(state)
  } catch (err) {
    // Swallow all errors — app continues from localStorage
    console.warn('Supabase pull failed (offline mode continues)', err)
  }
}
```

---

## 8. React Hook — `src/hooks/useProgress.ts`

```ts
import { useEffect, useState, useCallback } from 'react'
import { loadProgress, markCardComplete, syncFromSupabase, type ProgressState } from '../lib/progress'

interface UseProgressReturn {
  progress: ProgressState
  markComplete: (level: 1 | 2 | 3, card: 1 | 2 | 3) => void
  isLoading: boolean
}

export function useProgress(): UseProgressReturn {
  // Read localStorage synchronously on first render — instant, no flash
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress())
  const [isLoading, setIsLoading] = useState(true)

  // On mount: background sync from Supabase, then refresh state
  useEffect(() => {
    syncFromSupabase().then(() => {
      setProgress(loadProgress())
      setIsLoading(false)
    })
  }, [])

  const markComplete = useCallback((level: 1 | 2 | 3, card: 1 | 2 | 3) => {
    markCardComplete(level, card)
    // Refresh state from localStorage immediately after write
    setProgress(loadProgress())
  }, [])

  return { progress, markComplete, isLoading }
}
```

**Usage in a component:**

```tsx
function LevelCard({ level, card }: { level: 1 | 2 | 3; card: 1 | 2 | 3 }) {
  const { progress, markComplete, isLoading } = useProgress()
  const levelKey = `level_${level}` as const
  const cardKey = `card_${card}` as const
  const isDone = progress[levelKey][cardKey]

  return (
    <div className={isDone ? 'opacity-60' : ''}>
      {/* card content */}
      <button
        onClick={() => markComplete(level, card)}
        disabled={isDone}
        className="active:scale-95 transition-transform"
      >
        {isDone ? 'Done' : 'Mark as done'}
      </button>
    </div>
  )
}
```

---

## 9. Sync on Window Focus — `src/App.tsx`

Register a `window.focus` listener in the top-level App component. This is the cross-device sync trigger — when the user switches back to the tab (e.g., after trying a tool in a new tab), Supabase is queried and localStorage is updated.

```tsx
import { useEffect } from 'react'
import { syncFromSupabase } from './lib/progress'
import { getOrCreateAnonUser } from './lib/auth'

function App() {
  // On app mount: initialize auth + sync from Supabase
  useEffect(() => {
    getOrCreateAnonUser()  // Called once — result cached in module variable
    syncFromSupabase()     // Non-blocking background sync
  }, [])

  // On window focus: pull any changes from other devices/sessions
  useEffect(() => {
    const handleFocus = () => {
      void syncFromSupabase()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // ... rest of app
}
```

---

## 10. Error Handling Rules

All Supabase calls must follow these rules without exception:

| Rule | Implementation |
|------|----------------|
| Auth failure → silent fallback | `getOrCreateAnonUser()` returns `null` on error; callers check for `null` and skip Supabase |
| Network failure → silent fallback | All Supabase calls wrapped in `try/catch`; errors logged as `console.warn`, never thrown |
| No user-visible errors | NEVER show an error toast or alert for Supabase failures |
| localStorage always succeeds first | Write to localStorage before initiating any Supabase call |
| Offline detection | No explicit `navigator.onLine` check needed — try/catch on Supabase calls handles it |

**Retry behavior**: On `window.focus`, `syncFromSupabase()` is called again. This is the natural retry — no explicit retry loop needed.

---

## 11. Supabase Dashboard Setup Checklist

These steps must be performed manually in the Supabase Dashboard before the app will work:

1. **Create Supabase project** at [supabase.com](https://supabase.com) — use any region (closest to users).

2. **Enable Anonymous Sign-Ins**:
   - Go to: Authentication → Settings (or Providers) → Anonymous Sign-Ins
   - Toggle: "Enable anonymous sign-ins" → ON
   - Default inactivity cleanup: 30 days (leave as-is)

3. **Copy credentials** to `.env.local`:
   - Project Settings → API → Project URL → `VITE_SUPABASE_URL`
   - Project Settings → API → `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
   - Never use the `service_role` key in the client.

4. **Run schema SQL** in SQL Editor (copy from Section 5 above):
   - Creates `public.user_progress` table

5. **Run RLS policy SQL** in SQL Editor (copy from Section 6 above):
   - Enables RLS
   - Creates all 3 required policies

6. **Verify** in Dashboard → Table Editor → `user_progress`:
   - Table visible with correct columns
   - RLS badge shows "RLS enabled"

---

## 12. Common Pitfalls — What NOT To Do

| Pitfall | Consequence | Correct Approach |
|---------|-------------|-----------------|
| Call `signInAnonymously()` without checking `getSession()` first | Multiple anon users created; multiple UUIDs per browser | Always `getSession()` first; use module-level cache |
| Call `signInAnonymously()` on every component mount | Race conditions; duplicate anonymous sessions | Call once at app mount; cache in `auth.ts` module variable |
| Use service role key in client code | Bypasses all RLS; any user can read/write any row | Always use the `anon` key |
| Await Supabase before rendering progress | Blank or slow UI | Load localStorage synchronously first; Supabase in background |
| No try/catch on Supabase calls | Network errors crash the app | Every Supabase call in try/catch, silently swallow errors |
| Enable RLS but forget to add policies | All queries return empty / denied | Add all 3 policies from Section 6 |
| Use Realtime subscriptions | Wastes free tier WebSocket connections | Use polling on `window.focus` — sufficient for this use case |
| Block progress save on network | Offline users cannot complete cards | Write localStorage first, Supabase second (fire-and-forget) |

---

## 13. File Summary

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/lib/auth.ts` | `getOrCreateAnonUser()` — session check + anonymous sign-in with module-level cache |
| `src/lib/progress.ts` | `loadProgress()`, `markCardComplete()`, `syncFromSupabase()` |
| `src/hooks/useProgress.ts` | `useProgress()` React hook — `{progress, markComplete, isLoading}` |
| `src/App.tsx` | Mount-time auth init + `window.focus` sync listener |
| `.env.local` | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
