import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { track } from '../lib/analytics';
import { ResourceLinks } from '../components/ResourceLinks';

const SHARE_URL = 'https://doppio.kookyos.com/?ref=badge';
const SHARE_TEXT = "I'm now an AI Manager! I just completed Doppio — the Duolingo of AI. Start your daily AI practice:";

const SHARE_OPTIONS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    href: () => `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${SHARE_URL}`)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    id: 'twitter',
    label: 'Twitter / X',
    color: '#000000',
    href: () => `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.26 5.632 5.904-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: '#0A66C2',
    href: () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    id: 'email',
    label: 'Email',
    color: '#6B7280',
    href: () => `mailto:?subject=${encodeURIComponent('Check out Doppio — AI in 20 minutes')}&body=${encodeURIComponent(`${SHARE_TEXT}\n\n${SHARE_URL}`)}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
] as const;

export default function Complete() {
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
      });
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    void track('level_completed', { level: 3 });
  }, []);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(SHARE_URL).catch(() => {});
    toast.success('Link copied!', {
      position: 'bottom-center',
      style: { background: '#1d1d1f', color: '#f5f5f7', borderRadius: '100px', fontSize: '14px', padding: '10px 20px' },
    });
    void track('badge_shared', { method: 'copy' });
  };

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      <div className="flex flex-col items-center px-6 pt-16 pb-12">

        <div className="w-full max-w-sm flex items-center justify-between mb-12">
          <Link to="/" className="font-bold text-lg tracking-tight text-gray-900">
            Doppio
          </Link>
        </div>

        <div className="text-8xl mb-6 animate-bounce" role="img" aria-label="Trophy">
          🏆
        </div>

        <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
          You're an AI Manager! 🎉
        </h1>

        <p className="text-lg text-gray-500 text-center mb-10 max-w-xs">
          You just transformed how you work. Forever.
        </p>

        {/* Share badge button */}
        <button
          onClick={() => setShowShare(true)}
          className="w-full max-w-sm bg-blue-600 text-white text-lg font-semibold
            py-4 rounded-2xl mb-4 active:scale-95 transition-transform"
          style={{ touchAction: 'manipulation' }}
        >
          Share My Badge
        </button>

        {/* Back to app — prominent secondary button */}
        <Link
          to="/learn"
          className="w-full max-w-sm flex items-center justify-center gap-2 py-4 rounded-2xl
            text-[16px] font-semibold mb-6 transition-colors"
          style={{
            background: '#f5f5f7',
            color: '#1c2f3e',
            border: '1.5px solid #e8ecee',
          }}
        >
          ← Back to the app
        </Link>

        <ResourceLinks />

      </div>

      <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />

      {/* Share bottom sheet */}
      {showShare && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={() => setShowShare(false)}
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-xl"
            style={{ animation: 'fadeUp 0.25s ease both' }}
            role="dialog"
            aria-modal="true"
            aria-label="Share your badge"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#d2d2d7' }} />
            </div>

            <div className="px-5 pb-8 pt-3">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold tracking-tight" style={{ color: '#1c2f3e', fontFamily: "'Syne', sans-serif" }}>
                  Share your badge
                </h2>
                <button
                  onClick={() => setShowShare(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[15px]"
                  style={{ background: '#f0f0f2', color: '#5a7080' }}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Platform buttons */}
              <div className="flex flex-col gap-3">
                {SHARE_OPTIONS.map((opt) => (
                  <a
                    key={opt.id}
                    href={opt.href()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => void track('badge_shared', { method: opt.id })}
                    className="flex items-center gap-3 py-3.5 px-4 rounded-2xl transition-opacity active:opacity-70"
                    style={{ background: opt.color + '12', border: `1.5px solid ${opt.color}30`, color: opt.color }}
                  >
                    {opt.icon}
                    <span className="text-[15px] font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Share on {opt.label}
                    </span>
                  </a>
                ))}

                {/* Copy link */}
                <button
                  onClick={() => { void handleCopyLink(); setShowShare(false); }}
                  className="flex items-center gap-3 py-3.5 px-4 rounded-2xl transition-opacity active:opacity-70"
                  style={{ background: '#f5f5f7', border: '1.5px solid #e8ecee', color: '#1c2f3e' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span className="text-[15px] font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Copy link
                  </span>
                </button>
              </div>

              <p
                className="text-[11px] text-center mt-4"
                style={{ color: 'rgba(28,47,62,0.3)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Friends who click your link get a free trial
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
