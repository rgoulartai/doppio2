# Video Embedding Research

**Task**: video-embedding
**Project**: Doppio
**Date**: 2026-03-06
**Status**: complete

---

## Summary

Doppio embeds social video content (YouTube, TikTok, Instagram Reels, X/Twitter) in a React + Vite PWA with 9–15 video cards. The core challenge is that each platform has different embedding requirements, autoplay constraints, API key needs, and mobile behavior. The key findings are: YouTube IFrame API works well with `mute=1&autoplay=1` for autoplay; TikTok oEmbed requires no API key for public videos but does need a script injection; Instagram Reels oEmbed **requires** a Facebook App access token since 2020; X/Twitter oEmbed is free and requires no API key. The facade/lazy-load pattern (lite-youtube-embed style) is strongly recommended for performance: replace placeholders with real iframes only on user interaction.

---

## YouTube

### Embedding Basics

YouTube provides two embedding approaches:

1. **Static iframe** — simplest, no JavaScript needed:
```html
<iframe
  width="560"
  height="315"
  src="https://www.youtube.com/embed/VIDEO_ID"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen>
</iframe>
```

2. **YouTube IFrame Player API** — JavaScript-controlled, programmatic play/pause/events:
```html
<div id="player"></div>
<script>
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);

  var player;
  function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
      height: '390',
      width: '640',
      videoId: 'VIDEO_ID',
      playerVars: {
        autoplay: 1,
        mute: 1,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event) => event.target.playVideo(),
        onStateChange: onPlayerStateChange
      }
    });
  }
</script>
```

### Autoplay Policy

Browsers enforce the **Autoplay Policy** that blocks autoplaying video with audio. Specifics:

- **Desktop Chrome/Firefox/Safari**: Autoplay with audio is blocked unless the site has "media engagement" (user previously watched media on the domain). For new visitors, always mute.
- **Mobile (iOS Safari, Android Chrome)**: Autoplay is always blocked with audio. Muted autoplay is allowed but may still require `playsinline=1` on iOS.
- **Rule**: For reliable cross-browser autoplay, always use `autoplay=1&mute=1&playsinline=1`.

### Key `playerVars` Parameters

| Parameter | Value | Effect |
|-----------|-------|--------|
| `autoplay` | `0` or `1` | Start playing immediately (muted only for autoplay) |
| `mute` | `0` or `1` | Start muted (required for autoplay on mobile) |
| `playsinline` | `1` | Prevents full-screen on iOS Safari; plays inline |
| `rel` | `0` | Limits related videos to same channel |
| `modestbranding` | `1` | Reduces YouTube logo (deprecated in newer API but still works) |
| `controls` | `0` or `1` | Show/hide player controls |
| `loop` | `1` | Loop the video (requires `playlist=VIDEO_ID`) |
| `start` | `int` | Start offset in seconds |
| `enablejsapi` | `1` | Required for IFrame API JS control |
| `origin` | `https://yourdomain.com` | Required for security when enablejsapi=1 |

### lite-youtube-embed

**lite-youtube-embed** is a web component by Paul Irish / Justin Ribeiro that renders a thumbnail + play button, and only loads the actual YouTube iframe when the user clicks. This is the standard approach for performance.

```html
<!-- via unpkg or install: npm install lite-youtube-embed -->
<link rel="stylesheet" href="lite-yt-embed.css" />
<script src="lite-yt-embed.js"></script>

<lite-youtube videoid="VIDEO_ID" playlabel="Play: Video Title"></lite-youtube>
```

Or in React:
```tsx
// npm install lite-youtube-embed
import 'lite-youtube-embed/src/lite-yt-embed.css';
import 'lite-youtube-embed/src/lite-yt-embed.js';

// Then in JSX:
<lite-youtube videoid="dQw4w9WgXcQ" playlabel="Play Video" />
```

Note: The custom element requires `declare global { namespace JSX { interface IntrinsicElements { 'lite-youtube': any } } }` in TypeScript.

**Savings**: Defers ~540KB of JS/CSS/network requests until user clicks play. For a page with 9 embeds, this reduces initial load by ~5MB.

### Mobile Behavior

- `playsinline=1` is critical on iOS. Without it, tapping play launches the native fullscreen player.
- On Android, inline playback works by default.
- Muted autoplay works on both platforms with correct params.
- The IFrame API's `onStateChange` event fires correctly on mobile.

