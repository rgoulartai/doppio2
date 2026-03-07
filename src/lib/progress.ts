// src/lib/progress.ts
import { supabase } from './supabase';
import { getOrCreateAnonUser } from './auth';
import { track } from './analytics';
import content from '../data/content.json';

const PROGRESS_KEY = 'doppio_progress_v2';
const MEDALS_KEY = 'doppio_medals_v1';

export type MedalTier = 'bronze' | 'silver' | 'gold' | null;

export interface MedalCounts {
  bronze: number;
  silver: number;
  gold: number;
}

export interface ProgressState {
  level_1: { card_1: boolean; card_2: boolean; card_3: boolean };
  level_2: { card_1: boolean; card_2: boolean; card_3: boolean };
  level_3: { card_1: boolean; card_2: boolean; card_3: boolean };
}

export interface DailyProgress extends ProgressState {
  date: string;           // 'YYYY-MM-DD' local time
  awardedMedalTier: MedalTier; // highest medal awarded today (prevents double-celebration on reload)
}

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function emptyDailyProgress(): DailyProgress {
  return {
    date: todayDate(),
    awardedMedalTier: null,
    level_1: { card_1: false, card_2: false, card_3: false },
    level_2: { card_1: false, card_2: false, card_3: false },
    level_3: { card_1: false, card_2: false, card_3: false },
  };
}

function emptyMedalCounts(): MedalCounts {
  return { bronze: 0, silver: 0, gold: 0 };
}

export function loadDailyProgress(): DailyProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyDailyProgress();
    const stored: DailyProgress = { ...emptyDailyProgress(), ...JSON.parse(raw) };
    if (stored.date !== todayDate()) return emptyDailyProgress(); // new day — reset
    return stored;
  } catch {
    return emptyDailyProgress();
  }
}

function writeDailyProgress(state: DailyProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[doppio] Failed to write progress', err);
  }
}

export function loadMedals(): MedalCounts {
  try {
    const raw = localStorage.getItem(MEDALS_KEY);
    if (!raw) return emptyMedalCounts();
    return { ...emptyMedalCounts(), ...JSON.parse(raw) };
  } catch {
    return emptyMedalCounts();
  }
}

function writeMedals(counts: MedalCounts): void {
  try {
    localStorage.setItem(MEDALS_KEY, JSON.stringify(counts));
  } catch (err) {
    console.error('[doppio] Failed to write medals', err);
  }
}

const MEDAL_RANK: Record<string, number> = { bronze: 1, silver: 2, gold: 3 };

export function medalRank(tier: MedalTier): number {
  return tier ? (MEDAL_RANK[tier] ?? 0) : 0;
}

/**
 * Determine the highest medal tier earned based on today's progress.
 * Bronze = Level 1 complete today
 * Silver = Level 1 + Level 2 complete today
 * Gold   = All 3 levels complete today
 */
export function getMedalTier(progress: ProgressState): MedalTier {
  const l1 = isLevelComplete(progress, 1);
  const l2 = isLevelComplete(progress, 2);
  const l3 = isLevelComplete(progress, 3);
  if (l1 && l2 && l3) return 'gold';
  if (l1 && l2) return 'silver';
  if (l1) return 'bronze';
  return null;
}

/**
 * Award a medal: increment lifetime count + record in today's progress.
 * Safe to call multiple times — only awards if the tier is higher than already awarded today.
 */
export function awardMedal(tier: MedalTier): void {
  if (!tier) return;
  const medals = loadMedals();
  medals[tier] += 1;
  writeMedals(medals);
  // Record that this tier was awarded today
  const progress = loadDailyProgress();
  if (medalRank(tier) > medalRank(progress.awardedMedalTier)) {
    progress.awardedMedalTier = tier;
    writeDailyProgress(progress);
  }
}

export function markCardComplete(level: 1 | 2 | 3, card: 1 | 2 | 3): void {
  const state = loadDailyProgress();
  const levelKey = `level_${level}` as keyof ProgressState;
  (state[levelKey] as Record<string, boolean>)[`card_${card}`] = true;
  writeDailyProgress(state);

  const levelData = content.levels.find(l => l.level === level);
  const cardData = levelData?.cards.find(c => c.card === card);
  void track('card_completed', { level, card, card_title: cardData?.title ?? '' });

  void (async () => {
    try {
      const user = await getOrCreateAnonUser();
      if (!user) return;
      const { error } = await supabase
        .from('user_progress')
        .upsert(
          { user_id: user.id, level, card, completed_at: new Date().toISOString() },
          { onConflict: 'user_id,level,card', ignoreDuplicates: true }
        );
      if (error) throw error;
    } catch (err) {
      console.warn('[doppio] Supabase upsert failed (offline mode continues)', err);
    }
  })();
}

/**
 * Pull today's completed rows from Supabase and merge into localStorage.
 */
export async function syncFromSupabase(): Promise<void> {
  try {
    const user = await getOrCreateAnonUser();
    if (!user) return;

    // Filter to today's completions only (UTC midnight as approximation)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('user_progress')
      .select('level, card')
      .eq('user_id', user.id)
      .gte('completed_at', todayStart.toISOString());

    if (error) throw error;
    if (!data || data.length === 0) return;

    const state = loadDailyProgress();
    for (const row of data) {
      const levelKey = `level_${row.level}` as keyof ProgressState;
      if (levelKey in state) {
        (state[levelKey] as Record<string, boolean>)[`card_${row.card}`] = true;
      }
    }
    writeDailyProgress(state);
  } catch (err) {
    console.warn('[doppio] Supabase sync failed (offline mode continues)', err);
  }
}

export function getLevelCompletedCount(state: ProgressState, level: 1 | 2 | 3): number {
  const levelKey = `level_${level}` as keyof ProgressState;
  return Object.values(state[levelKey]).filter(Boolean).length;
}

export function isLevelComplete(state: ProgressState, level: 1 | 2 | 3): boolean {
  return getLevelCompletedCount(state, level) === 3;
}

export function getTotalCompletedCount(state: ProgressState): number {
  return getLevelCompletedCount(state, 1) + getLevelCompletedCount(state, 2) + getLevelCompletedCount(state, 3);
}
