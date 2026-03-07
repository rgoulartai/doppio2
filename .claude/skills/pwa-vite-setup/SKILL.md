---
name: pwa-vite-setup
description: PWA setup for Doppio using vite-plugin-pwa. Use when implementing PWA manifest, Service Worker, install prompts (iOS + Android), or offline behavior.
---

# Skill: pwa-vite-setup

**Project**: Doppio
**Stack**: React 18 + Vite + TypeScript + Tailwind CSS
**Deployment**: Vercel (HTTPS automatic)

---

## 1. Package Setup

Install both packages as dev dependencies:

```bash
npm install -D vite-plugin-pwa@^0.21.x @vite-pwa/assets-generator@^0.2.x
```

`workbox-window` is a peer dependency of `vite-plugin-pwa` and is installed automatically.

**Why these packages:**
- `vite-plugin-pwa` handles manifest injection, Service Worker generation via Workbox, and precaching of all Vite-built assets at build time — zero manual SW authoring required.
- `@vite-pwa/assets-generator` produces all required icon sizes (192, 512, maskable, apple-touch-icon) from a single source PNG.

---

## 2. vite.config.ts — Complete VitePWA Plugin Config

```typescript
// vite.config.ts
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
        background_color: '#ffffff',
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
        // Precache all Vite-built assets (app shell)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // SPA fallback: all navigation resolves to index.html (React Router handles routing)
        navigateFallback: '/index.html',
        // Exclude Supabase API calls from SW interception
        navigateFallbackDenylist: [/^\/api/, /^https:\/\/.*\.supabase\.co/],
        runtimeCaching: [
          {
            // CacheFirst for Google Fonts CSS
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // CacheFirst for Google Fonts files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        // Enable SW in dev mode to test install/offline behavior locally
        // Toggle off when not specifically testing SW to avoid HMR conflicts
        enabled: true,
        type: 'module'
      }
    })
  ]
})
```

**Key decisions:**
- `registerType: 'autoUpdate'` — SW updates silently in background. Correct for Doppio because localStorage progress is unaffected by SW updates and content updates are welcome.
- `navigateFallback: '/index.html'` — required for React Router SPA routes (`/level/1`, `/complete`) to work when served from SW cache.
- `base: '/'` — required so the SW is registered at root scope and controls all pages.

---

## 3. Web App Manifest Fields for Installability

These fields are required for the install prompt to fire on both iOS and Android. All are set inside the `manifest` object in `vite.config.ts` above.

| Field | Value | Why Required |
|---|---|---|
| `name` | `'Doppio - AI Literacy'` | Full app name shown during install and on splash screen |
| `short_name` | `'Doppio'` | Name shown under home screen icon (keep under 12 chars) |
| `description` | `'Learn AI in 20 minutes...'` | Store listing and browser install UI |
| `icons` | 192px + 512px PNGs | Chrome requires 192px minimum; 512px for splash/store |
| `theme_color` | `'#1a1a2e'` | Browser chrome color on Android |
| `background_color` | `'#ffffff'` | Splash screen background while app loads |
| `display` | `'standalone'` | Hides browser chrome; REQUIRED for install prompt — do NOT use `'browser'` |
| `start_url` | `'/'` | Must match the deployed app root; mismatch breaks install |
| `scope` | `'/'` | All paths under `/` controlled by this manifest |
| `orientation` | `'portrait'` | Doppio is a mobile-first vertical layout |

---

## 4. Icon Generation

### Source PNG Requirements

Before running the generator, create `/public/icon-source.png`:
- Minimum size: **512×512 pixels** (1024×1024 preferred for highest quality)
- **Square** — no letterboxing
- **Opaque background** (no transparency) — iOS ignores alpha and adds a white fill, which breaks transparent logos. Use a solid background color matching `theme_color` or the Doppio brand color.
- Format: PNG

### Generate All Sizes

```bash
npx pwa-assets-generator --preset minimal public/icon-source.png
```

This command outputs into `public/icons/` (or alongside the source):
- `pwa-192x192.png` — Android Chrome minimum
- `pwa-512x512.png` — Android splash screen
- `maskable-512x512.png` — Android adaptive icon (keep logo in center 80% safe zone)
- `apple-touch-icon-180x180.png` — iOS home screen icon

