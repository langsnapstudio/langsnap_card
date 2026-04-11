import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getUserByUsername } from '@/constants/social-store';
import { ALL_LANGUAGES } from '@/constants/languages';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const PURPLE_LIGHT = '#EDE9F5';
const BG_CREAM     = '#F8F5EF';
const WHITE        = '#FFFFFF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';
const BORDER       = '#E8E5DF';

// ── Language Card ──────────────────────────────────────────────────────────────
function LanguageCard({
  id, emoji, label, words, active, isOwnProfile, loading, onSwitch,
}: {
  id: string; emoji: string; label: string; words: number;
  active: boolean; isOwnProfile: boolean; loading: boolean;
  onSwitch: () => void;
}) {
  return (
    <View style={[styles.card, active && styles.cardActive]}>
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardWords}>{words} words learned</Text>
      </View>

      {isOwnProfile && (
        active ? (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Active</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator size="small" color={BRAND_PURPLE} style={{ width: 64 }} />
        ) : (
          <TouchableOpacity style={styles.switchBtn} activeOpacity={0.8} onPress={onSwitch}>
            <Text style={styles.switchBtnText}>Switch</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function CoursesScreen() {
  const router  = useRouter();
  const { profile, user, refreshProfile } = useAuth();
  const { username } = useLocalSearchParams<{ username?: string }>();

  const [switching, setSwitching] = useState<string | null>(null);

  const friendUser   = username ? getUserByUsername(username) : null;
  const isOwnProfile = !friendUser;

  const activeLangId  = isOwnProfile
    ? (profile?.target_language ?? 'mainland')
    : (friendUser?.language ?? 'mainland');

  const wordsLearned = isOwnProfile ? 42 : (friendUser?.wordsLearned ?? 0);
  const displayName  = friendUser ? friendUser.displayName : null;
  const navTitle     = isOwnProfile ? 'My Courses' : `${displayName}'s Courses`;

  async function handleSwitch(langId: string) {
    if (!user || langId === activeLangId || switching) return;
    setSwitching(langId);
    const updates: Record<string, string> = { target_language: langId };
    if (langId === 'mainland') updates.reading_system = 'pinyin';
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (!error) await refreshProfile();
    setSwitching(null);
  }

  // Build course items
  const allCourses = isOwnProfile
    ? ALL_LANGUAGES.map(l => ({
        ...l,
        words:  l.id === activeLangId ? wordsLearned : 0,
        active: l.id === activeLangId,
      }))
    : ALL_LANGUAGES
        .filter(l => l.id === activeLangId)
        .map(l => ({ ...l, words: wordsLearned, active: true }));

  const activeCourse = allCourses.find(c => c.active)!;
  const otherCourses = allCourses
    .filter(c => !c.active)
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{navTitle}</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Now studying */}
        <Text style={styles.sectionTitle}>Now studying</Text>
        <LanguageCard
          key={activeCourse.id}
          {...activeCourse}
          isOwnProfile={isOwnProfile}
          loading={switching === activeCourse.id}
          onSwitch={() => handleSwitch(activeCourse.id)}
        />

        {/* Other courses */}
        {otherCourses.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Other courses</Text>
            {otherCourses.map(course => (
              <LanguageCard
                key={course.id}
                {...course}
                isOwnProfile={isOwnProfile}
                loading={switching === course.id}
                onSwitch={() => handleSwitch(course.id)}
              />
            ))}
          </>
        )}

        {isOwnProfile && (
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/profile/add-language')}
          >
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={20} color={BRAND_PURPLE} />
            </View>
            <Text style={styles.addBtnText}>Add new language</Text>
            <Ionicons name="chevron-forward" size={16} color={TEXT_MUTED} />
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG_CREAM },
  scrollContent: { padding: 16 },

  navBar:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  navBtn:   { width: 32 },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Volte-Semibold', color: TEXT_DARK },

  sectionTitle: {
    fontSize: 13, fontFamily: 'Volte-Semibold', color: TEXT_MUTED,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 10, paddingHorizontal: 4,
  },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 16,
    padding: 16, gap: 14, marginBottom: 10,
    borderWidth: 2, borderColor: 'transparent',
  },
  cardActive: { borderColor: BRAND_PURPLE },

  emojiWrap: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 24 },

  cardInfo:  { flex: 1, gap: 3 },
  cardLabel: { fontSize: 15, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  cardWords: { fontSize: 13, fontFamily: 'Volte-Medium',   color: TEXT_MUTED },

  activePill: {
    backgroundColor: PURPLE_LIGHT, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  activePillText: { fontSize: 12, fontFamily: 'Volte-Semibold', color: BRAND_PURPLE },

  switchBtn: {
    backgroundColor: PURPLE_LIGHT, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  switchBtnText: { fontSize: 13, fontFamily: 'Volte-Semibold', color: BRAND_PURPLE },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: WHITE, borderRadius: 16,
    padding: 16, marginTop: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  addIconCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { flex: 1, fontSize: 15, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
});
