# Task 5.3: PWA Icon Generation + Manifest Polish

## Objective

Generate a proper set of brand-quality PWA icons from a single source PNG, verify all icon sizes are present in `public/icons/`, update `vite.config.ts` manifest with final brand colors, ensure `index.html` has all required `apple-touch-icon` meta tags, and run a Lighthouse PWA audit to confirm the app passes all installability criteria.

## Context

Task 1.2 scaffolded the PWA setup with placeholder icons. This task finalizes the icon layer by creating a real brand icon (a "D" on a dark purple/coffee background), running `@vite-pwa/assets-generator` to produce all required sizes, and validating the complete PWA manifest against Lighthouse. Without this task, iOS users see a blurry screenshot as their home screen icon instead of the Doppio brand mark. This task also finalizes the `theme_color` and `background_color` manifest fields to match the confirmed brand palette.

## Dependencies

- Task 1.2 — `vite.config.ts` has `VitePWA` plugin configured, `pwa-vite-setup` skill structure in place

## Blocked By

- Task 1.2 (VitePWA plugin must be configured in vite.config.ts before icon generation can be verified)

## Research Findings

- From `pwa-vite-setup` skill §4: Source PNG must be minimum 512×512, square, opaque background (no transparency). iOS adds white fill to transparent backgrounds. Use brand background color.
- From `pwa-vite-setup` skill §4: `npx pwa-assets-generator --preset minimal public/icon-source.png` outputs to `public/icons/`: `pwa-192x192.png`, `pwa-512x512.png`, `maskable-512x512.png`, `apple-touch-icon-180x180.png`.
- From `pwa-vite-setup` skill §5: iOS Safari requires `apple-touch-icon` link tags in `<head>` — manifest icons alone are NOT sufficient for iOS home screen icons.
- From `pwa-vite-setup` skill §3: Manifest `theme_color` = `#1a1a2e`, `background_color` = `#ffffff` (splash screen background). `display: 'standalone'` is REQUIRED — `'browser'` blocks install prompt.
- From `PHASES.md Task 1.2`: Brand colors confirmed: `theme_color: "#1a1a2e"`. Source icon should be 512×512 with opaque background.
- From `pwa-vite-setup` skill §11: Always include `purpose: 'any'` AND `purpose: 'maskable'` as separate icon entries — missing `purpose` causes white box on Android adaptive icons.
- From `pwa-vite-setup` skill §10: Lighthouse PWA audit via DevTools → Lighthouse → Progressive Web App category.

## Implementation Plan

### Step 1: Create public/icon-source.png (final brand icon)

Create a 512×512px PNG with the Doppio brand icon. The icon should be a stylized "D" or coffee cup on a dark purple background matching `theme_color: #1a1a2e`.

**Approach A — SVG-to-PNG via sharp (recommended)**:

Create a script `scripts/generate-icon.mjs`:

```javascript
// scripts/generate-icon.mjs
import sharp from 'sharp';

const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Opaque background — matches theme_color, no transparency -->
  <rect width="512" height="512" rx="80" fill="#1a1a2e"/>

  <!-- Stylized "D" letter -->
  <text
    x="256"
    y="340"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="320"
    font-weight="bold"
    fill="#ffffff"
    text-anchor="middle"
    dominant-baseline="auto"
  >D</text>

  <!-- Coffee cup accent (small, bottom-right) -->
  <text
    x="380"
    y="450"
    font-family="Arial, sans-serif"
    font-size="80"
    fill="#6c3483"
    text-anchor="middle"
  >☕</text>
</svg>`;

await sharp(Buffer.from(svg))
  .resize(512, 512)
  .png()
  .toFile('public/icon-source.png');

console.log('icon-source.png written to public/ (512x512, opaque background)');
```

Run:
```bash
# sharp should already be available if Task 5.2 installed it; if not:
npm install -D sharp
node scripts/generate-icon.mjs
```

**Approach B — Programmatic canvas** (if SVG rendering in sharp has issues):

```javascript
// scripts/generate-icon-canvas.mjs
import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

