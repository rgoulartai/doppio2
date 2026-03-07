# PWA Implementation Research

**Project**: Doppio
**Date**: 2026-03-06
**Researcher**: pwa-implementation research agent
**Status**: complete

---

## Summary

Doppio is a React + Vite PWA that must install cleanly to home screen on both iOS Safari and Android Chrome, persist user progress via localStorage, and embed social video content. The PWA stack in 2025/2026 is mature: `vite-plugin-pwa` (powered by Workbox) is the de facto standard, shipping with near-zero configuration for most React + Vite projects. The main friction points remain iOS Safari's lack of a native install prompt API, its restrictive Service Worker environment, and icon requirements that differ from Android. This document captures everything needed to implement Doppio's PWA layer correctly in a single hackathon day.

---

## Best Practices 2026

### Core Architecture Pattern

The recommended 2025/2026 approach for a React + Vite PWA:

1. **`vite-plugin-pwa`** handles manifest injection, Service Worker generation, and asset precaching automatically at build time.
2. **Workbox** (bundled with vite-plugin-pwa) handles the Service Worker runtime — no manual SW authoring needed for standard use cases.
3. **`registerSW` virtual module** from vite-plugin-pwa provides the SW registration hook and reload-on-update prompt.
4. **Custom install prompt UI** is mandatory since iOS Safari does not fire `BeforeInstallPromptEvent`. A dismissible banner with "Add to Home Screen" instructions must be shown to iOS users.
5. **HTTPS is required** — Vercel and Netlify both provide it automatically, so no action needed.

### Minimal Installability Requirements (both platforms)

To be installable as a PWA, a site must meet ALL of the following:
- Served over HTTPS
- Has a valid Web App Manifest (linked via `<link rel="manifest">` in `<head>`)
- Manifest includes: `name` or `short_name`, `icons` with at least one 192×192 PNG, `start_url`, `display: "standalone"`
- Has a registered Service Worker that controls the page

### Progressive Enhancement Philosophy

- App works fully in browser without install (flow 1 in PRD never requires install)
- PWA install is a value-add, not a gate
- Offline support for already-visited content; video embeds (YouTube/TikTok/Instagram) require network by nature — this is expected behavior that should be communicated to users

---

## Recommended Libraries & Tools (with versions)

### Primary Stack

| Package | Version (as of early 2026) | Purpose |
|---|---|---|
| `vite` | `^6.1.x` | Build tool |
| `vite-plugin-pwa` | `^0.21.x` | PWA manifest + SW generation |
| `workbox-window` | `^7.3.x` | SW registration + update handling (peer dep of vite-plugin-pwa) |
| `@vite-pwa/assets-generator` | `^0.2.x` | Generate all icon sizes from single source PNG |

### Optional but Recommended

| Package | Version | Purpose |
|---|---|---|
| `@vite-pwa/nuxt` | N/A | Only for Nuxt — skip for React |
| `idb` | `^8.x` | IndexedDB wrapper — only if graduating from localStorage |
| `virtual:pwa-register/react` | bundled | React hook for SW update prompts |

### vite-plugin-pwa is the right choice because:
- Zero-config precaching of all Vite-built assets
- Automatic manifest injection
- Workbox integration without needing to manage Workbox directly
- Active maintenance, wide adoption, excellent React + Vite compatibility
- The `@vite-pwa/assets-generator` companion handles all icon variants from one source image

---

## iOS Safari Specific

### Critical Constraints

**No `BeforeInstallPromptEvent`**: iOS Safari (all versions through 2026) does NOT fire this event. There is no programmatic way to trigger an "Add to Home Screen" prompt. The only path to installation is:
1. User manually taps the Share button (square with arrow up)
2. User selects "Add to Home Screen"

**Consequence for Doppio**: Must build a custom instructional banner that detects iOS + Safari + not-in-standalone-mode, then shows manual step instructions. This banner should appear after the user's first meaningful interaction (e.g., after starting Level 1).

### iOS Detection Pattern (2026)

```javascript
// Detect iOS Safari for showing install instructions
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isInStandaloneMode = () =>
  ('standalone' in window.navigator) && window.navigator.standalone;
const isSafari = () =>
  /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent);

const shouldShowIOSInstallPrompt = () =>
  isIOS() && isSafari() && !isInStandaloneMode();
```

