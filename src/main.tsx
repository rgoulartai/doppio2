import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'lite-youtube-embed/src/lite-yt-embed.css'
import 'lite-youtube-embed/src/lite-yt-embed.js'
import { registerSW } from 'virtual:pwa-register'

registerSW({
  onRegistered(registration) {
    console.log('[SW] Registered', registration)
  },
  onRegisterError(error) {
    console.error('[SW] Registration failed', error)
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
