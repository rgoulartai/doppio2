# Doppio

AI literacy PWA — transforms non-technical users from "ChatGPT as Google" to "AI coworker bosses" in 20 minutes via curated social video demos. Built for the Skool Hackathon (deadline: March 8, 2026 noon EST).

## Quick Reference

| What | Where |
|------|-------|
| **TOP AUTHORITY** | `.claude/orchestration-doppio/DISCOVERY.md` — all product, tech, and scope decisions |
| **Implementation plan** | `.claude/orchestration-doppio/PHASES.md` — 29 tasks across 6 phases |
| **Progress tracker** | `PROGRESS.md` — task status, regression results, blockers |
| **Task files** | `.claude/orchestration-doppio/tasks/phase-N/task-N-M.md` |
| **Orchestrator** | `.claude/orchestration-doppio/START.md` — how to run the system |
| **Research** | `.claude/orchestration-doppio/research/` — 7 research files |
| **Skills** | `.claude/skills/` — 8 project-specific skills |

## Authority Rule

**DISCOVERY.md overrides everything.** If any file contradicts DISCOVERY.md, follow DISCOVERY.md. If still unsure, ask the user.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| PWA | vite-plugin-pwa v0.21.x + Workbox |
| Database + Auth | Supabase (anonymous auth) |
| Video embeds | lite-youtube-embed + TikTok direct iframe |
| Routing | React Router v6 |
| Animations | canvas-confetti |
| Analytics | @vercel/analytics + Supabase custom events |
| Deploy | Vercel Hobby → doppio.kookyos.com |

## Scope Constraints (DO NOT implement)

No AI backend, no user login/accounts, no daily streaks, no Instagram Reels embeds, no multi-language support, no custom prompt builder, no social features, no payments, no admin dashboard.

## Git Workflow

- Branch from main: `task/N-M-<short-description>`
- Merge to main after tests pass
- Deploy to production: `vercel --prod`
- Production URL: `https://doppio.kookyos.com`

## Environment Variables

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Both are safe to expose client-side. Set in `.env` locally and in Vercel Dashboard for production.

## Dev Commands

```bash
npm run dev          # Start dev server → localhost:5173
npm run build        # Build to dist/
npm run preview      # Preview built app
npx vercel --prod    # Deploy to production
```

## Skills — Read Before Starting Any Task

| Skill | Use When |
|-------|----------|
| `doppio-architecture` | Starting ANY task — orientation and data flows |
| `pwa-vite-setup` | PWA manifest, Service Worker, install prompts |
| `supabase-anonymous-progress` | Progress schema, auth, offline-first sync |
| `video-embed-facade` | VideoCard, YouTube, TikTok embeds |
| `doppio-analytics` | Event tracking, Vercel Analytics, Supabase events |
| `doppio-content-schema` | content.json schema, video IDs, prompts |
| `canvas-confetti-gamification` | Confetti, progress bar, completion screens |
| `vercel-deploy-custom-domain` | Deploy, DNS, vercel.json, env vars |

## Key Files

| File | Purpose |
|------|---------|
| `src/data/content.json` | All video IDs, prompts, resource links — source of content truth |
| `src/lib/supabase.ts` | Supabase client (singleton) |
| `src/lib/progress.ts` | Progress read/write (localStorage + Supabase sync) |
| `src/lib/analytics.ts` | track() helper for Supabase custom events |
| `src/lib/tryit.ts` | openTryIt() — opens AI tool + copies prompt to clipboard |
| `src/hooks/useProgress.ts` | React hook for progress state |

## MCP Servers

| Server | Purpose |
|--------|---------|
| Playwright | Browser testing on localhost + production |

## For Subagents

If you are a subagent spawned to execute a task:

1. Read PROGRESS.md first — confirm your task is next and dependencies are done
2. Read your task file at `.claude/orchestration-doppio/tasks/phase-N/task-N-M.md`
3. Read ALL skills listed in your task's "Skills to Read" section
4. Follow the Task Execution Protocol in PHASES.md
5. Update PROGRESS.md when done (status → `done`, add branch + date + notes)
6. Never implement anything excluded in the Scope Constraints above
7. When in doubt: follow DISCOVERY.md, not intuition
