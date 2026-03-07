interface YouTubeEmbedProps {
  videoId: string;
  title: string;
}

export function YouTubeEmbed({ videoId, title }: YouTubeEmbedProps) {
  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
      <lite-youtube
        videoid={videoId}
        playlabel={`Play: ${title}`}
        params="mute=1&playsinline=1&rel=0"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
