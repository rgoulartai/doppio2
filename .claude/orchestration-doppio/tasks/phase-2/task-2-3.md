# Task 2.3: Verify "Try it" URL Patterns

## Objective

Confirm that all three AI tool URL deep-link patterns (`?q=` parameter) work correctly by navigating to each URL via Playwright and checking whether the prompt appears in the input field. Update `content.json` `tryItUrl` values to the working base URL if `?q=` does not prefill. Document the verified URL patterns so Task 3.3 can implement `src/lib/tryit.ts` with the correct URLs.

Note: `src/lib/tryit.ts` will be created in Task 3.3. This task only verifies URL patterns via browser.

## Context

Phase 2's "content layer" is complete only when the "Try it" CTAs are verified end-to-end. This task bridges content data (Task 2.1) and UI implementation (Task 3.3, TryItButton component). `tryit.ts` is the shared utility consumed by the TryItButton component in Phase 3. Getting this right now prevents Phase 3 rework. The URL deep-link behavior of ChatGPT, Claude, and Perplexity is undocumented/unofficial — it must be tested empirically, not assumed.

## Dependencies

- Task 2.1 — `src/data/content.json` exists with all `tryItUrl` values set (and `tryItPrompt`/`copyPrompt` fields)

## Blocked By

- Task 2.1 must be complete

## Research Findings

- From `doppio-content-schema` skill: Three URL patterns to verify:
  - ChatGPT: `https://chatgpt.com/?q=ENCODED_PROMPT`
  - Claude: `https://claude.ai/new?q=ENCODED_PROMPT`
  - Perplexity: `https://www.perplexity.ai/?q=ENCODED_PROMPT`
- From `DISCOVERY.md D18`: If `?q=` param not supported, `tryItUrl` should point to base URL only. Clipboard copy is the primary reliability mechanism — always present.
- From `DISCOVERY.md D55`: Toast notification: "Prompt copied! Paste it in [tool name]."
- From `doppio-content-schema` skill: `openTryIt()` must: (1) open URL in new tab, (2) copy `copyPrompt` to clipboard, (3) show toast. The clipboard copy is NOT optional even if `?q=` works.
- From PHASES.md tech stack: `react-hot-toast` is the toast library (already in dependencies from Task 1.1).

## Implementation Plan

### Step 1: Use Playwright to verify ChatGPT `?q=` prefill

Open Playwright MCP browser and navigate to the test URL:

```
https://chatgpt.com/?q=hello%20world
```

After navigation, wait 3 seconds for the page to load fully. Then check:
1. Is the text "hello world" visible in the chat input field?
2. Or is the text "hello world" auto-submitted as a message?
3. Or does nothing happen — empty input?

**Expected states and what to do:**

| State | Meaning | Action |
|-------|---------|--------|
| Text "hello world" appears pre-filled in input | `?q=` works | Keep all Level 1 `tryItUrl` values as-is |
| Text is auto-submitted (appears as sent message) | `?q=` works (triggers submit) | Keep URLs — still works for users |
| Input is empty, nothing pre-filled | `?q=` does not work | Update all L1 `tryItUrl` to `https://chatgpt.com/` |

**Screenshot**: Take a screenshot of the ChatGPT page after navigation. Label it `chatgpt-q-param-test`.

**Also test the alternate base URL**: If `chatgpt.com` does not work, try `https://chat.openai.com/?q=hello%20world` (the alternate base from `doppio-content-schema` skill). Use whichever works. Update `content.json` accordingly.

### Step 2: Use Playwright to verify Claude `?q=` prefill

Navigate to:
```
https://claude.ai/new?q=hello%20world
```

