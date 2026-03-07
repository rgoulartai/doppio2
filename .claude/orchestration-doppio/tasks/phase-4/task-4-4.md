# Task 4.4: PWA Install Prompts

## Objective

Wire platform-specific PWA install prompts: integrate the `IOSInstallBanner` component and `useAndroidInstallPrompt` hook already created in Task 1.2 into the landing page. Wire the Android "Install App" button into the landing page header using `useAndroidInstallPrompt()`. Track the `pwa_installed` analytics event on the `appinstalled` window event. Never show prompts when the app is already running in standalone mode.

## Context

Phase 4 completes the PWA story. Task 1.2 set up the manifest, Service Worker, `IOSInstallBanner.tsx`, and `useAndroidInstallPrompt` hook. This task wires those existing components into the landing page. The iOS and Android paths are fundamentally different: iOS Safari never fires `BeforeInstallPromptEvent` so we show a manual instruction banner (`IOSInstallBanner`), while Android Chrome fires the event which `useAndroidInstallPrompt` captures and defers for a custom button. Both paths share a single localStorage dismissal key.

## Dependencies

- Task 1.2 — PWA manifest configured, Service Worker registered, app is installable (manifest criteria met)
- Task 3.4 — `useProgress` hook exists (no direct dependency, but the install prompt should fire after the user has started engaging, not on cold landing)
- Task 3.1 — `Landing.tsx` exists (the Android "Install App" button appears in the landing page header)

## Blocked By

- Task 1.2 must be complete (PWA manifest must be valid and Service Worker must be registered for `BeforeInstallPromptEvent` to fire)

## Research Findings

Key findings from discovery and skill files relevant to this task:

- From `DISCOVERY.md D33`: iOS Safari: custom instructional banner. Detect: `isIOS && isSafari && !isStandalone`. Show "Add to Home Screen" instructions.
- From `DISCOVERY.md D34`: Android Chrome: capture `BeforeInstallPromptEvent`, defer it, show custom install button. Chrome 115+ fires on first visit.
- From `DISCOVERY.md D35`: App shell cached via Service Worker. Progress reads from localStorage (works offline). Video iframes show "Connect to watch" when offline.
- From `pwa-vite-setup SKILL.md §6`: Complete iOS detection pattern: `isIOS()`, `isSafari()`, `isStandalone()`. `IOSInstallBanner` component with localStorage dismissal key `'doppio_install_dismissed'`. Show banner with "Tap Share then Add to Home Screen" instruction.
- From `pwa-vite-setup SKILL.md §7`: `useAndroidInstallPrompt` hook (created in Task 1.2) — captures `BeforeInstallPromptEvent`, defers it, exposes `{showBanner, triggerInstall, dismiss}`. `appinstalled` event listener in the same hook. 5-second delay before showing banner (avoid interrupting landing page).
- From `pwa-vite-setup SKILL.md §11` (pitfalls): iOS standalone detection must use `window.navigator.standalone`, NOT `window.matchMedia('(display-mode: standalone)')`. `display: 'browser'` blocks install — manifest must use `'standalone'`.

