# Content Curation Research

**Task**: Content Curation Research — Doppio MVP
**Project**: Doppio PWA
**Date**: 2026-03-06
**Status**: complete

---

## Summary

Doppio needs 9 primary video embeds (3 per level) plus 6 backup videos across three progression levels: Beginner (ChatGPT everyday use), Intermediate (computer use / file/OS delegation), and Advanced (full AI agents — Claude Cowork, Perplexity Computer). This research maps the best creator channels, specific search queries for finding ideal videos, video selection criteria, platform embedding mechanics, suggested "Try It" prompts, and a fallback strategy. All video slots are specified with primary recommendations and alternates drawn from known high-quality sources as of the research date.

Key findings:
- YouTube is the safest embed platform (IFrame API, no authentication required, universally supported).
- TikTok public embeds work but require oEmbed and have reliability concerns on iOS Safari.
- Instagram Reels public embeds have been restricted and are now unreliable without a Meta developer token.
- X (Twitter) oEmbed is functional but video autoplay is blocked and the embed footprint is large.
- The best beginner-level channels are Matt Wolfe, Skill Leap AI, Nate Hurst, and Jeff Su.
- The best intermediate/advanced channels are Anthropic's own YouTube, Riley Brown (Claude demos), and Varun Mayya.
- Perplexity Computer demos are sparse pre-2025; the strongest sources are the Perplexity AI official channel and early adopter tech journalists.
- "Try It" prompts must be single-sentence natural language, action-first, concrete nouns — never meta-instructions about prompting.

---

## Beginner Level (ChatGPT everyday use)

### Level Definition
Users who treat ChatGPT as a search engine. The goal is to show it as a personal assistant for concrete daily tasks: analyzing photos, drafting emails, planning meals, summarizing documents. The "Try It" CTA must open ChatGPT (chat.openai.com) with a prefilled prompt. Zero technical vocabulary in demos or prompts.

### Ideal Video Characteristics for Beginner
- Length: 60–180 seconds (Shorts / TikTok / Reels format preferred; YouTube under 3 min)
- Subject: Real person doing a real task with no explanation of "prompting"
- Tone: Casual, relatable — "I tried this" not "here's a tutorial"
- Visual: Shows the ChatGPT interface directly, not a voiceover on slides
- Outcome: Tangible result visible on screen (meal plan, summary, draft email)
- Narrator: Non-technical framing ("I just typed…" not "the model ingested…")

### Recommended Creators / Channels (Beginner)

**1. Matt Wolfe — @MattWolfe (YouTube)**
- URL base: `https://www.youtube.com/@mreflow`
- Focus: Practical AI tools for non-technical users; frequent ChatGPT walkthroughs
- Best video type: "ChatGPT does my [task] for me" — receipt reading, meal planning, email drafting
- Typical length: 5–12 min (clip to 2–3 min segment or use Shorts if available)
- Why: Largest AI-for-everyone audience; non-technical framing; high production quality

**2. Skill Leap AI — @SkillLeapAI (YouTube)**
- URL base: `https://www.youtube.com/@SkillLeapAI`
- Focus: AI tools tutorials for office workers, specifically non-coders
- Best video type: "ChatGPT with photo/file" demos — receipt analysis, PDF summarization
- Typical length: 3–8 min
- Why: Excellent at showing natural language interaction without technical context

**3. Nate Hurst — @NateHurst (YouTube / TikTok)**
- Focus: "AI in real life" — grocery planning, budget help, meal prep from fridge photo
- Best video type: iPhone + ChatGPT mobile demos (shows the exact user journey)
- Typical length: 60–90 sec (Shorts)
- Why: Closest to Doppio's exact use case; mobile-first; shows ChatGPT Vision/photo upload

**4. Jeff Su — @JeffSu (YouTube)**
- URL base: `https://www.youtube.com/@JeffSu`
- Focus: Productivity for office professionals; email drafting, document summaries
- Best video type: Email writing, meeting summarization, work task delegation to ChatGPT
- Typical length: 4–8 min
- Why: Non-technical office worker audience; strong visual clarity

