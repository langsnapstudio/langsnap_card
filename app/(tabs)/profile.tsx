import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Clipboard,
  Image,
  Linking,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFollowingCount, getFollowersCount } from '@/constants/social-store';
import { ALL_LANGUAGES, LANGUAGE_MAP } from '@/constants/languages';
import QRCodeModal from '@/components/QRCodeModal';
import UpgradeModal from '@/components/UpgradeModal';
import ReportBugSheet from '@/components/ReportBugSheet';
import { DEV_FORCE_ONBOARDING_KEY, DEV_IS_PREMIUM_KEY } from '@/constants/storage-keys';

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

type AvatarItem = { id: string; fallbackBg: string };

const AVATARS: AvatarItem[] = [
  { id: 'dog',         fallbackBg: '#F5C842' },
  { id: 'cat',         fallbackBg: '#E07A45' },
  { id: 'sheep',       fallbackBg: '#606060' },
  { id: 'elephant',    fallbackBg: '#B0CCDF' },
  { id: 'rabbit',      fallbackBg: '#E8E8E4' },
  { id: 'watermelon',  fallbackBg: '#E05C5C' },
  { id: 'dragonfruit', fallbackBg: '#9BB5E8' },
  { id: 'pineapple',   fallbackBg: '#4CAF50' },
  { id: 'corn',        fallbackBg: '#2E9E7A' },
  { id: 'hamburger',   fallbackBg: '#E53935' },
  { id: 'sushi',       fallbackBg: '#424242' },
  { id: 'pizza',       fallbackBg: '#26C6DA' },
  { id: 'streamedbun', fallbackBg: '#D4A574' },
  { id: 'bubbletea',   fallbackBg: '#8D6E63' },
  { id: 'hotcocoa',    fallbackBg: '#6D4C41' },
  { id: 'beer',        fallbackBg: '#F5A623' },
];

