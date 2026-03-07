# kooky-outlaw Integration

> **Status:** ✅ Phase 2 fully working — 2026-03-07 (Doppio2)
> **Live at:** `doppio2.vercel.app` (full integration — Learn.tsx + AI feed)
> **Pipeline:** `doppio_curate.py` produces 9 rows across all 3 levels, confirmed live

---

## What's Built

```
doppio_curate.py (runs inside kooky-outlaw container on Hostinger VPS)
    │
    ├── Phase A: YouTube fetch — direct Python HTTP call to YouTube Data API
    │     3 queries × 15 results = up to 45 candidate videos
    │
    ├── Phase B: LLM curation — 3 messages to kooky-outlaw HTTP gateway
    │     Each message: "From this list, pick best 3. Return 3 JSON objects."
    │     LLM: llama3.1:8b via Ollama on RunPod (Tailscale 100.90.24.91)
    │
    └── Phase C: Supabase write — direct Python HTTP POST (no LLM for writing)
          9 rows → d2_youtube_ai_videos (level 1-3, rank 1-3)
    ▼
Supabase d2_youtube_ai_videos table (tqknjbjvdkipszyghfgj)
    ▼
Doppio2 /learn page — reads today's rows on load (with static fallback)
Doppio2 /ai-feed page — secondary browse view
```

**Key design decision:** YouTube fetching and Supabase POSTing are done directly in Python.
The LLM is only used for curation (picking best 3 and writing a reason). This sidesteps
LLM output format inconsistencies for structured data operations.

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

The active table is `d2_youtube_ai_videos` (Doppio2-specific, `d2_` prefix isolates from original Doppio).

```sql
-- Migration: supabase/migrations/003_doppio2_tables.sql
create table public.d2_youtube_ai_videos (
  id           uuid default gen_random_uuid() primary key,
  session_date date not null,            -- ⚠️ NOT NULL, no default yet — must be in POST body
  fetched_at   timestamptz not null default now(),
  level        smallint not null check (level between 1 and 3),
  rank         smallint not null,
  title        text not null,
  channel      text not null default '',
  url          text not null,
  video_id     text not null,            -- 11-char YouTube ID
  reason       text not null default '',
  ai_tool      text not null default ''  -- 'chatgpt' | 'claude' | 'perplexity'
);
-- Public read (anon key), bot writes via service role key (bypasses RLS)
```

> **Note:** `session_date` has no `DEFAULT CURRENT_DATE` yet. Migration `004_session_date_default.sql`
> exists locally but has not been applied (no `supabase/config.toml` for `supabase db push`).
> The workaround — passing `session_date` explicitly in every POST — is already in `doppio_curate.py`.

Migration files:
- `supabase/migrations/002_youtube_ai_videos.sql` — original Doppio table (not used by Doppio2)
- `supabase/migrations/003_doppio2_tables.sql` — `d2_youtube_ai_videos` schema
- `supabase/migrations/004_session_date_default.sql` — pending: adds `DEFAULT CURRENT_DATE`

---

## Triggering the Daily Run

### Credentials needed

All credentials are already hardcoded in `doppio_curate.py` on the VPS.
No manual substitution needed.

| Credential | Location in script | 1Password backup |
|-----------|-------------------|-----------------|
| `YOUTUBE_API_KEY` | `YOUTUBE_API_KEY` constant | "YouTube Data API Key" |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_KEY` constant | "Doppio Service Role Key" |
| `GATEWAY_SECRET` | `GATEWAY_SECRET` constant | "Doppio Gateway Secret" |

### Running the pipeline

```bash
# SSH to VPS
ssh -i ~/.ssh/id_ed25519 root@100.94.51.9

# Run inside the container
docker exec kooky-outlaw python3 /app/doppio_curate.py
```

Expected output (successful run):
```
Doppio curation — 2026-03-07 20:11:48
  seven_days_ago: 2026-02-28T00:00:00Z
  cleared N history rows

────────────────────────────────────────────────────────────
  Level 1: ChatGPT for beginners
  Fetching YouTube results...
  Found 15 videos
  Asking LLM to curate...
  queued as message NNNN
  waiting for LLM.......... done (Xs)
  LLM picked 3 videos
  Posting to Supabase...
    POST rank 1: HTTP 201 — <title>
    POST rank 2: HTTP 201 — <title>
    POST rank 3: HTTP 201 — <title>
  [... repeat for Level 2, Level 3 ...]
────────────────────────────────────────────────────────────
  Curation complete! Posted 9 rows to d2_youtube_ai_videos.
```

### Deploying script updates

`src/` is **baked into the Docker image** at build time — NOT volume-mounted.
To update any Python file, use `docker cp`:

```bash
# 1. SCP file to VPS host
scp -i ~/.ssh/id_ed25519 scripts/doppio_curate.py root@100.94.51.9:/opt/kooky-outlaw/scripts/doppio_curate.py

