# Task 5.2: OG Meta Tags + Share Assets

## Objective

Add all Open Graph and Twitter Card meta tags to `index.html` so that sharing `https://doppio.kookyos.com` or `https://doppio.kookyos.com/?ref=badge` on social media (Twitter/X, iMessage, WhatsApp, Slack, LinkedIn) shows a rich link preview with the correct title, description, and a 1200×630px badge image. Create `public/og-badge.png` as a functional static asset.

## Context

This task handles the "shareability" layer of Phase 5. Every time a user clicks "Share" on a level completion screen or the final screen, they share `https://doppio.kookyos.com/?ref=badge`. The OG image and meta tags determine how that link looks when someone else sees it. A missing or broken OG image means a plain text link — significantly hurting conversion from shares. The `og-badge.png` is committed to `/public` and served as a static asset (no dynamic image generation needed per DISCOVERY.md D43).

## Dependencies

- Task 1.1 — `index.html` exists in project root
- Task 1.4 — App deployed to `https://doppio.kookyos.com` (OG verification tools require a live URL)

## Blocked By

- Task 1.1 (`index.html` must exist to modify it)

## Research Findings

- From `DISCOVERY.md D43`: Share badge URL is `https://doppio.kookyos.com/?ref=badge`. Static `og-badge.png` (1200×630px) committed to `/public`. No dynamic image generation.
- From `DISCOVERY.md D43`: `og:image` should point to the absolute URL of `og-badge.png`.
- From `PHASES.md Task 5.2`: `og:title` = "Doppio — Become an AI Manager in 20 Minutes", `og:description` = "No coding. No prompting. Just natural language superpowers.", `twitter:card` = `summary_large_image`.
- From `DISCOVERY.md D3`: One-sentence pitch is "20 minutes from ChatGPT Googler to AI coworker boss".
- From `doppio-architecture` skill: `index.html` is the SPA entry point. All routes share the same `<head>` since React Router is client-side only.

## Implementation Plan

### Step 1: Create public/og-badge.png

Create a 1200×630px PNG image for use as the OG share image. Since this is a functional MVP for a hackathon, the image must exist and display correctly. Use one of these approaches in order of preference:

**Approach A — Node canvas script (recommended)**:

Create a temporary script `scripts/generate-og.mjs` and run it once:

```javascript
// scripts/generate-og.mjs
// Requires: npm install -D canvas
import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

const width = 1200;
const height = 630;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Background — dark purple matching brand theme_color
ctx.fillStyle = '#1a1a2e';
ctx.fillRect(0, 0, width, height);

// Accent bar at top
ctx.fillStyle = '#6c3483';
ctx.fillRect(0, 0, width, 8);

// Doppio wordmark
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 96px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Doppio', width / 2, 220);

// Tagline
ctx.font = '40px sans-serif';
ctx.fillStyle = '#e0e0e0';
ctx.fillText('Become an AI Manager in 20 Minutes', width / 2, 310);

// Subtext
ctx.font = '32px sans-serif';
ctx.fillStyle = '#a0a0b0';
ctx.fillText('No coding. No prompting. Just natural language.', width / 2, 370);

// Coffee cup emoji area (simple circle decoration)
ctx.beginPath();
ctx.arc(width / 2, 490, 50, 0, Math.PI * 2);
ctx.fillStyle = '#6c3483';
ctx.fill();

ctx.font = '48px sans-serif';
ctx.fillStyle = '#ffffff';
ctx.textAlign = 'center';
ctx.fillText('☕', width / 2, 508);

// URL watermark
ctx.font = '24px sans-serif';
ctx.fillStyle = '#666680';
ctx.fillText('doppio.kookyos.com', width / 2, 600);

writeFileSync('public/og-badge.png', canvas.toBuffer('image/png'));
console.log('og-badge.png written to public/');
```

Run it:
```bash
npm install -D canvas
node scripts/generate-og.mjs
```

**Approach B — Sharp with solid color (minimal fallback)**:

If canvas is unavailable or has native dependency issues, use `sharp` to create a colored rectangle with text overlay:

```bash
npm install -D sharp
```

