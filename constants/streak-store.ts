import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ──────────────────────────────────────────────────────────────────────
export type StreakData = {
  streak:          number;  // current streak count
  lastStudyUtcDay: string | null; // "YYYY-MM-DD" in UTC
};

type StreakStore = Record<string, StreakData>; // languageId → data

// ── Storage key ────────────────────────────────────────────────────────────────
const STREAK_KEY = 'langsnap:streak_v1';

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Current UTC date as "YYYY-MM-DD" */
export function utcDayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Number of calendar days between two "YYYY-MM-DD" strings */
function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

// ── Load / Save ────────────────────────────────────────────────────────────────
async function loadStore(): Promise<StreakStore> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveStore(store: StreakStore): Promise<void> {
  try {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(store));
  } catch {}
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Get streak data for a language. Returns {streak:0, lastStudyUtcDay:null} if never studied. */
export async function getStreakData(languageId: string): Promise<StreakData> {
  const store = await loadStore();
  return store[languageId] ?? { streak: 0, lastStudyUtcDay: null };
}

/**
 * Record a valid study session for a language.
 * Returns the new StreakData after applying streak + freeze rules.
 *
 * PRD rules:
 *   - Day boundary: midnight UTC
 *   - Free:    1 auto-freeze — survives 1 missed day, resets on 2nd missed day
 *   - Premium: 2 auto-freezes — survives 2 missed days, resets on 3rd missed day
 *   - Freeze recharges automatically on next valid session
 */
export async function recordStudySession(
  languageId: string,
  isPremium: boolean,
): Promise<StreakData> {
  const store = await loadStore();
  const today = utcDayKey();
  const data  = store[languageId] ?? { streak: 0, lastStudyUtcDay: null };

  // Already studied today — no change
  if (data.lastStudyUtcDay === today) return data;

  let newStreak: number;

  if (!data.lastStudyUtcDay) {
    // First ever session
    newStreak = 1;
  } else {
    const daysSinceLast = daysBetween(data.lastStudyUtcDay, today);
    // daysSinceLast == 1 → studied yesterday (no missed days)
    // daysSinceLast == 2 → missed 1 day
    // daysSinceLast == 3 → missed 2 days
    const maxAllowedGap = isPremium ? 3 : 2; // gap in days (including today)

    if (daysSinceLast <= maxAllowedGap) {
      // Within freeze window — streak continues
      newStreak = data.streak + 1;
    } else {
      // Streak broken
      newStreak = 1;
    }
  }

  const updated: StreakData = { streak: newStreak, lastStudyUtcDay: today };
  store[languageId] = updated;
  await saveStore(store);
  return updated;
}

/**
 * Returns how many consecutive days have been missed since the last study session.
 * Used to determine if freeze is currently active (for UI display).
 *   0 = studied today or yesterday (no freeze needed)
 *   1 = missed 1 day (1st freeze active)
 *   2 = missed 2 days (2nd freeze active, premium only)
 */
export async function getMissedDays(languageId: string): Promise<number> {
  const data = await getStreakData(languageId);
  if (!data.lastStudyUtcDay) return 0;
  const today = utcDayKey();
  const diff = daysBetween(data.lastStudyUtcDay, today);
  return Math.max(0, diff - 1);
}
