// src/pages/Learn.tsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import content from '../data/content.json';
import { useProgress } from '../hooks/useProgress';
import { getMedalTier, medalRank, type ProgressState, type MedalTier } from '../lib/progress';
import type { Level } from '../types/content';
import { LevelHeader } from '../components/LevelHeader';
import { LevelNav } from '../components/LevelNav';
import { CardList } from '../components/CardList';
import { ProgressBar } from '../components/ProgressBar';
import { LevelCompleteScreen } from '../components/LevelCompleteScreen';

export default function Learn() {
  const [searchParams] = useSearchParams();
  const {
    progress,
    markComplete,
    totalCompleted,
    todayMedalTier,
    awardMedal,
    awardedMedalTier,
  } = useProgress();

  const getInitialLevel = (): 1 | 2 | 3 => {
    const param = searchParams.get('level');
    if (param === '1' || param === '2' || param === '3') {
      return parseInt(param) as 1 | 2 | 3;
    }
    // First incomplete level
    for (const n of [1, 2, 3] as const) {
      const levelKey = `level_${n}` as keyof ProgressState;
      const allDone = Object.values(progress[levelKey]).every(Boolean);
      if (!allDone) return n;
    }
    return 3;
  };

  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(getInitialLevel);
  const [showLevelComplete, setShowLevelComplete] = useState<{ level: 1 | 2 | 3; medal: MedalTier } | null>(null);

  const completedCounts: Record<1 | 2 | 3, number> = {
    1: Object.values(progress.level_1).filter(Boolean).length,
    2: Object.values(progress.level_2).filter(Boolean).length,
    3: Object.values(progress.level_3).filter(Boolean).length,
  };

  const handleCardComplete = (level: 1 | 2 | 3, card: 1 | 2 | 3) => {
    markComplete(level, card);

    // Compute the updated level progress manually (React state update is async)
    const levelKey = `level_${level}` as keyof ProgressState;
    const updatedLevel = { ...progress[levelKey], [`card_${card}`]: true } as Record<string, boolean>;
    const allDone = [1, 2, 3].every((c) => updatedLevel[`card_${c}`]);

    if (allDone) {
      // Check if a new medal tier is reached
      const updatedProgress: ProgressState = { ...progress, [levelKey]: updatedLevel };
      const newTier = getMedalTier(updatedProgress);
      const newMedal = medalRank(newTier) > medalRank(awardedMedalTier) ? newTier : null;

      if (newMedal) {
        awardMedal(newMedal); // record lifetime count + mark today's awarded tier
      }

      setShowLevelComplete({ level, medal: newMedal });
    }
  };

  const handleContinue = () => {
    const completed = showLevelComplete;
    setShowLevelComplete(null);
    if (completed !== null && completed.level < 3) {
      setActiveLevel((completed.level + 1) as 2 | 3);
    }
  };

  const currentLevel = content.levels.find((l) => l.level === activeLevel) as Level | undefined;
  if (!currentLevel) return null;

  const currentLevelProgress = progress[`level_${activeLevel}` as keyof ProgressState];

  return (
    <div className="min-h-screen bg-apple-bg text-apple-text flex flex-col">
      <LevelHeader totalCompleted={totalCompleted} todayMedalTier={todayMedalTier} />
      <LevelNav
        activeLevel={activeLevel}
        completedCounts={completedCounts}
        onSelectLevel={setActiveLevel}
      />

      {/* Progress dots + label */}
      <div className="w-full max-w-lg lg:max-w-5xl mx-auto px-4 pt-4 pb-1">
        <ProgressBar
          completedCards={completedCounts[activeLevel]}
          totalCards={3}
        />
      </div>

      {/* key={activeLevel} triggers remount → slide-from-right animation fires on every tab switch */}
      <main key={activeLevel} className="flex-1 overflow-y-auto">
        <CardList
          level={currentLevel}
          completedCards={currentLevelProgress}
          onCardComplete={(card) => handleCardComplete(activeLevel, card)}
        />
      </main>

      {showLevelComplete !== null && (
        <LevelCompleteScreen
          level={showLevelComplete.level}
          medal={showLevelComplete.medal}
          onContinue={handleContinue}
          onShare={handleShare}
        />
      )}
    </div>
  );
}

async function handleShare() {
  const SHARE_URL = 'https://doppio.kookyos.com/?ref=badge';
  const shareData = {
    title: "I'm now an AI Manager!",
    text: "I just completed a Doppio level — the Duolingo of AI. Try it in 20 minutes:",
    url: SHARE_URL,
  };
  try {
    if (navigator.share && navigator.canShare(shareData)) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
    }
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      await navigator.clipboard.writeText(SHARE_URL).catch(() => {});
    }
  }
}
