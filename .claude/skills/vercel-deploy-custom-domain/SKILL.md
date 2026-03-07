---
name: vercel-deploy-custom-domain
description: Vercel deployment and custom domain setup for Doppio. Use when deploying to production, configuring doppio.kookyos.com, setting environment variables, or configuring vercel.json.
---

# Vercel Deployment & Custom Domain — Doppio

**Production URL**: `https://doppio.kookyos.com`
**Hosting**: Vercel free Hobby plan, deployed from Git repo
**DNS**: Hostgator DNS, CNAME record pointing to Vercel

---

## 1. Initial Vercel Setup

### Install and Authenticate

```bash
# Option A: Global install
npm install -g vercel

# Option B: Use without installing
npx vercel
```

```bash
# Log in to your Vercel account
vercel login
```

### Link the Project

Run from the Doppio project root:

```bash
vercel
```

When prompted:
- **Framework preset**: Vite
- **Build command**: `vite build`
- **Output directory**: `dist`
- **Install command**: `npm install` (default)

This creates a `.vercel/` directory with project metadata. Do not commit `.vercel/` to Git.

---

## 2. vercel.json Configuration

Place `vercel.json` in the project root. This config handles:
- Content Security Policy headers for YouTube and TikTok embeds (required by Doppio's video facade pattern)
- SPA rewrites so React Router routes serve `index.html` instead of 404ing

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.tiktok.com; script-src 'self' 'unsafe-inline' https://www.youtube.com;"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Why this matters for Doppio**:
- YouTube iframes (via `lite-youtube-embed`) and TikTok iframes require explicit `frame-src` allowlist in CSP
- The `rewrites` rule is the SPA catch-all — without it, direct navigation to `/learn`, `/level/2`, `/complete` returns a 404

---

## 3. Environment Variables

Doppio requires two environment variables. Both are safe to expose client-side (Supabase anon key is designed for public use). All variables use `VITE_` prefix so Vite injects them at build time.

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### Set via Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Project Settings → Environment Variables**
3. Add each variable with these scope settings:
   - **VITE_SUPABASE_URL**: check both `Production` and `Preview`
   - **VITE_SUPABASE_ANON_KEY**: check both `Production` and `Preview`
4. Click **Save**
5. Redeploy for the variables to take effect

### Local Development

Create a `.env.local` file in the project root (never commit this file):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

---

## 4. Custom Domain Setup — doppio.kookyos.com

### Step 1: Add Domain in Vercel

1. Go to Vercel project dashboard
2. Navigate to **Project → Settings → Domains**
3. Click **Add Domain**
4. Enter: `doppio.kookyos.com`
5. Click **Add**
6. Vercel will display a CNAME record to configure — note it down

### Step 2: Add CNAME Record in Hostgator DNS

1. Log in to Hostgator cPanel
2. Navigate to **DNS Zone Editor** (or **Zone Editor** under Domains)
3. Find the zone for `kookyos.com`
4. Add a new CNAME record:
   - **Name / Host**: `doppio`
   - **Type**: `CNAME`
   - **Points To / Value**: `cname.vercel-dns.com` (confirm exact target from Vercel's domain settings panel)
   - **TTL**: `3600` (or default)
5. Save the record

### Step 3: Verify and SSL

- Return to Vercel Domains settings and click **Verify** (or it auto-checks)
- SSL/TLS certificate is issued automatically by Vercel via Let's Encrypt — no manual action needed
- DNS propagation: typically minutes to a few hours, up to 24 hours in rare cases

### Confirming DNS propagation

```bash
# Check CNAME resolution
dig CNAME doppio.kookyos.com

# Or use online tools: dnschecker.org
```

Once DNS resolves and SSL is issued, `https://doppio.kookyos.com` is live.

---

## 5. Deploying

### Production Deploys

**Via Git integration (recommended)**: Push to the `main` branch. Vercel auto-deploys on every push.

**Via CLI**:

```bash
vercel --prod
```

### Preview Deploys

Any branch other than `main` automatically creates a preview deployment at a unique URL like:
`https://doppio-git-<branch-name>-<team>.vercel.app`

Preview deploys use the `Preview` environment variable scope, so Supabase credentials work on previews too.

---

## 6. Enable Vercel Analytics

Doppio uses a two-layer analytics approach. Vercel Analytics handles layer 1 (page views, referrers, geo, device).

### Package Installation

```bash
npm install @vercel/analytics
```

### Integration in React

In your app entry point (`src/main.tsx` or `src/App.tsx`):

```tsx
import { inject } from '@vercel/analytics';

inject();
```

Or use the React component if preferred:

```tsx
import { Analytics } from '@vercel/analytics/react';

// Inside your root component's JSX:
<Analytics />
```

### Enable in Dashboard

1. Go to Vercel project dashboard
2. Navigate to **Project → Analytics**
3. Click **Enable Analytics**
4. Free on Hobby plan for page views

---

## 7. SPA Routing

React Router v6 handles client-side routing for these routes:

```
/           → Landing page
/learn      → Learning path
/level/:n   → Level n view
/complete   → Final completion screen
/?ref=badge → Badge share link (same landing, badge banner shown)
```

The `rewrites` rule in `vercel.json` serves `index.html` for all paths, allowing React Router to handle navigation client-side. Without this rule, refreshing on `/learn` or navigating directly to `/complete` would return a 404 from Vercel's static file server.

---

## 8. PWA Service Worker

`vite-plugin-pwa` (v0.21.x with Workbox) generates the service worker during `vite build`. Vercel serves static files correctly — no special Vercel configuration is required for the PWA service worker to function.

**Service Worker strategy**: `CacheFirst` for app shell, `autoUpdate` registration type.

The built SW file (`sw.js` or `workbox-*.js`) is output to `dist/` and served as a static asset. Vercel's CDN edge caching is compatible with SW lifecycle without any additional headers configuration.

---

## Quick Reference

| Task | Command / Location |
|------|--------------------|
| Initial link | `vercel` in project root |
| Production deploy | Push to `main` or `vercel --prod` |
| Preview deploy | Push to any other branch |
| Environment variables | Vercel Dashboard → Project Settings → Environment Variables |
| Custom domain | Vercel Dashboard → Project Settings → Domains |
| Analytics | Vercel Dashboard → Project → Analytics → Enable |
| Verify DNS | `dig CNAME doppio.kookyos.com` |