### Content Security Policy (CSP)

To allow YouTube embeds, CSP must include:
```
frame-src https://www.youtube.com https://www.youtube-nocookie.com;
img-src https://i.ytimg.com; (for thumbnails)
script-src https://www.youtube.com; (for IFrame API)
```

Use `youtube-nocookie.com` for enhanced privacy mode — same embed, no cookies set until play.

---

## TikTok

### oEmbed Endpoint

TikTok provides a public oEmbed endpoint that requires **no API key** for fetching embed codes for public videos:

```
GET https://www.tiktok.com/oembed?url=https://www.tiktok.com/@username/video/VIDEO_ID
```

Response:
```json
{
  "version": "1.0",
  "type": "video",
  "title": "...",
  "author_name": "...",
  "author_url": "...",
  "html": "<blockquote class=\"tiktok-embed\" ...>...</blockquote> <script async src=\"https://www.tiktok.com/embed.js\"></script>",
  "width": 325,
  "height": 575,
  "thumbnail_url": "...",
  "thumbnail_width": 720,
  "thumbnail_height": 1280
}
```

### Embed Format

TikTok does NOT use a standard `<iframe>` like YouTube. It uses a **blockquote + script injection** pattern:

```html
<blockquote
  class="tiktok-embed"
  cite="https://www.tiktok.com/@username/video/VIDEO_ID"
  data-video-id="VIDEO_ID"
  style="max-width: 325px; min-width: 325px;">
  <section></section>
</blockquote>
<script async src="https://www.tiktok.com/embed.js"></script>
```

The external `embed.js` script converts the blockquote into an iframe at runtime.

### Hardcoded Embed Alternative

Rather than calling the oEmbed API, you can hardcode the iframe URL directly (more reliable, no API call):

```html
<iframe
  src="https://www.tiktok.com/embed/v2/VIDEO_ID"
  width="325"
  height="575"
  frameborder="0"
  allowfullscreen
  allow="encrypted-media">
</iframe>
```

This is more predictable and avoids the async script injection. It is the recommended approach for a curated list of known video IDs.

### API Key Requirements (2026)

- **oEmbed endpoint**: No API key required for fetching embed HTML of public videos.
- **TikTok Developer API** (for programmatic content retrieval, search, etc.): Requires app registration and API keys, but Doppio does NOT need this — videos are hardcoded.
- **Important limitation**: TikTok embeds only work for **public** videos. Private or "Friends only" videos cannot be embedded.

### Mobile Rendering

- TikTok embeds are natively vertical (9:16 aspect ratio). The embed iframe is fixed at 325×575px or similar portrait dimensions.
- On mobile, this renders well since TikTok content is shot vertically.
- No special mobile adjustments needed, but max-width should be constrained on large screens.

### CSP Implications

```
frame-src https://www.tiktok.com;
script-src https://www.tiktok.com; (only if using blockquote embed method)
```

### Known Issues

- TikTok's `embed.js` is slow (~300–500ms to load and process).
- The blockquote approach may fail if the script is blocked by ad-blockers.
- The direct `iframe` URL approach is more resilient.
- TikTok's embed width is fixed and doesn't scale like YouTube — plan for a fixed-width card container.

---

## Instagram Reels

### API Key Requirement — CRITICAL

**Instagram oEmbed requires a Facebook App access token as of October 24, 2020.** This is a hard requirement — unauthenticated oEmbed requests return HTTP 401.

oEmbed endpoint:
```
GET https://graph.facebook.com/v18.0/instagram_oembed
  ?url=https://www.instagram.com/reel/REEL_ID/
  &access_token=YOUR_FACEBOOK_APP_TOKEN
```

To obtain a token:
1. Create a Facebook Developer App at developers.facebook.com
2. Add the "oEmbed Read" product
3. Get an app access token: `APP_ID|APP_SECRET`
4. Token does NOT require user login — it's an app-level token

**For Doppio (static PWA with no backend)**: The access token would be exposed in client-side code. This is technically a security risk but is generally accepted for read-only oEmbed use cases since app tokens for oEmbed are low-privilege.

### Embed Format

```html
<blockquote
  class="instagram-media"
  data-instgrm-permalink="https://www.instagram.com/reel/REEL_ID/"
  data-instgrm-version="14">
</blockquote>
<script async src="//www.instagram.com/embed.js"></script>
```

Or via oEmbed response HTML injection.

### Direct iframe

