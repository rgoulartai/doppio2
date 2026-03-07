import { useSearchParams, useNavigate } from 'react-router-dom'
import { HeroVideo } from '../components/HeroVideo'
import { track } from '../lib/analytics'

export default function Landing() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isBadgeRef = searchParams.get('ref') === 'badge'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>

      {/* Badge referral banner */}
      {isBadgeRef && (
        <div
          data-testid="badge-banner"
          className="w-full text-[13px] font-medium py-2.5 px-4 text-center"
          style={{
            backgroundColor: 'rgba(232,114,42,0.15)',
            borderBottom: '1px solid rgba(232,114,42,0.2)',
            color: '#e8a570',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          🎉 Someone completed Doppio and became an AI Manager! Start your journey →
        </div>
      )}

      {/* Hero */}
      <HeroVideo />

      {/* CTA section */}
      <div className="flex flex-col items-center px-6 py-10 text-center stagger-1">
        <button
          onClick={() => { void track('level_started', { level: 1 }); navigate('/trial'); }}
          className="landing-cta-btn"
          style={{ touchAction: 'manipulation' }}
        >
          START NOW
        </button>

        <p className="mt-4 text-[14px] leading-relaxed" style={{ color: 'rgba(28,47,62,0.5)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Handpicked lessons &middot; 3 levels &middot; No coding
        </p>
        <p className="mt-1 text-[13px]" style={{ color: 'rgba(28,47,62,0.38)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Pick your track → Learn by watching AI work
        </p>
      </div>

      {/* Built by */}
      <div className="flex justify-center pb-10 stagger-2">
        <div className="flex items-center gap-2">
          <img src="/kooky-logo.png" alt="KOOKY AI Exchange" className="w-5 h-5 rounded-full" />
          <span
            className="text-[12px] font-medium tracking-tight"
            style={{ color: 'rgba(28,47,62,0.7)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Built by KOOKY AI Exchange
          </span>
        </div>
      </div>

    </div>
  )
}
