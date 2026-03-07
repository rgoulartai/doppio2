# Task 2.1: Create content.json with TypeScript Types

## Objective

Create the complete content data layer for Doppio: the `src/types/content.ts` TypeScript interfaces and the `src/data/content.json` file populated with all 9 cards. Video IDs use placeholder strings; all prompts, URLs, and metadata are final and ready to use. This file is the single source of truth for all video content, "Try it" prompts, and completion screen resource links.

## Context

Phase 2 establishes the content layer before any UI components are built. Task 2.1 creates the schema and placeholder data. Task 2.2 replaces placeholder video IDs with real ones. Task 2.3 verifies the "Try it" URL patterns. All Phase 3 UI tasks (VideoCard, TryItButton, CompletionScreen) depend on this task's TypeScript types and data shape. Nothing in Phase 3 can start until this task is complete and `tsc --noEmit` passes.

## Dependencies

- Task 1.1 — Scaffolded React + Vite project with `src/` directory structure and TypeScript configured

## Blocked By

- Task 1.1 must be complete (project must exist with `src/types/`, `src/data/` directories)

## Research Findings

- From `doppio-content-schema` skill: Content lives in `src/data/content.json`. React imports it as a plain ES module — no fetch, no loading state, works offline via Service Worker cache.
- From `doppio-content-schema` skill: The `DoppioContent` TypeScript interface wraps `levels: Level[]` and `resources: Resource[]`. TypeScript infers shape from JSON; explicit casting ensures type safety.
- From `DISCOVERY.md D19`: All 9 "Try it" prompts are final — single sentence, natural language, action-first. They are reproduced verbatim in the `content.json` below.
- From `DISCOVERY.md D17`: Level 1 → ChatGPT, Level 2 → Claude, Level 3 → Claude (cards 1) + Perplexity (cards 2–3).
- From `DISCOVERY.md D18`: "Try it" uses `?q=` URL-encoded param. Clipboard copy is always present as fallback.
- From `DISCOVERY.md D20, D32`: Video IDs are config, not code. Swapping a `videoId` in `content.json` requires no component changes.
- From `content-curation.md` research: 5 resource links for the completion screen are confirmed: Skill Leap AI, Anthropic YouTube, The Rundown AI, Perplexity AI YouTube, Matt Wolfe.

## Implementation Plan

### Step 1: Create `src/types/content.ts`

Create the file at `src/types/content.ts`. Export all four interfaces. Use union literal types for `Platform` and `AITool` — do not use `string` as these are enumerated values that components need to switch on.

```typescript
// src/types/content.ts

export type Platform = 'youtube' | 'tiktok';
export type AITool = 'chatgpt' | 'claude' | 'perplexity';

export interface VideoCard {
  id: string;           // e.g., "l1c1", "l2c3", "l3c2"
  level: 1 | 2 | 3;
  card: 1 | 2 | 3;
  title: string;
  description: string;          // 1 sentence: what the video shows
  platform: Platform;
  videoId: string;              // YouTube video ID (11 chars) or TikTok numeric string
  thumbnailUrl?: string;        // Optional; if omitted, YouTube thumbnail auto-derived
  aiTool: AITool;               // Which AI tool the "Try it" button opens
  tryItPrompt: string;          // Natural language prompt (single sentence, action-first)
  tryItUrl: string;             // Full URL with ?q= pre-filled (URL-encoded)
  copyPrompt: string;           // Same as tryItPrompt — clipboard fallback text
}

export interface Level {
  level: 1 | 2 | 3;
  title: string;                // "Beginner", "Intermediate", "Advanced"
  emoji: string;                // "🌱", "⚡", "🚀"
  subtitle: string;             // Short description of the level
  aiToolLabel: string;          // "ChatGPT", "Claude", "Claude & Perplexity"
  cards: VideoCard[];
}

export interface Resource {
  title: string;
  url: string;
  description: string;          // 1 sentence about what this resource offers
  emoji: string;                // Visual anchor for the resource link
}

export interface DoppioContent {
  levels: Level[];
  resources: Resource[];        // Shown on the final completion screen (3–5 items)
}
```

### Step 2: Create `src/data/content.json`