function AvatarCircle({ avatarId, size = 88 }: { avatarId: string; size?: number }) {
  const image = AVATAR_IMAGES[avatarId];
  const fallback = AVATARS.find(a => a.id === avatarId)?.fallbackBg ?? PURPLE_LIGHT;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      overflow: 'hidden', backgroundColor: image ? 'transparent' : fallback,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {image
        ? <Image source={image} style={{ width: size, height: size }} resizeMode="cover" />
        : <View style={{ width: size * 0.4, height: size * 0.4, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.35)' }} />
      }
    </View>
  );
}

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
  icon, label, value, onValueChange, style,
}: {
  icon: string; label: string; value: boolean; onValueChange: (v: boolean) => void; style?: any;
}) {
  return (
    <View style={[styles.settingRow, style]}>
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

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.6, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,   duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(400),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      {/* Ripple ring */}
      <Animated.View style={{
        position: 'absolute',
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: BRAND_PURPLE,
        transform: [{ scale }],
        opacity,
      }} />
      {/* Solid core */}
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND_PURPLE }} />
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const router = useRouter();

  const devResetNewUser = async () => {
    Alert.alert('Reset as new user?', 'This will clear all local data and force the onboarding flow on next sign-in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          // Re-set the flag AFTER clear so nav guard forces onboarding on next sign-in
          await AsyncStorage.setItem(DEV_FORCE_ONBOARDING_KEY, 'true');
          await signOut();
        },
      },
    ]);
  };

  const avatarId = profile?.avatar_id ?? 'dog';

  const [feats,      setFeats]      = useState<Feat[]>(MOCK_FEATS);
  const [reminder,   setReminder]   = useState(false);
  const [freezeNotif,setFreezeNotif]= useState(true);
  const [qrVisible,        setQrVisible]        = useState(false);
  const [upgradeVisible,   setUpgradeVisible]   = useState(false);
  const [reportBugVisible, setReportBugVisible] = useState(false);

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

  const [devIsPremium, setDevIsPremium] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(DEV_IS_PREMIUM_KEY).then(val => setDevIsPremium(val === 'true'));
  }, []);
  const isPremium = __DEV__ ? devIsPremium : false; // replace with real subscription check

  const devTogglePremium = async () => {
    const next = !devIsPremium;
    await AsyncStorage.setItem(DEV_IS_PREMIUM_KEY, String(next));
    setDevIsPremium(next);
  };

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Purple header ──────────────────────────────────────────────── */}
        <SafeAreaView style={styles.header} edges={['top']}>

          {/* Top row: avatar left, info right */}
          <View style={styles.headerTop}>
            <View style={styles.avatarWrap}>
              <AvatarCircle avatarId={avatarId} size={88} />
            </View>

            {/* Right: name + username + following/followers */}
            <View style={styles.headerInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.name}>{profile?.display_name ?? '—'}</Text>
                {isPremium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>👑 Premium</Text>
                  </View>
                )}
              </View>
              <Text style={styles.username}>@{profile?.username ?? '—'}</Text>
              <View style={styles.socialRow}>
                <TouchableOpacity
                  style={styles.socialTile}
                  onPress={() => router.push('/profile/courses')}
                  activeOpacity={0.8}
                >
                  {/* Flag emoji + optional +N badge */}
                  {(() => {
                    const activeLang = LANGUAGE_MAP[profile?.target_language ?? 'mainland'] ?? LANGUAGE_MAP['mainland'];
                    const extraCount = ALL_LANGUAGES.length - 1;
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
                  <Text style={styles.socialLabel}>Courses</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.socialTile}
                  onPress={() => router.push({ pathname: '/profile/friends', params: { tab: 'followers' } })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.socialCount}>{followersCount}</Text>
                  <Text style={styles.socialLabel}>Followers</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.socialTile}
                  onPress={() => router.push({ pathname: '/profile/friends', params: { tab: 'following' } })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.socialCount}>{followingCount}</Text>
                  <Text style={styles.socialLabel}>Following</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom row: edit profile + share profile */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.editProfileBtn} onPress={() => router.push('/profile/edit')} activeOpacity={0.8}>
              <Ionicons name="pencil-outline" size={14} color={WHITE} />
              <Text style={styles.editProfileText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareLinkBtn} onPress={() => setQrVisible(true)} activeOpacity={0.8}>
              <Ionicons name="qr-code-outline" size={15} color={WHITE} />
              <Text style={styles.shareLinkText}>Share profile</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>


        {/* ── Streak card ───────────────────────────────────────────────── */}
        <View style={[styles.card, { marginTop: 10 }]}>
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
          <View style={[styles.card, styles.premiumCard, { marginTop: 16 }]}>
            <Text style={styles.premiumIcon}>👑</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumTitle}>Premium · Yearly</Text>
              <Text style={styles.premiumSub}>Renews May 12, 2027</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                const url = Platform.OS === 'ios'
                  ? 'https://apps.apple.com/account/subscriptions'
                  : 'https://play.google.com/store/account/subscriptions';
                Linking.openURL(url);
              }}
            >
              <Text style={styles.manageSubText}>Manage</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Challenges (Feats) ────────────────────────────────────────── */}
        {(() => {
          const claimable = feats.filter(f => f.progress >= f.goal && !f.claimed).length;
          return (
            <TouchableOpacity
              style={[styles.challengesCard, { marginTop: 10 }]}
              activeOpacity={0.8}
              onPress={() => router.push('/profile/challenges')}
            >
              <View style={styles.challengesLeft}>
                <Text style={styles.challengesIcon}>🏆</Text>
                <View>
                  <Text style={styles.challengesTitle}>Challenges</Text>
                  <Text style={styles.challengesSub}>
                    {claimable > 0 ? `${claimable} ready to claim ⚡` : 'Nothing to claim'}
                  </Text>
                </View>
              </View>
              <View style={styles.chevronWrap}>
                {claimable > 0 && <PulseDot />}
                <Ionicons name="chevron-forward" size={18} color="#9097A3" />
              </View>
            </TouchableOpacity>
          );
        })()}

        {/* ── Settings ─────────────────────────────────────────────────── */}
        <SectionHeader title="Notifications" />
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
          <MenuRow icon="🐛" label="Report a bug" onPress={() => setReportBugVisible(true)} />
          <View style={styles.settingDivider} />
          <MenuRow icon="🚪" label="Sign out" onPress={signOut} />
          <View style={styles.settingDivider} />
          <MenuRow icon="🗑️" label="Delete account" destructive onPress={() => router.push('/profile/delete-account')} />
          {__DEV__ && (
            <>
              <View style={styles.settingDivider} />
              <MenuRow icon="🔄" label="[DEV] Reset as new user" destructive onPress={devResetNewUser} />
              <View style={styles.settingDivider} />
              <MenuRow icon="👑" label={`[DEV] Premium: ${devIsPremium ? 'ON' : 'OFF'}`} onPress={devTogglePremium} />
            </>
          )}
        </View>

        {/* ── Footer links ─────────────────────────────────────────────── */}
        <View style={styles.footerLinks}>
          <TouchableOpacity activeOpacity={0.7}><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
          <Text style={styles.footerDot}>•</Text>
          <TouchableOpacity activeOpacity={0.7}><Text style={styles.footerLink}>Terms of Use</Text></TouchableOpacity>
        </View>
        <Text style={styles.appVersion}>App Version: 1.0.0</Text>

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
      <ReportBugSheet
        visible={reportBugVisible}
        onClose={() => setReportBugVisible(false)}
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
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    gap: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarWrap: {},
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 999,
    backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: WHITE,
  },
  headerInfo: { flex: 1, justifyContent: 'center', gap: 2 },
  name:     { fontSize: 20, fontFamily: 'Volte-Semibold', color: WHITE },
  username: { fontSize: 13, fontFamily: 'Volte-Medium', color: 'rgba(255,255,255,0.65)', marginBottom: 16 },

  // Social counts
  socialRow:   { flexDirection: 'row', alignItems: 'center', gap: 24 },
  socialTile:  { alignItems: 'flex-start' },
  socialCount: { fontSize: 18, fontFamily: 'Volte-Semibold', color: WHITE, height: 26, lineHeight: 26 },
  socialLabel: { fontSize: 14, fontFamily: 'Volte-Medium', color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  // Courses stat — same height as socialCount (26px)
  coursesStatRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, height: 26, overflow: 'hidden' },
  coursesFlagEmoji: { fontSize: 20, lineHeight: 26 },
  coursesBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  coursesBadgeText: { fontSize: 12, fontFamily: 'Volte-Semibold', color: WHITE },

  // Header actions row
  headerActions: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  editProfileBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, height: 36,
    flex: 1, flexBasis: 0,
  },
  editProfileText: { fontSize: 13, fontFamily: 'Volte-Medium', color: WHITE },
  shareLinkBtn:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, height: 36,
    flex: 1, flexBasis: 0,
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
    marginTop: 10,
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
  premiumCard:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  premiumBadge:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 8, paddingTop: 1, paddingBottom: 4 },
  premiumBadgeText: { fontSize: 12, fontFamily: 'Volte-Semibold', color: '#FFFFFF' },
  premiumIcon:    { fontSize: 28 },
  premiumTitle:   { fontSize: 16, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  premiumSub:     { fontSize: 13, fontFamily: 'Volte-Medium',   color: TEXT_MUTED, marginTop: 4 },
  manageSubRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  manageSubText:  { fontSize: 15, fontFamily: 'Volte-Medium', color: '#7D69AB' },

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
  chevronWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },

  // Settings
  settingRow:     { flexDirection: 'row', alignItems: 'center', paddingTop: 0, paddingBottom: 0, gap: 12 },
  settingIcon:    { fontSize: 20, width: 28, textAlign: 'center' },
  settingLabel:   { flex: 1, fontSize: 15, fontFamily: 'Volte-Medium', color: TEXT_DARK },
  settingDivider: { height: 1, backgroundColor: BORDER, marginVertical: 16 },

  // Menu
  menuRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 0, gap: 12 },
  footerLinks:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  footerLink:   { fontSize: 13, fontFamily: 'Volte-Medium', color: TEXT_MUTED },
  footerDot:    { fontSize: 13, color: TEXT_MUTED },
  appVersion:   { fontSize: 13, fontFamily: 'Volte', color: TEXT_MUTED, textAlign: 'center', marginTop: 16 },
  menuIcon:  { fontSize: 18, width: 28, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Volte-Medium', color: TEXT_DARK },

  // Avatar picker
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  pickerSheet: {
    backgroundColor: BG_CREAM,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 34,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#D9D5E4', alignSelf: 'center', marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18, fontFamily: 'Volte-Semibold', color: TEXT_DARK,
    textAlign: 'center', marginBottom: 20,
  },
  pickerGrid:        { paddingHorizontal: 12, paddingBottom: 8 },
  pickerCell:        { flex: 1, alignItems: 'center', paddingVertical: 8 },
  pickerCellSelected: { backgroundColor: 'rgba(125,105,171,0.12)', borderRadius: 16 },
});
