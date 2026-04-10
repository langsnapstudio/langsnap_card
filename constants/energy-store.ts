// ── Energy store — mock data (replace with real backend later) ─────────────────

// Time-limited energy refills every 24h
// No-time-limit energy is earned from Feats, never expires

type EnergyState = {
  timeLimited:    number;  // current time-limited energy count
  noTimeLimit:    number;  // current no-time-limit energy count
  nextRefillAt:   Date;    // when time-limited energy next refills
};

// Mock: 0 time-limited (depleted), 3 no-time-limit, refills in ~6 hours
const REFILL_HOURS = 6;
const nextRefill = new Date(Date.now() + REFILL_HOURS * 60 * 60 * 1000);

let _state: EnergyState = {
  timeLimited:  0,
  noTimeLimit:  3,
  nextRefillAt: nextRefill,
};

export function getEnergyState(): EnergyState {
  return { ..._state };
}

export function getTotalEnergy(): number {
  return _state.timeLimited + _state.noTimeLimit;
}

export function hasEnergy(): boolean {
  return getTotalEnergy() > 0;
}

export function consumeEnergy(amount = 1): boolean {
  const total = getTotalEnergy();
  if (total < amount) return false;

  // Consume no-time-limit first, then time-limited
  let remaining = amount;
  if (_state.noTimeLimit >= remaining) {
    _state.noTimeLimit -= remaining;
  } else {
    remaining -= _state.noTimeLimit;
    _state.noTimeLimit = 0;
    _state.timeLimited = Math.max(0, _state.timeLimited - remaining);
  }
  return true;
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

// Simulate having energy (for testing) — toggle between empty and full
export function debugSetEnergy(timeLimited: number, noTimeLimit: number) {
  _state.timeLimited = timeLimited;
  _state.noTimeLimit = noTimeLimit;
}