### Icon Requirements for iOS

iOS requires `apple-touch-icon` meta tags in `<head>` — the manifest icons alone are NOT sufficient for the home screen icon on iOS:

```html
<!-- Required for iOS home screen icon -->
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />

<!-- Optional: override per device size -->
<link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
<link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167x167.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />
```

Key rules:
- **180×180 is the primary required size** (renders well on all current iPhone/iPad sizes)
- **Must be opaque PNG** — iOS ignores transparency and adds a white background; design icon with solid background color
- No rounded corners needed — iOS applies them automatically
- `@vite-pwa/assets-generator` generates these automatically from a single source 512×512+ PNG

### iOS Standalone Mode Behavior

When launched from home screen (standalone mode):
- The browser chrome (address bar, back/forward buttons) is hidden — app fills full screen
- **Navigation quirk**: standard `<a target="_blank">` links open in a NEW Safari tab, breaking the standalone experience. For Doppio's "Try it" CTAs (opening ChatGPT, Claude, etc.), this is actually desired behavior — user leaves the app to use the AI tool, then returns.
- **Back navigation**: there is no system back button in standalone mode. Apps must provide their own navigation (Doppio's linear flow should be fine).
- **Storage**: localStorage, IndexedDB, and Service Worker caches are shared with Safari but NOT with other browsers on the same device.
- **Safari 16.4+ (March 2023)**: Service Workers became available in iOS standalone mode. Prior to this they worked in browser but NOT standalone. All current iOS versions (16.4+) support SW in standalone mode.
- **iOS 16+**: Storage limits for Service Worker caches are now 50MB per origin (up from prior limits). For a content-light app like Doppio, this is more than sufficient.

### iOS Splash Screens

For a polished experience, add splash screen meta tags (optional but adds native feel):

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Doppio" />
```

`@vite-pwa/assets-generator` can also generate splash screen images for various iOS device sizes, but this is a nice-to-have for a hackathon.

### iOS Safari Service Worker Limitations (as of 2026)

- **Persistent storage**: SW caches are subject to eviction if the user hasn't opened the app in 7 days (browser mode) or ~several weeks (standalone mode). For Doppio's use case (active learner completing in one session), this is not a significant concern.
- **Background sync**: Limited/not supported. Not needed for Doppio.
- **Push notifications**: Supported since iOS 16.4 in standalone mode only. Not in scope for Doppio MVP.
- **Cache size**: 50MB per origin (iOS 16+). Sufficient for Doppio.

---

## Android Chrome Specific

### Install Prompt (BeforeInstallPromptEvent)

Android Chrome fires `BeforeInstallPromptEvent` when the installability criteria are met. The browser shows a mini-infobar after ~30 seconds (or on second visit), but you can suppress this and show a custom UI instead:

```javascript
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing
  e.preventDefault();
  // Save the event for later use
  deferredPrompt = e;
  // Show your custom install button/banner
  showInstallBanner();
});

// When user clicks install
async function triggerInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    console.log('User accepted install');
  }
  deferredPrompt = null;
  hideInstallBanner();
}

