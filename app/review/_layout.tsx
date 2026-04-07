import { Stack } from 'expo-router';

export default function ReviewLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="flashcard"  options={{ animation: 'fade' }} />
      <Stack.Screen name="summary"    options={{ animation: 'fade' }} />
      <Stack.Screen name="deck-words" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
