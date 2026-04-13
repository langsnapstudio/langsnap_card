// ── Energy store — per-language, in-memory (replace with AsyncStorage later) ───

const REFILL_HOURS = 6; // mock: 6h, production would be 24h

type EnergyState = {
  timeLimited:  number;
  noTimeLimit:  number;
  nextRefillAt: Date;
};

type EnergyStore = Record<string, EnergyState>; // languageId → state

// Per-language in-memory store
const _store: EnergyStore = {};

function getOrInit(languageId: string): EnergyState {
  if (!_store[languageId]) {
    _store[languageId] = {
      timeLimited:  0,
      noTimeLimit:  3,
      nextRefillAt: new Date(Date.now() + REFILL_HOURS * 60 * 60 * 1000),
    };
  }
  return _store[languageId];
}

export function getEnergyState(languageId: string): EnergyState {
  return { ...getOrInit(languageId) };
}

export function getTotalEnergy(languageId: string): number {
  const s = getOrInit(languageId);
  return s.timeLimited + s.noTimeLimit;
}

export function hasEnergy(languageId: string): boolean {
  return getTotalEnergy(languageId) > 0;
}

export function consumeEnergy(languageId: string, amount = 1): boolean {
  const s = getOrInit(languageId);
  const total = s.timeLimited + s.noTimeLimit;
  if (total < amount) return false;

  let remaining = amount;
  if (s.noTimeLimit >= remaining) {
    s.noTimeLimit -= remaining;
  } else {
    remaining -= s.noTimeLimit;
    s.noTimeLimit = 0;
    s.timeLimited = Math.max(0, s.timeLimited - remaining);
  }
  return true;
}

export function addBonusEnergy(languageId: string, amount: number): void {
  getOrInit(languageId).noTimeLimit += amount;
}

// Helpers for countdown display
export function getCountdownString(targetDate: Date): string {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return '0h 0m';
  const totalMinutes = Math.floor(diff / 1000 / 60);
  const hours   = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Dev helper
export function debugSetEnergy(languageId: string, timeLimited: number, noTimeLimit: number) {
  const s = getOrInit(languageId);
  s.timeLimited  = timeLimited;
  s.noTimeLimit  = noTimeLimit;
}
