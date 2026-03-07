# Doppio

> **"From ChatGPT Googler to AI coworker boss — one daily session at a time, curated through crowd knowledge, no coding required."**

**Live**: [doppio.kookyos.com](https://doppio.kookyos.com) — built in a single day for the Skool Hackathon, March 6–8, 2026.

---

## Executive Summary

**Doppio is an AI literacy PWA based web-app** that transforms non-technical workers — office professionals, managers, small business owners — from people who use ChatGPT like a Google search into confident AI coworkers. It takes daily practice and real dedication — but no coding, no app store, just a shareable URL you return to every day until it clicks.

The app MVP guides users through **3 levels × 3 cards = 9 real-world AI demos**, each showing an actual person doing an actual task with AI — then immediately letting the user try the same thing. Watch → Try → Succeed.

**Built entirely with AI in one day** using Claude Code + the [m2c1](https://github.com/grandamenium/m2c1) orchestration framework. The entire development pipeline — from raw idea to production PWA — was driven by Claude: 7 parallel research subagents, a 63-decision discovery document, 8 implementation skill files, and 19 of 29 tasks completed in a single session. Total API budget: $156.08. Spent to date: ~$78.

**The KOOKY OS angle:** Doppio is part of the KOOKY OS ecosystem. The roadmap includes connecting Doppio to **KOOKY-outlaw** — a live, self-hosted agentic AI running open-source Qwen LLM on a Hostinger VPS via Ollama. This would transform Doppio from a passive video curator into an **interactive AI learning companion** with personalized coaching, memory of your progress, and 24/7 availability via WhatsApp and Telegram — powered by infrastructure KOOKY already owns, at zero incremental API cost.

This README documents not just what was built, but the **entire development process** — so anyone reading it can understand how this kind of AI-driven workflow turns a brain dump into a production app in hours, not weeks.

**TL;DR for busy readers:**
- 🎯 **What**: PWA that makes non-technical users confident AI managers in 20 minutes
- ⚡ **How**: Claude Code + m2c1 orchestration + 7 MCP servers, one day of work
- 💰 **Budget**: $156.08 hard cap — automated hourly credit tracking, Sonnet for building / Opus for planning
- 🚀 **Next**: KOOKY-outlaw integration for personalized AI coaching via open-source LLM
- 🏆 **Stakes**: Skool Hackathon, March 8, 2026 noon EST deadline, $6,000 prize

---

## Table of Contents

1. [The Idea](#the-idea)
2. [The Budget Constraint ($156.08)](#the-budget-constraint-15608)
3. [Step 1 — From Brain Dump to Plan](#step-1--from-brain-dump-to-plan)
4. [Step 2 — Research Wave (7 Parallel Subagents)](#step-2--research-wave-7-parallel-subagents)
5. [Step 3 — Discovery and Decisions](#step-3--discovery-and-decisions)
6. [Step 4 — Implementation (Phases 1–4)](#step-4--implementation-phases-14)
7. [What Got Built](#what-got-built)
8. [MCP Servers That Made This Possible](#mcp-servers-that-made-this-possible)
9. [The AI Workflow Toolkit](#the-ai-workflow-toolkit)
10. [Tech Stack](#tech-stack)
11. [How to Run It](#how-to-run-it)
12. [Project Structure](#project-structure)
13. [Background Documents](#background-documents)
14. [Future Updates — KOOKY-outlaw Integration](#future-updates--kooky-outlaw-integration)
15. [Hackathon Context](#hackathon-context)

---

## The Idea

It started with a Perplexity brainstorming session on the morning of March 6, 2026 — the first day of the Skool Hackathon. The challenge: build something useful and demoable in 72 hours.

The insight that came out of that session:

> Non-technical workers already know AI exists. They've tried ChatGPT. They just use it like a Google search — type a question, get an answer — and they have no idea it can actually do their work for them. The gap isn't awareness. It's exposure to the right demos.

And those demos already exist — on YouTube, TikTok, and social media. Thousands of people film themselves delegating real tasks to AI. The problem is that those videos are scattered and unsequenced. There's no guided path from "beginner using ChatGPT as a search engine" to "advanced user running multi-step AI agents."

Doppio sequences those existing videos into a 3-level learning path. You watch a real demo, then immediately try the same task yourself. No theory. No prompting tips. Just show → try → succeed.

The full original idea — including the naming journey, UX flow, and initial tech stack hypothesis — is preserved in **[`docs/Brain Dump.md`](docs/Brain%20Dump.md)**.

---

## The Budget Constraint ($156.08)

This project was built entirely using Claude as the AI engine — and Claude API usage costs money. The account started with **$156.08** in credits. That is the hard total budget for the entire project, with no option to add more.

This is a real constraint that shapes every technical decision.

### Why It Matters

Every Claude Code session, every subagent spawned, every context-heavy operation spends from that $156.08. An AI-heavy workflow like this one — with 7 parallel research subagents, 29 implementation tasks, regression testing, and multiple handoff sessions — can easily burn through credits if not managed carefully.

### The Management Strategy

**Model selection by task type:**
- **Opus** (Claude's most capable, most expensive model) — used only for the PRD generation and DISCOVERY.md Q&A rounds. These are the most consequential documents in the project; a mistake at this layer propagates through all 29 tasks. The cost premium is worth it.
- **Sonnet** (faster, significantly cheaper) — used for all implementation tasks, subagents, file operations, testing, and UI work. Sonnet handles execution well; it just needs the right context pre-loaded via skill files.

**Hourly credit tracking:**
An automated script (`scripts/budget_screenshot.py`) runs every hour from March 6 5 PM through March 8 noon — the full hackathon window. It uses Playwright to authenticate, navigate to `platform.claude.com/settings/billing`, and screenshot the current balance. Every entry is appended to `Budget.md` with a timestamp.

This gives a real-time burn rate view. If spend accelerates unexpectedly, it's visible immediately.

**Context economy:**
The `/handoff` + `/pickup` session management system (explained later) keeps each Claude session focused and short. Rather than letting one context window balloon with 10+ hours of conversation history, work is broken into clean sessions. Shorter sessions = less token overhead = lower cost per task.

### Where We Are

| Moment | Balance |
|--------|---------|
| Session start (March 6, 2:20 PM) | $156.08 |
| Phase 4 complete (March 6, 10:00 PM) | ~$77.81 |
| Spent on Phases 1–4 (19/29 tasks) | ~$78.27 |
| Remaining for Phases 5–6 (10 tasks) | ~$77.81 |

With 10 tasks remaining and ~$78 left, the project is pacing to complete well within budget. The per-task cost has been consistent and Phase 5–6 tasks are smaller in scope than earlier phases.

---

## Step 1 — From Brain Dump to Plan

Once the idea was clear, the first move was not to open a code editor. It was to open Claude Code and invoke **m2c1**.

**m2c1** (meta-to-code, one pass) is an open-source Claude Code skill by [@grandamenium](https://github.com/grandamenium/m2c1) that converts a raw brain dump into a fully-structured, phased development pipeline — automatically. You can find it at [github.com/grandamenium/m2c1](https://github.com/grandamenium/m2c1).

### What Happened

```
Terminal: ENABLE_TOOL_SEARCH=true claude
Prompt: "Let's use the m2c1 skill to start a new project"
Prompt: [pasted Brain Dump from Perplexity session]
```

m2c1 ran its pipeline:

| Phase | What It Did |
|-------|-------------|
| 0 — Setup | Created `.claude/orchestration-doppio/` directory structure |
| 1 — PRD | Converted the brain dump into a structured `PRD.md` |
| 2 — Research | Spawned 7 parallel subagents (see Step 2) |
| 3 — Discovery | Ran structured Q&A rounds → produced `DISCOVERY.md` |
| 4+ — Planning | Generated 8 skill files + `PHASES.md` (29 tasks across 6 phases) |

The total setup time from first Claude prompt to a fully planned, skill-loaded, 29-task implementation pipeline was under 30 minutes.

### Why Not Plan Mode?

Claude Code has a built-in **plan mode** that pauses execution and waits for human approval before writing code. m2c1 is not used with plan mode — and the reason is budget, not architecture.

Plan mode in Claude Code runs on **Opus**, which is significantly more expensive per token than Sonnet. With a tight $156.08 budget for the entire hackathon, every Opus call had to count. m2c1 solves this by front-loading all the expensive reasoning (PRD generation, research, discovery, task decomposition) into a single structured pipeline — then handing off well-specified tasks to Sonnet for the actual implementation. The result: Opus is used once, strategically, to build the plan. Sonnet executes it.

Using plan mode on top of m2c1 would have doubled the Opus token usage without adding value — m2c1 already provides the structure, checkpoints, and task clarity that plan mode is designed to create.

**Rule of thumb:** Use plan mode for ad-hoc tasks when you have budget headroom. Use m2c1 when budget is tight and scope is large — it does the planning work upfront so the cheaper model can execute cleanly.

The operational details of how this was set up — including the exact terminal commands, Claude session configuration, and workflow steps — are documented in **[`docs/Step By Step.md`](docs/Step%20By%20Step.md)**.

---

## Step 2 — Research Wave (7 Parallel Subagents)

After the PRD was locked, m2c1 spawned 7 research subagents simultaneously. Each one was an independent Claude instance given a specific domain to investigate.

| Agent | Research Domain | Output File |
|-------|----------------|-------------|
| `supabase-sync` | Anonymous auth, localStorage-first sync, free tier limits | `research/supabase-sync.md` |
| `video-embedding` | YouTube IFrame API, TikTok oEmbed, facade/lazy-load, Instagram/X limitations | `research/video-embedding.md` |
| `analytics` | Vercel Analytics, Supabase custom events, 7 key event definitions | `research/analytics.md` |
| `pwa-implementation` | vite-plugin-pwa, Workbox, iOS Safari quirks, icon requirements | `research/pwa-implementation.md` |
| `ai-video-generation` | Nano Banana workflow, Sora alternatives, FFmpeg compression | `research/ai-video-generation.md` |
| `gamification-ux` | canvas-confetti, card completion animations, badge share mechanics | `research/gamification-ux.md` |
| `content-curation` | Best YouTube channels per level, search queries, backup video strategy | `research/content-curation.md` |

All 7 ran in parallel. Total research time: under 5 minutes. The findings from each agent directly informed the decisions resolved in Step 3.

This approach keeps the main context clean — heavy research stays in subagent memory, not clogging the primary session — and enables parallelism that would take hours if done sequentially.

---

## Step 3 — Discovery and Decisions

Research findings created new questions. Step 3 resolved them all through structured Q&A rounds with Claude, producing the most important document in the project: **`DISCOVERY.md`**.

`DISCOVERY.md` is the **single source of authority** for every decision made in this project. It overrides the PRD, the research files, and any other documentation. When two files contradict each other, `DISCOVERY.md` wins.

### What Got Decided

Three rounds of Q&A locked 63 decisions (D1–D63), including:

- **D1**: Product name → **Doppio** (final, no alternatives)
- **D29**: Video platforms → YouTube (primary) + TikTok (secondary). Instagram Reels permanently excluded — requires Facebook App OAuth token, technically infeasible in a client-side PWA without exposing credentials
- **D38**: Confetti → `canvas-confetti` on level completion only (3× max). Not on every card — preserve the finale delight
- **D39**: Streaks → omitted. Daily streaks are wrong for a single-session app (everyone gets "Streak: 1")
- **D43**: Badge share → `navigator.share()` with clipboard fallback, URL only. No dynamic image generation
- **D51**: Explicit scope exclusions — no backend AI, no user accounts, no Instagram Reels, no payments, no admin dashboard, no social features
- **D62**: Why TikTok yes / Instagram no — full technical reasoning documented
- **D63**: Resource links — each card may have an optional `resourceLink` field; completion screen gets curated "keep learning" links

### Why This Document Matters

Without `DISCOVERY.md`, every new Claude session would re-litigate decisions already made. With it, every session starts with a loaded skill file that says: "These things are decided. Do not question them. Build from here."

---

## Step 4 — Implementation (Phases 1–4)

With all decisions locked, m2c1 generated `PHASES.md` — a full implementation plan organized into 6 phases, 29 tasks.

| Phase | Focus | Tasks | Status |
|-------|-------|-------|--------|
| 1 | Scaffolding & Infrastructure | 5 | ✅ Done |
| 2 | Content Layer | 4 | ✅ Done |
| 3 | Core Learning UI | 5 | ✅ Done |
| 4 | Level Flow & Gamification | 5 | ✅ Done |
| 5 | Analytics & Polish | 5 | ⏳ Pending |
| 6 | E2E Testing | 5 | ⏳ Pending |

Current state: **19 of 29 tasks complete**. Progress is tracked live in `PROGRESS.md`.

### How Each Phase Worked

Each phase ends with a regression task (`.R`) — a full Playwright-driven end-to-end test verifying that nothing broken was shipped. All 4 completed phases have passing regressions on production.

Each session followed this rhythm:
1. `/pickup` — load previous handoff, restore context
2. Read the task file (`.claude/orchestration-doppio/tasks/phase-N/task-N-M.md`)
3. Execute the task — code, test, build verify
4. Update `PROGRESS.md` — status → done, notes added
5. `/handoff` when context approached 60–70% — generates a timestamped handoff file, preserving full context for the next session

---

## What Got Built

### The App

Doppio guides non-technical users through 3 levels of AI mastery — 9 video cards total, 3 per level. Each card shows a real person doing a real task with AI, then gives users a pre-written natural language prompt to try the same thing immediately.

### The 3 Levels

| Level | Theme | AI Tool | Cards |
|-------|-------|---------|-------|
| **1 — Beginner** 🌱 | ChatGPT beyond Google search | ChatGPT | Plan groceries, summarize PDF, write professional email |
| **2 — Intermediate** ⚡ | Simple AI delegation | Claude.ai | Clean Downloads folder, book restaurant, fill online form |
| **3 — Advanced** 🚀 | Full AI agents | Claude Cowork + Perplexity | Expense report from receipts, research dashboard, flight comparison |

Each card has: (1) embedded YouTube demo video, (2) "Try it" CTA that opens the AI tool with a prefilled natural-language prompt, (3) clipboard copy fallback, (4) "Mark as done" completion button, and (5) creator attribution.

### Key Features

- **PWA** — installs to iOS/Android home screen from browser, no App Store required
- **Progress persistence** — localStorage (offline-first) synced to Supabase in background
- **Level completion** — canvas-confetti + full-screen overlay on each level completion
- **Final screen** — "You're an AI Manager!" + double confetti burst + "Share My Badge" + 5 curated resource links
- **Zero backend AI** — pure static curation, no LLM calls at runtime, ships fast
- **Swappable content** — all 9 video IDs, prompts, and links live in `src/data/content.json`

### How Videos Were Curated

All 9 videos are from YouTube. The original plan included TikTok (which is technically supported in the codebase via `TikTokEmbed.tsx`) and excluded Instagram Reels (requires Facebook App OAuth — technically infeasible client-side). In practice, all 9 best-fit videos were found on YouTube, so TikTok was never used.

Videos were selected using a weighted scoring model:

| Signal | Weight | Why |
|--------|--------|-----|
| View count | 35% | Social proof |
| Recency (2025–2026) | 30% | AI tools change fast; current UI matters |
| Positive sentiment | 20% | Like ratio + comment tone |
| Channel authority | 15% | Official channels (Anthropic, Perplexity) get a boost |

Curation was a manual process: Claude ran parallel Exa searches applying these criteria as evaluation guidelines, and the final 9 video IDs were selected collaboratively. To update a video: edit the `videoId` field in `src/data/content.json` — no code deploy needed.

6 backup video IDs are also curated per-card in `content.json` for quick swaps if any video gets taken down.

### What Deviated From the Plan

> **Video platforms:** Originally planned for TikTok + YouTube. All 9 final videos are YouTube — TikTok code exists but no TikTok content was used.
>
> **Tech versions:** Planned React 18, React Router v6. Actual: React 19, Vite 7, React Router v7 (latest stable at build time).
>
> **Badge share:** Planned as a static `og-badge.png` image for social preview. Currently a URL/text share only — the image is pending (Phase 5 Task 5.2).
>
> **Landing teaser video:** The hero `<video>` element is scaffolded and ready. The actual 15-second MP4 needs to be created in Nano Banana after the UI was built. This is a pending user action.
>
> **Extra pages:** A trial/payment flow (Trial.tsx, Payment.tsx, Profile.tsx, Bookmarks.tsx) was explored in a session between Phases 3 and 4. These pages exist in the codebase but were outside the original MVP scope defined in DISCOVERY.md. `DevLogin.tsx` (`/dev`) is a dev utility that must be removed before the March 8 submission.

---

## MCP Servers That Made This Possible

[MCP (Model Context Protocol)](https://modelcontextprotocol.io) is Anthropic's open standard that lets Claude connect to external tools as live, callable capabilities — not copy-pasted instructions, but actual actions taken inside the same conversation turn.

Without MCPs, each external operation means switching windows, copying values back into the terminal, and re-orienting Claude. With MCPs, Claude can "apply this SQL migration" or "add this DNS record" in the same conversation turn, with no context break. In a 72-hour hackathon, that compound friction reduction is the difference between shipping and not shipping.

| MCP Server | Package | Used For |
|------------|---------|----------|
| **Playwright** | `@playwright/mcp@latest` | Hourly budget screenshots + UI regression testing |
| **Supabase** | `@supabase/mcp-server-supabase` | SQL migrations, RLS policies, anonymous auth setup |
| **GitHub** | `@github/mcp-server` | Repository creation, pushing commits |
| **Context7** | `@upstash/context7-mcp@latest` | Up-to-date library docs for vite-plugin-pwa, supabase-js, lite-youtube-embed |
| **Exa** | `exa-mcp-server` | Semantic web search for video curation |
| **Hostinger MCP** | `hostinger-api-mcp@latest` | Adding CNAME record for `doppio.kookyos.com` → Vercel |
| **QMD** | local (`qmd mcp`) | Searching KOOKY OS knowledge base (80+ docs) for patterns and prior decisions |

---

## The AI Workflow Toolkit

Beyond m2c1 and MCPs, several Claude Code features were essential to keeping this project manageable across multiple sessions.

### /handoff and /pickup — Session Continuity

Claude's context window fills over time. Once it approaches 60–80% capacity, response quality degrades and earlier decisions may be dropped.

**`/handoff`** — run when context hits ~60–70%:
1. Summarizes everything accomplished in the session
2. Records all files created/modified
3. Captures git state (commits, branch, staged changes)
4. Documents outstanding tasks and their status
5. Writes a timestamped file to `agents/sessions/YYYY-MM-DD/`
6. Generates a compact pickup prompt for the next session

**`/pickup`** — run at the start of every new session:
1. Finds the most recent handoff file
2. Summarizes what was accomplished before
3. Restores task list and context
4. Presents next steps immediately

```
Start session → /pickup → work → [60% context] → /handoff → new session → /pickup → ...
```

This pattern keeps every session fresh while maintaining complete project continuity across unlimited sessions.

### Claude Code Status Bar

Claude Code's status bar can show a **context usage progress bar** — a live indicator of how full the context window is. Configured via `/statusline` inside a Claude Code session. When it hits ~60%, that's the cue to run `/handoff`.

```
[████████░░░░░░░░░░░░] 42% context
```

### Obsidian as a Human-Friendly Interface

All project files live in one directory. Obsidian was configured to treat that directory as a vault — every `.md` file is directly accessible through Obsidian's visual editor, graph view, and search. Claude writes files; Obsidian makes them human-readable without a terminal. You can also write directly in Obsidian and Claude picks up the changes on the next prompt.

To set it up: Install [Obsidian](https://obsidian.md) → Open folder as vault → navigate to the project root → click Open.

### Full Autonomy Mode

Claude Code has a `--dangerously-skip-permissions` flag that removes all permission prompts and lets Claude operate without confirmations. It was deliberately not used for this project.

Even in a 72-hour hackathon, the approval prompts are kept on. They're not friction — they're checkpoints. Each prompt is a moment to verify the action matches intent, catch a misunderstood instruction before it propagates, and stay aligned with the decisions locked in `DISCOVERY.md`.

The alternative is editing `~/.claude/settings.json` to allowlist specific commands while keeping approvals for everything else — a middle ground worth exploring if the interruptions feel excessive but full autonomy feels too risky.

---

## Tech Stack

| Layer | Planned | Actual |
|-------|---------|--------|
| Framework | React 18 | **React 19** |
| Build tool | Vite | **Vite 7** |
| Routing | React Router v6 | **React Router v7** |
| Styling | Tailwind CSS | Tailwind CSS ✓ |
| PWA | vite-plugin-pwa v0.21.x + Workbox | ✓ |
| PWA Icons | @vite-pwa/assets-generator | ✓ |
| Database + Auth | Supabase (anonymous auth only) | ✓ |
| Analytics | Vercel Analytics + Supabase custom events | ✓ |
| Video (YouTube) | lite-youtube-embed (facade/lazy) | ✓ |
| Video (TikTok) | Direct iframe embed | Supported in code, unused in content |
| Confetti | canvas-confetti (~6 kB) | ✓ |
| Deployment | Vercel Hobby (free) | ✓ |

Version differences (React 19, Vite 7, React Router v7) are due to the latest stable releases at build time. All APIs are compatible; only version numbers shifted from planning.

---

## How to Run It

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier)
- A [Vercel](https://vercel.com) account (free Hobby tier)

### Local Development

```bash
git clone https://github.com/rgoulartai/doppio
cd doppio
npm install
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### Environment Variables

```bash
# .env.local — never commit this file
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_STRIPE_PAYMENT_URL=<stripe-payment-link>   # optional — trial/payment flow
VITE_STRIPE_PORTAL_URL=<stripe-portal-link>     # optional — trial/payment flow
```

### Supabase Setup

Enable anonymous auth in Supabase Dashboard → Authentication → Settings → "Enable anonymous sign-ins", then run:

```sql
create table public.user_progress (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  level        smallint not null check (level between 1 and 3),
  card         smallint not null check (card between 1 and 3),
  completed_at timestamptz not null default now(),
  constraint unique_user_level_card unique (user_id, level, card)
);
alter table public.user_progress enable row level security;
create policy "Users can read their own progress" on public.user_progress for select using (auth.uid() = user_id);
create policy "Users can insert their own progress" on public.user_progress for insert with check (auth.uid() = user_id);

create table public.analytics_events (
  id           uuid default gen_random_uuid() primary key,
  event_name   text not null,
  session_id   text,
  properties   jsonb,
  created_at   timestamptz not null default now()
);
alter table public.analytics_events enable row level security;
create policy "Anyone can insert analytics events" on public.analytics_events for insert with check (true);
```

Both tables are in `supabase/migrations/001_initial.sql`.

### Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Add environment variables in Vercel Dashboard → Project → Settings → Environment Variables. For the custom domain, add a CNAME record in your DNS provider pointing `doppio` → Vercel's cname target.

---

## Project Structure

```
Doppio/
├── .claude/
│   ├── orchestration-doppio/         # m2c1 orchestration output
│   │   ├── PRD.md                    # Product Requirements Document
│   │   ├── DISCOVERY.md              # Single source of truth (overrides everything)
│   │   ├── PHASES.md                 # 29 tasks across 6 phases
│   │   ├── tasks/                    # Per-task specification files
│   │   └── research/                 # 7 subagent research documents
│   └── skills/                       # 8 per-domain implementation skills
├── agents/
│   └── sessions/                     # /handoff outputs — session continuity files
├── scripts/
│   ├── update_timeline.sh            # Auto-updates PROJECT_TIMELINE.md every 30 min
│   ├── auto_commit_push.sh           # Auto git commit + push every 30 min
│   └── budget_screenshot.py          # Hourly Playwright screenshot of Claude credit balance
├── src/
│   ├── data/
│   │   └── content.json              # All video IDs, prompts, resource links
│   ├── pages/
│   │   ├── Landing.tsx               # / — hero, CTA, badge banner
│   │   ├── Learn.tsx                 # /learn — 3-level card flow, progress tracking
│   │   ├── Complete.tsx              # /complete — final screen, confetti, badge share
│   │   ├── AIFeed.tsx                # /ai-feed — daily AI videos from kooky-outlaw (added 2026-03-07)
│   │   ├── Trial.tsx                 # /trial — trial capture (beyond MVP scope)
│   │   ├── Payment.tsx               # /payment — Stripe gate (beyond MVP scope)
│   │   ├── Profile.tsx               # /profile — user status + AI feed nav button
│   │   ├── Bookmarks.tsx             # /bookmarks — saved videos (beyond MVP scope)
│   │   └── DevLogin.tsx              # /dev — dev utility
│   ├── components/                   # Shared UI components
│   ├── hooks/                        # useProgress, usePWAInstall
│   ├── lib/                          # supabase, progress, analytics, tryit, youtube-ai-videos helpers
│   └── types/                        # TypeScript interfaces
├── public/                           # Icons, favicon, PWA manifest, static assets
├── supabase/
│   ├── migrations/001_initial.sql    # Full schema (user_progress + analytics_events + RLS)
│   └── migrations/002_youtube_ai_videos.sql  # AI video feed table + RLS (added 2026-03-07)
├── docs/
│   ├── Brain Dump.md                 # Original raw idea from Perplexity brainstorm
│   └── Step By Step.md               # Complete build walkthrough — how this was done
├── screenshots/
│   ├── budget_*.png                  # Hourly Claude credit balance screenshots
│   └── regression/                   # Regression test evidence per phase
├── .env.example                      # Variable names template — copy to .env.local
├── Budget.md                         # Credit balance tracker with hourly screenshots
├── CHANGELOG.md                      # Notable changes log — all Phase 1–4 entries
├── PROGRESS.md                       # Task status tracker — 19/29 done
├── PROJECT_TIMELINE.md               # Chronological activity log (auto-updated)
└── README.md                         # This file
```

---

## Background Documents

These two documents tell the human story of how this project came to be. They're preserved because they show the real progression from messy idea to structured implementation — something no commit history can fully capture.

### [`docs/Brain Dump.md`](docs/Brain%20Dump.md)

The original raw idea — exactly as it came out of the Perplexity brainstorming session on March 6, 2026, before any code existed. Reading it shows:
- The core insight about existing social media demos being the "content layer"
- The initial UX flow hypothesis
- The original tech stack guess (which changed)
- The full naming journey: AICoworker → AIgnition → IronSpark → AgentDuo → Ignis → **Doppio**
- The winning pitch sentence

This is what was pasted into Claude Code to kick off m2c1. Compare it to the shipped product to see how a brain dump becomes a PWA in one day.

### [`docs/Step By Step.md`](docs/Step%20By%20Step.md)

A complete walkthrough of the actual build process — every tool, command, and decision point. Covers:
- How Claude Code and m2c1 were configured
- The exact prompts used to start the project
- Why Opus was used for planning but Sonnet for building
- How budget was managed across sessions
- How /handoff + /pickup kept context alive across multiple sessions
- How the UI aesthetic evolved from the original Apple.com concept to the final KOOKY dark editorial design
- What would be done differently on the next project

If you want to replicate this kind of AI-driven hackathon build, start here.

---

## KOOKY-outlaw Integration — Daily AI Video Feed

> **Status:** ✅ Implemented — March 7, 2026. Live at `/ai-feed`.

### What Is KOOKY-outlaw?

**KOOKY-outlaw** is a live, self-hosted agentic AI assistant built by KOOKY OS. It is the infrastructure backbone of the KOOKY AI ecosystem — a 24/7 always-on bot that runs in its own Docker container on a Hostinger VPS, powered by **Qwen 2.5 (14B parameter open-source LLM)** via **Ollama**, connected through a **Tailscale secure mesh VPN**.

Unlike API-dependent chatbots, KOOKY-outlaw:
- Runs entirely on **infrastructure KOOKY already owns** — no per-token API costs for inference
- **Learns continuously** by writing its own execution skills into persistent Markdown memory files
- **Operates proactively** via a heartbeat scheduler — it can reach out, not just respond
- **Lives in your workflow** through Telegram (live), WhatsApp, Slack, and Discord (planned)
- Exposes an **HTTP gateway** (`POST /webhook`) for programmatic integration from any external app

As of February 2026, Sprints 0–6 are complete with 31/31 tests passing. The bot is live on Telegram, connected to a RunPod GPU for the Qwen inference layer, and running in production on the Hostinger VPS.

### What Was Built

The first KOOKY-outlaw → Doppio integration is live. Every day, kooky-outlaw fetches YouTube AI videos, uses its LLM (qwen2.5:7b on RunPod) to curate the top 9 for non-technical learners, and writes them to Supabase. Doppio reads them on the `/ai-feed` page — fresh every morning, zero human curation required.

**The pipeline:**
```
kooky-outlaw (Hostinger VPS)
  → YouTube Data API v3 (3 searches × 15 results = 45 videos)
  → qwen2.5:7b via Ollama on RunPod (ranks top 3 per level)
  → Supabase youtube_ai_videos table (9 rows with session_date)
  → Doppio /ai-feed page (fetches today's rows on load)
```

**New files:**
| File | What it does |
|------|-------------|
| `supabase/migrations/002_youtube_ai_videos.sql` | Table schema + RLS (public read, service-role write) |
| `src/lib/youtube-ai-videos.ts` | `fetchTodaysVideos()` — queries Supabase for today's rows |
| `src/pages/AIFeed.tsx` | `/ai-feed` page — level-grouped cards (🌱/⚡/🚀), empty state, loading state |

**Updated files:**
- `src/App.tsx` — `/ai-feed` route
- `src/pages/Profile.tsx` — "Today's AI Videos" button in Daily AI Videos section

**Infrastructure:**
- HTTP gateway enabled on Hostinger VPS: `ENABLE_GATEWAY=true`, port `8080` published
- Gateway secret configured in `/opt/kooky-outlaw/.env`
- Health endpoint: `curl http://100.94.51.9:8080/health → {"status":"ok"}`

### Triggering the Daily Run

Fire the gateway with a POST containing the YouTube + Supabase prompt:
```bash
curl -X POST http://100.94.51.9:8080/webhook \
  -H "Content-Type: application/json" \
  -H "X-Gateway-Secret: <GATEWAY_SECRET>" \
  -d '{"sender_id": "doppio-cron", "content": "<see KOOKY-OUTLAW-INTEGRATION.md>"}'
```

Credentials needed: `YOUTUBE_API_KEY` (Google Cloud Console), `SUPABASE_SERVICE_ROLE_KEY` (Doppio project → Settings → API).

### The Road Ahead

This is Phase 1 of the KOOKY-outlaw ↔ Doppio integration. The video feed demonstrates the pipeline working end-to-end. The longer-term vision:

| What | How |
|------|-----|
| **Videos replace static content** | `fetchTodaysVideos()` feeds directly into `Learn.tsx` instead of `content.json` — the learning path is live-curated |
| **Personalized coaching** | After each card, users ask the bot questions — answered by Qwen via Ollama, zero API cost |
| **Proactive follow-up** | Heartbeat scheduler messages users on Telegram/WhatsApp 24h after completion |

Every component already exists on KOOKY infrastructure — no new services, no new accounts, no new API costs.

---

## Hackathon Context

- **Event**: Skool Hackathon (hosted by Marcin & Sabrina)
- **Start**: March 6, 2026 at 1 PM EST
- **Deadline**: March 8, 2026 at 12:00 PM (noon) EST
- **Total budget**: $156.08 in Claude API credits — hard cap
- **Prizes**: $6,000
- **Submission**: Project name, team, 1-sentence description, 1-sentence target audience, 2-minute demo video (uploaded directly to Skool), AI tools used, live link
- **Judging philosophy**: "Small + working + clear demo beats big + broken"
- **AI tools used**: Claude Code (Sonnet + Opus), m2c1, Playwright MCP, Supabase MCP, GitHub MCP, Context7 MCP, Exa MCP, Hostinger MCP

---

*Built with [Claude Code](https://claude.ai/claude-code) + [m2c1](https://github.com/grandamenium/m2c1) during the Skool Hackathon, March 2026.*
