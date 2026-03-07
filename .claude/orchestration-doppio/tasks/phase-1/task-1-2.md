# Task 1.2: PWA Setup (Manifest, Service Worker, Icons, Install Prompts)

## Objective

Configure Doppio as a fully installable Progressive Web App. This includes: updating `vite.config.ts` with the complete VitePWA plugin configuration, generating all required icon sizes from a placeholder source image, adding iOS PWA meta tags to `index.html`, implementing the iOS Safari install banner component, implementing the Android `BeforeInstallPromptEvent` hook and banner component, and verifying the app is recognized as installable in Chrome DevTools.

## Context

Task 1.1 installed `vite-plugin-pwa` and `@vite-pwa/assets-generator` but left the Vite config minimal. This task activates the PWA layer. The PWA setup must be solid before Vercel deploy (Task 1.4) because the manifest and Service Worker only work correctly over HTTPS. The iOS and Android install prompt components created here are wired into the app layout — they will be used by Task 4.4 for the full install flow.

## Dependencies

- Task 1.1 — provides scaffolded project with `vite-plugin-pwa` installed, `public/icons/` directory, `src/hooks/` and `src/components/` directories

## Blocked By

- Task 1.1

---

## Research Findings

- **D22** (DISCOVERY.md): `vite-plugin-pwa` v0.21.x with Workbox. `CacheFirst` for app shell. `autoUpdate` registration type. `@vite-pwa/assets-generator` from a single source PNG.
- **D33**: iOS Safari never fires `BeforeInstallPromptEvent`. Detect: `isIOS && isSafari && !isStandalone`. Show instructional banner.
- **D34**: Android Chrome fires `BeforeInstallPromptEvent`. Capture, defer, show custom install button.
- **D35**: App shell cached via Service Worker. Video iframes show "Connect to watch" when offline.
- **D36**: Source PNG must have an opaque background — iOS adds white fill to transparent icons.
- **pwa-vite-setup skill**: Provides complete, tested code for all PWA components. Follow it precisely.

---

## Implementation Plan

### Step 1: Create the Source Icon PNG

You need a 512×512 pixel PNG with an opaque background as the source for all generated icon sizes. Create a simple placeholder that looks intentional and on-brand.

Create `public/icon-source.png` by writing an SVG first, then converting it to PNG. The icon design should be:
- Background: `#1a1a2e` (deep navy — Doppio brand dark color)
- Foreground: A coffee cup silhouette or the letter "D" in white/cream
- Size: 512×512
- No transparency (opaque background is required — iOS adds white fill to transparent icons)

Use this approach with Node.js/Canvas or write an SVG and save it as `public/icon-source.svg`, then use a Playwright browser to render and screenshot it at 512×512 as PNG.

**Simplest approach** — create the SVG directly and use Playwright to capture it as a PNG:

Create `public/icon-source.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" rx="80" fill="#1a1a2e"/>
  <!-- Coffee cup body -->
  <rect x="156" y="180" width="200" height="160" rx="20" fill="none" stroke="#e8d5b7" stroke-width="16"/>
  <!-- Cup handle -->
  <path d="M356 220 Q420 220 420 280 Q420 340 356 340" fill="none" stroke="#e8d5b7" stroke-width="16"/>
  <!-- Saucer -->
  <ellipse cx="256" cy="360" rx="130" ry="18" fill="#e8d5b7" opacity="0.6"/>
  <!-- Steam lines -->
  <path d="M216 160 Q228 140 216 120" fill="none" stroke="#e8d5b7" stroke-width="10" stroke-linecap="round" opacity="0.8"/>
  <path d="M256 150 Q268 130 256 110" fill="none" stroke="#e8d5b7" stroke-width="10" stroke-linecap="round" opacity="0.8"/>
  <path d="M296 160 Q308 140 296 120" fill="none" stroke="#e8d5b7" stroke-width="10" stroke-linecap="round" opacity="0.8"/>
</svg>
```

Then use Playwright to load the SVG in a browser and take a screenshot at exactly 512×512 pixels, save as `public/icon-source.png`. If Playwright cannot produce a clean PNG, use Node's `sharp` package or simply commit the SVG — `@vite-pwa/assets-generator` can also work from SVG.

Alternatively, if a PNG generation approach is problematic, write a small Node.js script using `canvas` or just produce a solid-color 512×512 PNG via ImageMagick if available:

