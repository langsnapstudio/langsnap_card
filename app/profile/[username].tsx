import React, { useState, useCallback } from 'react';
import {
  Alert,
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

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const PURPLE_LIGHT = '#EDE9F5';
const BG_CREAM     = '#F8F5EF';
const WHITE        = '#FFFFFF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';
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

// ── Stat tile ──────────────────────────────────────────────────────────────────
function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function PublicProfileScreen() {
  const router   = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();

  const user = getUserByUsername(username ?? '');
  const [, forceUpdate] = useState(0);
  const [qrVisible, setQrVisible] = useState(false);

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

  const avatarSrc     = AVATAR_IMAGES[user.avatarId];
  const following     = isFollowing(user.id);
  const mutuals       = getMutualFollowers(user.id);

  function handleFollowToggle() {
    if (following) {
      unfollowUser(user!.id);
    } else {
      followUser(user!.id);
    }
    forceUpdate(n => n + 1);
  }

  function handleReport() {
    Alert.alert(
      'Report user',
      `Report @${user?.username} for inappropriate behaviour?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => {} },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

      {/* ── Nav bar ──────────────────────────────────────────────────────── */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>@{user.username}</Text>
        <TouchableOpacity onPress={handleReport} hitSlop={12} style={styles.reportBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={TEXT_MUTED} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Purple header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            {avatarSrc
              ? <Image source={avatarSrc} style={styles.avatarImg} resizeMode="cover" />
              : <View style={[styles.avatarImg, { backgroundColor: PURPLE_LIGHT }]} />
            }
          </View>

          <Text style={styles.displayName}>{user.displayName}</Text>
          <Text style={styles.usernameText}>@{user.username}</Text>
          <Text style={styles.joinDate}>Joined {formatJoinDate(user.joinedDate)}</Text>

          <View style={styles.langPill}>
            <Text style={styles.langPillText}>{languageLabel(user.language)}</Text>
          </View>
        </View>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatTile value={user.streak}       label="Day streak 🔥" />
          <View style={styles.statDivider} />
          <StatTile value={user.wordsLearned} label="Words learned" />
          <View style={styles.statDivider} />
          <StatTile value="—"                 label="Following" />
        </View>

        {/* ── Mutual followers ──────────────────────────────────────────── */}
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

        {/* ── Follow / Unfollow button ──────────────────────────────────── */}
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
            <Ionicons name="qr-code-outline" size={20} color={BRAND_PURPLE} />
          </TouchableOpacity>
        </View>

        {/* ── Achievements (Phase 2 placeholder) ───────────────────────── */}
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

        {/* ── Report ────────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.reportRow} onPress={handleReport} activeOpacity={0.7}>
          <Ionicons name="flag-outline" size={16} color={RED} />
          <Text style={styles.reportText}>Report @{user.username}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      <QRCodeModal
        visible={qrVisible}
        username={user.username}
        onClose={() => setQrVisible(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG_CREAM },
  scrollContent: { paddingBottom: 16 },

  // Nav
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: WHITE,
  },
  backBtn:   { width: 32 },
  reportBtn: { width: 32, alignItems: 'flex-end' },
  navTitle:  { flex: 1, textAlign: 'center', fontSize: 15, fontFamily: 'Volte-Semibold', color: TEXT_DARK },

  // Header
  header: {
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center',
    paddingTop: 24, paddingBottom: 28,
    paddingHorizontal: 24,
  },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    overflow: 'hidden', marginBottom: 12,
    backgroundColor: PURPLE_LIGHT,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarImg:    { width: 80, height: 80 },
  displayName:  { fontSize: 20, fontFamily: 'Volte-Semibold', color: WHITE, marginBottom: 2 },
  usernameText: { fontSize: 14, fontFamily: 'Volte-Medium', color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  joinDate:     { fontSize: 12, fontFamily: 'Volte-Medium', color: 'rgba(255,255,255,0.5)', marginBottom: 12 },
  langPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  langPillText: { fontSize: 13, fontFamily: 'Volte-Medium', color: WHITE },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, paddingVertical: 20,
  },
  statTile:    { flex: 1, alignItems: 'center', gap: 4 },
  statValue:   { fontSize: 20, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  statLabel:   { fontSize: 11, fontFamily: 'Volte-Medium',   color: TEXT_MUTED },
  statDivider: { width: 1, backgroundColor: BORDER, marginVertical: 8 },

  // Mutuals
  mutualRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingTop: 14,
  },
  mutualAvatars:   { flexDirection: 'row' },
  mutualAvatarWrap:{ width: 22, height: 22, borderRadius: 11, overflow: 'hidden', borderWidth: 1.5, borderColor: WHITE, marginRight: -6 },
  mutualAvatar:    { width: 22, height: 22 },
  mutualText:      { fontSize: 13, fontFamily: 'Volte-Medium', color: TEXT_MUTED, flex: 1 },
  mutualName:      { fontFamily: 'Volte-Semibold', color: TEXT_DARK },

  // Action row
  actionRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: 16,
  },
  followBtn: {
    flex: 1, backgroundColor: BRAND_PURPLE,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  followingBtn:     { backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER },
  followBtnText:    { fontSize: 15, fontFamily: 'Volte-Semibold', color: WHITE },
  followingBtnText: { color: TEXT_MUTED },
  qrBtn: {
    width: 50, borderRadius: 14,
    backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },

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
  comingSoonSubtitle: { fontSize: 13, fontFamily: 'Volte-Medium',   color: TEXT_MUTED, textAlign: 'center' },

  // Report
  reportRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingTop: 24,
  },
  reportText: { fontSize: 14, fontFamily: 'Volte-Medium', color: RED },

  // Not found
  notFound:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundIcon:    { fontSize: 48 },
  notFoundTitle:   { fontSize: 18, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  backBtnAlt:      { backgroundColor: BRAND_PURPLE, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  backBtnAltText:  { fontSize: 15, fontFamily: 'Volte-Semibold', color: WHITE },
});
