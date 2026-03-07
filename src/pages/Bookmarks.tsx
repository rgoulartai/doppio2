import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VideoCard } from '../components/VideoCard'
import { TryItButton } from '../components/TryItButton'
import { getBookmarkedIds, toggleBookmark } from '../lib/bookmarks'
import { useProgress } from '../hooks/useProgress'
import contentData from '../data/content.json'
import type { DoppioContent } from '../types/content'

const content = contentData as DoppioContent
const allCards = content.levels.flatMap(level =>
  level.cards.map(card => ({ card, level }))
)

export default function Bookmarks() {
  const navigate = useNavigate()
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(getBookmarkedIds)
  const { progress, markComplete } = useProgress()

  const saved = allCards.filter(({ card }) => bookmarkedIds.includes(card.id))

  const handleRemove = (cardId: string) => {
    toggleBookmark(cardId)
    setBookmarkedIds(getBookmarkedIds())
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f7' }}>

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
          Saved Videos
        </h1>
        <span
          className="ml-auto text-[13px] font-medium"
          style={{ color: 'rgba(28,47,62,0.4)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {saved.length} {saved.length === 1 ? 'video' : 'videos'}
        </span>
      </div>

      {saved.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center pt-24 text-center px-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(232,114,42,0.1)' }}
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#e8722a" strokeWidth="2">
              <path d="M6 2a2 2 0 0 0-2 2v18l8-4 8 4V4a2 2 0 0 0-2-2H6z" />
            </svg>
          </div>
          <p
            className="text-[17px] font-bold mb-2"
            style={{ color: '#1c2f3e', fontFamily: "'Syne', sans-serif" }}
          >
            No saved videos yet
          </p>
          <p
            className="text-[14px] leading-relaxed"
            style={{ color: 'rgba(28,47,62,0.45)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Tap the bookmark icon on any video to save it here for later.
          </p>
          <button
            onClick={() => navigate('/learn')}
            className="btn-apple-primary mt-6"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Browse lessons
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5 px-3 pt-5 pb-8 max-w-lg mx-auto w-full">
          {saved.map(({ card, level }, i) => {
            const isCompleted = progress[`level_${card.level}`]?.[`card_${card.card}`] ?? false
            return (
              <div key={card.id} className="flex flex-col gap-2.5" style={{ animation: `slideFromRight 0.35s ease ${i * 0.07}s both` }}>
                {/* Level label */}
                <div className="flex items-center justify-between px-1">
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: 'rgba(28,47,62,0.45)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {level.emoji} Level {level.level} · {level.title}
                  </span>
                  <button
                    onClick={() => handleRemove(card.id)}
                    className="text-[12px] font-medium flex items-center gap-1"
                    style={{ color: 'rgba(232,114,42,0.7)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    aria-label="Remove bookmark"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 2a2 2 0 0 0-2 2v18l8-4 8 4V4a2 2 0 0 0-2-2H6z" />
                    </svg>
                    Remove
                  </button>
                </div>

                <VideoCard
                  card={card}
                  isCompleted={isCompleted}
                  onComplete={() => markComplete(card.level as 1|2|3, card.card as 1|2|3)}
                />
                <TryItButton
                  card={card}
                  level={card.level as 1|2|3}
                  cardIndex={card.card as 1|2|3}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
