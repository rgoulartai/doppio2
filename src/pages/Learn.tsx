// src/pages/Learn.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import staticContent from '../data/content.json';
import { fetchTodaysVideos, type AIVideo } from '../lib/youtube-ai-videos';
import { useProgress } from '../hooks/useProgress';
import { getMedalTier, medalRank, type ProgressState, type MedalTier } from '../lib/progress';
import type { Level, VideoCard } from '../types/content';
import { LevelHeader } from '../components/LevelHeader';
import { LevelNav } from '../components/LevelNav';
import { CardList } from '../components/CardList';
import { ProgressBar } from '../components/ProgressBar';
import { LevelCompleteScreen } from '../components/LevelCompleteScreen';

// Static level metadata — titles, emojis, subtitles don't come from the AI feed
const LEVEL_META: Record<1 | 2 | 3, { title: string; emoji: string; subtitle: string; aiToolLabel: string }> = {
  1: { title: 'Beginner', emoji: '🌱', subtitle: 'ChatGPT for everyday tasks', aiToolLabel: 'ChatGPT' },
  2: { title: 'Intermediate', emoji: '⚡', subtitle: 'Delegate tasks to Claude', aiToolLabel: 'Claude' },
  3: { title: 'Advanced', emoji: '🚀', subtitle: 'Full AI workflows with Perplexity', aiToolLabel: 'Perplexity' },
};

const TOOL_BASE_URLS: Record<string, string> = {
  chatgpt: 'https://chatgpt.com/',
  claude: 'https://claude.ai/new',
  perplexity: 'https://www.perplexity.ai/',
};

function buildLevelsFromAIVideos(videos: AIVideo[]): Level[] {
  return ([1, 2, 3] as const).map((lvl) => {
    const meta = LEVEL_META[lvl];
    const levelVideos = videos.filter((v) => v.level === lvl).sort((a, b) => a.rank - b.rank);
    const cards: VideoCard[] = levelVideos.map((v) => {
      const prompt = v.try_it_prompt || v.reason || `Help me apply what I learned from: ${v.title}`;
      const baseUrl = TOOL_BASE_URLS[v.ai_tool?.toLowerCase()] ?? 'https://chatgpt.com/';
      const tryItUrl = `${baseUrl}?q=${encodeURIComponent(prompt)}`;
      return {
        id: `l${v.level}c${v.rank}`,
        level: v.level,
        card: v.rank as 1 | 2 | 3,
        title: v.title,
        description: v.reason,
        platform: 'youtube',
        videoId: v.video_id,
        creator: v.channel,
        creatorUrl: v.url,
        aiTool: v.ai_tool as 'chatgpt' | 'claude' | 'perplexity',
        tryItPrompt: prompt,
        tryItUrl,
        copyPrompt: prompt,
      };
    });
    return { level: lvl, ...meta, cards };
  });
}

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

  const [levels, setLevels] = useState<Level[]>(staticContent.levels as Level[]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaysVideos().then((videos) => {
      if (videos.length === 9) {
        setLevels(buildLevelsFromAIVideos(videos));

      }
      setLoading(false);
    });
  }, []);

  const getInitialLevel = (): 1 | 2 | 3 => {
    const param = searchParams.get('level');
    if (param === '1' || param === '2' || param === '3') {
      return parseInt(param) as 1 | 2 | 3;
    }
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

    const levelKey = `level_${level}` as keyof ProgressState;
    const updatedLevel = { ...progress[levelKey], [`card_${card}`]: true } as Record<string, boolean>;
    const allDone = [1, 2, 3].every((c) => updatedLevel[`card_${c}`]);

    if (allDone) {
      const updatedProgress: ProgressState = { ...progress, [levelKey]: updatedLevel };
      const newTier = getMedalTier(updatedProgress);
      const newMedal = medalRank(newTier) > medalRank(awardedMedalTier) ? newTier : null;

      if (newMedal) {
        awardMedal(newMedal);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-apple-bg text-apple-text flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentLevel = levels.find((l) => l.level === activeLevel) as Level | undefined;
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

      <div className="w-full max-w-lg lg:max-w-5xl mx-auto px-4 pt-4 pb-1">
        <ProgressBar
          completedCards={completedCounts[activeLevel]}
          totalCards={3}
        />
      </div>

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
  const SHARE_URL = 'https://doppio2.kookyos.com/?ref=badge';
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
