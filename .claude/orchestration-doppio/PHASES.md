# Doppio - Implementation Phases

**Target**: Sunday March 8, 2026 12:00 PM EST (submission deadline)
**Execution**: Sequential phases, autonomous subagent execution
**Authority**: DISCOVERY.md overrides everything

---

## Scope Constraints (from DISCOVERY.md D51)

These are OUT of scope. Do NOT implement:
- Backend AI processing (zero LLM calls server-side)
- User accounts or login (anonymous Supabase auth only)
- Daily streaks mechanic
- Live demo playground (replaced by curated resource links)
- Instagram Reels embeds (requires Facebook App token — excluded)
- Multi-language support
- Custom prompt builder
- Social features (likes, comments, leaderboard)
- Payment or monetization
- Admin dashboard
- App store submission (PWA only)

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 18+ |
| Build tool | Vite | 5+ |
| Styling | Tailwind CSS | 3+ |
| PWA | vite-plugin-pwa + Workbox | 0.21.x |
| PWA icons | @vite-pwa/assets-generator | latest |
| Database + Auth | Supabase (Postgres + anonymous auth) | latest |
| Supabase client | @supabase/supabase-js | v2 |
| Video embeds | lite-youtube-embed (YouTube) + custom TikTok facade | latest |
| Routing | React Router | v6 |
| Animations | canvas-confetti | latest |
| Analytics | @vercel/analytics + Supabase custom events | latest |
| Toast notifications | react-hot-toast | latest |
| Deploy | Vercel (Hobby) | - |
| Domain | doppio.kookyos.com (Hostgator DNS → Vercel) | - |

---

## Skills Reference

All skills at `.claude/skills/`. Agents MUST read relevant skills before starting a task.

| Skill | Use When |
|-------|----------|
| `doppio-architecture` | Starting ANY task — orientation, file structure, data flows |
| `pwa-vite-setup` | PWA manifest, Service Worker, install prompts, offline |
| `supabase-anonymous-progress` | Progress schema, anonymous auth, sync pattern, useProgress hook |
| `video-embed-facade` | VideoCard component, YouTube lite-embed, TikTok iframe, lazy loading |
| `doppio-analytics` | Vercel Analytics setup, Supabase events table, track() helper |
| `doppio-content-schema` | content.json structure, TypeScript types, video IDs, prompts |
| `canvas-confetti-gamification` | Confetti, progress bar, card completion, level/final screens |
| `vercel-deploy-custom-domain` | Deploy setup, vercel.json, DNS config, env vars |

---

## Tools Reference

| Tool | Use For | Key Operations |
|------|---------|----------------|
| **Playwright MCP** | UI testing on localhost + production, PWA install verification | navigate, click, fill, screenshot, evaluate, console messages |
| **Bash** | npm commands, file ops, git | npm install, npm run dev, npm run build, git add/commit |
| **Read/Write/Edit** | File creation and modification | All source files |
| **Supabase Dashboard** | Schema creation, anonymous auth enable, analytics queries | Via Playwright or direct SQL in Supabase SQL editor |

---

## Testing Methods

| Method | Tool | Description |
|--------|------|-------------|
| Build verification | `npm run build` | Confirms TypeScript errors and Vite build |
| Dev server smoke test | Playwright MCP (localhost:5173) | Navigate all routes, verify rendering |
| Supabase integration | Playwright + Supabase Dashboard | Verify schema exists, anonymous auth works, rows inserting |
| PWA installability | Playwright + Chrome DevTools | Application → Manifest, Service Workers panel |
| Video embed test | Playwright localhost | Click video cards, verify facade loads, verify iframe loads on click |
| Try-it CTA test | Playwright localhost | Click Try it, verify new tab opens with correct URL/prompt |
| Analytics test | Supabase Dashboard | Query analytics_events table, verify rows after user actions |
| Mobile simulation | Chrome DevTools device emulation via Playwright | iPhone 12 + Pixel 5 profiles |
| Production smoke test | Playwright (doppio.kookyos.com) | Full user flow on live URL post-deploy |

---

## Phase Overview

| Phase | Goal | Tasks |
|-------|------|-------|
| 1: Scaffolding & Infra | Project setup, PWA, Supabase, Vercel | 5 |
| 2: Content Layer | content.json, video curation, resource links | 4 |
| 3: Core Learning UI | Landing page, VideoCard, Try-it CTA, progress | 5 |
| 4: Level Flow & Gamification | Navigation, completion screens, PWA prompts | 5 |
| 5: Analytics & Polish | Analytics, OG tags, icons, CSP, mobile polish | 5 |
| 6: E2E Testing | Full multi-angle testing on live deployment | 5 |
| **Total** | | **29** |

---

## Phase 1: Scaffolding & Infrastructure

**Goal**: Working project skeleton with PWA, Supabase, and Vercel configured. Nothing visible yet but the foundation is solid and deployed.

### Task 1.1: Scaffold React + Vite + Tailwind project

- **Objective**: Initialize the React + Vite project with Tailwind, React Router, and all core dependencies installed.
- **Dependencies**: None
- **Blocked by**: Nothing
- **Files**: `package.json`, `vite.config.ts`, `tailwind.config.js`, `src/main.tsx`, `src/App.tsx`, `index.html`, `.env.example`, `.gitignore`
- **Contracts**: Project structure established. All subsequent tasks depend on this layout:
  - `src/components/` — UI components
  - `src/hooks/` — custom React hooks
  - `src/lib/` — supabase.ts, progress.ts, analytics.ts
  - `src/data/` — content.json
  - `src/pages/` — Landing.tsx, Learn.tsx, Complete.tsx
  - `public/` — icons, og-badge.png, teaser.mp4 (placeholder)