// Track successful install
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  hideInstallBanner();
});
```

### Android Icon Requirements

Android Chrome requires these manifest icon sizes for best results:
- **192×192 PNG** — minimum required for install prompt to trigger
- **512×512 PNG** — used for splash screen and Play Store (if submitted)
- **maskable icon** (purpose: "maskable") — adapts to Android's adaptive icon shapes; recommended for polished look

```json
"icons": [
  {
    "src": "/icons/pwa-192x192.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icons/pwa-512x512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icons/maskable-512x512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "maskable"
  }
]
```

**Maskable icon**: the icon design must keep the important content within the "safe zone" (a centered circle ~80% of the icon's dimensions). Tools: maskable.app for design validation.

### Chrome Installability Criteria (2026)

Chrome's current criteria to fire `beforeinstallprompt`:
1. HTTPS
2. Valid manifest with `name`/`short_name`, `icons` (192px+), `start_url`, `display: "standalone"` or `"minimal-ui"` or `"fullscreen"`
3. Registered Service Worker with a fetch handler
4. The page has NOT already been installed

Chrome's heuristic engagement trigger was removed in Chrome 115+ — the prompt can fire on first visit if criteria are met.

---

## Service Worker Strategy

### Recommended Strategy for Doppio

Doppio's content is **primarily static** (React app shell, Tailwind CSS, JS bundles) with **dynamic embedded video** (YouTube, TikTok iframes that require network). The recommended Workbox strategy combination:

#### App Shell: CacheFirst (Precache)
- All Vite build outputs (JS, CSS, fonts, static assets) are **precached** by vite-plugin-pwa
- These assets are served from cache immediately — no network needed after first load
- This is handled automatically by vite-plugin-pwa's `generateSW` mode

#### API/Dynamic Content: NetworkFirst or StaleWhileRevalidate
- For Doppio, there are no API calls (static app)
- Embedded video iframes (YouTube, TikTok) are third-party — cannot be cached by SW due to CORS restrictions. They require an active network connection by design.

#### Recommended vite-plugin-pwa Workbox Config

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',  // or 'prompt' for user-controlled updates
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icons/*.png'],
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
        // Precache all built assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't cache video embeds or external resources
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Cache Google Fonts
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
            // Cache Google Fonts actual files
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
        enabled: true,  // Enable SW in dev mode for testing
        type: 'module'
      }
    })
  ]
})
```

### `registerType` Options

| Value | Behavior | Recommended For |
|---|---|---|
| `'autoUpdate'` | SW updates silently in background, new version activates on next navigation | Most apps, hackathon projects |
| `'prompt'` | App shows a "New version available, refresh?" banner | Apps where users have unsaved state |

For Doppio: use `'autoUpdate'` — content updates are welcome and localStorage-stored progress is not affected by SW updates.

### Service Worker Registration

`vite-plugin-pwa` provides a virtual module for React integration:

```javascript
// main.jsx or App.jsx
import { useRegisterSW } from 'virtual:pwa-register/react'

function App() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

  // With autoUpdate, needRefresh is rarely true
  // Include a simple toast if you want to be explicit:
  if (needRefresh) {
    return (
      <div className="pwa-toast">
        <span>New version available</span>
        <button onClick={() => updateServiceWorker(true)}>Reload</button>
      </div>
    )
  }

  return <MainApp />
}
```

---

## Progress Persistence: localStorage vs IndexedDB

### Decision for Doppio: localStorage

**localStorage is the correct choice for Doppio MVP.**

Reasoning:

| Criteria | localStorage | IndexedDB |
|---|---|---|
| API complexity | Trivial (key-value strings) | Complex (async, cursors, transactions) |
| Wrapper libraries needed | None | `idb`, `dexie`, etc. |
| Sync/Async | Synchronous (simpler for read on load) | Async only |
| Storage limit | 5-10MB per origin | 50% of available disk |
| Data structure | JSON.stringify/parse required | Structured objects natively |
| Good for | Simple progress flags, level completion | Large datasets, files, offline data sync |
| Hackathon speed | Fast | Slower |

Doppio's progress data is minimal: 9 boolean card completions + current level. This is < 1KB of data. localStorage handles it perfectly.

### Progress Schema for Doppio

```javascript
// localStorage schema
const STORAGE_KEY = 'doppio_progress';

const defaultProgress = {
  version: 1,
  cards: {
    // card IDs map to completion status
    'beginner-1': false,
    'beginner-2': false,
    'beginner-3': false,
    'intermediate-1': false,
    'intermediate-2': false,
    'intermediate-3': false,
    'advanced-1': false,
    'advanced-2': false,
    'advanced-3': false,
  },
  currentLevel: 'beginner',
  completedAt: null,
  streakDays: 0,
  lastVisit: null,
};

// Save
const saveProgress = (progress) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

// Load
const loadProgress = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    const parsed = JSON.parse(raw);
    // Version migration safety
    return { ...defaultProgress, ...parsed };
  } catch {
    return defaultProgress;
  }
};
```

### When to Graduate to IndexedDB

If Doppio adds Supabase sync (referenced as optional in PRD), consider a hybrid:
- Primary: localStorage for fast reads on load
- Secondary: IndexedDB for offline queue of sync operations (pending Supabase writes)

