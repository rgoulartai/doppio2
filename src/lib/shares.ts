// src/lib/shares.ts
// Supabase table required — run in SQL Editor:
//
//   CREATE TABLE IF NOT EXISTS shares (
//     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//     sender_email text NOT NULL,
//     recipient_email text NOT NULL,
//     card_id text NOT NULL,
//     created_at timestamptz DEFAULT now()
//   );
//   ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "Anyone can insert shares" ON shares FOR INSERT WITH CHECK (true);

import { supabase } from './supabase'
import { getLead } from './leads'

export function getShareUrl(cardId: string): string {
  const lead = getLead()
  const firstName = lead?.name?.split(' ')[0] ?? ''
  const base = `${window.location.origin}/video/${cardId}`
  return firstName ? `${base}?from=${encodeURIComponent(firstName)}` : base
}

export function buildMailtoLink(recipientEmail: string, cardId: string, cardTitle: string): string {
  const shareUrl = getShareUrl(cardId)
  const lead = getLead()
  const senderName = lead?.name?.split(' ')[0] ?? 'Someone'
  const subject = encodeURIComponent(`${senderName} shared an AI lesson with you`)
  const body = encodeURIComponent(
    `Hey!\n\n${senderName} thought you'd find this useful:\n\n"${cardTitle}"\n\nWatch it here: ${shareUrl}\n\nIt's free for 3 days — no credit card needed.\n\nEnjoy!\n`
  )
  return `mailto:${recipientEmail}?subject=${subject}&body=${body}`
}

export async function saveShare(recipientEmail: string, cardId: string): Promise<void> {
  const lead = getLead()
  await supabase.from('shares').insert({
    sender_email: lead?.email ?? 'anonymous',
    recipient_email: recipientEmail,
    card_id: cardId,
  })
}