const size = 512;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Rounded rectangle background
ctx.fillStyle = '#1a1a2e';
const r = 80;
ctx.beginPath();
ctx.moveTo(r, 0);
ctx.lineTo(size - r, 0);
ctx.quadraticCurveTo(size, 0, size, r);
ctx.lineTo(size, size - r);
ctx.quadraticCurveTo(size, size, size - r, size);
ctx.lineTo(r, size);
ctx.quadraticCurveTo(0, size, 0, size - r);
ctx.lineTo(0, r);
ctx.quadraticCurveTo(0, 0, r, 0);
ctx.closePath();
ctx.fill();

// "D" letterform
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 320px Georgia, serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('D', size / 2, size / 2 + 20);

// Purple dot accent
ctx.fillStyle = '#6c3483';
ctx.beginPath();
ctx.arc(size / 2, 430, 20, 0, Math.PI * 2);
ctx.fill();

writeFileSync('public/icon-source.png', canvas.toBuffer('image/png'));
console.log('icon-source.png written to public/');
```

**Verify the source icon**:
- Open `public/icon-source.png` in a browser or image viewer
- Confirm: 512×512px, dark purple background, white "D" visible, NO transparency
- The background must be FULLY OPAQUE — transparent backgrounds break iOS home screen icons

### Step 2: Run pwa-assets-generator

With `@vite-pwa/assets-generator` already installed (from Task 1.1 or 1.2), run:

```bash
npx pwa-assets-generator --preset minimal public/icon-source.png
```

This generates the following files. Verify each exists after running:

| File | Size | Purpose |
|------|------|---------|
| `public/icons/pwa-192x192.png` | 192×192px | Android Chrome minimum required |
| `public/icons/pwa-512x512.png` | 512×512px | Android splash screen, app store listing |
| `public/icons/maskable-512x512.png` | 512×512px | Android adaptive icon (safe-zone scaled) |
| `public/icons/apple-touch-icon-180x180.png` | 180×180px | iOS home screen (primary) |

Check all files exist:
```bash
ls -la public/icons/
```

If the `--preset minimal` command places files directly in `public/` rather than `public/icons/`, move them or update the `vite.config.ts` icon paths accordingly.

If the command fails or `@vite-pwa/assets-generator` is not installed:
```bash
npm install -D @vite-pwa/assets-generator
npx pwa-assets-generator --preset minimal public/icon-source.png
```

### Step 3: Update vite.config.ts manifest — finalize brand colors and icon paths

Open `vite.config.ts`. Update the `VitePWA` manifest section to use the finalized brand colors and verified icon paths:

```typescript
// vite.config.ts — manifest section (inside VitePWA plugin config)
manifest: {
  name: 'Doppio - AI Literacy',
  short_name: 'Doppio',
  description: 'Learn AI in 20 minutes. Watch, try, level up.',
  theme_color: '#1a1a2e',       // Dark purple — browser chrome tint on Android
  background_color: '#1a1a2e',  // Match theme for seamless splash screen
  display: 'standalone',        // REQUIRED for install prompt — never use 'browser'
  orientation: 'portrait',
  scope: '/',
  start_url: '/',
  icons: [
    {
      src: '/icons/pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/icons/pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/icons/maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'   // Required for Android adaptive icons
    }
  ]
},
```

Key decisions:
- `background_color` changed to `#1a1a2e` (same as `theme_color`) for a seamless splash screen — the loading screen matches the app UI, no jarring white flash
- Both `'any'` and `'maskable'` purposes are present as separate entries — Android requires this
- `display: 'standalone'` is NEVER changed — this is the single most critical field for install prompt

### Step 4: Verify/update apple-touch-icon meta tags in index.html

Open `index.html`. Verify the following `<link>` tags are present in `<head>` (they should have been added in Task 1.2, but verify and add if missing):

```html
<!-- iOS home screen icon — REQUIRED, manifest icons alone do NOT work on iOS -->
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />

<!-- Optional: additional sizes for older iOS devices -->
<link rel="apple-touch-icon" sizes="152x152" href="/icons/pwa-192x192.png" />
```

