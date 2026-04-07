import type { Card } from './mock-packs';

// ── In-memory store ────────────────────────────────────────────────────────────
// Set by review.tsx right before navigating to review/flashcard or quiz.
// Mirrors the same pattern as pack-store.ts.

export type ReviewMode = 'manual' | 'autoplay';

export type ReviewSessionConfig = {
  mode:             ReviewMode;
  sessionSize:      15 | 30 | 50;
  showIllustration: boolean;
  autoplayAudio:    boolean;
  autoFlip:         boolean; // autoplay only: flip to back before advancing
  categoryId:       string;  // deck id or 'all'
};

export const DEFAULT_REVIEW_CONFIG: ReviewSessionConfig = {
  mode:             'manual',
  sessionSize:      15,
  showIllustration: true,
  autoplayAudio:    true,
  autoFlip:         false,
  categoryId:       'all',
};

export type ReviewSessionData = {
  cards:     Card[];
  deckTitle: string;
  config:    ReviewSessionConfig;
};

let _session: ReviewSessionData | null = null;

export function setReviewSession(data: ReviewSessionData): void {
  _session = data;
}

export function getReviewSession(): ReviewSessionData | null {
  return _session;
}

// ── Summary ────────────────────────────────────────────────────────────────────
export type ReviewSummaryData = {
  remembered: import('./mock-packs').Card[];
  forgot:     import('./mock-packs').Card[];
};

let _summary: ReviewSummaryData | null = null;

export function setReviewSummary(data: ReviewSummaryData): void {
  _summary = data;
}

export function getReviewSummary(): ReviewSummaryData | null {
  return _summary;
}
