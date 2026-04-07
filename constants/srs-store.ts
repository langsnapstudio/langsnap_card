import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ──────────────────────────────────────────────────────────────────────
export type CardSRSData = {
  interval:     number; // days until next review
  nextReview:   string; // ISO date string
  totalCorrect: number;
  totalMissed:  number;
};

export type SRSStore = Record<string, CardSRSData>;

// ── Storage key ────────────────────────────────────────────────────────────────
const SRS_KEY = 'langsnap:srs_v1';

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
// Call once at the end of a review session with each card's final result.
// Simple interval logic:
//   Got it  → interval doubles (capped at 30 days)
//   Missed  → interval resets to 1 day
export async function saveSRSResults(
  results: Record<string, boolean> // cardId → true = got it, false = missed
): Promise<void> {
  try {
    const store = await loadSRS();
    const now   = new Date();

    for (const [cardId, gotIt] of Object.entries(results)) {
      const prev: CardSRSData = store[cardId] ?? {
        interval:     1,
        nextReview:   now.toISOString(),
        totalCorrect: 0,
        totalMissed:  0,
      };

      const newInterval = gotIt
        ? Math.min(Math.round(prev.interval * 2.5), 30)
        : 1;

      const nextReviewDate = new Date(now);
      nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

      store[cardId] = {
        interval:     newInterval,
        nextReview:   nextReviewDate.toISOString(),
        totalCorrect: prev.totalCorrect + (gotIt ? 1 : 0),
        totalMissed:  prev.totalMissed  + (gotIt ? 0 : 1),
      };
    }

    await AsyncStorage.setItem(SRS_KEY, JSON.stringify(store));
  } catch {
    // silent — SRS save failure should never block the user
  }
}
