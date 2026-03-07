# Doppio Orchestrator

When `/start` is invoked, this orchestrator manages sequential execution of all 29 tasks across 6 phases. Designed for **fully autonomous execution** with minimal human interruption.

---

## Startup Sequence

1. **Read PROGRESS.md** at `/Users/renatosgafilho/Projects/KOOKY/Doppio/PROGRESS.md` — determine what's done and what's next
2. **Read PHASES.md** at `.claude/orchestration-doppio/PHASES.md` — load the full plan
3. **Check Human Steps** in PROGRESS.md — if next task requires human action, ask the user first
4. **Identify next task** — lowest-numbered pending task whose dependencies are all `done`
5. **Execute the task** — spawn a general-purpose subagent (see below)
6. **After task completes** — verify PROGRESS.md was updated, then repeat from step 3

---

## Spawning a Subagent

For each task, spawn a `general-purpose` subagent via the Task tool with this prompt:

```
You are executing Task N.M for Doppio — an AI literacy PWA.

## Your Task File
Read your full task specification at:
/Users/renatosgafilho/Projects/KOOKY/Doppio/.claude/orchestration-doppio/tasks/phase-N/task-N-M.md

## Execution Protocol

### Phase 0: Orient
- Read PROGRESS.md at /Users/renatosgafilho/Projects/KOOKY/Doppio/PROGRESS.md to confirm this task is next
- Read your task file for full spec, acceptance criteria, files to create/modify
- Read ALL skill files listed in your task's "Skills to Read" section
- Read relevant research files listed in your task

### Phase 1: Explore & Plan
- Explore the current codebase at /Users/renatosgafilho/Projects/KOOKY/Doppio/
- Understand what prior tasks have built (check src/, package.json, etc.)
- Plan your approach before writing code

### Phase 2: Implement
- Working directory: /Users/renatosgafilho/Projects/KOOKY/Doppio/
- Create feature branch: git checkout -b task/N-M-<short-description>
- Write code following skill guidance and existing patterns
- Follow DISCOVERY.md as top authority for all decisions

### Phase 3: Test
- Run ALL testing criteria from your task file
- For UI tasks: use Playwright MCP to test on localhost:5173
- Start dev server if needed: npm run dev (runs on localhost:5173)
- Verify every acceptance criterion passes before marking done

### Phase 4: Complete
- Update PROGRESS.md: change task status to `done`, add branch name, date, and notes
- Commit: git add -A && git commit -m "Task N.M: <description>"
- Merge to main: git checkout main && git merge task/N-M-<description>

## Key File Locations
- DISCOVERY.md (TOP AUTHORITY): .claude/orchestration-doppio/DISCOVERY.md
- PHASES.md: .claude/orchestration-doppio/PHASES.md
- Skills: .claude/skills/<skill-name>/SKILL.md
- Research: .claude/orchestration-doppio/research/
- Task files: .claude/orchestration-doppio/tasks/phase-N/task-N-M.md

## Available Tools
- Bash: npm, git, file operations
- Read/Write/Edit/Glob/Grep: file management
- Playwright MCP: browser testing and automation
- WebSearch: researching video IDs, verifying URLs (Task 2.2 especially)

## Environment
- Working directory: /Users/renatosgafilho/Projects/KOOKY/Doppio/
- Dev server: npm run dev → localhost:5173
- Build: npm run build → dist/
- Deploy: vercel --prod
```

---

## Regression Task Prompt

```
This is REGRESSION Task N.R for Doppio.

Read your task file at: .claude/orchestration-doppio/tasks/phase-N/task-N-R.md

1. Deploy latest code to production: `vercel --prod`
2. Wait for deployment URL to be confirmed
3. Run ALL tests from all tasks in Phase N on the deployed production URL (https://doppio.kookyos.com)
4. Check browser console for errors (Playwright)
5. Screenshot key screens as evidence
6. If any test fails: create hotfix branch, fix, redeploy, retest until ALL green
7. Update PROGRESS.md: Phase N regression status + detailed results
8. Merge phase branch to main
```

---

## Final Phase (Phase 6) Task Prompt

```
This is E2E testing Task 6.X for Doppio.

Read your task file at: .claude/orchestration-doppio/tasks/phase-6/task-6-X.md

All testing in Phase 6 runs on the LIVE production URL: https://doppio.kookyos.com
1. Verify production is current and healthy before starting
2. Follow every test step in your task file exactly
3. Record pass/fail for each criterion
4. If any test fails: create hotfix, deploy, re-verify
5. Update PROGRESS.md with comprehensive results
6. Take screenshots as evidence for hackathon submission
```

---

## Orchestrator Rules

### Execution Order
- One task at a time (sequential — never parallel)
- Follow task numbering: 1.1 → 1.2 → 1.3 → 1.4 → 1.R → 2.1 → ...
- Complete all tasks in Phase N before Phase N+1

### Human Step Handling
Before spawning Task 1.3: ask user to create Supabase project and provide credentials
Before spawning Task 1.4: ask user to confirm Vercel account exists
After Task 1.4 regression: remind user to set Hostgator DNS CNAME record
After Phase 3: suggest user create Nano Banana teaser video

### Dependency Checking
Before spawning a task, verify in PROGRESS.md that all listed "Blocked by" tasks are `done`.

### Failure Handling (3-Tier Escalation)

**Tier 1**: Subagent self-recovers (debug inline, retry with different approach)
**Tier 2**: Orchestrator spawns targeted fix agent, then re-runs the original task
**Tier 3**: Escalate to user with: task number + what was tried + the error + suggested fix. Continue unblocked tasks while waiting.

### Phase Transitions
After regression task passes: update Phase Overview table in PROGRESS.md, announce phase complete.

### Session Boundaries
PROGRESS.md is the session continuity mechanism. If context is large, suggest user compact context and read PROGRESS.md to resume.

---

## File Locations

| File | Path | Purpose |
|------|------|---------|
| Progress tracker | `PROGRESS.md` | Task status, regression results, tool setup |
| Orchestrator | `.claude/orchestration-doppio/START.md` | This file |
| Discovery (TOP AUTHORITY) | `.claude/orchestration-doppio/DISCOVERY.md` | All product + tech decisions |
| Implementation plan | `.claude/orchestration-doppio/PHASES.md` | All 29 tasks with full specs |
| Task files | `.claude/orchestration-doppio/tasks/phase-N/task-N-M.md` | Per-task execution specs |
| Research | `.claude/orchestration-doppio/research/` | 7 research files |
| Skills | `.claude/skills/` | 8 project skills |

---

## Skills Available

| Skill | Path | Purpose |
|-------|------|---------|
| doppio-architecture | `.claude/skills/doppio-architecture/SKILL.md` | Project structure overview |
| pwa-vite-setup | `.claude/skills/pwa-vite-setup/SKILL.md` | PWA implementation |
| supabase-anonymous-progress | `.claude/skills/supabase-anonymous-progress/SKILL.md` | Auth + progress sync |
| video-embed-facade | `.claude/skills/video-embed-facade/SKILL.md` | Video embedding |
| doppio-analytics | `.claude/skills/doppio-analytics/SKILL.md` | Analytics setup |
| doppio-content-schema | `.claude/skills/doppio-content-schema/SKILL.md` | content.json schema |
| canvas-confetti-gamification | `.claude/skills/canvas-confetti-gamification/SKILL.md` | Gamification UI |
| vercel-deploy-custom-domain | `.claude/skills/vercel-deploy-custom-domain/SKILL.md` | Deploy + DNS |
