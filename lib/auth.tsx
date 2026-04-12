import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';
import { DEV_FORCE_ONBOARDING_KEY, WELCOME_SHOWN_KEY } from '@/constants/storage-keys';

WebBrowser.maybeCompleteAuthSession();

// ── Types ──────────────────────────────────────────────────────────────────────
export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_id: string | null;
  target_language: string | null;
  reading_system: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  devForceOnboarding: boolean;
  clearDevForce: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  appleAvailable: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

// ── Context ────────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]               = useState<Session | null>(null);
  const [profile, setProfile]               = useState<Profile | null>(null);
  const [loading, setLoading]               = useState(true);
  const [devForceOnboarding, setDevForce]   = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data ?? null);
  };

  const refreshProfile = async () => {
    if (session?.user?.id) await fetchProfile(session.user.id);
  };

  const clearDevForce = () => {
    AsyncStorage.removeItem(DEV_FORCE_ONBOARDING_KEY);
    setDevForce(false);
  };

  useEffect(() => {
    // ── Initial load — keep loading=true until everything is ready ──────────
    const init = async () => {
      const [{ data: { session } }, devFlag] = await Promise.all([
        supabase.auth.getSession(),
        AsyncStorage.getItem(DEV_FORCE_ONBOARDING_KEY),
      ]);

      setSession(session);
      setDevForce(devFlag === 'true');

      // Await profile so nav guard never sees a half-loaded state
      if (session?.user?.id) await fetchProfile(session.user.id);

      setLoading(false);
    };

    init();

    // ── Auth state changes (sign-in / sign-out after initial load) ───────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        // Re-read dev flag on sign-in so a fresh devReset is picked up
        const devFlag = await AsyncStorage.getItem(DEV_FORCE_ONBOARDING_KEY);
        setDevForce(devFlag === 'true');
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Google Sign-In ───────────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    try {
      const redirectTo = 'langsnapcard://';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error || !data?.url) {
        Alert.alert('Sign-in Error', error?.message ?? 'Could not get sign-in URL');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        const codeMatch = result.url.match(/[?&]code=([^&]+)/);
        if (codeMatch) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            decodeURIComponent(codeMatch[1])
          );
          if (exchangeError) Alert.alert('Sign-in Error', exchangeError.message);
          return;
        }

        const hashIndex = result.url.indexOf('#');
        if (hashIndex !== -1) {
          const params = new URLSearchParams(result.url.slice(hashIndex + 1));
          const accessToken  = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Sign-in Error', err?.message ?? 'Something went wrong');
    }
  };

  // ── Apple Sign-In ────────────────────────────────────────────────────────────
  const signInWithApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert('Sign-in Error', 'No identity token received from Apple');
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token:    credential.identityToken,
      });

      if (error) Alert.alert('Sign-in Error', error.message);
    } catch (err: any) {
      if (err?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign-in Error', err?.message ?? 'Something went wrong');
      }
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(WELCOME_SHOWN_KEY);
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      loading,
      devForceOnboarding,
      clearDevForce,
      signInWithGoogle,
      signInWithApple,
      appleAvailable,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
