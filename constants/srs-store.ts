import AsyncStorage from '@react-native-async-storage/async-storage';
import { createEmptyCard, fsrs, generatorParameters, Rating, State } from 'ts-fsrs';

// ── FSRS v5 parameters (per PRD) ───────────────────────────────────────────────
const params = generatorParameters({
  request_retention: 0.9,  // 90% target recall
  maximum_interval:  365,
  enable_fuzz:       true,
});
const f = fsrs(params);

// ── Types ──────────────────────────────────────────────────────────────────────
export type CardSRSData = {
  due:            string; // ISO date string
  stability:      number;
  difficulty:     number;
  elapsed_days:   number;
  scheduled_days: number;
  reps:           number;
  lapses:         number;
  state:          State;
  last_review:    string | null;
};

export type SRSStore = Record<string, CardSRSData>;

// ── Storage key ────────────────────────────────────────────────────────────────
// v2 — new schema, v1 data is abandoned (backward-compat not required for MVP)
const SRS_KEY = 'langsnap:srs_v2';

// ── Load ───────────────────────────────────────────────────────────────────────
export async function loadSRS(): Promise<SRSStore> {
  try {
    const raw = await AsyncStorage.getItem(SRS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ── Save session results ───────────────────────────────────────────────────────
// gotIt = true  → Rating.Good  (swipe right)
// gotIt = false → Rating.Again (swipe left)
export async function saveSRSResults(
  results: Record<string, boolean>, // cardId → true = got it, false = missed
): Promise<void> {
  try {
    const store = await loadSRS();
    const now   = new Date();

    for (const [cardId, gotIt] of Object.entries(results)) {
      const rating  = gotIt ? Rating.Good : Rating.Again;
      const stored  = store[cardId];

      const card = stored
        ? {
            ...createEmptyCard(now),
            due:            new Date(stored.due),
            stability:      stored.stability,
            difficulty:     stored.difficulty,
            elapsed_days:   stored.elapsed_days,
            scheduled_days: stored.scheduled_days,
            reps:           stored.reps,
            lapses:         stored.lapses,
            state:          stored.state,
            last_review:    stored.last_review ? new Date(stored.last_review) : null,
          }
        : createEmptyCard(now);

      const scheduled = f.repeat(card, now);
      const next = scheduled[rating].card;

      store[cardId] = {
        due:            next.due.toISOString(),
        stability:      next.stability,
        difficulty:     next.difficulty,
        elapsed_days:   next.elapsed_days,
        scheduled_days: next.scheduled_days,
        reps:           next.reps,
        lapses:         next.lapses,
        state:          next.state,
        last_review:    now.toISOString(),
      };
    }

    await AsyncStorage.setItem(SRS_KEY, JSON.stringify(store));
  } catch {
    // silent — SRS save failure should never block the user
  }
}

// ── Get due cards ──────────────────────────────────────────────────────────────
// Returns cardIds from the provided list that are currently due for review.
// New cards (never reviewed) are always considered due.
export async function getDueCards(cardIds: string[]): Promise<string[]> {
  try {
    const store = await loadSRS();
    const now   = new Date();
    return cardIds.filter(id => {
      const d = store[id];
      return !d || new Date(d.due) <= now;
    });
  } catch {
    return cardIds;
  }
}