But for MVP, localStorage is sufficient.

---

## BeforeInstallPromptEvent — Browser Support & Custom UI Patterns

### Browser Support (2026)

| Browser | Support | Notes |
|---|---|---|
| Chrome Android | Full | Fires event, supports custom prompt |
| Chrome Desktop | Full | Fires event, can be captured |
| Edge (Chromium) | Full | Same as Chrome |
| Samsung Internet | Full | Same behavior as Chrome |
| Firefox | None | No install prompt |
| Safari (iOS/macOS) | None | No install prompt event ever |
| Safari (macOS) | Partial | Added in macOS Ventura (Safari 16+) for macOS Sonoma+ — but limited |

### Recommended Custom Install UI Pattern (cross-platform)

```jsx
// InstallPrompt.jsx
import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'doppio_install_dismissed';

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // iOS detection
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari =
      /Safari/i.test(navigator.userAgent) &&
      !/CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent);
    const isStandalone =
      'standalone' in navigator && navigator.standalone;
    const dismissed = localStorage.getItem(DISMISSED_KEY) === 'true';

    if (!dismissed && !isStandalone) {
      if (isIOS && isSafari) {
        // Delay showing to not interrupt onboarding
        setTimeout(() => setShowIOSPrompt(true), 5000);
      }
    }

    // Android Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed && !isStandalone) {
        setTimeout(() => setShowAndroidPrompt(true), 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setShowAndroidPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowAndroidPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setShowAndroidPrompt(false);
    setShowIOSPrompt(false);
  };

  if (showIOSPrompt) {
    return (
      <div className="install-banner ios">
        <p>
          Install Doppio: tap{' '}
          <span role="img" aria-label="Share">⬆️</span>{' '}
          then "Add to Home Screen"
        </p>
        <button onClick={handleDismiss}>✕</button>
      </div>
    );
  }

  if (showAndroidPrompt) {
    return (
      <div className="install-banner android">
        <p>Add Doppio to your home screen</p>
        <button onClick={handleAndroidInstall}>Install</button>
        <button onClick={handleDismiss}>Not now</button>
      </div>
    );
  }

  return null;
}

export default InstallPrompt;
```

### UX Best Practices for Install Prompts

- Show after first meaningful engagement (not on landing page load)
- Offer dismiss with "not now" option — never block content
- Remember dismissal in localStorage (do not re-show on every visit)
- On iOS, use a visual that shows the share icon so users know exactly what to tap
- Consider showing the prompt again after 7-14 days if dismissed

---

## Common Pitfalls

### 1. iOS Safari: Service Worker not activating in standalone mode (pre-iOS 16.4)
- **Pitfall**: If targeting iOS 15 users, SW does not run in standalone mode. The app would still work but without precache benefits.
- **Mitigation for Doppio**: iOS 16.4+ released March 2023 — safe to assume current users have it. Document minimum requirement as iOS 16.4+.

### 2. manifest.json served with wrong Content-Type
- **Pitfall**: Some servers serve `.json` files as `text/plain` — Chrome treats this as invalid manifest.
- **Fix**: Vercel/Netlify serve JSON correctly by default. If using custom server, ensure `application/json` or `application/manifest+json` content type.

### 3. `start_url` mismatch causing install criteria failure
- **Pitfall**: If your app is at `https://doppio.app/` but manifest `start_url` is `/app`, Chrome may refuse to install or install breaks navigation.
- **Fix**: Set `start_url: '/'` and `scope: '/'`. vite-plugin-pwa sets these correctly by default.

### 4. Service Worker scope too narrow
- **Pitfall**: SW registered at `/sw.js` has scope `/` by default. If your Vite app is not at root, SW won't control all pages.
- **Fix**: vite-plugin-pwa outputs SW at root; Vite's base config must be `/` for Vercel/Netlify deploys. Set `base: '/'` in vite.config.js.

### 5. Icons missing the `purpose` field
- **Pitfall**: Without `purpose: "any"` or `purpose: "maskable"` in manifest icons, Android Chrome may use a white box on adaptive icon shapes.
- **Fix**: Always include both `purpose: "any"` and `purpose: "maskable"` icons (separate entries, same or different files).