```javascript
// scripts/generate-og-sharp.mjs
import sharp from 'sharp';

const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#1a1a2e"/>
  <rect width="1200" height="8" fill="#6c3483"/>
  <text x="600" y="220" font-family="Arial, sans-serif" font-size="96" font-weight="bold"
        fill="white" text-anchor="middle">Doppio</text>
  <text x="600" y="310" font-family="Arial, sans-serif" font-size="40"
        fill="#e0e0e0" text-anchor="middle">Become an AI Manager in 20 Minutes</text>
  <text x="600" y="370" font-family="Arial, sans-serif" font-size="32"
        fill="#a0a0b0" text-anchor="middle">No coding. No prompting. Just natural language.</text>
  <circle cx="600" cy="490" r="50" fill="#6c3483"/>
  <text x="600" y="508" font-family="Arial, sans-serif" font-size="48"
        fill="white" text-anchor="middle">☕</text>
  <text x="600" y="600" font-family="Arial, sans-serif" font-size="24"
        fill="#666680" text-anchor="middle">doppio.kookyos.com</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og-badge.png');
console.log('og-badge.png written to public/');
```

Run it:
```bash
node scripts/generate-og-sharp.mjs
```

**Approach C — Pure colored placeholder (absolute minimum)**:

If both canvas and sharp have issues, create the simplest possible valid PNG using `sharp`:

```javascript
// Solid dark purple 1200x630px rectangle — functional minimum
import sharp from 'sharp';
await sharp({
  create: { width: 1200, height: 630, channels: 4, background: { r: 26, g: 26, b: 46, alpha: 1 } }
}).png().toFile('public/og-badge.png');
```

Verify the output: `public/og-badge.png` must exist, be exactly 1200×630px, and be a valid PNG. Check with:
```bash
file public/og-badge.png
```

Expected: `public/og-badge.png: PNG image data, 1200 x 630, 8-bit/color RGBA, non-interlaced`

After verifying, remove any temporary `scripts/generate-og*.mjs` files and devDependencies added only for this step (canvas, sharp) to keep the project clean — they are not needed at runtime.

### Step 2: Add all OG and Twitter Card meta tags to index.html

Open `index.html`. Find the `<head>` section. Add all meta tags immediately before the closing `</head>` tag, after any existing PWA meta tags:

```html
<!-- Primary meta tags -->
<meta name="title" content="Doppio — Become an AI Manager in 20 Minutes" />
<meta name="description" content="No coding. No prompting. Just natural language superpowers. Watch curated AI demos and try each skill in 20 minutes." />

<!-- Open Graph / Facebook / WhatsApp / iMessage / Slack -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://doppio.kookyos.com" />
<meta property="og:title" content="Doppio — Become an AI Manager in 20 Minutes" />
<meta property="og:description" content="No coding. No prompting. Just natural language superpowers. Watch curated AI demos and try each skill in 20 minutes." />
<meta property="og:image" content="https://doppio.kookyos.com/og-badge.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Doppio — Become an AI Manager in 20 Minutes" />
<meta property="og:site_name" content="Doppio" />
<meta property="og:locale" content="en_US" />

<!-- Twitter Card / X -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="https://doppio.kookyos.com" />
<meta name="twitter:title" content="Doppio — Become an AI Manager in 20 Minutes" />
<meta name="twitter:description" content="No coding. No prompting. Just natural language superpowers." />
<meta name="twitter:image" content="https://doppio.kookyos.com/og-badge.png" />
<meta name="twitter:image:alt" content="Doppio — Become an AI Manager in 20 Minutes" />
```

Critical notes:
- `og:image` MUST use the absolute URL `https://doppio.kookyos.com/og-badge.png`, NOT a relative path like `/og-badge.png`. Crawlers do not resolve relative paths.
- `twitter:card` must be `summary_large_image` (not `summary`) to show the large image format.
- All meta tags with `property=` attributes (og: prefix) require the `property` attribute, not `name`.
- All meta tags with `name=` attributes (twitter: prefix) require the `name` attribute.

### Step 3: Deploy to production

After updating `index.html` and adding `public/og-badge.png`:

```bash
# Build and verify the OG image is included in the dist output
npm run build
ls dist/og-badge.png  # should exist

# Deploy to production
vercel --prod
```

### Step 4: Verify OG tags on production

After deployment, verify the meta tags are served correctly:

**Method A — Twitter Card Validator** (most reliable for Twitter/X):
1. Navigate to `https://cards-dev.twitter.com/validator` (or `https://developer.twitter.com/en/docs/twitter-for-websites/cards/guides/getting-started`)
2. Enter `https://doppio.kookyos.com`
3. Verify: title, description, and large image preview display correctly

**Method B — opengraph.xyz**:
1. Navigate to `https://www.opengraph.xyz/`
2. Enter `https://doppio.kookyos.com`
3. Verify: OG title, description, and image preview all display

**Method C — Playwright verification** (automated, run against localhost or production):

Verify meta tags are present in the page `<head>`:
```javascript
// In Playwright:
await page.goto('https://doppio.kookyos.com');
const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
const twitterCard = await page.getAttribute('meta[name="twitter:card"]', 'content');
console.assert(ogTitle === 'Doppio — Become an AI Manager in 20 Minutes');
console.assert(ogImage === 'https://doppio.kookyos.com/og-badge.png');
console.assert(twitterCard === 'summary_large_image');
```

