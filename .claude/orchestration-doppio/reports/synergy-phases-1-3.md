# Synergy Review: Phases 1-3

**Reviewed**: 2026-03-06
**Scope**: Tasks 1.1, 1.2, 1.3, 1.4, 1.R, 2.1, 2.2, 2.3, 2.R, 3.1, 3.2, 3.3, 3.4, 3.R
**Authority**: DISCOVERY.md overrides all

---

## Summary (9 issues found)

| # | Title | Severity | Tasks Affected |
|---|-------|----------|----------------|
| 1 | `tryit.ts` created twice with conflicting signatures | HIGH | 2.3, 3.3 |
| 2 | `auth.ts` created twice in conflicting tasks | HIGH | 1.3, 3.4 |
| 3 | `VideoCard` props type name mismatch (`VideoCard` vs `VideoCardData`) | HIGH | 2.1, 3.2, 3.3 |
| 4 | `useOnlineStatus.ts` created twice in conflicting tasks | MEDIUM | 1.2, 3.2 |
| 5 | `src/lib/analytics.ts` assumed to exist in Task 3.3 but never explicitly created | MEDIUM | 3.3, 5.1 |
| 6 | `generate-pwa-assets` script references `icon-source.png` but Task 1.2 creates it as `icon-source.png` — PHASES.md uses `pwa-source.png` | MEDIUM | 1.1, 1.2, 5.3 |
| 7 | Task 3.2 `VideoCard` excludes `TryItButton` but Task 3.3 expects them as siblings — dependency gap for the parent context (`Learn.tsx`) | MEDIUM | 3.2, 3.3, 4.1 |
| 8 | `content.json` `tryItPrompt` vs `copyPrompt` mismatch in Task 3.3's `openTryIt` implementation | LOW | 2.3, 3.3 |
| 9 | Task 4.4 hook name mismatch: PHASES.md declares `useInstallPrompt` but Task 1.2 creates `useAndroidInstallPrompt` / `usePWAInstall` | LOW | 1.2, 4.4 |

---

## Issues

### Issue 1: `tryit.ts` created twice with conflicting signatures

**Tasks affected**: `task-2-3.md`, `task-3-3.md`

**Problem**: Both Task 2.3 and Task 3.3 independently create `src/lib/tryit.ts`. They produce different implementations with incompatible return contracts:

- **Task 2.3** creates `openTryIt(card: VideoCard): Promise<void>` — returns `void`, calls `react-hot-toast` internally, applies toast logic inside the function.
- **Task 3.3** creates `openTryIt(card: VideoCardData): Promise<TryItResult>` — returns `{ opened: boolean, copied: boolean, fallbackText?: string }`, does NOT call toast internally (toast is called by the component after inspecting the result).

If Task 2.3 runs first and creates `tryit.ts` with `Promise<void>`, then Task 3.3 will overwrite it with `Promise<TryItResult>`. If the executor runs Task 3.3 first, Task 2.3 will silently overwrite the correct implementation. Either way, one task's contract breaks.

Additionally, Task 2.3 uses `card.copyPrompt` for the clipboard write; Task 3.3 uses `card.tryItPrompt`. These are declared equal in content.json, but the field choice matters for the contract.

**Fix**:

Remove the `tryit.ts` implementation step from Task 2.3 entirely. Task 2.3's purpose is to *verify URL patterns* and *document findings*. The `openTryIt()` implementation belongs only in Task 3.3 (which has the full component context and knows the exact return shape the `TryItButton` needs).

In `task-2-3.md`:
- Remove Step 5 ("Implement `src/lib/tryit.ts`") entirely from the Implementation Plan.
- Remove `src/lib/tryit.ts` from "Files to Create".
- Remove `openTryIt(card: VideoCard)` from the "Provides" Contracts section.
- Update Acceptance Criteria to remove the `tryit.ts`-specific checks.
- Keep Step 6 (`<Toaster>` in App.tsx) since that is legitimately Task 2.3's scope if it verifies the toast flow manually.

In `task-3-3.md`, no changes needed — it is the canonical creator of `tryit.ts`.

---

### Issue 2: `auth.ts` created twice in conflicting tasks