```bash
# If ImageMagick is available:
convert -size 512x512 xc:#1a1a2e -fill white -font Helvetica-Bold -pointsize 200 \
  -gravity center -annotate 0 "D" public/icon-source.png
```

The exact visual appearance is not critical for Phase 1 — it will be replaced in Task 5.3 with the final brand icon. What matters is: 512×512, opaque background, PNG format.

### Step 2: Generate All PWA Icon Sizes

Run the `generate-pwa-assets` script added to `package.json` in Task 1.1:

```bash
npm run generate-pwa-assets
```

This command (`pwa-assets-generator --preset minimal public/icon-source.png`) outputs into `public/icons/`:
- `pwa-192x192.png`
- `pwa-512x512.png`
- `maskable-512x512.png`
- `apple-touch-icon-180x180.png`

Verify all four files exist in `public/icons/` after the command completes.

### Step 3: Update `vite.config.ts` with VitePWA Plugin

Replace the current minimal `vite.config.ts` with the full PWA configuration:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Doppio - AI Literacy',
        short_name: 'Doppio',
        description: 'Learn AI in 20 minutes. Watch, try, level up.',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
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
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^https:\/\/.*\.supabase\.co/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ]
})
```

Key decisions baked into this config:
- `registerType: 'autoUpdate'` — SW updates silently; correct for Doppio since localStorage progress is unaffected
- `navigateFallback: '/index.html'` — required for React Router SPA routes to work when served from SW cache
- `navigateFallbackDenylist` excludes Supabase API calls from SW interception (critical — prevents cached Supabase responses)
- `devOptions.enabled: true` — allows testing PWA behavior in local dev (toggle off during regular feature work to avoid HMR conflicts)

### Step 4: Add TypeScript Declaration for Virtual Module

Add a reference to the `vite-plugin-pwa` types to prevent TypeScript errors on the `virtual:pwa-register` import.

Create or update `src/vite-env.d.ts` (may already exist from scaffold):

```typescript
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
```

### Step 5: Update `src/main.tsx` with Service Worker Registration

Update `src/main.tsx` to register the Service Worker using `vite-plugin-pwa`'s virtual module:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

registerSW({
  onRegistered(registration) {
    console.log('[SW] Registered', registration)
  },
  onRegisterError(error) {
    console.error('[SW] Registration failed', error)
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 6: Update `index.html` with iOS PWA Meta Tags

Replace the content of `index.html` with the full version including all iOS meta tags. This is critical — iOS Safari requires these `<link rel="apple-touch-icon">` tags and `<meta>` tags; the Web App Manifest alone is NOT sufficient for iOS.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />

    <!-- Viewport -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Theme color: browser chrome tint on Android/Chrome -->
    <meta name="theme-color" content="#1a1a2e" />

    <!-- iOS PWA meta tags (required for Add to Home Screen behavior) -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Doppio" />

    <!-- iOS home screen icon — REQUIRED (manifest icons alone do not work on iOS) -->
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />

    <!-- Standard favicon -->
    <link rel="icon" type="image/png" href="/icons/pwa-192x192.png" />

    <title>Doppio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Step 7: Create `src/hooks/usePWAInstall.ts`

Create the hook that provides iOS detection and Android install prompt capture:

```typescript
// src/hooks/usePWAInstall.ts
import { useState, useEffect } from 'react'

// iOS detection helpers
export const isIOS = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent)

export const isSafari = (): boolean =>
  /Safari/i.test(navigator.userAgent) &&
  !/CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent)

export const isStandalone = (): boolean =>
  'standalone' in navigator &&
  (navigator as Navigator & { standalone: boolean }).standalone === true

export const shouldShowIOSInstallPrompt = (): boolean =>
  isIOS() && isSafari() && !isStandalone()

// TypeScript interface for the non-standard BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useAndroidInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('doppio_install_dismissed') === 'true'

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (!dismissed) {
        // Delay 5 seconds — avoid showing on initial landing page load
        setTimeout(() => setShowBanner(true), 5000)
      }
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setShowBanner(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const triggerInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      // Task 5.1 adds analytics here: track('pwa_installed', {})
      console.log('[PWA] User accepted install prompt')
    }
    setDeferredPrompt(null)
    setShowBanner(false)
  }

  const dismiss = () => {
    localStorage.setItem('doppio_install_dismissed', 'true')
    setShowBanner(false)
  }

  return { showBanner, triggerInstall, dismiss }
}
```

### Step 8: Create `src/components/IOSInstallBanner.tsx`

```tsx
// src/components/IOSInstallBanner.tsx
import { useState } from 'react'
import { shouldShowIOSInstallPrompt } from '../hooks/usePWAInstall'

