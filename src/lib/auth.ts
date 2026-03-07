// src/lib/auth.ts
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

// Module-level cache — once resolved, never re-fetched within the session
let cachedUser: User | null = null

export async function getOrCreateAnonUser(): Promise<User | null> {
  // Return cached result immediately (module-level cache survives re-renders)
  if (cachedUser) return cachedUser

  try {
    // Step 1: Check for existing session (restored from localStorage by the Supabase client)
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      cachedUser = session.user
      return cachedUser
    }

    // Step 2: No session — create anonymous user (called at most once ever)
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error

    cachedUser = data.user
    return cachedUser
  } catch (err) {
    // Auth failed — return null, app continues in localStorage-only mode
    console.warn('[Doppio] Supabase auth failed, continuing in offline mode', err)
    return null
  }
}
