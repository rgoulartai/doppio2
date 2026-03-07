# Analytics Research

**Task**: Analytics for Doppio PWA
**Date**: 2026-03-06
**Status**: complete

---

## Summary

Doppio is a hackathon PWA deployed on Vercel with Supabase already in the stack and a "simplest possible analytics" requirement. The goal is to capture 7 key learning-path events (page view, level started, card completed, try-it clicked, level completed, badge shared, PWA installed) with minimal setup overhead and zero cookie/GDPR friction.

**Recommendation**: Use **Vercel Analytics** for page views and traffic (zero-config, free on Hobby, already on-platform, cookieless), plus **Supabase custom event rows** for the 7 learning-path events (no extra service, schema is a single table, Supabase client is already wired). This two-layer approach gives free traffic intelligence + rich funnel data with < 30 minutes of total setup time.

---

## Options Compared

| Dimension | Vercel Analytics | Plausible | Supabase Custom Events | PostHog |
|---|---|---|---|---|
| Free tier | Yes (Hobby plan) | No (trial only, then $9/mo min) | Yes (Supabase free tier) | Yes (1M events/mo) |
| Setup effort | Minimal (3 lines) | Low (1 script tag) | Low (1 table + client calls) | Medium (SDK + config) |
| Custom events | Pro plan only | Yes (goal events) | Yes (fully custom) | Yes (full product analytics) |
| Cookieless | Yes | Yes | Yes (no tracking at all) | No (uses cookies by default) |
| GDPR: no banner | Yes | Yes | Yes | No (needs consent) |
| Script size | ~1KB (injected by Vercel) | ~1KB | 0 (uses existing Supabase client) | ~30-50KB |
| Self-hosted | No | Yes (free, Docker) | N/A (you own the DB) | Yes (complex) |
| Real-time dashboard | Yes (Vercel dashboard) | Yes | No (query the DB yourself) | Yes |
| Funnel/path analysis | No | Limited | Manual SQL queries | Yes (full product analytics) |
| Fits hackathon timeline | Yes | Yes | Yes | Marginal |

---

## Vercel Analytics

### What it tracks (automatically)
- Page views (all routes, including SPA client-side transitions)
- Unique visitors (hash-based, no cookies, resets daily)
- Bounce rate
- Top pages, top referrers
- Geographic breakdown (country, region, city)
- Device OS, browser, device type (mobile/desktop/tablet)
- Query parameters (configurable filtering)

### What it cannot do on Hobby plan
- **Custom events are Pro-plan only.** On the Hobby (free) plan, `track()` calls are accepted by the package but the events dashboard is not accessible and data may not be retained. This is a significant limitation for tracking card completions, badge shares, etc.
- No funnel analysis
- No session replay
- No user identity

### Setup in Vite/React

```bash
npm install @vercel/analytics
```

```tsx
// src/main.tsx or src/App.tsx
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      {/* existing app */}
      <Analytics />
    </>
  );
}
```

For custom events (Pro plan required):
```tsx
import { track } from '@vercel/analytics';

// Anywhere in component code:
track('level_completed', { level: 1 });
track('card_completed', { level: 1, card: 2 });
track('try_it_clicked', { card_id: 'beginner-1' });
```

### Pricing
- **Hobby (free)**: Included event quota (approximately 2,500 events/month as of early 2026 — Vercel adjusts this; check dashboard). Page views tracked automatically. Custom events dashboard requires Pro.
- **Pro**: $20/month per team + $0.00003 per event beyond included quota. Custom events fully supported.
- **Web Analytics Plus add-on**: $10/month additional (extended reporting window, more features).

### Pros
- Zero additional configuration if already deploying to Vercel
- Cookieless, no GDPR cookie banner needed
- Data lives in your Vercel dashboard immediately
- Filters bots automatically

### Cons
- Custom events (the 7 Doppio-specific ones) require Pro plan
- No self-hosting
- Tightly coupled to Vercel — if you move host, you lose analytics
- Limited historical data on Hobby plan

---

## Plausible

### What it is
Privacy-first, cookieless analytics tool. Script is ~1KB. Tracks page views, referrers, geographic data, device info, and custom "goal" events. Popular GDPR-compliant alternative to Google Analytics.

