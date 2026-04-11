export type Language = {
  id: string;
  label: string;
  shortLabel: string;
  emoji: string;
};

export const ALL_LANGUAGES: Language[] = [
  { id: 'mainland', label: 'Mandarin Chinese (Mainland)', shortLabel: 'Mandarin (CN)', emoji: '🇨🇳' },
  { id: 'taiwan',   label: 'Mandarin Chinese (Taiwan)',   shortLabel: 'Mandarin (TW)', emoji: '🇹🇼' },
  { id: 'japanese', label: 'Japanese',                    shortLabel: 'Japanese',      emoji: '🇯🇵' },
];

export const LANGUAGE_MAP: Record<string, Language> = Object.fromEntries(
  ALL_LANGUAGES.map(l => [l.id, l])
);