Also verify the OG image itself is accessible:
```javascript
const imageResponse = await page.goto('https://doppio.kookyos.com/og-badge.png');
console.assert(imageResponse.status() === 200);
console.assert(imageResponse.headers()['content-type'].includes('image/png'));
```

## Files to Create

- `public/og-badge.png` — 1200×630px PNG, dark purple background (#1a1a2e), Doppio wordmark, tagline, URL watermark. Serves as OG share image.

## Files to Modify

- `index.html` — add 14 meta tags in `<head>`: primary description, og:type, og:url, og:title, og:description, og:image, og:image:width, og:image:height, og:image:alt, og:site_name, og:locale, twitter:card, twitter:url, twitter:title, twitter:description, twitter:image, twitter:image:alt

## Contracts

### Provides (for downstream tasks)

- `/og-badge.png` accessible at `https://doppio.kookyos.com/og-badge.png` — used by OG crawlers when users share the URL
- All OG and Twitter Card meta tags in `<head>` — enables rich link previews on all major platforms

### Consumes (from upstream tasks)

- `index.html` (Task 1.1) — must exist as the SPA entry point
- Production deployment at `https://doppio.kookyos.com` (Task 1.4) — required for OG validator tools to crawl the live URL

## Acceptance Criteria

- [ ] `public/og-badge.png` exists and is exactly 1200×630px (verify with `file` command or image inspector)
- [ ] `og:title` meta tag present in `index.html` with value "Doppio — Become an AI Manager in 20 Minutes"
- [ ] `og:description` meta tag present with tagline
- [ ] `og:image` meta tag present with absolute URL `https://doppio.kookyos.com/og-badge.png`
- [ ] `og:image:width` = "1200" and `og:image:height` = "630" present
- [ ] `og:url` = `https://doppio.kookyos.com` present
- [ ] `og:type` = "website" present
- [ ] `twitter:card` = "summary_large_image" present
- [ ] `twitter:image` present with absolute URL
- [ ] `og-badge.png` included in `dist/` after `npm run build`
- [ ] Production: `https://doppio.kookyos.com/og-badge.png` returns HTTP 200 with `content-type: image/png`
- [ ] `npm run build` completes without errors

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npm run build` succeeds
- [ ] `dist/og-badge.png` exists in build output (`ls dist/ | grep og-badge`)

### Browser Testing (Playwright MCP)

- Start: Production URL `https://doppio.kookyos.com` (after deploy)
- Navigate to: `https://doppio.kookyos.com`
- Actions:
  1. Open page source (DevTools → Elements → find `<head>`)
  2. Verify presence of all 14+ meta tags listed in Step 2
  3. Verify `og:image` value is absolute URL (starts with `https://`)
  4. Navigate directly to `https://doppio.kookyos.com/og-badge.png` — verify image loads (dark purple background with text visible)
  5. Take screenshot of the OG image URL to confirm visual output
- Screenshot: capture `https://doppio.kookyos.com/og-badge.png` in browser

### Playwright Meta Tag Verification (script)

```javascript
// Run against production after deploy:
await page.goto('https://doppio.kookyos.com');

// Check all required meta tags
const checks = {
  'og:title': 'Doppio — Become an AI Manager in 20 Minutes',
  'og:type': 'website',
  'og:url': 'https://doppio.kookyos.com',
  'og:image': 'https://doppio.kookyos.com/og-badge.png',
  'twitter:card': 'summary_large_image',
  'twitter:image': 'https://doppio.kookyos.com/og-badge.png',
};

for (const [property, expected] of Object.entries(checks)) {
  const el = await page.locator(`meta[property="${property}"], meta[name="${property}"]`).first();
  const content = await el.getAttribute('content');
  console.log(`${property}: ${content === expected ? 'PASS' : 'FAIL - got: ' + content}`);
}
```

### External Service Verification

- **Twitter Card Validator**: Enter `https://doppio.kookyos.com`, verify large image card format displays correctly with Doppio branding
- **opengraph.xyz**: Enter URL, verify title, description, and image preview show correct content
- **Social share test**: Copy `https://doppio.kookyos.com/?ref=badge` into an iMessage or WhatsApp message (if device available), verify link preview shows image and title

## Skills to Read

- `doppio-architecture` — project file structure, index.html location, public directory conventions

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D43 (share badge mechanic, OG image spec), D2 (production URL), D3 (pitch)

## Git

- Branch: `feat/phase-5-og-tags`
- Commit message prefix: `Task 5.2:`