**5. TikTok creators (beginner)**
- @aiwithalex — short-form ChatGPT demos for everyday use
- @howtoai — recipe/meal planning, photo-based tasks
- @lifehacker (TikTok) — aggregated "AI productivity" content
- Search query: `#ChatGPT #fyp receipt meal plan` or `#ChatGPT everyday life 2025`

### Specific Search Queries to Find Beginner Videos

**YouTube:**
```
"ChatGPT" "receipt" OR "photo" "meal plan" shorts
"ChatGPT" "downloads folder" OR "files" organize everyday
"ChatGPT without prompting" tutorial beginners 2025
"I asked ChatGPT to" groceries OR meal plan OR schedule
site:youtube.com "chatgpt" "no experience" everyday tasks
```

**TikTok:**
```
ChatGPT groceries receipt plan
ChatGPT everyday life hack
ChatGPT photo meal 2025
#ChatGPTtips #aihacks
```

**X (Twitter):**
```
(ChatGPT receipt OR "meal plan" OR groceries) (video OR demo) filter:videos
```

### Proposed Beginner Card Slots (Primary Recommendations)

**Beginner Card 1 — "Plan my groceries from a receipt photo"**
- Platform: YouTube
- Target channel: Skill Leap AI or Nate Hurst
- Search query: `"ChatGPT" "photo" "groceries" OR "receipt" meal plan`
- Fallback: Matt Wolfe's ChatGPT Vision demo
- Notes: Must show the photo upload step, not just text entry

**Beginner Card 2 — "Summarize this 20-page PDF into 5 bullet points"**
- Platform: YouTube
- Target channel: Jeff Su or Skill Leap AI
- Search query: `"ChatGPT" "PDF" summarize bullet points office worker 2025`
- Fallback: Any Shorts showing ChatGPT with a document
- Notes: Shows a universally relatable work scenario — meeting notes, reports

**Beginner Card 3 — "Write a professional email declining a meeting"**
- Platform: YouTube or TikTok
- Target channel: Jeff Su, or any TikTok with `#EmailChatGPT`
- Search query: `"ChatGPT" "email" write decline professional 2025 shorts`
- Fallback: Matt Wolfe email drafting segment
- Notes: Very short interaction — ideal for a 60-sec format

---

## Intermediate Level (Computer use / delegation)

### Level Definition
Users who are ready to let AI control or navigate their computer — specifically file organization, browser automation, OS-level tasks. The "Try It" CTA should open Claude (claude.ai) with a prefilled computer-use prompt. This level bridges everyday ChatGPT use and full agentic workflows.

### Ideal Video Characteristics for Intermediate
- Length: 90–240 seconds
- Subject: AI agent doing something on a real computer screen (screen recording)
- Tone: "Watch what it does" — results-oriented, not tutorial
- Visual: Clear screen capture showing the OS, files, or browser being manipulated
- Outcome: Measurable result (folder cleaned, files renamed, downloads sorted)
- Narrator: Light narration or captions; no deep technical explanation

### Recommended Creators / Channels (Intermediate)

**1. Riley Brown — @rileybrown.ai (YouTube / X)**
- Focus: Claude computer use demos; Anthropic-adjacent; early adopter
- Best video type: Screen recordings of Claude navigating desktop tasks
- Typical length: 2–5 min
- Why: High signal-to-noise ratio; shows real Claude computer use without hype

**2. Anthropic Official — @Anthropic (YouTube)**
- URL base: `https://www.youtube.com/@anthropic-ai`
- Focus: Official Claude demos including computer use
- Best video type: "Claude computer use" official demo videos
- Typical length: 2–5 min
- Why: Authoritative source; high production quality; directly shows the interface

**3. Varun Mayya — @VarunMayya (YouTube)**
- Focus: Agentic AI workflows; computer use as productivity multiplier
- Best video type: "AI does my [admin task]" — downloads, file organization
- Typical length: 3–7 min
- Why: Non-technical framing; relatable office tasks; good screen clarity

**4. Lior Neu-ner / Lior's AI tools — various platforms**
- Focus: Claude and computer-use explorations; agentic task demos
- Why: Good beginner-intermediate bridge content

**5. The AI Advantage — @theAIadvantage (YouTube)**
- Focus: Practical computer-use and automation without coding
- Best video type: Before/after task demos using AI agents
- Why: Strong clarity for non-technical audiences