### 6. `display: "browser"` breaks installability
- **Pitfall**: The `display` field must be `standalone`, `fullscreen`, or `minimal-ui` — NOT `browser` — for the install prompt to fire.
- **Fix**: Use `display: "standalone"` (recommended for Doppio).

### 7. Opaque icon background on iOS
- **Pitfall**: iOS adds white background to transparent PNGs for home screen icons — a transparent Doppio logo would look broken.
- **Fix**: Generate `apple-touch-icon` with explicit background color matching brand. The icon should look good against any color since iOS also adds rounded corners.

### 8. Video embeds and offline behavior
- **Pitfall**: YouTube, TikTok, Instagram embeds are from cross-origin domains — the Service Worker cannot intercept or cache them. If user is offline, embedded videos will show error states.
- **Fix**: Show a friendly "Connect to internet to watch videos" message when `navigator.onLine` is false. The app shell (progress, navigation) still works offline.

### 9. Caching strategies for navigation (SPA)
- **Pitfall**: React SPA routes (e.g., `/level/beginner`) that are not actual files return 404 when served from cache by a naive SW.
- **Fix**: Set `navigateFallback: '/index.html'` in Workbox config (included in the config above). This ensures all navigation falls back to `index.html` which React Router then handles client-side.

### 10. `registerType: 'prompt'` with `autoUpdate`
- **Pitfall**: If you mix `registerType: 'autoUpdate'` with manual update logic from `useRegisterSW`, you can get double-update behavior or stale caches.
- **Fix**: Pick one: either `autoUpdate` (no user prompt, silent) or `prompt` (user sees update banner). For Doppio MVP: `autoUpdate`.

### 11. Dev mode: SW not running by default
- **Pitfall**: vite-plugin-pwa doesn't run the SW in development by default, causing install prompt to not fire during local testing.
- **Fix**: Enable `devOptions: { enabled: true }` in the plugin config. Note: this can cause confusion with HMR — toggle off when not specifically testing SW behavior.

### 12. iOS Safari: `<meta name="theme-color">` not used for status bar
- **Pitfall**: The `theme_color` in manifest does not style the iOS status bar. iOS uses `apple-mobile-web-app-status-bar-style` meta tag.
- **Fix**: Add both:
  ```html
  <meta name="theme-color" content="#1a1a2e" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  ```

### 13. Supabase auth tokens in Service Worker scope
- **Pitfall**: If Supabase auth is added and uses cookies, the SW may intercept auth requests unexpectedly.
- **Fix**: Add Supabase API endpoints to Workbox's `navigateFallbackDenylist` and avoid caching `*.supabase.co` requests unless explicitly intended.

### 14. TikTok/Instagram embeds breaking standalone navigation
- **Pitfall**: Clicking links inside TikTok/Instagram embedded iframes may try to open in same window, breaking standalone mode flow.
- **Fix**: Ensure all "Try it" CTAs use `window.open(url, '_blank')` or `<a href="..." target="_blank" rel="noopener noreferrer">`. In standalone mode on iOS, `target="_blank"` correctly opens in Safari.

---

## Implementation Checklist

### Phase 1: Initial Setup

- [ ] Install `vite-plugin-pwa`: `npm install -D vite-plugin-pwa`
- [ ] Install assets generator: `npm install -D @vite-pwa/assets-generator`
- [ ] Create source icon: `/public/icon-source.png` (512×512 or larger, with solid background)
- [ ] Generate all icon variants: `npx pwa-assets-generator --preset minimal icon-source.png`
- [ ] Configure `vite.config.js` with `VitePWA` plugin (config template in Service Worker Strategy section above)
- [ ] Add manifest fields: name, short_name, description, theme_color, background_color, display, start_url, scope, icons

### Phase 2: HTML Meta Tags

