import type { VideoCard } from '../types/content'

export interface TryItResult {
  opened: boolean;
  copied: boolean;
  fallbackText?: string;
}

/**
 * Opens the AI tool in a new tab and copies the prompt to clipboard.
 * Always opens the URL. Copies prompt regardless of URL param support.
 * Never throws — all errors are caught and returned in the result.
 */
export async function openTryIt(card: VideoCard): Promise<TryItResult> {
  const result: TryItResult = { opened: false, copied: false }

  // 1. Open the AI tool URL in a new tab
  try {
    window.open(card.tryItUrl, '_blank', 'noopener,noreferrer')
    result.opened = true
  } catch (err) {
    console.warn('Failed to open AI tool URL', err)
  }

  // 2. Copy the prompt to clipboard (always — primary delivery mechanism)
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(card.tryItPrompt)
      result.copied = true
    } else {
      result.fallbackText = card.tryItPrompt
    }
  } catch (err) {
    console.warn('Clipboard write failed', err)
    result.fallbackText = card.tryItPrompt
  }

  return result
}

/**
 * Returns a human-readable name for the AI tool based on the card's aiTool field.
 */
export function getToolDisplayName(aiTool: string): string {
  const names: Record<string, string> = {
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    perplexity: 'Perplexity',
  }
  return names[aiTool.toLowerCase()] ?? aiTool
}
