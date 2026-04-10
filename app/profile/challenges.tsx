import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';

const SCREEN_WIDTH  = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE  = '#7D69AB';
const PURPLE_LIGHT  = '#EDE9F5';
const BG_CREAM      = '#F8F5EF';
const WHITE         = '#FFFFFF';
const TEXT_DARK     = '#262626';
const TEXT_MUTED    = '#9097A3';
const GREEN         = '#22C55E';
const BORDER        = '#E8E5DF';

// ── Types & mock data ──────────────────────────────────────────────────────────
type Feat = {
  id:       string;
  title:    string;
  desc:     string;
  icon:     string;
  progress: number;
  goal:     number;
  claimed:  boolean;
  reward:   number;
};

const INITIAL_FEATS: Feat[] = [
  { id: 'first_word',   title: 'First Steps',        desc: 'Learn your first word',        icon: '🌱', progress: 1,  goal: 1,   claimed: true,  reward: 5  },
  { id: 'ten_words',    title: 'Getting Started',    desc: 'Learn 10 words',               icon: '📖', progress: 10, goal: 10,  claimed: false, reward: 10 },
  { id: 'fifty_words',  title: 'Vocabulary Builder', desc: 'Learn 50 words',               icon: '🧠', progress: 42, goal: 50,  claimed: false, reward: 20 },
  { id: 'week_streak',  title: 'Week Warrior',       desc: 'Keep a 7-day streak',          icon: '🔥', progress: 7,  goal: 7,   claimed: false, reward: 15 },
  { id: 'month_streak', title: 'Monthly Master',     desc: 'Keep a 30-day streak',         icon: '🏆', progress: 7,  goal: 30,  claimed: false, reward: 50 },
  { id: 'cards_100',    title: 'Card Collector',     desc: 'Review 100 cards',             icon: '🃏', progress: 42, goal: 100, claimed: false, reward: 25 },
  { id: 'first_pack',   title: 'Pack Opener',        desc: 'Redeem your first pack',       icon: '🎁', progress: 1,  goal: 1,   claimed: false, reward: 5  },
  { id: 'five_decks',   title: 'Deck Explorer',      desc: 'Study from 5 different decks', icon: '🗂️', progress: 2,  goal: 5,   claimed: false, reward: 15 },
  { id: 'words_200',    title: 'Word Hoarder',       desc: 'Learn 200 words',              icon: '📚', progress: 42, goal: 200, claimed: false, reward: 40 },
  { id: 'streak_30',    title: 'Habit Formed',       desc: 'Study 30 days in a row',       icon: '🗓️', progress: 7,  goal: 30,  claimed: false, reward: 50 },
  { id: 'quiz_perfect', title: 'Perfectionist',      desc: 'Get 100% on a quiz',           icon: '🎯', progress: 0,  goal: 1,   claimed: false, reward: 10 },
  { id: 'cards_500',    title: 'Flashcard Fanatic',  desc: 'Review 500 cards',             icon: '⚡', progress: 42, goal: 500, claimed: false, reward: 60 },
];

// ── Confetti ───────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#4F8EF7', '#FF6B6B', '#FFD93D', '#6BCB77', '#C77DFF', '#FF9F1C', '#FF9AD5'];
const CONFETTI_COUNT  = 50;

type ConfettiPiece = {
  x: number; color: string; w: number; h: number;
  fallAnim: Animated.Value; rotateAnim: Animated.Value;
  duration: number; delay: number;
};

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, () => ({
    x:          Math.random() * SCREEN_WIDTH,
    color:      CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    w:          7 + Math.random() * 7,
    h:          4 + Math.random() * 4,
    fallAnim:   new Animated.Value(0),
    rotateAnim: new Animated.Value(0),
    duration:   2200 + Math.random() * 1800,
    delay:      Math.random() * 1200,
  }));
}