- **Acceptance Criteria**:
  - [ ] `npm run dev` starts without errors on localhost:5173
  - [ ] `npm run build` completes without errors
  - [ ] React Router routes render: `/` (landing), `/learn` (placeholder), `/complete` (placeholder)
  - [ ] Tailwind CSS applied (verify with a test bg-blue-500 div)
  - [ ] `.env.example` with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- **Testing**:
  - [ ] Build: `npm run build` exits 0
  - [ ] Browser: Playwright navigate localhost:5173, verify root renders
- **Skills**: `doppio-architecture`
- **Packages to install**: `react`, `react-dom`, `react-router-dom`, `@supabase/supabase-js`, `canvas-confetti`, `@types/canvas-confetti`, `lite-youtube-embed`, `react-hot-toast`, `@vercel/analytics`, `vite-plugin-pwa`, `@vite-pwa/assets-generator`

---

### Task 1.2: PWA Setup (manifest, Service Worker, icons)

- **Objective**: App is installable as a PWA on iOS Safari and Android Chrome.
- **Dependencies**: Task 1.1
- **Blocked by**: Task 1.1
- **Files**: `vite.config.ts` (update), `index.html` (add apple-touch-icon meta tags), `public/pwa-source.png` (512×512 source icon with opaque background), generated icons in `public/`
- **Contracts**:
  - App manifest: `name: "Doppio"`, `short_name: "Doppio"`, `display: "standalone"`, `start_url: "/"`, `theme_color: "#1a1a2e"` (or brand color TBD)
  - Service Worker: CacheFirst for app shell, autoUpdate, navigateFallback: '/index.html'
- **Acceptance Criteria**:
  - [ ] Chrome DevTools → Application → Manifest shows all fields populated
  - [ ] Chrome DevTools → Application → Service Workers shows SW registered + active
  - [ ] `npm run generate-pwa-assets` generates all icon sizes (192, 512, apple-touch-icon, etc.)
  - [ ] iOS: Custom install banner component exists (shows when isIOS && isSafari && !isStandalone)
  - [ ] Android: BeforeInstallPromptEvent captured and deferred; install button triggers it
  - [ ] App shell loads offline (navigate to localhost:5173, go offline in DevTools, reload — should still render)
- **Testing**:
  - [ ] Playwright: navigate localhost:5173, open DevTools Application tab, verify manifest
  - [ ] Playwright: verify SW registered
  - [ ] Manual: Go offline in Chrome DevTools, reload — app renders (videos show "Connect to watch")
- **Skills**: `pwa-vite-setup`, `doppio-architecture`

---

### Task 1.3: Supabase Project Setup

- **Objective**: Supabase project created with schema, RLS, and anonymous auth enabled. Supabase client connected from the app.
- **Dependencies**: Task 1.1
- **Blocked by**: Task 1.1
- **Files**: `src/lib/supabase.ts`, `.env` (with real values), `supabase/migrations/001_initial.sql` (schema DDL)
- **Contracts**:
  - Supabase client exported from `src/lib/supabase.ts` as `supabase`
  - Tables: `user_progress` (D26), `analytics_events` (D27)
  - Anonymous auth enabled in Dashboard
- **Acceptance Criteria**:
  - [ ] Supabase project created (new project, not shared)
  - [ ] Anonymous sign-ins enabled in Authentication → Settings
  - [ ] `user_progress` table created with correct schema + unique constraint
  - [ ] `analytics_events` table created
  - [ ] RLS policies on `user_progress`: select, insert, upsert by `auth.uid() = user_id`
  - [ ] `src/lib/supabase.ts` creates and exports client using env vars
  - [ ] `supabase.auth.signInAnonymously()` succeeds in browser (console verify)
  - [ ] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in `.env` file
- **Testing**:
  - [ ] Browser console: `supabase.auth.signInAnonymously()` returns user with UUID
  - [ ] Supabase Dashboard: verify tables exist, anonymous user appears in auth.users
- **Skills**: `supabase-anonymous-progress`, `doppio-architecture`

---

### Task 1.4: Vercel Deploy + Custom Domain

- **Objective**: App deployed to Vercel, `doppio.kookyos.com` resolves and loads the app.
- **Dependencies**: Tasks 1.1, 1.2, 1.3
- **Blocked by**: Task 1.1 (need a buildable project)
- **Files**: `vercel.json`, `.env` (Vercel env vars set in Dashboard)
- **Contracts**: Production URL is `https://doppio.kookyos.com`. Preview URLs auto-generated per branch.
- **Acceptance Criteria**:
  - [ ] Vercel project linked to Git repository
  - [ ] `vercel.json` exists with rewrites (SPA routing) and CSP headers
  - [ ] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set in Vercel Dashboard (Production + Preview)
  - [ ] `vercel --prod` deploys successfully
  - [ ] `doppio.kookyos.com` resolves (DNS CNAME on Hostgator pointing to Vercel)
  - [ ] SSL certificate active (auto-provisioned by Vercel)
  - [ ] Vercel Analytics enabled in Dashboard
