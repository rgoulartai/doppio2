---
name: video-embed-facade
description: Facade/lazy-load pattern for YouTube and TikTok video embeds in Doppio. Use when implementing VideoCard component, adding new video embeds, or debugging video loading issues.
---

# Skill: video-embed-facade

## Purpose

Teach the execution agent how to implement video embeds in Doppio using the facade/lazy-load pattern for YouTube and TikTok. This skill covers the full implementation: component structure, CSP headers, mobile requirements, offline handling, and content schema.

---

## 1. Why the Facade Pattern

Doppio displays 9 video cards simultaneously. Loading all as real iframes on page render is a performance disaster:

- YouTube iframe: ~540KB of JS + thumbnail network requests per embed
- TikTok `embed.js`: ~300KB per embed
- 9 simultaneous iframes = **10MB+ of third-party resources on first load**

Consequences without facade:

- **CLS (Cumulative Layout Shift)**: Iframes loading async cause the page to reflow and shift content downward, breaking the layout and tanking Core Web Vitals.
- **Blocked render**: Third-party scripts delay Time to Interactive.
- **Mobile data cost**: Unacceptable on low-bandwidth connections.

The facade pattern shows a static thumbnail + play button placeholder. The real iframe only loads when the user explicitly clicks play. This makes initial load nearly free — only the thumbnail images are fetched upfront.

---

## 2. YouTube Facade Implementation

### Package

Use `lite-youtube-embed` — a web component (~15kB) by Paul Irish that handles the facade pattern natively for YouTube.

```bash
npm install lite-youtube-embed
```

### Setup in main.tsx

Import both the CSS and the component script once at the app entry point:

```tsx
// src/main.tsx
import 'lite-youtube-embed/src/lite-yt-embed.css';
import 'lite-youtube-embed/src/lite-yt-embed.js';
```

### TypeScript Declaration

Add this to `src/vite-env.d.ts` or a dedicated `src/types/custom-elements.d.ts` so TypeScript accepts the custom element in JSX:

```tsx
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
```

### Usage

Wrap the component in a 16:9 aspect ratio container. The `params` attribute passes YouTube player parameters directly to the iframe URL query string.

```tsx
// 16:9 container
<div className="w-full aspect-video rounded-lg overflow-hidden">
  <lite-youtube
    videoid="VIDEO_ID"
    playlabel="Play: Video Title"
    params="mute=1&playsinline=1&rel=0"
  />
</div>
```

Key `params` values for Doppio:

| Param | Value | Reason |
|-------|-------|--------|
| `mute` | `1` | Required for autoplay compatibility across browsers |
| `playsinline` | `1` | Prevents fullscreen player launch on iOS Safari |
| `rel` | `0` | Limits related videos to same channel |

### How lite-youtube-embed Works

On render: displays `https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg` as thumbnail with a play button overlay. No YouTube scripts or iframes are loaded.

On click: injects the real `<iframe src="https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&playsinline=1&rel=0">` and removes the thumbnail.

---

## 3. TikTok Facade Implementation (Custom)

TikTok does not have a `lite-tiktok-embed` equivalent. Build a custom React component.

### Why Not the Blockquote Embed

TikTok's default embed method uses a `<blockquote>` + external `embed.js` script injection. Avoid this because:
- `embed.js` (~300KB) replaces the DOM element and causes React reconciliation issues
- Script is slow (300-500ms) and can be blocked by ad-blockers
- Cannot be cleanly lazy-loaded per-component

Instead, use the **direct iframe URL**: `https://www.tiktok.com/embed/v2/VIDEO_ID`

### Thumbnail via oEmbed

Fetch the thumbnail URL from TikTok's public oEmbed endpoint (no API key required):

```
GET https://www.tiktok.com/oembed?url=https://www.tiktok.com/video/VIDEO_ID
```

Response includes `thumbnail_url`. **Do this at content curation time and store the result in `content.json`** — do not fetch it at runtime per page load. The `thumbnailUrl` field in `content.json` is populated from this endpoint once when the video is added.

