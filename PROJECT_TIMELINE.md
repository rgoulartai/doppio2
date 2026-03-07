# Doppio — Project Timeline

> PWA that transforms non-technical users from "ChatGPT-as-Google" to "AI coworker bosses" in 20 minutes.
> Built during a 72-hour hackathon.

---

## March 6, 2026

| Time | Step | Description |
|------|------|-------------|
| **Pre-session** | Ideation | Brainstormed hackathon idea with Perplexity AI → [session link](https://www.perplexity.ai/search/i-ll-be-participating-on-a-72-ahC6A.jrQb2_JpS_uckEtA) |
| **14:20** | Project created | `KOOKY/Doppio` directory initialized |
| **14:44** | Tooling setup | Claude Code configured for project (`.claude/settings.local.json`) |
| **~15:00** | Repo created | Public GitHub repository created → [github.com/rgoulartai/doppio](https://github.com/rgoulartai/doppio) |
| **15:09** | Obsidian vault | Obsidian initialized as project knowledge base |
| **15:09** | Claude session | Opened Antigravity terminal with `ENABLE_TOOL_SEARCH=true claude` |
| **15:09** | m2c1 skill | First prompt to Claude Sonnet 4.6 — launched [m2c1](https://github.com/grandamenium/m2c1) orchestration skill |
| **15:12** | Brain Dump | Pasted Perplexity brain dump into Claude → Phase 0 (Setup) + Phase 1 (Brain Dump to PRD) initiated |
| **15:13** | Budget noted | Budget constraints documented |
| **15:14** | Scaffold | Orchestration directory structure created (research, reports, skills, tasks) |
| **15:22** | Research wave | Phase 2 begins — parallel research across 7 domains: |
| **15:22** | → Supabase | Anonymous progress sync research |
| **15:22** | → Video embedding | YouTube / TikTok / Reels / X oEmbed strategies |
| **15:23** | → Analytics | Lightweight analytics options for PWA |
| **15:23** | → PWA implementation | Vite PWA plugin, service workers, offline support |
| **15:23** | → AI video generation | Researched AI-generated content options |
| **15:24** | → Gamification UX | Streaks, confetti, progress bars, badge mechanics |
| **15:24** | → Content curation | Social video curation strategy for 3-level learning path |
| **15:27** | PRD | `PRD.md` generated — product requirements finalized |
| **15:32** | Obsidian review | Workspace arranged, documents reviewed in Obsidian |
| **15:33** | Discovery | `DISCOVERY.md` completed — Phase 3 done |
| **15:35** | Skills generated | Implementation skills authored for each domain: |
| **15:35** | → Architecture | Overall app architecture skill |
| **15:35** | → Supabase anonymous progress | LocalStorage → Supabase sync pattern |
| **15:35** | → Analytics | Doppio-specific analytics skill |
| **15:36** | → PWA + Vite | Full PWA setup with Vite configuration |
| **15:36** | → Vercel deploy | Deploy + custom domain configuration |
| **15:36** | → Video embed facade | Facade pattern for multi-platform video embeds |
| **15:37** | → Gamification | Canvas confetti + streak mechanics |
| **15:37** | → Content schema | Video card content schema and data model |
| **15:38** | Timeline created | This file committed to repo |

---

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | React + Tailwind + Vite |
| PWA | Vite PWA Plugin + Service Worker |
| Progress | localStorage → Supabase (anonymous) |
| Video | YouTube / TikTok / Reels / X oEmbed |
| Deploy | Vercel |
| AI backend | None — static curation |

---

## Naming History

`AICoworker → AgentUnlock → AIgnition → IronSpark → AgentDuo → Ignis → **Doppio**`

*Doppio: Italian for "double shot" — double your AI skills, double your output.*

---

## Pitch

> "20 minutes from ChatGPT Googler to Claude Coworker boss — curated through Crowd Knowledge magic. No coding, no prompting, just natural language superpowers."

---

## Activity Log

<!-- AUTO-TIMELINE:START -->

### March 6, 2026 — Implementation Sprint

| Time | Task | Description |
|------|------|-------------|
| **~15:38** | Budget tracker | Hourly screenshot tracker set up — Playwright + launchd, captures balance card every hour (Mar 6 5pm → Mar 8 noon) |
| **~16:00** | Task 1.1 | React 18 + Vite + Tailwind scaffold complete. All 3 routes verified (/, /level/:id, /complete). Build passes. |
| **~16:20** | Task 1.2 | PWA setup — vite-plugin-pwa, icons (4 sizes), iOS + Android install banners, Service Worker registered |
| **~16:40** | Handoff #1 | Session handoff. content.json skeleton + `resourceLink` schema committed. |
| **~17:00** | Task 1.3 | Supabase schema applied — `user_progress` + `analytics_events` + RLS. `supabase.ts` + `auth.ts` created. Anonymous auth wired. |
| **~17:35** | Task 1.4 | Vercel deploy → doppio-gold.vercel.app. CSP headers. Analytics wired. Custom domain `doppio.kookyos.com` configured. |
| **~17:40** | DISCOVERY.md | D62: TikTok ✅ Instagram ❌ (FB OAuth infeasible client-side). D63: `resourceLink` field added per card. |
| **~17:45** | content.json | `resourceLink` added to all 9 cards. 6 cards have real links. `completionResources` expanded to 7 entries. |
| **~17:50** | Budget tracker fix | Fixed Python path + page timeout + crop logic. Confirmed working. |
| **~17:55** | Video curation | All 9 YouTube candidates identified via 5 parallel search passes. Awaiting user approval before writing IDs to content.json. |
| **~17:59** | Handoff #2 | Session handoff — video IDs pending approval, UI build queued for March 7. |
| **~21:00** | Task 4.1 + 4.2 | Level navigation, card flow, level completion screens with confetti and share. LevelHeader, LevelNav, CardList, LevelCompleteScreen all built and verified. |
| **~21:07** | Session handoff | Landing redesign (KOOKY dark editorial), trial/payment flow, paid user features (bookmarks, share, profile, VideoShare page, DevLogin dev tool). |
| **~21:30** | Task 4.3 | Final completion screen — double confetti burst, "You're an AI Manager!" headline, Share My Badge CTA, 5 resource links. Playwright verified. |
| **~21:45** | Task 4.4 | PWA install analytics — track('pwa_installed') wired on appinstalled event. |
| **~22:00** | Task 4.R | Phase 4 regression in progress — production deploy + full E2E journey test. |

<!-- AUTO-TIMELINE:END -->
