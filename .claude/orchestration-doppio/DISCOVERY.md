# Doppio - Discovery Document

**Created**: 2026-03-06
**Status**: Complete
**Rounds of Q&A**: 3
**Authority**: This document overrides PRD.md, all research files, and all other docs.

---

## 1. Project Identity

**D1: What is the final product name?**
A: **Doppio** — confirmed, no alternatives.

**D2: What is the production URL?**
A: `https://doppio.kookyos.com` — custom domain on Hostgator DNS pointing to Vercel. DNS records to be updated manually by user when Vercel provides them.

**D3: What is the one-sentence pitch?**
A: "20 minutes from ChatGPT Googler to AI coworker boss — curated through crowd knowledge, no coding required."

---

## 2. Hackathon Context

**D4: Which hackathon?**
A: Skool Hackathon (hosted by Marcin & Sabrina). Entry form submitted before March 5 deadline.

**D5: What is the submission deadline?**
A: **Sunday March 8, 2026 at 12:00 PM (Noon) EST.** Hard deadline, no exceptions.

**D6: What must the submission include?**
A: Project Name, Team Name, Team Members, 1-sentence description, 1-sentence target audience, 2-minute demo video (directly uploaded to Skool), AI tools used, live link (optional but desired).

**D7: What are the judging criteria?**
A: "Small + working + clear demo beats big + broken." Primary: working demo that's clear. Secondary: AI tools used, impact.

**D8: Must the project use AI tools?**
A: Yes — at least one AI tool must be used in the build. Doppio uses: Supabase (AI-assisted), Nano Banana or Sora (video generation), and showcases ChatGPT/Claude/Perplexity.

**D9: When did building officially start?**
A: March 6, 2026, 1 PM EST (kickoff livestream). No code before then (ideas and planning OK).

---

## 3. User & Product Vision

**D10: Who is the target user?**
A: Non-technical workers (office professionals, managers, small business owners) who currently use ChatGPT like Google search and sense AI could help them more but feel overwhelmed.

**D11: What transformation does Doppio deliver?**
A: User goes from "I Google things with ChatGPT" to "I delegate tasks to AI like a boss" — in 20 minutes, using only natural language, no prompting complexity.

**D12: What is the core insight?**
A: Abundant TikTok/Reels/YouTube Shorts already demonstrate this progression. Doppio curates and sequences them — it does not create original content.

**D13: What is the total expected session length?**
A: 20 minutes from landing page to completion badge.

---

## 4. Learning Path Architecture

**D14: How many levels and cards?**
A: 3 levels × 3 cards = **9 cards total for MVP**. Up to 6 backup/alternate cards curated.

**D15: What does each level cover?**
A:
- **Level 1 — Beginner**: ChatGPT beyond search. Everyday practical tasks using only natural language.
- **Level 2 — Intermediate**: Simple AI delegation. Claude.ai for file-level and document tasks.
- **Level 3 — Advanced**: Full AI agents. Claude Cowork for complex workflows, Perplexity Computer for research + synthesis.

**D16: What does each card contain?**
A: (1) Level/card title, (2) embedded social video demo, (3) "Try it" CTA button that opens the target AI tool with a prefilled natural language prompt, (4) "Mark as done" / completion trigger.

**D17: Which AI tool does each level's "Try it" CTA open?**
A:
- Level 1 → **ChatGPT** (`chat.openai.com`)
- Level 2 → **Claude.ai** (`claude.ai`)
- Level 3 → **Claude Cowork** (cards 1-2) + **Perplexity** (card 3) — or similar split TBD per video curation

**D18: How does the "Try it" CTA work technically?**
A: Opens target AI tool in new tab. Attempts URL deep-link with `?q=` param (e.g., `chat.openai.com/?q=...`). Falls back to clipboard copy of the prompt if URL param not supported. A "Copy prompt" button is always visible as backup.

