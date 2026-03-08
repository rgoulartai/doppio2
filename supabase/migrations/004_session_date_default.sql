-- Add DEFAULT CURRENT_DATE to session_date so POST requests don't need to supply it
alter table public.d2_youtube_ai_videos
  alter column session_date set default current_date;