Key divergence from SKILL.md: The task instructions require:
- localStorage key: `'doppio_install_dismissed_v1'` (versioned, different from SKILL.md's `'doppio_install_dismissed'`)
- Android: "Install App" button in landing page header (not bottom banner)
- analytics: `track('pwa_installed')` on `appinstalled` event

## Implementation Plan

### Step 1: Verify Task 1.2 components exist

Task 1.2 already creates the following files — do NOT recreate them:
- `src/hooks/useAndroidInstallPrompt.ts` — captures `BeforeInstallPromptEvent`, exposes `{showBanner, triggerInstall, dismiss}`
- `src/components/IOSInstallBanner.tsx` — fixed bottom banner for iOS Safari

Verify both files exist before proceeding:
```bash
ls src/hooks/useAndroidInstallPrompt.ts
ls src/components/IOSInstallBanner.tsx
```

If either is missing, Task 1.2 is incomplete — do NOT recreate them here. Block on Task 1.2.

The hook from Task 1.2 has this contract:
```typescript
// src/hooks/useAndroidInstallPrompt.ts (created by Task 1.2)
export function useAndroidInstallPrompt(): {
  showBanner: boolean;      // true when BeforeInstallPromptEvent captured and not dismissed
  triggerInstall: () => Promise<void>;
  dismiss: () => void;
}
```

Platform detection utilities (`isIOS`, `isSafari`, `isStandalone`, `shouldShowIOSBanner`) are also provided by Task 1.2's hook file.

Key behaviors (already implemented by Task 1.2):
- `DISMISSED_KEY = 'doppio_install_dismissed_v1'` — versioned to avoid conflicts with prior sessions
- `isStandalone()` checks both `navigator.standalone` (iOS) and `matchMedia` (Android) — covers both platforms
- `appinstalled` listener fires `track('pwa_installed')` via dynamic import (safe if analytics.ts doesn't exist yet)
- `showBanner` is the flag used by Landing.tsx to show/hide the "Install App" button

### Step 2: Wire `pwa_installed` analytics into the existing hook (if not already done)

Open `src/hooks/useAndroidInstallPrompt.ts` (from Task 1.2). Verify the `appinstalled` event listener fires `track('pwa_installed')`. If it does not, add it:

```typescript
const handleAppInstalled = () => {
  setDeferredPrompt(null);
  setShowBanner(false);
  // Track pwa_installed analytics event
  (async () => {
    try {
      const { track } = await import('../lib/analytics');
      track('pwa_installed');
    } catch {
      // analytics not yet available — silent fail
    }
  })();
};
```

This is the only modification to the Task 1.2 hook that Task 4.4 is permitted to make (analytics wiring).

### Step 3: Integrate iOS banner and Android button into `Landing.tsx`

Modify `src/pages/Landing.tsx` to:
1. Render `<IOSInstallBanner />` conditionally (iOS Safari only)
2. Show "Install App" button in the header when `showBanner === true` (Android)

```tsx
// src/pages/Landing.tsx — additions
import { IOSInstallBanner } from '../components/IOSInstallBanner';
import { useAndroidInstallPrompt, shouldShowIOSBanner } from '../hooks/useAndroidInstallPrompt';
import toast from 'react-hot-toast';

// Inside the component:
export function Landing() {
  const { showBanner, triggerInstall, dismiss } = useAndroidInstallPrompt();
  const showIOSBanner = shouldShowIOSBanner();

  const handleInstall = async () => {
    await triggerInstall();
    // triggerInstall() handles the prompt; outcome tracked via appinstalled event
  };

  return (
    <div className="min-h-screen ...">
      {/* Header — add Install App button when showBanner */}
      <header className="flex items-center justify-between px-4 py-3">
        <span className="font-bold text-lg">Doppio</span>
        {showBanner && (
          <button
            onClick={handleInstall}
            className="text-sm font-medium text-blue-600 border border-blue-600
              px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
            style={{ touchAction: 'manipulation' }}
          >
            Install App
          </button>
        )}
      </header>

      {/* ... rest of Landing page ... */}

      {/* iOS install banner — rendered at bottom of page, fixed position */}
      {showIOSBanner && <IOSInstallBanner />}
    </div>
  );
}
```

Important: `shouldShowIOSBanner()` is called at render time (not in a hook), so it's a synchronous check on `navigator.userAgent` and `navigator.standalone`. This is fine — user agent doesn't change during the session. Both `shouldShowIOSBanner` and `useAndroidInstallPrompt` are imported from the Task 1.2 hook file at `src/hooks/useAndroidInstallPrompt.ts`.

### Step 4: Wire `App.tsx` — no changes needed

The `IOSInstallBanner` is rendered inside `Landing.tsx` (not App.tsx). The `useAndroidInstallPrompt` hook is used inside `Landing.tsx`. No App.tsx changes are required for this task.

### Step 5: Verify standalone guard is working

Test that the banner/button does NOT appear when the app is in standalone mode. Playwright can simulate this by evaluating `Object.defineProperty(navigator, 'standalone', { value: true })` before the page loads, but a simpler test is to verify the `isStandalone()` check works in code review.

For a real device test: install the app on iOS or Android, launch from home screen icon, verify the install banner does not appear.

## Files to Create

None — `useAndroidInstallPrompt.ts` and `IOSInstallBanner.tsx` are created by Task 1.2, not this task.

## Files to Modify

- `src/hooks/useAndroidInstallPrompt.ts` — add `track('pwa_installed')` to the `appinstalled` event handler (if not already present from Task 1.2)
- `src/pages/Landing.tsx` — import and call `useAndroidInstallPrompt` hook, add "Install App" button in header (Android) gated on `showBanner`, render `<IOSInstallBanner />` conditionally

## Contracts

### Provides (for downstream tasks)

- `useAndroidInstallPrompt()` hook: `{ showBanner: boolean, triggerInstall: () => Promise<void>, dismiss: () => void }` — created by Task 1.2, wired into Landing.tsx by this task
- `shouldShowIOSBanner()`: exported utility function from `src/hooks/useAndroidInstallPrompt.ts` (Task 1.2)
- `IOSInstallBanner` component: created by Task 1.2 at `src/components/IOSInstallBanner.tsx`, rendered in Landing.tsx by this task
- `pwa_installed` analytics event: fires via `appinstalled` window event → dynamic import of `track()`
- localStorage key `'doppio_install_dismissed_v1'`: written on dismissal; shared between iOS banner and Android button dismiss

### Consumes (from upstream tasks)

- Task 1.2 — `vite-plugin-pwa` configured, manifest valid, SW registered, `useAndroidInstallPrompt.ts` hook and `IOSInstallBanner.tsx` component created (all required for this task)
- Task 3.1 — `Landing.tsx` exists (the Android button and iOS banner render there)
- `react-hot-toast` + `<Toaster />` from Task 3.3 (for any future toast needs in this flow)

## Acceptance Criteria

- [ ] `useAndroidInstallPrompt` hook (from Task 1.2) imported and called in `Landing.tsx`
- [ ] `IOSInstallBanner` component (from Task 1.2) rendered in `Landing.tsx` conditionally
- [ ] iOS banner: `fixed bottom-0 z-50`, visible on iOS Safari only, hidden in standalone mode
- [ ] iOS banner: shows "Add to Home Screen" instruction text
- [ ] iOS banner: dismissable with ✕ button
- [ ] iOS banner dismissal: persisted in `localStorage['doppio_install_dismissed_v1']`
- [ ] iOS banner: does NOT appear after dismissal on page reload
- [ ] iOS banner: does NOT appear when `navigator.standalone === true`
- [ ] Android: `showBanner` becomes `true` when `BeforeInstallPromptEvent` fires
- [ ] Android: "Install App" button visible in Landing page header when `showBanner === true`
- [ ] Android: clicking "Install App" calls `triggerInstall()` which triggers `deferredPrompt.prompt()`
- [ ] Android: install prompt NOT shown when `window.matchMedia('(display-mode: standalone)').matches === true`
- [ ] `appinstalled` event: fires `track('pwa_installed')` analytics event
- [ ] `pwa_installed` analytics is fire-and-forget (no UI dependency, fails silently)
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] No console errors on Landing page load

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npm run build` succeeds
- [ ] `tsc --noEmit` passes

### Browser Testing (Playwright MCP)

Start: `npm run dev` (localhost:5173)

**Test 1: iOS banner appearance simulation**
- Use Playwright mobile emulation: iPhone 12 user agent (`Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1`)
- Navigate to `http://localhost:5173/`
- Verify: `IOSInstallBanner` component is rendered in the DOM
- Verify: Banner is `position: fixed`, at the bottom of the viewport
- Verify: Banner contains "Add to Home Screen" text

**Test 2: iOS banner dismissal**
- (Continuing from Test 1) Click the ✕ dismiss button on the iOS banner
- Verify: Banner disappears from DOM
- Verify: `localStorage.getItem('doppio_install_dismissed_v1')` equals `'true'`
- Reload the page
- Verify: Banner does NOT reappear after reload

**Test 3: iOS banner not shown when dismissed**
- Set `localStorage.setItem('doppio_install_dismissed_v1', 'true')` before navigating
- Navigate to `/` with iPhone UA
- Verify: Banner is NOT in the DOM

**Test 4: Standalone mode — banner suppressed**
- Evaluate: `Object.defineProperty(navigator, 'standalone', { get: () => true, configurable: true })`
- Navigate to `/`
- Verify: iOS banner does NOT render
- Verify: `showBanner` is false (no Android install button visible)

**Test 5: Android install button visibility**
- Note: `BeforeInstallPromptEvent` only fires in Chrome on HTTPS with a valid manifest. In dev mode with `devOptions.enabled: true`, the event may fire on localhost.
- Navigate to `http://localhost:5173/`
- If event fires: verify "Install App" button appears in the header
- If event does not fire in dev: test by mocking — evaluate in page context:
  ```javascript
  window.dispatchEvent(new Event('beforeinstallprompt'));
  ```
  Note: This is a simplified dispatch — full mock requires implementing `prompt` and `userChoice` properties. For integration, test on production HTTPS.

**Test 6: Full PWA install flow (Production)**
- Navigate to `https://doppio.kookyos.com` on an Android Chrome browser
- Verify: "Install App" button appears in header within 5 seconds of page load (if criteria met)
- Click "Install App" button
- Verify: Chrome install prompt dialog appears
- Accept installation
- Verify: App installs to home screen
- Verify (Supabase): `pwa_installed` event appears in `analytics_events` table

**User-emulating flow (iOS):**
1. Open `https://doppio.kookyos.com` in Safari on iPhone
2. See install banner at bottom of screen
3. Tap Share button (the square with arrow in Safari) → tap "Add to Home Screen"
4. OR tap ✕ on banner to dismiss it
5. Reload page — banner gone

**User-emulating flow (Android):**
1. Open `https://doppio.kookyos.com` in Chrome on Android
2. See "Install App" button in the landing page header
3. Tap "Install App" → Chrome install dialog appears
4. Tap "Install" → app installs to home screen

### External Service Verification

- Verify `BeforeInstallPromptEvent` fires on production URL: Navigate to `https://doppio.kookyos.com` in Chrome on Android (or Chrome DevTools with PWA manifest check showing "Installable")
- Chrome DevTools → Application → Manifest: verify "Installable" green badge is shown

## Skills to Read

- `pwa-vite-setup` — complete skill file, especially Sections 6 (iOS detection + banner), 7 (Android `BeforeInstallPromptEvent`), 11 (pitfalls: iOS standalone detection, `display: 'browser'` blocking install)
- `doppio-analytics` — `track()` function signature and fire-and-forget pattern

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D33, D34, D35, D36

## Git

- Branch: `phase-4/task-4-4-pwa-install-prompts`
- Commit message prefix: `Task 4.4:`
