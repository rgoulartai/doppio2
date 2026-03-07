-- Migration 001: Initial schema for Doppio
-- Created: Phase 1, Task 1.3

-- ===================================================
-- Table: user_progress
-- Stores one row per completed card per anonymous user
-- Max 9 rows per user (3 levels × 3 cards)
-- ===================================================
create table public.user_progress (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  level        smallint not null check (level between 1 and 3),
  card         smallint not null check (card between 1 and 3),
  completed_at timestamptz not null default now(),
  constraint unique_user_level_card unique (user_id, level, card)
);

-- Enable RLS
alter table public.user_progress enable row level security;

-- RLS Policies: users access only their own rows
create policy "Users can read own progress"
  on public.user_progress
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.user_progress
  for insert
  with check (auth.uid() = user_id);

create policy "Users can upsert own progress"
  on public.user_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ===================================================
-- Table: analytics_events
-- Custom event tracking (Supabase layer 2 analytics)
-- 7 tracked events: page_view, level_started, card_completed,
--   try_it_clicked, level_completed, badge_shared, pwa_installed
-- ===================================================
create table public.analytics_events (
  id          uuid default gen_random_uuid() primary key,
  event_name  text not null,
  session_id  uuid not null,
  properties  jsonb,
  created_at  timestamptz not null default now()
);
