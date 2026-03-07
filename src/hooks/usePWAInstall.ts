// src/hooks/usePWAInstall.ts
import { useState, useEffect } from 'react'
import { track } from '../lib/analytics'

// iOS detection helpers
export const isIOS = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent)

export const isSafari = (): boolean =>
  /Safari/i.test(navigator.userAgent) &&
  !/CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent)

export const isStandalone = (): boolean =>
  'standalone' in navigator &&
  (navigator as Navigator & { standalone: boolean }).standalone === true

export const shouldShowIOSInstallPrompt = (): boolean =>
  isIOS() && isSafari() && !isStandalone()

// TypeScript interface for the non-standard BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useAndroidInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('doppio_install_dismissed') === 'true'

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (!dismissed) {
        // Delay 5 seconds — avoid showing on initial landing page load
        setTimeout(() => setShowBanner(true), 5000)
      }
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setShowBanner(false)
      void track('pwa_installed', { platform: 'android' })
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const triggerInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      void track('pwa_installed', { platform: 'android' })
    }
    setDeferredPrompt(null)
    setShowBanner(false)
  }

  const dismiss = () => {
    localStorage.setItem('doppio_install_dismissed', 'true')
    setShowBanner(false)
  }

  return { showBanner, triggerInstall, dismiss }
}
