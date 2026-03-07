# Task 2.2: Video Curation (Find Real Video IDs)

## Objective

Replace all 9 `"PLACEHOLDER_VIDEO_ID"` strings in `src/data/content.json` with real, working, publicly embeddable video IDs from YouTube or TikTok. For each card, use WebSearch to find the best matching video, verify it is public and embeddable, and extract the video ID. Document 6 backup video IDs in a comment section appended to `content.json`. This task produces no new files — it only updates `videoId` (and `thumbnailUrl` where applicable) fields in the existing `content.json`.

## Context

Task 2.1 created `content.json` with placeholder video IDs. This task is the content research step — the agent searches the web for real videos that match each card's topic, verifies they are embeddable, and slots in the IDs. Task 2.2 unblocks Task 3.2 (VideoCard component), which cannot be tested without real video IDs. The entire video embed user experience depends on getting good videos here.

## Dependencies

- Task 2.1 — `src/data/content.json` exists with all 9 cards and `PLACEHOLDER_VIDEO_ID` values

## Blocked By

- Task 2.1 must be complete

## Research Findings

- From `content-curation.md`: Best channels per level: Beginner → Skill Leap AI, Matt Wolfe, Jeff Su, Nate Hurst; Intermediate → Anthropic Official, Riley Brown, The AI Advantage; Advanced → Anthropic Official, Perplexity AI Official, The Rundown AI.
- From `content-curation.md`: YouTube is the preferred platform. TikTok is acceptable as secondary. Instagram and X are excluded.
- From `content-curation.md`: Videos must be 60–240 seconds, show the AI tool directly, show the result on screen, use non-technical framing.
- From `doppio-content-schema` skill: YouTube ID is the 11-character string in `?v=` param. TikTok ID is the numeric string in the URL path. TikTok `thumbnailUrl` must be fetched from `https://www.tiktok.com/oembed?url=VIDEO_URL` at curation time and stored in `content.json`.
- From `video-embed-facade` skill: YouTube thumbnails auto-derive — omit `thumbnailUrl` for YouTube cards. For TikTok, `thumbnailUrl` is required (stored from oEmbed, not fetched at runtime).
- From `doppio-content-schema` skill: YouTube health check: `GET https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json` must return HTTP 200.

## Implementation Plan

### Step 1: Understand the video selection criteria

Before searching, internalize these hard requirements from `content-curation.md`:

**Must-have for every video:**
1. Public (not private, not unlisted, not members-only, not age-gated)
2. Embeddable (embedding not disabled by creator — YouTube's `embedHtml` field must be present in oEmbed response)
3. Shows the AI tool interface directly on screen (not a voiceover on slides)
4. Shows the result/output before the video ends
5. No third-party tools (no Zapier, no n8n, no API key setup required)
6. Length: 60–240 seconds (prefer 60–150 for L1/L2; up to 240 for L3)

**Disqualifiers:**
- Mentions "prompting tips" or "prompt engineering" as the hook
- AI risk / limitations / debate content
- Slides-only or stock footage (no live interface)
- Screen too small or blurry to read

### Step 2: Search for L1C1 — "Plan my groceries from a receipt photo"

Target tool: ChatGPT (GPT-4o Vision, photo upload)

Use WebSearch with these queries in order until a strong match is found:

1. `"ChatGPT" "receipt" "meal plan" photo site:youtube.com`
2. `Skill Leap AI ChatGPT photo receipt groceries youtube`
3. `"ChatGPT" "grocery receipt" photo meal plan short youtube 2024 2025`
4. `Matt Wolfe ChatGPT vision photo groceries youtube`

**What to look for**: The video must show the user uploading a photo (or pasting a receipt image) into ChatGPT and receiving a meal plan or shopping list response. The natural language input must be visible.

**How to extract the YouTube video ID**: From a URL like `https://www.youtube.com/watch?v=dQw4w9WgXcQ`, the ID is `dQw4w9WgXcQ` (11 characters). From a Shorts URL like `https://www.youtube.com/shorts/dQw4w9WgXcQ`, the ID is still `dQw4w9WgXcQ`.

**Verify embeddability**: Fetch `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json` — it must return HTTP 200 with an `html` field containing an `<iframe>`. A 401 response means embedding is disabled.

### Step 3: Search for L1C2 — "Summarize this PDF in 5 bullet points"

Target tool: ChatGPT (document/PDF upload or paste)

Search queries:
1. `"ChatGPT" "PDF" summarize "bullet points" office youtube 2024 2025`
2. `Jeff Su ChatGPT summarize document PDF youtube`
3. `Skill Leap AI ChatGPT PDF summary youtube`
4. `"ChatGPT" "summarize" document "5 bullet" OR "five bullet" youtube short`

**What to look for**: User uploads or pastes a document into ChatGPT and receives a structured summary. The summary output must be visible on screen. Prefer a realistic work document (meeting notes, report, article) over contrived examples.

### Step 4: Search for L1C3 — "Write a professional email declining a meeting"

Target tool: ChatGPT (text generation)

Search queries:
1. `"ChatGPT" "email" "decline" professional write youtube short 2024 2025`
2. `Jeff Su ChatGPT write email professional youtube`
3. `"ChatGPT" write email decline meeting friendly youtube`
4. `"I asked ChatGPT to write my email" professional decline short`

**What to look for**: User types a brief request into ChatGPT and receives a polished professional email. The typed prompt and the generated email output must both be visible. Prefer short-form (under 90 seconds) since the task is simple and quick.

### Step 5: Search for L2C1 — "Clean up my Downloads folder"

Target tool: Claude (computer use — file system)

Search queries:
1. `"Claude" "computer use" "downloads" organize files demo youtube 2024 2025`
2. `Anthropic Claude computer use downloads folder organize youtube`
3. `"Claude" "computer use" file organization desktop demo youtube`
4. `The AI Advantage Claude computer use files organize youtube`

**What to look for**: Screen recording showing Claude's computer use feature navigating the macOS or Windows file system, creating subfolders, and moving files. The moment where files move autonomously is the hook. Must show the Claude interface, not just terminal commands.

**Note on Claude computer use**: This requires Claude Pro/Team. The video just needs to demonstrate the capability — viewers don't need to have Pro to be inspired. Task 2.3 will handle the "Try it" URL; the video here is the inspiration layer.

### Step 6: Search for L2C2 — "Book a restaurant for tonight"

Target tool: Claude (computer use — browser automation)

Search queries:
1. `"Claude" "computer use" "restaurant" OR "booking" OR "reservation" demo youtube 2024 2025`
2. `Anthropic Claude computer use browser restaurant booking youtube`
3. `Riley Brown Claude computer use browser demo youtube`
4. `"Claude" browser automation booking restaurant demo youtube`

**What to look for**: Claude navigating a web browser (OpenTable, Yelp, Google Maps, or similar), finding a restaurant with availability, and completing a booking. The full end-to-end flow — search → selection → booking confirmation — is the ideal content. Browser activity should be clearly visible.

### Step 7: Search for L2C3 — "Fill out this expense form for me"

Target tool: Claude (computer use — web form filling)

Search queries:
1. `"Claude" "computer use" "form" OR "fill out" OR "web form" demo youtube 2024 2025`
2. `Anthropic Claude computer use form filling browser automation youtube`
3. `"Claude" fills out form automatically demo youtube`
4. `The AI Advantage Claude form filling demo youtube`

**What to look for**: Claude reading form fields from a web page and filling them in autonomously. The user provides data (name, email, address, etc.) and Claude completes the form without manual input. The form submission preview step is a plus.

### Step 8: Search for L3C1 — "Turn my receipts into an expense report"

Target tool: Claude (multi-step agent — multi-image to structured output)

Search queries:
1. `"Claude" "expense report" "receipts" OR "receipt photos" agent demo youtube 2025`
2. `Anthropic Claude agent expense report receipts photos youtube`
3. `"Claude" multiple images expense report table youtube`
4. `The Rundown AI Claude agent receipts expense youtube`

**What to look for**: Claude handling multiple receipt images, extracting structured data (date, vendor, amount, category), and producing a formatted table or spreadsheet. The "before" (raw photos) and "after" (formatted report) contrast is the hook. Advanced content — up to 4 minutes is acceptable here.

### Step 9: Search for L3C2 — "Research top trends and build a summary dashboard"

Target tool: Perplexity (agentic research with citations)

Search queries:
1. `"Perplexity" research "dashboard" OR "summary" agent demo youtube 2025`
2. `Perplexity AI official research trends summary youtube 2025`
3. `"Perplexity" agentic research report demo youtube 2025`
4. `The Rundown AI Perplexity research demo youtube`
5. `"Perplexity computer" OR "perplexity comet" research demo youtube 2025`

**Fallback strategy** (if Perplexity agentic demos are sparse): Use a Perplexity Spaces demo showing research synthesis and structured output, or any Perplexity video that shows: (1) a multi-source research query, (2) synthesized output with citations visible. The key is showing that AI can do research and structure findings, not just answer one question.

**Further fallback**: If no strong Perplexity video is found, this card can use Claude doing research synthesis (adjust `aiTool` from `perplexity` to `claude` and update `tryItUrl` to `https://claude.ai/new?q=...`). Update both `aiTool` and `tryItUrl` if you change the platform.

### Step 10: Search for L3C3 — "Find the best flights and compare them in a table"

Target tool: Perplexity (agentic search with structured comparison)

Search queries:
1. `"Perplexity" "flights" OR "travel" compare table agent search demo youtube 2025`
2. `Perplexity AI find flights compare demo youtube`
3. `"Perplexity" travel research agent demo youtube`
4. `The Rundown AI Perplexity research agent youtube 2025`

**Fallback strategy**: If a specific flight-comparison Perplexity demo is not available, use any Perplexity video that shows multi-source comparison output in table format. The table output visual is the key hook regardless of the specific topic. The `tryItPrompt` ("Find the best flights from NYC to Tokyo in April under $1200...") is already strong — the video just needs to demonstrate Perplexity's ability to do structured comparison research.

### Step 11: Update content.json with real video IDs

For each card, update only the `videoId` field (and `thumbnailUrl` for TikTok cards). Do NOT change any other fields — prompts, URLs, titles, descriptions are all final from Task 2.1.

For YouTube cards (all 9 are expected to be YouTube):
- Set `"videoId": "REAL_11_CHAR_ID"`
- Leave `thumbnailUrl` omitted (auto-derived)
- Optionally add `"startAt": N` if a long video needs to start at a specific second (non-standard — only add if implementing a custom `startAt` param in the embed component)

For any TikTok cards (only if a YouTube equivalent cannot be found):
- Set `"videoId": "NUMERIC_TIKTOK_ID"` (the long numeric string from the URL)
- Fetch thumbnail: `GET https://www.tiktok.com/oembed?url=https://www.tiktok.com/video/NUMERIC_ID`
- Set `"thumbnailUrl": "VALUE_FROM_OEMBED_thumbnail_url_FIELD"`
- Set `"platform": "tiktok"`

### Step 12: Document 6 backup video IDs

Append a `"backups"` array to `content.json` with 6 backup videos. These are alternatives for any card that might suffer link rot. Format:

```json
"backups": [
  {
    "forCard": "l1c1",
    "videoId": "BACKUP_ID",
    "platform": "youtube",
    "notes": "Matt Wolfe ChatGPT photo demo — alternate to primary"
  },
  {
    "forCard": "l1c3",
    "videoId": "BACKUP_ID",
    "platform": "youtube",
    "notes": "Jeff Su email rewrite — alternate to primary"
  },
  {
    "forCard": "l2c1",
    "videoId": "BACKUP_ID",
    "platform": "youtube",
    "notes": "The AI Advantage file organization — alternate to Anthropic primary"
  },
  {
    "forCard": "l2c2",
    "videoId": "BACKUP_ID",
    "platform": "youtube",
    "notes": "Varun Mayya browser automation — alternate to primary"
  },
  {
    "forCard": "l3c1",
    "videoId": "BACKUP_ID",
    "platform": "youtube",
    "notes": "The Rundown AI expense workflow — alternate to primary"
  },
  {
    "forCard": "l3c2",
    "videoId": "BACKUP_ID",
    "platform": "youtube",
    "notes": "Perplexity Spaces research demo — alternate to primary"
  }
]
```

The `backups` key at the root of `content.json` is for documentation only — it is not consumed by any component. The `DoppioContent` TypeScript type does not include it, so TypeScript will ignore it. Verify with `tsc --noEmit`.

## Files to Create

- None (this task creates no new files)

## Files to Modify

- `src/data/content.json` — Replace `"PLACEHOLDER_VIDEO_ID"` in all 9 cards with real video IDs. Append `"backups"` array at end of file.

## Contracts

### Provides (for downstream tasks)

- **Real video IDs**: All 9 `videoId` fields in `content.json` contain real, embeddable YouTube (or TikTok) IDs — consumed by Task 3.2 (VideoCard component) for actual video rendering
- **6 backup IDs**: Documented in `content.json`'s `backups` array for future link-rot recovery

### Consumes (from upstream tasks)

- Task 2.1: `src/data/content.json` with placeholder IDs and all card metadata (read-only except `videoId`/`thumbnailUrl` fields)

## Acceptance Criteria

- [ ] All 9 `videoId` fields in `content.json` are replaced — no `"PLACEHOLDER_VIDEO_ID"` strings remain
- [ ] All 9 video IDs are real YouTube IDs (11-character alphanumeric strings) or TikTok IDs (numeric strings)
- [ ] All 9 videos are publicly accessible (verified via YouTube oEmbed health check)
- [ ] All 9 videos have embedding enabled (oEmbed returns HTTP 200 with `html` field, not 401)
- [ ] L1 cards: 3 videos showing ChatGPT everyday use (receipt/groceries, PDF, email)
- [ ] L2 cards: 3 videos showing Claude computer use (file org, browser booking, form filling)
- [ ] L3 cards: 3 videos showing advanced AI agents (expense receipts, research/trends, flights/comparison)
- [ ] TikTok cards (if any): `thumbnailUrl` field populated from oEmbed API
- [ ] `"backups"` array present at root of `content.json` with exactly 6 entries
- [ ] `content.json` remains valid JSON after all edits
- [ ] `npx tsc --noEmit` still passes (backups array is ignored by TypeScript)
- [ ] `npm run build` succeeds

## Testing Protocol

### Embeddability Verification (for each video)

For every YouTube video ID found, verify embeddability by fetching:
```
https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json
```
- HTTP 200 + `html` field present = embeddable
- HTTP 401 = embedding disabled — pick a different video
- HTTP 404 = video does not exist — pick a different video

### Browser Testing (Playwright MCP)

After updating all 9 IDs and running `npm run dev`:

- Start: `npm run dev` (localhost:5173)
- Note: At this stage, the VideoCard component (Task 3.2) may not exist yet. Skip rendering tests if Phase 3 is not complete. This testing step is primarily for the Phase 2.R regression task.
- If VideoCard exists: Navigate to `/learn`, verify all 9 video facades render with real thumbnails
- If VideoCard does not exist yet: Confirm `content.json` is importable in App.tsx without console errors

### Build/Lint/Type Checks

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` exits 0
- [ ] Manually verify: `node -e "const c = require('./src/data/content.json'); const ids = c.levels.flatMap(l => l.cards.map(c => c.videoId)); const hasPlaceholder = ids.some(id => id === 'PLACEHOLDER_VIDEO_ID'); console.log('Has placeholders:', hasPlaceholder)"` — must print `Has placeholders: false`

### External Service Verification

For all 9 YouTube video IDs, run the oEmbed check:
```
GET https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json
```
All 9 must return HTTP 200. Document results.

## Skills to Read

- `.claude/skills/doppio-content-schema/SKILL.md` — JSON schema, `videoId` field format, YouTube health check, TikTok oEmbed, `thumbnailUrl` derivation rules
- `.claude/skills/video-embed-facade/SKILL.md` — Why platform field matters, TikTok thumbnail requirement, YouTube ID format

## Research Files to Read

- `.claude/orchestration-doppio/research/content-curation.md` — Full channel list, search queries per card, video selection criteria (Relevance, Length, Clarity, Tone, Embeddability), backup strategy

## Git

- Branch: `phase-2/content-layer` (same branch as Task 2.1)
- Commit message prefix: `Task 2.2:`
- Example commit: `Task 2.2: replace placeholder video IDs with real curated YouTube videos`