For the minimal preset, the source PNG is scaled to each required size. Inspect the output with `maskable.app` to confirm the logo sits within the safe zone on the maskable variant.

---

## 5. iOS Safari: Required HTML Meta Tags in index.html

**Critical**: The Web App Manifest icons alone are NOT sufficient for iOS. iOS Safari requires `apple-touch-icon` link tags in `<head>`. Without them, iOS uses a screenshot of the page as the home screen icon.

Add to `index.html` inside `<head>`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />

    <!-- Viewport: required for mobile scaling -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Theme color: browser chrome tint on Android/Chrome -->
    <meta name="theme-color" content="#1a1a2e" />

    <!-- iOS PWA meta tags -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <!-- "default" = light status bar. Use "black-translucent" for full bleed -->
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <!-- Short name shown under icon on iOS home screen -->
    <meta name="apple-mobile-web-app-title" content="Doppio" />

    <!-- iOS home screen icon (REQUIRED — manifest icons alone do not work on iOS) -->
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />
    <!-- Optional: per-device size overrides -->
    <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
    <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167x167.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />

    <title>Doppio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 6. iOS Install Prompt: Detection and Banner Component

iOS Safari never fires `BeforeInstallPromptEvent`. The only install path is manual: user taps Share (square-with-arrow icon) then "Add to Home Screen". Doppio must detect this situation and show a custom instructional banner.

### Detection Pattern

```typescript
// src/hooks/usePWAInstall.ts
export const isIOS = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent);

export const isSafari = (): boolean =>
  /Safari/i.test(navigator.userAgent) &&
  !/CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent);

// window.navigator.standalone is true when launched from iOS home screen
export const isStandalone = (): boolean =>
  'standalone' in navigator && (navigator as Navigator & { standalone: boolean }).standalone === true;

export const shouldShowIOSInstallPrompt = (): boolean =>
  isIOS() && isSafari() && !isStandalone();
```

### iOS Banner Component

```tsx
// src/components/IOSInstallBanner.tsx
import { useState } from 'react';

const DISMISSED_KEY = 'doppio_install_dismissed';

export function IOSInstallBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 flex items-center gap-3 shadow-lg">
      <div className="flex-1">
        <p className="text-sm font-medium">Install Doppio</p>
        <p className="text-xs text-gray-300 mt-0.5">
          Tap{' '}
          {/* iOS Share icon approximation */}
          <span className="inline-block border border-gray-400 rounded px-1 text-xs">
            Share
          </span>{' '}
          then &ldquo;Add to Home Screen&rdquo;
        </p>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        className="text-gray-400 hover:text-white text-xl leading-none"
      >
        &times;
      </button>
    </div>
  );
}
```

**Usage:** Render `<IOSInstallBanner />` inside a parent that checks `shouldShowIOSInstallPrompt()`. Delay showing it by ~5 seconds after first meaningful interaction (e.g., after the user starts Level 1) so it does not interrupt the landing page experience.

---

## 7. Android Chrome Install Prompt: BeforeInstallPromptEvent

Android Chrome fires `BeforeInstallPromptEvent` when installability criteria are met (Chrome 115+: can fire on first visit). Capture and defer it, then trigger via a button click.

```tsx
// src/hooks/usePWAInstall.ts (extended)
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useAndroidInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('doppio_install_dismissed') === 'true';

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome mini-infobar from appearing automatically
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!dismissed) {
        // Delay to avoid showing on landing page load
        setTimeout(() => setShowBanner(true), 5000);
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      // Optionally fire analytics event: pwa_installed
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const dismiss = () => {
    localStorage.setItem('doppio_install_dismissed', 'true');
    setShowBanner(false);
  };

  return { showBanner, triggerInstall, dismiss };
}
```

```tsx
// src/components/AndroidInstallBanner.tsx
import { useAndroidInstallPrompt } from '../hooks/usePWAInstall';

export function AndroidInstallBanner() {
  const { showBanner, triggerInstall, dismiss } = useAndroidInstallPrompt();

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 flex items-center gap-3 shadow-lg">
      <p className="flex-1 text-sm">Add Doppio to your home screen</p>
      <button
        onClick={triggerInstall}
        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded"
      >
        Install
      </button>
      <button
        onClick={dismiss}
        className="text-gray-400 hover:text-white text-sm"
      >
        Not now
      </button>
    </div>
  );
}
```

