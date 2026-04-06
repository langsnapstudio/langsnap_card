import type { Card } from './mock-packs';

// ── In-memory store ────────────────────────────────────────────────────────────
// Set by review.tsx right before navigating to review/flashcard or quiz.
// Mirrors the same pattern as pack-store.ts.

export type ReviewSessionData = {
  cards:      Card[];
  deckTitle:  string;
};

let _session: ReviewSessionData | null = null;

export function setReviewSession(data: ReviewSessionData): void {
  _session = data;
}

export function getReviewSession(): ReviewSessionData | null {
  return _session;
}
