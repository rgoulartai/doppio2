import { useEffect, useRef, useState } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { YouTubeEmbed } from './YouTubeEmbed'
import { TikTokEmbed } from './TikTokEmbed'
import { ShareModal } from './ShareModal'
import { isPaid } from '../lib/leads'
import { isBookmarked, toggleBookmark } from '../lib/bookmarks'
import type { VideoCard as VideoCardType } from '../types/content'

interface VideoCardProps {
  card: VideoCardType;
  isCompleted: boolean;
  onComplete: () => void;
}

export function VideoCard({ card, isCompleted, onComplete }: VideoCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(card.id))
  const [showShare, setShowShare] = useState(false)
  const isOnline = useOnlineStatus()
  const userIsPaid = isPaid()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="card-apple"
    >
      {/* Video area */}
      <div className="relative">
        {!isVisible ? (
          <div className="w-full aspect-video bg-apple-divider animate-pulse rounded-t-2xl" />
        ) : !isOnline ? (
          <div className="w-full aspect-video bg-apple-bg rounded-t-2xl flex flex-col items-center justify-center gap-2 text-apple-secondary">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M3.636 5.636a9 9 0 0112.728 0"
              />
            </svg>
            <span className="text-[13px] font-medium">Connect to watch</span>
          </div>
        ) : card.platform === 'youtube' ? (
          <YouTubeEmbed videoId={card.videoId} title={card.title} />
        ) : (
          <TikTokEmbed
            videoId={card.videoId}
            thumbnailUrl={card.thumbnailUrl ?? ''}
            title={card.title}
          />
        )}

        {/* Completion overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${isCompleted ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden={!isCompleted}
        >
          <div className="w-14 h-14 bg-apple-green rounded-full flex items-center justify-center shadow-lg">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-apple-text text-[15px] leading-snug tracking-tight">
          {card.title}
        </h3>

        <button
          onClick={onComplete}
          disabled={isCompleted}
          className={`
            w-full py-2.5 min-h-[44px] rounded-pill text-[15px] font-semibold
            transition-all duration-150 active:scale-[0.97]
            ${isCompleted
              ? 'bg-apple-green-bg text-apple-green border border-apple-green/30 cursor-default'
              : 'bg-apple-blue text-white shadow-apple-btn hover:bg-apple-blue-hover'}
          `}
          style={{ touchAction: 'manipulation' }}
          aria-label={isCompleted ? 'Card completed' : `Mark "${card.title}" as done`}
        >
          {isCompleted ? '✓ Done' : 'Mark as done'}
        </button>
      </div>

      {/* Paid user actions — bookmark + share */}
      {userIsPaid && (
        <div className="px-4 pb-3 flex gap-2 border-t border-apple-divider pt-3">
          <button
            onClick={() => setBookmarked(toggleBookmark(card.id))}
            className="paid-action-btn flex-1"
            aria-label={bookmarked ? 'Remove bookmark' : 'Save for later'}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M6 2a2 2 0 0 0-2 2v18l8-4 8 4V4a2 2 0 0 0-2-2H6z" />
            </svg>
            <span>{bookmarked ? 'Saved' : 'Save for later'}</span>
          </button>
          <button
            onClick={() => setShowShare(true)}
            className="paid-action-btn flex-1"
            aria-label="Share this video"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            <span>Share</span>
          </button>
        </div>
      )}

      {/* Share modal */}
      {showShare && <ShareModal card={card} onClose={() => setShowShare(false)} />}

      {/* Credits panel — shown after completion */}
      {isCompleted && (
        <div className="video-credits-panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium tracking-widest uppercase text-apple-secondary mb-0.5">
                Original creator
              </p>
              {card.creatorUrl ? (
                <a
                  href={card.creatorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] font-semibold text-apple-text hover:text-apple-orange transition-colors"
                  title={`View ${card.creator ?? 'creator'}'s channel`}
                >
                  {card.creator ?? 'Unknown'}
                </a>
              ) : (
                <span className="text-[14px] font-semibold text-apple-text">
                  {card.creator ?? 'Unknown'}
                </span>
              )}
            </div>
            <a
              href={
                card.platform === 'youtube'
                  ? `https://www.youtube.com/watch?v=${card.videoId}`
                  : `https://www.tiktok.com/video/${card.videoId}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-[13px] font-semibold transition-colors"
              style={{
                border: '1px solid #d2d2d7',
                color: '#1c2f3e',
                background: 'white',
              }}
            >
              ↺ Watch again
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
