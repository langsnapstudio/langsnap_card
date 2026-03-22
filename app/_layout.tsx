import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';

SplashScreen.preventAutoHideAsync();

// ── Navigation guard ────────────────────────────────────────────────────────────
function RootLayoutNav() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inSignIn     = segments[0] === 'sign-in';
    const inOnboarding = segments[0] === 'onboarding';
    const inTabs       = segments[0] === '(tabs)';

    if (!session) {
      if (!inSignIn) router.replace('/sign-in');
    } else if (!profile?.username) {
      if (!inOnboarding) router.replace('/onboarding/username');
    } else if (!profile?.target_language) {
      if (!inOnboarding) router.replace('/onboarding/language');
    } else if (profile?.target_language === 'taiwan' && !profile?.reading_system) {
      if (!inOnboarding) router.replace('/onboarding/reading');
    } else {
      if (inSignIn || inOnboarding) router.replace('/(tabs)');
    }
  }, [session, profile, loading]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"      options={{ animation: 'none' }} />
      <Stack.Screen name="sign-in"    options={{ animation: 'fade' }} />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)"     options={{ animation: 'fade' }} />
    </Stack>
  );
}

// ── Root layout ─────────────────────────────────────────────────────────────────
export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Volte':          require('../assets/fonts/Volte-Regular.otf'),
    'Volte-Light':    require('../assets/fonts/Volte-Light.otf'),
    'Volte-Medium':   require('../assets/fonts/Volte-Medium.otf'),
    'Volte-Semibold': require('../assets/fonts/Volte-Semibold.otf'),
    'Volte-Bold':     require('../assets/fonts/Volte-Bold.otf'),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <AuthProvider>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