Create the file at `src/data/content.json` using the exact JSON below. All 9 cards have placeholder `videoId` values that Task 2.2 will replace. All prompts, URLs, and metadata are final.

**Important rules for this JSON:**
- `videoId` must be the string `"PLACEHOLDER_VIDEO_ID"` for all 9 cards (Task 2.2 replaces these)
- `thumbnailUrl` is omitted on all YouTube cards (auto-derived from `videoId` by components)
- `copyPrompt` must match `tryItPrompt` exactly — character for character
- The `tryItUrl` values use `chatgpt.com` (not `chat.openai.com`) as the primary base per skill guidance
- All JSON must be valid — no trailing commas, no comments

```json
{
  "levels": [
    {
      "level": 1,
      "title": "Beginner",
      "emoji": "🌱",
      "subtitle": "ChatGPT beyond search — everyday tasks with natural language",
      "aiToolLabel": "ChatGPT",
      "cards": [
        {
          "id": "l1c1",
          "level": 1,
          "card": 1,
          "title": "Plan my groceries from a receipt photo",
          "description": "Watch someone upload a grocery receipt photo and get a full 3-day meal plan with a shopping list for missing ingredients.",
          "platform": "youtube",
          "videoId": "PLACEHOLDER_VIDEO_ID",
          "aiTool": "chatgpt",
          "tryItPrompt": "I have a photo of my grocery receipt. Analyze what I bought, suggest a 3-day meal plan using those ingredients, and list what extra I might need.",
          "tryItUrl": "https://chatgpt.com/?q=I+have+a+photo+of+my+grocery+receipt.+Analyze+what+I+bought%2C+suggest+a+3-day+meal+plan+using+those+ingredients%2C+and+list+what+extra+I+might+need.",
          "copyPrompt": "I have a photo of my grocery receipt. Analyze what I bought, suggest a 3-day meal plan using those ingredients, and list what extra I might need."
        },
        {
          "id": "l1c2",
          "level": 1,
          "card": 2,
          "title": "Summarize this PDF in 5 bullet points",
          "description": "See ChatGPT read a 20-page work document and return exactly 5 bullet points covering everything that matters.",
          "platform": "youtube",
          "videoId": "PLACEHOLDER_VIDEO_ID",
          "aiTool": "chatgpt",
          "tryItPrompt": "I'm going to paste a document. Please summarize it into exactly 5 bullet points covering the key takeaways.",
          "tryItUrl": "https://chatgpt.com/?q=I%27m+going+to+paste+a+document.+Please+summarize+it+into+exactly+5+bullet+points+covering+the+key+takeaways.",
          "copyPrompt": "I'm going to paste a document. Please summarize it into exactly 5 bullet points covering the key takeaways."
        },
        {
          "id": "l1c3",
          "level": 1,
          "card": 3,
          "title": "Write a professional email declining a meeting",
          "description": "Watch ChatGPT draft a polished, friendly decline email in under 10 seconds from a simple one-line request.",
          "platform": "youtube",
          "videoId": "PLACEHOLDER_VIDEO_ID",
          "aiTool": "chatgpt",
          "tryItPrompt": "Write a professional but friendly email declining a meeting invite. Make it respectful and suggest an alternative time or approach.",
          "tryItUrl": "https://chatgpt.com/?q=Write+a+professional+but+friendly+email+declining+a+meeting+invite.+Make+it+respectful+and+suggest+an+alternative+time+or+approach.",
          "copyPrompt": "Write a professional but friendly email declining a meeting invite. Make it respectful and suggest an alternative time or approach."
        }
      ]
    },
    {
      "level": 2,
      "title": "Intermediate",
      "emoji": "⚡",
      "subtitle": "Simple AI delegation — Claude handles file and browser tasks for you",
      "aiToolLabel": "Claude",
      "cards": [
        {
          "id": "l2c1",
          "level": 2,
          "card": 1,
          "title": "Clean up my Downloads folder",
          "description": "Watch Claude organize a chaotic Downloads folder by file type, create subfolders, and move everything into place — no manual sorting.",
          "platform": "youtube",
          "videoId": "PLACEHOLDER_VIDEO_ID",
          "aiTool": "claude",
          "tryItPrompt": "Please organize my Downloads folder by grouping files by type, creating subfolders, and moving files into the right place. Ask before deleting anything.",
          "tryItUrl": "https://claude.ai/new?q=Please+organize+my+Downloads+folder+by+grouping+files+by+type%2C+creating+subfolders%2C+and+moving+files+into+the+right+place.+Ask+before+deleting+anything.",
          "copyPrompt": "Please organize my Downloads folder by grouping files by type, creating subfolders, and moving files into the right place. Ask before deleting anything."
        },
        {
          "id": "l2c2",
          "level": 2,
          "card": 2,
          "title": "Book a restaurant for tonight",
          "description": "See Claude browse the web, find an Italian restaurant with tonight availability, and complete the booking — start to finish.",
          "platform": "youtube",
          "videoId": "PLACEHOLDER_VIDEO_ID",
          "aiTool": "claude",
          "tryItPrompt": "Find a well-reviewed Italian restaurant near me that has availability tonight for 2 people at 7:30 PM and book it. Show me the options before confirming.",
          "tryItUrl": "https://claude.ai/new?q=Find+a+well-reviewed+Italian+restaurant+near+me+that+has+availability+tonight+for+2+people+at+7%3A30+PM+and+book+it.+Show+me+the+options+before+confirming.",
          "copyPrompt": "Find a well-reviewed Italian restaurant near me that has availability tonight for 2 people at 7:30 PM and book it. Show me the options before confirming."
        },
        {
          "id": "l2c3",
          "level": 2,
          "card": 3,
          "title": "Fill out this expense form for me",
          "description": "Watch Claude open a web form, read the fields, and fill in all the details from shared receipts — one command, whole form done.",
          "platform": "youtube",
          "videoId": "PLACEHOLDER_VIDEO_ID",
          "aiTool": "claude",
          "tryItPrompt": "I need to fill out a form online. Here's the URL and my information. Please open the form, fill in my details, and show me a preview before submitting.",
          "tryItUrl": "https://claude.ai/new?q=I+need+to+fill+out+a+form+online.+Here%27s+the+URL+and+my+information.+Please+open+the+form%2C+fill+in+my+details%2C+and+show+me+a+preview+before+submitting.",
          "copyPrompt": "I need to fill out a form online. Here's the URL and my information. Please open the form, fill in my details, and show me a preview before submitting."
        }
      ]
    },
    {
      "level": 3,
      "title": "Advanced",
      "emoji": "🚀",
      "subtitle": "Full AI agents — multi-step workflows from raw inputs to polished outputs",
      "aiToolLabel": "Claude & Perplexity",
      "cards": [
        {
          "id": "l3c1",
          "level": 3,
          "card": 1,
          "title": "Turn my receipts into an expense report",
          "description": "Watch Claude read a pile of receipt photos, extract dates, vendors, and amounts, then produce a formatted expense report ready to submit.",
          "platform": "youtube",
          "videoId": "PLACEHOLDER_VIDEO_ID",
          "aiTool": "claude",
          "tryItPrompt": "I have photos of work trip receipts. Please extract the date, vendor, amount, and category from each one and create a formatted expense report I can submit.",
          "tryItUrl": "https://claude.ai/new?q=I+have+photos+of+work+trip+receipts.+Please+extract+the+date%2C+vendor%2C+amount%2C+and+category+from+each+one+and+create+a+formatted+expense+report+I+can+submit.",
          "copyPrompt": "I have photos of work trip receipts. Please extract the date, vendor, amount, and category from each one and create a formatted expense report I can submit."
        },
        {
          "id": "l3c2",
          "level": 3,
          "card": 2,
          "title": "Research the top trends and build a summary dashboard",
          "description": "See Perplexity pull live sources, synthesize the top 3 remote-work trends, and produce a one-page summary dashboard with citations.",
          "platform": "youtube",
          "videoId": "PLACEHOLDER_VIDEO_ID",
          "aiTool": "perplexity",
          "tryItPrompt": "Research the top 3 trends in remote work for 2025, find what experts and employees are saying, and build me a one-page summary dashboard with sources.",
          "tryItUrl": "https://www.perplexity.ai/?q=Research+the+top+3+trends+in+remote+work+for+2025%2C+find+what+experts+and+employees+are+saying%2C+and+build+me+a+one-page+summary+with+sources.",
          "copyPrompt": "Research the top 3 trends in remote work for 2025, find what experts and employees are saying, and build me a one-page summary dashboard with sources."
        },
        {
          "id": "l3c3",
          "level": 3,
          "card": 3,
          "title": "Find the best flights and compare them in a table",
          "description": "Watch an AI agent search live flight data across multiple routes and return a clean comparison table — price, duration, layovers — in one shot.",
          "platform": "youtube",
          "videoId": "PLACEHOLDER_VIDEO_ID",
          "aiTool": "perplexity",
          "tryItPrompt": "Find the best flights from NYC to Tokyo in April under $1200 and compare them in a table showing price, total duration, number of stops, and airline.",
          "tryItUrl": "https://www.perplexity.ai/?q=Find+the+best+flights+from+NYC+to+Tokyo+in+April+under+%241200+and+compare+them+in+a+table+showing+price%2C+total+duration%2C+stops%2C+and+airline.",
          "copyPrompt": "Find the best flights from NYC to Tokyo in April under $1200 and compare them in a table showing price, total duration, number of stops, and airline."
        }
      ]
    }
  ],
  "resources": [
    {
      "title": "Skill Leap AI",
      "url": "https://www.youtube.com/@SkillLeapAI",
      "description": "Practical AI tutorials for non-technical office workers — new demos every week.",
      "emoji": "🎓"
    },
    {
      "title": "Anthropic on YouTube",
      "url": "https://www.youtube.com/@anthropic-ai",
      "description": "Official Claude demos including computer use and multi-step agent workflows.",
      "emoji": "🤖"
    },
    {
      "title": "The Rundown AI",
      "url": "https://www.youtube.com/@TheRundownAI",
      "description": "Weekly coverage of the best new AI tools with hands-on workflow demos.",
      "emoji": "📰"
    },
    {
      "title": "Perplexity AI on YouTube",
      "url": "https://www.youtube.com/@PerplexityAI",
      "description": "Official Perplexity tutorials showing research synthesis and agentic workflows.",
      "emoji": "🔍"
    },
    {
      "title": "Matt Wolfe",
      "url": "https://www.youtube.com/@mreflow",
      "description": "The go-to channel for discovering new AI tools explained for everyday users.",
      "emoji": "🌐"
    }
  ]
}
```

### Step 3: Verify TypeScript types work with the JSON import

After writing both files, verify the import pattern works. The key cast pattern is:

```typescript
// Used in any component that imports content
import contentRaw from '../data/content.json';
import type { DoppioContent } from '../types/content';

const content = contentRaw as DoppioContent;
```

Vite handles JSON imports natively. No plugin configuration is needed. The file is bundled at build time.

Also add a `resolveJsonModule` confirmation — check that `tsconfig.json` has `"resolveJsonModule": true`. If the scaffolded project does not have it, add it under `compilerOptions`.

### Step 4: Add type declaration for lite-youtube-embed (if not present)

The `video-embed-facade` skill requires a custom element declaration. Check if `src/vite-env.d.ts` exists. If it does, add the JSX namespace declaration there. If it does not, create `src/types/custom-elements.d.ts`:

```typescript
// src/types/custom-elements.d.ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lite-youtube': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          videoid: string;
          playlabel?: string;
          params?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
```

This declaration is needed by Task 3.2 (VideoCard component). Create it now so `tsc --noEmit` passes without warnings when Task 3.2 adds the `<lite-youtube>` element.

### Step 5: Run TypeScript check

```bash
cd /path/to/project && npx tsc --noEmit
```

This must pass with zero errors. Fix any type errors before marking the task complete.

