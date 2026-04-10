import React from 'react';
import {
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
import { getUserByUsername } from '@/constants/social-store';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const PURPLE_LIGHT = '#EDE9F5';
const BG_CREAM     = '#F8F5EF';
const WHITE        = '#FFFFFF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';
const BORDER       = '#E8E5DF';

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function CoursesScreen() {
  const router  = useRouter();
  const { profile } = useAuth();
  const { username } = useLocalSearchParams<{ username?: string }>();

  // If a username param is passed, show that friend's courses
  const friendUser  = username ? getUserByUsername(username) : null;
  const isOwnProfile = !friendUser;

  const language    = friendUser ? friendUser.language : (profile?.target_language ?? 'mainland');
  const wordsLearned = friendUser ? friendUser.wordsLearned : 42;
  const displayName  = friendUser ? friendUser.displayName : null;

  const isMainland = language !== 'taiwan';

  const courses = [
    {
      flag:   isMainland ? '🇨🇳' : '🇹🇼',
      label:  isMainland ? 'Mandarin Chinese' : 'Mandarin (Taiwan)',
      words:  wordsLearned,
      active: isOwnProfile,
    },
  ];

  const navTitle = isOwnProfile ? 'My Courses' : `${displayName}'s Courses`;

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
        <View style={styles.card}>
          {courses.map((course, i) => (
            <View key={i}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.courseRow}>
                <View style={styles.flagWrap}>
                  <Text style={styles.flagEmoji}>{course.flag}</Text>
                </View>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseName}>{course.label}</Text>
                  {course.active && (
                    <Text style={styles.activeBadge}>Active</Text>
                  )}
                </View>
                <Text style={styles.wordsCount}>{course.words} words</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG_CREAM },
  scrollContent: { padding: 16 },

  // Nav
  navBar:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: BG_CREAM },
  navBtn:   { width: 32 },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontFamily: 'Volte-Semibold', color: TEXT_DARK },

  // Card
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: BORDER, marginLeft: 72 },

  // Course row
  courseRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, gap: 14,
  },
  flagWrap: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  flagEmoji:   { fontSize: 26 },
  courseInfo:  { flex: 1, gap: 3 },
  courseName:  { fontSize: 16, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  activeBadge: { fontSize: 12, fontFamily: 'Volte-Medium', color: BRAND_PURPLE },
  wordsCount:  { fontSize: 14, fontFamily: 'Volte-Medium', color: TEXT_MUTED },
});
