// src/components/LevelHeader.tsx
import { Link } from 'react-router-dom';
import { isPaid } from '../lib/leads';
import { getBookmarkedIds } from '../lib/bookmarks';
import type { MedalTier } from '../lib/progress';

const MEDAL_EMOJI: Record<NonNullable<MedalTier>, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🏆',
};

interface LevelHeaderProps {
  totalCompleted: number;
  todayMedalTier: MedalTier;
}

export function LevelHeader({ totalCompleted, todayMedalTier }: LevelHeaderProps) {
  const paid = isPaid();
  const bookmarkCount = paid ? getBookmarkedIds().length : 0;

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-apple-surface border-b border-apple-divider">
      <Link
        to="/"
        className="flex items-center gap-2"
        aria-label="Doppio home"
      >
        <img
          src="/kooky-logo.png"
          alt="KOOKY AI Exchange"
          className="w-6 h-6 rounded-full"
        />
        <span className="text-[17px] font-semibold tracking-tight text-apple-text">
          Doppio
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {/* Today's medal badge */}
        {todayMedalTier && (
          <span
            className="text-[22px] leading-none"
            title={`${todayMedalTier.charAt(0).toUpperCase() + todayMedalTier.slice(1)} medal earned today`}
            aria-label={`${todayMedalTier} medal earned today`}
          >
            {MEDAL_EMOJI[todayMedalTier]}
          </span>
        )}

        <span className="text-[13px] text-apple-secondary font-medium tabular-nums">
          {totalCompleted} of 9
        </span>

        {paid && (
          <Link
            to="/bookmarks"
            className="relative w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-apple-divider"
            aria-label={`Saved videos${bookmarkCount > 0 ? ` (${bookmarkCount})` : ''}`}
          >
            <svg className="w-5 h-5 text-apple-text" viewBox="0 0 24 24" fill={bookmarkCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M6 2a2 2 0 0 0-2 2v18l8-4 8 4V4a2 2 0 0 0-2-2H6z" />
            </svg>
            {bookmarkCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ background: '#e8722a' }}
              >
                {bookmarkCount}
              </span>
            )}
          </Link>
        )}

        <Link
          to="/profile"
          className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-apple-divider"
          aria-label="My account"
        >
          <svg className="w-5 h-5 text-apple-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
