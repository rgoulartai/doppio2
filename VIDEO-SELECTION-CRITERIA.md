# Doppio — Video Selection Criteria

> **Purpose:** Defines the implicit rules used to curate the 9 video cards across 3 levels.
> Any automated fetch (cron job, GitHub Actions, bot) must apply these criteria when selecting and generating content.

---

## Target Audience

Non-technical office workers. People who have heard of ChatGPT but mostly use it as a fancy search engine. No coding knowledge, no developer background. Tasks must be instantly recognizable to someone who works in an office, runs a household, or manages a team.

---

## Universal Rules (all levels)

| Rule | Description |
|------|-------------|
| **Show, don't tell** | The video must demonstrate the AI *doing the task on screen*. Explainer videos, reviews, or "here's why AI is amazing" content are disqualified. The viewer must be able to watch and immediately understand what happened. |
| **Relatable task** | The task shown must be something a non-technical person has actually had to do. "Summarize a PDF" yes. "Fine-tune a model" no. |
| **Short format** | Target 1–7 minutes. Long tutorials or full courses are not appropriate for a quick daily session. |
| **No coding** | Zero code on screen. No terminal, no Python, no APIs being called manually. The AI tool must be used through its normal consumer UI. |
| **Actionable prompt** | Every video must pair with a `tryItPrompt` — a one-sentence prompt the user can copy and run themselves to replicate what they just watched. If you can't write a clear `tryItPrompt` for a video, it's the wrong video. |
| **Trusted channels** | Prefer established AI education channels (see preferred channel list below). Avoid random creators with no track record. |

---

## Level 1 — Beginner 🌱

**Theme:** ChatGPT for everyday life — natural language, zero setup, immediate results.

**`aiTool`:** `chatgpt`

**Goal:** Show someone who has never intentionally used AI that they can do something useful *right now*, with no learning curve.

**Task profile:**
- Single-turn interactions (one prompt → one result)
- Personal or office tasks: emails, documents, meal planning, scheduling, summarizing
- Result is immediately usable (not a starting point for more work)

**Good examples from current content:**
- Upload a grocery receipt photo → get a meal plan
- Paste a 20-page PDF → get 5 bullet points
- Describe a situation → get a polished email draft

**Disqualify if:**
- Requires any setup, plugin, or account beyond ChatGPT
- Shows multi-step chaining or automation
- Uses any tool other than ChatGPT

---

## Level 2 — Intermediate ⚡

**Theme:** Delegation — hand Claude a task and let it operate your computer or browser for you.

**`aiTool`:** `claude`

**Goal:** Show that AI can now *do things*, not just answer questions. The user gives an instruction and steps back.

**Task profile:**
- Claude computer use or agentic capabilities
- Tasks that previously required manual clicking, form-filling, or file management
- The AI takes multiple steps autonomously to complete the job

**Good examples from current content:**
- Organize a Downloads folder by file type
- Browse the web and book a restaurant
- Open a web form and fill it from provided details

**Preferred channel:** Anthropic's official YouTube channel (`@anthropic-ai`) — they produce the clearest Claude computer use demos.

**Disqualify if:**
- Uses ChatGPT (Level 1 territory)
- Is a single-turn Q&A (not agentic enough)
- Requires developer setup (API keys, code)

---

## Level 3 — Advanced 🚀

**Theme:** Full AI workflows — raw input goes in, polished output comes out, multiple steps happen in between.

**`aiTool`:** `claude` or `perplexity`

**Goal:** Show AI as a system that orchestrates an end-to-end workflow. The user provides raw materials and receives a finished deliverable.

**Task profile:**
- Multi-step pipelines: gather → process → format → deliver
- Outputs are presentation-ready (expense report, research dashboard, comparison table)
- May involve live data (web search, real prices, current trends)

**Good examples from current content:**
- Receipt photos → formatted expense report ready to submit
- Research query → one-page summary dashboard with citations (Perplexity)
- Travel query → comparison table of flights with price/duration/stops

**Disqualify if:**
- Single-step (belongs in Level 1 or 2)
- No live data or multi-source synthesis
- Uses ChatGPT as the primary tool (Claude or Perplexity preferred at this level)

---

## Preferred Channels

| Channel | Handle | Strength |
|---------|--------|----------|
| Skill Leap AI | `@SkillLeapAI` | Practical AI tutorials for non-technical office workers |
| Anthropic | `@anthropic-ai` | Official Claude demos — computer use, agents, workflows |
| The Rundown AI | `@TheRundownAI` | Weekly coverage of new AI tools with hands-on demos |
| Matt Wolfe | `@mreflow` | New AI tools explained for everyday users |
| Perplexity AI | `@PerplexityAI` | Official Perplexity tutorials — research and agentic workflows |

---

## `tryItPrompt` Rules

Every video card requires a `tryItPrompt`. It must:

1. Be a single sentence or short paragraph the user can paste directly into the AI tool
2. Replicate the *type* of task shown in the video (not the exact same content)
3. Use second-person ("I have a document…", "Find me…", "Write a…")
4. Be immediately executable — no placeholders like `[insert your data here]`
5. Match the `aiTool` of the card (ChatGPT prompts open at `chatgpt.com`, Claude prompts at `claude.ai`)

---

## What to Avoid (across all levels)

- Viral "AI did something crazy" content with no practical takeaway
- Videos showing AI failures or limitations
- Content that requires a paid subscription beyond the standard ChatGPT/Claude/Perplexity free tier
- Videos older than 18 months (AI moves fast; outdated demos confuse users)
- Duplicate task types within the same level (no two cards should show "write an email")
