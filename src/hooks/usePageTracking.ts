// src/hooks/usePageTracking.ts
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { track } from '../lib/analytics'

export function usePageTracking() {
  const location = useLocation()

  useEffect(() => {
    track('page_view', {
      path: location.pathname,
      referrer: document.referrer,
    })
  }, [location.pathname])
}