Instagram does NOT expose a public direct iframe embed URL. The `//www.instagram.com/embed.js` script is required for rendering. There is no `instagram.com/embed/v2/...` equivalent like TikTok.

### Limitations

- Instagram Reels embeds do NOT autoplay.
- Reels cannot be embedded if the account is private.
- The embed script makes additional network requests to Instagram.
- Embedding on a domain not registered with Facebook may be blocked by Instagram's frame-ancestors policy.
- Embeds may show a login prompt on some browsers/configurations.

### Practical Recommendation for Doppio

**Consider avoiding Instagram Reels embeds** for the MVP due to:
1. API key exposure in client-side code (requires Facebook App setup)
2. No autoplay
3. More complex setup vs. YouTube/TikTok
4. Login prompts as fallback behavior can disrupt user flow

**Alternative**: Use YouTube or TikTok equivalents of the same demo content. If Instagram is necessary, use a facade with a thumbnail + link-to-Instagram button instead of a live embed.

### CSP

```
frame-src https://www.instagram.com;
script-src https://www.instagram.com;
connect-src https://graph.facebook.com;
```

---

## X/Twitter

### oEmbed Endpoint

X/Twitter provides a **free, no-API-key-required** oEmbed endpoint:

```
GET https://publish.twitter.com/oembed?url=https://twitter.com/user/status/TWEET_ID
```

Or with X/Twitter's newer domain:
```
GET https://publish.twitter.com/oembed?url=https://x.com/user/status/TWEET_ID
```

Response includes HTML with the blockquote + widget script:
```json
{
  "html": "<blockquote class=\"twitter-tweet\">...</blockquote><script async src=\"https://platform.twitter.com/widgets.js\"></script>",
  "url": "...",
  "author_name": "...",
  "width": 550
}
```

### Embed Format

```html
<blockquote class="twitter-tweet" data-media-max-width="560">
  <a href="https://twitter.com/user/status/TWEET_ID"></a>
</blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
```

For video tweets specifically, `data-media-max-width` controls video sizing.

### API Key Requirements (2026)

- **oEmbed / widgets.js**: No API key required. The `publish.twitter.com/oembed` endpoint and `platform.twitter.com/widgets.js` are free and public.
- **Twitter API v2** (search, user data, etc.): Requires Bearer token from developer.twitter.com. Doppio does NOT need this.
- **Important**: Since Elon Musk's acquisition and the 2023 Twitter/X rebranding, some API policies changed. However, oEmbed for public tweets remains free and unauthenticated as of 2025.

### Video Tweet Embedding

For tweets containing video content:
- Video autoplays muted in some configurations but browser autoplay policies apply.
- The `widgets.js` renders the tweet as an iframe with the video player inside.
- No separate video embed URL exists — video is part of the tweet embed.

### Mobile Behavior

- Twitter widgets are responsive and adapt to container width.
- `data-media-max-width` parameter controls maximum video width.
- Mobile rendering is handled by Twitter's widget JavaScript.
- Touch interaction (tap to play) works correctly on mobile.

### Known Issues

- `widgets.js` (~180KB) adds load weight.
- Content may not render if X/Twitter's CDN is blocked (corporate firewalls, some countries).
- Deleted or suspended accounts result in a "Tweet not found" placeholder.
- Private accounts cannot be embedded.
- Load time for widget initialization: 500ms–2s depending on network.

### CSP

```
frame-src https://platform.twitter.com https://twitter.com https://x.com;
script-src https://platform.twitter.com;
```

---

## Fallback Strategy

### Failure Modes

| Platform | Failure Cause | Frequency |
|----------|--------------|-----------|
| YouTube | API blocked, video deleted, region restriction | Low |
| TikTok | Video deleted, account banned, blocked in some regions | Medium |
| Instagram | API key issues, account private, login wall | High |
| X/Twitter | Account suspended, tweet deleted, X CDN blocked | Medium |

### Recommended Fallback Architecture

```tsx
// VideoEmbed component with fallback
interface VideoEmbedProps {
  platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter';
  videoId: string;
  fallbackImageUrl?: string;
  fallbackLinkUrl?: string;
  title: string;
}

// 1. Attempt embed
// 2. On error event or iframe load failure → show fallback
// 3. Fallback: thumbnail image + "Watch on [Platform]" button
```

### Fallback Levels

**Level 1 — Alternate video**: Each card has 1–2 backup videos from a different platform.

