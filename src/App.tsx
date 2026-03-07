import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import Trial from './pages/Trial'
import Learn from './pages/Learn'
import Complete from './pages/Complete'
import Payment from './pages/Payment'
import VideoShare from './pages/VideoShare'
import Bookmarks from './pages/Bookmarks'
import Profile from './pages/Profile'
import DevLogin from './pages/DevLogin'
import AIFeed from './pages/AIFeed'
import { IOSInstallBanner } from './components/IOSInstallBanner'
import { AndroidInstallBanner } from './components/AndroidInstallBanner'
import { getOrCreateAnonUser } from './lib/auth'
import { syncFromSupabase } from './lib/progress'
import { usePageTracking } from './hooks/usePageTracking'

function AppRoutes() {
  usePageTracking()
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/trial" element={<Trial />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/complete" element={<Complete />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/video/:cardId" element={<VideoShare />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dev" element={<DevLogin />} />
        <Route path="/ai-feed" element={<AIFeed />} />
      </Routes>
      {/* PWA install banners — platform-detected, shown after 5s delay */}
      <IOSInstallBanner />
      <AndroidInstallBanner />
    </>
  )
}

function App() {
  // Initialize anonymous auth + background Supabase sync on mount
  useEffect(() => {
    void getOrCreateAnonUser()
    void syncFromSupabase()
  }, [])

  // Re-sync when user returns to the tab (e.g., after using a Try-it tool in a new tab)
  useEffect(() => {
    const handleFocus = () => { void syncFromSupabase() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  return (
    <BrowserRouter>
      <AppRoutes />
      <Analytics />
      <Toaster />
    </BrowserRouter>
  )
}

export default App
