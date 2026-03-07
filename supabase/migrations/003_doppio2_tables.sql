-- Doppio2 tables — same Supabase project (tqknjbjvdkipszyghfgj), d2_ prefix for isolation

-- d2_user_progress
create table public.d2_user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  level integer not null,
  card integer not null,
  completed_at timestamptz default now(),
  unique(user_id, level, card)
);
alter table public.d2_user_progress enable row level security;
create policy "Users own their d2 progress" on public.d2_user_progress
  for all using (auth.uid() = user_id);

-- d2_analytics_events
create table public.d2_analytics_events (
  id uuid default gen_random_uuid() primary key,
  event_name text not null,
  session_id text,
  properties jsonb default '{}',
  created_at timestamptz default now()
);
alter table public.d2_analytics_events enable row level security;
create policy "Anyone can insert d2 analytics" on public.d2_analytics_events
  for insert with check (true);

-- d2_youtube_ai_videos (enriched: adds video_id + ai_tool columns)
create table public.d2_youtube_ai_videos (
  id uuid default gen_random_uuid() primary key,
  session_date date not null,
  fetched_at timestamptz default now(),
  level integer not null check (level between 1 and 3),
  rank integer not null check (rank between 1 and 3),
  title text not null,
  channel text not null,
  url text not null,
  video_id text not null,
  reason text not null,
  ai_tool text default 'chatgpt'
);
alter table public.d2_youtube_ai_videos enable row level security;
create policy "Public read d2 ai videos" on public.d2_youtube_ai_videos
  for select using (true);
create index on public.d2_youtube_ai_videos (session_date);
create index on public.d2_youtube_ai_videos (session_date, level);
