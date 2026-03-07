# Task 1.1: Scaffold React + Vite + Tailwind Project

## Objective

Initialize the Doppio project from scratch using Vite's React TypeScript template, install all required dependencies in one pass, configure Tailwind CSS, set up React Router v6 with all three routes, and establish the complete directory structure that every subsequent task depends on.

## Context

This is the first task in Phase 1. Nothing exists yet. Every other task in the project (all 29) depends either directly or transitively on the scaffolding produced here. The directory layout, package.json dependency set, and route structure must match the contracts documented in DISCOVERY.md and the `doppio-architecture` skill exactly — no deviation allowed.

## Dependencies

- None (first task)

## Blocked By

- Nothing

## Research Findings

Key decisions from DISCOVERY.md that apply here:

- **D21**: React 18+, Vite build tool, Tailwind CSS.
- **D53**: Only two env vars needed: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Both safe to expose client-side.
- **D60**: React Router v6 client-side routing. Routes: `/`, `/learn`, `/complete`, `/?ref=badge`.
- **D22**: `vite-plugin-pwa` v0.21.x is the PWA plugin. Full PWA config is done in Task 1.2, but the package must be installed here.
- **D20**: All video content lives in `src/data/content.json` — this directory must be created as an empty placeholder here.
- **Architecture skill**: Exact file structure is prescribed — follow it precisely.

---

## Implementation Plan

### Step 1: Scaffold the Vite Project

The project root is `/Users/renatosgafilho/Projects/KOOKY/Doppio`. Check whether a `package.json` already exists at the root before scaffolding.

**If `package.json` does NOT exist at the root**, scaffold inside the directory:

```bash
cd /Users/renatosgafilho/Projects/KOOKY/Doppio
npm create vite@latest . -- --template react-ts
```

The `.` means scaffold into the current directory (not a subdirectory). If Vite prompts "Current directory is not empty. Remove existing files and continue?", you must evaluate what is there — only proceed if the existing files are non-code (e.g., `.claude/`, `.gitignore`). Vite will create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/index.css`, `src/assets/`, `public/vite.svg`.

**If `package.json` already exists**, skip scaffolding and proceed to Step 2.

### Step 2: Install All Project Dependencies

Install all runtime and dev dependencies in a single command. This avoids multiple npm install passes and resolves the lockfile once.

```bash
npm install react-router-dom @supabase/supabase-js canvas-confetti react-hot-toast @vercel/analytics lite-youtube-embed

npm install -D tailwindcss postcss autoprefixer @vite-pwa/assets-generator vite-plugin-pwa @types/canvas-confetti
```

Package rationale:
- `react-router-dom` — React Router v6, client-side routing
- `@supabase/supabase-js` — Supabase JS client v2 for anonymous auth + progress sync
- `canvas-confetti` — Level completion confetti (~6 kB gzipped)
- `react-hot-toast` — "Prompt copied!" toast notifications
- `@vercel/analytics` — Vercel Analytics layer 1 (page views, referrers)
- `lite-youtube-embed` — YouTube facade/lazy-load web component
- `tailwindcss`, `postcss`, `autoprefixer` — Tailwind CSS v3
- `vite-plugin-pwa` — PWA manifest + Workbox Service Worker (configured in Task 1.2)
- `@vite-pwa/assets-generator` — Generates all PWA icon sizes from single source PNG (used in Task 1.2)
- `@types/canvas-confetti` — TypeScript types for canvas-confetti

### Step 3: Initialize Tailwind CSS

```bash
npx tailwindcss init -p
```

This generates `tailwind.config.js` and `postcss.config.js`. Then update `tailwind.config.js` to scan all source files:

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Step 4: Update `src/index.css`

Replace the entire contents of `src/index.css` with Tailwind's directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Remove the default Vite CSS content entirely.

### Step 5: Update `vite.config.ts`

Replace the generated `vite.config.ts` with a minimal working config (PWA plugin will be added in Task 1.2):

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
  ],
})
```

Note: `vite-plugin-pwa` is intentionally NOT added here — that is Task 1.2's responsibility. The package is installed now so it is available.

### Step 6: Create Directory Structure

Create all directories and placeholder files that downstream tasks depend on:

```
src/
  components/      (empty — components created in Phase 3+)
  hooks/           (empty — hooks created in Phase 3+)
  lib/             (empty — supabase.ts, progress.ts, analytics.ts created in Tasks 1.3, 3.4, 5.1)
  data/            (empty — content.json created in Task 2.1)
  pages/           (Landing.tsx, Learn.tsx, Complete.tsx — shells created below)
public/
  icons/           (empty — icons generated in Task 1.2)
supabase/
  migrations/      (empty — SQL migrations added in Task 1.3)
```

Create placeholder directories by writing a `.gitkeep` file in each empty directory that must exist:

- `src/components/.gitkeep`
- `src/hooks/.gitkeep`
- `src/lib/.gitkeep`
- `src/data/.gitkeep`
- `public/icons/.gitkeep`
- `supabase/migrations/.gitkeep`

### Step 7: Create Page Shell Components

Create three empty page shells that React Router will route to. These are intentionally minimal — the real implementations come in Phase 3 and 4.

**`src/pages/Landing.tsx`**:
```tsx
export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Doppio</h1>
        <p className="mt-2 text-gray-400">Landing page — coming in Phase 3</p>
      </div>
    </div>
  )
}
```

**`src/pages/Learn.tsx`**:
```tsx
export default function Learn() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Learn</h1>
        <p className="mt-2 text-gray-400">Learning path — coming in Phase 3</p>
      </div>
    </div>
  )
}
```

**`src/pages/Complete.tsx`**:
```tsx
export default function Complete() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">You're an AI Manager!</h1>
        <p className="mt-2 text-gray-400">Completion screen — coming in Phase 4</p>
      </div>
    </div>
  )
}
```

### Step 8: Update `src/App.tsx`

Replace the generated `App.tsx` with React Router v6 routes:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Learn from './pages/Learn'
import Complete from './pages/Complete'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/complete" element={<Complete />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

Note: `/?ref=badge` is handled inside `Landing.tsx` via `useSearchParams` — the route itself is just `/`. That logic is added in Task 3.1.

### Step 9: Update `src/main.tsx`

Replace the generated `main.tsx` with React 18 strict mode mount:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

Note: The `registerSW` import from `virtual:pwa-register` is added in Task 1.2 when vite-plugin-pwa is configured.

### Step 10: Update `index.html`

Replace the generated `index.html` with a clean base. PWA meta tags will be added in Task 1.2:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Doppio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Step 11: Create `.env.example`

Create `.env.example` in the project root as a template for required environment variables:

```
# Supabase project credentials
# Copy this file to .env.local and fill in real values from Supabase Dashboard
# Project Settings → API → Project URL and anon public key
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key-here>
```

### Step 12: Update `.gitignore`

Ensure `.gitignore` contains the following critical entries (add any that are missing):

```
# Dependencies
node_modules/

# Build output
dist/
dist-ssr/

# Environment variables — NEVER commit these
.env
.env.local
.env.production
.env.*.local

# Vercel
.vercel/

# Editor
.vscode/
.DS_Store

# Logs
*.log
npm-debug.log*
```

### Step 13: Add `package.json` Scripts

Add the PWA asset generation script to `package.json` so Task 1.2 can use it. Also verify standard scripts are present:

In `package.json`, the `scripts` section must include:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "generate-pwa-assets": "pwa-assets-generator --preset minimal public/icon-source.png"
  }
}
```

The `generate-pwa-assets` script references `public/icon-source.png` — that file is created in Task 1.2 before the script is run.

### Step 14: Verify Tailwind is Working

Add a temporary test to the `Landing.tsx` page to confirm Tailwind styles apply:

The `bg-gray-900` and `text-white` classes already used in the shell components serve as the Tailwind test. If those classes produce the expected dark background in the browser, Tailwind is working.

---

## Files to Create

- `src/pages/Landing.tsx` — Empty shell page component
- `src/pages/Learn.tsx` — Empty shell page component
- `src/pages/Complete.tsx` — Empty shell page component
- `src/components/.gitkeep` — Preserve empty directory in git
- `src/hooks/.gitkeep` — Preserve empty directory in git
- `src/lib/.gitkeep` — Preserve empty directory in git
- `src/data/.gitkeep` — Preserve empty directory in git
- `public/icons/.gitkeep` — Preserve empty directory in git
- `supabase/migrations/.gitkeep` — Preserve empty directory in git
- `.env.example` — Template for required environment variables
- `tailwind.config.js` — Tailwind configuration with src/** content scanning

## Files to Modify

- `src/App.tsx` — Replace with React Router v6 BrowserRouter + routes
- `src/main.tsx` — Replace with React 18 strict mode + clean imports
- `src/index.css` — Replace with Tailwind directives only
- `index.html` — Clean base HTML (PWA tags added in Task 1.2)
- `vite.config.ts` — Minimal Vite config (PWA plugin added in Task 1.2)
- `package.json` — Add `generate-pwa-assets` script
- `.gitignore` — Ensure .env, .env.local, .vercel/ are excluded

---

## Contracts

### Provides (for downstream tasks)

- **Directory structure**: `src/components/`, `src/hooks/`, `src/lib/`, `src/data/`, `src/pages/`, `public/icons/`, `supabase/migrations/` — all exist
- **Routes**: `/` → `Landing`, `/learn` → `Learn`, `/complete` → `Complete`
- **Package set**: All runtime and dev dependencies installed — no task needs to `npm install` again except for packages explicitly listed as additions in their own task
- **Script**: `npm run generate-pwa-assets` available in package.json
- **Tailwind**: Configured and working — all downstream components can use utility classes
- **TypeScript**: `tsc` and Vite build pipeline working

### Consumes (from upstream tasks)

- Nothing — this is the root task

---

## Acceptance Criteria

- [ ] `npm run dev` starts without errors on `localhost:5173`
- [ ] `npm run build` completes with exit code 0, no TypeScript errors
- [ ] Browser: navigating `localhost:5173/` renders Landing page with dark background
- [ ] Browser: navigating `localhost:5173/learn` renders Learn page (no 404)
- [ ] Browser: navigating `localhost:5173/complete` renders Complete page (no 404)
- [ ] Tailwind CSS confirmed working (dark background on Landing page renders)
- [ ] `.env.example` exists with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` placeholders
- [ ] `.env` and `.env.local` are in `.gitignore`
- [ ] `package.json` contains `generate-pwa-assets` script
- [ ] `src/pages/Landing.tsx`, `src/pages/Learn.tsx`, `src/pages/Complete.tsx` exist
- [ ] `src/lib/`, `src/hooks/`, `src/components/`, `src/data/` directories exist

---

## Testing Protocol

### Build/Lint/Type Checks

- [ ] `npm run build` — exits 0, no errors, outputs `dist/` directory
- [ ] `npx tsc --noEmit` — no TypeScript errors

### Browser Testing (Playwright MCP)

- Start: `npm run dev` in the Doppio project root
- Navigate to: `http://localhost:5173/`
- Verify: Page renders with dark background (`bg-gray-900`), "Doppio" heading visible
- Navigate to: `http://localhost:5173/learn`
- Verify: "Learn" heading visible, no 404, no blank screen
- Navigate to: `http://localhost:5173/complete`
- Verify: "You're an AI Manager!" heading visible, no 404
- Screenshot: Capture `localhost:5173/` as proof of working scaffold
- Console check: Open browser console — verify no red errors (warnings about React strict mode double-render are normal)

### File Existence Checks

Verify the following files exist (Read each one to confirm):
- `package.json` contains `react-router-dom`, `@supabase/supabase-js`, `canvas-confetti`, `react-hot-toast`, `@vercel/analytics`, `lite-youtube-embed`
- `package.json` contains devDependencies: `tailwindcss`, `vite-plugin-pwa`, `@vite-pwa/assets-generator`
- `tailwind.config.js` has `content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]`
- `src/index.css` contains only `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;`
- `.env.example` exists with both placeholder variable names
- `.gitignore` contains `.env` and `.env.local` entries

### Build/Lint/Type Checks

- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` passes

---

## Skills to Read

- `.claude/skills/doppio-architecture/SKILL.md` — File structure, routing, data flows. Read this first to understand the full project layout.

## Research Files to Read

- `.claude/orchestration-doppio/DISCOVERY.md` — D21, D53, D60 for stack decisions
- `.claude/orchestration-doppio/PHASES.md` — Phase 1, Task 1.1 section for acceptance criteria

---

## Git

- Branch: `phase-1/scaffold`
- Commit message prefix: `Task 1.1:`
- Example: `Task 1.1: scaffold React + Vite + Tailwind with React Router v6`
- Commit after `npm run build` passes and all three routes are verified working in browser