**D19: What are the 9 "Try it" prompts (one per card)?**
A: To be determined during video curation. Constraints: single sentence, natural language, no "prompt engineering" framing, action-first. Examples from research:
- L1C1: "Scan this grocery receipt photo and create a meal plan for the week using what I already have"
- L1C2: "Summarize this PDF in 3 bullet points and suggest 2 follow-up questions I should ask"
- L1C3: "Write a professional reply to this email that's friendly but declines the meeting"
- L2C1: "Look at my Downloads folder and delete everything older than 30 days except PDFs"
- L2C2: "Find a well-reviewed Italian restaurant near my location and book a table for 2 tonight at 7pm"
- L2C3: "Fill in this expense form using the receipts I'll share with you"
- L3C1: "Take these 5 receipts, categorize them, and generate an expense report in table format"
- L3C2: "Research the top 3 trends in remote work for 2025 and build me a summary dashboard"
- L3C3: "Find the best flights from NYC to Tokyo in April under $1200 and compare them in a table"

**D20: Can video IDs be swapped without code changes?**
A: Yes — video content must be stored in a `content.json` (or equivalent config) so IDs can be updated without touching React components.

---

## 5. Technical Stack

**D21: Frontend framework?**
A: **React 18+** with **Vite** build tool, **Tailwind CSS** for styling.

**D22: PWA setup?**
A: `vite-plugin-pwa` v0.21.x with Workbox. `@vite-pwa/assets-generator` for icon generation from a single source PNG. Service Worker strategy: `CacheFirst` for app shell, `autoUpdate` registration type.

**D23: Backend?**
A: **Zero backend AI processing**. Only backend is Supabase (Postgres + Auth). No server-side rendering.

**D24: Database and auth?**
A: **Supabase** — anonymous auth via `supabase.auth.signInAnonymously()`. New Supabase project to be created. Anonymous sign-ins must be enabled in Supabase Dashboard.

**D25: Progress storage strategy?**
A: **localStorage first** (source of truth, instant UI). Supabase sync in background. Merge strategy: union (additive — cards never un-completed). Pull from Supabase on `window.focus`. No blocking the UI on network.

**D26: Supabase schema for progress?**
A:
```sql
create table public.user_progress (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  level        smallint not null check (level between 1 and 3),
  card         smallint not null check (card between 1 and 3),
  completed_at timestamptz not null default now(),
  constraint unique_user_level_card unique (user_id, level, card)
);
```

**D27: Analytics?**
A: Two-layer approach:
- Layer 1: **Vercel Analytics** — automatic page views, referrers, geo, device. Free on Hobby plan. Enable via `@vercel/analytics` package.
- Layer 2: **Supabase custom events** — one table `analytics_events(event_name, session_id, properties jsonb, created_at)` tracking 7 key events: `page_view`, `level_started`, `card_completed`, `try_it_clicked`, `level_completed`, `badge_shared`, `pwa_installed`.

**D28: Deployment?**
A: **Vercel** free Hobby plan. Deploy from Git repo. Custom domain `doppio.kookyos.com` via DNS CNAME record on Hostgator pointing to Vercel's cname target.

---

## 6. Video Content

**D29: Which video platforms?**
A: **YouTube** (primary) and **TikTok** (secondary). Instagram Reels excluded — requires Facebook App token. X/Twitter excluded — last resort only.

**D62: Why is TikTok included but not Instagram Reels? (2026-03-06)**
A: Both were evaluated as secondary video sources. TikTok: public oEmbed via `https://www.tiktok.com/embed/v2/{VIDEO_ID}` — no API key, no auth, works with a plain iframe. Instagram Reels: requires a Facebook App token (OAuth client credentials) registered through Meta's developer platform, which would need a backend secret or expose credentials client-side. Since Doppio is a fully client-side PWA with no backend, Instagram is technically infeasible without a security violation. Decision: TikTok ✅, Instagram ❌ (permanent, not just MVP deferral).

**D63: Are webpage/article links allowed as content sources? (2026-03-06)**
A: Yes — but as supplementary resource links, not as replacements for video cards. Each card MAY have an optional `resourceLink` field (title + url) pointing to an authoritative learning page (e.g., Anthropic Docs, Google AI Essentials). These appear as a "Learn more →" link below the video. The completion screen `completionResources` array is also expanded to include official learning hubs (Anthropic, Google). Rationale: videos are the primary learning medium (engagement, retention); webpage links add depth for users who want to go further without bloating the core UX.

