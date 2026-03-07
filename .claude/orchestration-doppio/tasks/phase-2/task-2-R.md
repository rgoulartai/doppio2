# Task 2.R: Phase 2 Regression

## Objective

Full regression of Phase 2 — verify that `content.json` is valid, has no placeholder video IDs, all 9 videos load correctly via the embed facade, and all "Try it" buttons open the correct URLs. This task runs after Tasks 2.1, 2.2, and 2.3 are complete. It gates entry into Phase 3.

## Context

Phase 2 is a content-only phase — no UI rendering yet (except what was scaffolded in Phase 1). The regression verifies the data layer is correct and complete before Phase 3 builds components on top of it. If any content issue is found here, it is cheaper to fix now than after VideoCard and TryItButton components are built. Phase 3 cannot begin until this regression passes.

## Dependencies

- Task 2.1 — `content.json` schema and TypeScript types created
- Task 2.2 — All 9 `videoId` fields replaced with real IDs
- Task 2.3 — `tryItUrl` values verified, `openTryIt()` implemented

## Blocked By

- All three of Tasks 2.1, 2.2, and 2.3 must be complete and their individual acceptance criteria met

## Implementation Plan

This is a regression task — no new code is written. Run all verification checks. Fix any failures found. The task is complete only when all checks pass.

### Step 1: Build verification

```bash
npm run build
```

Must exit 0 with no TypeScript errors and no Vite build errors. This is the first gate — if build fails, fix before proceeding.

Common failure causes:
- `content.json` is not valid JSON (syntax error)
- `src/types/content.ts` has a type mismatch with the JSON shape
- `src/lib/tryit.ts` has a TypeScript error
- Import path for `tryit.ts` is wrong

### Step 2: TypeScript strict check

```bash
npx tsc --noEmit
```

Must exit 0. If not, fix type errors.

### Step 3: JSON validity check

Verify `content.json` is valid JSON by parsing it with Node:

Open the browser console on the running dev server and evaluate:
```javascript
fetch('/src/data/content.json')
  .then(r => r.json())
  .then(d => {
    const ids = d.levels.flatMap(l => l.cards.map(c => c.videoId));
    console.log('Video IDs:', ids);
    console.log('Has placeholders:', ids.some(id => id === 'PLACEHOLDER_VIDEO_ID'));
    console.log('Total cards:', ids.length);
    console.log('Resources:', d.resources.length);
  });
```

Or use the Playwright console to evaluate it.

Expected output:
- `Has placeholders: false`
- `Total cards: 9`
- `Resources: 5`

### Step 4: Verify all 9 video IDs are valid YouTube format

Each YouTube video ID must be exactly 11 alphanumeric characters (including hyphens and underscores). Verify via console:

```javascript
fetch('/src/data/content.json')
  .then(r => r.json())
  .then(d => {
    const cards = d.levels.flatMap(l => l.cards);
    cards.forEach(card => {
      const isYouTube = card.platform === 'youtube';
      const isValidId = /^[a-zA-Z0-9_-]{11}$/.test(card.videoId);
      const isTikTok = card.platform === 'tiktok';
      const isValidTikTok = /^\d+$/.test(card.videoId);
      console.log(
        card.id,
        card.platform,
        card.videoId,
        isYouTube ? (isValidId ? '✓' : '✗ INVALID') : (isValidTikTok ? '✓' : '✗ INVALID')
      );
    });
  });
```

All 9 IDs must pass format validation.

### Step 5: Verify all 9 YouTube videos are embeddable via oEmbed health check

For each of the 9 video IDs, make a WebFetch or WebSearch call to verify the YouTube oEmbed endpoint returns HTTP 200:

```
GET https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json
```

Expected: HTTP 200 with JSON body containing `html` field with `<iframe>`.

If any video returns HTTP 401: embedding is disabled — this video must be replaced with a working alternative. If any returns HTTP 404: video does not exist or has been removed.

Check all 9 video IDs. Document any failures. Swap out failing IDs from the `backups` array in `content.json` if available.

### Step 6: Verify copyPrompt matches tryItPrompt for all 9 cards

These two fields must be identical. Verify via console:

```javascript
fetch('/src/data/content.json')
  .then(r => r.json())
  .then(d => {
    const cards = d.levels.flatMap(l => l.cards);
    cards.forEach(card => {
      const match = card.tryItPrompt === card.copyPrompt;
      console.log(card.id, match ? '✓ match' : '✗ MISMATCH');
    });
  });
```

All 9 must print `✓ match`.

### Step 7: Verify tryItUrl fields are correctly structured

Each `tryItUrl` must open the correct AI tool for its level:

```javascript
fetch('/src/data/content.json')
  .then(r => r.json())
  .then(d => {
    const cards = d.levels.flatMap(l => l.cards);
    const expectedBases = {
      chatgpt: ['https://chatgpt.com/', 'https://chat.openai.com/'],
      claude: ['https://claude.ai/'],
      perplexity: ['https://www.perplexity.ai/'],
    };
    cards.forEach(card => {
      const bases = expectedBases[card.aiTool];
      const valid = bases.some(base => card.tryItUrl.startsWith(base));
      console.log(card.id, card.aiTool, valid ? '✓' : '✗ WRONG BASE', card.tryItUrl.substring(0, 50));
    });
  });
```

All 9 must pass.

### Step 8: Verify resource links (5 items, valid URLs)

