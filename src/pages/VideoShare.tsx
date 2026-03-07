import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { YouTubeEmbed } from '../components/YouTubeEmbed'
import { TikTokEmbed } from '../components/TikTokEmbed'
import { getTrialStatus } from '../lib/leads'
import contentData from '../data/content.json'
import type { DoppioContent } from '../types/content'

const content = contentData as DoppioContent
const allCards = content.levels.flatMap(l => l.cards)

export default function VideoShare() {
  const { cardId } = useParams<{ cardId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const card = allCards.find(c => c.id === cardId)
  const sharedBy = searchParams.get('from') // sender's first name

  const trialStatus = getTrialStatus()
  const hasAccount = trialStatus !== 'none'

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f7' }}>
        <div className="text-center px-6">
          <p className="text-[17px] font-semibold" style={{ color: '#1c2f3e' }}>Video not found</p>
          <button onClick={() => navigate('/')} className="mt-4 text-[14px] underline" style={{ color: '#e8722a' }}>
            Go to Doppio
          </button>
        </div>
      </div>
    )
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

      {/* Attribution banner */}
      {sharedBy && (
        <div
          className="mx-4 mt-4 px-4 py-3 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(232,114,42,0.08)', border: '1px solid rgba(232,114,42,0.2)' }}
        >
          <span style={{ fontSize: 20 }}>✉️</span>
          <p
            className="text-[14px]"
            style={{ color: 'rgba(28,47,62,0.7)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <strong style={{ color: '#1c2f3e' }}>{sharedBy}</strong> thought you'd find this useful
          </p>
        </div>
      )}

      {/* Video */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-apple-card bg-white">
        {card.platform === 'youtube' ? (
          <YouTubeEmbed videoId={card.videoId} title={card.title} />
        ) : (
          <TikTokEmbed videoId={card.videoId} thumbnailUrl={card.thumbnailUrl ?? ''} title={card.title} />
        )}

        <div className="p-4">
          <h1
            className="text-[17px] font-bold leading-snug tracking-tight mb-1"
            style={{ color: '#1c2f3e', fontFamily: "'Syne', sans-serif" }}
          >
            {card.title}
          </h1>
          <p
            className="text-[14px] leading-relaxed"
            style={{ color: 'rgba(28,47,62,0.55)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {card.description}
          </p>

          {/* Creator credit */}
          {card.creator && (
            <div className="mt-3 pt-3 border-t border-apple-divider flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium tracking-widest uppercase text-apple-secondary mb-0.5">
                  Video by
                </p>
                {card.creatorUrl ? (
                  <a
                    href={card.creatorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] font-semibold"
                    style={{ color: '#1c2f3e' }}
                  >
                    {card.creator} ↗
                  </a>
                ) : (
                  <span className="text-[13px] font-semibold" style={{ color: '#1c2f3e' }}>{card.creator}</span>
                )}
              </div>
              <a
                href={`https://www.youtube.com/watch?v=${card.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-semibold px-3 py-1.5 rounded-pill"
                style={{ border: '1px solid #d2d2d7', color: '#1c2f3e', background: 'white' }}
              >
                ↺ Watch again
              </a>
            </div>
          )}
        </div>
      </div>

      {/* CTA — sign up prompt */}
      <div
        className="mx-4 mt-4 mb-10 rounded-2xl p-5 text-center"
        style={{ background: 'white', border: '1px solid #e8ecee' }}
      >
        {hasAccount ? (
          <>
            <p
              className="text-[16px] font-bold mb-1"
              style={{ color: '#1c2f3e', fontFamily: "'Syne', sans-serif" }}
            >
              Continue your journey
            </p>
            <p
              className="text-[14px] mb-4"
              style={{ color: 'rgba(28,47,62,0.5)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              You have {9} more lessons waiting for you.
            </p>
            <button
              onClick={() => navigate('/learn')}
              className="btn-apple-primary w-full"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Open Doppio →
            </button>
          </>
        ) : (
          <>
            <div
              className="inline-block px-3 py-1 rounded-pill text-[11px] font-semibold mb-3"
              style={{ background: 'rgba(232,114,42,0.1)', color: '#e8722a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              3-Day Free Trial
            </div>
            <p
              className="text-[17px] font-bold leading-tight mb-2"
              style={{ color: '#1c2f3e', fontFamily: "'Syne', sans-serif" }}
            >
              Like what you see?
            </p>
            <p
              className="text-[14px] mb-5"
              style={{ color: 'rgba(28,47,62,0.5)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Get access to all 9 AI lessons — free for 3 days, no credit card needed.
            </p>
            <button
              onClick={() => navigate('/trial')}
              className="btn-apple-primary w-full"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Start My Free Trial →
            </button>
            <p
              className="mt-3 text-[12px]"
              style={{ color: 'rgba(28,47,62,0.3)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              No credit card · Cancel anytime
            </p>
          </>
        )}
      </div>

    </div>
  )
}
