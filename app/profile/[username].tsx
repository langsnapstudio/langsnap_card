import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getUserByUsername,
  getMutualFollowers,
  followUser,
  unfollowUser,
  isFollowing,
} from '@/constants/social-store';
import QRCodeModal from '@/components/QRCodeModal';
import ReportBugSheet from '@/components/ReportBugSheet';
import { LANGUAGE_MAP, ALL_LANGUAGES } from '@/constants/languages';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const PURPLE_LIGHT = '#EDE9F5';
const BG_CREAM     = '#F8F5EF';
const WHITE        = '#FFFFFF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#525252';
const BORDER       = '#E8E5DF';
const RED          = '#EF4444';

// ── Avatar map ─────────────────────────────────────────────────────────────────
const AVATAR_IMAGES: Record<string, any> = {
  dog:         require('@/assets/images/avatar-dog.png'),
  cat:         require('@/assets/images/avatar-cat.png'),
  sheep:       require('@/assets/images/avatar-sheep.png'),
  elephant:    require('@/assets/images/avatar-elephant.png'),
  rabbit:      require('@/assets/images/avatar-rabbit.png'),
  watermelon:  require('@/assets/images/avatar-watermelon.png'),
  dragonfruit: require('@/assets/images/avatar-dragonfruit.png'),
  pineapple:   require('@/assets/images/avatar-pineapple.png'),
  corn:        require('@/assets/images/avatar-corn.png'),
  hamburger:   require('@/assets/images/avatar-hamburger.png'),
  sushi:       require('@/assets/images/avatar-sushi.png'),
  pizza:       require('@/assets/images/avatar-pizza.png'),
  streamedbun: require('@/assets/images/avatar-streamedbun.png'),
  bubbletea:   require('@/assets/images/avatar-bubbletea.png'),
  hotcocoa:    require('@/assets/images/avatar-hotcocoa.png'),
  beer:        require('@/assets/images/avatar-beer.png'),
};

function languageLabel(lang: string) {
  return lang === 'taiwan' ? '🇹🇼 Mandarin (Taiwan)' : '🇨🇳 Mandarin (Mainland)';
}

function formatJoinDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function PublicProfileScreen() {
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();

  const user = getUserByUsername(username ?? '');
  const [, forceUpdate] = useState(0);
  const [qrVisible,        setQrVisible]        = useState(false);
  const [reportBugVisible, setReportBugVisible] = useState(false);

  if (!user) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundIcon}>🤷</Text>
          <Text style={styles.notFoundTitle}>User not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnAlt}>
            <Text style={styles.backBtnAltText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const avatarSrc = AVATAR_IMAGES[user.avatarId];
  const following = isFollowing(user.id);
  const mutuals   = getMutualFollowers(user.id);

  function handleFollowToggle() {
    if (following) unfollowUser(user!.id);
    else followUser(user!.id);
    forceUpdate(n => n + 1);
  }

  function handleReport() {
    setReportBugVisible(true);
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>

      {/* ── Purple section (nav + profile + actions) ─────────────────────── */}
      <SafeAreaView style={styles.purpleSection} edges={['top']}>

        {/* Nav bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={24} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>@{user.username}</Text>
          <TouchableOpacity onPress={handleReport} hitSlop={12} style={styles.navBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color={WHITE} />
          </TouchableOpacity>
        </View>

        {/* Profile info: avatar left, details right */}
        <View style={styles.headerTop}>
          <View style={{ width: 88, height: 88, borderRadius: 44, overflow: 'hidden', backgroundColor: PURPLE_LIGHT }}>
            {avatarSrc
              ? <Image source={avatarSrc} style={{ width: 88, height: 88 }} resizeMode="cover" />
              : <View style={{ width: 88, height: 88, backgroundColor: PURPLE_LIGHT }} />
            }
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            <Text style={styles.joinDate}>Joined {formatJoinDate(user.joinedDate)}</Text>

            {/* Stats: Courses | Followers | Following */}
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statTile}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/profile/courses', params: { username: user.username } })}
              >
                {(() => {
                  const activeLang = LANGUAGE_MAP[user.language] ?? LANGUAGE_MAP['mainland'];
                  const extraCount = (user.coursesCount ?? ALL_LANGUAGES.length) - 1;
                  return (
                    <View style={styles.coursesStatRow}>
                      <Text style={styles.coursesFlagEmoji}>{activeLang.emoji}</Text>
                      {extraCount > 0 && (
                        <View style={styles.coursesBadge}>
                          <Text style={styles.coursesBadgeText}>+{extraCount}</Text>
                        </View>
                      )}
                    </View>
                  );
                })()}
                <Text style={styles.statLabel}>Courses</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statTile}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: `/profile/friends`, params: { username: user.username, tab: 'followers' } })}
              >
                <Text style={styles.statValue}>{user.followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statTile}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: `/profile/friends`, params: { username: user.username, tab: 'following' } })}
              >
                <Text style={styles.statValue}>{user.followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Mutual followers */}
        {mutuals.length > 0 && (
          <View style={styles.mutualRow}>
            <View style={styles.mutualAvatars}>
              {mutuals.slice(0, 2).map(m => {
                const src = AVATAR_IMAGES[m.avatarId];
                return (
                  <View key={m.id} style={styles.mutualAvatarWrap}>
                    {src
                      ? <Image source={src} style={styles.mutualAvatar} resizeMode="cover" />
                      : <View style={[styles.mutualAvatar, { backgroundColor: PURPLE_LIGHT }]} />
                    }
                  </View>
                );
              })}
            </View>
            <Text style={styles.mutualText}>
              Followed by{' '}
              <Text style={styles.mutualName}>{mutuals[0].displayName}</Text>
              {mutuals.length > 1 ? ` and ${mutuals.length - 1} more` : ''}
            </Text>
          </View>
        )}

        {/* Follow + QR buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.followBtn, following && styles.followingBtn]}
            activeOpacity={0.85}
            onPress={handleFollowToggle}
          >
            <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
              {following ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qrBtn} activeOpacity={0.8} onPress={() => setQrVisible(true)}>
            <Ionicons name="qr-code-outline" size={20} color={WHITE} />
          </TouchableOpacity>
        </View>

      </SafeAreaView>

      {/* ── Scrollable content below ────────────────────────────────────── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Achievements (Phase 2 placeholder) */}
        <Text style={styles.sectionHeader}>Achievements</Text>
        <View style={styles.card}>
          <View style={styles.comingSoonWrap}>
            <Text style={styles.comingSoonIcon}>🏆</Text>
            <Text style={styles.comingSoonTitle}>Coming soon</Text>
            <Text style={styles.comingSoonSubtitle}>
              Achievements will appear here in a future update
            </Text>
          </View>
        </View>

        {/* Report a bug */}
        <TouchableOpacity style={styles.reportRow} onPress={handleReport} activeOpacity={0.7}>
          <Ionicons name="bug-outline" size={16} color={RED} />
          <Text style={styles.reportText}>Report a bug</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      <QRCodeModal
        visible={qrVisible}
        username={user.username}
        onClose={() => setQrVisible(false)}
      />
      <ReportBugSheet
        visible={reportBugVisible}
        onClose={() => setReportBugVisible(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG_CREAM },

  // Purple section
  purpleSection: {
    backgroundColor: BRAND_PURPLE,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },

  // Nav bar (inside purple)
  navBar:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  navBtn:  { width: 32 },
  navTitle:{ flex: 1, textAlign: 'center', fontSize: 15, fontFamily: 'Volte-Semibold', color: WHITE },

  // Header top row
  headerTop:  { flexDirection: 'row', alignItems: 'center', gap: 20 },
  headerInfo:  { flex: 1, gap: 2 },
  displayName: { fontSize: 20, fontFamily: 'Volte-Semibold', color: WHITE },
  joinDate:    { fontSize: 11, fontFamily: 'Volte-Medium', color: 'rgba(255,255,255,0.5)', marginBottom: 16 },

  // Stats
  statsRow:  { flexDirection: 'row', alignItems: 'center', gap: 24 },
  statTile:  { alignItems: 'flex-start' },
  statValue: { fontSize: 18, fontFamily: 'Volte-Semibold', color: WHITE, height: 26, lineHeight: 26 },
  statLabel: { fontSize: 14, fontFamily: 'Volte-Medium', color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  // Courses stat
  coursesStatRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, height: 26, overflow: 'hidden' },
  coursesFlagEmoji: { fontSize: 20, lineHeight: 26 },
  coursesBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  coursesBadgeText: { fontSize: 12, fontFamily: 'Volte-Semibold', color: WHITE },

  // Language pill
  langPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 14,
    height: 36, justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  langPillText: { fontSize: 13, fontFamily: 'Volte-Medium', color: WHITE },

  // Mutuals
  mutualRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mutualAvatars:   { flexDirection: 'row' },
  mutualAvatarWrap:{ width: 22, height: 22, borderRadius: 11, overflow: 'hidden', borderWidth: 1.5, borderColor: WHITE, marginRight: -6 },
  mutualAvatar:    { width: 22, height: 22 },
  mutualText:      { fontSize: 13, fontFamily: 'Volte-Medium', color: 'rgba(255,255,255,0.75)', flex: 1 },
  mutualName:      { fontFamily: 'Volte-Semibold', color: WHITE },

  // Action row
  actionRow: { flexDirection: 'row', gap: 10 },
  followBtn: {
    flex: 1, backgroundColor: WHITE,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  followingBtn:     { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 0 },
  followBtnText:    { fontSize: 15, fontFamily: 'Volte-Semibold', color: BRAND_PURPLE },
  followingBtnText: { color: WHITE },
  qrBtn: {
    width: 50, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Scroll content
  scrollContent: { paddingBottom: 16 },

  // Section header
  sectionHeader: {
    fontSize: 13, fontFamily: 'Volte-Semibold', color: TEXT_MUTED,
    letterSpacing: 0.8,
    marginTop: 24, marginBottom: 8, paddingHorizontal: 20,
  },

  // Card
  card: {
    backgroundColor: WHITE, marginHorizontal: 16,
    borderRadius: 16, padding: 16,
  },

  // Coming soon
  comingSoonWrap:     { alignItems: 'center', paddingVertical: 16, gap: 6 },
  comingSoonIcon:     { fontSize: 32, marginBottom: 4 },
  comingSoonTitle:    { fontSize: 15, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  comingSoonSubtitle: { fontSize: 13, fontFamily: 'Volte-Medium', color: TEXT_MUTED, textAlign: 'center' },

  // Report
  reportRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingTop: 24,
  },
  reportText: { fontSize: 14, fontFamily: 'Volte-Medium', color: RED },

  // Not found
  notFound:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundIcon:   { fontSize: 48 },
  notFoundTitle:  { fontSize: 18, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  backBtnAlt:     { backgroundColor: BRAND_PURPLE, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  backBtnAltText: { fontSize: 15, fontFamily: 'Volte-Semibold', color: WHITE },
});
