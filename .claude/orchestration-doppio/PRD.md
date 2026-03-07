# Doppio - Product Requirements Document

**Created**: 2026-03-06
**Status**: Superseded by DISCOVERY.md — read that for authoritative decisions
**Source**: User brain dump

> **Note**: This PRD was the starting point. All open questions were resolved and decisions locked in `DISCOVERY.md`. Where this document conflicts with DISCOVERY.md, DISCOVERY.md wins. Strikethroughs below indicate items overridden by subsequent decisions.

---

## 1. Vision

Doppio is a Progressive Web App that transforms non-technical users from "ChatGPT-as-Google" into confident AI coworker managers — in 20 minutes, using only natural language. No prompting tips. No Zapier. No code.

The core insight is that abundant, high-quality TikTok/Reels/YouTube Shorts already demonstrate this exact AI mastery progression. Doppio doesn't create content — it sequences and curates existing social video demos into a structured 3-level learning path. Users watch real people doing real things with AI, then immediately try it themselves with a prefilled natural language prompt.

Target users: non-technical workers (e.g., office professionals, managers, small business owners) who sense AI could help them but feel overwhelmed by "prompt engineering" discourse. Doppio is the Duolingo of practical AI literacy — gamified, shareable, and ships to production in a day.

---

## 2. Core Features

### Learning Path (3 Levels)

- **Beginner Level**: ChatGPT beyond search — practical everyday tasks ("Plan my groceries from receipt photo")
- **Intermediate Level**: Simple delegation — file system and OS-level tasks ("Clean my Downloads folder")
- **Advanced Level**: Full AI agents — Claude Cowork, Perplexity Computer, multi-step automations ("Receipts to expense report", "Research + dashboard")
- Each level has 3 cards (9 total for MVP)
- Each card: embedded social video + "Try it" CTA that opens target AI tool with prefilled natural language prompt

### Progress & Gamification

- Progress bar across levels
- Streaks + confetti on completion
- "You're now an AI manager!" completion screen
- Shareable badge on completion
- Live demo playground after completion

### PWA Features

- Auto-adds home screen icon on iOS Safari and Chrome (no app store)
- Feels native
- Offline progress persistence via localStorage
- Optional: Supabase sync for cross-device progress

### Entry & Discovery

- Shareable URL (Vercel/Netlify deploy, no app store)
- Landing page with 15-second teaser video
- "Start Beginner Path" CTA
- 20-minute estimated completion displayed upfront

### Video Content

- 9 hardcoded video embeds (YouTube primary, TikTok secondary) ~~Instagram Reels, X/Twitter oEmbed~~ — excluded in DISCOVERY.md D62: Instagram requires a Facebook App OAuth token (infeasible client-side); X/Twitter excluded as last resort only
- One high-quality demo per card
- 3 extra videos as backups/alternates (15 total vs 9 minimum)
- Curated from existing public social media demos

---

## 3. User Flows

### Flow 1: First-Time Visitor → Level Completion

1. User receives shared link (`doppio.vercel.app` or custom domain)
2. Landing page loads: 15-second teaser video autoplays, "Start Beginner Path" CTA
3. User taps CTA → enters Level 1 (Beginner)
4. Card 1: embedded social video → user watches → "Try it" button appears
5. "Try it" opens ChatGPT (or relevant AI) in new tab with prefilled natural language prompt
6. User returns → card marked complete → progress bar advances
7. Repeat for cards 2 and 3 of Level 1
8. Level 1 complete → celebration animation → "Start Intermediate" CTA

### Flow 2: PWA Installation

1. After first interaction, browser prompts "Add to Home Screen"
2. iOS Safari / Chrome install banner triggers
3. User installs → app icon appears on home screen
4. App opens in standalone mode (no browser chrome)

### Flow 3: Completion → Share

1. User completes all 3 levels
2. "You're now an AI manager!" screen with confetti
3. Live demo playground unlocked
4. Shareable badge generated → user shares link → viral loop

### Flow 4: Return Visitor

1. User opens app from home screen icon
2. localStorage restores progress → resumes where they left off
3. Optional: Supabase sync if logged in

---

## 4. Technical Signals

- **Frontend**: React + Tailwind + Vite (PWA-ready via vite-plugin-pwa or similar)
- **Content**: Hardcoded video embeds — YouTube (`lite-youtube-embed`), TikTok direct iframe (`tiktok.com/embed/v2/{id}`) ~~Instagram Reels oEmbed, X/Twitter oEmbed~~ — see DISCOVERY.md D62
- **Progress storage**: localStorage (primary), Supabase (optional, secondary)
- **Deploy**: Vercel or Netlify (free tier)
- **No AI backend**: Zero backend AI processing — pure static curation
- **PWA manifest**: Web App Manifest + Service Worker for offline + install prompt
- **Zero backend required for MVP**: all state client-side

---

## 5. Open Questions

- What is the final app name? "Doppio" is the working name — is it confirmed?
- Is there a custom domain or is Vercel subdomain acceptable for hackathon?
- Which 9 specific videos will be used? (need curation pass)
- What AI tools does the "Try it" CTA open? (ChatGPT, Claude, Perplexity — which per card?)
- What are the exact prefilled prompts for each "Try it" card?
- ~~TikTok / Instagram oEmbed: do they require API keys or are public embeds free?~~ — Resolved: TikTok is free (plain iframe). Instagram requires Facebook App OAuth token — excluded (D62).
- ~~What's the target hackathon and its judging criteria?~~
- Is the "live demo playground" a real interactive component or a curated showcase?
- Should the app support multiple languages (global audience implied by "globally pronounceable" naming criterion)?
- Is there an existing Supabase project, Vercel account, or other infra already set up?
- Which 9 specific videos will be used? (need curation pass)
- What AI tools does the "Try it" CTA open? (ChatGPT, Claude, Perplexity — which per card?)
- What are the exact prefilled prompts for each "Try it" card?
- ~~TikTok / Instagram oEmbed: do they require API keys or are public embeds free?~~ — see above

**Resolved:**
- Final name: **Doppio** ✓
- Supabase sync: **in scope for MVP** ✓
- Landing teaser video: **to be AI-generated using Nano Banana or Sora** ✓
- Analytics: **simplest possible** (Vercel Analytics or equivalent) ✓
- Badge sharing: **text link** (no image generation) ✓
- Hackathon: **Skool Hackathon (Marcin & Sabrina)** — Kickoff March 6 1PM EST, Submission deadline March 8 noon EST (~47h), $6K prizes ✓
- Judging criteria: working demo + clear 2-minute video. "Small + working + clear demo beats big + broken." ✓
- Must use at least one AI tool in the build ✓

---

## 6. Explicit Constraints

- **No AI backend**: Zero server-side AI processing for MVP
- **No app store**: PWA only, shareable URL
- **No prompting tips**: Natural language framing only — no "here's how to prompt"
- **No Zapier or no-code tools**: Scope is ChatGPT/Claude/Perplexity native interfaces
- **MVP scope**: 9 video cards, PWA install, progress tracking — nothing more
- **Hackathon timeline**: Must ship in ~1 day
- **Static curation wins**: Content quality > technical complexity

---

## 7. Success Criteria

- App loads via shareable URL with no install required
- User can complete all 3 levels in 20 minutes
- PWA installs to home screen on iOS Safari and Android Chrome
- Each "Try it" CTA correctly opens the target AI tool with prefilled prompt
- Progress persists across browser refreshes (localStorage)
- Completion screen with badge and share functionality works
- App is deployed and live on Vercel/Netlify
- Demo-able live in a 2-minute hackathon pitch
