# Synergy Review: Phases 4-6

**Reviewer**: Automated synergy analysis
**Date**: 2026-03-06
**Scope**: Tasks 4.1–4.R, 5.1–5.R, 6.1–6.5
**Cross-phase reference**: Tasks 3.2, 3.4, 1.3

---

## Summary (9 issues found)

| # | Severity | Category | Affected Tasks |
|---|----------|----------|----------------|
| 1 | High | Data contract mismatch | 4.1 vs 3.2 / 3.4 |
| 2 | High | Data contract mismatch | 4.1 vs 3.4 |
| 3 | High | Missing component reference | 5.4 |
| 4 | Medium | Analytics event property mismatch | 5.1 vs 6.4 |
| 5 | Medium | `analytics_events` schema conflict | 1.3 vs 5.1 |
| 6 | Medium | Deployment sequencing gap | 4.R and 5.R |
| 7 | Medium | localStorage key mismatch | 3.4 vs 6.3 |
| 8 | Low | `level_started` event coverage gap | 5.1 vs 6.4 |
| 9 | Low | `/?ref=badge` banner selector gap | 6.1 vs 6.5 |

---

## Issues

---

### Issue 1: VideoCard prop type name inconsistency between Task 3.2 and Task 4.1

**Tasks affected**: `task-4-1.md`, `task-3-2.md`

**Problem**:
Task 3.2 defines the VideoCard component with a prop typed as `VideoCardData` (imported from `src/types/content.ts`). The contracts section of task-3-2.md explicitly states the prop type is `{ card: VideoCardData, isCompleted: boolean, onComplete: () => void }`.

Task 4.1 (`CardList.tsx`) references the `Level` type from `src/types/content` in its import (`import type { Level } from '../types/content'`), and then accesses `card.card` as the card index number. However, the type used inside the `VideoCard` import in `CardList.tsx` is listed as `VideoCard` (the module/component name) without disambiguating it from the type `VideoCardData`. The implementation code in task-4-1.md shows:

```tsx
import { VideoCard } from './VideoCard'; // from Task 3.2
import type { Level } from '../types/content';
```

Meanwhile, task-3-2.md defines the type as `VideoCardData` (the data type) and exports the component as `VideoCard` (the component). In the `CardList.tsx` code in task-4-1.md, `card.card` (a number field on the `VideoCardData` object) is cast to `1 | 2 | 3`, but it is passed to `VideoCard` as the `card` prop — yet `VideoCard`'s `card` prop expects the entire `VideoCardData` object, not a number. This is actually correct in the implementation but the naming collision (`card.card` for the field named `card` on the `VideoCardData` type) creates ambiguity.

More critically, task-4-1.md documents the contract it consumes as:
> `VideoCard` component from Task 3.2: `{card: VideoCard, isCompleted: boolean, onComplete: () => void}`

It uses `VideoCard` (the component name) as the type for the `card` prop. This is a naming error — the prop type should be `VideoCardData`, not `VideoCard`. A future implementer reading task-4-1.md could import the wrong thing.

**Fix**:
In `task-4-1.md`, under "Contracts → Consumes", change:
```
`VideoCard` component from Task 3.2: `{card: VideoCard, isCompleted: boolean, onComplete: () => void}`
```
to:
```
`VideoCard` component from Task 3.2: `{card: VideoCardData, isCompleted: boolean, onComplete: () => void}`
```
This matches the actual type definition from task-3-2.md (`VideoCardData` from `src/types/content.ts`).

---

### Issue 2: `useProgress` hook return shape mismatch between Task 3.4 and Task 4.1

**Tasks affected**: `task-4-1.md`, `task-3-4.md`

**Problem**:
Task 3.4 defines the `useProgress()` hook return type as:
```ts
{ progress: ProgressState, markComplete, isLoading, completedCount, totalCount, totalCompleted, isLevelComplete }
```

