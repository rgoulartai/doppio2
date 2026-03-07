import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveLead, getTrialStatus } from '../lib/leads'

export default function Trial() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const status = getTrialStatus()
    if (status === 'active') navigate('/learn', { replace: true })
    else if (status === 'expired') navigate('/payment', { replace: true })
  }, [navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSubmitting(true)
    saveLead(name.trim(), email.trim())
    setTimeout(() => navigate('/learn'), 420)
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
        <div className="trial-badge mb-7">
          <span className="trial-badge-dot" />
          3-Day Free Trial
        </div>

        <h1
          className="text-[clamp(1.9rem,7vw,2.75rem)] font-bold tracking-tight text-center leading-tight mb-3"
          style={{ color: '#1c2f3e', fontFamily: "'Syne', sans-serif" }}
        >
          Start your journey<br />to AI mastery
        </h1>

        <p
          className="text-[15px] text-center mb-8 max-w-xs leading-relaxed"
          style={{ color: 'rgba(28,47,62,0.5)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          We'll send you a reminder before your trial ends so you're never caught off guard.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoComplete="name"
            className="trial-input"
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="trial-input"
          />
          <button
            type="submit"
            disabled={submitting || !name.trim() || !email.trim()}
            className="btn-apple-primary mt-1"
            style={{
              opacity: submitting || !name.trim() || !email.trim() ? 0.55 : 1,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '0.03em',
            }}
          >
            {submitting ? 'Starting your trial…' : 'Start My Free Trial →'}
          </button>
        </form>

        <p
          className="mt-5 text-[12px] text-center"
          style={{ color: 'rgba(28,47,62,0.32)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          No credit card required &middot; Cancel anytime
        </p>

      </div>

      {/* Trial details strip */}
      <div
        className="mx-6 mb-10 rounded-2xl px-5 py-4"
        style={{ background: 'white', border: '1px solid #e8ecee' }}
      >
        <p
          className="text-[13px] font-semibold mb-2"
          style={{ color: '#1c2f3e', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          What's included in your trial
        </p>
        {[
          '9 AI skill lessons across 3 levels',
          'Progress saved across sessions',
          'Try-it prompts for real AI tools',
          'Email reminder before trial ends',
        ].map(item => (
          <div key={item} className="flex items-center gap-2 mt-1.5">
            <span style={{ color: '#e8722a', fontSize: 14 }}>✓</span>
            <span
              className="text-[13px]"
              style={{ color: 'rgba(28,47,62,0.6)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}