const DISMISSED_KEY = 'doppio_install_dismissed'

export function IOSInstallBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  )

  // Only render on iOS Safari, non-standalone, non-dismissed
  if (!shouldShowIOSInstallPrompt() || dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 text-white p-4 flex items-center gap-3 shadow-xl">
      <div className="flex-1">
        <p className="text-sm font-semibold">Install Doppio</p>
        <p className="text-xs text-gray-300 mt-0.5">
          Tap{' '}
          <span className="inline-block border border-gray-400 rounded px-1 text-xs font-medium">
            Share
          </span>{' '}
          then &ldquo;Add to Home Screen&rdquo;
        </p>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        className="text-gray-400 hover:text-white text-2xl leading-none p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        &times;
      </button>
    </div>
  )
}
```

### Step 9: Create `src/components/AndroidInstallBanner.tsx`

```tsx
// src/components/AndroidInstallBanner.tsx
import { useAndroidInstallPrompt } from '../hooks/usePWAInstall'

export function AndroidInstallBanner() {
  const { showBanner, triggerInstall, dismiss } = useAndroidInstallPrompt()

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 text-white p-4 flex items-center gap-3 shadow-xl">
      <div className="flex-1">
        <p className="text-sm font-semibold">Add Doppio to your home screen</p>
        <p className="text-xs text-gray-400 mt-0.5">Works offline, opens instantly</p>
      </div>
      <button
        onClick={triggerInstall}
        className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg min-h-[44px] touch-manipulation"
      >
        Install
      </button>
      <button
        onClick={dismiss}
        className="text-gray-400 hover:text-white text-sm p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        Not now
      </button>
    </div>
  )
}
```

### Step 10: Wire Banners into `App.tsx`

Update `src/App.tsx` to include both install banners at the root level:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Learn from './pages/Learn'
import Complete from './pages/Complete'
import { IOSInstallBanner } from './components/IOSInstallBanner'
import { AndroidInstallBanner } from './components/AndroidInstallBanner'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/complete" element={<Complete />} />
      </Routes>
      {/* PWA install banners — platform-detected, shown after 5s delay */}
      <IOSInstallBanner />
      <AndroidInstallBanner />
    </BrowserRouter>
  )
}

export default App
```

### Step 11: Create `src/hooks/useOnlineStatus.ts`

This hook is required for the offline video fallback in Task 3.2. Create it now as part of PWA setup:

```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react'

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

### Step 12: Verify Build

```bash
npm run build
```

The build must succeed without errors. The `dist/` directory will contain the generated Service Worker (`sw.js`) and precached asset manifest.

---

## Files to Create

- `public/icon-source.png` — 512×512 opaque PNG source icon (placeholder)
- `public/icons/pwa-192x192.png` — Generated PWA icon (192×192)
- `public/icons/pwa-512x512.png` — Generated PWA icon (512×512)
- `public/icons/maskable-512x512.png` — Generated maskable icon (512×512)
- `public/icons/apple-touch-icon-180x180.png` — Generated iOS home screen icon
- `src/hooks/usePWAInstall.ts` — iOS detection + Android `BeforeInstallPromptEvent` hook
- `src/hooks/useOnlineStatus.ts` — Online/offline status hook
- `src/components/IOSInstallBanner.tsx` — iOS Safari install instructions banner
- `src/components/AndroidInstallBanner.tsx` — Android Chrome install prompt banner

## Files to Modify

- `vite.config.ts` — Add full VitePWA plugin configuration
- `src/vite-env.d.ts` — Add `/// <reference types="vite-plugin-pwa/client" />`
- `src/main.tsx` — Add `registerSW` call
- `index.html` — Add iOS PWA meta tags and apple-touch-icon links
- `src/App.tsx` — Wire in `<IOSInstallBanner />` and `<AndroidInstallBanner />`

---

## Contracts

### Provides (for downstream tasks)