**D30: How are videos embedded?**
A: **Facade/lazy-load pattern** — static thumbnail + play button shown first. Real iframe loads only on user click. Prevents CLS and eliminates 10MB+ of up-front third-party resource loading. YouTube uses `lite-youtube-embed` web component. TikTok uses direct iframe URL `https://www.tiktok.com/embed/v2/{VIDEO_ID}`.

**D31: Autoplay behavior?**
A: No autoplay for embedded content cards (user-initiated only). Landing page teaser video: `autoplay muted loop playsinline`.

**D32: What if an embedded video breaks or link rots?**
A: `content.json` config allows swapping video IDs without code changes. 6 backup videos curated as alternates.

---

## 7. PWA

**D33: iOS Safari install prompt?**
A: Custom instructional banner (since iOS never fires `BeforeInstallPromptEvent`). Detect: `isIOS && isSafari && !isStandalone`. Show "Add to Home Screen" instructions.

**D34: Android Chrome install prompt?**
A: Capture `BeforeInstallPromptEvent`, defer it, show custom install button. Chrome 115+ fires on first visit.

**D35: Offline behavior?**
A: App shell cached via Service Worker (CacheFirst). Progress reads from localStorage (works offline). Video iframes show "Connect to watch" message when offline. Supabase sync silently skipped when offline.

**D36: PWA icon requirements?**
A: Single source PNG → `@vite-pwa/assets-generator` produces all sizes. Must have opaque background (iOS adds white fill to transparent icons). Include `apple-touch-icon` meta tags in `<head>` in addition to manifest icons.

---

## 8. Gamification & UX

**D37: Progress indicator?**
A: CSS-only progress bar with Tailwind (`transition-all duration-500 ease-out` + inline width style). Shows progress through current level (cards 1/3, 2/3, 3/3). Global progress indicator optional.

**D38: Confetti?**
A: `canvas-confetti` (~6 kB gzipped). Fire on level completion only (3 times total max). `particleCount: 80-120` for mobile performance. Never fire on every card — preserve the finale delight.

**D39: Streaks?**
A: **Omitted from MVP.** Daily streaks are wrong for a single-session app (everyone gets "Streak: 1"). Not in scope.

**D40: Card completion interaction?**
A: Checkmark overlay + opacity transition (300ms) → progress bar advance (500ms). `active:scale-95` Tailwind class on CTA buttons for tactile touch feedback.

**D41: Level completion screen?**
A: Full-screen overlay, confetti fires on mount, big emoji, level-specific headline, two buttons: "Continue to Level N+1" (primary) and "Share" (secondary). Level 3 gets special: "You're an AI Manager!" headline.

**D42: Final completion screen (after Level 3)?**
A: "You're an AI Manager!" + confetti + share badge button + **curated resource links** (3-5 links to YouTube channels, communities, and tools to keep learning). These resources come from content curation research.

**D43: Share badge mechanic?**
A: URL: `https://doppio.kookyos.com/?ref=badge`. Use `navigator.share()` (Web Share API) with clipboard copy fallback. Static `og-badge.png` (1200×630px) committed to `/public` as static asset for link preview. No dynamic image generation.

---

## 9. Landing Page & Teaser Video

**D44: Landing page structure?**
A: Hero section with 15-second autoplay muted teaser video → headline + subheadline → "Start Level 1" CTA → (optional) brief "How it works" section.

**D45: Teaser video creation?**
A: **Nano Banana** (primary tool) — screenshot-to-animated-video workflow. Upload 4-5 key Doppio UI screenshots → 15-second animated demo → export MP4 1080p → compress under 8 MB with FFmpeg → self-host in Vite `/public`.

**D46: Teaser video hosting?**
A: Self-hosted on Vercel (`/public` folder). HTML `<video autoplay muted loop playsinline>` element. Provide WebM as secondary `<source>` for optimization.

**D47: Who creates the teaser video?**
A: User creates it in Nano Banana after the app UI is built. The agent will scaffold the video element in code; the actual video file is a user deliverable post-UI-build.

