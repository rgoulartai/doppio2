// src/components/ProgressBar.tsx — Duolingo-style dot indicators
interface ProgressBarProps {
  completedCards: number;
  totalCards?: number;
  className?: string;
}

export function ProgressBar({
  completedCards,
  totalCards = 3,
  className = '',
}: ProgressBarProps) {
  const remaining = totalCards - completedCards;

  const label =
    completedCards === totalCards
      ? 'Level complete ✓'
      : remaining === 1
      ? '1 card left'
      : `${remaining} cards left`;

  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      role="progressbar"
      aria-valuenow={completedCards}
      aria-valuemin={0}
      aria-valuemax={totalCards}
      aria-label={`${completedCards} of ${totalCards} cards completed`}
    >
      {/* Dots */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalCards }, (_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full transition-all duration-400"
            style={{
              backgroundColor: i < completedCards ? '#e8722a' : '#e8ecee',
              transform: i < completedCards ? 'scale(1.15)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Label */}
      <span
        className="text-[12px] font-medium tabular-nums"
        style={{ color: completedCards === totalCards ? '#e8722a' : '#5a7080' }}
      >
        {label}
      </span>
    </div>
  );
}
