import { useState } from 'react'
import toast from 'react-hot-toast'
import { openTryIt, getToolDisplayName } from '../lib/tryit'
import { track } from '../lib/analytics'
import type { VideoCard } from '../types/content'

interface TryItButtonProps {
  card: VideoCard;
  level: 1 | 2 | 3;
  cardIndex: 1 | 2 | 3;
  onTryIt?: () => void;
}

export function TryItButton({ card, level, cardIndex, onTryIt }: TryItButtonProps) {
  const [fallbackPrompt, setFallbackPrompt] = useState<string | null>(null)
  const toolName = getToolDisplayName(card.aiTool)

  const handleClick = async () => {
    void track('try_it_clicked', { level, card: cardIndex, aiTool: card.aiTool })

    const result = await openTryIt(card)

    if (result.copied) {
      toast.success(`Prompt copied — paste it in ${toolName}`, {
        duration: 4000,
        position: 'bottom-center',
        style: {
          background: '#1d1d1f',
          color: '#f5f5f7',
          borderRadius: '100px',
          fontSize: '14px',
          padding: '10px 20px',
        },
      })
      setFallbackPrompt(null)
    } else if (result.fallbackText) {
      setFallbackPrompt(result.fallbackText)
    }

    onTryIt?.()
  }

  return (
    <div className="space-y-2.5">
      <button
        onClick={() => { void handleClick() }}
        className="
          w-full py-2.5 min-h-[44px] px-4 rounded-pill
          bg-apple-surface border border-apple-border
          text-apple-blue text-[15px] font-semibold
          flex items-center justify-center gap-2
          active:scale-[0.97] transition-all duration-150
          hover:border-apple-blue hover:bg-blue-50/40
        "
        style={{ touchAction: 'manipulation' }}
        aria-label={`Try it in ${toolName}`}
      >
        <span>Try it in {toolName}</span>
        <span aria-hidden="true" className="text-[13px]">↗</span>
      </button>

      {fallbackPrompt && (
        <div className="rounded-2xl border border-apple-divider bg-apple-surface p-4">
          <p className="text-[12px] text-apple-secondary mb-1.5 font-medium uppercase tracking-wide">
            Copy &amp; paste in {toolName}
          </p>
          <p className="text-[14px] text-apple-text leading-relaxed select-all">
            {fallbackPrompt}
          </p>
        </div>
      )}
    </div>
  )
}
