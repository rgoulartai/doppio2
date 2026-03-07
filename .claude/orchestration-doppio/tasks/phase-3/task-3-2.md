# Task 3.2: VideoCard Component

## Objective

Build the reusable `VideoCard` component with a facade/lazy-load pattern for both YouTube and TikTok. The component shows a static thumbnail with a play button overlay until the user clicks; on click, the real iframe replaces the facade. Includes an offline placeholder, a completion checkmark overlay, and the `TryItButton` slot. This component is the core of the `/learn` page UI.

## Context

This is the central UI component of Doppio. Nine instances of VideoCard will be rendered across 3 levels. The facade pattern is essential for performance — 9 real iframes on page load would be 10MB+ of third-party resources. Each VideoCard receives a card from `content.json` (defined in Task 2.1), a completion state, and an `onComplete` callback. Task 3.3 (TryItButton) wires up below each VideoCard. Task 3.4 (useProgress) provides the completion state. Task 4.1 (LevelScreen) is the parent that renders all VideoCards for a level.

## Dependencies

- Task 1.1 — React + Vite + Tailwind scaffold, `lite-youtube-embed` installed
- Task 2.1 — `src/types/content.ts` VideoCard type definition
- Task 2.2 — Real video IDs in `content.json` (needed for testing; stubs acceptable for development)

## Blocked By

- Task 2.2 (real video IDs needed to fully test iframe loading in browser)
- Task 2.1 (TypeScript types for content.json)

## Research Findings

- From video-embed-facade SKILL.md §2: YouTube uses `lite-youtube-embed` web component; import CSS + JS once in `main.tsx`; use `params="mute=1&playsinline=1&rel=0"`; wrap in `w-full aspect-video rounded-lg overflow-hidden`
- From video-embed-facade SKILL.md §3: TikTok uses direct iframe URL `https://www.tiktok.com/embed/v2/VIDEO_ID`; use 9:16 aspect ratio `max-w-[325px]`; never use blockquote + embed.js
- From video-embed-facade SKILL.md §4: `IntersectionObserver` with `rootMargin: '200px'` to defer rendering until near viewport; disconnect after triggering
- From video-embed-facade SKILL.md §10: `useOnlineStatus()` hook with `navigator.onLine` + window events; offline shows "Connect to watch" placeholder
- From canvas-confetti-gamification SKILL.md §4: Checkmark overlay — `absolute inset-0 flex items-center justify-center`, green-500 circle, opacity transition 300ms; `active:scale-95` on buttons
- From doppio-architecture SKILL.md: VideoCard props: `{card: VideoCard, isCompleted: boolean, onComplete: () => void}`
- From DISCOVERY.md D30: Facade pattern — thumbnail + play button shown first; iframe loads only on user click
- From DISCOVERY.md D31: No autoplay for card embeds — user-initiated only
- From PHASES.md Task 3.2: `mute=1&playsinline=1&rel=0` on YouTube; 16:9 aspect ratio; checkmark fades in 300ms; offline message "📡 Connect to watch this video"

## Implementation Plan

### Step 1: Install and configure lite-youtube-embed

Ensure `lite-youtube-embed` is installed (should be from Task 1.1). Add imports to `src/main.tsx`:

```tsx
// src/main.tsx — add these two imports at the top
import 'lite-youtube-embed/src/lite-yt-embed.css';
import 'lite-youtube-embed/src/lite-yt-embed.js';
```

Add TypeScript JSX declaration so TypeScript accepts `<lite-youtube>` in JSX. Create or update `src/types/custom-elements.d.ts`:

```ts
// src/types/custom-elements.d.ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lite-youtube': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          videoid: string;
          playlabel?: string;
          params?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
```

### Step 2: Import `src/hooks/useOnlineStatus.ts` (created in Task 1.2)

`useOnlineStatus` was already created in Task 1.2 at `src/hooks/useOnlineStatus.ts`. Do NOT recreate it. Import it from the existing location:

```ts
import { useOnlineStatus } from '../hooks/useOnlineStatus';
```

Verify the file exists at `src/hooks/useOnlineStatus.ts` before proceeding. If it is missing (Task 1.2 not yet complete), block on Task 1.2 before continuing with Step 3.

### Step 3: Create `src/components/YouTubeEmbed.tsx`

```tsx
// src/components/YouTubeEmbed.tsx
interface YouTubeEmbedProps {
  videoId: string;
  title: string;
}

export function YouTubeEmbed({ videoId, title }: YouTubeEmbedProps) {
  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
      <lite-youtube
        videoid={videoId}
        playlabel={`Play: ${title}`}
        params="mute=1&playsinline=1&rel=0"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
```

