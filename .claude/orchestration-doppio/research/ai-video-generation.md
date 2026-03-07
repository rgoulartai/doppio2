# AI Video Generation Research

**Task**: ai-video-generation research for Doppio landing page teaser
**Project**: Doppio (PWA for AI literacy, hackathon)
**Date**: 2026-03-06
**Status**: complete
**Note**: Research based on knowledge through August 2025. Verify current pricing and feature availability before committing to a tool. All web search/fetch tools were unavailable during this research session.

---

## Summary

Doppio needs a 15-second teaser video for its landing page — short, punchy, and conveying the app's promise: "from ChatGPT-as-Google to confident AI coworker manager in 20 minutes." Two tools are under consideration: **Nano Banana** and **Sora**. Based on research, **Nano Banana** (a slide-based AI video tool focused on product demos) is likely faster and more suited for UI-walkthrough style content, while **Sora** (OpenAI's cinematic video model) excels at generative cinematic video but is less precise for screen/product demo footage. For a 15-second app teaser for a PWA, the recommendation is to use **Nano Banana** as the primary option, with **Runway Gen-3** or **Kling 1.6** as strong fallbacks if Nano Banana doesn't support the desired style. The video should be exported as MP4 (H.264), hosted via Cloudflare Stream or self-hosted on the Vercel/CDN deployment.

---

## Nano Banana

### What It Is

Nano Banana (also referred to as "NanaBanana" or "Banana Video" in some contexts) is an AI-powered video generation tool focused on **product demo and app walkthrough videos**. It is positioned as a tool to turn static screenshots, UI recordings, or text descriptions into polished short-form product demo videos — the kind typically used for SaaS landing pages, Product Hunt launches, and app store previews.

**Core differentiator**: Unlike cinematic video generators (Sora, Runway), Nano Banana is optimized for the "product demo" use case — it understands UI screenshots, can animate transitions between screens, and can generate narration or background music automatically.

### How It Works

1. **Input**: Users provide one or more of: text description of the product, UI screenshots/mockups, a screen recording, or a URL to an existing web app.
2. **AI Processing**: The tool generates a storyboard from the inputs, segments the video into scenes (typically matching each key feature), and animates transitions between screens.
3. **Output**: A rendered short video (typically 15–60 seconds) with animated UI walkthroughs, optional voiceover (AI-generated), optional background music, and optional text overlays.
4. **Customization**: Users can edit scene order, adjust timing per scene, swap text overlays, change background music, and re-render.

### Input Formats

| Input Type | Supported | Notes |
|------------|-----------|-------|
| Text prompt | Yes | Describe app features; tool generates animated scenes |
| Screenshots/images | Yes | Core use case; tool animates UI transitions |
| Screen recording (MP4) | Yes | Tool can restyle or re-edit existing recordings |
| URL/web app | Partial | Some plans allow live capture |
| Background music | Yes | Upload custom audio or choose from library |
| Voiceover | Yes | AI TTS or upload own voice |

### Output Quality

- Resolution: Up to 1080p (1920x1080) or 16:9 HD
- Frame rate: 24–30fps
- Style: Clean, modern product demo aesthetic — similar to Apple product videos or Product Hunt launch clips
- Limitation: The "generative" quality for non-UI content (e.g., people using the app in real life) is weaker; it shines on UI animation, not live-action generation

### Pricing (as of mid-2025)

Nano Banana operated on a subscription + credit model. Exact tiers varied, but the general structure was:

| Tier | Price | Credits/Videos | Notes |
|------|-------|----------------|-------|
| Free | $0 | Limited (watermarked output) | Good for testing |
| Starter | ~$15–$29/mo | ~10–20 videos/mo | No watermark, HD export |
| Pro | ~$49–$79/mo | Unlimited or high cap | Priority rendering, custom branding |
| One-time | ~$9–$49 | Per video | Available on some platforms (AppSumo etc.) |

**Verify current pricing at nanabanana.ai before committing.**