## Files to Create

- `src/types/content.ts` — TypeScript interfaces: `VideoCard`, `Level`, `Resource`, `DoppioContent`
- `src/data/content.json` — Complete content data with all 9 cards and 5 resource links
- `src/types/custom-elements.d.ts` — JSX namespace for `<lite-youtube>` custom element (if not already in `vite-env.d.ts`)

## Files to Modify

- `tsconfig.json` — Verify `"resolveJsonModule": true` is present under `compilerOptions`. Add it if missing.

## Contracts

### Provides (for downstream tasks)

- **TypeScript types** (`src/types/content.ts`): `VideoCard`, `Level`, `Resource`, `DoppioContent` — consumed by all Phase 3+ components
- **Content data** (`src/data/content.json`): All 9 cards with placeholder `videoId`, final prompts, URLs, descriptions — consumed by Task 2.2 (replace IDs), Task 2.3 (verify URLs), and all Phase 3 components
- **Import pattern**: `import content from '@/data/content.json'` with cast to `DoppioContent`
- **Resource links**: 5 items in `resources` array — consumed by Task 4.3 (CompletionScreen)

### Consumes (from upstream tasks)

- Task 1.1: `src/` directory structure, `tsconfig.json`, Vite project skeleton

## Acceptance Criteria

- [ ] `src/types/content.ts` exports `Platform`, `AITool`, `VideoCard`, `Level`, `Resource`, `DoppioContent`
- [ ] `src/data/content.json` is valid JSON (no parse errors)
- [ ] All 9 cards present: 3 in level 1, 3 in level 2, 3 in level 3
- [ ] Level 1 cards: `aiTool` = `"chatgpt"`, `tryItUrl` starts with `https://chatgpt.com/?q=`
- [ ] Level 2 cards: `aiTool` = `"claude"`, `tryItUrl` starts with `https://claude.ai/new?q=`
- [ ] Level 3 card 1 (`l3c1`): `aiTool` = `"claude"`, `tryItUrl` starts with `https://claude.ai/new?q=`
- [ ] Level 3 cards 2–3 (`l3c2`, `l3c3`): `aiTool` = `"perplexity"`, `tryItUrl` starts with `https://www.perplexity.ai/?q=`
- [ ] All 9 cards have `videoId` = `"PLACEHOLDER_VIDEO_ID"`
- [ ] All 9 `copyPrompt` values match `tryItPrompt` exactly
- [ ] `resources` array has exactly 5 items, each with `title`, `url`, `description`, `emoji`
- [ ] `tsconfig.json` has `"resolveJsonModule": true`
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` succeeds

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npx tsc --noEmit` — must exit 0 with zero errors
- [ ] `npm run build` — must exit 0 with no TypeScript or Vite errors

