import { useState } from 'react'

interface TikTokEmbedProps {
  videoId: string;
  thumbnailUrl: string;
  title: string;
}

export function TikTokEmbed({ videoId, thumbnailUrl, title }: TikTokEmbedProps) {
  const [isActivated, setIsActivated] = useState(false)

  if (isActivated) {
    return (
      <div
        className="w-full max-w-[325px] mx-auto rounded-lg overflow-hidden"
        style={{ aspectRatio: '9/16' }}
      >
        <iframe
          src={`https://www.tiktok.com/embed/v2/${videoId}`}
          className="w-full h-full"
          frameBorder="0"
          allowFullScreen
          allow="encrypted-media"
          title={title}
        />
      </div>
    )
  }

  return (
    <div
      className="relative w-full max-w-[325px] mx-auto cursor-pointer rounded-lg overflow-hidden bg-black"
      style={{ aspectRatio: '9/16' }}
      onClick={() => setIsActivated(true)}
      role="button"
      aria-label={`Play: ${title}`}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setIsActivated(true)}
    >
      <img
        src={thumbnailUrl}
        alt={title}
        loading="lazy"
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none'
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
          <svg
            className="w-8 h-8 text-white ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  )
}
