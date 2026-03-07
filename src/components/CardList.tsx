// src/components/CardList.tsx
import { VideoCard } from './VideoCard';
import { TryItButton } from './TryItButton';
import type { Level } from '../types/content';

interface CardListProps {
  level: Level;
  completedCards: Record<string, boolean>;
  onCardComplete: (card: 1 | 2 | 3) => void;
}

export function CardList({ level, completedCards, onCardComplete }: CardListProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-3 pt-6 pb-10 max-w-lg lg:max-w-5xl mx-auto w-full">
      {level.cards.map((card, i) => (
        <div key={card.id}>
          <div
            className="flex flex-col gap-2.5"
            style={{ animation: `slideFromRight 0.35s ease ${i * 0.07}s both` }}
          >
            <VideoCard
              card={card}
              isCompleted={completedCards[`card_${card.card}`] ?? false}
              onComplete={() => onCardComplete(card.card as 1 | 2 | 3)}
            />
            <TryItButton
              card={card}
              level={card.level as 1 | 2 | 3}
              cardIndex={card.card as 1 | 2 | 3}
            />
          </div>
          {/* Separator between cards — mobile only */}
          {i < level.cards.length - 1 && (
            <div className="lg:hidden mt-8 h-px bg-apple-divider" />
          )}
        </div>
      ))}
    </div>
  );
}