- [ ] Add to `index.html`:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#YOUR_BRAND_COLOR" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Doppio" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />
  <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#YOUR_BRAND_COLOR" />
  ```

### Phase 3: Service Worker Registration

- [ ] Add `useRegisterSW` hook to `App.jsx` (template above)
- [ ] Test SW registration in dev mode (`devOptions: { enabled: true }`)
- [ ] Verify SW appears in Chrome DevTools > Application > Service Workers
- [ ] Verify manifest is valid in Chrome DevTools > Application > Manifest (no red errors)

### Phase 4: Install Prompt UI

- [ ] Build `InstallPrompt` component (template above)
- [ ] Add iOS-specific install instructions UI with share icon graphic
- [ ] Add Android install button that triggers `deferredPrompt.prompt()`
- [ ] Store dismissal in localStorage (`doppio_install_dismissed`)
- [ ] Trigger prompt after user's first card interaction (not immediately on load)

### Phase 5: Offline Handling

- [ ] Add `navigator.onLine` check for video embed sections
- [ ] Show offline message overlay when `!navigator.onLine` and user tries to watch a video
- [ ] Listen for `window.addEventListener('online/offline', ...)` to update UI reactively
- [ ] Confirm app shell (progress, navigation, completion screens) works fully offline

### Phase 6: Progress Persistence

- [ ] Implement `loadProgress()` / `saveProgress()` with try/catch
- [ ] Use version field in stored data for future migration safety
- [ ] Call `loadProgress()` on app init in a React context/store
- [ ] Call `saveProgress()` on every card completion event

### Phase 7: Testing

- [ ] Chrome Desktop: Open DevTools > Application > Manifest — verify green checkmarks
- [ ] Chrome Desktop: Lighthouse PWA audit — target 100 score
- [ ] Chrome Android: Test actual install flow (USB debug or BrowserStack)
- [ ] iOS Safari (device or BrowserStack): Test manual "Add to Home Screen" flow
- [ ] iOS standalone: Launch from home screen, confirm no browser chrome
- [ ] iOS standalone: Tap "Try it" CTA — confirm opens in Safari (expected)
- [ ] Offline test: Chrome > DevTools > Network > Offline — confirm app shell works
- [ ] Offline test: Video embed sections show appropriate fallback message

### Phase 8: Vercel Deployment

- [ ] Ensure `vercel.json` or Vercel settings serve `manifest.json` with correct headers
- [ ] Confirm HTTPS is active (automatic on Vercel)
- [ ] Test production install flow — dev mode installs don't count for real-device testing
- [ ] Verify `start_url` resolves correctly in production (no 404)

---

## References

### Official Documentation
- vite-plugin-pwa official docs: https://vite-pwa-org.netlify.app/
- vite-plugin-pwa GitHub: https://github.com/vite-pwa/vite-plugin-pwa
- @vite-pwa/assets-generator: https://github.com/vite-pwa/assets-generator
- Workbox documentation: https://developer.chrome.com/docs/workbox/
- MDN Web App Manifest: https://developer.mozilla.org/en-US/docs/Web/Manifest
- MDN BeforeInstallPromptEvent: https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent

### PWA Installability & Criteria
- web.dev - What it takes to be installable: https://web.dev/articles/install-criteria
- web.dev - Add a manifest: https://web.dev/articles/add-manifest
- web.dev - How to provide your own in-app install experience: https://web.dev/articles/customize-install

### iOS Safari PWA
- WebKit blog — Service Workers and the new APIs for PWA on iOS (March 2023): https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- whatpwacando.today — Cross-platform PWA feature support matrix
- firt.dev (Maximiliano Firtman) — iOS/iPadOS PWA compatibility blog: https://firt.dev

### Maskable Icons
- maskable.app — Interactive maskable icon designer/validator: https://maskable.app/
- web.dev — Adaptive icon support in PWAs with maskable icons: https://web.dev/articles/maskable-icon

### Boilerplates & Templates
- vite-plugin-pwa React starter: https://github.com/vite-pwa/vite-plugin-pwa/tree/main/examples/react-router
- Official examples repo: https://github.com/vite-pwa/vite-plugin-pwa/tree/main/playground

### Tools
- PWA Builder (Microsoft): https://www.pwabuilder.com/ — Generates manifest, tests PWA readiness
- Lighthouse (Chrome DevTools): PWA audit built into Chrome
- Chrome DevTools Application Panel: Manifest inspector, SW debugger

---

*Research complete. All implementation decisions for Doppio's PWA layer are supported by this document.*
