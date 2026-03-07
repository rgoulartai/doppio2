import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getShareUrl, buildMailtoLink, saveShare } from '../lib/shares'
import type { VideoCard } from '../types/content'

interface ShareModalProps {
  card: VideoCard
  onClose: () => void
}

export function ShareModal({ card, onClose }: ShareModalProps) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const shareUrl = getShareUrl(card.id)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)

    // Save share to Supabase (non-blocking)
    void saveShare(email.trim(), card.id)

    // Open mailto — opens user's email client with pre-filled content
    const mailto = buildMailtoLink(email.trim(), card.id, card.title)
    window.location.href = mailto

    await new Promise(r => setTimeout(r, 600))
    toast.success('Opening your email app…')
    setSending(false)
    onClose()
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied!')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 share-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Share this video"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#d2d2d7' }} />
        </div>

        <div className="px-5 pb-8 pt-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2
                className="text-[18px] font-bold tracking-tight"
                style={{ color: '#1c2f3e', fontFamily: "'Syne', sans-serif" }}
              >
                Share this lesson
              </h2>
              <p
                className="text-[13px] mt-0.5"
                style={{ color: 'rgba(28,47,62,0.5)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {card.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: '#f0f0f2', color: '#5a7080' }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Email form */}
          <form onSubmit={handleSend} className="flex flex-col gap-3">
            <label
              className="text-[12px] font-semibold uppercase tracking-wider"
              style={{ color: 'rgba(28,47,62,0.45)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Friend's email
            </label>
            <input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="trial-input"
            />
            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="btn-apple-primary"
              style={{
                opacity: sending || !email.trim() ? 0.55 : 1,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {sending ? 'Opening email…' : 'Send via Email →'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ backgroundColor: '#e8ecee' }} />
            <span className="text-[12px]" style={{ color: 'rgba(28,47,62,0.35)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#e8ecee' }} />
          </div>

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="w-full py-3 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors"
            style={{
              background: 'white',
              border: '1.5px solid #d2d2d7',
              color: '#1c2f3e',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy link
          </button>

          <p
            className="text-[11px] text-center mt-3"
            style={{ color: 'rgba(28,47,62,0.28)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Your friend gets a 3-day free trial when they click your link
          </p>
        </div>
      </div>
    </>
  )
}
