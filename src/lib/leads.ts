// src/lib/leads.ts
// Supabase table required — run in SQL Editor:
//
//   CREATE TABLE IF NOT EXISTS leads (
//     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//     name text NOT NULL,
//     email text NOT NULL,
//     created_at timestamptz DEFAULT now()
//   );
//   ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "Anyone can insert leads" ON leads FOR INSERT WITH CHECK (true);

import { supabase } from './supabase'

const TRIAL_KEY = 'doppio_trial'
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export interface Lead {
  name: string
  email: string
  trialStarted: number
}

export function saveLead(name: string, email: string): void {
  const lead: Lead = { name, email, trialStarted: Date.now() }
  localStorage.setItem(TRIAL_KEY, JSON.stringify(lead))
  // Fire and forget — non-blocking Supabase write
  void supabase.from('leads').insert({ name, email })
}

export function getTrialStatus(): 'none' | 'active' | 'expired' {
  const raw = localStorage.getItem(TRIAL_KEY)
  if (!raw) return 'none'
  try {
    const lead: Lead = JSON.parse(raw)
    if (Date.now() - lead.trialStarted > THREE_DAYS_MS) return 'expired'
    return 'active'
  } catch {
    return 'none'
  }
}

export function isPaid(): boolean {
  return localStorage.getItem('doppio_paid') === 'true'
}

export function markAsPaid(): void {
  localStorage.setItem('doppio_paid', 'true')
}

export function getLead(): Lead | null {
  const raw = localStorage.getItem(TRIAL_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Lead
  } catch {
    return null
  }
}