**Tasks affected**: `task-1-3.md`, `task-3-4.md`

**Problem**: Both Task 1.3 and Task 3.4 include `src/lib/auth.ts` in their "Files to Create" section, and both provide a full implementation of `getOrCreateAnonUser()` with identical logic. This creates an ambiguous ownership situation:

- Task 1.3 creates `auth.ts` as part of Supabase setup.
- Task 3.4 also creates `auth.ts` from scratch, including the same module-level cache pattern and the same `getOrCreateAnonUser` signature.

If both tasks run sequentially (as planned), Task 3.4 silently overwrites the auth.ts from Task 1.3. The implementations are structurally identical but any differences in wording, error messages, or import paths could introduce a regression. More importantly, the executor will not know Task 3.4 is partially redundant.

**Fix**:

In `task-3-4.md`:
- Move `src/lib/auth.ts` from "Files to Create" to "Files to Verify".
- Replace Step 1 ("Create `src/lib/auth.ts`") with a verification step: "Read `src/lib/auth.ts` (created in Task 1.3). Verify it exports `getOrCreateAnonUser()` with module-level cache and `getSession()` pre-check. If the file is missing or incomplete, patch it — otherwise skip creation."
- Update Acceptance Criteria: replace "auth.ts created" with "auth.ts verified to export `getOrCreateAnonUser()`".

---

### Issue 3: `VideoCard` type name mismatch — `VideoCard` vs `VideoCardData`

**Tasks affected**: `task-2-1.md`, `task-3-2.md`, `task-3-3.md`

**Problem**: Task 2.1 creates `src/types/content.ts` and exports an interface named `VideoCard`. Task 3.2's implementation code imports it as `VideoCardData`:

```ts
// Task 3.2 code (VideoCard.tsx):
import type { VideoCardData } from '../types/content';
```

But Task 2.1's `src/types/content.ts` exports:
```ts
export interface VideoCard { ... }
```

There is no `VideoCardData` export in Task 2.1's specification. Task 3.3 uses the same wrong name `VideoCardData`. This will produce TypeScript compile errors on first run.

Task 3.2 also acknowledges the discrepancy internally with this comment: "If `src/types/content.ts` uses a different field name (e.g., `tryItTool` instead of `tryItUrl`), use the name from that file." But it uses `VideoCardData` throughout its own implementation without confirming that name exists.

**Fix**:

Option A (preferred — minimal change): Update Task 3.2 and Task 3.3 to use `VideoCard` (the actual name in Task 2.1's types file):

In `task-3-2.md`:
- Replace all instances of `VideoCardData` with `VideoCard` in the implementation code blocks and the Contracts section.

In `task-3-3.md`:
- Replace all instances of `VideoCardData` with `VideoCard` in the implementation code blocks, imports, and Contracts section.

Option B: Update Task 2.1 to export the type under both names:
```ts
export interface VideoCard { ... }
export type VideoCardData = VideoCard; // alias
```
This is more defensive but adds noise to the types file.

Option A is cleaner. Apply it.

---

### Issue 4: `useOnlineStatus.ts` created twice in conflicting tasks

**Tasks affected**: `task-1-2.md`, `task-3-2.md`

**Problem**: Task 1.2 (PWA Setup) creates `src/hooks/useOnlineStatus.ts` in Step 11 and lists it in "Files to Create". Task 3.2 (VideoCard) also creates `src/hooks/useOnlineStatus.ts` in Step 2 and lists it in "Files to Create". Both implementations are identical, but the executor has no signal that this file already exists when Task 3.2 runs.

This is not a correctness issue (the implementations match), but it is an ordering trap: if a future revision changes one copy, the two will diverge silently.

**Fix**:

In `task-3-2.md`:
- Move `src/hooks/useOnlineStatus.ts` from "Files to Create" to a note: "Note: `useOnlineStatus.ts` was created in Task 1.2. Verify it exists and exports `useOnlineStatus(): boolean`. Do not recreate."
- Remove Step 2 ("Create `src/hooks/useOnlineStatus.ts`") from the Implementation Plan. Replace it with: "Step 2: Verify `src/hooks/useOnlineStatus.ts` exists (created in Task 1.2). If missing, create it using the implementation in Task 1.2."

---

### Issue 5: `src/lib/analytics.ts` assumed to exist in Task 3.3 but never explicitly created

**Tasks affected**: `task-3-3.md`, `task-5-1.md`

**Problem**: Task 3.3 (TryItButton) imports `track` from `src/lib/analytics.ts` and says "Check `src/lib/analytics.ts` (created in Task 1.1 or as a stub)." But Task 1.1 does NOT include `src/lib/analytics.ts` in its files list. Looking at the Phase 1 task files, no task in Phase 1 or Phase 2 creates this file. Task 5.1 creates the full implementation.

The comment "created in Task 1.1 or as a stub" is inaccurate — Task 1.1 only creates `.gitkeep` in `src/lib/`. The executor of Task 3.3 will find no `analytics.ts` and must create a stub from the example provided in the task, but this is not explicitly called out as a "create" action.

PHASES.md also lists `src/lib/analytics.ts` as a dependency of Task 5.1 (line: `src/lib/analytics.ts, src/App.tsx (Analytics component), Supabase analytics_events table (created in Task 1.3)`). But there is no task that owns creating the stub version.

**Fix**:

In `task-3-3.md`:
- Update Step 2 to clearly state: "Create `src/lib/analytics.ts` as a stub if it does not exist. This file will be fully implemented in Task 5.1."
- Add `src/lib/analytics.ts` to "Files to Create" with note "(stub — finalized in Task 5.1)".
- Update Contracts "Provides" to include: "`src/lib/analytics.ts` stub with `track()` export".

---

### Issue 6: PWA icon source file name inconsistency across tasks

**Tasks affected**: `task-1-1.md`, `task-1-2.md`, `task-5-3.md` (via PHASES.md)

**Problem**: Three different names appear for the PWA icon source file across tasks:

- `task-1-1.md` Step 13 script: `"generate-pwa-assets": "pwa-assets-generator --preset minimal public/icon-source.png"` — uses `icon-source.png`
- `task-1-2.md` Step 1: creates `public/icon-source.png` explicitly — consistent with 1.1
- `task-1-2.md` Step 2: runs `npm run generate-pwa-assets` referencing `public/icon-source.png` — consistent
- **PHASES.md Task 1.2 Contracts**: "Icons: All four sizes in `public/icons/`" — consistent
- **PHASES.md Task 5.3**: "Files: `public/pwa-source.png` (final brand icon)" — uses `pwa-source.png`, a **different name**

Task 5.3 expects to replace `pwa-source.png` as the source icon, but the entire Phase 1 pipeline was built around `icon-source.png`. When the executor runs Task 5.3, they will look for `public/pwa-source.png` which does not exist, and the `generate-pwa-assets` script in `package.json` still points to `icon-source.png`.

**Fix**:

In PHASES.md (Task 5.3 Files line):
- Change `public/pwa-source.png` to `public/icon-source.png`.

If the actual task-5-3.md file exists and references `pwa-source.png`, update it to `icon-source.png` to match the established pipeline. The source file name in the `generate-pwa-assets` script (`icon-source.png`) is the canonical name — all downstream references must match it.

---

### Issue 7: No task owns the `Learn.tsx` implementation that wires VideoCard + TryItButton + ProgressBar together

**Tasks affected**: `task-3-2.md`, `task-3-3.md`, `task-4-1.md`

**Problem**: Task 3.2 explicitly states: "The VideoCard does NOT render the `TryItButton` — that is the responsibility of the parent (LevelScreen / Task 4.1)." Task 3.3 also says TryItButton is placed below VideoCard by the parent.

This means neither Task 3.2 nor Task 3.3 creates the `/learn` page with a complete rendering of cards. Task 4.1 is the earliest task that will wire them together. But Task 3.2's testing protocol assumes a `/learn` page exists for testing:

```
**Start dev server**: `npm run dev` (localhost:5173)
Note: The `/learn` page (Task 4.1) is not yet built. To test VideoCard in isolation, either:
a) Temporarily render a VideoCard directly in App.tsx with a hardcoded card prop
b) Wait until Task 4.1 wraps VideoCard into the LevelScreen
```

And Task 3.R's regression criteria include:

```
2. Verify: at least one VideoCard is visible with a thumbnail (facade)
```

— which requires the `/learn` page to exist.

If Phase 3 tasks run in the defined order (3.1 → 3.2 → 3.3 → 3.4 → 3.R), the regression (3.R) will fail the VideoCard check because no task in Phase 3 builds `Learn.tsx` with the cards. Phase 4 (Task 4.1) builds Learn.tsx, but 3.R runs before Phase 4 begins.

**Fix**:

Add a minimal `Learn.tsx` wiring step to Task 3.4 (since it is the last implementation task before 3.R and it has access to all three components). After creating `useProgress`, Task 3.4 should update `src/pages/Learn.tsx` with a minimal implementation that renders all 9 cards using VideoCard + TryItButton + ProgressBar, so that Task 3.R can run its full test suite.

In `task-3-4.md`, add a Step 7 (before the Supabase verification step):

> **Step 7: Update `src/pages/Learn.tsx` with functional card rendering**
>
> The Learn page is needed for Task 3.R regression testing. Update the placeholder `src/pages/Learn.tsx` (created as a shell in Task 1.1) to render all 9 cards grouped by level using the `useProgress` hook, `VideoCard`, and `TryItButton`. Level navigation tabs are Task 4.1's responsibility; a basic vertical list of all 9 cards is sufficient for Phase 3 testing.

Add `src/pages/Learn.tsx` to Task 3.4's "Files to Modify" section.

---

### Issue 8: `openTryIt` uses `card.tryItPrompt` in Task 3.3 but `card.copyPrompt` in Task 2.3

**Tasks affected**: `task-2-3.md`, `task-3-3.md`

**Problem**: Task 2.3's `openTryIt` implementation copies `card.copyPrompt` to the clipboard. Task 3.3's `openTryIt` implementation copies `card.tryItPrompt`. These fields are declared identical in Task 2.1 ("copyPrompt must match tryItPrompt exactly"), so functionally they produce the same output. However, the inconsistency in field references makes it harder to reason about the intent.

The canonical field for the clipboard copy operation is `copyPrompt` (it was explicitly designed as the "clipboard fallback text" in Task 2.1). Using `tryItPrompt` instead is semantically correct only because they are equal, but if a future editor changes one field without the other, the bug would be silent.

This issue becomes moot if Issue 1 is fixed (removing `tryit.ts` from Task 2.3). But if Issue 1 is not fixed, address this separately.

**Fix** (apply if Issue 1 is not resolved):

In `task-3-3.md`, update the `openTryIt` implementation to use `card.copyPrompt` for the clipboard write:
```ts
await navigator.clipboard.writeText(card.copyPrompt);
```

This makes both implementations consistent and honors the field's documented purpose.

---

### Issue 9: Install prompt hook name mismatch between Task 1.2 and PHASES.md Task 4.4

**Tasks affected**: `task-1-2.md`, PHASES.md Task 4.4 section

**Problem**: Task 1.2 creates `src/hooks/usePWAInstall.ts` and exports two items:
- `useAndroidInstallPrompt()` — the hook for Android install prompt
- `shouldShowIOSInstallPrompt()` — a helper function (not a hook)

PHASES.md Task 4.4 describes:
> `useInstallPrompt()` hook: captures BeforeInstallPromptEvent, returns `{canInstall, install}`

The hook name `useInstallPrompt` does not exist in Task 1.2. Task 4.4 also expects a different return shape `{canInstall, install}` rather than `{showBanner, triggerInstall, dismiss}` from Task 1.2's `useAndroidInstallPrompt`.

If the executor of Task 4.4 looks for `useInstallPrompt` it will not find it, and the return shape mismatch means code written to Task 4.4's contract will fail at runtime.

**Fix**:

In PHASES.md Task 4.4 section, update the Contracts description to match what Task 1.2 actually provides:

Change:
> `useInstallPrompt()` hook: captures BeforeInstallPromptEvent, returns `{canInstall, install}`

To:
> `useAndroidInstallPrompt()` from `src/hooks/usePWAInstall.ts`: captures BeforeInstallPromptEvent, returns `{showBanner, triggerInstall, dismiss}`

Note: Since PHASES.md is the authority document for task-level contracts, this change should be reflected in the actual `task-4-4.md` file when it is authored. The task-4-4.md task file already exists but was not in scope for this review (it is in Phase 4). Verify when task-4-4.md is reviewed.

---

## No-Issue Confirmations (areas that look clean)

**1. Supabase schema contract is airtight.**
Task 1.3 defines the `user_progress` schema verbatim from DISCOVERY.md D26. Task 3.4's `markCardComplete` upsert uses the same column names (`user_id`, `level`, `card`, `completed_at`) with the correct unique constraint `user_id,level,card`. The data flows from `useProgress` → `markCardComplete` → `supabase.upsert` → `user_progress` table are fully consistent.

**2. `content.json` structure is consistent across all consumers.**
Task 2.1 defines the schema. Task 3.2 (VideoCard), Task 3.3 (TryItButton), Task 4.3 (resources array), and Task 2.2 (video IDs) all reference the same field names: `videoId`, `platform`, `title`, `aiTool`, `tryItUrl`, `tryItPrompt`, `copyPrompt`, `thumbnailUrl`. No consumer invents a field that does not exist in the schema (aside from the `VideoCard` vs `VideoCardData` issue documented in Issue 3).

**3. `vercel.json` CSP headers are pre-established for Phase 3 needs.**
Task 1.4 creates `vercel.json` with `frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.tiktok.com`. Task 3.2 needs these for YouTube and TikTok iframes, and Task 5.4 adds `img-src` additions. The CSP foundation is set before the components that need it.

**4. React Router route structure is consistent across all phases.**
Task 1.1 defines `/`, `/learn`, `/complete`. Task 3.1 uses `/` (Landing). Task 4.1 uses `/learn` (Learn). Task 4.3 uses `/complete` (Complete). No task invents a route not declared in DISCOVERY.md D60 or PHASES.md.

**5. `react-hot-toast` Toaster wiring is handled consistently.**
Task 2.3 (Step 6) adds `<Toaster />` to App.tsx. Task 3.3 (Step 4) also verifies/adds it. This is a duplicate add (same as the Issue 4 pattern) but since it is idempotent (adding it twice has no effect in React), it is safe and self-healing.

**6. Supabase anonymous auth singleton pattern is consistent.**
Both Task 1.3 and Task 3.4 use the exact same module-level `cachedUser` pattern with `getSession()` pre-check before `signInAnonymously()`. Even though they both create the file (Issue 2), the implementation logic is compatible. The merge strategy (additive union, cards never un-completed) is consistently applied in `syncFromSupabase`.

**7. Phase gate dependencies are correctly declared.**
Phase 2 correctly gates on Phase 1.R (not just individual tasks). Phase 3 correctly gates on Phase 2.R. Each task's "Blocked By" list is internally consistent with the dependency graph in PHASES.md. No task declares a dependency on a task from a later phase.

**8. PWA icon paths are consistent within Phase 1.**
Task 1.1 script, Task 1.2 generation, Task 1.2 `vite.config.ts` manifest, Task 1.2 `index.html` `apple-touch-icon`, and Task 1.R verification all reference `/icons/pwa-192x192.png`, `/icons/pwa-512x512.png`, `/icons/maskable-512x512.png`, `/icons/apple-touch-icon-180x180.png` consistently. The only inconsistency is in the source file name for Task 5.3 (documented as Issue 6).

**9. `ProgressBar` component contract is clean.**
Task 3.4 creates `ProgressBar` with props `{completedCards, totalCards, className}`. Task 4.1 (PHASES.md) references using it with `completedCards / 3`. The CSS class `transition-all duration-500 ease-out` is specified in both DISCOVERY.md D37 and the Task 3.4 implementation — no mismatch.

**10. Analytics event names are consistent.**
DISCOVERY.md D27 lists 7 events: `page_view`, `level_started`, `card_completed`, `try_it_clicked`, `level_completed`, `badge_shared`, `pwa_installed`. Task 3.3 fires `try_it_clicked`. Task 3.4 documents `card_completed`. Task 4.2 fires `level_completed`. Task 4.4 fires `pwa_installed`. Task 5.1 implements the full table. All event names match D27 exactly.