function Confetti() {
  const pieces = useRef<ConfettiPiece[]>(makeConfetti()).current;
  useEffect(() => {
    pieces.forEach(p => {
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(p.fallAnim, { toValue: 1, duration: p.duration, useNativeDriver: true }),
      ]).start();
      Animated.loop(
        Animated.timing(p.rotateAnim, { toValue: 1, duration: p.duration * 0.6, useNativeDriver: true })
      ).start();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => {
        const translateY = p.fallAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, SCREEN_HEIGHT + 24] });
        const rotate     = p.rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
        return (
          <Animated.View key={i} style={{
            position: 'absolute', left: p.x, top: 0,
            width: p.w, height: p.h, borderRadius: 2,
            backgroundColor: p.color,
            transform: [{ translateY }, { rotate }],
          }} />
        );
      })}
    </View>
  );
}

// ── Claim success sheet ────────────────────────────────────────────────────────
function ClaimSuccessSheet({ visible, reward, onClose, onActivate }: {
  visible: boolean; reward: number; onClose: () => void; onActivate: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const soundRef  = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 55, useNativeDriver: true }),
      ]).start();

      // Play claim sound
      (async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require('@/assets/audio/challenge_claimed.wav')
          );
          soundRef.current = sound;
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate(status => {
            if ('didJustFinish' in status && status.didJustFinish) {
              sound.unloadAsync();
              soundRef.current = null;
            }
          });
        } catch (_) {}
      })();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 400, duration: 180, useNativeDriver: true }),
      ]).start();
    }

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: fadeAnim }]} />
      </Pressable>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetContent}>
          <Text style={styles.sheetEmoji}>⚡</Text>
          <Text style={styles.sheetTitle}>+{reward} energy earned!</Text>
          <Text style={styles.sheetSubtitle}>
            Use your energy to unlock new packs and keep your learning going.
          </Text>

          <TouchableOpacity style={styles.sheetCTA} onPress={onActivate} activeOpacity={0.85}>
            <Text style={styles.sheetCTAText}>Go activate more content</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetDismiss} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.sheetDismissText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {visible && <Confetti />}
    </Modal>
  );
}

function sortFeats(feats: Feat[]): Feat[] {
  const readyToclaim  = feats.filter(f => f.progress >= f.goal && !f.claimed).sort((a, b) => a.title.localeCompare(b.title));
  const claimed       = feats.filter(f => f.claimed).sort((a, b) => a.title.localeCompare(b.title));
  const unready       = feats.filter(f => f.progress < f.goal).sort((a, b) => a.title.localeCompare(b.title));
  return [...readyToclaim, ...unready, ...claimed];
}