# 2. Copy into running container
docker cp /opt/kooky-outlaw/scripts/doppio_curate.py kooky-outlaw:/app/doppio_curate.py

# 3. No restart needed for script-only changes (doppio_curate.py runs as a one-shot exec)
# For engine.py or other src/ changes, restart is required:
docker compose -f /opt/kooky-outlaw/docker-compose.yml restart kooky-outlaw
```

---

## Demo Flow

The gateway is fire-and-forget (async). For the demo:

1. **Before the demo** — run the curl command. Wait ~2–5 min for results in Supabase.
2. **During the demo** — navigate to `doppio.kookyos.com/ai-feed`. Video cards render grouped by level.
3. **Or** — access Profile page → "Today's AI Videos" button.

---

## Pipeline Engineering Notes

These are hard-won debugging findings from getting the pipeline to 100%.

### YouTube API: `publishedAfter` + `order=viewCount` returns 0 items

The combination `publishedAfter=<date>&order=viewCount` consistently returns `pageInfo.resultsPerPage: 0`
even when `totalResults` is 500+. This is a YouTube Data API quirk — results exist but aren't served.

**Fix in `doppio_curate.py`:** Drop `publishedAfter` from the YouTube fetch URL entirely.
The `order=viewCount` filter is sufficient to surface recent, relevant content.

```python
# ❌ Broken (returns 0 items)
url = f"...&order=viewCount&publishedAfter={SEVEN_DAYS_AGO}&maxResults=15..."

# ✅ Works
url = f"...&order=viewCount&maxResults=15..."
```

### LLM output format for tool calls is inconsistent

`llama3.1:8b` inconsistently formats tool call output. Observed variants:
- Native `tool_calls` in JSON (works perfectly)
- ` ```json\n{...}``` ` fenced blocks (caught by post-loop interceptor)
- `{"name": ...}` bare JSON (caught by bare JSON scanner)
- `{\n  "name": ...}` pretty-printed (fixed in `engine.py` — regex `\{[\s]*"name"`)
- `1. {"name": ..., "body": "{"nested": ...}"}` — outer `}` missing due to deep nesting

The last variant (missing outer `}` in deeply nested JSON) was the root cause of Supabase POSTs failing.
**Fix:** Supabase POSTs are now done directly in Python — the LLM is only asked for simple JSON objects
(no nested `body` field), eliminating the nesting depth that caused the formatting failure.

### `docker cp` is required for deployments

`src/` is baked into the Docker image at build time — it is NOT volume-mounted. `scp` to the VPS host
updates host files but NOT the running container. Always use:
```bash
docker cp <local-file> kooky-outlaw:<container-path>
```

### Conversation history timing: count only assistant messages

`doppio_curate.py` polls `conversation_history` to detect when the LLM has responded.
The engine saves the **user message** to history before the LLM runs, which causes a false positive.
**Fix:** `db_count()` filters `WHERE role='assistant'` — only increments after the LLM responds.

---

## ⚠️ Known Issue: HEARTBEAT.md Parser Bug

The heartbeat system has a mismatch — `engine.py` uses `task.get('run', '')` and `task.get('purpose', '')` for the LLM prompt, but the parser only populates `instructions`. Result: heartbeat tasks fire with nearly empty prompts.

**Fix:** one-line change in `kooky-outlaw/src/kookyoutlaw/core/engine.py` — use `task.get('instructions', '')` instead of `task.get('run', '')`. Lives in the kooky-outlaw repo.

**For now:** use `doppio_curate.py` directly (via `docker exec`) — it fully controls the prompt.

---

## Phase 2 Roadmap

| Feature | What | Status |
|---------|------|--------|
| **Live content in /learn** | `fetchTodaysVideos()` replaces `content.json` in `Learn.tsx` | ✅ Done (Doppio2) |
| **d2_ table isolation** | Doppio2 uses `d2_*` tables — Doppio untouched | ✅ Done |
| **HEARTBEAT.md fix** | One-line engine.py fix to make scheduled runs reliable | ✅ Done |
| **doppio_curate.py pipeline** | 9 rows across all 3 levels, 100% reliable | ✅ Done (2026-03-07) |
| **Daily Vercel cron** | Trigger `docker exec kooky-outlaw python3 /app/doppio_curate.py` at 06:00 UTC | Planned |
| **`session_date` default** | Apply `004_session_date_default.sql` to add `DEFAULT CURRENT_DATE` | Planned |
| **Personalized coaching** | After card completion, user can ask bot a question (Qwen, zero API cost) | Planned |
| **Proactive follow-up** | Bot messages user on Telegram 24h after Doppio completion | Future |
