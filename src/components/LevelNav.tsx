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
    <div className="bg-apple-surface border-b border-apple-divider px-4 py-3">
      <div className="max-w-lg lg:max-w-5xl mx-auto">
        <div className="bg-apple-bg rounded-2xl p-1 flex gap-1">
          {content.levels.map((lvl) => {
            const level = lvl.level as 1 | 2 | 3;
            const isActive = level === activeLevel;
            const completed = completedCounts[level];
            const isFullyComplete = completed === 3;
            return (
              <button
                key={level}
                onClick={() => { void track('level_started', { level }); onSelectLevel(level); }}
                className={`
                  flex-1 rounded-xl py-2.5 px-2 min-h-[56px]
                  flex flex-col items-center justify-center gap-1
                  transition-all duration-200
                  ${isActive
                    ? 'bg-white shadow-apple-card'
                    : 'hover:bg-white/60'}
                `}
                style={{ touchAction: 'manipulation' }}
                aria-selected={isActive}
                role="tab"
              >
                <span className="text-[18px] leading-none">{lvl.emoji}</span>
                <span className={`text-[12px] font-semibold tracking-tight leading-none ${isActive ? 'text-apple-text' : 'text-apple-secondary'}`}>
                  {lvl.title}
                </span>
                {/* Progress dots */}
                <div className="flex gap-[3px] mt-0.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-[5px] h-[5px] rounded-full transition-colors duration-300 ${
                        i <= completed
                          ? isFullyComplete ? 'bg-apple-green' : 'bg-apple-blue'
                          : 'bg-apple-border'
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