// ── Feat card ──────────────────────────────────────────────────────────────────
function FeatCard({ feat, onClaim }: { feat: Feat; onClaim: (id: string) => void }) {
  const ratio     = Math.min(feat.progress / feat.goal, 1);
  const complete  = feat.progress >= feat.goal;
  const claimable = complete && !feat.claimed;

  return (
    <View style={[styles.featCard, feat.claimed && styles.featCardClaimed]}>
      {/* Left: icon + info */}
      <View style={styles.featLeft}>
        <Text style={styles.featIcon}>{feat.icon}</Text>
        <View style={styles.featInfo}>
          <Text style={styles.featTitle}>{feat.title}</Text>
          <Text style={styles.featDesc}>{feat.desc}</Text>
          <View style={styles.featProgressRow}>
            <View style={styles.featTrack}>
              <View style={[styles.featFill, { width: `${ratio * 100}%` as any }]} />
            </View>
            <Text style={styles.featCount}>{feat.progress}/{feat.goal}</Text>
          </View>
        </View>
      </View>

      {/* Right: claim button — always visible */}
      <TouchableOpacity
        style={[
          styles.claimBtn,
          feat.claimed && styles.claimBtnClaimed,
          !claimable && !feat.claimed && styles.claimBtnDisabled,
        ]}
        activeOpacity={claimable ? 0.8 : 1}
        onPress={() => claimable && onClaim(feat.id)}
        disabled={!claimable && !feat.claimed}
      >
        <Text style={[
          styles.claimBtnText,
          feat.claimed && styles.claimBtnTextClaimed,
          !claimable && !feat.claimed && styles.claimBtnTextDisabled,
        ]}>
          {feat.claimed ? 'Claimed' : 'Claim'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function ChallengesScreen() {
  const router = useRouter();
  const [feats, setFeats]           = useState<Feat[]>(INITIAL_FEATS);
  const [sheetVisible, setSheet]    = useState(false);
  const [claimedReward, setReward]  = useState(0);

  const sorted = sortFeats(feats);

  function handleClaim(id: string) {
    const feat = feats.find(f => f.id === id);
    if (!feat) return;
    setFeats(prev => prev.map(f => f.id === id ? { ...f, claimed: true } : f));
    setReward(feat.reward);
    setSheet(true);
  }

  function handleActivate() {
    setSheet(false);
    router.push('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

      {/* ── Nav bar ──────────────────────────────────────────────────────── */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Challenges</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* ── Feat list ─────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Complete challenges to earn ⚡ energy — keep studying to unlock more!</Text>
        {sorted.map(feat => (
          <FeatCard key={feat.id} feat={feat} onClaim={handleClaim} />
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>

      <ClaimSuccessSheet
        visible={sheetVisible}
        reward={claimedReward}
        onClose={() => setSheet(false)}
        onActivate={handleActivate}
      />

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG_CREAM },

  // Nav
  navBar:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:  { width: 32 },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Volte-Semibold', color: TEXT_DARK },

  // Subtitle
  subtitle: {
    fontSize: 14, fontFamily: 'Volte-Medium', color: TEXT_MUTED,
    textAlign: 'center', paddingHorizontal: 32, marginBottom: 16, lineHeight: 22,
  },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 10, paddingBottom: 16 },

  // Feat card
  featCard: {
    backgroundColor: WHITE,
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  featCardClaimed: { opacity: 0.45 },
  featLeft:        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  featIcon:        { fontSize: 26, width: 32, textAlign: 'center' },
  featInfo:        { flex: 1, gap: 3 },
  featTitle:       { fontSize: 14, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  featDesc:        { fontSize: 13, fontFamily: 'Volte-Medium',   color: TEXT_MUTED },
  featProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  featTrack:       { flex: 1, height: 5, borderRadius: 3, backgroundColor: BG_CREAM, overflow: 'hidden' },
  featFill:        { height: 5, borderRadius: 3, backgroundColor: BRAND_PURPLE },
  featCount:       { fontSize: 11, fontFamily: 'Volte-Medium', color: TEXT_MUTED },

  // Success sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 12,
  },
  sheetHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 8 },
  sheetContent:  { padding: 24, alignItems: 'center', gap: 10 },
  sheetEmoji:    { fontSize: 52, marginBottom: 4 },
  sheetTitle:    { fontSize: 22, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  sheetSubtitle: { fontSize: 14, fontFamily: 'Volte-Medium', color: TEXT_MUTED, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  sheetCTA: {
    width: '100%', backgroundColor: BRAND_PURPLE,
    borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
  sheetCTAText:     { fontSize: 16, fontFamily: 'Volte-Semibold', color: WHITE },
  sheetDismiss:     { paddingVertical: 12 },
  sheetDismissText: { fontSize: 14, fontFamily: 'Volte-Medium', color: TEXT_MUTED },

  // Claim button
  claimBtn: {
    backgroundColor: BRAND_PURPLE,
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
    alignItems: 'center', minWidth: 70,
  },
  claimBtnDisabled: { backgroundColor: BORDER },
  claimBtnClaimed:  { backgroundColor: PURPLE_LIGHT },
  claimBtnText:         { fontSize: 13, fontFamily: 'Volte-Semibold', color: WHITE },
  claimBtnTextDisabled: { color: TEXT_MUTED },
  claimBtnTextClaimed:  { color: BRAND_PURPLE },
});
