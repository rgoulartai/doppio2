// src/components/LevelNav.tsx
import content from '../data/content.json';
import { track } from '../lib/analytics';

interface LevelNavProps {
  activeLevel: 1 | 2 | 3;
  completedCounts: Record<1 | 2 | 3, number>;
  onSelectLevel: (level: 1 | 2 | 3) => void;
}

export function LevelNav({ activeLevel, completedCounts, onSelectLevel }: LevelNavProps) {
  return (
    <div className="flex bg-apple-surface border-b border-apple-divider">
      {content.levels.map((lvl) => {
        const level = lvl.level as 1 | 2 | 3;
        const isActive = level === activeLevel;
        const isFullyComplete = completedCounts[level] === 3;
        return (
          <button
            key={level}
            onClick={() => { void track('level_started', { level }); onSelectLevel(level); }}
            className={`
              flex-1 py-3 min-h-[44px] text-[13px] font-medium
              flex items-center justify-center gap-1.5
              transition-colors duration-150 relative
              ${isActive
                ? 'text-apple-blue'
                : 'text-apple-secondary hover:text-apple-text'}
            `}
            style={{ touchAction: 'manipulation' }}
            aria-selected={isActive}
            role="tab"
          >
            <span>{lvl.emoji}</span>
            <span className="tracking-tight">{lvl.title}</span>
            {isFullyComplete && (
              <span className="text-apple-green text-[11px] font-semibold ml-0.5">✓</span>
            )}
            {/* Active underline */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-apple-blue rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