**Level 2 — Static thumbnail + link**: Show the video thumbnail image with a prominent "Watch on YouTube/TikTok" button that opens in a new tab. The learning experience still works — user watches the video externally.

**Level 3 — Text description**: If even thumbnails fail to load, show a brief text description of what the video demonstrates.

```tsx
const VideoFallback = ({ title, linkUrl, thumbnailUrl }) => (
  <div className="video-fallback">
    {thumbnailUrl && (
      <img src={thumbnailUrl} alt={title} className="w-full aspect-video object-cover rounded" />
    )}
    <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="cta-button">
      Watch: {title} →
    </a>
  </div>
);
```

### Detection Strategy

```tsx
const [embedError, setEmbedError] = useState(false);

// For YouTube (IFrame API):
player.addEventListener('onError', (e) => {
  if ([100, 101, 150].includes(e.data)) { // video unavailable/restricted
    setEmbedError(true);
  }
});

// For iframe-based embeds (TikTok direct, Twitter):
<iframe onError={() => setEmbedError(true)} ... />
// Note: iframe onError is not reliable cross-browser; use timeout approach:
// If iframe height is 0 or doesn't resize within 3s, assume failure.
```

---

## Performance & Lazy Loading

### The Core Problem

Loading 9 video embeds simultaneously is catastrophic for performance:
- YouTube: ~540KB JS + thumbnail requests
- TikTok: ~300KB embed.js + iframe
- Twitter: ~180KB widgets.js

Total on a 9-card page: potentially 5–10MB+ of third-party resources.

### Facade Pattern (Recommended)

The facade pattern shows a static thumbnail + play button, loads the real embed only on click:

```tsx
interface VideoFacadeProps {
  platform: 'youtube' | 'tiktok' | 'twitter';
  videoId: string;
  thumbnailUrl: string;
  title: string;
}

const VideoFacade: React.FC<VideoFacadeProps> = ({
  platform,
  videoId,
  thumbnailUrl,
  title,
}) => {
  const [isActivated, setIsActivated] = useState(false);

  if (isActivated) {
    return <VideoEmbed platform={platform} videoId={videoId} title={title} />;
  }

  return (
    <div
      className="relative cursor-pointer aspect-video bg-black rounded-lg overflow-hidden"
      onClick={() => setIsActivated(true)}
    >
      <img
        src={thumbnailUrl}
        alt={title}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <PlayButton />
      </div>
    </div>
  );
};
```

### Intersection Observer for Deferred Activation

For cards not currently visible, defer even loading the facade:

```tsx
const VideoCard: React.FC = ({ video }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // pre-load 200px before entering viewport
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-h-[200px]">
      {isVisible && <VideoFacade {...video} />}
    </div>
  );
};
```

### YouTube-Specific Performance

**Thumbnail URL pattern** (no API key needed):
```
https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg     // 480x360
https://i.ytimg.com/vi/VIDEO_ID/mqdefault.jpg     // 320x180
https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg // 1280x720 (not always available)
```

Use `hqdefault.jpg` as the reliable default — always exists.

**lite-youtube-embed** implements this pattern as a web component. For React, install via:
```bash
npm install lite-youtube-embed
```

```tsx
import 'lite-youtube-embed/src/lite-yt-embed.css';
import 'lite-youtube-embed/src/lite-yt-embed.js';

// Declare in types file or inline:
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lite-youtube': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { videoid: string; playlabel?: string },
        HTMLElement
      >;
    }
  }
}

// Usage:
<lite-youtube videoid="VIDEO_ID" playlabel="Play demo video" />
```

### TikTok-Specific Performance

- Use the direct `iframe` URL (`https://www.tiktok.com/embed/v2/VIDEO_ID`) instead of blockquote + embed.js.
- This avoids loading `embed.js` and gives a real iframe that can be lazy-loaded.
- Show a static thumbnail from the oEmbed API response (`thumbnail_url`) as the facade.

### Script Loading Strategy

Load platform scripts once, not per-embed:

```tsx
// utils/embedScripts.ts
let twitterLoaded = false;
let tiktokLoaded = false;

export const loadTwitterWidgets = () => {
  if (twitterLoaded || window.twttr) return;
  twitterLoaded = true;
  const script = document.createElement('script');
  script.src = 'https://platform.twitter.com/widgets.js';
  script.async = true;
  document.head.appendChild(script);
};

// Call only when first Twitter embed is activated
```