Also verify these iOS PWA meta tags are present (should be from Task 1.2):
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Doppio" />
```

If `apple-touch-icon-180x180.png` was NOT generated by `pwa-assets-generator` (some versions generate a different filename), check what filenames exist in `public/icons/` and update the `href` attributes accordingly:
```bash
ls public/icons/ | grep apple
```

### Step 5: Run build and verify PWA icons in dist

```bash
npm run build
ls dist/icons/
```

All icon files must appear in `dist/icons/`. If they're missing, check `vite.config.ts` `includeAssets` field:

```typescript
includeAssets: ['favicon.ico', 'icons/*.png'],
```

The glob `icons/*.png` ensures all generated icons are copied to `dist/`.

### Step 6: Run Lighthouse PWA audit via Playwright

Open Chrome DevTools against the dev server or a production preview:

```javascript
// Playwright approach — navigate to production and evaluate Lighthouse
// Note: Lighthouse must be run manually in Chrome DevTools as it cannot
// be programmatically invoked via Playwright MCP directly.
// Instead, use the DevTools Lighthouse tab.

// However, verify the manifest fields programmatically:
await page.goto('http://localhost:5173'); // or production URL

// Check manifest link
const manifestLink = await page.getAttribute('link[rel="manifest"]', 'href');
console.log('Manifest link:', manifestLink); // Should be '/manifest.webmanifest' or similar

// Fetch and inspect the manifest
const manifestResponse = await page.goto(manifestLink.startsWith('http') ? manifestLink : `http://localhost:5173${manifestLink}`);
const manifest = await manifestResponse.json();
console.log('PWA Manifest:', {
  name: manifest.name,
  display: manifest.display,
  icons: manifest.icons.map(i => ({ sizes: i.sizes, purpose: i.purpose })),
  theme_color: manifest.theme_color,
  start_url: manifest.start_url,
});
```

For the full Lighthouse audit:
1. Open `http://localhost:5173` in Chrome (with `npm run dev` running, `devOptions.enabled: true` in vite.config.ts)
2. DevTools (F12) → Lighthouse tab → Categories: check only "Progressive Web App" → Analyze page load
3. All PWA checks must be green

Expected Lighthouse PWA audit results — all green:
- "Registers a service worker that controls page and start_url" — PASS
- "Current page responds with a 200 when offline" — PASS (app shell cached)
- "start_url responds with a 200 when offline" — PASS
- "Web app manifest meets the installability requirements" — PASS
- "Is configured for a custom splash screen" — PASS (name + background_color + 512px icon)
- "Sets a theme color for the address bar" — PASS (`theme_color` set)
- "Content is sized correctly for the viewport" — PASS

Common failures and fixes:
- "Manifest does not have a maskable icon" → ensure `maskable-512x512.png` is in manifest with `purpose: 'maskable'`
- "Service worker does not control page" → check `devOptions.enabled: true` in vite.config.ts for dev testing, or test against `npm run preview`
- "Does not set an apple-touch-icon" → verify `<link rel="apple-touch-icon">` is in `index.html`

### Step 7: Verify maskable icon safe zone

The maskable icon must keep the logo centered within the inner 80% of the image (the "safe zone"). On Android adaptive icons, the OS clips the outer 20% in circular, rounded square, and other shapes.

Check the maskable icon at `https://maskable.app/editor`:
1. Upload `public/icons/maskable-512x512.png`
2. Toggle different mask shapes (circle, rounded square, etc.)
3. Verify the "D" letterform is fully visible in all mask shapes

If the logo is clipped, regenerate `icon-source.png` with the design centered within the inner 80% (i.e., the content should fit within a 410×410px area centered in the 512×512 canvas).

## Files to Create

- `public/icon-source.png` — 512×512px brand icon with opaque dark purple background and white "D" letterform (source for generator)
- `public/icons/pwa-192x192.png` — generated by `pwa-assets-generator`
- `public/icons/pwa-512x512.png` — generated by `pwa-assets-generator`
- `public/icons/maskable-512x512.png` — generated by `pwa-assets-generator`
- `public/icons/apple-touch-icon-180x180.png` — generated by `pwa-assets-generator`

## Files to Modify

- `vite.config.ts` — update `theme_color`, `background_color` to final brand values (`#1a1a2e`); verify icon paths match generated filenames
- `index.html` — verify/add `apple-touch-icon` link tags pointing to generated icons; verify iOS PWA meta tags present

## Contracts

### Provides (for downstream tasks)

- All PWA icons present in `public/icons/` — enables installability on iOS and Android
- Manifest fully polished with brand colors — used by Chrome for splash screen and Android chrome tint
- Lighthouse PWA audit: all green — prerequisite for Task 5.R PWA regression check

### Consumes (from upstream tasks)

- `vite.config.ts` with VitePWA plugin configured (Task 1.2) — updated with final brand colors and icon paths
- `@vite-pwa/assets-generator` installed (Task 1.1 or 1.2) — used to generate icon sizes
- `index.html` (Task 1.1 / 1.2) — modified to add/verify apple-touch-icon meta tags

## Acceptance Criteria

- [ ] `public/icon-source.png` exists, is 512×512px, has opaque background (no transparency)
- [ ] `public/icons/pwa-192x192.png` exists (192×192px)
- [ ] `public/icons/pwa-512x512.png` exists (512×512px)
- [ ] `public/icons/maskable-512x512.png` exists (512×512px with safe-zone design)
- [ ] `public/icons/apple-touch-icon-180x180.png` exists (180×180px)
- [ ] `vite.config.ts` manifest: `theme_color: '#1a1a2e'`, `background_color: '#1a1a2e'`, `display: 'standalone'`
- [ ] `vite.config.ts` manifest: icons array has BOTH `purpose: 'any'` and `purpose: 'maskable'` entries
- [ ] `index.html` has `<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />`
- [ ] `index.html` has `<meta name="apple-mobile-web-app-capable" content="yes" />`
- [ ] `index.html` has `<meta name="apple-mobile-web-app-title" content="Doppio" />`
- [ ] Chrome DevTools → Application → Manifest: no red error messages, all fields populated, green "Installable" indicator
- [ ] Chrome DevTools → Application → Manifest → Icons: all icon images load (no broken image icons)
- [ ] Lighthouse PWA audit: all categories green
- [ ] `npm run build` completes without errors
- [ ] All icon files present in `dist/icons/` after build

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npm run build` succeeds
- [ ] `ls dist/icons/` shows all 4 icon files

### Browser Testing (Playwright MCP)

- Start: `npm run dev` (ensure `devOptions.enabled: true` in vite.config.ts for SW in dev mode)
- Navigate to: `http://localhost:5173`
- Actions:
  1. Open Chrome DevTools (F12)
  2. Application tab → **Manifest** section:
     - Verify "Name": "Doppio - AI Literacy"
     - Verify "Theme color": #1a1a2e swatch visible
     - Verify "Installable" badge is green (no red warnings)
     - Verify all icon images load in the icons grid (no broken images)
     - Screenshot the Manifest panel
  3. Application tab → **Service Workers** section:
     - Verify status: "activated and is running"
     - Screenshot the SW panel
  4. DevTools → **Lighthouse** tab:
     - Select "Progressive Web App" category only
     - Click "Analyze page load"
     - Screenshot the Lighthouse results
     - Verify all checks are green (no red/orange)

### External Service Verification

- **maskable.app**: Upload `public/icons/maskable-512x512.png`, verify logo is within safe zone in all mask shapes
- **realfavicongenerator.net** (optional): Upload icon-source.png to verify iOS rendering

### Edge Case Verification

- [ ] Open `public/icons/apple-touch-icon-180x180.png` directly in browser — confirm it displays as Doppio brand icon (NOT a generic placeholder)
- [ ] Verify `public/icon-source.png` has truly opaque background: open in image editor or browser, confirm no checkerboard transparency pattern

## Skills to Read

- `pwa-vite-setup` — Complete reference: icon generation commands, manifest fields, iOS meta tags, Lighthouse audit checklist, common pitfalls (transparent icon, missing purpose field)

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D22 (PWA setup), D33 (iOS install prompt), D34 (Android install prompt), D36 (icon requirements)

## Git

- Branch: `feat/phase-5-pwa-icons`
- Commit message prefix: `Task 5.3:`
