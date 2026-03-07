# Changelog

All notable changes to Doppio are documented here.
Format: `[YYYY-MM-DD HH:MM] Category — Description`

Categories: `Planning` | `Research` | `Architecture` | `Content` | `Dev` | `Deploy` | `Tooling`

---

## 2026-03-06

**[15:12] Planning** — Brain dump written from Perplexity brainstorming session

**[15:13] Planning** — Budget constraints documented

**[15:14] Tooling** — m2c1 orchestration skill launched; project scaffold initialized

**[15:22–15:24] Research** — Parallel research wave completed across 7 domains:
  - Supabase anonymous progress sync
  - Video embedding (YouTube, TikTok, facade pattern)
  - Analytics (Vercel + Supabase custom events)
  - PWA implementation (vite-plugin-pwa, Workbox, iOS quirks)
  - AI video generation (Nano Banana, Sora, FFmpeg)
  - Gamification UX (canvas-confetti, badges, completion screens)
  - Content curation (YouTube channels per level, backup strategy)

**[15:27] Architecture** — PRD.md generated from brain dump

**[15:33] Architecture** — DISCOVERY.md completed (3 rounds of Q&A, all decisions resolved)

**[15:35–15:37] Architecture** — 8 implementation skill files generated:
  doppio-architecture, supabase-anonymous-progress, doppio-analytics,
  pwa-vite-setup, vercel-deploy-custom-domain, video-embed-facade,
  canvas-confetti-gamification, doppio-content-schema

**[15:38] Tooling** — PROJECT_TIMELINE.md created with full session history

**[15:38] Tooling** — Auto-timeline updater (launchd, every 30 min) set up

**[~16:00] Tooling** — README.md written (workflow, m2c1, subagents, Obsidian, best practices)

**[~16:00] Tooling** — CHANGELOG.md created; auto git commit/push (every 30 min) set up

**[~16:00] Dev** — Task 1.1: React 18 + Vite + Tailwind scaffold complete — React Router v6, routes (/, /learn, /complete), build passes

**[~16:20] Dev** — Task 1.2: PWA setup — vite-plugin-pwa configured, 4 icon sizes generated, iOS + Android install banners, Service Worker registered

**[~17:00] Dev** — Task 1.3: Supabase schema applied — `user_progress` + `analytics_events` + RLS; `supabase.ts` + `auth.ts` created; anonymous auth wired

**[~17:35] Deploy** — Task 1.4: Vercel deploy → doppio-gold.vercel.app; CSP headers; Vercel Analytics wired; custom domain `doppio.kookyos.com` configured (A record → 76.76.21.21)

**[~17:40] Content** — DISCOVERY.md updated — TikTok confirmed ✅, Instagram Reels excluded ❌ (FB OAuth infeasible client-side); `resourceLink` field added per card

**[~17:45] Content** — Task 2.1: `src/types/content.ts` (4 interfaces) + `src/data/content.json` (9 cards + 5 resources) created; `resolveJsonModule` added; tsc + build pass

**[~17:55] Content** — Task 2.2: All 9 YouTube video IDs replaced with verified embeddable IDs; 6 backup IDs added; all 9 oEmbed return HTTP 200

**[~18:00] Content** — Task 2.3: Try-it URL patterns verified — ChatGPT `?q=`, Perplexity `?q=`, Claude `?q=` all confirmed working; `<Toaster />` added to App.tsx

**[~18:10] Dev** — Task 3.1: Landing page — `HeroVideo.tsx` + `Landing.tsx`; LOST→AI BOSS headline, START NOW CTA, `?ref=badge` banner; dark editorial redesign

**[~18:30] Dev** — Task 3.2: VideoCard component — `YouTubeEmbed.tsx` (lite-youtube-embed), `TikTokEmbed.tsx` (iframe), IntersectionObserver lazy load, completion overlay, Mark as done button

**[~18:50] Dev** — Task 3.3: Try it CTA — `src/lib/tryit.ts`, `TryItButton.tsx` with clipboard copy, toast notification, analytics tracking, inline fallback

**[~19:30] Dev** — Task 3.4: Progress tracking — `src/lib/progress.ts`, `useProgress.ts` hook, `ProgressBar.tsx` (CSS-only + ARIA); localStorage-first, Supabase union-merge sync on window.focus

**[~21:00] Dev** — Task 4.1: Level navigation & card flow — `LevelHeader`, `LevelNav` (3 tabs + completion checkmarks), `CardList`, `LevelCompleteScreen` stub; `Learn.tsx` rebuilt

**[~21:05] Dev** — Task 4.2: Level completion screen — canvas-confetti on mount, level-specific copy, Continue/Share CTAs with Web Share API + clipboard fallback + analytics

**[~21:07] Dev** — Landing redesign — KOOKY dark editorial aesthetic applied; trial/payment flow scaffolded; paid-user pages added (Bookmarks, Profile, VideoShare, DevLogin dev tool)

**[~21:30] Dev** — Task 4.3: Final completion screen — `Complete.tsx` with double confetti burst (center + side cannons), "You're an AI Manager! 🎉" headline, Share My Badge CTA, `ResourceLinks` component (5 items from content.json)

**[~21:45] Dev** — Task 4.4: PWA install analytics — `track('pwa_installed')` wired to `appinstalled` event in `usePWAInstall.ts`

**[~21:46] Deploy** — Phase 4 regression PASS — production deployed to `https://doppio.kookyos.com`; full E2E Playwright verified (landing, /learn, /complete, Android banner)

---

## 2026-03-07 (post-submission)

**[~10:30] Dev** — Medal system: `CardList.tsx` layout polish — increased card gap to `gap-8`, added horizontal divider between cards on mobile, `pt-6 pb-10` spacing

**[~10:30] Dev** — Medal system: `VideoCard.tsx` — "Video by" label renamed to "Original creator"; creator link gets `title` tooltip; fallback text changed to "Unknown"

**[~10:30] Content** — `content.json` — L1C2 video updated (SlZLZRJ450M → 9qwacTcHbTw, creator: Tutorials With Alex)

**[~10:30] Deploy** — `vercel.json` — `unsafe-inline` removed from `script-src` (CSP hardening); `Strict-Transport-Security` header added (HSTS max-age 1 year, includeSubDomains, preload)

**[~16:00] Dev** — KOOKY-outlaw AI Feed integration — `supabase/migrations/002_youtube_ai_videos.sql` created: `youtube_ai_videos` table (level 1–3, rank, title, channel, url, reason, session_date) with RLS public-read policy

**[~16:00] Dev** — KOOKY-outlaw AI Feed integration — `src/lib/youtube-ai-videos.ts` created: `fetchTodaysVideos()` queries today's rows ordered by level + rank

**[~16:00] Dev** — KOOKY-outlaw AI Feed integration — `src/pages/AIFeed.tsx` created: standalone `/ai-feed` page with sticky header, loading spinner, empty state, and video cards grouped by level (🌱/⚡/🚀) with rank badge, channel, reason, and YouTube link

**[~16:00] Dev** — `src/App.tsx` updated — `/ai-feed` route added

**[~16:00] Dev** — `src/pages/Profile.tsx` updated — "Daily AI Videos" section added with "Today's AI Videos" button navigating to `/ai-feed`

**[~16:00] Infra** — Hostinger VPS HTTP gateway enabled — `ENABLE_GATEWAY=true`, `GATEWAY_PORT=8080` added to `/opt/kooky-outlaw/.env`; port `8080:8080` published in `docker-compose.yml`; container recreated; `GET /health → {"status":"ok"}` verified

**[~16:00] Deploy** — Supabase migration `002_youtube_ai_videos` applied to production project `tqknjbjvdkipszyghfgj`

**[~16:15] Deploy** — Feature branch `feature/kooky-outlaw-youtube-feed` merged to `main` and pushed — build passes (126 modules, 0 TS errors)

---
<!-- Auto-commits will append entries above this line -->
