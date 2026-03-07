import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchTodaysVideos, type AIVideo } from '../lib/youtube-ai-videos'

const LEVELS = [
  { level: 1 as const, emoji: '🌱', label: 'Beginner', subtitle: 'ChatGPT for everyday tasks' },
  { level: 2 as const, emoji: '⚡', label: 'Intermediate', subtitle: 'Delegate tasks to Claude' },
  { level: 3 as const, emoji: '🚀', label: 'Advanced', subtitle: 'Full AI workflows' },
]

export default function AIFeed() {
  const navigate = useNavigate()
  const [videos, setVideos] = useState<AIVideo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodaysVideos().then(data => {
      setVideos(data)
      setLoading(false)
    })
  }, [])

  const videosByLevel = (level: 1 | 2 | 3) => videos.filter(v => v.level === level)

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
          Today's AI Videos
        </h1>
        <span
          className="ml-auto text-[13px] font-medium"
          style={{ color: 'rgba(28,47,62,0.4)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center pt-24">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(0,113,227,0.3)', borderTopColor: '#0071e3' }}
          />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 text-center px-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(232,114,42,0.1)' }}
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#e8722a" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <p
            className="text-[17px] font-bold mb-2"
            style={{ color: '#1c2f3e', fontFamily: "'Syne', sans-serif" }}
          >
            Videos are being prepared
          </p>
          <p
            className="text-[14px] leading-relaxed"
            style={{ color: 'rgba(28,47,62,0.45)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Check back soon — our AI is curating today's best videos for you.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-3 pt-5 pb-10 max-w-lg mx-auto w-full">
          {LEVELS.map(({ level, emoji, label, subtitle }) => {
            const levelVideos = videosByLevel(level)
            if (levelVideos.length === 0) return null
            return (
              <div key={level}>
                {/* Level section header */}
                <div className="flex items-center gap-2 px-1 mb-3">
                  <span style={{ fontSize: 18 }}>{emoji}</span>
                  <div>
                    <span
                      className="text-[14px] font-bold"
                      style={{ color: '#1c2f3e', fontFamily: "'Syne', sans-serif" }}
                    >
                      Level {level} · {label}
                    </span>
                    <span
                      className="text-[12px] ml-2"
                      style={{ color: 'rgba(28,47,62,0.45)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {subtitle}
                    </span>
                  </div>
                </div>

                {/* Video cards */}
                <div className="flex flex-col gap-3">
                  {levelVideos.map((video, i) => (
                    <VideoCard key={video.id} video={video} index={i} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function VideoCard({ video, index }: { video: AIVideo; index: number }) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        border: '1px solid #e8ecee',
        animation: `slideFromRight 0.35s ease ${index * 0.07}s both`,
      }}
    >
      <div className="px-4 py-4 flex flex-col gap-2">
        {/* Rank + title row */}
        <div className="flex items-start gap-3">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
            style={{
              background: 'rgba(0,113,227,0.08)',
              color: '#0071e3',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {video.rank}
          </span>
          <p
            className="text-[15px] font-semibold leading-snug flex-1"
            style={{ color: '#1c2f3e', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {video.title}
          </p>
        </div>

        {/* Channel */}
        <p
          className="text-[12px] font-medium ml-9"
          style={{ color: 'rgba(28,47,62,0.45)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {video.channel}
        </p>

        {/* Reason */}
        <p
          className="text-[13px] leading-relaxed ml-9"
          style={{ color: 'rgba(28,47,62,0.6)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {video.reason}
        </p>

        {/* Watch link */}
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-9 flex items-center gap-1.5 text-[13px] font-semibold"
          style={{ color: '#0071e3', fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: 'none' }}
        >
          Watch on YouTube
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  )
}
