import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '@/lib/auth';
import { requestNotificationPermission, getNotificationScreen } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

// ── Navigation guard ────────────────────────────────────────────────────────────
function RootLayoutNav() {
  const { session, profile, loading, devForceOnboarding, clearDevForce } = useAuth();
  const router   = useRouter();
  const segments = useSegments();
  const notifListenerRef = useRef<Notifications.Subscription | null>(null);

  // Request notification permission on first load; handle deep-link taps
  useEffect(() => {
    requestNotificationPermission();

    notifListenerRef.current = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = getNotificationScreen(response);
      if (screen === 'learn') router.push('/(tabs)');
    });

    return () => {
      notifListenerRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const inSignIn     = segments[0] === 'sign-in';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session) {
      if (!inSignIn) router.replace('/sign-in');
      return;
    }

    // DEV: force onboarding regardless of profile state
    if (devForceOnboarding) {
      clearDevForce();
      if (segments[1] !== 'username') router.replace('/onboarding/username');
      return;
    }

    if (!profile?.username) {
      if (segments[1] !== 'username') router.replace('/onboarding/username');
    } else if (!profile?.target_language) {
      if (segments[1] !== 'language') router.replace('/onboarding/language');
    } else if (profile?.target_language === 'taiwan' && !profile?.reading_system) {
      if (segments[1] !== 'reading') router.replace('/onboarding/reading');
    } else {
      if (inSignIn || inOnboarding) router.replace('/(tabs)');
    }
  }, [session, profile, loading, devForceOnboarding]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"      options={{ animation: 'none' }} />
      <Stack.Screen name="sign-in"    options={{ animation: 'fade' }} />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)"     options={{ animation: 'fade' }} />
      <Stack.Screen name="learn"      options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="profile"    options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

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
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