- **Testing**:
  - [ ] Playwright: navigate `https://doppio.kookyos.com`, verify app loads
  - [ ] Playwright: verify HTTPS (no mixed content warnings)
  - [ ] Supabase: verify anonymous auth works on production URL (not just localhost)
- **Skills**: `vercel-deploy-custom-domain`, `doppio-architecture`

---

### Task 1.R: Phase 1 Regression

- **Objective**: Full regression of Phase 1 — everything deployed and working end-to-end.
- **Dependencies**: Tasks 1.1, 1.2, 1.3, 1.4 complete
- **Testing**:
  - [ ] `npm run build` — no errors
  - [ ] Playwright localhost: loads, routes work, no console errors
  - [ ] Playwright production: `doppio.kookyos.com` loads, HTTPS, no console errors
  - [ ] Chrome DevTools: Manifest valid, SW active
  - [ ] Supabase: anonymous sign-in works on production domain
  - [ ] Screenshot: landing page (placeholder state)

---

## Phase 2: Content Layer

**Goal**: All content data defined in content.json with real video IDs and prompts. Every card has a real curated video and a tested "Try it" URL.

### Task 2.1: Create content.json with TypeScript types

- **Objective**: Define the complete content schema and create a fully-typed content.json with all 9 cards populated with placeholder video IDs and the real Try-it prompts from DISCOVERY.md D19.
- **Dependencies**: Task 1.1
- **Blocked by**: Task 1.1
- **Files**: `src/data/content.json`, `src/types/content.ts`
- **Contracts**:
  - `content.json` exports `DoppioContent` shape (see `doppio-content-schema` skill)
  - All 9 cards present with level/card/title/description/platform/videoId/aiTool/tryItPrompt/tryItUrl
  - Resource links array for completion screen (5 items minimum)
  - videoId fields contain placeholder values until Task 2.2
- **Acceptance Criteria**:
  - [ ] `src/types/content.ts` exports VideoCard, Level, DoppioContent types
  - [ ] `content.json` valid JSON, importable without TS errors
  - [ ] All 9 cards present (3 per level)
  - [ ] Level 1 cards: aiTool = "chatgpt", tryItUrl uses `https://chat.openai.com/`
  - [ ] Level 2 cards: aiTool = "claude", tryItUrl uses `https://claude.ai/new`
  - [ ] Level 3 cards: aiTool = "perplexity" or "claude", tryItUrl accordingly
  - [ ] tryItPrompt matches DISCOVERY.md D19 for each card
  - [ ] 5 resource links for completion screen
- **Testing**:
  - [ ] TypeScript: `tsc --noEmit` passes with content.json import
  - [ ] Manual: open content.json, verify all 9 cards present with correct structure
- **Skills**: `doppio-content-schema`, `doppio-architecture`

---

### Task 2.2: Video Curation (Find Real Video IDs)

- **Objective**: Replace all placeholder video IDs with real, working video URLs from YouTube or TikTok.
- **Dependencies**: Task 2.1
- **Blocked by**: Task 2.1
- **Files**: `src/data/content.json` (update videoId fields only)
- **Contracts**: All 9 cards have real, embeddable video IDs. 6 backup videos identified and documented in comments or a backup section.
- **Acceptance Criteria**:
  - [ ] All 9 videoId fields contain real YouTube video IDs or TikTok video IDs
  - [ ] All 9 videos are publicly accessible (not private, not deleted)
  - [ ] Each video clearly demonstrates the card's topic
  - [ ] L1: 3 ChatGPT everyday use videos (receipt/grocery, PDF summary, email)
  - [ ] L2: 3 Claude computer use videos (Downloads cleanup, booking, form filling)
  - [ ] L3: 2+ Claude Cowork or Perplexity videos (expense report, research dashboard)
  - [ ] 6 backup video IDs documented
  - [ ] TikTok thumbnailUrl populated for any TikTok videos (from oEmbed API)
- **Testing**:
  - [ ] Playwright localhost: open each of the 9 video card facades, click to load iframe, verify video plays
  - [ ] Verify no 404s or removed video errors in browser console
- **Skills**: `video-embed-facade`, `doppio-content-schema`
- **Sources**: Skill Leap AI, Matt Wolfe, Anthropic Official, Perplexity AI Official YouTube channels

---

### Task 2.3: Verify "Try it" URL Patterns