### TikTokEmbed Component

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
      <div className="w-full max-w-[325px] mx-auto" style={{ aspectRatio: '9/16' }}>
        <iframe
          src={`https://www.tiktok.com/embed/v2/${videoId}`}
          className="w-full h-full rounded-lg"
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
    >
      <img
        src={thumbnailUrl}
        alt={title}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Play button overlay */}
        <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
```

TikTok content is always vertical (9:16). Constrain max-width to 325px on desktop so it does not stretch awkwardly. Center it in the card.

---

## 4. IntersectionObserver: Load Facade Only When Card Enters Viewport

Even loading the thumbnail image for 9 cards at once is wasteful for cards far below the fold. Use `IntersectionObserver` to defer rendering the facade entirely until the card is near the viewport.

```tsx
// src/components/VideoCard.tsx
import { useEffect, useRef, useState } from 'react';

interface VideoCardProps {
  video: {
    id: string;
    platform: 'youtube' | 'tiktok';
    videoId: string;
    thumbnailUrl: string;
    title: string;
  };
}

export function VideoCard({ video }: VideoCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only need to trigger once
        }
      },
      { rootMargin: '200px' } // Start loading 200px before the card enters viewport
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="min-h-[200px]">
      {isVisible && <VideoFacadeRouter video={video} />}
    </div>
  );
}
```

The `rootMargin: '200px'` pre-loads the thumbnail before the user scrolls to it, avoiding a visible pop-in.

`IntersectionObserver` is available in all modern browsers including Safari 12.1+. No polyfill needed for Doppio's target audience.

---

## 5. VideoFacadeRouter: Dispatching by Platform

```tsx
// src/components/VideoFacadeRouter.tsx
import 'lite-youtube-embed/src/lite-yt-embed.css';
import 'lite-youtube-embed/src/lite-yt-embed.js';
import { TikTokEmbed } from './TikTokEmbed';

interface Video {
  id: string;
  platform: 'youtube' | 'tiktok';
  videoId: string;
  thumbnailUrl: string;
  title: string;
}

export function VideoFacadeRouter({ video }: { video: Video }) {
  if (video.platform === 'youtube') {
    return (
      <div className="w-full aspect-video rounded-lg overflow-hidden">
        <lite-youtube
          videoid={video.videoId}
          playlabel={`Play: ${video.title}`}
          params="mute=1&playsinline=1&rel=0"
        />
      </div>
    );
  }

  if (video.platform === 'tiktok') {
    return (
      <TikTokEmbed
        videoId={video.videoId}
        thumbnailUrl={video.thumbnailUrl}
        title={video.title}
      />
    );
  }

  return null;
}
```

---

## 6. content.json Schema

Video content must live in `src/content.json` so IDs can be swapped without touching React components (per DISCOVERY.md D20, D32).

```json
{
  "levels": [
    {
      "id": 1,
      "title": "Level 1 — Beginner",
      "cards": [
        {
          "id": "L1C1",
          "platform": "youtube",
          "videoId": "dQw4w9WgXcQ",
          "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
          "title": "ChatGPT Beyond Search",
          "tryItPrompt": "Scan this grocery receipt photo and create a meal plan for the week using what I already have",
          "tryItTool": "https://chat.openai.com/?q="
        },
        {
          "id": "L1C2",
          "platform": "tiktok",
          "videoId": "7123456789012345678",
          "thumbnailUrl": "https://p16-sign.tiktokcdn-us.com/...",
          "title": "Summarize PDFs with AI",
          "tryItPrompt": "Summarize this PDF in 3 bullet points and suggest 2 follow-up questions I should ask",
          "tryItTool": "https://chat.openai.com/?q="
        }
      ]
    }
  ]
}
```

Schema per card:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique card identifier, e.g. `"L1C1"` |
| `platform` | `"youtube"` or `"tiktok"` | Determines which embed component to use |
| `videoId` | string | YouTube video ID or TikTok numeric video ID |
| `thumbnailUrl` | string | Full thumbnail URL. For YouTube: use `https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg`. For TikTok: fetch from oEmbed at curation time and store here. |
| `title` | string | Human-readable title shown as play button aria-label |
| `tryItPrompt` | string | Natural language prompt for the "Try it" CTA |
| `tryItTool` | string | Base URL for the target AI tool (with `?q=` if supported) |

YouTube thumbnails follow a deterministic URL pattern — no API call needed:
- `hqdefault.jpg` — 480x360, always exists
- `maxresdefault.jpg` — 1280x720, may not exist for older videos

Always use `hqdefault.jpg` as the safe default for YouTube.

---

## 7. VideoCard Full Component (Pseudo-code Structure)

This shows how all pieces compose together in the final VideoCard component:

```tsx
// src/components/VideoCard.tsx (full structure)

