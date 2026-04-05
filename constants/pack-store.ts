import { PackMeta } from './mock-packs';

// ── In-memory store ────────────────────────────────────────────────────────────
// Set by deck-detail.tsx right before navigating to pack-opening.
// Avoids serialising the full card array through navigation params.

export type CurrentPackData = {
  pack:         PackMeta;
  packBagImage: number | string;
  deckTitle:    string;
  deckId:       string;
};

let _current: CurrentPackData | null = null;

export function setCurrentPack(data: CurrentPackData): void {
  _current = data;
}

export function getCurrentPack(): CurrentPackData | null {
  return _current;
}