---

## 10. Content Curation

**D48: Who curates the 9 videos?**
A: Collaborative — research agent identified specific search queries and source channels per card. User makes final selection. Videos stored in `content.json`.

**D49: Best sources per level (from research)?**
A:
- L1 (Beginner/ChatGPT): Skill Leap AI, Matt Wolfe, Nate Hurst, Jeff Su on YouTube
- L2 (Intermediate/Claude): Anthropic Official YouTube, Riley Brown, The AI Advantage
- L3 (Advanced/Agents): Anthropic Official, Perplexity AI Official, The Rundown AI

**D50: What if Perplexity Computer videos are sparse?**
A: Fallback to Perplexity Spaces demos, then ChatGPT operator/project demos as second fallback.

---

## 11. Scope Exclusions

**D51: What is explicitly OUT of scope for the hackathon MVP?**
A:
- No backend AI processing (zero LLM calls server-side)
- No user accounts / login (anonymous only)
- No daily streaks mechanic
- No live demo playground (replaced by resource links)
- No Instagram Reels embeds (requires Facebook App OAuth token — technically infeasible client-side, see D62)
- No multi-language support
- No custom prompt builder
- No social features (likes, comments, leaderboard)
- No payment / monetization
- No admin dashboard for content management
- No app store submission (PWA only)

---

## 11b. Environment Variables

**D53: What .env variables does the project need?**
A:
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```
Both are public/safe to expose client-side (Supabase anon key is designed for this). No other secrets. All `VITE_` prefixed for Vite to expose to client.

---

## 11c. Error Handling & Edge Cases

**D54: What if Supabase anonymous auth fails?**
A: App must work fully offline. If `signInAnonymously()` fails, silently fall back to localStorage-only mode. No error shown to user. Retry on next `window.focus`.

**D55: What if a "Try it" URL deep-link doesn't work?**
A: Clipboard copy fallback is always present. Button reads "Try it →" — on click, open URL in new tab AND copy prompt to clipboard. Toast notification: "Prompt copied! Paste it in [tool name]."

**D56: Navigation between levels — can user go back?**
A: Free navigation. User can tap any completed level/card to re-watch the video. Progress is never lost. No forced linear lock — cards just show "completed" state visually.

**D57: Can user reset progress?**
A: No explicit reset button in MVP. If needed, user clears browser storage manually.

**D58: What if a video embed fails to load (404, removed)?**
A: Show a placeholder card: "This video is being updated." with a link to search YouTube for the topic. Swap video ID in `content.json` without code deploy needed.

**D59: Rate limits for Supabase free tier?**
A: 500K API requests/month, 50K MAU. At 9 rows per user, supports ~55K users on free tier. Well above hackathon needs.

---

## 11d. Navigation & Routing

**D60: Does the app use client-side routing?**
A: Yes — React Router v6 or file-based routing (TBD). Routes:
- `/` — landing page
- `/learn` or `/level/:n` — learning path (current level)
- `/complete` — final completion screen
- `/?ref=badge` — badge link (shows same landing with badge banner)

**D61: Is there a navbar or back button?**
A: Minimal chrome. Top bar with Doppio logo + current progress indicator. No traditional navigation menu. "Back" is handled by browser back button.

---

## 12. Success Criteria

**D52: What does "done" look like for the hackathon?**
A:
- [ ] App loads at `doppio.kookyos.com` with no install required
- [ ] Landing page teaser video plays (can be placeholder for demo)
- [ ] All 3 levels with all 9 cards are playable
- [ ] Each "Try it" CTA opens correct AI tool with prefilled prompt
- [ ] Progress persists across browser refresh (localStorage)
- [ ] Supabase sync works (anonymous auth + progress rows)
- [ ] PWA installs to home screen on iOS Safari and Android Chrome
- [ ] Level completion confetti + screen works
- [ ] Final "You're an AI Manager!" screen with share badge + resource links
- [ ] Vercel Analytics enabled
- [ ] Supabase analytics events firing
- [ ] 2-minute demo video recorded and uploaded to Skool by March 8 noon EST