### Free tier
**There is no free tier on Plausible Cloud.** It offers a 30-day free trial, after which the cheapest plan is $9/month (up to 10,000 monthly pageviews as of 2026). For a hackathon with potentially viral traffic, this could escalate.

### Self-hosted option
Plausible Community Edition (CE) is free and open source. It requires:
- A server (e.g., a VPS or Docker host)
- Docker + Docker Compose
- A PostgreSQL + ClickHouse database setup
- Ongoing maintenance

For a hackathon build, self-hosting Plausible is not "simplest possible" — it adds infrastructure that goes far beyond the zero-backend MVP constraint in the PRD.

### Setup in Vite/React
```html
<!-- index.html -->
<script defer data-domain="doppio.app" src="https://plausible.io/js/script.js"></script>
```

For custom events (called "goals"):
```html
<script defer data-domain="doppio.app" src="https://plausible.io/js/script.tagged-events.js"></script>
```
```tsx
// In React component
declare global { interface Window { plausible: Function } }

window.plausible?.('level_completed', { props: { level: 1 } });
```

Or use the community `plausible-tracker` npm package:
```bash
npm install plausible-tracker
```

### Script size
~1KB (minified, gzipped). Comparable to Vercel Analytics. Does not load any third-party cookies or fingerprinting scripts.

### Custom events support
Yes, fully supported on all paid plans. Goals can be URL-based or custom event-based with properties.

### Privacy / GDPR
Fully cookieless. No personal data collected. No consent banner required in the EU. Data stored in EU (Germany) on cloud plan. Compliant with GDPR, CCPA, PECR out of the box.

### Pros
- Cookieless, no consent banner
- Excellent dashboard UI
- Custom events on all plans (not pay-gated like Vercel)
- Self-hosted option if needed
- ~1KB script

### Cons
- No free tier; costs $9/month minimum after trial
- Self-hosting adds infrastructure complexity contradicting the "zero backend" MVP goal
- Adds a new external dependency for a hackathon

---

## Supabase Custom Events

### Concept
Since Supabase is already in the Doppio stack for progress sync, we can insert analytics event rows directly into a Supabase table using the existing client. No new service, no new dependency, no script to load.

### Schema

```sql
-- Single table for all events
create table analytics_events (
  id uuid default gen_random_uuid() primary key,
  event_name text not null,
  session_id text,           -- random UUID generated client-side per session, stored in sessionStorage
  created_at timestamptz default now(),
  properties jsonb           -- flexible: { level, card_id, card_title, ... }
);

-- Row Level Security: insert-only for anonymous users
alter table analytics_events enable row level security;

create policy "Anyone can insert events"
  on analytics_events for insert
  with check (true);

-- No read policy for anonymous users (only service role can read)
```

### Client-side usage

```ts
// src/lib/analytics.ts
import { supabase } from './supabase'; // existing client

const SESSION_ID_KEY = 'doppio_session_id';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

export async function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {}
) {
  try {
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      session_id: getSessionId(),
      properties,
    });
  } catch {
    // Silent fail — never break the app for analytics
  }
}
```

Usage:
```ts
import { trackEvent } from '@/lib/analytics';

// In level component:
trackEvent('level_started', { level: 1 });
trackEvent('card_completed', { level: 1, card: 2, card_title: 'Plan groceries' });
trackEvent('try_it_clicked', { card_id: 'beginner-2' });
trackEvent('level_completed', { level: 1 });
trackEvent('badge_shared', { via: 'copy_link' });
trackEvent('pwa_installed');
```

### Querying the data

```sql
-- Funnel: how many reached each level?
select event_name, count(*) as total, count(distinct session_id) as unique_sessions
from analytics_events
group by event_name
order by total desc;

-- Completion rate for each card
select
  properties->>'level' as level,
  properties->>'card' as card,
  count(*) as completions
from analytics_events
where event_name = 'card_completed'
group by level, card
order by level, card;

-- PWA install count
select count(*) from analytics_events where event_name = 'pwa_installed';
```

### Pros
- Zero additional cost (within Supabase free tier: 500MB DB, unlimited inserts within quota)
- Zero new dependencies — uses the Supabase JS client already in the project
- Fully custom schema — track exactly what Doppio needs, nothing else
- You own the data completely
- No script to load, no external service call
- Zero privacy concerns — no third-party data sharing, no fingerprinting
- Works offline-first if desired (can queue events in localStorage and flush on reconnect)