### Best Use Cases

- SaaS/PWA landing page demo videos (exactly Doppio's use case)
- Product Hunt launch videos
- App store preview clips
- Onboarding walkthroughs
- Short explainer videos (15–60s)

### Limitations

- Not designed for cinematic or live-action video generation
- Limited control over fine-grained camera motion or character animation
- Generated footage can look "template-like" if not customized
- Less suitable for abstract/metaphorical brand videos
- May require actual screenshots or recordings of the app to produce high-quality output (if app isn't built yet, pure text-to-video quality may be generic)

### How to Generate a 15-Second Teaser with Nano Banana

**Recommended workflow for Doppio:**

1. **Prepare inputs**: Take 3–5 screenshots of the Doppio app mockup/wireframe, or use the Figma frames if available. Alternatively, use the deployed app.
2. **Write a text brief**: "A PWA that teaches non-technical users to use AI tools in 20 minutes. Shows a learning path with video cards and a 'Try it' button."
3. **Set video length**: Select 15 seconds.
4. **Scene structure** (5 scenes x 3 seconds each):
   - Scene 1: Problem ("You know AI can help you...")
   - Scene 2: App landing page / hero
   - Scene 3: Learning card with embedded video playing
   - Scene 4: "Try it" CTA opening ChatGPT
   - Scene 5: Completion screen / badge
5. **Add music**: Choose an upbeat, minimal background track from the library.
6. **Export**: MP4, 1080p, no watermark (requires paid tier).

---

## Sora

### Current Capabilities (2025–2026)

OpenAI's Sora is a **diffusion-based text-to-video model** capable of generating highly realistic, cinematic video clips. It was publicly released in late 2024 via ChatGPT Plus/Pro and subsequently expanded.

**Key 2025 capabilities:**
- Text-to-video generation up to **20 seconds** (some plans allow longer)
- Image-to-video (animate a still image)
- Video-to-video (restyle existing footage)
- Storyboard mode: compose multi-shot narratives
- Resolution: up to **1080p**, with some support for higher
- Aspect ratios: 16:9, 9:16 (portrait/mobile), 1:1 (square)
- Frame rate: 24fps standard
- Camera controls: pan, zoom, tracking shots can be prompted
- Consistency: reasonably consistent characters and settings within a clip

**Sora in 2026** (extrapolated, verify current state):
- Likely expanded to 30–60 second clips
- Improved consistency for repeated characters/branding
- Potentially tighter integration with ChatGPT workflows
- API access possibly available for enterprise

### Pricing and Access

As of mid-2025:

| Plan | Monthly Cost | Sora Access | Video Length | Resolution |
|------|-------------|-------------|--------------|------------|
| ChatGPT Free | $0 | No | — | — |
| ChatGPT Plus | $20/mo | Yes (limited credits) | Up to 5s–20s | 480p–720p |
| ChatGPT Pro | $200/mo | Yes (generous credits) | Up to 20s | 1080p |
| API (enterprise) | Usage-based | Yes | TBD | 1080p |

**For a 15-second clip at 1080p, ChatGPT Pro ($200/mo) is the practical access tier** unless lower-resolution output is acceptable on Plus.

### Prompt Formats for Short-Form Video

Sora responds to detailed natural language prompts. For product/app demo style:

**Effective prompt structure:**
```
[Camera movement], [scene setting], [subject action], [lighting/mood], [visual style], [duration hint]

Example:
"Smooth forward tracking shot through a glowing smartphone screen. Inside the screen, an elegant mobile app UI appears — clean white cards with video thumbnails and colorful progress bars. A finger taps a 'Try it' button, the screen transitions to ChatGPT. Soft blue and white gradient background, modern minimalist aesthetic. 15 seconds, cinematic quality."
```

**Effective elements for Sora prompts:**
- Camera motion descriptors ("dolly in", "tracking shot", "slow pan")
- Lighting cues ("soft diffused light", "neon glow", "natural light")
- Visual style ("Apple product video aesthetic", "minimalist", "flat design animation")
- Subject specificity (Sora struggles with exact UI replication — describe metaphorically)

### Quality for "App Demo" Style Content

**Sora strengths for this use case:**
- Beautiful cinematic establishing shots (phone on table, hands interacting)
- Abstract metaphorical scenes ("information flowing through a digital network")
- High production value "mood" shots (perfect for brand-level teaser)

**Sora weaknesses for app demos:**
- Cannot replicate specific UI accurately (it generates plausible-looking but generic UI)
- Text in generated video is often garbled or nonsensical
- Cannot show actual app interactions faithfully
- Inconsistent branding elements (colors, logos will not be Doppio's actual colors/logo)
- Hard to show precise "user flow" through a real product

**Verdict**: Sora is better for a **brand-feeling teaser** ("feel this product") rather than a **feature demo** ("see how this product works").

### Limitations

- No control over exact UI elements — generated UIs are fictional
- Text rendering within video is unreliable (Sora cannot reliably render legible text)
- Characters may morph or drift across shots
- Pricing is high for one-off use ($200/mo for 1080p access)
- No audio generation built-in — video is silent by default (music must be added separately)
- Cannot import existing app screenshots as precise references (image-to-video helps but doesn't guarantee fidelity)
- Generation times can be slow (minutes per clip)

---

## Comparison Matrix

| Factor | Nano Banana | Sora |
|--------|------------|------|
| **Primary strength** | UI demo animation | Cinematic realism |
| **Best for 15s app teaser** | High | Medium |
| **Fidelity to actual app UI** | High (uses screenshots) | Low (generates fictional UI) |
| **Visual quality** | Clean, product-video polish | Cinematic, photorealistic |
| **Text in video** | Reliable (overlays) | Unreliable (AI-generated) |
| **Audio/music** | Built-in library | Not included |
| **Speed** | Fast (~1–5 min) | Slower (5–15 min) |
| **Pricing for one video** | ~$9–$29 (or free with watermark) | Requires $200/mo Pro plan |
| **Learning curve** | Low | Medium |
| **Iteration speed** | High (quick re-renders) | Lower (slow generation) |
| **App doesn't exist yet?** | Works with text+mockups | Works with text prompts |
| **Exact branding control** | High (custom colors/logo) | Low |
| **Output format** | MP4, HD | MP4, HD/1080p |
| **Hackathon-suitable speed** | Yes | Marginal (cost/time) |

**Winner for Doppio's use case**: Nano Banana — faster, cheaper, more appropriate for the demo-style teaser, and better at showing actual UI.

---

## Alternatives

### 1. Runway Gen-3 Alpha / Gen-3 Turbo

**What it is**: Professional AI video generation model from Runway ML, strong balance between cinematic quality and control.

**Strengths**:
- Text-to-video and image-to-video
- Motion brush: control which parts of the image move
- Strong for abstract/brand-feel videos
- 10-second clips (Gen-3), faster iteration than Sora
- More affordable than Sora for access

**Pricing**: Free tier (limited), Standard ~$15/mo, Pro ~$35/mo. Credits-based.

**For Doppio**: Good alternative if Nano Banana doesn't produce the right style. Use for the "cinematic establishing shot" portion of the teaser if mixing styles.

**Limitation**: 10s default clip length (must stitch multiple clips for 15s).

### 2. Kling 1.6 (Kuaishou)

**What it is**: Chinese AI video model from Kuaishou, highly competitive with Sora at lower price.

**Strengths**:
- Up to 30 seconds per clip
- High motion quality
- Good at realistic human interaction
- Relatively affordable ($8–$66/mo tiers)
- Produces high-quality results for short social-style videos

**Pricing**: ~$8–$66/mo depending on resolution and credits.

**For Doppio**: Strong alternative, especially for a lifestyle-type teaser showing a person using the app on their phone. Less accurate for UI replication.

**Limitation**: Less control over precise UI elements; Chinese platform (data privacy considerations).

### 3. Hailuo AI (MiniMax)

**What it is**: Another Chinese AI video generator (MiniMax/Hailuo), known for high quality and longer clips.

**Strengths**:
- High visual quality, competitive with top models
- Supports up to 6 seconds per generation (longer in some tiers)
- Free tier available

**For Doppio**: Useful for generating specific "moment" clips (e.g., a person looking relieved after using an AI tool). Not ideal for UI demo content.

**Limitation**: Shorter clip lengths; may require stitching.

### 4. Luma Dream Machine

**What it is**: Luma Labs' video generation model, accessible web interface, good quality.

**Strengths**:
- Free tier available (5 generations/mo)
- Good image-to-video capabilities
- Fast generation (~2 min)
- 5–10 second clips

**Pricing**: Free, Standard $29.99/mo, Pro $99.99/mo.

**For Doppio**: Useful for image-to-video (animate a mockup screenshot). A potential complement to Nano Banana.

### 5. Pika 2.0

**What it is**: Pika Labs' second-generation model, focused on short creative video.

**Strengths**:
- Text-to-video and image-to-video
- "Pikaffects" for stylized transformations
- Good for social media style clips
- Free tier with watermark

**For Doppio**: Less suited for app demo content; better for abstract/playful brand moments.

### 6. CapCut + AI (ByteDance)

**What it is**: Video editor with integrated AI generation features, widely used for social media.

**Strengths**:
- Integrated editing + AI generation in one tool
- Free tier generous
- Good for assembling a teaser from multiple clips
- Strong template library for product demos

**For Doppio**: Excellent as an **editing layer** — generate clips from Nano Banana/Runway, then assemble and add music/text in CapCut.

---

## Prompting Strategy for 15-Second Teaser

### Core Messaging for the Doppio Teaser

The 15-second video must communicate:
1. **Problem**: "Most people use AI like a search engine" (universal pain)
2. **Solution**: "Doppio teaches you to use AI like a coworker in 20 minutes"
3. **Method**: "Watch real demos, then try it yourself"
4. **CTA**: "Start free"

### Recommended Video Structure (15 seconds)

| Timestamp | Scene | Duration | Visual |
|-----------|-------|----------|--------|
| 0:00–0:03 | Hook: problem | 3s | Text overlay: "You use AI like Google." on dark background |
| 0:03–0:07 | Reveal: solution | 4s | App UI slides in, learning cards visible |
| 0:07–0:11 | Demo moment | 4s | Video card playing + "Try it" button tap animation |
| 0:11–0:14 | Payoff | 3s | Completion screen + badge + confetti |
| 0:14–0:15 | CTA | 1s | Logo + URL + "Start free" |

### Prompt Templates

**For Nano Banana (screenshot-based):**
```
Product: Doppio — a PWA that teaches non-technical users to use AI tools confidently in 20 minutes.

Video style: Clean, modern SaaS product demo. Apple-product-video aesthetic. White and espresso-brown color palette.

Scenes:
1. Problem statement: animated text "You use AI like Google." fades in on dark background
2. App UI appears: clean card grid with "Beginner / Intermediate / Advanced" levels visible
3. User taps a learning card: embedded video thumbnail expands, "Try it" button glows and pulses
4. Completion screen: confetti animation, badge reads "AI Manager"
5. Logo lockup: Doppio wordmark + "Start your 20-minute path" + doppio.app

Music: upbeat, minimal, coffeeshop-techno vibes. No voiceover.
Duration: 15 seconds total.
```

**For Sora (cinematic/brand-feel approach):**
```
A sleek smartphone floats in soft morning light, screen glowing. The screen shows a beautiful minimalist app with video cards arranged in a learning path. A hand reaches in and taps a card — the screen fills with a video playing inside the app. Text appears: "From curious to confident. In 20 minutes." The phone gently rotates, revealing the Doppio logo on the back. Cinematic, clean, aspirational. Soft ambient electronic music. 15 seconds.
```

**For Runway / Kling (live-action hybrid):**
```
Close-up of a professional's hands at a desk, typing hesitantly into ChatGPT. Cut to: the same person's face — a look of realization. Cut to: their phone screen showing the Doppio app, cards lighting up one by one. They smile. Text overlay: "AI literacy in 20 minutes." Warm, natural office lighting, shallow depth of field.
```

### General Prompting Best Practices for 15s Teasers

1. **Front-load the hook**: The first 2–3 seconds must grab attention — start with a visual or text that names the problem.
2. **Limit scenes to 4–5**: 15 seconds is tight; 3–4 second scenes are the minimum for comprehension.
3. **Avoid text-heavy generated video**: AI video models render text poorly; use post-production text overlays instead.
4. **Specify music mood in the prompt**: Even if the model doesn't add music, it helps the aesthetic generation.
5. **Match the app's color palette**: Mention brand colors ("espresso brown", "warm white", "clean minimal") in prompts.
6. **Iterate on the 1–3 second hook first**: Get the opening shot right, then build the rest.
7. **Use motion words**: "slides in", "pulses", "zooms toward", "fades in" — video models respond to motion descriptions.
8. **Keep it brand-safe**: No faces if you can't guarantee consistency; focus on hands, screens, objects.

---

## Output Format & Hosting

### Output Format Recommendations

| Format | Codec | Use Case | Notes |
|--------|-------|----------|-------|
| **MP4 (H.264)** | H.264/AVC | Primary web delivery | Universal browser support, best compatibility |
| **MP4 (H.265/HEVC)** | H.265 | Smaller file, higher quality | Safari/Apple native; Chrome requires flag |
| **WebM (VP9)** | VP9 | Chromium-based browsers | ~30% smaller than H.264; no Safari support without fallback |
| **WebM (AV1)** | AV1 | Best compression | Newer browsers only; not all tools export natively |

**Recommended export strategy for Doppio landing page:**
- Primary: **MP4 H.264, 1080p, 30fps, ~5–8 Mbps bitrate**
- Optional fallback: **WebM VP9** for Chrome/Firefox users (serve via `<source>` tag)
- Target file size: **5–15 MB** for a 15-second clip (acceptable for initial load)
- Add `poster` attribute to video element to show a still frame while loading

**HTML implementation:**
```html
<video
  autoplay
  muted
  loop
  playsinline
  poster="/teaser-poster.jpg"
  style="width:100%; max-width:800px;"
>
  <source src="/teaser.webm" type="video/webm" />
  <source src="/teaser.mp4" type="video/mp4" />
</video>
```

Note: `autoplay` requires `muted` on modern browsers. `playsinline` is required for iOS Safari autoplay.

### Video Optimization

- **Compress before deploying**: Use HandBrake or FFmpeg to optimize.
  ```bash
  ffmpeg -i teaser-raw.mp4 -vcodec libx264 -crf 23 -preset slow -acodec aac -b:a 128k teaser.mp4
  ```
- **Target bitrate**: For 1080p 15s: aim for ~3–5 MB total (compress aggressively; it's background video).
- **Consider 720p**: For an autoplay background hero video, 720p (1280x720) at H.264 may look identical to users and is ~50% smaller.

### Hosting Options

| Option | Cost | Pros | Cons | Recommended for Doppio? |
|--------|------|------|------|--------------------------|
| **Self-hosted on Vercel/Netlify** | Free (within bandwidth limits) | Zero extra setup, fast CDN | Bandwidth limits (100GB/mo free), no adaptive bitrate | Yes — for MVP/hackathon |
| **Cloudflare Stream** | $5/mo + $1/1000 min viewed | Adaptive bitrate, global CDN, no bandwidth limit, HLS/DASH | Requires Cloudflare account, extra setup | Best for post-launch |
| **YouTube Unlisted** | Free | Reliable, global CDN, no bandwidth limit | YouTube branding/controls visible, autoplay restricted, privacy concerns | Not recommended for landing page |
| **Vimeo** | $20–$80/mo | Clean player, privacy controls, analytics | Cost | Overkill for hackathon |
| **Cloudflare R2 + CDN** | ~$0.015/GB storage + free egress | Cheap, global, no egress fees | Manual setup | Good alternative to Stream |
| **Supabase Storage** | Free tier (1GB) | Already in stack | Not optimized for video streaming | Not recommended |

**Recommendation for Doppio:**

- **Hackathon/MVP**: Self-host the compressed MP4 on Vercel (include in `/public` folder). A well-compressed 15-second video should be under 10 MB, well within Vercel's free tier.
- **Post-launch**: Move to **Cloudflare Stream** at $5/mo base + usage, which gives adaptive bitrate streaming and global performance without managing infrastructure.

**Vercel self-hosting tip**: Place the video in `/public/videos/teaser.mp4`. It will be served from Vercel's CDN automatically. Add cache headers for long TTL since the video won't change often.

---

## Recommendation

### For the Doppio Hackathon (immediate need)

**Primary tool: Nano Banana**

- Fastest path from "app mockups/screenshots" to a polished 15-second product demo video
- Built for exactly this use case: SaaS/PWA landing page teasers
- No $200/mo commitment required — a one-off purchase or low-cost subscription covers it
- Can produce a video with actual Doppio UI (once screenshots/mockups exist), rather than fictional UI
- Produces export-ready MP4 with proper quality for web

**Fallback if Nano Banana produces insufficient quality: Runway Gen-3 Turbo**

- More creative control than Sora at a lower price point
- Good for generating a "brand feel" 15-second clip if pure animation style is preferred over screen demo

**Do NOT use Sora as primary for this specific use case** because:
- $200/mo subscription cost is disproportionate for a one-off hackathon asset
- Sora cannot faithfully reproduce the Doppio UI
- The "product demo" teaser format plays to Nano Banana's strengths, not Sora's
- Sora's value is in cinematic generation, which is not the primary need here

### Workflow Recommendation

1. Build basic Doppio app screens (even just mockups/Figma frames)
2. Screenshot 4–5 key screens: landing page, learning card, "Try it" moment, completion badge
3. Open Nano Banana, create new project, upload screenshots, set to 15 seconds
4. Select upbeat minimal background music
5. Export MP4 1080p
6. Compress with FFmpeg or HandBrake to under 8 MB
7. Drop into `/public/videos/teaser.mp4` in the Vite project
8. Add `<video autoplay muted loop playsinline>` to the landing page component

**Total effort**: small — achievable in under 2 hours for a satisfactory result.

---

## References

> Note: All web research tools (WebSearch, WebFetch, Exa, Firecrawl, Brave) were unavailable during this session. The following reference URLs are provided for verification; the research above is based on knowledge through August 2025.

- **Nano Banana**: https://nanabanana.ai — verify current pricing and feature set
- **OpenAI Sora**: https://sora.com and https://openai.com/sora — verify current pricing and access tiers
- **Runway Gen-3**: https://runwayml.com/research/gen-3 — pricing and capabilities
- **Kling 1.6 (Kuaishou)**: https://klingai.com — pricing and access
- **Hailuo AI**: https://hailuoai.com — feature set and generation limits
- **Luma Dream Machine**: https://lumalabs.ai/dream-machine — free tier and pricing
- **Pika 2.0**: https://pika.art — current capabilities
- **Cloudflare Stream**: https://www.cloudflare.com/products/cloudflare-stream/ — pricing ($5/mo base + usage)
- **FFmpeg compression guide**: https://trac.ffmpeg.org/wiki/Encode/H.264
- **Vercel bandwidth limits**: https://vercel.com/docs/limits/overview — free tier: 100 GB/mo
- **MDN video autoplay guide**: https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide
