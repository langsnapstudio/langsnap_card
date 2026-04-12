import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'langsnap:activated_packs';

function packKey(deckId: string, packId: string) {
  return `${deckId}:${packId}`;
}

export async function getActivatedPacks(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return new Set();
  return new Set(JSON.parse(raw) as string[]);
}

export async function markPackActivated(deckId: string, packId: string): Promise<void> {
  const set = await getActivatedPacks();
  set.add(packKey(deckId, packId));
  await AsyncStorage.setItem(KEY, JSON.stringify([...set]));
}

export function isActivated(set: Set<string>, deckId: string, packId: string): boolean {
  return set.has(packKey(deckId, packId));
}