### Cons
- No pre-built dashboard — you query the DB or build a simple view
- No real-time visitor dashboard (not needed for hackathon)
- Requires writing ~30 lines of code vs 3 lines for Vercel Analytics
- Does not track page views automatically — must be called explicitly (or use `useEffect` on route changes)
- No geographic or device data unless you collect it manually (rarely needed for hackathon)
- Supabase free tier has DB size limit (500MB) and API rate limits — very unlikely to be a concern for MVP traffic

### Supabase free tier limits (2026)
- 500MB database storage
- Unlimited API requests (subject to fair use)
- 2 active projects
- Row-level security included

At ~200 bytes per event row, 500MB = ~2.5 million events before hitting storage limits. More than sufficient for a hackathon.

---

## PostHog

### What it is
Open-source product analytics platform. Tracks page views, sessions, custom events, funnels, feature flags, session recordings, A/B tests. The most feature-rich option in this comparison.

### Free tier
PostHog Cloud offers a **generous free tier**: 1 million events per month free, forever. After 1M, pay-as-you-go at $0.000248/event. Session recordings: 5,000/month free.

### Setup in Vite/React
```bash
npm install posthog-js
```
```tsx
// src/main.tsx
import posthog from 'posthog-js';

posthog.init('phc_YOUR_KEY', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only', // avoid creating profiles for anonymous users
});
```

Custom events:
```ts
posthog.capture('level_completed', { level: 1 });
```

### Bundle size
**~35-50KB (gzipped)** — significantly larger than the other options. For a PWA targeting mobile users and quick load times, this is a meaningful addition to the bundle.

### Is it overkill?
For a 9-card hackathon PWA, yes. PostHog's feature set — session recordings, funnels, A/B testing, feature flags, user identity, cohorts — is designed for ongoing product development across teams. It is appropriate when you need to deeply understand user behavior over weeks and run experiments. For a hackathon demo, most of these features go unused.

### Privacy / GDPR
PostHog uses cookies by default (`ph_` prefixed cookies). This requires a GDPR consent banner in the EU unless you:
- Disable autocapture
- Set `persistence: 'memory'` (no cookies, but no cross-session tracking)
- Or self-host and configure appropriately

Cookie consent friction is undesirable for a first-impression hackathon PWA.

### Pros
- 1M free events/month is very generous
- Full product analytics stack in one tool
- Session recordings useful for demos
- Open source, can self-host

### Cons
- 35-50KB bundle addition
- Requires cookie consent banner for GDPR compliance in default config
- Significant overkill for a 9-card MVP
- More configuration than alternatives
- Adds a new dependency and account to manage

---

## Key Events to Track

The following 7 events are the minimum viable signal set for Doppio:

| Event Name | Trigger | Key Properties |
|---|---|---|
| `page_view` | On every route change | `{ path, referrer }` |
| `level_started` | User clicks "Start Level N" CTA | `{ level: 1|2|3 }` |
| `card_completed` | User marks card as done / returns from Try-it | `{ level, card, card_title }` |
| `try_it_clicked` | User clicks "Try it" CTA on a card | `{ level, card, card_id, tool: 'chatgpt'|'claude'|... }` |
| `level_completed` | User finishes all 3 cards in a level | `{ level, duration_ms }` |
| `badge_shared` | User shares completion badge | `{ method: 'copy_link'|'native_share' }` |
| `pwa_installed` | `beforeinstallprompt` accepted or `appinstalled` event fires | `{ platform: 'ios'|'android'|'desktop' }` |

### Derived metrics these enable
- **Funnel**: landing → level 1 started → level 1 completed → level 2 started → ... → badge shared
- **Drop-off**: which card has highest abandonment rate
- **Try-it conversion**: % of card views that result in a Try-it click
- **Virality**: badge shares / completions ratio
- **PWA adoption**: installs / visitors ratio

---

## Privacy / GDPR

### Key principle for hackathon
Avoid cookie consent banners at all costs. They create friction on the landing page, hurt conversion, and are complex to implement correctly. The goal is to collect signals without needing explicit consent.