---

## 8. Offline Behavior

Doppio's app shell (React components, Tailwind CSS, JS bundles, icons) is fully cached by the Service Worker via precaching. Progress reads from localStorage synchronously — no network needed.

Video embeds (YouTube, TikTok iframes) are from cross-origin domains and cannot be cached by the SW. They require an active network connection. Show a friendly fallback when offline.

### Offline Detection Pattern

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

### Video Embed Offline Fallback

Wrap any iframe-based video embed component with an online check:

```tsx
// src/components/VideoEmbed.tsx
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface VideoEmbedProps {
  videoId: string;
  platform: 'youtube' | 'tiktok';
}

export function VideoEmbed({ videoId, platform }: VideoEmbedProps) {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <div className="aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500">
        <span className="text-2xl">📶</span>
        <p className="text-sm font-medium">Connect to watch</p>
        <p className="text-xs">Your progress is saved offline</p>
      </div>
    );
  }

  if (platform === 'youtube') {
    return (
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          className="w-full h-full rounded-xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (platform === 'tiktok') {
    return (
      <div className="aspect-video">
        <iframe
          src={`https://www.tiktok.com/embed/v2/${videoId}`}
          className="w-full h-full rounded-xl"
          allowFullScreen
        />
      </div>
    );
  }

  return null;
}
```

### localStorage Offline Behavior

`localStorage` reads are synchronous and work offline with no changes needed:

```typescript
// This works offline as-is — localStorage is not a network call
const progress = loadProgress(); // reads from localStorage, always available
```

Supabase sync should be silently skipped when offline:

```typescript
// Wrap all Supabase calls in an online guard
if (navigator.onLine) {
  supabase.from('user_progress').upsert(row).catch(() => {
    // Silent fail — localStorage is source of truth
  });
}
```

---

## 9. Service Worker Registration in main.tsx

Use the virtual module provided by `vite-plugin-pwa`. With `registerType: 'autoUpdate'`, the SW registers and updates silently.

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// registerSW from virtual:pwa-register handles SW lifecycle
// With autoUpdate, this fires silently — no UI needed
import { registerSW } from 'virtual:pwa-register';

registerSW({
  onRegistered(registration) {
    // SW is active and controlling the page
    console.log('[SW] Registered', registration);
  },
  onRegisterError(error) {
    console.error('[SW] Registration failed', error);
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**TypeScript note:** If you see a type error on the `virtual:pwa-register` import, add this to `vite-env.d.ts` or `env.d.ts`:

```typescript
/// <reference types="vite-plugin-pwa/client" />
```

**Alternative (React hook variant):** If you need to react to update events in a component:

```tsx
// src/App.tsx — optional update banner
import { useRegisterSW } from 'virtual:pwa-register/react';

function App() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // With autoUpdate, needRefresh is rarely true
  // Safe to render nothing here for Doppio MVP
  if (needRefresh) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white text-sm p-2 text-center">
        New version available.{' '}
        <button onClick={() => updateServiceWorker(true)} className="underline">
          Reload
        </button>
      </div>
    );
  }

  return <MainApp />;
}
```

---

## 10. Testing the PWA in Chrome DevTools

### Application Panel Checks

1. Open Chrome DevTools (F12) > **Application** tab
2. **Manifest section**: Verify all fields are populated, no red error messages, icons render correctly. A green "Installable" badge should appear.
3. **Service Workers section**: Confirm the SW is shown as "activated and is running". Click "Update" to force a fetch of the latest SW.
4. **Storage section**: Inspect Cache Storage to see precached assets under the SW's cache name.

### Simulate Offline

1. DevTools > **Network** tab > throttle dropdown > select **Offline**
2. Reload the page — app shell should load from cache (SW serves it)
3. Navigate to a card — video embed should show the "Connect to watch" fallback

### Lighthouse PWA Audit

1. DevTools > **Lighthouse** tab > select "Progressive Web App" category > Analyze
2. Target: all green. Common failures and fixes:
   - "Does not register a service worker" → check `devOptions.enabled: true` in vite.config.ts for dev, or test on a production build
   - "Web app manifest does not meet installability requirements" → check `display`, `icons`, `start_url` fields
   - "Is not configured for a custom splash screen" → add `background_color` and 512px icon to manifest

### Simulate Install (Chrome Desktop)

With `devOptions.enabled: true`, an install icon appears in the Chrome address bar during `vite dev`. Click it to test the install flow on desktop.

---

## 11. Common Pitfalls

### Transparent Icon Breaks iOS Home Screen

**Pitfall**: If `icon-source.png` has a transparent background, iOS adds a white fill. A transparent Doppio logo on a white square looks wrong.

**Fix**: Always use an opaque background color in the source PNG. Use the brand background color (`#1a1a2e` or equivalent) so the icon looks intentional.

