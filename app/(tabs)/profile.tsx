import React, { useState, useCallback } from 'react';
import {
  Clipboard,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  ToastAndroid,
  TouchableOpacity,
  Platform,
  Alert,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { getFollowingCount, getFollowersCount } from '@/constants/social-store';
import QRCodeModal from '@/components/QRCodeModal';
import UpgradeModal from '@/components/UpgradeModal';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE  = '#7D69AB';
const PURPLE_LIGHT  = '#EDE9F5';
const BG_CREAM      = '#F8F5EF';
const WHITE         = '#FFFFFF';
const TEXT_DARK     = '#262626';
const TEXT_MUTED    = '#9097A3';
const GREEN         = '#22C55E';
const AMBER         = '#F59E0B';
const RED           = '#EF4444';
const BORDER        = '#E8E5DF';

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

// ── Mock data (replace with real store later) ──────────────────────────────────
const MOCK_STATS = {
  streak:        7,
  freezeActive:  false,   // true = freeze was used today
  freezeAvailable: true,  // 1 free freeze recharged
  wordsLearned:  42,
  cardsReviewed: 180,
};

type Feat = {
  id:       string;
  title:    string;
  desc:     string;
  icon:     string;
  progress: number;
  goal:     number;
  claimed:  boolean;
  reward:   number; // no-time-limit energy
};

const MOCK_FEATS: Feat[] = [
  { id: 'first_word',   title: 'First Steps',         desc: 'Learn your first word',    icon: '🌱', progress: 1,   goal: 1,   claimed: true,  reward: 5  },
  { id: 'ten_words',    title: 'Getting Started',     desc: 'Learn 10 words',           icon: '📖', progress: 10,  goal: 10,  claimed: false, reward: 10 },
  { id: 'fifty_words',  title: 'Vocabulary Builder',  desc: 'Learn 50 words',           icon: '🧠', progress: 42,  goal: 50,  claimed: false, reward: 20 },
  { id: 'week_streak',  title: 'Week Warrior',        desc: 'Keep a 7-day streak',      icon: '🔥', progress: 7,   goal: 7,   claimed: false, reward: 15 },
  { id: 'month_streak', title: 'Monthly Master',      desc: 'Keep a 30-day streak',     icon: '🏆', progress: 7,   goal: 30,  claimed: false, reward: 50 },
  { id: 'cards_100',    title: 'Card Collector',      desc: 'Review 100 cards',         icon: '🃏', progress: 42,  goal: 100, claimed: false, reward: 25 },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatTile({ value, label, icon }: { value: string | number; label: string; icon: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingRow({
  icon, label, value, onValueChange,
}: {
  icon: string; label: string; value: boolean; onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: BORDER, true: BRAND_PURPLE }}
        thumbColor={WHITE}
      />
    </View>
  );
}

function MenuRow({ icon, label, destructive, onPress }: {
  icon: string; label: string; destructive?: boolean; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, destructive && { color: RED }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={TEXT_MUTED} />
    </TouchableOpacity>
  );
}

function FeatRow({ feat, onClaim }: { feat: Feat; onClaim: (id: string) => void }) {
  const ratio     = Math.min(feat.progress / feat.goal, 1);
  const complete  = feat.progress >= feat.goal;
  const claimable = complete && !feat.claimed;

  return (
    <View style={styles.featRow}>
      <Text style={styles.featIcon}>{feat.icon}</Text>

      <View style={styles.featInfo}>
        <View style={styles.featTitleRow}>
          <Text style={styles.featTitle}>{feat.title}</Text>
          {feat.claimed && (
            <View style={styles.claimedBadge}>
              <Ionicons name="checkmark" size={11} color={GREEN} />
              <Text style={styles.claimedText}>Claimed</Text>
            </View>
          )}
        </View>
        <Text style={styles.featDesc}>{feat.desc}</Text>

        <View style={styles.featProgressRow}>
          <View style={styles.featTrack}>
            <View style={[styles.featFill, { width: `${ratio * 100}%` as any }]} />
          </View>
          <Text style={styles.featCount}>{feat.progress}/{feat.goal}</Text>
        </View>
      </View>

      {claimable && (
        <TouchableOpacity
          style={styles.claimBtn}
          activeOpacity={0.8}
          onPress={() => onClaim(feat.id)}
        >
          <Text style={styles.claimBtnText}>+{feat.reward}</Text>
          <Text style={styles.claimBtnSub}>⚡</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const avatarId    = profile?.avatar_id ?? 'dog';
  const avatarImage = AVATAR_IMAGES[avatarId];

  const [feats,      setFeats]      = useState<Feat[]>(MOCK_FEATS);
  const [reminder,   setReminder]   = useState(false);
  const [freezeNotif,setFreezeNotif]= useState(true);
  const [qrVisible,      setQrVisible]      = useState(false);
  const [upgradeVisible, setUpgradeVisible] = useState(false);

  const followingCount = getFollowingCount();
  const followersCount = getFollowersCount();

  function handleCopyLink() {
    const link = `https://langsnap.app/u/${profile?.username ?? ''}`;
    Clipboard.setString(link);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Link copied!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied!', 'Profile link copied to clipboard.');
    }
  }

  const stats = MOCK_STATS;

  function handleClaim(id: string) {
    setFeats(prev => prev.map(f => f.id === id ? { ...f, claimed: true } : f));
  }

  const isPremium = false; // replace with real subscription check

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Purple header ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            {avatarImage
              ? <Image source={avatarImage} style={styles.avatarImg} resizeMode="cover" />
              : <View style={styles.avatarFallback} />
            }
          </View>
          <Text style={styles.name}>{profile?.display_name ?? '—'}</Text>
          <Text style={styles.username}>@{profile?.username ?? '—'}</Text>

          {/* Following / Followers */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialTile}
              onPress={() => router.push({ pathname: '/profile/friends', params: { tab: 'following' } })}
              activeOpacity={0.8}
            >
              <Text style={styles.socialCount}>{followingCount}</Text>
              <Text style={styles.socialLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.socialDivider} />
            <TouchableOpacity
              style={styles.socialTile}
              onPress={() => router.push({ pathname: '/profile/friends', params: { tab: 'followers' } })}
              activeOpacity={0.8}
            >
              <Text style={styles.socialCount}>{followersCount}</Text>
              <Text style={styles.socialLabel}>Followers</Text>
            </TouchableOpacity>
          </View>

          {/* Language pill + share link */}
          <View style={styles.headerActions}>
            <View style={styles.langPill}>
              <Text style={styles.langPillText}>
                {profile?.target_language === 'taiwan'
                  ? '🇹🇼 Mandarin Chinese'
                  : '🇨🇳 Mandarin Chinese'}
              </Text>
            </View>
            <TouchableOpacity style={styles.shareLinkBtn} onPress={() => setQrVisible(true)} activeOpacity={0.8}>
              <Ionicons name="qr-code-outline" size={15} color={WHITE} />
              <Text style={styles.shareLinkText}>Share profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatTile value={stats.streak}        label="Day streak"    icon="🔥" />
          <View style={styles.statDivider} />
          <StatTile value={stats.wordsLearned}  label="Words learned" icon="📖" />
          <View style={styles.statDivider} />
          <StatTile value={stats.cardsReviewed} label="Cards reviewed" icon="🃏" />
        </View>

        {/* ── Streak card ───────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.streakHeader}>
            <View>
              <Text style={styles.streakCount}>{stats.streak} day streak 🔥</Text>
              <Text style={styles.streakSub}>Keep it up — study today to keep your streak!</Text>
            </View>
          </View>

          <View style={styles.freezeRow}>
            <View style={[styles.freezeBadge, stats.freezeAvailable ? styles.freezeAvail : styles.freezeUsed]}>
              <Text style={styles.freezeIcon}>🧊</Text>
              <View>
                <Text style={styles.freezeTitle}>Streak Freeze</Text>
                <Text style={styles.freezeStatus}>
                  {stats.freezeActive
                    ? 'Used today — recharges on next study'
                    : stats.freezeAvailable
                    ? '1 freeze ready'
                    : 'No freeze available'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Subscription ─────────────────────────────────────────────── */}
        {!isPremium && (
          <TouchableOpacity style={styles.upgradeCard} activeOpacity={0.85} onPress={() => setUpgradeVisible(true)}>
            <View style={styles.upgradeLeft}>
              <Text style={styles.upgradeCrown}>👑</Text>
              <View>
                <Text style={styles.upgradeTitle}>Go Premium</Text>
                <Text style={styles.upgradeSub}>Unlock all levels & content</Text>
              </View>
            </View>
            <View style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </View>
          </TouchableOpacity>
        )}

        {isPremium && (
          <View style={[styles.card, styles.premiumCard]}>
            <Text style={styles.premiumIcon}>👑</Text>
            <View>
              <Text style={styles.premiumTitle}>Premium</Text>
              <Text style={styles.premiumSub}>All levels unlocked</Text>
            </View>
          </View>
        )}

        {/* ── Challenges (Feats) ────────────────────────────────────────── */}
        <SectionHeader title="Challenges" />
        <TouchableOpacity
          style={styles.challengesCard}
          activeOpacity={0.8}
          onPress={() => router.push('/profile/challenges')}
        >
          <View style={styles.challengesLeft}>
            <Text style={styles.challengesIcon}>🏆</Text>
            <View>
              <Text style={styles.challengesTitle}>View all challenges</Text>
              <Text style={styles.challengesSub}>
                {feats.filter(f => f.claimed).length}/{feats.length} completed
                {feats.filter(f => f.progress >= f.goal && !f.claimed).length > 0
                  ? ` · ${feats.filter(f => f.progress >= f.goal && !f.claimed).length} ready to claim ⚡`
                  : ''}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9097A3" />
        </TouchableOpacity>

        {/* ── Settings ─────────────────────────────────────────────────── */}
        <SectionHeader title="Settings" />
        <View style={styles.card}>
          <SettingRow
            icon="🔔"
            label="Practice reminder"
            value={reminder}
            onValueChange={setReminder}
          />
          <View style={styles.settingDivider} />
          <SettingRow
            icon="🧊"
            label="Streak freeze notification"
            value={freezeNotif}
            onValueChange={setFreezeNotif}
          />
        </View>

        {/* ── Account ──────────────────────────────────────────────────── */}
        <SectionHeader title="Account" />
        <View style={styles.card}>
          <MenuRow icon="🔒" label="Privacy Policy" />
          <View style={styles.settingDivider} />
          <MenuRow icon="📋" label="Terms of Use" />
          <View style={styles.settingDivider} />
          <MenuRow icon="🚪" label="Sign out" onPress={signOut} />
          <View style={styles.settingDivider} />
          <MenuRow icon="🗑️" label="Delete account" destructive />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <QRCodeModal
        visible={qrVisible}
        username={profile?.username ?? ''}
        onClose={() => setQrVisible(false)}
      />
      <UpgradeModal
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG_CREAM },
  scrollContent: { paddingBottom: 16 },

  // Header
  header: {
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  avatarWrap: {
    width: 88, height: 88, borderRadius: 44,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: PURPLE_LIGHT,
  },
  avatarImg:      { width: 88, height: 88 },
  avatarFallback: { width: 88, height: 88, backgroundColor: 'rgba(255,255,255,0.2)' },
  name:     { fontSize: 22, fontFamily: 'Volte-Semibold', color: WHITE, marginBottom: 2 },
  username: { fontSize: 14, fontFamily: 'Volte-Medium',   color: 'rgba(255,255,255,0.65)', marginBottom: 16 },

  // Social counts
  socialRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  socialTile:    { alignItems: 'center', paddingHorizontal: 20 },
  socialCount:   { fontSize: 20, fontFamily: 'Volte-Semibold', color: WHITE },
  socialLabel:   { fontSize: 12, fontFamily: 'Volte-Medium', color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  socialDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },

  // Header actions row
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  langPillText:  { fontSize: 13, fontFamily: 'Volte-Medium', color: WHITE },
  shareLinkBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  shareLinkText: { fontSize: 13, fontFamily: 'Volte-Medium', color: WHITE },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 20,
  },
  statTile:    { flex: 1, alignItems: 'center', gap: 4 },
  statIcon:    { fontSize: 22 },
  statValue:   { fontSize: 22, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  statLabel:   { fontSize: 11, fontFamily: 'Volte-Medium',   color: TEXT_MUTED },
  statDivider: { width: 1, backgroundColor: BORDER, marginVertical: 8 },

  // Section header
  sectionHeader: {
    fontSize: 13, fontFamily: 'Volte-Semibold', color: TEXT_MUTED,
    letterSpacing: 0.8,
    marginTop: 24, marginBottom: 8,
    paddingHorizontal: 20,
  },

  // Card
  card: {
    backgroundColor: WHITE,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
  },

  // Streak
  streakHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  streakCount:  { fontSize: 17, fontFamily: 'Volte-Semibold', color: TEXT_DARK, marginBottom: 2 },
  streakSub:    { fontSize: 13, fontFamily: 'Volte-Medium',   color: TEXT_MUTED },

  freezeRow:    { marginTop: 4 },
  freezeBadge:  {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, padding: 12,
  },
  freezeAvail:  { backgroundColor: '#EFF6FF' },
  freezeUsed:   { backgroundColor: '#F5F5F5' },
  freezeIcon:   { fontSize: 24 },
  freezeTitle:  { fontSize: 14, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  freezeStatus: { fontSize: 12, fontFamily: 'Volte-Medium',   color: TEXT_MUTED, marginTop: 1 },

  // Upgrade card
  upgradeCard: {
    marginHorizontal: 16,
    backgroundColor: BRAND_PURPLE,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upgradeLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeCrown:   { fontSize: 28 },
  upgradeTitle:   { fontSize: 16, fontFamily: 'Volte-Semibold', color: WHITE },
  upgradeSub:     { fontSize: 12, fontFamily: 'Volte-Medium',   color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  upgradeBtn:     { backgroundColor: WHITE, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  upgradeBtnText: { fontSize: 14, fontFamily: 'Volte-Semibold', color: BRAND_PURPLE },

  // Premium badge
  premiumCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  premiumIcon:  { fontSize: 28 },
  premiumTitle: { fontSize: 16, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  premiumSub:   { fontSize: 13, fontFamily: 'Volte-Medium',   color: TEXT_MUTED },

  // Challenges card
  challengesCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE,
    marginHorizontal: 16, borderRadius: 16,
    padding: 16, gap: 12,
  },
  challengesLeft:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  challengesIcon:  { fontSize: 28 },
  challengesTitle: { fontSize: 15, fontFamily: 'Volte-Semibold', color: TEXT_DARK, marginBottom: 2 },
  challengesSub:   { fontSize: 13, fontFamily: 'Volte-Medium', color: TEXT_MUTED },

  // Settings
  settingRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 12 },
  settingIcon:    { fontSize: 20, width: 28, textAlign: 'center' },
  settingLabel:   { flex: 1, fontSize: 15, fontFamily: 'Volte-Medium', color: TEXT_DARK },
  settingDivider: { height: 1, backgroundColor: BORDER, marginVertical: 4 },

  // Menu
  menuRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  menuIcon:  { fontSize: 18, width: 28, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Volte-Medium', color: TEXT_DARK },
});
