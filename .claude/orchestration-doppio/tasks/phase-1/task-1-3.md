# Task 1.3: Supabase Project Setup

## Objective

Create a new Supabase project, enable anonymous authentication, create the `user_progress` and `analytics_events` database tables with exact DDL from DISCOVERY.md, apply RLS policies, create the Supabase client module in the app, and verify that `signInAnonymously()` works from the running app. This task requires two human checkpoints — the agent must pause and ask the user before proceeding past each human-action step.

## Context

Supabase is the backend for Doppio: it stores anonymous user progress (up to 9 rows per user) and custom analytics events. The client is localStorage-first — Supabase is a background sync layer. If Supabase is unavailable, the app silently falls back to localStorage. This means the schema and auth must be correct, but a Supabase outage should never break the user-facing app. Task 1.1 installed `@supabase/supabase-js`. This task creates `src/lib/supabase.ts` and `src/lib/auth.ts` that all other tasks import.

## Dependencies

- Task 1.1 — provides `src/lib/` directory and `@supabase/supabase-js` package installed

## Blocked By

- Task 1.1

---

## Research Findings

- **D24** (DISCOVERY.md): Supabase anonymous auth via `signInAnonymously()`. New project to be created. Anonymous sign-ins must be enabled in Dashboard.
- **D25**: localStorage is source of truth. Supabase sync is fire-and-forget. Merge strategy: union (additive — cards never un-completed). Pull from Supabase on `window.focus`. Never block UI on network.
- **D26**: Exact `user_progress` table DDL — use verbatim.
- **D27**: `analytics_events` table — `event_name`, `session_id`, `properties jsonb`, `created_at`.
- **D53**: Env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Both are public/safe.
- **D54**: If `signInAnonymously()` fails → silent fallback to localStorage-only mode. No error shown to user.
- **supabase-anonymous-progress skill**: Provides the complete, tested implementation. Follow it precisely.

---

## Implementation Plan

### HUMAN CHECKPOINT 1: Create Supabase Project

**STOP HERE. This step requires human action.**

Before writing any code, ask the user:

> "Task 1.3 needs a Supabase project. Please:
> 1. Go to https://supabase.com and sign in (or create a free account)
> 2. Click 'New project'
> 3. Name it 'doppio' (or any name you prefer)
> 4. Choose any region (closest to your users — US East or EU West are good choices)
> 5. Set a database password (save it somewhere safe — you won't need it in this task, but keep it)
> 6. Wait for the project to finish creating (~1-2 minutes)
> 7. Once created, go to: Project Settings → API
> 8. Copy 'Project URL' and the 'anon' 'public' key
> 9. Paste them here in this format:
>    VITE_SUPABASE_URL=https://xxxxx.supabase.co
>    VITE_SUPABASE_ANON_KEY=eyJhbGci..."

Wait for the user to provide both values before continuing. Do NOT proceed with any file creation or Playwright steps until you have real credentials.

When the user provides the credentials, save them mentally for the next steps.

### Step 1: Create `.env.local` with Real Credentials

Once the user provides the credentials, create `.env.local` in the project root:

```
# Supabase project credentials — DO NOT COMMIT THIS FILE
VITE_SUPABASE_URL=<value provided by user>
VITE_SUPABASE_ANON_KEY=<value provided by user>
```

Verify `.env.local` is in `.gitignore` (Task 1.1 handled this — double-check).

### Step 2: Enable Anonymous Sign-ins in Supabase Dashboard

Use Playwright to navigate to the Supabase Dashboard and enable anonymous sign-ins:

1. Navigate to: `https://supabase.com/dashboard/project/<project-ref>/settings/auth`
   - The `project-ref` is the subdomain from `VITE_SUPABASE_URL` (e.g., `https://abcdefgh.supabase.co` → project-ref is `abcdefgh`)
2. Look for "Anonymous Sign-ins" section (it may be under "Authentication → Settings" or "Authentication → Providers")
3. Find the toggle: "Enable anonymous sign-ins"
4. Click to enable it (toggle should turn green/active)
5. Click "Save" if a save button is present
6. Screenshot the enabled state as confirmation

If Playwright cannot navigate to the Dashboard directly, give the user these instructions and ask them to confirm when done:

> "Please go to your Supabase project → Authentication → Settings → and enable 'Anonymous sign-ins'. Let me know when done."

### Step 3: Run Schema SQL in Supabase SQL Editor

Use Playwright to navigate to the Supabase SQL Editor and run the schema:

Navigate to: `https://supabase.com/dashboard/project/<project-ref>/sql/new`

Run the following SQL (paste and click "Run"):

```sql
-- Table: user_progress (from DISCOVERY.md D26)
create table public.user_progress (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  level        smallint not null check (level between 1 and 3),
  card         smallint not null check (card between 1 and 3),
  completed_at timestamptz not null default now(),
  constraint unique_user_level_card unique (user_id, level, card)
);

-- Table: analytics_events (from DISCOVERY.md D27)
create table public.analytics_events (
  id          uuid default gen_random_uuid() primary key,
  event_name  text not null,
  session_id  uuid not null,
  properties  jsonb,
  created_at  timestamptz not null default now()
);
```

Run both CREATE TABLE statements together. Verify in the SQL editor output that both tables were created without error (look for "Success" message, no error in red).

If Playwright cannot reach the SQL Editor, provide this SQL to the user and ask them to run it manually. Wait for confirmation before proceeding.

### Step 4: Run RLS Policy SQL in Supabase SQL Editor

In the same SQL Editor (or a new query), run the RLS policies:

```sql
-- Enable RLS (required before policies take effect)
alter table public.user_progress enable row level security;

-- Policy 1: Users can read only their own rows
create policy "Users can read own progress"
  on public.user_progress
  for select
  using (auth.uid() = user_id);

-- Policy 2: Users can insert only for themselves
create policy "Users can insert own progress"
  on public.user_progress
  for insert
  with check (auth.uid() = user_id);

-- Policy 3: Required for upsert (ON CONFLICT DO UPDATE) to work
create policy "Users can upsert own progress"
  on public.user_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Verify success in SQL editor output — no red errors.

**Why all 3 policies are required**: With RLS enabled but no policies, ALL queries return empty results or permission denied — even for authenticated (anonymous) users. All three are necessary.

Note: The `analytics_events` table does NOT need RLS (it is write-only from the client; no SELECT queries are made client-side). Leave it without RLS for now — Task 5.1 may add a policy if needed.

### Step 5: Verify Tables in Dashboard

Navigate to the Supabase Table Editor to visually verify:
- `https://supabase.com/dashboard/project/<project-ref>/editor`

Confirm:
- `user_progress` table appears with columns: `id`, `user_id`, `level`, `card`, `completed_at`
- `analytics_events` table appears with columns: `id`, `event_name`, `session_id`, `properties`, `created_at`
- `user_progress` shows "RLS enabled" badge

### Step 6: Create `src/lib/supabase.ts`

```typescript
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

The `createClient` defaults are correct for browser use:
- `persistSession: true` — session stored in localStorage, survives page refresh
- `autoRefreshToken: true` — JWT refreshed automatically before expiry
- `storage: localStorage` — session persistence

Do NOT pass any additional options. Do NOT use `@supabase/ssr` — that is for server-side rendering.

### Step 7: Create `src/lib/auth.ts`

```typescript
// src/lib/auth.ts
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

// Module-level cache — once resolved, never re-fetched within the session
let cachedUser: User | null = null

export async function getOrCreateAnonUser(): Promise<User | null> {
  // Return cached result immediately (module-level cache survives re-renders)
  if (cachedUser) return cachedUser

  try {
    // Step 1: Check for existing session (restored from localStorage by the Supabase client)
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      cachedUser = session.user
      return cachedUser
    }

    // Step 2: No session — create anonymous user (called at most once ever)
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error

    cachedUser = data.user
    return cachedUser
  } catch (err) {
    // Auth failed — return null, app continues in localStorage-only mode
    console.warn('[Doppio] Supabase auth failed, continuing in offline mode', err)
    return null
  }
}
```

**Critical rule**: NEVER call `signInAnonymously()` without checking `getSession()` first. Calling it multiple times creates multiple anonymous users and multiple UUIDs in the database.

### Step 8: Save SQL Schema as Migration File

Create `supabase/migrations/001_initial.sql` with the complete DDL so it is documented in version control:

```sql
-- Migration 001: Initial schema for Doppio
-- Created: Phase 1, Task 1.3

