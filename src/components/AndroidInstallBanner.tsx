// src/components/AndroidInstallBanner.tsx
import { useAndroidInstallPrompt } from '../hooks/usePWAInstall'

export function AndroidInstallBanner() {
  const { showBanner, triggerInstall, dismiss } = useAndroidInstallPrompt()

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 text-white p-4 flex items-center gap-3 shadow-xl">
      <div className="flex-1">
        <p className="text-sm font-semibold">Add Doppio to your home screen</p>
        <p className="text-xs text-gray-400 mt-0.5">Works offline, opens instantly</p>
      </div>
      <button
        onClick={triggerInstall}
        className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg min-h-[44px] touch-manipulation"
      >
        Install
      </button>
      <button
        onClick={dismiss}
        className="text-gray-400 hover:text-white text-sm p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        Not now
      </button>
    </div>
  )
}