### Specific Search Queries to Find Intermediate Videos

**YouTube:**
```
"Claude" "computer use" "downloads" OR "files" organize demo 2024 2025
"Claude" "computer use" file system task screen recording
"AI" "cleans my downloads" OR "organizes files" automatically
"computer use" "anthropic" claude demo non-technical
site:youtube.com claude "computer use" "downloads folder" OR "desktop"
```

**X (Twitter):**
```
(claude "computer use") (demo OR video) filter:videos 2025
(@anthropic) "computer use" demo filter:videos
```

### Proposed Intermediate Card Slots (Primary Recommendations)

**Intermediate Card 1 — "Clean my Downloads folder"**
- Platform: YouTube
- Target channel: Anthropic Official or Riley Brown
- Search query: `claude "computer use" "downloads" organize demo`
- Fallback: The AI Advantage — any computer-use file organization video
- Notes: Show Claude moving/renaming files; the "magic moment" is seeing it actually execute

**Intermediate Card 2 — "Book a restaurant for tonight from my calendar"**
- Platform: YouTube or X
- Target channel: Riley Brown, Varun Mayya, or Anthropic
- Search query: `claude "computer use" browser reservation booking demo`
- Fallback: Any browser-automation demo showing Claude navigate a web page
- Notes: Browser use is more dramatic; shows full end-to-end agency

**Intermediate Card 3 — "Fill out this form for me"**
- Platform: YouTube
- Target channel: The AI Advantage or Anthropic Official
- Search query: `claude "computer use" "fill out" form browser automation 2025`
- Fallback: Any screen-recorded Claude completing a web form
- Notes: Universally relatable task; short and visually clear

---

## Advanced Level (Agents: Claude Cowork, Perplexity Computer)

### Level Definition
Full autonomous agent workflows. Claude Cowork handles multi-step business automation (expense reports from receipts). Perplexity Computer handles research-to-output pipelines (research a topic, generate a dashboard or report). The "Try It" CTA opens either Claude (claude.ai) with a Cowork-style prompt or Perplexity (perplexity.ai) with an Agentic mode prompt.

### Ideal Video Characteristics for Advanced
- Length: 2–5 minutes (needs to show the full workflow loop)
- Subject: Multi-step autonomous task from input to polished output
- Tone: Awe-inspiring — "I can't believe it did all that"
- Visual: Clear before (raw inputs) and after (polished output) contrast
- Outcome: Real artifact — a spreadsheet, a report, a formatted document
- Narrator: Can be slightly more technical, but result must be self-explanatory

### Recommended Creators / Channels (Advanced)

**1. Anthropic Official — @Anthropic (YouTube)**
- Focus: Claude agent workflows; multi-step automations
- Best video type: "Claude Cowork" or extended computer-use workflows
- Typical length: 3–8 min
- Why: Highest quality Claude demos; directly relevant to the CTA tools

**2. Perplexity AI Official — @PerplexityAI (YouTube / X)**
- URL base: `https://www.youtube.com/@PerplexityAI` (verify handle)
- Focus: Official Perplexity Computer / Comet / Spaces demos
- Best video type: "Perplexity does a research task" + outputs dashboard/report
- Typical length: 2–5 min
- Why: Official source for Perplexity agentic features

**3. The Rundown AI — @TheRundownAI (YouTube)**
- Focus: Weekly AI news with deep-dive demos; covers new agent launches first
- Best video type: "X AI tool changed how I do [task]" featuring new agent tools
- Why: Strong production quality; demo-forward; bridges news and utility