### SPA Navigation Fallback Not Set

**Pitfall**: React Router routes like `/level/1` or `/complete` are not actual files. When the SW serves them from cache without `navigateFallback`, the user gets a blank page or 404.

**Fix**: Set `navigateFallback: '/index.html'` in the Workbox config (already included in the vite.config.ts above). This routes all unmatched navigation requests to `index.html`, which React Router handles client-side.

### iOS Standalone Detection: Do Not Rely on display-mode

**Pitfall**: Using `window.matchMedia('(display-mode: standalone)')` is unreliable on iOS Safari. It may return false even when launched from home screen.

**Fix**: Use `window.navigator.standalone` (iOS-specific property) for standalone detection:

```typescript
// Correct iOS standalone detection
const isStandalone = 'standalone' in navigator && (navigator as any).standalone === true;

// Also works cross-platform (including Android Chrome standalone)
const isStandaloneMediaQuery = window.matchMedia('(display-mode: standalone)').matches;

// For iOS specifically, use the navigator.standalone property
const iosInstallPromptNeeded = isIOS() && isSafari() && !isStandalone;
```

### `display: 'browser'` Blocks Install

**Pitfall**: Setting `display: 'browser'` in the manifest prevents the `BeforeInstallPromptEvent` from firing on Android and prevents iOS from offering Add to Home Screen.

**Fix**: Use `display: 'standalone'` (already set in the config above).

### Missing `purpose` on Manifest Icons

**Pitfall**: Android Chrome may render a white box on adaptive icon shapes if the icon entry has no `purpose` field.

**Fix**: Always include at least one entry with `purpose: 'any'` and one with `purpose: 'maskable'` (as separate entries in the icons array).

### `registerType: 'autoUpdate'` + Manual Update Logic Conflict

**Pitfall**: Mixing `autoUpdate` with manual `updateServiceWorker()` calls can cause double-update behavior.

**Fix**: For Doppio MVP, use `autoUpdate` and omit the update banner UI. The `needRefresh` value from `useRegisterSW` will rarely be true with `autoUpdate`.

### Dev Mode: SW Not Active Without devOptions

**Pitfall**: `vite-plugin-pwa` does not run the SW in development by default. The install prompt will not fire and offline behavior cannot be tested.

**Fix**: Set `devOptions: { enabled: true, type: 'module' }`. Toggle back to `enabled: false` when doing regular feature work to avoid HMR conflicts with the SW cache.

### Supabase API Intercepted by SW

**Pitfall**: If the SW intercepts Supabase API calls, failed auth or progress syncs can appear to succeed (SW returns cached 200 response from a previous call).

**Fix**: The `navigateFallbackDenylist` in the config above excludes `*.supabase.co`. No Supabase calls are cached by the SW.

---

## Implementation Order

Execute in this sequence to avoid rework:

1. Create `public/icon-source.png` (opaque, square, 512px+)
2. Run `npx pwa-assets-generator --preset minimal public/icon-source.png`
3. Update `vite.config.ts` with the full `VitePWA` config from Section 2
4. Add all meta tags to `index.html` from Section 5
5. Add `/// <reference types="vite-plugin-pwa/client" />` to `vite-env.d.ts`
6. Add `registerSW` call to `src/main.tsx` from Section 9
7. Implement `useOnlineStatus` hook and wire into video embed components
8. Implement `IOSInstallBanner` and `AndroidInstallBanner` components
9. Render both banners in `App.tsx` (gated by platform detection)
10. Test in Chrome DevTools: Application > Manifest, Service Workers, Lighthouse PWA audit
