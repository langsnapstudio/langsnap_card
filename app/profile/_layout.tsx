import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="friends"    options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="[username]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="challenges" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