### Core Web Vitals Impact

| Approach | LCP Impact | CLS Risk | FID Impact |
|----------|-----------|----------|------------|
| All iframes on load | High (blocks render) | High (reflow) | High |
| Facade + click-to-load | None | None (fixed size) | None |
| IntersectionObserver deferred | Low | Low | Low |
| lite-youtube-embed | Minimal | None | Minimal |

**Recommendation**: Facade pattern for all platforms + IntersectionObserver to defer even thumbnail loading for off-screen cards.

---

## Mobile Considerations

### Viewport and Aspect Ratio

All embeds must be responsive. Use the padding-bottom trick or CSS `aspect-ratio`:

```css
/* Modern approach (CSS aspect-ratio) */
.video-container {
  width: 100%;
  aspect-ratio: 16 / 9; /* YouTube, Twitter */
  /* or */
  aspect-ratio: 9 / 16; /* TikTok, Instagram Reels */
}

/* Legacy fallback (padding-bottom) */
.video-wrapper {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  overflow: hidden;
}
.video-wrapper iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

### Platform Aspect Ratios

| Platform | Aspect Ratio | Notes |
|----------|-------------|-------|
| YouTube | 16:9 | Landscape standard |
| YouTube Shorts | 9:16 | Vertical; use same embed URL |
| TikTok | 9:16 | Always vertical |
| Instagram Reels | 9:16 | Always vertical |
| X/Twitter | Variable | Widget is responsive; video 16:9 within tweet |

### iOS Safari Specifics

- **`playsinline`**: Must be set on iframe `allow` attribute for inline play. For YouTube IFrame API, `playerVars: { playsinline: 1 }` is required.
- **Fullscreen**: iOS opens video in native fullscreen by default unless `playsinline` is set.
- **PWA Standalone Mode**: `window.navigator.standalone === true` in PWA mode. Video behavior is the same as Safari but without browser chrome.
- **Audio**: Autoplay with audio is blocked even in standalone PWA mode on iOS — always mute autoplay.

### Android Chrome Specifics

- `playsinline` is respected by default on Android.
- Muted autoplay works without special flags.
- Video performance is generally better than iOS.

### Touch vs Click

- YouTube IFrame API fires the same events on touch.
- TikTok iframe loads on tap.
- Twitter widgets handle touch natively.
- The `onClick` handler in React works for both mouse and touch.

### Vertical Video on Wide Screens

For TikTok/Reels content on desktop:
```css
.vertical-video-container {
  max-width: 325px; /* Match TikTok embed width */
  margin: 0 auto;
}
```
Or letterbox within the card with black bars — consistent with how these platforms display on web.

---

## API Keys Required (Matrix)

| Platform | oEmbed/Embed | API Key | Notes |
|----------|-------------|---------|-------|
| **YouTube** | `youtube.com/embed/VIDEO_ID` (iframe) | **No** | Direct iframe works without key; IFrame API (JS) also free |
| **YouTube IFrame API** | `youtube.com/iframe_api` (JS) | **No** | Free, no quota for embedding |
| **YouTube Data API v3** | Search, metadata retrieval | **Yes** | Not needed for Doppio — videos are hardcoded |
| **TikTok oEmbed** | `tiktok.com/oembed` | **No** | Free for public videos |
| **TikTok direct iframe** | `tiktok.com/embed/v2/VIDEO_ID` | **No** | Best approach for Doppio |
| **TikTok Content API** | Programmatic content search | **Yes** | Not needed |
| **Instagram oEmbed** | `graph.facebook.com/instagram_oembed` | **YES** | Facebook App token required since Oct 2020 |
| **Instagram embed.js** | Client-side script | **No** | But oEmbed to get the HTML still needs token |
| **X/Twitter oEmbed** | `publish.twitter.com/oembed` | **No** | Free and public |
| **X/Twitter widgets.js** | Client-side script | **No** | Free |
| **X/Twitter API v2** | Search, user data | **Yes** | Not needed for Doppio |

### Recommendation for Doppio MVP

Given 9 hardcoded video cards:
- **Use YouTube** as primary platform — no API key, excellent embed support, best mobile behavior.
- **Use TikTok direct iframe** as secondary — no API key, works well.
- **Avoid Instagram Reels embed** in MVP — requires Facebook App setup, no autoplay, risks login prompts. Use YouTube/TikTok equivalents or a thumbnail-link fallback.
- **Use X/Twitter** if content demands it — no API key, reasonable embed quality.

---

## Common Pitfalls

### 1. Missing `playsinline` on iOS
**Problem**: YouTube video launches fullscreen native player on iOS Safari instead of playing inline.
**Fix**: Add `playsinline: 1` to `playerVars` and `allow="... playsinline"` to iframe allow attribute.

### 2. Autoplay with Audio Fails Silently
**Problem**: Autoplay works in development (user has "media engagement") but fails for first-time visitors.
**Fix**: Always use `mute=1` for autoplay. Optionally show an unmute button.

### 3. CLS (Cumulative Layout Shift) from Embeds
**Problem**: Iframes loading async cause page to reflow and shift content.
**Fix**: Pre-define aspect ratio containers. Use `aspect-ratio: 16/9` CSS on the container before the iframe loads.

### 4. TikTok `embed.js` Replacing DOM
**Problem**: `embed.js` replaces the blockquote element and may cause React reconciliation issues.
**Fix**: Use the direct iframe URL `https://www.tiktok.com/embed/v2/VIDEO_ID` instead of blockquote approach.