### Manual Verification

Open `src/data/content.json` and verify:
- [ ] JSON is valid (paste into `jsonlint.com` or run `node -e "require('./src/data/content.json')"`)
- [ ] 9 cards present across 3 levels
- [ ] Each card has: `id`, `level`, `card`, `title`, `description`, `platform`, `videoId`, `aiTool`, `tryItPrompt`, `tryItUrl`, `copyPrompt`
- [ ] No card is missing `copyPrompt`
- [ ] `l3c2` and `l3c3` use `aiTool: "perplexity"` and Perplexity URLs

### Browser Testing (Playwright MCP)

- Start: `npm run dev` (localhost:5173)
- Navigate to: `http://localhost:5173`
- Verify: App loads without console errors related to content.json import or TypeScript compilation
- Verify: No `Cannot find module '../data/content.json'` errors in the console
- Note: At this stage, `content.json` is imported but not yet rendered — just verify the import does not break the app

### External Service Verification

- None required for this task (no external APIs used)

## Skills to Read

- `.claude/skills/doppio-content-schema/SKILL.md` — Full schema definition, import pattern, TypeScript cast pattern, resource links structure, YouTube thumbnail auto-derivation
- `.claude/skills/doppio-architecture/SKILL.md` — File structure conventions, `src/types/` and `src/data/` directory purpose

## Research Files to Read

- `.claude/orchestration-doppio/research/content-curation.md` — Confirms the 9 card topics, Try-it prompt wording, and 5 resource link selections

## Git

- Branch: `phase-2/content-layer`
- Commit message prefix: `Task 2.1:`
- Example commit: `Task 2.1: add content.json with TypeScript types and 9 placeholder cards`
