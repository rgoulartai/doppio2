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

alter table public.youtube_ai_videos enable row level security;

create policy "Public can read youtube_ai_videos"
  on public.youtube_ai_videos for select
  using (true);
