# Doppio — Step By Step Build Walkthrough

A complete account of how Doppio was built during the Skool Hackathon (March 6–8, 2026) using an AI-driven workflow in Claude Code. If you want to replicate this kind of project, follow these steps.

---

## Pre-Session Preparation

### 1. Brainstorm the idea

Before writing a single line of code, use a reasoning-capable AI to stress-test the idea. For Doppio, this was a Perplexity Deep Research session:

> [Perplexity brainstorm session](https://www.perplexity.ai/search/i-ll-be-participating-on-a-72-ahC6A.jrQb2_JpS_uckEtA)

The output was a structured brain dump covering: core concept, UX flow, tech stack hypothesis, naming options, and a market validation check. That document became the raw input to Claude.

The full brain dump is preserved in [`docs/Brain Dump.md`](Brain%20Dump.md).

### 2. Create a public GitHub repository

Before opening Claude Code, create the repository:
- Go to GitHub → New repository
- Name it (e.g., `doppio`)
- Set it to public (required for free Vercel deployments)
- Don't initialize with README — Claude will handle that

→ [github.com/rgoulartai/doppio](https://github.com/rgoulartai/doppio)

---

## Setting Up Claude Code

### 3. Launch Claude Code with tool search enabled

```bash
ENABLE_TOOL_SEARCH=true claude
```

The `ENABLE_TOOL_SEARCH=true` environment variable enables the `ToolSearch` capability, which allows Claude to discover and load MCP-provided tools dynamically during the session. Without it, MCP tools registered in settings must be declared explicitly.

The terminal application used was **Antigravity** — a terminal emulator with good split-pane support for watching Claude work while keeping a build log visible.

### 4. Verify MCP servers are loaded

Before starting any project work, confirm that the MCP servers you need are registered and available. The servers used for this project:

| Server | Purpose |
|--------|---------|
| Playwright | UI testing + budget screenshots |
| Supabase | Schema migrations + auth config |
| GitHub | Repository operations |
| Context7 | Up-to-date library documentation |
| Exa | Semantic web search for video curation |
| Hostinger MCP | DNS record management |
| QMD | KOOKY OS knowledge base search |

MCP servers are configured in `~/.claude/settings.json` under the `mcpServers` key.

---

## Phase 0–3: From Brain Dump to Full Plan (~30 minutes)

### 5. Invoke m2c1 with the brain dump

**First prompt:**
```
Let's use the m2c1 skill to start a new project
```

**Second prompt** (when Claude asked for input):
```
[paste the full Brain Dump.md content]
```

m2c1 ran its pipeline automatically:
- Created `.claude/orchestration-doppio/` directory structure
- Generated `PRD.md` from the brain dump
- Spawned 7 parallel research subagents (see Step 6)
- Ran 3 rounds of Q&A with Claude → produced `DISCOVERY.md`
- Created 8 implementation skill files (one per technical domain)
- Generated `PHASES.md` — 29 tasks across 6 phases

### Why m2c1, not Plan Mode

Claude Code's built-in plan mode is designed for single-task planning — it pauses execution and waits for human approval before proceeding. m2c1 is a different category of tool: it's a full project orchestration pipeline.

Using plan mode inside m2c1 would interrupt the autonomous pipeline at every step. The two systems conflict: m2c1 runs sequentially and autonomously; plan mode expects approval gates.

**Rule of thumb:** Use plan mode for ad-hoc tasks. Use m2c1 for full projects.

### Why Opus for PRD and DISCOVERY, Sonnet for Everything Else

The `PRD.md` and `DISCOVERY.md` are the most consequential documents in the project. Every architectural decision made here propagates through all 29 implementation tasks. A wrong call at this layer is the most expensive kind of mistake to fix.

**Opus** (Claude's most capable model) was used for:
- PRD generation from the brain dump
- DISCOVERY.md Q&A rounds (3 rounds, 63 decisions)

Opus excels at synthesizing competing requirements, identifying edge cases before they become blockers, and making nuanced architectural trade-offs. The cost premium over Sonnet is negligible compared to the cost of rebuilding tasks because a foundation decision was wrong.

**Sonnet** (faster, significantly cheaper) was used for:
- All 29 implementation tasks
- All subagent research
- File operations, testing, regression
- /handoff and /pickup sessions

This model switching strategy is also a **budget management tool**. See the Budget section below.

### 6. Research wave — 7 parallel subagents

m2c1 spawned 7 Claude subagents simultaneously, each researching a different domain. Each subagent was an independent Claude instance given a specific mission, writing its output to `.claude/orchestration-doppio/research/`.

All 7 ran in parallel. Total time: ~5 minutes for domains that would have taken hours sequentially.

### 7. Discovery Q&A — locking all decisions

After research, m2c1 ran structured Q&A rounds with Claude to resolve every open question. The output was `DISCOVERY.md` — 63 decisions (D1–D63) covering product identity, user experience, tech stack, video platforms, PWA behavior, gamification, analytics, and scope exclusions.

**`DISCOVERY.md` is the single source of authority.** It overrides all other files. Any time two documents contradict each other, DISCOVERY.md wins. Any time Claude is uncertain about a decision, it reads DISCOVERY.md.

---

## Budget Management

The entire project runs on **$156.08** in Claude API credits — a hard cap with no ability to add more.

### The tracking system

`scripts/budget_screenshot.py` runs automatically every hour from March 6 5 PM through March 8 noon (the full hackathon window). It uses the Playwright MCP server to:
1. Authenticate to `platform.claude.com/settings/billing` using saved browser cookies
2. Take a cropped screenshot of the credit balance card
3. Save the screenshot to `screenshots/budget_YYYY-MM-DD_HH-MM.png`
4. Append a timestamped entry to `Budget.md`

This gives a real-time view of burn rate. If spend accelerates unexpectedly, it's visible immediately.

One-time setup:
```bash
python3 scripts/budget_screenshot.py --setup
# A browser opens → log in → press Enter → cookies saved to scripts/budget_auth.json
```

After that, launchd runs it automatically on schedule.

### The burn rate

| Moment | Balance | Spent |
|--------|---------|-------|
| Session start (March 6, 2:20 PM) | $156.08 | — |
| Phase 1–2 complete (~6:00 PM) | ~$123.44 | ~$32.64 |
| Phase 3 complete (~8:00 PM) | ~$90.03 | ~$33.41 |
| Phase 4 complete (~10:00 PM) | ~$77.81 | ~$12.22 |
| **Total Phases 1–4** | — | **~$78.27** |
| **Remaining for Phases 5–6** | **~$77.81** | — |

The decreasing per-phase cost reflects the efficiency gain as the codebase stabilizes and tasks become more surgical.

---

## Phase 1–4: Implementation

### 8. Running implementation tasks

Each task had a spec file at `.claude/orchestration-doppio/tasks/phase-N/task-N-M.md`. The session workflow:

1. `/pickup` — load previous handoff, orient Claude
2. Tell Claude: "Start task N.M"
3. Claude reads the task spec, loads relevant skills, implements
4. Verify: `npm run build` + `tsc --noEmit` + visual Playwright check
5. Update `PROGRESS.md` — status → done, add date + notes
6. `/handoff` when context approached 60%

### 9. The /handoff + /pickup rhythm

Claude's context window fills over time. At ~60–80% capacity, quality degrades and earlier decisions drop out of working memory.

**`/handoff`** captures:
- Everything accomplished in the session
- All files created/modified
- Current git state (branch, commits, staged changes)
- Outstanding tasks and their status
- Next steps in priority order

The handoff is written to `agents/sessions/YYYY-MM-DD/HANDOFF-PROMPT-HH-MM-SS.md`.

**`/pickup`** at the start of the next session:
- Finds the latest handoff file
- Reconstructs full project context
- Presents next steps immediately

This pattern means sessions can be short and focused. A session doesn't need to recap everything — it just picks up exactly where the last one left off.

### 10. Regression testing after each phase

Each phase ends with a `.R` regression task — a full Playwright end-to-end test on production, verifying:
- Build exits 0
- Key routes load correctly
- Core interactions work (Mark as done, TryIt, progress tracking)
- No console errors

All 4 completed phases have passing regressions on production (`https://doppio.kookyos.com`).

### 11. Git commit discipline

Commits were made at the end of each task (not phase). Each commit message references the task number and describes what changed:

```
Task 4.3: final completion screen
Task 4.4: pwa_installed analytics
docs: Phase 4 regression PASS
```

Auto-commits run every 30 minutes via `scripts/auto_commit_push.sh` as a safety net.

---

## UI Design — From Apple.com to KOOKY Dark Editorial

### Original plan

The initial design brief called for an **Apple.com aesthetic**: clean, premium, minimal.

Key principles (still valid):
- Large, confident headlines
- SF Pro or system-sans fallback; generous line-height
- Near-white backgrounds, deep near-black text, one accent color used sparingly
- Subtle, purposeful motion (fade-ins, no spinning loaders)
- Clean card borders or subtle shadows — never both
- Pill-shaped primary buttons, high contrast
- Mobile-first: every component starts at 375px

### What shipped

During Phase 3 implementation, the aesthetic evolved to a **KOOKY dark editorial** style — the house aesthetic of the KOOKY OS brand that Doppio is part of. This is darker, bolder, and more opinionated than the original Apple.com concept, while preserving the same core principles of clarity, whitespace, and single-accent color discipline.

The change was driven by brand alignment — Doppio lives at `doppio.kookyos.com` and benefits from visual consistency with the KOOKY OS ecosystem.

---

## What Would Be Done Differently

**Start with `content.json` first.** Video curation and prompt writing took more iteration than expected. The content is the heart of the app — getting it right before writing any React components saves significant rework.

**Tighter scope gates.** Between Phases 3 and 4, extra pages (Trial, Payment, Profile, Bookmarks, DevLogin) were built outside the defined MVP scope. While useful as future extensions, they added technical debt and required explicit tracking. The DISCOVERY.md scope exclusions existed for a reason.

**Earlier device testing.** The PWA install flow on iOS Safari has quirks that only appear on a real device. Simulating it in desktop Chrome DevTools is not sufficient.

**Nano Banana session earlier.** The landing page teaser video is a user-created deliverable (screenshot app → Nano Banana → 15s MP4 → compress → add to `public/`). Leaving this to late in the project creates deadline risk. It should be done immediately after Phase 3 UI is complete.