### 5. Twitter Widget Initialization Order
**Problem**: `twttr.widgets.load()` must be called after inserting tweet blockquote HTML into the DOM. If called too early, tweets don't render.
**Fix**: Call `window.twttr?.widgets?.load()` in a `useEffect` after the component mounts, or use `twttr.ready()` callback.

### 6. CSP Blocking Third-Party Scripts
**Problem**: Strict CSP blocks `embed.js`, `widgets.js`, or iframe src.
**Fix**: Add platform-specific `frame-src` and `script-src` directives. Consider using `youtube-nocookie.com` for YouTube.

### 7. Instagram Embeds Prompting Login
**Problem**: Instagram may show a "Log in to see this reel" overlay for some content.
**Fix**: Avoid Instagram embeds in MVP. Use thumbnail + external link fallback.

### 8. oEmbed Fetching at Runtime (Server vs Client)
**Problem**: Calling oEmbed APIs from client-side code is fine for YouTube (not needed at all) and TikTok (not needed if using direct iframe), but Instagram requires an API key that gets exposed.
**Fix**: For Instagram, call from a serverless function to hide the token — but this adds backend complexity to the MVP. Better to skip Instagram embeds entirely.

### 9. YouTube `rel=0` Change
**Problem**: In 2018, YouTube changed `rel=0` to show related videos from the same channel rather than disabling related videos entirely. There is no way to fully disable related videos in 2025.
**Fix**: Accept this behavior, or use `youtube-nocookie.com` which may reduce some tracking but doesn't eliminate related videos.

### 10. Video Deleted / Account Suspended After Launch
**Problem**: A hardcoded video ID may become unavailable post-launch.
**Fix**: Have 3–6 backup video IDs per card. Implement error detection (YouTube `onError` event, iframe fallback logic) and swap to backup automatically.

---

## References

- YouTube IFrame Player API Reference: https://developers.google.com/youtube/iframe_api_reference
- YouTube Player Parameters: https://developers.google.com/youtube/player_parameters
- YouTube Privacy-Enhanced Mode: https://support.google.com/youtube/answer/171780
- lite-youtube-embed (Paul Irish): https://github.com/paulirish/lite-youtube-embed
- lite-youtube-embed (web component): https://github.com/justinribeiro/lite-youtube
- TikTok oEmbed Documentation: https://developers.tiktok.com/doc/embed-videos/
- TikTok Embed Direct URL: https://www.tiktok.com/embed/v2/{VIDEO_ID}
- Instagram oEmbed API (Facebook): https://developers.facebook.com/docs/instagram/oembed/
- Instagram oEmbed Auth Change (2020): https://developers.facebook.com/blog/post/2020/09/28/deprecating-instagram-oembed-api-change/
- Twitter/X oEmbed: https://developer.twitter.com/en/docs/twitter-for-websites/oembed-api
- Twitter Widgets.js: https://developer.twitter.com/en/docs/twitter-for-websites/javascript-api/guides/set-up-twitter-for-websites
- Web Autoplay Policy (Chrome): https://developer.chrome.com/blog/autoplay/
- MDN IntersectionObserver: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- Web Vitals and Third-Party Embeds: https://web.dev/third-party-facades/
- Content Security Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
