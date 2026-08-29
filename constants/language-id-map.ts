// Bridges this app's local language slugs (used everywhere in mock data —
// energy-store, profile.target_language, etc.) to the real Supabase `languages`
// table UUIDs used by the back office and any Supabase-backed feature (currently
// just Mail gifts). Temporary until the app's content fully migrates off mock
// data — see mock-packs.ts's "Replace this with Supabase API calls" note.
//
// Values below were read directly from the live `languages` table. Update this
// map if those rows are ever recreated (new UUIDs) or if a language is added.
export const LANGUAGE_SUPABASE_ID: Record<string, string> = {
  mainland: '52432636-995f-4004-af00-59ebf83864d1', // Mandarin Chinese (Mainland)
  taiwan:   '2a827305-6217-4b6e-811e-4c3013551a2c', // Mandarin Chinese (Taiwan)
  // 'japanese' has no matching row in Supabase yet — Mail gifts can't target it until it does.
};

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(LANGUAGE_SUPABASE_ID).map(([slug, id]) => [id, slug])
);

/** Supabase languages.id (uuid) → this app's local language slug, or null if unmapped. */
export function getLocalLanguageId(supabaseLanguageId: string): string | null {
  return REVERSE_MAP[supabaseLanguageId] ?? null;
}