The `ProgressState` shape in task-3-4.md uses `level_1`, `level_2`, `level_3` keys with `card_1`, `card_2`, `card_3` sub-keys (snake_case with underscore):
```ts
interface ProgressState {
  level_1: { card_1: boolean; card_2: boolean; card_3: boolean };
  level_2: ...
  level_3: ...
}
```

However, task-4-1.md accesses progress using a numeric index pattern `progress[1]`, `progress[2]`, `progress[3]` throughout its `Learn.tsx` implementation:
```tsx
const completedCounts: Record<1 | 2 | 3, number> = {
  1: Object.values(progress[1] ?? {}).filter(Boolean).length,
  2: Object.values(progress[2] ?? {}).filter(Boolean).length,
  3: Object.values(progress[3] ?? {}).filter(Boolean).length,
};
```

And the `handleCardComplete` function accesses `progress[level]`:
```tsx
const updated = { ...(progress[level] ?? {}), [card]: true };
```

The PHASES.md description for Task 3.4 also documents the shape as `{1: {1: bool, 2: bool, 3: bool}, 2: {...}, 3: {...}}` (numeric keys), which contradicts the actual `ProgressState` interface in task-3-4.md which uses string keys (`level_1`, `card_1`, etc.).

This is a critical data contract mismatch. If implemented as specified in task-3-4.md (string keys), task-4-1.md's `progress[1]` accesses will always be `undefined`, breaking the entire level flow.

**Fix**:
The two options are:

**Option A (align task-4-1.md to task-3-4.md's actual interface)**: Update all numeric access patterns in task-4-1.md's `Learn.tsx` implementation to use the string key pattern from `ProgressState`:
- `progress[1]` → `progress.level_1`
- `progress[level]` → `progress[\`level_${level}\` as keyof ProgressState]`
- `progress[activeLevel]` → `progress[\`level_${activeLevel}\` as keyof ProgressState]`

**Option B (align task-3-4.md to PHASES.md and task-4-1.md's numeric convention)**: Update `ProgressState` in task-3-4.md to use numeric keys matching PHASES.md's `{1: {1: bool, 2: bool, 3: bool}}` description.

Option A is recommended because task-3-4.md is more authoritative (it IS the implementation spec for the hook) and the `ProgressState` interface with string keys is more TypeScript-idiomatic and consistent with the localStorage key format (`"level_1"`, `"card_1"`).

The implementer must pick one convention and apply it consistently across ALL tasks that touch progress state (3.4, 4.1, 5.1, 6.3).

Note: task-6-3.md (Test 3, Step 4) expects the localStorage shape to be:
```json
{
  "level_1": {"card_1": true, "card_2": true, "card_3": true},
  "level_2": ...
}
```
This aligns with task-3-4.md's `ProgressState` interface (string keys), confirming task-4-1.md's numeric index approach is the outlier that needs correction.

---

### Issue 3: `AndroidInstallBanner` component referenced in Task 5.4 but never defined in any Phase 1-4 task

**Tasks affected**: `task-5-4.md`, `task-4-4.md`, `task-1-3.md`

**Problem**:
Task 5.4 references `src/components/AndroidInstallBanner.tsx` in three places:
1. "Files to Modify" list: `src/components/AndroidInstallBanner.tsx`
2. Touch target audit table: `src/components/AndroidInstallBanner.tsx`
3. Safe area section: "AndroidInstallBanner — same pattern"

Task 4.4 (PWA Install Prompts) only creates `IOSInstallBanner.tsx` and `useInstallPrompt.ts`. The Android install button is wired directly into `Landing.tsx` as an inline button — there is no separate `AndroidInstallBanner.tsx` component created anywhere in Phases 1-4.

Additionally, task-1-3.md's `App.tsx` template includes `<AndroidInstallBanner />` as a top-level import, yet this component is never specified for creation anywhere. This is a phantom component reference.

**Fix**:
Either:

**Option A**: Add `AndroidInstallBanner.tsx` to task-4-4.md's "Files to Create" list with a contract that it wraps the Android install button logic from `Landing.tsx` into a standalone component, and update task-1-3.md to reflect it.

**Option B**: Remove all references to `AndroidInstallBanner.tsx` from task-5-4.md and task-1-3.md, and update the touch target audit in task-5-4.md to reference `Landing.tsx` for the Android "Install App" button instead. Update task-1-3.md's `App.tsx` template to remove the `<AndroidInstallBanner />` import.

Option B is recommended since task-4-4.md already specifies the Android button lives in `Landing.tsx` header (step 3 of its implementation plan), which is the correct architectural choice for a simple inline button.

---

### Issue 4: Analytics event property names differ between Task 5.1 (sender) and Task 6.4 (SQL verifier)

**Tasks affected**: `task-5-1.md`, `task-6-4.md`

**Problem**:
Task 5.1 defines `track('try_it_clicked', ...)` with these properties:
```ts
track('try_it_clicked', {
  level: card.level,
  card: card.card,
  card_id: card.id,
  tool: card.aiTool,  // ← property name is 'tool'
});
```

Task 6.4 (SQL verification) expects to query this event with:
```sql
SELECT properties->>'tool' AS tool, COUNT(*) AS clicks
FROM public.analytics_events
WHERE event_name = 'try_it_clicked'
GROUP BY tool;
```

This is consistent. However, task-5-1.md also shows an alternate version in Step 7 with the property name `tool`:
```ts
track('try_it_clicked', {
  level: card.level,
  card: card.card,
  card_id: card.id,
  tool: card.aiTool,
})
```

But in Step 6 (card_completed), the signature shown is:
```ts
track('card_completed', { level, card, card_title: cardTitle });
```

Task 6.4 queries card_completed as:
```sql
SELECT properties->>'level' AS level, properties->>'card' AS card, COUNT(*) AS completions
FROM public.analytics_events
WHERE event_name = 'card_completed'
GROUP BY level, card;
```

The `card_title` property in the event is not queried in 6.4 — that is fine. However, task-5-1.md's acceptance criteria specifies:
```
`track('card_completed', { level, card, card_title })` fires on every card completion
```

But the `markComplete` function in task-3-4.md has the signature `markComplete(level, card)` — it does NOT receive `card_title`. Task 5.1 instructs changing `markComplete`'s signature to `markComplete(level, card, cardTitle)`, but this change must cascade to ALL callers in task-4-1.md (which calls `markComplete(level, card)` without a title parameter).

**Fix**:
Add a note in task-5-1.md under Step 6 that changing `markComplete`'s signature to include `cardTitle` requires updating the callers in `task-4-1.md`. Specifically:
1. `handleCardComplete` in `Learn.tsx` calls `markComplete(level, card)` without title
2. After task-5.1 adds `card_title`, all callers must be updated to pass the card title

The fix should instruct the implementer: when modifying `markComplete` in `useProgress.ts`, also update `Learn.tsx`'s `handleCardComplete` to pass the card title (readable from `content.levels[level-1].cards[card-1].title`).

---

### Issue 5: `analytics_events.session_id` column type conflict between Task 1.3 and Task 5.1

**Tasks affected**: `task-1-3.md`, `task-5-1.md`

**Problem**:
Task 1.3 creates the `analytics_events` table with:
```sql
session_id  uuid not null,
```
The `session_id` column is typed as `uuid` (Postgres UUID type).

Task 5.1 creates `src/lib/analytics.ts` with:
```ts
const SESSION_KEY = 'doppio_session_id';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
```

The `track()` function then inserts:
```ts
await supabase.from('analytics_events').insert({
  event_name: eventName,
  session_id: getSessionId(),  // a string
  properties,
});
```

A Postgres `uuid` column will accept a valid UUID string from JavaScript — this part is fine. However, task-5-1.md also creates its OWN DDL for `analytics_events` in Step 1 as a backup:
```sql
create table public.analytics_events (
  id         uuid        default gen_random_uuid() primary key,
  event_name text        not null,
  session_id text        not null,  -- ← TEXT, not UUID
  properties jsonb       default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

This DDL defines `session_id` as `text`, which is different from task-1-3.md's `uuid` type.

If task-1-3.md was executed first (which it should be — it's a prerequisite), the table will have `session_id uuid`. If task-5-1.md's "fallback DDL" runs on a fresh schema, the table will have `session_id text`. The two tasks have contradictory column type definitions for the same column.

**Fix**:
Update task-5-1.md Step 1's fallback DDL to match task-1-3.md exactly:
```sql
session_id  uuid not null,   -- not text
```
Also add a note: "If this table was already created by Task 1.3, verify the existing schema matches — do NOT recreate if it already exists."

---

### Issue 6: Phase 4.R and 5.R require `vercel --prod` but don't gate on prior deploy verification

**Tasks affected**: `task-4-R.md`, `task-5-R.md`

**Problem**:
Both task-4-R.md and task-5-R.md correctly call `vercel --prod` as step 1 before running Playwright tests against production. However, neither regression task includes a step to verify that the production deployment has fully propagated before running tests. The tasks proceed immediately to Playwright testing after `vercel --prod` completes, without waiting for DNS/CDN propagation or verifying the new build is actually live at the production URL.

Specifically, Vercel deployments can take 10-30 seconds after the CLI reports success before the production URL serves the new build. Running Playwright tests immediately after `vercel --prod` exits may test the previous deployment, leading to false failures for newly added features.

Task 4.R step 1 says:
> "Wait for deployment to complete. Confirm the deployment URL is `https://doppio.kookyos.com`..."

But there's no specific wait/poll step — the implementer may move on too quickly.

Task 5.R step 1 includes:
```bash
curl -s -o /dev/null -w "%{http_code}" https://doppio.kookyos.com
```
This only checks that the URL returns 200, not that it returns the NEW version.

**Fix**:
Add a versioned-deployment verification step to both task-4-R.md and task-5-R.md between the `vercel --prod` command and the first Playwright test. The simplest approach:

```bash
# After vercel --prod:
# 1. Note the deployment URL from vercel --prod output (e.g. https://doppio-xxxxx.vercel.app)
# 2. Test against the specific deployment URL first (not the custom domain)
#    to bypass CDN propagation delays
# 3. Only switch to doppio.kookyos.com once the specific URL confirms the new build

# Playwright: navigate to the vercel.app preview URL first, verify new content
# Then verify the custom domain also serves the new build
```

Additionally, a 15-second sleep or polling loop waiting for a newly added DOM element (e.g., a git commit hash in a meta tag, or a specific new feature) would be more robust for hackathon purposes.

---

### Issue 7: `localStorage` progress key mismatch between Task 3.4 and Task 6.3

**Tasks affected**: `task-3-4.md`, `task-6-3.md`

**Problem**:
Task 3.4 defines the localStorage key as:
```ts
const STORAGE_KEY = 'doppio_progress_v1';
```

Task 6.3 (Test 3, step 4) tests the localStorage shape by calling:
```ts
JSON.parse(localStorage.getItem('doppio_progress_v1'))
```
This is consistent with task-3-4.md. Good.

However, task-6-3.md's Test 1 (step 6) also calls:
```ts
evaluate: localStorage.removeItem('doppio_progress_v1')
```
And the test description in the acceptance criteria says:
```
Clearing `doppio_progress_v1` key from localStorage resets progress to zero on reload
```

This is consistent. No actual mismatch here.

BUT — task-6-3.md contains a research finding that says:
> "localStorage key: `doppio_progress_v1`"
> "Progress shape: `{ level_1: {card_1: bool, card_2: bool, card_3: bool}, level_2: {...}, level_3: {...} }`"

This shape uses string keys (`level_1`, `card_1`), which IS what task-3-4.md specifies. However, task-6-3.md's Test 3 expected shape in the test steps shows:
```json
{
  "level_1": {"card_1": true, "card_2": true, "card_3": true},
  "level_2": {"card_1": false, "card_2": false, "card_3": false},
  "level_3": {"card_1": false, "card_2": false, "card_3": false}
}
```

This directly contradicts task-4-1.md which accesses `progress[1]` using numeric keys. If an implementer follows task-3-4.md (string keys), task-6-3.md tests will pass. If an implementer follows task-4-1.md (numeric keys), task-6-3.md tests will fail because the stored JSON will be `{"1": {...}}`, not `{"level_1": {...}}`.

This issue is a downstream symptom of Issue 2 above. The root fix is resolving Issue 2. Documenting here for completeness.

**Fix**:
Same as Issue 2: standardize on string keys (`level_1`/`card_1`) throughout. Once Issue 2 is fixed (task-4-1.md aligned to task-3-4.md's `ProgressState`), this test in task-6-3.md will be correct as written.

---

### Issue 8: `level_started` analytics event for levels 2 and 3 has no clear trigger defined

**Tasks affected**: `task-5-1.md`, `task-6-4.md`

**Problem**:
Task 5.1 acceptance criteria states:
```
`track('level_started', { level: 2 })` and `track('level_started', { level: 3 })` fire when user navigates to levels 2 and 3
```

Task 5.1 Step 5 says:
> "Also wire `level_started` to the level tab navigation in `src/components/LevelNav.tsx` or wherever the user taps to switch to Level 2 or Level 3 for the first time. Fire `track('level_started', { level: n })` when the user actively clicks into a new level."

But task-4-1.md (which defines `LevelNav.tsx`) does NOT include any analytics call in its implementation plan. The `LevelNav` component code in task-4-1.md has only:
```tsx
onClick={() => onSelectLevel(lvl.level as 1 | 2 | 3)}
```

No `track()` call. So task-5-1.md is asking to modify `LevelNav.tsx` to add analytics, but task-4-1.md's implementation doesn't include that hook — the implementer of task-4-1.md has no indication they need to leave room for it, and the implementer of task-5-1.md must remember to add it.

Task 6.4 expects `level_started × 3` (exactly 3 events for a full journey). However, if `level_started` fires on every tab click (not just first visit to a level), a user who clicks back to Level 1 after completing it would fire a 4th `level_started` event. The "first time only" semantics described in task-5-1.md require state tracking that is not specified anywhere.

**Fix**:
Add to task-5-1.md Step 5 a specific implementation note:

"To fire `level_started` only on first visit to each level, track which levels have been started in `sessionStorage` (e.g., `sessionStorage.setItem('doppio_level_started_2', 'true')`). In `LevelNav.tsx`'s `onSelectLevel` callback passed from `Learn.tsx`, check `sessionStorage` before firing `track('level_started', { level: n })`. This prevents duplicate events from tab re-clicks."

Also update task-6-4.md to clarify: "Exactly 3 `level_started` events assumes each level is navigated to exactly once. If the user clicks between levels, this count may be higher. Verify at minimum 3 events, not exactly 3, unless first-visit deduplication is implemented."

---

### Issue 9: `/?ref=badge` badge banner — no selector defined in task-3-1.md, Phase 6 tests cannot reliably find it

**Tasks affected**: `task-6-1.md`, `task-6-5.md`, PHASES.md (Task 3.1)

**Problem**:
Task 6.1 (Step 12) and task-6-5.md (Step 6) both test that navigating to `/?ref=badge` shows a badge banner. The tests look for:

Task 6.1:
```
Verify: badge banner visible (text like "[Name] is already an AI Manager!" or similar banner)
```

Task 6.5:
```javascript
const badgeBanner = await page.evaluate(() => {
  const allText = document.body.innerText;
  return allText.includes('AI Manager') || document.querySelector('[data-testid="badge-banner"]') !== null;
});
```

PHASES.md describes the badge banner behavior in Task 3.1:
```
`/?ref=badge` route also renders Landing.tsx with a badge banner above the hero
```
And the expected text: `"🎉 [Name] is already an AI Manager! Start your journey →"`.

However:
1. Task 3.1 (Landing page) does not define a `data-testid="badge-banner"` attribute — it only describes the banner in prose
2. The banner text contains `[Name]` which implies a dynamic name, but there is no mechanism defined anywhere for where this name comes from (no user account, no URL parameter with a name)
3. The text check `allText.includes('AI Manager')` in task-6-5.md would also match the headline on the `/complete` page if the user navigated there — it's not specific to the banner

The result is a fragile test that may pass incorrectly (if the main headline contains "AI Manager") or fail to find the banner element reliably.

**Fix**:
1. Add to task-3-1.md's acceptance criteria: the badge banner element must have `data-testid="badge-banner"` attribute
2. Simplify the banner text to not include `[Name]` since there is no name data source — use a static string like `"🎉 You found a Doppio badge! Start your journey →"` or simply check for the presence of `data-testid="badge-banner"` with a consistent text
3. Update task-6-1.md Step 12 and task-6-5.md Step 6 to use `data-testid="badge-banner"` as the primary selector, falling back to text content only

---

## No-Issue Confirmations (areas that look clean)

**4.2 LevelCompleteScreen props contract**: The props `{ level: 1|2|3, onContinue: () => void, onShare: () => void }` are defined consistently in task-4-2.md and consumed correctly in task-4-1.md. The forward dependency (4.1 imports from 4.2) is acknowledged in task-4-1.md's contracts section.

**4.3 Complete.tsx resource links**: The `content.json` `resources` array with `{ title, url, description, emoji }` shape is defined in task-2-1.md and consumed correctly by `ResourceLinks.tsx` in task-4-3.md. The 5-resource minimum is consistent.

**4.4 PWA dismissed key**: The localStorage key `'doppio_install_dismissed_v1'` is defined in task-4-4.md and referenced consistently in task-6-2.md's test assertions.

**5.1 → 1.3 Supabase client import**: `src/lib/analytics.ts` imports `supabase` from `./supabase`, which is the correct path established in task-1-3.md. No import path issues.

**5.2 OG meta tag values**: The `og:title` value "Doppio — Become an AI Manager in 20 Minutes" is consistent between PHASES.md (Task 5.2), task-5-2.md, task-5-R.md, and task-6-5.md. The `og:image` URL `https://doppio.kookyos.com/og-badge.png` is consistent across all tasks.

**5.4 CSP frame-src**: The CSP `frame-src` directive covering `youtube.com`, `youtube-nocookie.com`, and `tiktok.com` is consistent between task-5-4.md's `vercel.json` definition and task-6-5.md's CSP violation check.

**6.3 Supabase unique constraint SQL**: The `INSERT` duplicate test in task-6-3.md correctly references `unique_user_level_card` constraint name, which matches the DDL name in task-1-3.md's migration SQL.

**6.4 `badge_shared` event**: Fires in both `LevelCompleteScreen.tsx` (task-4-2.md) and `Complete.tsx` (task-4-3.md). Task-6-4.md expects `≥ 1 badge_shared` (not an exact count), which correctly accommodates both trigger points.

**6.4 `pwa_installed` expected absence**: Task-6-4.md correctly acknowledges that `pwa_installed` will not fire in headless Playwright context and documents it as "expected-not-fired" rather than a test failure. This is correct per task-4-4.md's `appinstalled` event dependency.

**Phase 5 → Phase 6 deployment gate**: The Phase 5 regression (task-5-R.md) explicitly gates Phase 6: "Production URL `https://doppio.kookyos.com` passes all Phase 5 criteria — prerequisite for Phase 6 E2E testing". Task-6-1.md correctly lists "Phase 5 regression (5.R) complete" as a dependency. The deployment sequencing is sound.

**Share URL consistency**: `https://doppio.kookyos.com/?ref=badge` is used consistently across tasks 4.2, 4.3, 5.1, 6.1, and 6.5 for the badge share mechanic. No inconsistencies found.

**`track()` fire-and-forget pattern**: All tasks (4.2, 4.3, 4.4, 5.1) correctly wrap `track()` calls in dynamic imports with try/catch, ensuring analytics never throws or blocks the UI. Task-6-4.md's console error check aligns with this.