-- ===================================================
-- Table: user_progress
-- Stores one row per completed card per anonymous user
-- Max 9 rows per user (3 levels × 3 cards)
-- ===================================================
create table public.user_progress (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  level        smallint not null check (level between 1 and 3),
  card         smallint not null check (card between 1 and 3),
  completed_at timestamptz not null default now(),
  constraint unique_user_level_card unique (user_id, level, card)
);

-- Enable RLS
alter table public.user_progress enable row level security;

-- RLS Policies: users access only their own rows
create policy "Users can read own progress"
  on public.user_progress
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.user_progress
  for insert
  with check (auth.uid() = user_id);

create policy "Users can upsert own progress"
  on public.user_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ===================================================
-- Table: analytics_events
-- Custom event tracking (Supabase layer 2 analytics)
-- 7 tracked events: page_view, level_started, card_completed,
--   try_it_clicked, level_completed, badge_shared, pwa_installed
-- ===================================================
create table public.analytics_events (
  id          uuid default gen_random_uuid() primary key,
  event_name  text not null,
  session_id  uuid not null,
  properties  jsonb,
  created_at  timestamptz not null default now()
);
```

This file is documentation only — the schema has already been applied to the live Supabase project via the SQL Editor in the steps above.

### Step 9: Update `src/App.tsx` to Initialize Auth on Mount

Add the auth initialization and `window.focus` sync to `App.tsx`:

```tsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Learn from './pages/Learn'
import Complete from './pages/Complete'
import { IOSInstallBanner } from './components/IOSInstallBanner'
import { AndroidInstallBanner } from './components/AndroidInstallBanner'
import { getOrCreateAnonUser } from './lib/auth'

