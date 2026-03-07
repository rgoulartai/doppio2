// src/hooks/useProgress.ts
import { useEffect, useState, useCallback } from 'react';
import {
  loadDailyProgress,
  loadMedals,
  markCardComplete,
  syncFromSupabase,
  getLevelCompletedCount,
  isLevelComplete as checkLevelComplete,
  getTotalCompletedCount,
  getMedalTier,
  awardMedal as awardMedalFn,
  type ProgressState,
  type MedalCounts,
  type MedalTier,
} from '../lib/progress';

interface UseProgressReturn {
  progress: ProgressState;
  markComplete: (level: 1 | 2 | 3, card: 1 | 2 | 3) => void;
  isLoading: boolean;
  completedCount: (level: 1 | 2 | 3) => number;
  totalCount: number;
  totalCompleted: number;
  isLevelComplete: (level: 1 | 2 | 3) => boolean;
  todayMedalTier: MedalTier;
  medals: MedalCounts;
  awardMedal: (tier: MedalTier) => void;
  awardedMedalTier: MedalTier; // highest medal already awarded today (prevents re-celebration on reload)
}

export function useProgress(): UseProgressReturn {
  const [dailyProgress, setDailyProgress] = useState(() => loadDailyProgress());
  const [medals, setMedals] = useState<MedalCounts>(() => loadMedals());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    syncFromSupabase().then(() => {
      setDailyProgress(loadDailyProgress());
      setIsLoading(false);
    });
  }, []);

  const markComplete = useCallback((level: 1 | 2 | 3, card: 1 | 2 | 3) => {
    markCardComplete(level, card);
    setDailyProgress(loadDailyProgress());
  }, []);

  const awardMedal = useCallback((tier: MedalTier) => {
    awardMedalFn(tier);
    setDailyProgress(loadDailyProgress());
    setMedals(loadMedals());
  }, []);

  const progress: ProgressState = {
    level_1: dailyProgress.level_1,
    level_2: dailyProgress.level_2,
    level_3: dailyProgress.level_3,
  };

  return {
    progress,
    markComplete,
    isLoading,
    completedCount: (level: 1 | 2 | 3) => getLevelCompletedCount(progress, level),
    totalCount: 9,
    totalCompleted: getTotalCompletedCount(progress),
    isLevelComplete: (level: 1 | 2 | 3) => checkLevelComplete(progress, level),
    todayMedalTier: getMedalTier(progress),
    medals,
    awardMedal,
    awardedMedalTier: dailyProgress.awardedMedalTier,
  };
}