- **Web App Manifest**: Configured with `name`, `short_name`, `display: standalone`, `start_url: /`, `theme_color: #1a1a2e`, all icon sizes
- **Service Worker**: `autoUpdate` Workbox SW registered, app shell precached, `navigateFallback: /index.html`
- **Icons**: All four sizes in `public/icons/` — usable by Tasks 1.3 (Supabase Dashboard doesn't need them), Task 1.4 (Vercel sees them in build), Task 5.3 (replaces with final brand icons)
- **Hook: `useAndroidInstallPrompt()`**: Exported from `src/hooks/usePWAInstall.ts` — Task 4.4 uses this
- **Component: `IOSInstallBanner`**: Exists in `src/components/` — Task 4.4 extends this
- **Hook: `useOnlineStatus()`**: Exported from `src/hooks/useOnlineStatus.ts` — Task 3.2 imports this for video offline fallback

### Consumes (from upstream tasks)

- Task 1.1 — scaffolded project with `vite-plugin-pwa` and `@vite-pwa/assets-generator` installed

---

## Acceptance Criteria

- [ ] `npm run build` completes with exit code 0
- [ ] `public/icons/` contains: `pwa-192x192.png`, `pwa-512x512.png`, `maskable-512x512.png`, `apple-touch-icon-180x180.png`
- [ ] `npm run generate-pwa-assets` runs without errors
- [ ] Chrome DevTools → Application → Manifest: all fields populated, no red error messages, icons render correctly
- [ ] Chrome DevTools → Application → Service Workers: SW shown as "activated and is running"
- [ ] `index.html` contains `<meta name="apple-mobile-web-app-capable" content="yes">`
- [ ] `index.html` contains `<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png">`
- [ ] `src/hooks/usePWAInstall.ts` exists with `shouldShowIOSInstallPrompt()` and `useAndroidInstallPrompt()` exported
- [ ] `src/components/IOSInstallBanner.tsx` and `AndroidInstallBanner.tsx` exist
- [ ] `src/hooks/useOnlineStatus.ts` exists with `useOnlineStatus()` exported
- [ ] App shell loads offline: in Chrome DevTools Network tab → Offline → Reload → app renders (not blank)

---

## Testing Protocol

### Build/Type Checks

- [ ] `npm run build` — exits 0, `dist/sw.js` exists in output
- [ ] `npx tsc --noEmit` — no TypeScript errors

### Browser Testing (Playwright MCP)

**PWA Manifest Check:**
- Start: `npm run dev`
- Navigate to: `http://localhost:5173/`
- Open Chrome DevTools → Application tab
- Click "Manifest" in the left sidebar
- Verify: `name` shows "Doppio - AI Literacy"
- Verify: `start_url` shows "/"
- Verify: `display` shows "standalone"
- Verify: All three icons render in the manifest view (192px, 512px, maskable 512px)
- Verify: No red error text in the manifest section
- Screenshot: Manifest panel showing all fields

**Service Worker Check:**
- In Chrome DevTools → Application → Service Workers
- Verify: SW entry shows "activated and is running"
- Verify: No "redundant" or "installing" state (should be "activated")
- Screenshot: Service Workers panel

**Offline Test:**
- Navigate to `http://localhost:5173/`
- DevTools → Network tab → Throttling dropdown → select "Offline"
- Reload the page
- Verify: App renders (dark background, "Doppio" heading) — NOT a blank white page or network error
- Navigate to `http://localhost:5173/learn`
- Verify: Learn page renders from SW cache
- Re-enable network

**iOS Install Banner Test (using mobile emulation):**
- In Playwright, set viewport to iPhone 12 dimensions (390×844) and set user agent to iOS Safari
- Navigate to `http://localhost:5173/`
- Verify: `IOSInstallBanner` is present in DOM (it should show if iOS Safari UA detected)
- Note: The 5-second delay in `AndroidInstallBanner` means it won't show immediately — this is expected

### File Existence Checks

After `npm run generate-pwa-assets`, verify:
- `public/icons/pwa-192x192.png` — readable, non-zero size
- `public/icons/pwa-512x512.png` — readable, non-zero size
- `public/icons/maskable-512x512.png` — readable, non-zero size
- `public/icons/apple-touch-icon-180x180.png` — readable, non-zero size

---

## Skills to Read

- `.claude/skills/pwa-vite-setup/SKILL.md` — Complete PWA configuration, iOS/Android detection patterns, pitfalls. Read this in full before starting.
- `.claude/skills/doppio-architecture/SKILL.md` — Architecture overview for orientation.

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D22, D33, D34, D35, D36

---

## Git

- Branch: `phase-1/pwa-setup` (or continue on `phase-1/scaffold` from Task 1.1)
- Commit message prefix: `Task 1.2:`
- Example: `Task 1.2: configure vite-plugin-pwa, generate icons, add iOS/Android install banners`
- Commit after: `npm run build` passes, Chrome DevTools Manifest shows all fields, SW is active