**4. Lenny Rachitsky / Lenny's Podcast (YouTube)**
- Focus: Practical AI for knowledge workers at product/business level
- Best video type: Demos of AI doing research synthesis and business reports
- Why: Credible source for professional knowledge workers (Doppio's target)

**5. Logan Kilpatrick — @LoganKilpatrick (X / YouTube)**
- Focus: Applied AI workflows; agent use cases; frequently demos new features
- Why: High technical credibility but accessible delivery

**6. Ethan Mollick (@emollick on X)**
- Focus: AI in professional knowledge work; research synthesis, reports
- Why: Academic credibility; non-technical framing; widely shared demos

### Specific Search Queries to Find Advanced Videos

**YouTube:**
```
"Claude" "expense report" OR "receipts" agent automation demo 2025
"Claude cowork" demo workflow "expense" OR "receipts" 2025
"Perplexity" "computer" OR "agent" research dashboard demo 2025
"perplexity comet" OR "perplexity computer" demo tutorial 2025
"AI agent" "receipts to" report OR spreadsheet workflow demo
"Perplexity" research report generate automatically demo
```

**X (Twitter):**
```
("claude cowork" OR "claude agent") receipts OR "expense report" filter:videos
("perplexity computer" OR "perplexity comet") research demo filter:videos 2025
```

### Proposed Advanced Card Slots (Primary Recommendations)

**Advanced Card 1 — "Turn my receipts into an expense report" (Claude Cowork)**
- Platform: YouTube
- Target channel: Anthropic Official
- Search query: `claude agent "expense report" receipts workflow demo`
- Fallback: The Rundown AI — Claude agent workflow coverage
- Notes: Must show Claude handling multiple receipt images → formatted spreadsheet
- CTA opens: claude.ai

**Advanced Card 2 — "Research the market for my product idea" (Perplexity Computer)**
- Platform: YouTube or X
- Target channel: Perplexity AI Official or The Rundown AI
- Search query: `"perplexity" research "market" agent computer demo 2025`
- Fallback: Any Perplexity Spaces or Perplexity AI agentic research demo
- Notes: Must show research → structured output; 2–4 min length
- CTA opens: perplexity.ai

**Advanced Card 3 — "Build me a dashboard from these docs" (Claude or Perplexity)**
- Platform: YouTube
- Target channel: Anthropic Official or Varun Mayya
- Search query: `"AI agent" "dashboard" OR "spreadsheet" from documents files demo 2025`
- Fallback: Any agent-workflow video showing multi-step document → output pipeline
- Notes: The visual payoff (dashboard or formatted doc appearing) is the hook
- CTA opens: claude.ai or perplexity.ai (whichever video best represents)

---

## Best Sources by Platform

### YouTube (Recommended Primary Platform)
YouTube is the most reliable, universally embeddable platform for Doppio. The IFrame API works without authentication, supports autoplay-muted (required for autoplay on iOS), and has no embed restrictions for public videos.

**Top channels ranked by relevance to Doppio:**

| Rank | Channel | Handle | Best Level | Video Style |
|------|---------|--------|------------|-------------|
| 1 | Skill Leap AI | @SkillLeapAI | Beginner | Tutorial-light, visual demos |
| 2 | Matt Wolfe | @mreflow | Beginner | Casual, high production |
| 3 | Anthropic Official | @anthropic-ai | Intermediate/Advanced | Official demos |
| 4 | Jeff Su | @JeffSu | Beginner/Intermediate | Office productivity |
| 5 | The AI Advantage | @theAIadvantage | Intermediate | Computer-use focus |
| 6 | Perplexity AI | @PerplexityAI | Advanced | Official product demos |
| 7 | The Rundown AI | @TheRundownAI | Advanced | Agent workflow demos |
| 8 | Varun Mayya | @VarunMayya | Intermediate/Advanced | Agentic productivity |
| 9 | Riley Brown | @rileybrown.ai | Intermediate | Claude-specific demos |

**YouTube search operators for curation:**
```
after:2024-10-01 before:2026-01-01 "chatgpt" practical everyday -tutorial
after:2024-10-01 "claude computer use" demo -review
after:2024-06-01 "perplexity" agent research dashboard
```

### TikTok (Secondary — Use Sparingly)
TikTok public oEmbed works for published public videos. However:
- iOS Safari sometimes blocks TikTok embeds
- TikTok's embed JS can slow page load significantly
- oEmbed endpoint: `https://www.tiktok.com/oembed?url=VIDEO_URL`
- No API key required for public embeds
- Auto-play is generally supported on mobile but requires `muted` attribute

**Best TikTok accounts for Doppio content:**
- @mattwolfe (cross-posts from YouTube)
- @aiwithalex — beginner everyday ChatGPT
- @howtoai — visual everyday task demos
- @therundownai — agent/advanced content

**TikTok search queries:**
```
#ChatGPT everyday 2025
#chatgpthack fyp practical
#AI groceries meal plan
#claudeai computer
```

### Instagram Reels (Not Recommended for MVP)
Instagram oEmbed for Reels was restricted in 2023. As of 2025, embedding Instagram Reels in a third-party site without Meta developer credentials and app review is unreliable. The `blockquote` embed code may show for the developer but fail for end users. Recommendation: exclude Instagram Reels from Doppio MVP. If needed, link out rather than embed.

### X / Twitter (Not Recommended for MVP)
X oEmbed (`https://publish.twitter.com/oembed?url=TWEET_URL`) works for public tweets with video, but:
- Video autoplay is blocked in X embeds (requires user click)
- The embed widget loads significant external JS
- X has made oEmbed API access inconsistent since the 2023 API restructuring
- Recommendation: use only as last resort; prefer YouTube for the same content

---

## Video Selection Criteria

A video is a strong fit for Doppio if it scores high on all five dimensions below.

### 1. Relevance (must-have)
- Directly shows the tool (ChatGPT / Claude / Perplexity) doing the task described in the card title
- No additional setup required (no Zapier, no API keys visible, no code)
- The outcome is visible on screen before the video ends

### 2. Length (must-have)
- Optimal: 60–150 seconds
- Acceptable: up to 240 seconds for Advanced level
- Hard limit: No videos over 4 minutes for Beginner/Intermediate

### 3. Clarity (high priority)
- Screen is legible (not blurry, low-res, or over-cropped)
- The natural language prompt typed by the user is visible on screen
- The result/output is shown, not just described in voiceover

### 4. Tone (high priority)
- Non-technical narration — "I just typed this…" not "with the right system prompt…"
- No prompting meta-discussion ("here's how to engineer this prompt")
- Excitement or surprise at the result is a strong positive signal

### 5. Embeddability (must-have)
- Public video (not age-gated, not members-only, not unlisted)
- YouTube preferred; TikTok acceptable; Instagram/X not recommended
- Creator must not have embed disabled (`allowembed=false` on YouTube)

### Anti-Patterns (Disqualifiers)
- Videos that mention "prompting tips" or "prompt engineering" as the hook
- Videos primarily about AI risk, limitations, or debates
- Videos that use third-party tools (Zapier, Make, n8n) as the core mechanism
- Videos with illegible screen text or mobile recordings that are too small
- Videos primarily composed of slides or stock footage rather than live interface demos

---

## Embedding Considerations

### YouTube (Recommended)

**Method**: YouTube IFrame API
```html
<iframe
  width="560"
  height="315"
  src="https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&rel=0&modestbranding=1"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
></iframe>
```

**Notes**:
- `mute=1` + `autoplay=1` is required for autoplay on iOS Safari and Chrome mobile
- `rel=0` prevents related videos from appearing at the end (keeps user on-task)
- `modestbranding=1` minimizes YouTube branding (though not fully removable)
- No API key needed for public video embeds
- IFrame API JS required only if you need programmatic play/pause/events
- `start=X` parameter can be used to deep-link to the relevant moment within a longer video (critical for videos over 3 min)

**Start parameter usage (important for Doppio)**:
For videos longer than 150 seconds, use `start=N` to skip introductions:
```
https://www.youtube.com/embed/VIDEO_ID?start=45&autoplay=1&mute=1
```

**Licensing**:
- YouTube embeds are explicitly permitted by YouTube's Terms of Service for public videos
- No additional permission required from the creator
- Content is not downloaded or reproduced — it is streamed from YouTube's servers
- Fair use / platform ToS covers educational curation without monetization

### TikTok (Acceptable — Secondary)

**Method**: TikTok oEmbed
```html
<!-- Resolve via oEmbed first -->
GET https://www.tiktok.com/oembed?url=https://www.tiktok.com/@user/video/VIDEO_ID

<!-- Then embed the returned HTML or use blockquote format -->
<blockquote class="tiktok-embed"
  cite="https://www.tiktok.com/@user/video/VIDEO_ID"
  data-video-id="VIDEO_ID">
  <section></section>
</blockquote>
<script async src="https://www.tiktok.com/embed.js"></script>
```

**Notes**:
- No API key required for public video embeds
- `embed.js` is a 3rd-party script — defer loading to avoid blocking main thread
- Mobile autoplay on TikTok embeds is more reliable than desktop
- On iOS Safari, TikTok embeds sometimes require a tap to initiate — plan UX for this
- TikTok embeds are not available for `Creator Marketplace` locked videos

**Licensing**:
- TikTok's public content policy allows embedding via their official embed widget
- No additional permission required from creator for public oEmbed
- Same principle as YouTube: content streamed from TikTok's CDN

### Instagram Reels (Not Recommended)

Instagram's oEmbed endpoint requires:
1. A registered Meta App
2. App Review for `instagram_oembed` permission
3. Valid access token in the request

The public `blockquote` embed snippet shown in Instagram's share menu may load for logged-in Meta users but fails for anonymous visitors. Do not use for Doppio MVP.

**Fallback**: If an Instagram-exclusive creator is needed, link to their video externally (open in Instagram app/web) rather than embedding.

### X / Twitter Video (Last Resort)

**Method**: oEmbed via `https://publish.twitter.com/oembed?url=TWEET_URL`

**Notes**:
- Returns HTML with `<blockquote>` and external script
- Video in tweets auto-plays only in some browser contexts
- X's API access for oEmbed has been inconsistent post-2023 restructuring
- Embed width is fixed at 550px — not responsive without CSS override
- External JS payload is heavy (~500KB)

**Recommendation**: Only use if a specific X-native video has no YouTube equivalent. Prefer asking the creator if they've cross-posted to YouTube.

---

## Suggested "Try It" Prompts per Level

These prompts open directly in the target AI tool. They must be:
- Single, natural-language sentences
- Action-first ("Plan…", "Help me…", "Summarize…", "Turn this…")
- Concrete and specific (no vague "help me with AI")
- Contain enough context that the AI can start working immediately
- Never mention "prompting", "tokens", "temperature", or any technical vocabulary

### Beginner Level — Opens ChatGPT (chat.openai.com)

ChatGPT deep-link format (via URL + text):
```
https://chat.openai.com/?q=URLENCODED_PROMPT
```
Note: This URL scheme works for triggering a prefilled chat in ChatGPT's web interface (as of 2025). Verify the parameter name at build time; alternately use `https://chatgpt.com` and pre-fill via the URL fragment if supported.

**Card B-1 — "Plan my groceries from a receipt photo"**
```
I'll upload a photo of my grocery receipt. Please analyze what I bought,
suggest a 3-day meal plan using those ingredients, and list anything extra
I'd need to buy to complete the meals.
```
- CTA label: "Try it in ChatGPT"
- Target: chat.openai.com (GPT-4o or equivalent with vision)
- Deep link: `https://chatgpt.com/?q=I+have+a+photo+of+my+grocery+receipt.+Analyze+what+I+bought,+suggest+a+3-day+meal+plan+using+those+ingredients,+and+list+what+extra+I+might+need.`

**Card B-2 — "Summarize this PDF into 5 bullet points"**
```
I'm going to paste a document (or upload a PDF). Please read it and give me
exactly 5 bullet points summarizing the key takeaways I need to know.
```
- CTA label: "Try it in ChatGPT"
- Target: chat.openai.com
- Deep link: `https://chatgpt.com/?q=I'm+going+to+paste+a+document.+Please+summarize+it+into+exactly+5+bullet+points+covering+the+key+takeaways.`

**Card B-3 — "Write a professional email declining a meeting"**
```
Write a professional but friendly email declining a meeting invite.
The meeting is about [topic]. I want to sound respectful and suggest
an alternative if possible.
```
- CTA label: "Try it in ChatGPT"
- Target: chat.openai.com
- Deep link: `https://chatgpt.com/?q=Write+a+professional+but+friendly+email+declining+a+meeting+invite.+Make+it+respectful+and+suggest+an+alternative+time+or+approach.`

### Intermediate Level — Opens Claude (claude.ai)

Claude deep-link format:
```
https://claude.ai/new?q=URLENCODED_PROMPT
```
Note: Verify parameter at build time. Claude's computer-use features are available in Claude.ai Pro/Team plans. Consider noting this in the UX if necessary.

**Card I-1 — "Clean my Downloads folder"**
```
I want you to organize my Downloads folder. Group files by type (PDFs,
images, spreadsheets, videos), create subfolders for each type,
and move everything into the right place. Ask me before deleting anything.
```
- CTA label: "Try it in Claude"
- Target: claude.ai (computer use required — note in UX)
- Deep link: `https://claude.ai/new?q=Please+organize+my+Downloads+folder+by+grouping+files+by+type,+creating+subfolders,+and+moving+files+into+the+right+place.+Ask+before+deleting+anything.`

**Card I-2 — "Book a restaurant for tonight"**
```
Find me a well-reviewed Italian restaurant near [my location] that has
availability tonight for 2 people at 7:30 PM, and book it for me.
Show me the options before confirming.
```
- CTA label: "Try it in Claude"
- Target: claude.ai (computer use)
- Deep link: Prefill with restaurant-booking variant

**Card I-3 — "Fill out this form for me"**
```
I need to fill out a form online. Here's the URL and here's my information:
[name, email, address, etc.]. Please open the form, fill in my details,
and show me a preview before submitting.
```
- CTA label: "Try it in Claude"
- Target: claude.ai (computer use)
- Deep link: Prefill with form-filling variant

### Advanced Level — Opens Claude or Perplexity

**Card A-1 — "Receipts to expense report" (Claude)**
```
I have photos of all my receipts from this month's work trip.
Please read each one, extract the date, vendor, amount, and category,
then create a formatted expense report spreadsheet I can submit to my company.
```
- CTA label: "Try it in Claude"
- Target: claude.ai
- Deep link: `https://claude.ai/new?q=I+have+photos+of+work+trip+receipts.+Please+extract+date,+vendor,+amount,+and+category+from+each+one+and+create+a+formatted+expense+report+I+can+submit.`

**Card A-2 — "Research my product idea" (Perplexity)**
```
Research the market for [my product idea]: who the main competitors are,
what the market size looks like, what customers are saying is missing,
and give me a one-page summary with sources.
```
- CTA label: "Try it in Perplexity"
- Target: perplexity.ai (Spaces or standard search)
- Deep link: `https://www.perplexity.ai/?q=Research+the+market+for+my+product+idea:+main+competitors,+market+size,+what+customers+say+is+missing,+with+sources.`

**Card A-3 — "Build a dashboard from these docs" (Claude)**
```
I'm going to share several documents with you. Please read them,
extract the key metrics and data points, and create a simple dashboard
or summary table I can use for my weekly status update.
```
- CTA label: "Try it in Claude"
- Target: claude.ai
- Deep link: `https://claude.ai/new?q=I'll+share+several+documents.+Please+extract+key+metrics+and+data+points+and+create+a+summary+table+I+can+use+for+a+weekly+status+update.`

---

## Backup / Fallback Content Strategy

### The 6 Backup Video Slots

The PRD specifies 15 total videos: 9 primary + 6 backups. Allocate backups as follows:

| Backup Slot | Level | Scenario | Priority |
|-------------|-------|----------|----------|
| BU-1 | Beginner | Alternative to B-1 (receipt photo) — e.g., "plan my week from my calendar screenshot" | High |
| BU-2 | Beginner | Alternative to B-3 (email) — "rewrite this email to sound more confident" | Medium |
| BU-3 | Intermediate | Alternative to I-1 (Downloads) — "rename all these files by date" | High |
| BU-4 | Intermediate | Alternative to I-2 (restaurant booking) — "schedule my meetings for next week" | Medium |
| BU-5 | Advanced | Alternative to A-1 (expense report) — "summarize all these meeting notes into action items" | High |
| BU-6 | Advanced | Alternative to A-2 (Perplexity research) — "compare these two product options and give me a recommendation" | Medium |

### Fallback Strategy When Primary Video Unavailable

1. **Link rot** — A video is removed or made private after Doppio ships:
   - Maintain a `content.json` config with `primaryVideoId` and `backupVideoId` per card
   - Monitor with a lightweight health-check at deploy time (HTTP 200 from `youtube.com/oembed?url=...`)
   - Swap to backup by updating `content.json` — no code changes required

2. **Embed blocked by creator** — Some creators disable embedding on their videos:
   - Always test embed functionality during curation (load the actual embed, not just the video page)
   - YouTube flag to check: `embedHtml` field in oEmbed response; if absent, embed is blocked

3. **Content goes stale** — A video demos a UI that has since changed:
   - Prioritize videos that show the natural-language interaction, not the UI chrome
   - Avoid videos that show specific menus or buttons that may have moved
   - Re-curate any video that generates support confusion

4. **No Perplexity Computer video available**:
   - Perplexity Computer (formerly "Comet") is a newer product; high-quality public demos may be sparse
   - Fallback: Use a Perplexity Spaces demo (research synthesis, multi-source summary) — same level of awe, widely available
   - Further fallback: Use a ChatGPT operator/project demo at the Advanced level if Perplexity is not well-documented publicly by launch date

5. **All embeds failing on a platform (nuclear fallback)**:
   - Render a still screenshot of the video thumbnail with a "Watch on YouTube" link
   - Or embed the transcript/key moment as styled text — "Here's what happened when we tried this:"
   - This preserves the card UX even if video embed is down

### Content Refresh Cycle

Because this is a hackathon MVP, the content is hardcoded. Post-hackathon, consider:
- Moving `content.json` to Supabase so videos can be swapped without re-deploy
- Adding a `/admin` route (password-gated) to update video IDs and prompts
- Tracking video completion rates to identify which demos are most engaging

---

## References

### Channel URLs (YouTube)
- Matt Wolfe: `https://www.youtube.com/@mreflow`
- Skill Leap AI: `https://www.youtube.com/@SkillLeapAI`
- Jeff Su: `https://www.youtube.com/@JeffSu`
- Anthropic Official: `https://www.youtube.com/@anthropic-ai`
- The AI Advantage: `https://www.youtube.com/@theAIadvantage`
- The Rundown AI: `https://www.youtube.com/@TheRundownAI`
- Perplexity AI: `https://www.youtube.com/@PerplexityAI`

### Platform Embedding Docs
- YouTube IFrame API: `https://developers.google.com/youtube/iframe_api_reference`
- YouTube oEmbed: `https://www.youtube.com/oembed?url=VIDEO_URL&format=json`
- TikTok oEmbed: `https://www.tiktok.com/oembed?url=VIDEO_URL`
- X oEmbed: `https://publish.twitter.com/oembed?url=TWEET_URL`
- Instagram oEmbed: Requires Meta developer credentials — not recommended

### YouTube Embed Parameters Reference
- `autoplay=1` — starts video automatically (requires `mute=1` on mobile)
- `mute=1` — muted audio (required for autoplay on iOS)
- `rel=0` — suppresses related videos at end
- `modestbranding=1` — reduces YouTube logo prominence
- `start=N` — starts video at N seconds (use to skip intros)
- `end=N` — stops video at N seconds (use to clip to relevant segment)
- `fs=0` — disables fullscreen button (optional, keeps user in-app)
- `cc_load_policy=1` — forces closed captions on (accessibility benefit)

### Perplexity Deep Links
- Standard search: `https://www.perplexity.ai/?q=URLENCODED_QUERY`
- Spaces: `https://www.perplexity.ai/spaces` (no deep link to pre-fill as of 2025)

### Claude Deep Links
- New chat: `https://claude.ai/new`
- With prefill (verify at build time): `https://claude.ai/new?q=URLENCODED_PROMPT`

### ChatGPT Deep Links
- New chat: `https://chatgpt.com/`
- With prefill (verify at build time): `https://chatgpt.com/?q=URLENCODED_PROMPT`
- GPT-4o voice: `https://chatgpt.com/?model=gpt-4o`

### Key Platform Notes (as of research date)
- ChatGPT URL prefill: The `?q=` parameter may trigger a prefilled message but behavior is not officially documented; test at build time
- Claude `?q=` prefill: Similarly informal — verify before shipping
- Alternative approach: Copy prompt to clipboard and instruct user to paste ("Click Copy Prompt, then paste into Claude")
- Most reliable fallback for all platforms: Open tool homepage + show a "Copy Prompt" button that copies to clipboard — does not depend on URL parameter support
