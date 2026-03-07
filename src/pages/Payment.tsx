import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getLead, markAsPaid } from '../lib/leads'

// Set VITE_STRIPE_PAYMENT_URL in .env and Vercel Dashboard
const STRIPE_URL = import.meta.env.VITE_STRIPE_PAYMENT_URL as string | undefined

export default function Payment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const lead = getLead()

  // Stripe redirects to /payment?success=true after successful payment
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      markAsPaid()
      navigate('/learn', { replace: true })
    }
  }, [searchParams, navigate])

  const handleUpgrade = () => {
    if (STRIPE_URL) {
      window.location.href = STRIPE_URL
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f5f7' }}>

      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-apple-divider bg-white">
        <img src="/kooky-logo.png" alt="KOOKY" className="w-6 h-6 rounded-full" />
        <span
          className="text-[17px] font-semibold tracking-tight"
          style={{ color: '#1c2f3e', fontFamily: "'Syne', sans-serif" }}
        >
          Doppio
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill mb-7 text-[12px] font-semibold tracking-wide"
          style={{
            background: 'rgba(232,114,42,0.08)',
            border: '1px solid rgba(232,114,42,0.25)',
            color: '#e8722a',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Trial ended
        </div>

        <h1
          className="text-[clamp(1.9rem,7vw,2.75rem)] font-bold tracking-tight text-center leading-tight mb-3"
          style={{ color: '#1c2f3e', fontFamily: "'Syne', sans-serif" }}
        >
          {lead?.name ? `Keep going, ${lead.name.split(' ')[0]}.` : 'Keep going.'}
        </h1>

        <p
          className="text-[15px] text-center mb-8 max-w-xs leading-relaxed"
          style={{ color: 'rgba(28,47,62,0.5)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Unlock full access and continue building your AI skills every day.
        </p>

        {/* Price card */}
        <div
          className="w-full max-w-sm rounded-2xl p-6 mb-6"
          style={{ background: 'white', border: '1px solid #e8ecee' }}
        >
          <div className="flex items-end gap-1 mb-1">
            <span
              className="text-[2.5rem] font-bold tracking-tight leading-none"
              style={{ color: '#1c2f3e', fontFamily: "'Syne', sans-serif" }}
            >
              $9
            </span>
            <span
              className="text-[1rem] mb-1"
              style={{ color: 'rgba(28,47,62,0.4)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              .99 / month
            </span>
          </div>
          <p
            className="text-[13px] mb-5"
            style={{ color: 'rgba(28,47,62,0.4)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Billed monthly · Cancel anytime
          </p>

          {[
            '9 AI skill lessons across 3 levels',
            'New lessons added monthly',
            'Progress saved across all devices',
            'Try-it prompts for ChatGPT, Claude & more',
            'Priority email support',
          ].map(item => (
            <div key={item} className="flex items-start gap-2.5 mt-2.5">
              <span style={{ color: '#e8722a', fontSize: 15, lineHeight: '1.4', flexShrink: 0 }}>✓</span>
              <span
                className="text-[14px] leading-snug"
                style={{ color: 'rgba(28,47,62,0.7)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {STRIPE_URL ? (
          <button
            onClick={handleUpgrade}
            className="btn-apple-primary w-full max-w-sm"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.03em' }}
          >
            Upgrade Now →
          </button>
        ) : (
          <div
            className="w-full max-w-sm text-center py-4 rounded-2xl text-[13px]"
            style={{
              background: 'rgba(232,114,42,0.06)',
              border: '1px dashed rgba(232,114,42,0.3)',
              color: 'rgba(28,47,62,0.4)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Payment coming soon — set VITE_STRIPE_PAYMENT_URL
          </div>
        )}

        {/* Trust signals */}
        <div className="flex items-center gap-2 mt-4">
          <span style={{ color: 'rgba(28,47,62,0.3)', fontSize: 13 }}>🔒</span>
          <span
            className="text-[12px]"
            style={{ color: 'rgba(28,47,62,0.32)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Secure payment by Stripe
          </span>
        </div>

        <button
          onClick={() => navigate('/learn')}
          className="mt-6 text-[13px] underline underline-offset-2"
          style={{ color: 'rgba(28,47,62,0.35)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Continue with limited access
        </button>

      </div>
    </div>
  )
}