function VideoCard({ card, isCompleted, onComplete }) {
  // 1. IntersectionObserver — defer rendering until near viewport
  const [isVisible] = useIntersectionObserver({ rootMargin: '200px' });

  // 2. Offline detection — show placeholder if no network
  const isOnline = useOnlineStatus();

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 space-y-3">

      {/* Video embed area */}
      <div className="relative">
        {!isVisible ? (
          // Skeleton placeholder while off-screen
          <div className="w-full aspect-video bg-gray-100 rounded-lg animate-pulse" />
        ) : !isOnline ? (
          // Offline placeholder
          <OfflinePlaceholder />
        ) : (
          // Facade router dispatches to lite-youtube or TikTokEmbed
          <VideoFacadeRouter video={card} />
        )}
      </div>

      {/* Card title */}
      <h3 className="font-semibold text-gray-900">{card.title}</h3>

      {/* Try it CTA */}
      <TryItButton prompt={card.tryItPrompt} toolUrl={card.tryItTool} />

      {/* Mark as done */}
      <CompleteButton
        isCompleted={isCompleted}
        onComplete={() => onComplete(card.id)}
      />

    </div>
  );
}
```

The facade and iframe interaction flow:
1. Card mounts with skeleton (off-screen) or thumbnail (on-screen, not clicked)
2. User scrolls to card → IntersectionObserver fires → thumbnail renders
3. User clicks thumbnail → facade swaps to real iframe → video plays
4. User clicks "Mark as done" → progress stored in localStorage + Supabase background sync

---

## 8. CSP Headers in vercel.json

Add `frame-src` directives to allow the YouTube and TikTok iframes to load. Configure this in `vercel.json` at the project root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.tiktok.com; img-src 'self' data: https://i.ytimg.com https://p16-sign.tiktokcdn-us.com https://p16-sign-va.tiktokcdn.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; style-src 'self' 'unsafe-inline'; font-src 'self';"
        }
      ]
    }
  ]
}
```

Key directives:

| Directive | Values | Purpose |
|-----------|--------|---------|
| `frame-src` | `youtube.com`, `youtube-nocookie.com`, `tiktok.com` | Allow iframe embeds from these origins |
| `img-src` | `i.ytimg.com`, `tiktokcdn-us.com`, `tiktokcdn.com` | Allow thumbnail images from YouTube and TikTok CDNs |
| `script-src` | `youtube.com` | Allow lite-youtube-embed to load YouTube's iframe API |

Note: TikTok CDN domains for thumbnails can vary by region. The two listed (`p16-sign.tiktokcdn-us.com`, `p16-sign-va.tiktokcdn.com`) cover US and VA regions. If thumbnails fail to load in production, inspect the `img-src` violation in the browser console and add the blocked CDN domain.

Use `youtube-nocookie.com` as an alternative YouTube embed domain for enhanced privacy mode — no cookies are set until the user clicks play.

---

## 9. Mobile: playsinline is Required for iOS Safari

**Critical**: Without `playsinline=1`, tapping a YouTube video on iOS Safari launches the native full-screen video player instead of playing inline within the card. This breaks the Doppio UI flow — the user gets taken out of context.

For `lite-youtube-embed`, pass it via the `params` attribute:

```tsx
<lite-youtube
  videoid="VIDEO_ID"
  params="mute=1&playsinline=1&rel=0"
/>
```

For direct YouTube iframes (if used elsewhere):

```html
<iframe
  src="https://www.youtube.com/embed/VIDEO_ID?playsinline=1&mute=1&rel=0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; playsinline"
  allowfullscreen
/>
```

Both the URL param (`playsinline=1`) and the `allow` attribute value (`playsinline`) are needed for full iOS compatibility.

For TikTok iframes on iOS: vertical content plays inline by default. No special handling needed.

Android Chrome respects `playsinline` by default and does not require special treatment.

---

## 10. Offline: Show Placeholder Instead of Video

When the device has no network connection, attempting to load iframes will fail silently or show broken content. Show a clear placeholder instead.

```tsx
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

```tsx
// src/components/OfflinePlaceholder.tsx
export function OfflinePlaceholder() {
  return (
    <div className="w-full aspect-video rounded-lg bg-gray-100 flex flex-col items-center justify-center gap-2 text-gray-500">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M3.636 5.636a9 9 0 0112.728 0" />
      </svg>
      <span className="text-sm font-medium">Connect to watch</span>
    </div>
  );
}
```

Use this in `VideoCard` before rendering the facade:

```tsx
const isOnline = useOnlineStatus();

if (!isOnline) {
  return <OfflinePlaceholder />;
}
```

Note from DISCOVERY.md (D35): Supabase sync is silently skipped when offline. The app shell and progress (localStorage) work offline. Video content requires a connection — this is expected and communicated clearly with "Connect to watch."

---

## 11. Unsupported Platforms

### Instagram Reels — NOT SUPPORTED IN MVP

Instagram oEmbed has required a Facebook App access token since October 24, 2020. For Doppio:

- Exposing a Facebook App token in client-side code is a security concern
- Instagram embeds do not autoplay
- Login prompts can appear for some content, disrupting user flow
- No reliable direct iframe URL exists (unlike TikTok's `embed/v2/` pattern)

**Do not implement Instagram Reels embeds. Do not add `instagram.com` to the CSP frame-src. Source all content from YouTube or TikTok equivalents.**

If content absolutely cannot be sourced from YouTube or TikTok, use a thumbnail image + "Watch on Instagram" link that opens in a new tab. This preserves the learning content without the embed complexity.

### X/Twitter — Last Resort Only

X/Twitter oEmbed requires no API key and `widgets.js` is free. However:

- `widgets.js` adds ~180KB of load weight
- CDN may be blocked in corporate environments or some countries
- Rendering latency: 500ms–2s for widget initialization
- Content deletion/account suspension risk is higher than YouTube

Only use X/Twitter if a specific video clip is unavailable on any other platform and is critical to the learning path. If used, add to CSP: `frame-src https://platform.twitter.com; script-src https://platform.twitter.com`.

---

## Common Pitfalls

1. **Forgetting `playsinline=1` on iOS**: YouTube opens fullscreen native player. Always include in `params`.

2. **TikTok blockquote + embed.js approach**: Causes React reconciliation issues. Always use the direct iframe URL `https://www.tiktok.com/embed/v2/VIDEO_ID`.

3. **Fetching TikTok thumbnail at runtime**: Call `tiktok.com/oembed` once at curation time and store `thumbnail_url` in `content.json`. Do not make this API call from the client on every page load.

4. **Missing CSP frame-src**: Browsers block iframes not listed in `frame-src`. Test in production with a strict browser — devtools may mask CSP issues in development.

5. **CLS from unsized containers**: Always set `aspect-video` (16:9) or `aspect-[9/16]` on the container div before the iframe loads. This reserves space and prevents layout shift.

6. **No IntersectionObserver disconnect**: After the card becomes visible, disconnect the observer to avoid memory leaks and redundant callbacks.

7. **TikTok CDN `img-src` violations**: TikTok thumbnail CDN domains vary by region. Inspect the browser console on first deploy and add any blocked CDN domains to `img-src` in `vercel.json`.
