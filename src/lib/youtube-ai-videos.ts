import { supabase } from './supabase'

export interface AIVideo {
  id: string
  session_date: string
  level: 1 | 2 | 3
  rank: number
  title: string
  channel: string
  url: string
  video_id: string
  reason: string
  ai_tool: string
  try_it_prompt: string
}

export async function fetchTodaysVideos(): Promise<AIVideo[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('d2_youtube_ai_videos')
    .select('*')
    .eq('session_date', today)
    .order('level', { ascending: true })
    .order('rank', { ascending: true })
  if (error || !data) return []
  return data as AIVideo[]
}
