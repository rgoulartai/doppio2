// src/components/IOSInstallBanner.tsx
import { useState } from 'react'
import { shouldShowIOSInstallPrompt } from '../hooks/usePWAInstall'

const DISMISSED_KEY = 'doppio_install_dismissed'

export function IOSInstallBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  )

  // Only render on iOS Safari, non-standalone, non-dismissed
  if (!shouldShowIOSInstallPrompt() || dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 text-white p-4 flex items-center gap-3 shadow-xl"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex-1">
        <p className="text-sm font-semibold">Install Doppio</p>
        <p className="text-xs text-gray-300 mt-0.5">
          Tap{' '}
          <span className="inline-block border border-gray-400 rounded px-1 text-xs font-medium">
            Share
          </span>{' '}
          then &ldquo;Add to Home Screen&rdquo;
        </p>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        className="text-gray-400 hover:text-white text-2xl leading-none p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        &times;
      </button>
    </div>
  )
}
