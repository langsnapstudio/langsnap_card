import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Feat definitions (matches PRD v10 §Challenges) ────────────────────────────
export type FeatDef = {
  id:     string;
  title:  string;
  desc:   string;
  icon:   string;
  goal:   number;
  reward: number; // always 1 ⚡ per PRD
};

export const FEAT_DEFS: FeatDef[] = [
  { id: 'first_step',         title: 'First Step',           desc: 'Redeem your first flashcard pack',     icon: '🌱', goal: 1,   reward: 1 },
  { id: 'word_collector',     title: 'Word Collector',       desc: 'Learn your first 10 words',            icon: '📖', goal: 10,  reward: 1 },
  { id: 'first_review',       title: 'First Review',         desc: 'Complete your first review session',   icon: '🔁', goal: 1,   reward: 1 },
  { id: 'quiz_taker',         title: 'Quiz Taker',           desc: 'Complete your first quiz',             icon: '🎯', goal: 1,   reward: 1 },
  { id: 'on_a_roll',          title: 'On a Roll',            desc: 'Reach a 7-day streak',                 icon: '🔥', goal: 7,   reward: 1 },
  { id: 'habit_formed',       title: 'Habit Formed',         desc: 'Reach a 30-day streak',                icon: '🏆', goal: 30,  reward: 1 },
  { id: 'going_strong',       title: 'Going Strong',         desc: 'Reach a 60-day streak',                icon: '💪', goal: 60,  reward: 1 },
  { id: 'committed_learner',  title: 'Committed Learner',    desc: 'Reach a 100-day streak',               icon: '🎖️', goal: 100, reward: 1 },
  { id: 'growing_vocabulary', title: 'Growing Vocabulary',   desc: 'Learn 50 words total',                 icon: '🧠', goal: 50,  reward: 1 },
  { id: 'century_club',       title: 'Century Club',         desc: 'Learn 100 words total',                icon: '💯', goal: 100, reward: 1 },
  { id: 'word_master',        title: 'Word Master',          desc: 'Learn 300 words total',                icon: '📚', goal: 300, reward: 1 },
  { id: 'first_connection',   title: 'First Connection',     desc: 'Follow your first friend',             icon: '🤝', goal: 1,   reward: 1 },
  { id: 'making_impression',  title: 'Making an Impression', desc: 'Get your first follower',              icon: '⭐', goal: 1,   reward: 1 },
  { id: 'share_progress',     title: 'Share Your Progress',  desc: 'Share a pack completion to Instagram', icon: '📸', goal: 1,   reward: 1 },
];

// ── Types ──────────────────────────────────────────────────────────────────────
export type FeatState = {
  progress:     Record<string, number>; // featId → current progress value
  claimed:      string[];               // featIds that have been claimed
  wordsLearned: number;                 // cumulative total words learned
};

export type FeatWithProgress = FeatDef & {
  progress: number;
  claimed:  boolean;
};

// ── Storage ───────────────────────────────────────────────────────────────────
const FEAT_KEY = 'langsnap:feats_v1';

async function loadState(): Promise<FeatState> {
  try {
    const raw = await AsyncStorage.getItem(FEAT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { progress: {}, claimed: [], wordsLearned: 0 };
}

async function saveState(state: FeatState): Promise<void> {
  try {
    await AsyncStorage.setItem(FEAT_KEY, JSON.stringify(state));
  } catch {}
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Get all feats merged with current progress/claimed state. */
export async function getFeats(): Promise<FeatWithProgress[]> {
  const state = await loadState();
  return FEAT_DEFS.map(def => ({
    ...def,
    progress: state.progress[def.id] ?? 0,
    claimed:  state.claimed.includes(def.id),
  }));
}

/** Get total words learned. */
export async function getWordsLearned(): Promise<number> {
  const state = await loadState();
  return state.wordsLearned;
}

/**
 * Set the absolute progress value for a feat.
 * Used for streak milestones and word counts (set to current total).
 * Returns true if the feat just became claimable for the first time.
 */
export async function setFeatProgress(featId: string, value: number): Promise<boolean> {
  const def = FEAT_DEFS.find(d => d.id === featId);
  if (!def) return false;

  const state = await loadState();
  const prev  = state.progress[featId] ?? 0;
  state.progress[featId] = value;
  await saveState(state);

  // Became claimable?
  return prev < def.goal && value >= def.goal && !state.claimed.includes(featId);
}

/**
 * Increment a feat's progress by 1 (capped at goal).
 * Returns true if the feat just became claimable.
 */
export async function incrementFeat(featId: string): Promise<boolean> {
  const def = FEAT_DEFS.find(d => d.id === featId);
  if (!def) return false;

  const state = await loadState();
  const prev  = state.progress[featId] ?? 0;
  if (prev >= def.goal) return false; // already at goal

  state.progress[featId] = prev + 1;
  await saveState(state);

  return state.progress[featId] >= def.goal && !state.claimed.includes(featId);
}

/**
 * Add words to the cumulative wordsLearned total.
 * Automatically updates progress for word-milestone feats.
 * Returns array of featIds that just became claimable.
 */
export async function addWordsLearned(count: number): Promise<string[]> {
  const state = await loadState();
  state.wordsLearned = (state.wordsLearned ?? 0) + count;

  const wordFeatIds = ['word_collector', 'growing_vocabulary', 'century_club', 'word_master'];
  const newlyClaimable: string[] = [];

  for (const featId of wordFeatIds) {
    const def  = FEAT_DEFS.find(d => d.id === featId)!;
    const prev = state.progress[featId] ?? 0;
    const next = Math.min(state.wordsLearned, def.goal);
    state.progress[featId] = next;
    if (prev < def.goal && next >= def.goal && !state.claimed.includes(featId)) {
      newlyClaimable.push(featId);
    }
  }

  await saveState(state);
  return newlyClaimable;
}

/**
 * Update streak-based feats.
 * Call after recordStudySession with the new streak count.
 * Returns array of featIds that just became claimable.
 */
export async function updateStreakFeats(streak: number): Promise<string[]> {
  const streakFeatIds = [
    { id: 'on_a_roll',         goal: 7   },
    { id: 'habit_formed',      goal: 30  },
    { id: 'going_strong',      goal: 60  },
    { id: 'committed_learner', goal: 100 },
  ];

  const state = await loadState();
  const newlyClaimable: string[] = [];

  for (const { id, goal } of streakFeatIds) {
    const prev = state.progress[id] ?? 0;
    const next = Math.min(streak, goal);
    state.progress[id] = next;
    if (prev < goal && next >= goal && !state.claimed.includes(id)) {
      newlyClaimable.push(id);
    }
  }

  await saveState(state);
  return newlyClaimable;
}

/**
 * Mark a feat as claimed. Returns the energy reward (+1 ⚡).
 * No-ops if already claimed or not yet complete.
 */
export async function claimFeat(featId: string): Promise<number> {
  const def   = FEAT_DEFS.find(d => d.id === featId);
  if (!def) return 0;

  const state = await loadState();
  if (state.claimed.includes(featId)) return 0;
  if ((state.progress[featId] ?? 0) < def.goal) return 0;

  state.claimed.push(featId);
  await saveState(state);
  return def.reward;
}

/** Number of feats ready to claim (complete but unclaimed). */
export async function getClaimableCount(): Promise<number> {
  const feats = await getFeats();
  return feats.filter(f => f.progress >= f.goal && !f.claimed).length;
}