```javascript
fetch('/src/data/content.json')
  .then(r => r.json())
  .then(d => {
    console.log('Resources count:', d.resources.length); // Must be 5
    d.resources.forEach(r => {
      const hasAll = r.title && r.url && r.description && r.emoji;
      console.log(r.title, hasAll ? '✓' : '✗ MISSING FIELD', r.url);
    });
  });
```

Must print 5 resources, all with complete fields.

### Step 9: Playwright dev server smoke test

Start: `npm run dev` (localhost:5173)

Navigate to `http://localhost:5173` with Playwright. Verify:
- [ ] App loads without JavaScript errors in browser console
- [ ] No import errors related to `content.json`
- [ ] No TypeScript runtime errors
- [ ] Console is clean (zero errors)

If Phase 3 VideoCard component exists (Task 3.2 complete), additionally verify:
- Navigate to `/learn`
- Verify 9 video facades render (thumbnails visible)
- Click one facade — verify real YouTube iframe appears
- No console errors after click

### Step 10: Verify openTryIt() function exported correctly

In the Playwright browser console:

```javascript
// Dynamic import test
import('/src/lib/tryit.ts').then(m => {
  console.log('openTryIt exists:', typeof m.openTryIt === 'function');
});
```

Must print `openTryIt exists: true`.

### Step 11: Screenshot documentation

Take screenshots for Phase 2 completion documentation:
1. `phase2-content-json` — `content.json` open in browser showing all 9 real video IDs
2. `phase2-console-verification` — Console output from Step 3 (no placeholders, 9 cards, 5 resources)
3. `phase2-oembed-checks` — Console output from Step 5 (all 9 ✓)

### Step 12: Commit and finalize branch

Once all checks pass:

```bash
git add src/data/content.json src/types/content.ts src/lib/tryit.ts src/App.tsx
git commit -m "Task 2.R: Phase 2 regression — all 9 video IDs verified, content layer complete"
```

## Files to Create

- None (regression only — no new files)

## Files to Modify

- `src/data/content.json` — Fix any issues found during regression (swap failing video IDs from backups, fix mismatched fields)
- Any other Phase 2 files with issues identified during testing

## Contracts

### Provides (for downstream tasks)

- **Phase 2 complete signal**: All 9 video IDs are real and embeddable. `content.json` is valid and complete. `openTryIt()` is functional. Phase 3 may begin.
- **Verified content data**: Tasks 3.1, 3.2, 3.3, 3.4 all depend on `content.json` being correct before building UI components.

### Consumes (from upstream tasks)

- Task 2.1: `content.json` schema and types
- Task 2.2: Real video IDs in all 9 cards
- Task 2.3: Verified `tryItUrl` values, `openTryIt()` function

## Acceptance Criteria

- [ ] `npm run build` exits 0 — no TypeScript or build errors
- [ ] `npx tsc --noEmit` exits 0
- [ ] `content.json` is valid JSON — Node parses it without error
- [ ] Zero `"PLACEHOLDER_VIDEO_ID"` strings remain in `content.json`
- [ ] All 9 video IDs pass format validation (11-char YouTube or numeric TikTok)
- [ ] All 9 YouTube oEmbed health checks return HTTP 200 (videos are embeddable)
- [ ] All 9 `copyPrompt` values match `tryItPrompt` exactly
- [ ] All 9 `tryItUrl` values start with the correct base URL for their `aiTool`
- [ ] `resources` array has exactly 5 items, all with complete fields
- [ ] `openTryIt` is exported from `src/lib/tryit.ts`
- [ ] `<Toaster />` is present in `src/App.tsx`
- [ ] Dev server smoke test: app loads without console errors
- [ ] 3 screenshots taken and saved as documentation

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npm run build` — must exit 0
- [ ] `npx tsc --noEmit` — must exit 0

### Data Validation (Browser Console / Node)

- [ ] JSON parses without error
- [ ] `Has placeholders: false` (zero PLACEHOLDER strings)
- [ ] `Total cards: 9`
- [ ] `Resources: 5`
- [ ] All 9 video ID formats valid
- [ ] All 9 `copyPrompt === tryItPrompt` (exact match)
- [ ] All 9 `tryItUrl` start with correct tool base URL

### External Service Verification (YouTube oEmbed)

For each of the 9 video IDs:
```
GET https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={videoId}&format=json
```
- [ ] l1c1 video: HTTP 200
- [ ] l1c2 video: HTTP 200
- [ ] l1c3 video: HTTP 200
- [ ] l2c1 video: HTTP 200
- [ ] l2c2 video: HTTP 200
- [ ] l2c3 video: HTTP 200
- [ ] l3c1 video: HTTP 200
- [ ] l3c2 video: HTTP 200
- [ ] l3c3 video: HTTP 200

### Browser Testing (Playwright MCP)

- Start: `npm run dev` (localhost:5173)
- Navigate to: `http://localhost:5173`
- Verify:
  - [ ] App loads (HTTP 200, no blank screen)
  - [ ] Browser console: zero errors
  - [ ] `openTryIt` function importable from `/src/lib/tryit.ts`

## Skills to Read

- `.claude/skills/doppio-content-schema/SKILL.md` — Validation notes section, YouTube health check, oEmbed check

## Research Files to Read

- None required for regression — all research was consumed in Tasks 2.1–2.3

## Git

- Branch: `phase-2/content-layer`
- Commit message prefix: `Task 2.R:`
- Example commit: `Task 2.R: Phase 2 regression — content layer verified and complete`
