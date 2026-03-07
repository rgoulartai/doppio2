// src/lib/analytics.ts
import { supabase } from './supabase'

const SESSION_KEY = 'doppio_session_id'

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export async function track(
  eventName: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      session_id: getSessionId(),
      properties,
    })
  } catch {
    // Silent fail — analytics must never throw or affect user experience
  }
}