function App() {
  // Initialize anonymous auth on mount (called once — cached in auth.ts module)
  useEffect(() => {
    void getOrCreateAnonUser()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/complete" element={<Complete />} />
      </Routes>
      <IOSInstallBanner />
      <AndroidInstallBanner />
    </BrowserRouter>
  )
}

export default App
```

Note: `syncFromSupabase()` (from `src/lib/progress.ts`) will be added to App.tsx in Task 3.4 when the progress module is created. For now, only the auth initialization is wired here.

### HUMAN CHECKPOINT 2: Verify signInAnonymously in Browser Console

Ask the user to verify that anonymous auth works:

> "Please:
> 1. Run `npm run dev`
> 2. Open http://localhost:5173 in Chrome
> 3. Open Chrome DevTools → Console
> 4. Paste and run this command:
>    ```javascript
>    import('./src/lib/auth.ts').then(m => m.getOrCreateAnonUser()).then(user => console.log('User UUID:', user?.id))
>    ```
>    (Or if that doesn't work, try the Supabase client directly):
>    ```javascript
>    // In browser console after app loads:
>    await supabase.auth.signInAnonymously()
>    ```
> 5. Verify you see a UUID in the output (not an error)
> Let me know the result."

Alternatively, use Playwright to navigate to the running dev server and evaluate the auth call in the browser context:

```javascript
// Playwright evaluate
const result = await page.evaluate(async () => {
  // The app exposes supabase client via the module system
  // Try to read the session from localStorage
  const keys = Object.keys(localStorage).filter(k => k.includes('supabase'))
  return keys.length > 0 ? 'Session found in localStorage' : 'No session yet'
})
```

Then verify in the Supabase Dashboard that an anonymous user appeared:
- Navigate to: `https://supabase.com/dashboard/project/<project-ref>/auth/users`
- Verify: At least one user row with `Is anonymous: true`

---

## Files to Create

- `.env.local` — Real Supabase credentials (created after user provides them; NEVER commit)
- `src/lib/supabase.ts` — Supabase client singleton
- `src/lib/auth.ts` — `getOrCreateAnonUser()` with session check + anon sign-in + module cache
- `supabase/migrations/001_initial.sql` — Schema DDL as version-controlled documentation

## Files to Modify

- `src/App.tsx` — Add `getOrCreateAnonUser()` call on mount

---

## Contracts

### Provides (for downstream tasks)

- **`supabase` client**: Exported from `src/lib/supabase.ts` — every task that touches Supabase imports from here
- **`getOrCreateAnonUser()`**: Exported from `src/lib/auth.ts` — returns `User | null`, safe to call multiple times (cached)
- **`user_progress` table**: Created in Supabase with correct schema, RLS, unique constraint — Task 3.4 uses this
- **`analytics_events` table**: Created in Supabase — Task 5.1 uses this
- **`.env.local`**: Contains real credentials — `npm run dev` and `npm run build` work with real Supabase values
- **Anonymous auth**: Confirmed working — downstream tasks can rely on `getOrCreateAnonUser()` returning a user UUID

### Consumes (from upstream tasks)

- Task 1.1 — `src/lib/` directory, `@supabase/supabase-js` installed in `node_modules`

---

## Acceptance Criteria

- [ ] Supabase project created (new project, not shared)
- [ ] Anonymous sign-ins enabled in Authentication → Settings in Supabase Dashboard
- [ ] `user_progress` table created with all columns: `id`, `user_id`, `level`, `card`, `completed_at`
- [ ] `user_progress` has `unique_user_level_card` constraint on `(user_id, level, card)`
- [ ] `analytics_events` table created with all columns: `id`, `event_name`, `session_id`, `properties`, `created_at`
- [ ] RLS enabled on `user_progress` with all three policies (select, insert, update)
- [ ] `src/lib/supabase.ts` exports `supabase` client using `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] `src/lib/auth.ts` exports `getOrCreateAnonUser()` with module-level cache and `getSession()` pre-check
- [ ] `.env.local` contains real (non-placeholder) values for both env vars
- [ ] `supabase/migrations/001_initial.sql` exists with complete DDL
- [ ] `npm run build` succeeds (no TypeScript errors from new files)
- [ ] Anonymous sign-in works: browser console call returns a UUID (not an error)
- [ ] Supabase Dashboard → Authentication → Users shows at least one anonymous user after app loads

---

## Testing Protocol

### Build/Type Checks

- [ ] `npm run build` — exits 0
- [ ] `npx tsc --noEmit` — no TypeScript errors from `supabase.ts` or `auth.ts`

### Browser Testing (Playwright MCP)

**Auth verification:**
- Start: `npm run dev`
- Navigate to: `http://localhost:5173/`
- Open DevTools → Console
- Evaluate:
  ```javascript
  // Check if Supabase session was created
  const session = await (await fetch('/__vite__/env')).json().then(() =>
    Object.keys(localStorage).filter(k => k.startsWith('sb-'))
  )
  ```
- Verify: localStorage contains a `sb-*-auth-token` key (this is Supabase's session storage key)
- Screenshot: Console showing auth session key in localStorage

**Verify no errors on page load:**
- Navigate to `http://localhost:5173/`
- DevTools Console: verify no red errors about missing Supabase credentials or auth failures

### External Service Verification (Supabase Dashboard)

- Navigate to: Supabase Dashboard → Table Editor → `user_progress`
- Verify: Table exists with correct columns visible
- Navigate to: Supabase Dashboard → Authentication → Users
- Wait ~5 seconds after loading the dev app
- Refresh the users page
- Verify: At least one user row with "Anonymous" indicator appears

### Test Queries (Supabase SQL Editor)

Run these verification queries after the app has been visited once:

```sql
-- Verify table structure
select column_name, data_type
from information_schema.columns
where table_name = 'user_progress'
order by ordinal_position;

-- Verify RLS policies exist
select policyname, cmd from pg_policies
where tablename = 'user_progress';

-- Verify anonymous user created
select id, is_anonymous, created_at
from auth.users
order by created_at desc
limit 5;
```

Expected: 3 policies returned, at least 1 anonymous user row.

---

## Skills to Read

- `.claude/skills/supabase-anonymous-progress/SKILL.md` — Complete implementation patterns, RLS SQL, pitfalls. Read this in full before starting.
- `.claude/skills/doppio-architecture/SKILL.md` — Architecture overview including Supabase data flow diagram.

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D24, D25, D26, D27, D53, D54, D59

---

## Git

- Branch: `phase-1/supabase-setup`
- Commit message prefix: `Task 1.3:`
- Example: `Task 1.3: add Supabase client, auth module, schema migration, enable anonymous auth`
- IMPORTANT: Do NOT commit `.env.local`. Verify `.gitignore` excludes it before committing.
- Commit: `src/lib/supabase.ts`, `src/lib/auth.ts`, `supabase/migrations/001_initial.sql`, updated `src/App.tsx`