Note: `lite-youtube-embed` handles its own facade internally (thumbnail + play button). When the user clicks the `<lite-youtube>` element, the real iframe injects itself. No additional `isPlaying` state is needed for YouTube — the web component manages it.

### Step 4: Create `src/components/TikTokEmbed.tsx`

TikTok requires a manual facade because no equivalent web component exists. Implement with local `isActivated` state:

```tsx
// src/components/TikTokEmbed.tsx
import { useState } from 'react';

interface TikTokEmbedProps {
  videoId: string;
  thumbnailUrl: string;
  title: string;
}

export function TikTokEmbed({ videoId, thumbnailUrl, title }: TikTokEmbedProps) {
  const [isActivated, setIsActivated] = useState(false);

  if (isActivated) {
    return (
      <div
        className="w-full max-w-[325px] mx-auto rounded-lg overflow-hidden"
        style={{ aspectRatio: '9/16' }}
      >
        <iframe
          src={`https://www.tiktok.com/embed/v2/${videoId}`}
          className="w-full h-full"
          frameBorder="0"
          allowFullScreen
          allow="encrypted-media"
          title={title}
        />
      </div>
    );
  }

  return (
    <div
      className="relative w-full max-w-[325px] mx-auto cursor-pointer rounded-lg overflow-hidden bg-black"
      style={{ aspectRatio: '9/16' }}
      onClick={() => setIsActivated(true)}
      role="button"
      aria-label={`Play: ${title}`}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setIsActivated(true)}
    >
      {/* Thumbnail */}
      <img
        src={thumbnailUrl}
        alt={title}
        loading="lazy"
        className="w-full h-full object-cover"
        onError={(e) => {
          // If thumbnail fails to load, show a dark background
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center
          hover:bg-black/80 transition-colors">
          <svg
            className="w-8 h-8 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
```

### Step 5: Create `src/components/VideoCard.tsx`

This is the main component. It composes `YouTubeEmbed` or `TikTokEmbed` based on `card.platform`, uses `IntersectionObserver` for lazy rendering, `useOnlineStatus` for offline detection, and renders the checkmark overlay when `isCompleted` is true.

The `VideoCard` does NOT render the `TryItButton` — that is the responsibility of the parent (LevelScreen / Task 4.1). However, `onComplete` is called when the user clicks "Mark as done" within this component.

```tsx
// src/components/VideoCard.tsx
import { useEffect, useRef, useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { YouTubeEmbed } from './YouTubeEmbed';
import { TikTokEmbed } from './TikTokEmbed';
import type { VideoCard } from '../types/content';

interface VideoCardProps {
  card: VideoCard;           // Typed from content.json (see src/types/content.ts)
  isCompleted: boolean;
  onComplete: () => void;
}

export function VideoCard({ card, isCompleted, onComplete }: VideoCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isOnline = useOnlineStatus();

  // IntersectionObserver — defer rendering until card approaches viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Trigger once, then stop observing
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl border border-gray-800 bg-gray-900
        shadow-sm overflow-hidden"
    >
      {/* Video embed area */}
      <div className="relative">
        {!isVisible ? (
          // Skeleton placeholder while off-screen
          <div className="w-full aspect-video bg-gray-800 animate-pulse rounded-t-xl" />
        ) : !isOnline ? (
          // Offline placeholder
          <div className="w-full aspect-video bg-gray-800 rounded-t-xl flex flex-col
            items-center justify-center gap-2 text-gray-400">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01
                   M3.636 5.636a9 9 0 0112.728 0"
              />
            </svg>
            <span className="text-sm font-medium">
              📡 Connect to watch this video
            </span>
          </div>
        ) : card.platform === 'youtube' ? (
          <YouTubeEmbed videoId={card.videoId} title={card.title} />
        ) : (
          <TikTokEmbed
            videoId={card.videoId}
            thumbnailUrl={card.thumbnailUrl ?? ''}
            title={card.title}
          />
        )}

        {/* Completion checkmark overlay — fades in over the video area */}
        <div
          className={`absolute inset-0 flex items-center justify-center
            transition-opacity duration-300 pointer-events-none
            ${isCompleted ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden={!isCompleted}
        >
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center
            justify-center shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Card body: title + Mark as done button */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-white text-base leading-snug">
          {card.title}
        </h3>

        {/* Mark as done button */}
        <button
          onClick={onComplete}
          disabled={isCompleted}
          className={`w-full py-3 rounded-xl text-sm font-semibold
            active:scale-95 transition-all duration-150
            ${isCompleted
              ? 'bg-green-900/40 text-green-400 cursor-default border border-green-800'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          style={{ touchAction: 'manipulation' }}
          aria-label={isCompleted ? 'Card completed' : `Mark "${card.title}" as done`}
        >
          {isCompleted ? '✓ Done' : 'Mark as done'}
        </button>
      </div>
    </div>
  );
}
```

### Step 6: Verify TypeScript type compatibility

The `VideoCard` type referenced in VideoCard must match what `content.json` exports. Check `src/types/content.ts` (created in Task 2.1). The required fields for VideoCard are:

```ts
// Expected shape from src/types/content.ts
export interface VideoCard {
  id: string;                         // e.g. "L1C1"
  platform: 'youtube' | 'tiktok';
  videoId: string;
  thumbnailUrl?: string;              // Required for TikTok, optional for YouTube
  title: string;
  tryItPrompt: string;
  tryItUrl: string;                   // Base URL for AI tool
  aiTool: string;                     // e.g. "chatgpt", "claude"
  description?: string;
}
```

If `src/types/content.ts` uses a different field name (e.g., `tryItTool` instead of `tryItUrl`), use the name from that file — do NOT duplicate or redefine the type. Import from `../types/content`.

### Step 7: Verify the build

```bash
npm run build
```

If TypeScript errors occur on `<lite-youtube>` JSX element:
- Confirm `src/types/custom-elements.d.ts` exists with the declaration from Step 1
- Confirm `tsconfig.json` includes `src/types` in its paths (it should by default)

If TypeScript errors occur on `VideoCard` import:
- Check exact export name in `src/types/content.ts`
- Update the import accordingly

## Files to Create

- `src/components/VideoCard.tsx` — Main VideoCard component (facade + completion state)
- `src/components/YouTubeEmbed.tsx` — YouTube embed using lite-youtube-embed web component
- `src/components/TikTokEmbed.tsx` — TikTok embed with manual facade using useState
- `src/types/custom-elements.d.ts` — TypeScript JSX declaration for `<lite-youtube>`

Note: `src/hooks/useOnlineStatus.ts` was created in Task 1.2. Do NOT recreate it here — import from the existing file.

## Files to Modify

- `src/main.tsx` — Add `import 'lite-youtube-embed/src/lite-yt-embed.css'` and `import 'lite-youtube-embed/src/lite-yt-embed.js'` at the top

## Contracts

### Provides (for downstream tasks)

- `VideoCard` component exported from `src/components/VideoCard.tsx`
  - Props: `{ card: VideoCard, isCompleted: boolean, onComplete: () => void }`
  - Slot for `TryItButton` is expected to be placed BELOW the VideoCard by the parent (LevelScreen)
- `YouTubeEmbed` exported from `src/components/YouTubeEmbed.tsx`
- `TikTokEmbed` exported from `src/components/TikTokEmbed.tsx`

Note: `useOnlineStatus()` hook is consumed from Task 1.2 (`src/hooks/useOnlineStatus.ts`), not created here.

### Consumes (from upstream tasks)

- Task 1.1: `lite-youtube-embed` npm package installed
- Task 1.2: `useOnlineStatus` hook at `src/hooks/useOnlineStatus.ts` (import, do not recreate)
- Task 2.1: `VideoCard` type from `src/types/content.ts`
- Task 2.2: `videoId` fields in `content.json` (real IDs for browser testing; any string works for TypeScript/build)

## Acceptance Criteria

- [ ] `npm run build` exits 0 with no TypeScript errors
- [ ] `src/components/VideoCard.tsx` exported and importable
- [ ] `src/components/YouTubeEmbed.tsx` exported and importable
- [ ] `src/components/TikTokEmbed.tsx` exported and importable
- [ ] `src/hooks/useOnlineStatus.ts` exists (created in Task 1.2) and is importable by VideoCard
- [ ] `src/types/custom-elements.d.ts` exists; no TypeScript error on `<lite-youtube>` JSX
- [ ] YouTube card: `lite-youtube-embed` renders with thumbnail before click; iframe appears on click
- [ ] YouTube card: `params="mute=1&playsinline=1&rel=0"` is set on the `<lite-youtube>` element
- [ ] TikTok card: custom facade (thumbnail + play button) renders before click; iframe `https://www.tiktok.com/embed/v2/{id}` appears on click
- [ ] Both platforms: 16:9 (`aspect-video`) or 9:16 container renders without layout shift
- [ ] `isCompleted=true`: green checkmark overlay fades in with `transition-opacity duration-300`
- [ ] `isCompleted=false`: checkmark overlay has `opacity-0 pointer-events-none` (invisible, non-interactive)
- [ ] Offline: "📡 Connect to watch this video" text visible in video area (not the facade)
- [ ] Online status: restores facade when network comes back (re-render on `isOnline` state change)
- [ ] IntersectionObserver: card skeleton shown when 200px+ below viewport fold; facade shown when approaching viewport
- [ ] "Mark as done" button is disabled and changes label to "✓ Done" when `isCompleted=true`
- [ ] `active:scale-95` CSS class on "Mark as done" button
- [ ] `touch-action: manipulation` inline style on "Mark as done" button
- [ ] No console errors when rendering a VideoCard with a valid `card` prop

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` passes
- [ ] No ESLint errors (if lint script exists: `npm run lint`)

### Browser Testing (Playwright MCP)

**Prerequisites**: Task 2.2 should be complete (real video IDs). If not, use the placeholder IDs from Task 2.1 for facade-only testing.

**Start dev server**: `npm run dev` (localhost:5173)

Note: The `/learn` page (Task 4.1) is not yet built. To test VideoCard in isolation, either:
a) Temporarily render a VideoCard directly in App.tsx with a hardcoded card prop
b) Wait until Task 4.1 wraps VideoCard into the LevelScreen

**Test 1 — YouTube facade renders:**
1. Navigate to the page rendering a VideoCard with a YouTube card (platform: "youtube")
2. Verify: a thumbnail image is visible with a play button overlay
3. Verify: no `<iframe>` element in the DOM before clicking
4. Verify: `<lite-youtube>` element is in the DOM

**Test 2 — YouTube iframe loads on click:**
1. Click the YouTube facade (thumbnail area)
2. Verify: `<iframe>` element appears in the DOM
3. Verify: iframe `src` contains `youtube.com/embed/` with the video ID
4. Verify: iframe `src` contains `mute=1` and `playsinline=1`

**Test 3 — TikTok facade renders:**
1. Navigate to the page rendering a VideoCard with a TikTok card
2. Verify: thumbnail image visible with play button overlay
3. Verify: no `<iframe>` in the DOM before clicking

**Test 4 — TikTok iframe loads on click:**
1. Click the TikTok facade
2. Verify: `<iframe src="https://www.tiktok.com/embed/v2/...">` appears in DOM

**Test 5 — Completion checkmark:**
1. Render VideoCard with `isCompleted={true}`
2. Verify: green circle with checkmark is visible (opacity-100)
3. Verify: checkmark has CSS transition-opacity class

**Test 6 — Mark as done button:**
1. Render VideoCard with `isCompleted={false}`
2. Click "Mark as done" button
3. Verify: `onComplete` callback was called (check via mocked prop or progress state update)

**Test 7 — Offline state:**
1. Navigate to the page with VideoCards online
2. Open Chrome DevTools → Network → Offline mode
3. Reload the page
4. Verify: "📡 Connect to watch this video" text appears where the facade would be
5. Re-enable network, verify facade appears again

**Test 8 — 390px mobile viewport:**
1. Set viewport to 390×844
2. Verify: YouTube card is full-width with 16:9 aspect ratio
3. Verify: TikTok card is max-w-[325px] centered with 9:16 ratio
4. Verify: no horizontal overflow

### Edge Cases

- VideoCard with `thumbnailUrl=""` for TikTok — should not crash; the `<img onError>` handler hides the broken image
- VideoCard with a videoId that doesn't exist on YouTube — `lite-youtube-embed` shows its own error state; no crash
- Rapid clicks on TikTok play button — `isActivated` becomes true after first click; subsequent clicks have no effect

## Skills to Read

- `video-embed-facade` — Complete implementation guide for both YouTube and TikTok facades, IntersectionObserver pattern, offline handling, CSP headers, common pitfalls
- `canvas-confetti-gamification` — Checkmark overlay implementation (§4), button touch feedback patterns
- `doppio-architecture` — VideoCard component slot in architecture, content.json flow

## Git

- Branch: `feat/phase-3-videocard`
- Commit message prefix: `Task 3.2:`
- Example commit: `Task 3.2: Add VideoCard component with YouTube/TikTok facade, completion overlay, and offline handling`
