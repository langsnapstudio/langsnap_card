import { Stack } from 'expo-router';

export default function LearnLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="theme-list" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="deck-detail" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="pack-opening" options={{ animation: 'fade' }} />
      <Stack.Screen name="flashcard"   options={{ animation: 'fade' }} />
      <Stack.Screen name="success"     options={{ animation: 'fade' }} />
    </Stack>
  );
}
