-- Add try_it_prompt column to d2_youtube_ai_videos
alter table public.d2_youtube_ai_videos
  add column if not exists try_it_prompt text not null default '';
