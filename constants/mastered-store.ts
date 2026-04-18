import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'langsnap:mastered_v1';

export async function loadMastered(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export async function toggleMastered(cardId: string): Promise<boolean> {
  try {
    const set = await loadMastered();
    if (set.has(cardId)) {
      set.delete(cardId);
    } else {
      set.add(cardId);
    }
    await AsyncStorage.setItem(KEY, JSON.stringify([...set]));
    return set.has(cardId);
  } catch {
    return false;
  }
}