Wait 3–5 seconds (Claude's page loads slightly slower). Check:
1. Does "hello world" appear in the message input area?
2. Does Claude auto-submit the message?
3. Is the input empty?

Note: Claude may redirect to a login page if not authenticated. That is expected behavior — the test is only checking if the URL pattern is structurally valid (i.e., does the URL successfully pass the query parameter and attempt to prefill). If login is required, check if the `?q=` param survives the redirect by looking at the URL after the redirect.

**Alternate test**: If Playwright cannot authenticate with Claude, use WebFetch to check if `https://claude.ai/new?q=hello%20world` returns a redirect or if the `q` param appears in the redirected URL. This is sufficient to confirm the URL pattern is passed through.

**Screenshot**: Take a screenshot labeled `claude-q-param-test`.

### Step 3: Use Playwright to verify Perplexity `?q=` prefill

Navigate to:
```
https://www.perplexity.ai/?q=hello%20world
```

Wait 3–5 seconds. Check:
1. Does "hello world" appear in the search input?
2. Does Perplexity auto-execute the search?
3. Is the input empty?

Perplexity's `?q=` parameter is more reliable than ChatGPT's or Claude's based on research — it is closer to a standard search URL parameter. It may auto-trigger the search, which is acceptable behavior for users.

**Screenshot**: Take a screenshot labeled `perplexity-q-param-test`.

### Step 4: Update content.json tryItUrl values based on findings

Based on the test results from Steps 1–3, update `content.json`:

**If ChatGPT `?q=` works** (either `chatgpt.com` or `chat.openai.com`):
- No changes needed for Level 1 `tryItUrl` values
- If `chatgpt.com` works, keep as-is (already uses `chatgpt.com`)
- If only `chat.openai.com` works, update all 3 L1 cards: change `chatgpt.com` → `chat.openai.com`

**If ChatGPT `?q=` does NOT work**:
- Update all 3 Level 1 `tryItUrl` values to `https://chatgpt.com/` (no `?q=` param)
- The clipboard copy + toast notification will be the user's path to paste the prompt

**If Claude `?q=` works**:
- No changes needed for Level 2 and Level 3 Claude cards

**If Claude `?q=` does NOT work**:
- Update Level 2 (`l2c1`, `l2c2`, `l2c3`) and Level 3 (`l3c1`) `tryItUrl` to `https://claude.ai/new`

**If Perplexity `?q=` works**:
- No changes needed for Level 3 Perplexity cards (`l3c2`, `l3c3`)

**If Perplexity `?q=` does NOT work**:
- Update `l3c2` and `l3c3` `tryItUrl` to `https://www.perplexity.ai/`

### Step 5: Document URL pattern findings

After completing Steps 1–4, write up the findings in a brief note at the end of this task's output. Document:

- Which `?q=` patterns work (prefill, auto-submit, or not supported)
- Any base URL changes made to `content.json`
- The verified `tryItUrl` values for all 9 cards

Note: `src/lib/tryit.ts` will be created in Task 3.3. This task only verifies URL patterns via browser. Task 3.3 will use these documented findings to implement `openTryIt()` with the correct URLs.

### Step 6: Add Toaster to App.tsx

The `react-hot-toast` `<Toaster>` component must be rendered once in the app root for toasts to appear. Check `src/App.tsx` — if it does not already have a `<Toaster>`, add it:

```tsx
// src/App.tsx
import { Toaster } from 'react-hot-toast';

// Inside the component return, at the root level:
<>
  <Router>
    {/* ... routes ... */}
  </Router>
  <Toaster />
</>
```

Position `<Toaster />` as a sibling to the Router, not inside any route — it should persist across all routes.

If `App.tsx` already has `<Toaster>` from Task 1.1 scaffolding, no changes needed.

## Files to Create

None. Note: `src/lib/tryit.ts` will be created in Task 3.3. This task only verifies URL patterns via browser.

## Files to Modify

- `src/data/content.json` — Update `tryItUrl` values based on URL parameter test results (may be no change if all `?q=` params work)
- `src/App.tsx` — Add `<Toaster />` from `react-hot-toast` if not already present

## Contracts

### Provides (for downstream tasks)

- **Verified `tryItUrl` values** (`content.json`): All 9 cards have `tryItUrl` values that are confirmed to open the correct AI tool (with or without `?q=` prefill). Consumed by Task 3.3 and all Phase 3 components.
- **Documented URL pattern findings**: Which `?q=` params work per tool — consumed by Task 3.3 when implementing `openTryIt()`.
- **Toast infrastructure**: `<Toaster />` in `App.tsx` root — consumed by any future toast calls in Phase 3/4/5.

Note: `src/lib/tryit.ts` is NOT created in this task. It is created in Task 3.3.

### Consumes (from upstream tasks)

- Task 2.1: `src/data/content.json` with `tryItUrl`, `tryItPrompt`, `copyPrompt`, and `aiTool` fields
- Task 2.1: `src/types/content.ts` with `VideoCard` interface (used by `openTryIt` signature)
- Task 1.1: `react-hot-toast` installed in `package.json`

## Acceptance Criteria

- [ ] ChatGPT `?q=` test completed: outcome documented (works / doesn't work / auto-submits)
- [ ] Claude `?q=` test completed: outcome documented
- [ ] Perplexity `?q=` test completed: outcome documented
- [ ] `content.json` `tryItUrl` values updated to reflect actual working URL patterns
- [ ] URL pattern findings documented for consumption by Task 3.3
- [ ] `<Toaster />` present in `src/App.tsx`
- [ ] `npm run build` succeeds

Note: `src/lib/tryit.ts` will be created in Task 3.3. This task only verifies URL patterns via browser.

## Testing Protocol

### Browser Testing (Playwright MCP) — URL Verification

**Test 1: ChatGPT ?q= parameter**
- Navigate to: `https://chatgpt.com/?q=hello%20world`
- Wait 3 seconds
- Verify: Does "hello world" appear in the input field or as a submitted message?
- Screenshot: Label `chatgpt-q-test`
- Record result in the task output documentation (for Task 3.3 consumption)

**Test 2: Claude ?q= parameter**
- Navigate to: `https://claude.ai/new?q=hello%20world`
- Wait 5 seconds
- Verify: Does "hello world" appear in the input field?
- Note: Login wall is expected — check if param survives redirect
- Screenshot: Label `claude-q-test`
- Record result in the task output documentation (for Task 3.3 consumption)

**Test 3: Perplexity ?q= parameter**
- Navigate to: `https://www.perplexity.ai/?q=hello%20world`
- Wait 3 seconds
- Verify: Does "hello world" appear in search input or auto-execute as search?
- Screenshot: Label `perplexity-q-test`
- Record result in the task output documentation (for Task 3.3 consumption)

### Build/Lint/Type Checks

- [ ] `npm run build` exits 0

Note: Testing of `openTryIt()` function behavior is part of Task 3.3's testing protocol, not this task.

## Skills to Read

- `.claude/skills/doppio-content-schema/SKILL.md` — `tryItUrl` format, `copyPrompt` field purpose, clipboard fallback requirement, toast notification wording
- `.claude/skills/doppio-architecture/SKILL.md` — `src/lib/` directory purpose, import conventions

## Research Files to Read

- `.claude/orchestration-doppio/research/content-curation.md` — ChatGPT/Claude/Perplexity deep link patterns (section: "Suggested Try It Prompts per Level" and "References: Platform Notes")

## Git

- Branch: `phase-2/content-layer` (same branch as Tasks 2.1 and 2.2)
- Commit message prefix: `Task 2.3:`
- Example commit: `Task 2.3: verify try-it URL patterns and update content.json tryItUrl values`
