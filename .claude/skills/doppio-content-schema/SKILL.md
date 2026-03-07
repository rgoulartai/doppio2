---
name: doppio-content-schema
description: content.json data schema for Doppio video cards, prompts, and resource links. Use when creating content.json, adding new cards, or building components that consume video/prompt data.
---

# Doppio Content Schema

## Why content.json

All video IDs, "Try it" prompts, card metadata, and resource links live in a single `content.json` config file at `src/data/content.json`. This design means:

- **Agents can update video IDs, prompts, and metadata without touching any React component.**
- When a video rots or a better demo is found, swap the `videoId` in `content.json` and redeploy — no component changes, no PR touching UI logic.
- All 9 cards across 3 levels, their "Try it" URLs, clipboard prompts, and the final completion screen's resource links are in one place.

This is a deliberate architecture decision (DISCOVERY.md D20, D32): content is data, not code.

---

## File Location

```
src/
  data/
    content.json      ← single source of truth for all video/prompt/resource data
```

---

## TypeScript Types

```typescript
type Platform = 'youtube' | 'tiktok';
type AITool = 'chatgpt' | 'claude' | 'perplexity';

interface VideoCard {
  id: string;                    // e.g., "l1c1", "l2c3", "l3c2"
  level: 1 | 2 | 3;
  card: 1 | 2 | 3;
  title: string;
  description: string;           // 1 sentence: what the video shows
  platform: Platform;
  videoId: string;               // YouTube video ID (e.g., "dQw4w9WgXcQ") or TikTok video ID (numeric string)
  thumbnailUrl?: string;         // Optional custom thumbnail URL; if omitted, YouTube thumbnail is auto-derived
  aiTool: AITool;                // Which AI tool the "Try it" button opens
  tryItPrompt: string;           // The natural language prompt (single sentence, action-first)
  tryItUrl: string;              // Full URL with ?q= param pre-filled (URL-encoded prompt)
  copyPrompt: string;            // Same as tryItPrompt — used as clipboard fallback text
}

interface Level {
  level: 1 | 2 | 3;
  title: string;                 // "Beginner", "Intermediate", "Advanced"
  emoji: string;                 // "🌱", "⚡", "🚀"
  subtitle: string;              // Short description of the level
  aiToolLabel: string;           // "ChatGPT", "Claude", "Claude & Perplexity"
  cards: VideoCard[];
}

interface Resource {
  title: string;
  url: string;
  description: string;           // 1 sentence about what this resource offers
  emoji: string;                 // Visual anchor for the resource link
}

interface DoppioContent {
  levels: Level[];
  resources: Resource[];         // Shown on the final completion screen (3–5 items)
}
```

---

## "Try it" URL Patterns

Three AI tools are used across the 9 cards. All use the `?q=` URL parameter to pre-fill the prompt. These URL parameters are **unofficial / undocumented** — behavior must be verified at build time.

### ChatGPT (Level 1)
```
https://chatgpt.com/?q=YOUR_PROMPT_URL_ENCODED
```
- Alternate base: `https://chat.openai.com/?q=YOUR_PROMPT_URL_ENCODED`
- Verify at build time: open the URL in a browser and confirm the prompt appears in the input field
- If `?q=` stops working, the clipboard copy fallback handles the UX automatically

### Claude (Levels 2 and 3 cards 1–2)
```
https://claude.ai/new?q=YOUR_PROMPT_URL_ENCODED
```
- Verify at build time: confirm the prompt pre-fills on `claude.ai/new`
- Note: Claude computer-use features (Level 2 tasks) require a Pro/Team plan — consider noting this in card UI

### Perplexity (Level 3 card 3)
```
https://www.perplexity.ai/?q=YOUR_PROMPT_URL_ENCODED
```
- Spaces deep-link not available as of research date — standard `?q=` works for prefilled search
- Verify at build time

### Clipboard Copy Fallback (ALWAYS REQUIRED)

Because all three URL params are unofficial, **the clipboard fallback is not optional** — it is the primary reliability mechanism. The "Try it" button must:

1. Open the `tryItUrl` in a new tab (`window.open(url, '_blank')`)
2. Simultaneously copy `copyPrompt` to the clipboard (`navigator.clipboard.writeText(prompt)`)
3. Show a toast: `"Prompt copied! Paste it in [aiToolLabel]."`

The `copyPrompt` field in each card duplicates `tryItPrompt` exactly to make this straightforward.

---

## Placeholder content.json

The following is the complete placeholder `content.json` with all 9 cards. Video IDs use placeholder strings (`PLACEHOLDER_VIDEO_ID`) — these are filled in during the content curation task. All prompts and URLs are final and ready to use.

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

---

## How React Consumes content.json

Content is loaded as a plain ES module import — no API call, no fetch, no loading state needed.

```typescript
// src/data/content.ts  (or directly in component)
import content from '../data/content.json';
import type { DoppioContent } from '../types/content';

const typedContent = content as DoppioContent;

// Access levels
const levels = typedContent.levels;               // Level[]
const level1 = levels.find(l => l.level === 1);   // Level | undefined

// Access a specific card
const card = level1?.cards[0];                    // VideoCard | undefined
const videoId = card?.videoId;                    // string
const tryItUrl = card?.tryItUrl;                  // string (full URL, ready to open)

// Access resources for completion screen
const resources = typedContent.resources;         // Resource[]
```

Vite handles JSON imports natively — no plugin or configuration required. The file is bundled at build time and served as part of the app shell, so it works offline via the Service Worker cache.

**Import pattern in components:**

```typescript
// LevelView.tsx
import content from '@/data/content.json';

const level = content.levels.find(l => l.level === props.levelNumber);
```

```typescript
// CompletionScreen.tsx
import content from '@/data/content.json';

const { resources } = content;
```

TypeScript will infer types from the JSON shape. For stricter typing, define the interfaces in `src/types/content.ts` and cast on import:

```typescript
// src/types/content.ts
export type Platform = 'youtube' | 'tiktok';
export type AITool = 'chatgpt' | 'claude' | 'perplexity';

export interface VideoCard { ... }
export interface Level { ... }
export interface Resource { ... }
export interface DoppioContent { levels: Level[]; resources: Resource[]; }
```

---

## Adding or Swapping a Video Card

To replace a video without touching any React component:

1. Find the video's YouTube ID (the `v=` value in the URL, e.g., `dQw4w9WgXcQ`).
2. Open `src/data/content.json`.
3. Find the card by its `id` (e.g., `"l1c1"`) and update `videoId`.
4. If the video platform changes (YouTube to TikTok), also update `platform`.
5. Optionally set `thumbnailUrl` to a custom thumbnail if the auto-derived one is low quality.
6. Commit and push — Vercel will redeploy automatically.

No component edits. No PR touching UI logic. This is the intended workflow for the content curation task.

---

## YouTube Thumbnail Auto-Derivation

When `thumbnailUrl` is omitted, components should derive the thumbnail from `videoId`:

```typescript
// For YouTube videos — use maxresdefault, fall back to hqdefault
const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
const fallback  = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
```

Only set `thumbnailUrl` explicitly when:
- The video is on TikTok (no auto-derivable thumbnail)
- The YouTube auto-thumbnail is a black frame (common for Shorts)
- A custom branded thumbnail is preferred

---

## Lazy-Load / Facade Pattern for Video Embeds

Per DISCOVERY.md D30, videos use a facade pattern: static thumbnail + play button shown first; iframe loads only on user click. This prevents 10 MB+ of up-front third-party resource loading.

The `platform` field drives which embed component is used:

```typescript
// VideoCard component (pseudo-code)
if (card.platform === 'youtube') {
  // Use lite-youtube-embed web component
  // <lite-youtube videoid={card.videoId} />
} else if (card.platform === 'tiktok') {
  // Use TikTok blockquote embed with deferred embed.js
  // <blockquote class="tiktok-embed" data-video-id={card.videoId} />
}
```

YouTube embed URL format when building iframe src manually:

```
https://www.youtube.com/embed/{videoId}?autoplay=1&mute=1&rel=0&modestbranding=1
```

For videos longer than 150 seconds, add `start=N` to skip intros (N = seconds):

```
https://www.youtube.com/embed/{videoId}?start=45&autoplay=1&mute=1&rel=0
```

---

## Resource Links (Completion Screen)

The `resources` array in `content.json` powers the "Keep Learning" section on the final completion screen (DISCOVERY.md D42). It is separate from the level/card structure so it can be updated independently.

Each resource has:

| Field | Type | Purpose |
|-------|------|---------|
| `title` | string | Display name of the channel or community |
| `url` | string | Full URL (YouTube channel, community, or tool homepage) |
| `description` | string | One sentence explaining what the resource offers |
| `emoji` | string | Visual anchor for the link card |

Render as a grid of link cards on the completion screen. Open each in a new tab.

---

## Validation Notes

Before shipping, verify:

- [ ] All 9 `videoId` values are real, public, embeddable YouTube (or TikTok) IDs
- [ ] All 9 `tryItUrl` values open the correct AI tool with the prompt visible in the input
- [ ] All 9 `copyPrompt` values match `tryItPrompt` exactly
- [ ] YouTube health check: `GET https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={videoId}&format=json` returns 200 (not 401/404)
- [ ] TikTok embeds (if any): test on iOS Safari specifically — embeds sometimes require a tap on iOS
- [ ] `resources` array has 3–5 entries with working URLs