### Which approaches are cookieless?

| Tool | Cookieless | GDPR Compliant Without Banner |
|---|---|---|
| Vercel Analytics | Yes (hash-based, daily reset) | Yes |
| Plausible | Yes | Yes |
| Supabase custom events | Yes (no tracking mechanism at all) | Yes |
| PostHog (default) | No (uses `ph_` cookies) | No — banner required |
| PostHog (memory persistence) | Yes | Yes (but loses cross-session tracking) |
| Google Analytics 4 | No | No — banner required |

### What the Supabase approach collects
- `event_name`: a string like `"level_completed"` — not personal data
- `session_id`: a random UUID generated in `sessionStorage` — ephemeral, not tied to identity, resets on tab close — not personal data under GDPR
- `properties`: only data you explicitly put there — avoid putting IP, email, or user-agent

The Supabase approach collects **no personal data by default** and requires no cookie consent mechanism.

### What Vercel Analytics collects
- A daily-expiring hash derived from IP + user agent — Vercel explicitly states this is not stored permanently and cannot re-identify users across sessions or sites
- URL, referrer, geo, device type — all aggregated, not linked to individuals
- **No personal data, no consent banner required**

---

## Recommendation

### For Doppio at hackathon scale: combine two approaches

**Layer 1 — Vercel Analytics (page views + traffic)**
- Enables immediately on deploy with 3 lines of code
- Free on Hobby plan (page views only)
- Gives: visitor counts, top pages, referrers, geo, device breakdown
- Cookieless, no GDPR friction
- Lives in the Vercel dashboard you already have

```bash
npm install @vercel/analytics
```
```tsx
// App.tsx — add once
import { Analytics } from '@vercel/analytics/react';
// ... inside JSX:
<Analytics />
```

**Layer 2 — Supabase custom events (the 7 key learning-path events)**
- One table, one 30-line helper file
- Uses existing Supabase client — zero new dependencies
- Captures the funnel events that matter for judging: level completions, try-it clicks, badge shares, PWA installs
- Completely cookieless, no personal data, no consent banner
- You can query the data live during the demo: "3 people have already completed level 2"

```sql
-- Create once in Supabase SQL editor
create table analytics_events (
  id uuid default gen_random_uuid() primary key,
  event_name text not null,
  session_id text,
  created_at timestamptz default now(),
  properties jsonb
);
alter table analytics_events enable row level security;
create policy "anon insert" on analytics_events for insert with check (true);
```

### Why not Plausible?
No free tier. $9/month minimum. Adds external dependency and cost to a hackathon project when Supabase already covers custom events.

### Why not PostHog?
35-50KB bundle size hurts PWA performance. Requires cookie consent banner in default configuration. Features (session recording, A/B tests, funnels UI) are overkill for a 9-card MVP. The 1M free events are attractive but the complexity trade-off is not worth it.

### Why not Vercel Analytics alone?
Custom events (the 7 Doppio-specific ones) require a Pro plan ($20/month). Supabase custom events solve this for free using infrastructure already in the project.

### Total setup time
- Vercel Analytics: ~5 minutes (install package, add component, deploy)
- Supabase events table + helper: ~20 minutes (SQL migration, write `analytics.ts`, add 7 `trackEvent()` calls)
- **Combined: ~25 minutes. Fits the hackathon constraint.**

---

## References

- Vercel Web Analytics documentation: https://vercel.com/docs/analytics
- Vercel Analytics quickstart: https://vercel.com/docs/analytics/quickstart
- Vercel custom events: https://vercel.com/docs/analytics/custom-events
- Vercel Analytics limits and pricing: https://vercel.com/docs/analytics/limits-and-pricing
- Vercel Analytics privacy policy: https://vercel.com/docs/analytics/privacy-policy
- Plausible Analytics: https://plausible.io
- Plausible self-hosted: https://plausible.io/self-hosted-web-analytics
- Plausible custom events docs: https://plausible.io/docs/custom-event-goals
- PostHog JS SDK: https://posthog.com/docs/libraries/js
- PostHog pricing: https://posthog.com/pricing
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- GDPR and cookieless analytics (Plausible blog): https://plausible.io/blog/google-analytics-gdpr
- MDN: beforeinstallprompt event: https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event
