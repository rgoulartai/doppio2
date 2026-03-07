import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getLead, isPaid } from '../lib/leads'
import { supabase } from '../lib/supabase'
import { loadMedals } from '../lib/progress'

// Set VITE_STRIPE_PORTAL_URL in .env + Vercel Dashboard
// Create it in: Stripe Dashboard → Billing → Customer Portal
const STRIPE_PORTAL_URL = import.meta.env.VITE_STRIPE_PORTAL_URL as string | undefined

export default function Profile() {
  const navigate = useNavigate()
  const lead = getLead()
  const paid = isPaid()

  const [name, setName] = useState(lead?.name ?? '')
  const [email, setEmail] = useState(lead?.email ?? '')
  const [saving, setSaving] = useState(false)
  const medals = loadMedals()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSaving(true)

    // Update localStorage
    const updated = { ...lead, name: name.trim(), email: email.trim(), trialStarted: lead?.trialStarted ?? Date.now() }
    localStorage.setItem('doppio_trial', JSON.stringify(updated))

    // Update Supabase leads row (best effort)
    if (lead?.email) {
      await supabase
        .from('leads')
        .update({ name: name.trim(), email: email.trim() })
        .eq('email', lead.email)
    }

    setSaving(false)
    toast.success('Saved!')
  }

  const handleReset = () => {
    if (!confirm('This will clear all your progress and sign you out. Continue?')) return
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f5f7' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-apple-divider sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: '#f5f5f7' }}
          aria-label="Go back"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1
          className="text-[17px] font-semibold tracking-tight"
          style={{ color: '#1c2f3e', fontFamily: "'Syne', sans-serif" }}
        >
          My Account
        </h1>
      </div>

      <div className="flex flex-col gap-4 px-4 py-5 max-w-lg mx-auto w-full">

        {/* Status badge */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: paid ? 'rgba(52,199,89,0.08)' : 'rgba(232,114,42,0.08)', border: `1px solid ${paid ? 'rgba(52,199,89,0.2)' : 'rgba(232,114,42,0.2)'}` }}
        >
          <span style={{ fontSize: 22 }}>{paid ? '✅' : '⏳'}</span>
          <div>
            <p className="text-[14px] font-semibold" style={{ color: '#1c2f3e', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {paid ? 'Paid member' : '3-day free trial'}
            </p>
            <p className="text-[12px]" style={{ color: 'rgba(28,47,62,0.5)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {paid ? 'Full access to all lessons' : 'Upgrade to keep access after trial'}
            </p>
          </div>
        </div>

        {/* Credentials */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8ecee' }}>
          <div className="px-4 pt-4 pb-1">
            <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(28,47,62,0.4)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Your details
            </p>
          </div>
          <form onSubmit={handleSave} className="px-4 pb-4 pt-3 flex flex-col gap-3">
            <div>
              <label className="text-[12px] font-medium mb-1 block" style={{ color: 'rgba(28,47,62,0.5)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="trial-input"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium mb-1 block" style={{ color: 'rgba(28,47,62,0.5)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="trial-input"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !name.trim() || !email.trim()}
              className="btn-apple-primary"
              style={{
                opacity: saving || !name.trim() || !email.trim() ? 0.55 : 1,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8ecee' }}>
          <div className="px-4 pt-4 pb-1">
            <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(28,47,62,0.4)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Payment
            </p>
          </div>
          <div className="px-4 pb-4 pt-3 flex flex-col gap-3">
            {paid ? (
              STRIPE_PORTAL_URL ? (
                <a
                  href={STRIPE_PORTAL_URL}
                  className="btn-apple-outline flex items-center justify-center gap-2"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: 'none' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Manage billing & subscription
                </a>
              ) : (
                <p className="text-[13px] text-center py-2" style={{ color: 'rgba(28,47,62,0.4)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Set VITE_STRIPE_PORTAL_URL to enable billing management
                </p>
              )
            ) : (
              <button
                onClick={() => navigate('/payment')}
                className="btn-apple-primary"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Upgrade to paid — $9.99/mo
              </button>
            )}
            <div className="flex items-center justify-center gap-1.5">
              <span style={{ fontSize: 12 }}>🔒</span>
              <span className="text-[11px]" style={{ color: 'rgba(28,47,62,0.3)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Secure payments by Stripe
              </span>
            </div>
          </div>
        </div>

        {/* Medal Collection */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8ecee' }}>
          <div className="px-4 pt-4 pb-1">
            <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(28,47,62,0.4)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Medal Collection
            </p>
          </div>
          <div className="px-4 pb-4 pt-3 grid grid-cols-3 gap-3">
            {([
              { tier: 'bronze', emoji: '🥉', label: 'Bronze', count: medals.bronze },
              { tier: 'silver', emoji: '🥈', label: 'Silver', count: medals.silver },
              { tier: 'gold',   emoji: '🏆', label: 'Gold',   count: medals.gold },
            ] as const).map(({ tier, emoji, label, count }) => (
              <div
                key={tier}
                className="flex flex-col items-center gap-1 py-3 rounded-2xl"
                style={{
                  background: count > 0 ? 'rgba(0,113,227,0.04)' : '#f5f5f7',
                  border: `1px solid ${count > 0 ? 'rgba(0,113,227,0.15)' : '#e8ecee'}`,
                }}
              >
                <span style={{ fontSize: 32, opacity: count > 0 ? 1 : 0.25 }}>{emoji}</span>
                <span
                  className="text-[20px] font-bold tabular-nums"
                  style={{ color: count > 0 ? '#1c2f3e' : 'rgba(28,47,62,0.25)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {count}
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: 'rgba(28,47,62,0.4)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
          {medals.bronze === 0 && medals.silver === 0 && medals.gold === 0 && (
            <p
              className="text-[13px] text-center pb-4 px-4"
              style={{ color: 'rgba(28,47,62,0.35)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Complete levels today to earn medals
            </p>
          )}
        </div>

        {/* AI Feed */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8ecee' }}>
          <div className="px-4 pt-4 pb-1">
            <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(28,47,62,0.4)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Daily AI Videos
            </p>
          </div>
          <div className="px-4 pb-4 pt-3">
            <button
              onClick={() => navigate('/ai-feed')}
              className="w-full py-2.5 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2"
              style={{
                background: 'rgba(0,113,227,0.06)',
                border: '1.5px solid rgba(0,113,227,0.2)',
                color: '#0071e3',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Today's AI Videos
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e8ecee' }}>
          <div className="px-4 pt-4 pb-1">
            <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(28,47,62,0.4)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Account
            </p>
          </div>
          <div className="px-4 pb-4 pt-3">
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-2xl text-[14px] font-semibold transition-colors"
              style={{
                border: '1.5px solid rgba(255,59,48,0.25)',
                color: 'rgba(255,59,48,0.8)',
                background: 'rgba(255,59,48,0.04)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Sign out & clear data
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
