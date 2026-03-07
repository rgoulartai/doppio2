// DEV ONLY — remove before production launch
import { useNavigate } from 'react-router-dom'
import { markAsPaid as _markAsPaid } from '../lib/leads'

export default function DevLogin() {
  const navigate = useNavigate()

  const activate = () => {
    localStorage.setItem('doppio_paid', 'true')
    localStorage.setItem('doppio_trial', JSON.stringify({
      name: 'Test User',
      email: 'test@doppio.com',
      trialStarted: Date.now(),
    }))
    navigate('/learn')
  }

  const reset = () => {
    localStorage.removeItem('doppio_paid')
    localStorage.removeItem('doppio_trial')
    localStorage.removeItem('doppio_bookmarks')
    navigate('/')
  }

  return (
    <div style={{ padding: 32, fontFamily: 'monospace' }}>
      <p style={{ marginBottom: 16, color: '#888' }}>🛠 Dev tools — not visible in prod</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={activate} style={{ padding: '10px 20px', background: '#e8722a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          → Activate paid user + go to /learn
        </button>
        <button onClick={reset} style={{ padding: '10px 20px', background: '#eee', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          Reset all localStorage
        </button>
      </div>
    </div>
  )
}
