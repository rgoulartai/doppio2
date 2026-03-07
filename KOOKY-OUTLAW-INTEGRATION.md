# kooky-outlaw Integration

> **Status:** ✅ Phase 1 implemented — 2026-03-07
> **Live at:** `doppio.kookyos.com/ai-feed`

---

## What's Built

```
kooky-outlaw (Hostinger VPS, Docker)
  LLM: qwen2.5:7b via Ollama on RunPod (Tailscale 100.90.24.91)
  HTTP Gateway: port 8080, POST /webhook
    │
    │ 1. Bot receives prompt via gateway
    │ 2. Calls YouTube Data API (3 searches × 15 results)
    │ 3. qwen2.5:7b ranks top 3 per level (9 total)
    │ 4. POSTs each video to Supabase (service role key)
    ▼
Supabase youtube_ai_videos table (tqknjbjvdkipszyghfgj)
    ▼
Doppio /ai-feed page — reads today's rows on load
```

---

## VPS Gateway

**Status:** ✅ Live

```bash
# Health check
curl http://100.94.51.9:8080/health
# → {"status":"ok"}

# SSH access
ssh -i ~/.ssh/id_ed25519 root@100.94.51.9

# Bot directory
/opt/kooky-outlaw/

# Env vars added (2026-03-07)
ENABLE_GATEWAY=true
GATEWAY_SECRET=<in 1Password — "Doppio Gateway Secret">
GATEWAY_PORT=8080

# Restart
cd /opt/kooky-outlaw && docker compose up --force-recreate -d

# Logs
cd /opt/kooky-outlaw && docker compose logs -f
```

---

## Supabase Table

**Status:** ✅ Applied to production (project `tqknjbjvdkipszyghfgj`)

```sql
create table public.youtube_ai_videos (
  id           uuid default gen_random_uuid() primary key,
  session_date date not null default current_date,
  fetched_at   timestamptz not null default now(),
  level        smallint not null check (level between 1 and 3),
  rank         smallint not null,
  title        text not null,
  channel      text not null,
  url          text not null,
  reason       text not null
);
-- Public read (anon key), bot writes via service role key (bypasses RLS)
```

Migration file: `supabase/migrations/002_youtube_ai_videos.sql`

---

## Triggering the Daily Run

### Credentials needed

| Credential | Where |
|-----------|-------|
| `YOUTUBE_API_KEY` | Google Cloud Console → APIs → YouTube Data API v3 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → doppio project → Settings → API |
| `GATEWAY_SECRET` | 1Password — "Doppio Gateway Secret" |

### The curl command

```bash
curl -X POST http://100.94.51.9:8080/webhook \
  -H "Content-Type: application/json" \
  -H "X-Gateway-Secret: GATEWAY_SECRET" \
  -d '{
    "sender_id": "doppio-cron",
    "content": "FULL_PROMPT_BELOW"
  }'
```

### The prompt (replace placeholders before sending)

```
You are curating daily YouTube videos for Doppio, an AI literacy app for non-technical users.

Search YouTube for recent AI videos using the YouTube Data API. Make three separate searches:

SEARCH 1 — Level 1 Beginner (ChatGPT everyday tasks):
URL: https://www.googleapis.com/youtube/v3/search?part=snippet&q=chatgpt+tutorial+beginners+everyday+tasks&type=video&order=viewCount&publishedAfter=SEVEN_DAYS_AGO&maxResults=15&key=YOUTUBE_API_KEY

SEARCH 2 — Level 2 Intermediate (Claude computer use / delegation):
URL: https://www.googleapis.com/youtube/v3/search?part=snippet&q=claude+computer+use+agentic+tasks&type=video&order=viewCount&publishedAfter=SEVEN_DAYS_AGO&maxResults=15&key=YOUTUBE_API_KEY

SEARCH 3 — Level 3 Advanced (AI workflows, Claude + Perplexity):
URL: https://www.googleapis.com/youtube/v3/search?part=snippet&q=claude+perplexity+AI+workflow+automation&type=video&order=viewCount&publishedAfter=SEVEN_DAYS_AGO&maxResults=15&key=YOUTUBE_API_KEY

Replace SEVEN_DAYS_AGO with the ISO 8601 date 7 days ago (e.g. 2026-03-01T00:00:00Z).
Replace YOUTUBE_API_KEY with the actual key.

For each search, select the 3 best videos:

LEVEL 1 rules — must show ChatGPT doing a task on screen (not just talking about it), task must be instantly recognizable to an office worker (meal planning, summarizing a doc, writing an email), no coding or developer content, prefer channels: Skill Leap AI, The Rundown AI, Matt Wolfe, under 10 minutes.

LEVEL 2 rules — must show Claude's computer use or agentic capabilities specifically, video must demonstrate handing off a multi-step job (organizing files, booking something, filling a form), prefer Anthropic's official YouTube channel, no coding tutorials.

LEVEL 3 rules — must show a complete workflow from raw input to polished output (receipts → expense report, research → dashboard), tools can include Claude AND/OR Perplexity, prefer Anthropic or Perplexity official channels, demonstrates multi-step chaining of tools.

After selecting 3 videos per level (9 total), save each one to Supabase by making a POST request to:
https://SUPABASE_REF.supabase.co/rest/v1/youtube_ai_videos

Headers:
  apikey: SUPABASE_SERVICE_ROLE_KEY
  Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY
  Content-Type: application/json
  Prefer: return=minimal

Body for each video (one POST per video):
{"level": LEVEL_NUMBER, "rank": RANK_WITHIN_LEVEL, "title": "VIDEO_TITLE", "channel": "CHANNEL_NAME", "url": "https://youtube.com/watch?v=VIDEO_ID", "reason": "One sentence: why this video helps a non-technical person at this level"}

Post all 9 videos. Confirm each POST returns HTTP 201 before proceeding to the next. Log a summary when done.
```

Replace `SUPABASE_REF` with `tqknjbjvdkipszyghfgj`.

---

## Demo Flow

The gateway is fire-and-forget (async). For the demo:

1. **Before the demo** — run the curl command. Wait ~2–5 min for results in Supabase.
2. **During the demo** — navigate to `doppio.kookyos.com/ai-feed`. Video cards render grouped by level.
3. **Or** — access Profile page → "Today's AI Videos" button.

---

## ⚠️ Known Issue: HEARTBEAT.md Parser Bug

The heartbeat system has a mismatch — `engine.py` uses `task.get('run', '')` and `task.get('purpose', '')` for the LLM prompt, but the parser only populates `instructions`. Result: heartbeat tasks fire with nearly empty prompts.

**Fix:** one-line change in `kooky-outlaw/src/kookyoutlaw/core/engine.py` — use `task.get('instructions', '')` instead of `task.get('run', '')`. Lives in the kooky-outlaw repo.

**For now:** use the HTTP gateway (above) — it receives the full prompt exactly as written.

---

## Phase 2 Roadmap

| Feature | What | Status |
|---------|------|--------|
| **Live content in /learn** | `fetchTodaysVideos()` replaces `content.json` in `Learn.tsx` | Planned |
| **Daily Vercel cron** | Trigger gateway automatically at 06:00 UTC via `vercel.json` cron | Planned |
| **Personalized coaching** | After card completion, user can ask bot a question (Qwen, zero API cost) | Planned |
| **HEARTBEAT.md fix** | One-line engine.py fix to make scheduled runs reliable | Planned (kooky-outlaw repo) |
| **Proactive follow-up** | Bot messages user on Telegram 24h after Doppio completion | Future |