- **Objective**: Confirm all three AI tool URL deep-link patterns work and set up clipboard fallback for any that don't.
- **Dependencies**: Task 2.1
- **Blocked by**: Task 2.1
- **Files**: `src/data/content.json` (update tryItUrl if patterns don't work), `src/lib/tryit.ts`
- **Contracts**:
  - `src/lib/tryit.ts` exports `openTryIt(card: VideoCard)`: opens URL in new tab AND copies prompt to clipboard
  - If `?q=` param is not supported by a platform, `tryItUrl` points to the tool's base URL only, and clipboard is the primary mechanism
- **Acceptance Criteria**:
  - [ ] ChatGPT: test `https://chat.openai.com/?q=PROMPT` — does it prefill? If not, update to base URL
  - [ ] Claude: test `https://claude.ai/new?q=PROMPT` — does it prefill? If not, update
  - [ ] Perplexity: test `https://www.perplexity.ai/?q=PROMPT` — does it prefill? If not, update
  - [ ] `tryit.ts` opens URL in new tab + copies prompt to clipboard on every click
  - [ ] Toast notification appears: "Prompt copied! Paste it in [Tool Name]"
- **Testing**:
  - [ ] Playwright: click each "Try it" button, verify new tab opens, verify clipboard content
  - [ ] Manual: paste clipboard into ChatGPT/Claude/Perplexity, verify prompt appears
- **Skills**: `doppio-content-schema`

---

### Task 2.R: Phase 2 Regression

- **Objective**: All content is real, working, and correct.
- **Dependencies**: Tasks 2.1, 2.2, 2.3 complete
- **Testing**:
  - [ ] Playwright: loop through all 9 video cards, verify each loads without error
  - [ ] Playwright: click all 9 "Try it" buttons, verify correct URLs open
  - [ ] Supabase: no issues (Phase 2 is client-side content only)
  - [ ] `npm run build` — no errors

---

## Phase 3: Core Learning UI

**Goal**: User can navigate through all 3 levels and 9 cards, watch videos, and use "Try it" CTAs. Progress bar visible. Cards marked complete.

### Task 3.1: Landing Page

- **Objective**: Beautiful landing page with teaser video placeholder, headline, and "Start Level 1" CTA.
- **Dependencies**: Tasks 1.1, 2.1
- **Blocked by**: Task 1.1
- **Files**: `src/pages/Landing.tsx`, `src/components/HeroVideo.tsx`, `public/teaser-placeholder.mp4` (or poster image)
- **Contracts**:
  - Route `/` renders Landing.tsx
  - "Start Level 1" CTA navigates to `/learn`
  - `/?ref=badge` route also renders Landing.tsx with a badge banner above the hero
- **Acceptance Criteria**:
  - [ ] Landing page renders at `/`
  - [ ] Hero video element with `autoplay muted loop playsinline` attributes
  - [ ] Video shows placeholder (black screen or static poster image — real video added after Nano Banana session)
  - [ ] Headline: "20 minutes from ChatGPT user to AI manager"
  - [ ] Subheadline: "No coding. No prompting. Just natural language."
  - [ ] "Start Level 1" CTA button navigates to `/learn`
  - [ ] `/?ref=badge` shows a top banner: "🎉 [Name] is already an AI Manager! Start your journey →"
  - [ ] Mobile responsive (iPhone 12 width: 390px)
- **Testing**:
  - [ ] Playwright localhost: navigate `/`, verify headline text, click CTA → lands on `/learn`
  - [ ] Playwright: navigate `/?ref=badge`, verify badge banner visible
  - [ ] Playwright: screenshot at 390px width (mobile) and 1440px (desktop)
- **Skills**: `doppio-architecture`, `canvas-confetti-gamification`

---

### Task 3.2: VideoCard Component

- **Objective**: Reusable VideoCard component with facade/lazy-load pattern for YouTube and TikTok.
- **Dependencies**: Tasks 1.1, 2.1, 2.2
- **Blocked by**: Task 2.2 (needs real video IDs)
- **Files**: `src/components/VideoCard.tsx`, `src/components/VideoFacade.tsx`, `src/components/YouTubeEmbed.tsx`, `src/components/TikTokEmbed.tsx`
- **Contracts**:
  - `VideoCard` props: `{card: VideoCard, isCompleted: boolean, onComplete: () => void}`
  - Shows facade (thumbnail + play icon) until user clicks
  - On click: facade replaced with real iframe
  - Shows "Try it" button below video
  - Shows completion checkmark overlay when isCompleted=true
- **Acceptance Criteria**:
  - [ ] YouTube cards: use `lite-youtube-embed` web component
  - [ ] TikTok cards: use direct iframe `https://www.tiktok.com/embed/v2/{videoId}`
  - [ ] Both use 16:9 aspect ratio container (no layout shift)
  - [ ] Facade shows thumbnail + play button before click
  - [ ] Iframe loads on click (not before)
  - [ ] `mute=1&playsinline=1&rel=0` on YouTube
  - [ ] Completion checkmark: green circle with ✓, fades in (300ms opacity transition)
  - [ ] Offline: shows "📡 Connect to watch this video" message instead of facade
  - [ ] Mobile responsive
- **Testing**:
  - [ ] Playwright: navigate to `/learn` level 1, verify 3 video facades render
  - [ ] Playwright: click a facade, verify iframe appears (no facade visible after click)
  - [ ] Playwright: go offline (DevTools), reload, verify offline message shows
- **Skills**: `video-embed-facade`, `doppio-content-schema`

---

### Task 3.3: "Try it" CTA Button

- **Objective**: Each card has a "Try it" button that opens the correct AI tool with a prefilled prompt and copies prompt to clipboard.
- **Dependencies**: Tasks 2.3, 3.2
- **Blocked by**: Task 3.2
- **Files**: `src/components/TryItButton.tsx`, `src/lib/tryit.ts`
- **Contracts**:
  - `TryItButton` props: `{card: VideoCard, onTryIt?: () => void}` (onTryIt triggers analytics)
  - Always visible below video facade (not hidden behind video)
  - Opens URL in new tab + copies prompt to clipboard on every click
  - Toast notification after click
- **Acceptance Criteria**:
  - [ ] Button label: "Try it in [AI Tool Name] →" (e.g., "Try it in ChatGPT →")
  - [ ] Click opens new tab with correct URL
  - [ ] Click copies `tryItPrompt` to clipboard
  - [ ] react-hot-toast notification: "Prompt copied to clipboard! Paste it in [tool name]"
  - [ ] `active:scale-95` touch feedback on button
  - [ ] `touch-action: manipulation` (no 300ms tap delay)
  - [ ] If clipboard API unavailable, shows prompt text inline for manual copy
- **Testing**:
  - [ ] Playwright: click "Try it in ChatGPT", verify new tab opens to chat.openai.com, verify toast appears
  - [ ] Playwright: evaluate `navigator.clipboard.readText()` after click, verify prompt text
- **Skills**: `doppio-content-schema`, `canvas-confetti-gamification`

---

### Task 3.4: Progress Tracking (useProgress hook + progress bar UI)

- **Objective**: User progress persists in localStorage and syncs to Supabase. Progress bar updates on card completion.
- **Dependencies**: Tasks 1.3, 3.2
- **Blocked by**: Tasks 1.3, 3.2
- **Files**: `src/lib/progress.ts`, `src/hooks/useProgress.ts`, `src/components/ProgressBar.tsx`
- **Contracts**:
  - `useProgress()` returns `{progress, markComplete, completedCount, totalCount, isLevelComplete}`
  - Progress shape: `{1: {1: bool, 2: bool, 3: bool}, 2: {...}, 3: {...}}`
  - `markComplete(level, card)`: updates localStorage → fires analytics event → async Supabase upsert (never blocks UI)
  - Progress bar: shows `completedCards / 3` for current level, animated width transition
- **Acceptance Criteria**:
  - [ ] Marking card complete updates progress bar immediately (localStorage read)
  - [ ] Page refresh: progress restored from localStorage (no loading state)
  - [ ] Supabase: after card complete, row appears in user_progress table within a few seconds
  - [ ] Supabase auth: signInAnonymously() called on app mount (once only)
  - [ ] window.focus: syncFromSupabase() called, merges remote progress into localStorage
  - [ ] Progress bar: CSS-only, `transition-all duration-500`, Tailwind widths
  - [ ] Card shows checkmark when progress[level][card] = true
- **Testing**:
  - [ ] Playwright: mark card 1.1 complete, verify progress bar advances to 33%
  - [ ] Playwright: refresh page, verify card still marked complete, progress bar at 33%
  - [ ] Supabase Dashboard: verify row exists in user_progress after marking complete
- **Skills**: `supabase-anonymous-progress`, `doppio-architecture`

---

### Task 3.R: Phase 3 Regression

- **Objective**: Full regression of all Phase 3 UI on deployed production URL.
- **Dependencies**: All Phase 3 tasks complete
- **Testing**:
  - [ ] Deploy to production: `vercel --prod`
  - [ ] Playwright production: navigate `/`, all videos visible, all Try-it buttons work
  - [ ] Playwright production: mark cards complete across levels, verify progress persists
  - [ ] Supabase Dashboard: verify production progress rows appearing
  - [ ] Screenshot: 3 levels visible, progress bar states

---

## Phase 4: Level Flow & Gamification

**Goal**: Complete user journey from landing → Level 1 → Level 2 → Level 3 → Final completion screen. All celebrations, confetti, and PWA install prompts working.

### Task 4.1: Level Navigation & Card Flow

- **Objective**: User can navigate between levels, cards unlock sequentially (or freely), and level completion triggers transition to next level.
- **Dependencies**: Tasks 3.2, 3.4
- **Blocked by**: Tasks 3.2, 3.4
- **Files**: `src/pages/Learn.tsx`, `src/components/LevelHeader.tsx`, `src/components/CardList.tsx`, `src/components/LevelNav.tsx`
- **Contracts**:
  - Route `/learn` shows current level (reads from progress)
  - All 3 levels visible as tabs/steps; user can freely navigate completed levels
  - Within a level: all 3 cards visible, scrollable
  - When all 3 cards in a level are complete: level completion screen triggers (Task 4.2)
  - Route supports `?level=1|2|3` query param for direct linking
- **Acceptance Criteria**:
  - [ ] `/learn` shows Level 1 by default (or current in-progress level)
  - [ ] Level tabs show: 🌱 Beginner, ⚡ Intermediate, 🚀 Advanced
  - [ ] Cards are NOT locked — user can re-watch any completed card
  - [ ] Completing all 3 cards triggers level complete screen (Task 4.2)
  - [ ] Top bar: Doppio logo + current progress (e.g., "3 of 9 complete")
  - [ ] Mobile: cards stack vertically, touch-friendly
- **Testing**:
  - [ ] Playwright: navigate through all 3 levels, mark all cards complete in L1, verify L1 completion triggers
  - [ ] Playwright: verify level tabs work, switching between levels works
- **Skills**: `doppio-architecture`, `canvas-confetti-gamification`

---

### Task 4.2: Level Completion Screen

- **Objective**: When all 3 cards in a level are marked complete, show the level completion overlay with confetti.
- **Dependencies**: Tasks 3.4, 4.1
- **Blocked by**: Task 4.1
- **Files**: `src/components/LevelCompleteScreen.tsx`
- **Contracts**:
  - Props: `{level: 1|2|3, onContinue: () => void, onShare: () => void}`
  - For level 1: headline "Level 1 Complete! 🌱", CTA "Start Level 2"
  - For level 2: headline "Level 2 Complete! ⚡", CTA "Start Level 3"
  - For level 3: → routes to Task 4.3 Final screen instead
  - Confetti fires on mount
  - Share button: Web Share API + clipboard fallback with URL `doppio.kookyos.com/?ref=badge`
- **Acceptance Criteria**:
  - [ ] Full-screen overlay appears immediately when level complete (no delay)
  - [ ] canvas-confetti fires (80-100 particles) on mount
  - [ ] Level-specific headline and emoji
  - [ ] "Continue" button navigates to next level
  - [ ] "Share" button: calls `navigator.share()` or copies badge URL to clipboard
  - [ ] Toast: "Link copied! Share your progress 🎉"
  - [ ] Screen NEVER auto-dismisses — requires explicit tap
  - [ ] Clicking outside overlay does NOT dismiss
- **Testing**:
  - [ ] Playwright: mark all 3 L1 cards complete, verify completion overlay appears
  - [ ] Playwright: confetti fires (check canvas element in DOM)
  - [ ] Playwright: click "Continue", verify navigates to Level 2
  - [ ] Playwright: click "Share", verify toast appears
- **Skills**: `canvas-confetti-gamification`, `doppio-architecture`

---

### Task 4.3: Final Completion Screen

- **Objective**: After Level 3 completion, show the "You're an AI Manager!" screen with badge share, confetti, and curated resource links.
- **Dependencies**: Tasks 2.1, 4.2
- **Blocked by**: Task 4.2
- **Files**: `src/pages/Complete.tsx`, `src/components/ResourceLinks.tsx`
- **Contracts**:
  - Route `/complete`
  - Headline: "You're an AI Manager! 🎉"
  - Subheadline: "You just transformed how you work. Forever."
  - Share badge button: same Web Share API pattern as Task 4.2
  - Resource links: rendered from `content.json` resources array (5 items)
  - Resource link items: emoji + title + description + external link
- **Acceptance Criteria**:
  - [ ] `/complete` route renders
  - [ ] Double confetti burst on mount (more intense than level completion)
  - [ ] "You're an AI Manager! 🎉" headline
  - [ ] Share badge button works (Web Share + clipboard fallback)
  - [ ] 5 resource links rendered from content.json
  - [ ] Resource links open in new tab
  - [ ] Doppio logo visible, branding consistent
- **Testing**:
  - [ ] Playwright: navigate directly to `/complete`, verify all elements render
  - [ ] Playwright: verify confetti fires
  - [ ] Playwright: verify 5 resource links visible and clickable
  - [ ] Analytics: `level_completed` event fires with `{level: 3}` in Supabase
- **Skills**: `canvas-confetti-gamification`, `doppio-content-schema`

---

### Task 4.4: PWA Install Prompts

- **Objective**: iOS Safari shows custom install banner. Android Chrome shows install button. PWA installed event tracked.
- **Dependencies**: Tasks 1.2, 3.4
- **Blocked by**: Task 1.2
- **Files**: `src/components/IOSInstallBanner.tsx`, `src/hooks/useInstallPrompt.ts`
- **Contracts**:
  - `useInstallPrompt()` hook: captures BeforeInstallPromptEvent, returns `{canInstall, install}`
  - iOS banner: shown only to iOS Safari non-standalone users; shows Safari share sheet instructions
  - Android button: visible in landing page header when `canInstall = true`
  - Both dismissed by user (persisted in localStorage: `doppio_install_dismissed_v1`)
- **Acceptance Criteria**:
  - [ ] iOS: banner appears at bottom of landing page with "Add to Home Screen" step-by-step
  - [ ] iOS: banner dismissable with ✕ button; dismissal persisted
  - [ ] Android: "Install App" button visible in header; triggers install prompt on click
  - [ ] Analytics: `pwa_installed` event fires when user completes install
  - [ ] Install prompt not shown in standalone mode (`window.navigator.standalone === true`)
- **Testing**:
  - [ ] Playwright with Chrome mobile emulation (iPhone 12): verify iOS banner appears
  - [ ] Playwright: verify dismiss button hides banner and dismissal persists after reload
- **Skills**: `pwa-vite-setup`, `doppio-analytics`

---

### Task 4.R: Phase 4 Regression

- **Objective**: Full user journey from landing to completion works end-to-end on production.
- **Dependencies**: All Phase 4 tasks complete
- **Testing**:
  - [ ] Deploy: `vercel --prod`
  - [ ] Playwright production: complete full journey — landing → L1 (3 cards) → L1 complete screen → L2 → L3 → final complete screen
  - [ ] Playwright: confetti fires at L1, L2, L3 completion
  - [ ] Playwright: share button works at each completion screen
  - [ ] Playwright: `/complete` route renders resource links
  - [ ] Supabase: all 9 user_progress rows present after full journey
  - [ ] Screenshot: each completion screen

---

## Phase 5: Analytics & Polish

**Goal**: Analytics tracking live, OG tags correct for sharing, PWA icons polished, mobile fully optimized, production-grade.

### Task 5.1: Analytics Implementation

- **Objective**: Vercel Analytics active + all 7 Supabase custom events firing correctly.
- **Dependencies**: Tasks 1.3, 1.4, 3.3, 3.4, 4.2, 4.3, 4.4
- **Blocked by**: Task 1.4 (Vercel Analytics requires Vercel deploy)
- **Files**: `src/lib/analytics.ts`, `src/App.tsx` (Analytics component), Supabase `analytics_events` table (created in Task 1.3)
- **Contracts**:
  - `track(eventName, properties)` in `src/lib/analytics.ts` — fire-and-forget, never throws
  - Session ID: `crypto.randomUUID()` in sessionStorage
  - 7 events: `page_view`, `level_started`, `card_completed`, `try_it_clicked`, `level_completed`, `badge_shared`, `pwa_installed`
- **Acceptance Criteria**:
  - [ ] `<Analytics />` from `@vercel/analytics` in App.tsx root
  - [ ] `analytics.ts` implemented with track() helper
  - [ ] `page_view` fires on app mount
  - [ ] `level_started` fires when user enters a new level
  - [ ] `card_completed` fires when user marks card complete (with {level, card} props)
  - [ ] `try_it_clicked` fires when Try-it button clicked (with {level, card, aiTool} props)
  - [ ] `level_completed` fires when level completion screen shows (with {level} props)
  - [ ] `badge_shared` fires when share button clicked
  - [ ] `pwa_installed` fires on `appinstalled` window event
  - [ ] All events fully silenced on error (try/catch, no console errors)
- **Testing**:
  - [ ] Supabase Dashboard: complete a level journey, query `select * from analytics_events order by created_at desc limit 20`, verify events present
  - [ ] Vercel Dashboard: Analytics tab shows page views
- **Skills**: `doppio-analytics`, `supabase-anonymous-progress`

---

### Task 5.2: OG Meta Tags + Share Assets

- **Objective**: Sharing `doppio.kookyos.com` or `/?ref=badge` on social shows a beautiful link preview.
- **Dependencies**: Task 1.4
- **Blocked by**: Task 1.1
- **Files**: `index.html` (OG meta tags), `public/og-badge.png` (1200×630px static image)
- **Contracts**:
  - `og:image` points to `/og-badge.png`
  - `og:title`: "Doppio — Become an AI Manager in 20 Minutes"
  - `og:description`: "No coding. No prompting. Just natural language superpowers."
  - `og:url`: `https://doppio.kookyos.com`
  - `twitter:card`: `summary_large_image`
- **Acceptance Criteria**:
  - [ ] All OG meta tags in `<head>` of index.html
  - [ ] `public/og-badge.png` exists (1200×630px) — simple text on brand background
  - [ ] Twitter card meta tags present
  - [ ] Sharing URL on iOS Messages or Twitter shows correct preview
- **Testing**:
  - [ ] Open `https://doppio.kookyos.com` in Twitter Card Validator
  - [ ] Playwright: verify meta tags in page `<head>`
- **Skills**: `doppio-architecture`

---

### Task 5.3: PWA Icon Generation + Manifest Polish

- **Objective**: All required PWA icons generated from source, manifest complete and valid.
- **Dependencies**: Task 1.2
- **Blocked by**: Task 1.2
- **Files**: `public/pwa-source.png` (final brand icon), generated icon files, `vite.config.ts` (manifest fields)
- **Contracts**:
  - All icon sizes generated: 192×192, 512×512, apple-touch-icon (180×180), maskable (512×512)
  - Manifest: brand colors confirmed, theme_color applied
  - No transparent icon backgrounds (iOS white-fill bug)
- **Acceptance Criteria**:
  - [ ] `npx pwa-assets-generator` runs successfully
  - [ ] All icons in `public/` directory
  - [ ] `apple-touch-icon` meta tags in `index.html` pointing to correct file
  - [ ] Chrome Lighthouse PWA audit: all green (installable)
  - [ ] iOS: adding to home screen shows Doppio brand icon (not generic)
- **Testing**:
  - [ ] Playwright: Chrome DevTools → Application → Manifest → verify all icons load
  - [ ] Playwright: Lighthouse PWA audit
- **Skills**: `pwa-vite-setup`

---

### Task 5.4: Mobile Polish + vercel.json Final

- **Objective**: App is pixel-perfect on mobile, all touch targets ≥44px, safe area insets handled, CSP headers correct.
- **Dependencies**: Tasks 3.1, 3.2, 4.1
- **Blocked by**: Phase 3 complete
- **Files**: `vercel.json`, `src/index.css`, various component files (touch target fixes)
- **Contracts**: All interactive elements ≥44px. No horizontal scroll on mobile. CSP allows YouTube and TikTok iframes.
- **Acceptance Criteria**:
  - [ ] `vercel.json` has final CSP headers (frame-src youtube, tiktok)
  - [ ] `vercel.json` has SPA rewrite rule
  - [ ] All buttons: `min-height: 44px; touch-action: manipulation`
  - [ ] iOS safe area: `env(safe-area-inset-bottom)` on fixed bottom elements
  - [ ] No horizontal scroll at 375px width
  - [ ] Videos maintain 16:9 aspect ratio at all widths
  - [ ] Progress bar visible and correct on mobile
- **Testing**:
  - [ ] Playwright: iPhone 12 Pro (390×844) full journey, screenshot every screen
  - [ ] Playwright: verify no horizontal scrollbar at 375px
  - [ ] Chrome DevTools: verify no CSP violations in console
- **Skills**: `pwa-vite-setup`, `video-embed-facade`

---

### Task 5.R: Phase 5 Regression

- **Objective**: Full production regression — analytics firing, OG tags correct, mobile perfect, PWA installable.
- **Dependencies**: All Phase 5 tasks complete
- **Testing**:
  - [ ] Deploy: `vercel --prod`
  - [ ] Supabase: complete full 9-card journey, verify all 7 event types in analytics_events
  - [ ] Vercel Analytics: page views appearing in Dashboard
  - [ ] Twitter Card Validator: verify OG preview
  - [ ] Playwright mobile: full journey at 390px — no visual regressions
  - [ ] Lighthouse PWA: all green
  - [ ] Chrome DevTools: no console errors, no CSP violations

---

## Phase 6: Comprehensive E2E Testing

**Goal**: Ship-ready. Every user path tested from every angle on the live deployment. Zero blockers for hackathon submission.

### Task 6.1: Full User Journey E2E

- **Objective**: Playwright runs the complete user journey on production, simulating a real non-technical user.
- **Dependencies**: All Phase 5 tasks + regression complete
- **Blocked by**: Phase 5 regression
- **Testing**:
  - [ ] Navigate `https://doppio.kookyos.com` — verify landing page loads < 3 seconds
  - [ ] Watch facade on L1C1, click play, verify video loads
  - [ ] Click "Try it in ChatGPT" — verify new tab, verify toast
  - [ ] Mark L1C1 complete — verify checkmark, progress bar advances to 33%
  - [ ] Complete all 3 L1 cards — verify L1 completion screen + confetti
  - [ ] Continue to Level 2, complete all 3 cards — verify L2 completion screen
  - [ ] Continue to Level 3, complete all 3 cards — verify final screen "You're an AI Manager!"
  - [ ] Click share badge — verify Web Share or clipboard copy + toast
  - [ ] Verify 5 resource links visible on completion screen
  - [ ] Refresh mid-journey — verify progress restored from localStorage
  - [ ] Screenshot every major screen

---

### Task 6.2: Cross-Device + PWA Install Test

- **Objective**: PWA installation works on iOS and Android simulation. App feels native.
- **Testing**:
  - [ ] Playwright iPhone 12 (390×844): full landing page visible, iOS install banner present
  - [ ] Playwright Android (360×800): full landing page visible, "Install App" button in header
  - [ ] Playwright standalone simulation: verify install banner NOT shown when `navigator.standalone = true`
  - [ ] Chrome Lighthouse PWA audit on production: installable score green
  - [ ] Manual test: install on physical iPhone if available, verify icon appears

---

### Task 6.3: Supabase + Progress Persistence Test

- **Objective**: Progress syncs correctly between localStorage and Supabase. Anonymous auth reliable.
- **Testing**:
  - [ ] Playwright: clear localStorage, reload — verify anonymous auth re-initializes
  - [ ] Playwright: mark 5 cards complete, close tab, open new tab — verify progress restored
  - [ ] Playwright: mark 3 cards complete, open DevTools → Application → Local Storage — verify progress shape
  - [ ] Supabase: query `select count(*) from user_progress` — verify exactly 9 rows after full journey
  - [ ] Supabase: attempt to insert duplicate (level=1, card=1 twice) — verify unique constraint blocks it
  - [ ] Test offline: go offline, mark a card complete, come back online, verify sync completes

---

### Task 6.4: Analytics Verification

- **Objective**: All 7 analytics events fire correctly on production. Vercel Analytics active.
- **Testing**:
  - [ ] Complete full 9-card journey on production
  - [ ] Supabase Dashboard: query `select event_name, count(*) from analytics_events group by event_name`
  - [ ] Verify: page_view × 1, level_started × 3, card_completed × 9, try_it_clicked ≥ 3, level_completed × 3, badge_shared ≥ 1
  - [ ] Vercel Dashboard: verify page views showing in Analytics tab
  - [ ] Verify: no events contain personal data or PII

---

### Task 6.5: Performance + Production Health

- **Objective**: App loads fast, no console errors, production-ready.
- **Testing**:
  - [ ] Lighthouse Performance audit on production: LCP < 2.5s, CLS < 0.1, no blocking resources
  - [ ] Playwright: open browser console on production, verify ZERO console errors on full journey
  - [ ] Playwright: verify ZERO CSP violations in console
  - [ ] Bundle size: `npm run build` output — verify gzipped bundle < 150KB (excluding video assets)
  - [ ] Vercel Functions log: verify no server errors
  - [ ] Test share URL `/?ref=badge`: verify badge banner renders correctly
  - [ ] Verify teaser video (or placeholder) on landing page loads without delay

---

## Dependency Graph

```
1.1 ──┬──► 1.2 ──► 4.4
      ├──► 1.3 ──┬──► 3.4 ──► 4.2 ──► 4.3
      │           └──► 5.1
      ├──► 1.4 ──► 5.2
      └──► 2.1 ──┬──► 2.2 ──► 3.2 ──► 3.3 ──► 3.4
                 └──► 2.3 ──► 3.3
                           3.2 + 3.4 ──► 4.1 ──► 4.2 ──► 4.3
All Phase 5 ──► 5.R ──► Phase 6
```

---

## Task Execution Protocol

### For each task:
1. **Orient**: Read task file, read ALL listed skills, check PROGRESS.md
2. **Plan**: Explore current codebase state, plan the implementation
3. **Implement**: Write code, follow skill guidance precisely
4. **Test**: Run ALL testing criteria listed in the task
5. **Complete**: Update PROGRESS.md status to DONE, commit with descriptive message

### For regression tasks:
1. Deploy to production: `vercel --prod`
2. Run every testing criterion from all tasks in the phase
3. Fix any failures before marking regression DONE
4. Commit fixes, redeploy, retest

### For Phase 6 (E2E):
1. All tasks run on production `https://doppio.kookyos.com`
2. Every criterion must pass before marking ready for submission
3. Create final screenshots as submission demo evidence
