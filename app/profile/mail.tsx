import React, { useState, useRef, useEffect } from 'react';
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
import { getGifts, claimGift, isGiftExpired, GIFT_REASON_ICON } from '@/constants/gift-store';
import type { Gift } from '@/constants/gift-store';
import { useSheetDismiss } from '@/hooks/useSheetDismiss';

const SCREEN_WIDTH  = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE  = '#7D69AB';
const PURPLE_LIGHT  = '#EDE9F5';
const BG_CREAM      = '#F8F5EF';
const WHITE         = '#FFFFFF';
const TEXT_DARK     = '#262626';
const TEXT_MUTED    = '#525252';
const BORDER        = '#E8E5DF';

// ── Confetti (same as Challenges screen) ────────────────────────────────────────
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

// ── Claim success sheet (same pattern as Challenges) ────────────────────────────
function ClaimSuccessSheet({ visible, reward, onClose }: {
  visible: boolean; reward: number; onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const soundRef  = useRef<Audio.Sound | null>(null);
  const { dragY, panHandlers } = useSheetDismiss(onClose);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(400);
      dragY.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 55, useNativeDriver: true }),
      ]).start();

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

      <Animated.View style={[styles.sheet, { transform: [{ translateY: Animated.add(slideAnim, dragY) }] }]} {...panHandlers}>
        <View style={styles.sheetHandle} />
        <TouchableOpacity style={styles.sheetCloseBtn} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={22} color="#262626" />
        </TouchableOpacity>

        <View style={styles.sheetContent}>
          <Text style={styles.sheetEmoji}>⚡</Text>
          <Text style={styles.sheetTitle}>+{reward} energy received!</Text>
          <Text style={styles.sheetSubtitle}>
            Use your energy to unlock new packs and keep your learning going.
          </Text>
          <TouchableOpacity style={styles.sheetDismiss} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.sheetDismissText}>Nice!</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {visible && <Confetti />}
    </Modal>
  );
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function sortGifts(gifts: Gift[]): Gift[] {
  const claimable = gifts.filter(g => g.status === 'unclaimed' && !isGiftExpired(g));
  const expired    = gifts.filter(g => g.status === 'unclaimed' && isGiftExpired(g));
  const claimed    = gifts.filter(g => g.status === 'claimed');
  return [...claimable, ...expired, ...claimed];
}

// ── Gift card ──────────────────────────────────────────────────────────────────
function GiftCard({ gift, onClaim }: { gift: Gift; onClaim: (id: string) => void }) {
  const expired    = isGiftExpired(gift);
  const claimable  = gift.status === 'unclaimed' && !expired;
  const dimmed     = gift.status === 'claimed' || expired;

  return (
    <View style={[styles.giftCard, dimmed && styles.giftCardDimmed]}>
      <View style={styles.giftLeft}>
        <Text style={styles.giftIcon}>{GIFT_REASON_ICON[gift.reason]}</Text>
        <View style={styles.giftInfo}>
          <Text style={styles.giftTitle}>{gift.title}</Text>
          <Text style={styles.giftBody} numberOfLines={2}>{gift.body}</Text>
          <View style={styles.giftMetaRow}>
            <Text style={styles.giftMeta}>+{gift.energy_amount} ⚡</Text>
            <Text style={styles.giftMetaDot}>·</Text>
            <Text style={styles.giftMeta}>{timeAgo(gift.created_at)}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.claimBtn,
          gift.status === 'claimed' && styles.claimBtnClaimed,
          expired && styles.claimBtnExpired,
          !claimable && gift.status !== 'claimed' && !expired && styles.claimBtnDisabled,
        ]}
        activeOpacity={claimable ? 0.8 : 1}
        onPress={() => claimable && onClaim(gift.id)}
        disabled={!claimable}
      >
        <Text style={[
          styles.claimBtnText,
          gift.status === 'claimed' && styles.claimBtnTextClaimed,
          expired && styles.claimBtnTextExpired,
        ]}>
          {gift.status === 'claimed' ? 'Claimed' : expired ? 'Expired' : 'Claim'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function MailScreen() {
  const router = useRouter();
  const [gifts, setGifts]           = useState<Gift[]>([]);
  const [loading, setLoading]       = useState(true);
  const [sheetVisible, setSheet]    = useState(false);
  const [claimedReward, setReward]  = useState(0);

  useEffect(() => {
    getGifts().then(g => { setGifts(g); setLoading(false); });
  }, []);

  const sorted = sortGifts(gifts);

  async function handleClaim(id: string) {
    const reward = await claimGift(id);
    if (reward === 0) return; // already claimed, expired, or a network/claim race
    setGifts(prev => prev.map(g => g.id === id ? { ...g, status: 'claimed' as const } : g));
    setReward(reward);
    setSheet(true);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Mail</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!loading && sorted.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📬</Text>
            <Text style={styles.emptyTitle}>No mail yet</Text>
            <Text style={styles.emptySubtitle}>Gifts from Langsnap will show up here.</Text>
          </View>
        ) : (
          sorted.map(gift => (
            <GiftCard key={gift.id} gift={gift} onClaim={handleClaim} />
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      <ClaimSuccessSheet
        visible={sheetVisible}
        reward={claimedReward}
        onClose={() => setSheet(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG_CREAM },

  navBar:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:  { width: 32 },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Volte-Semibold', color: TEXT_DARK },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 10, paddingBottom: 16, paddingTop: 4 },

  emptyState:    { alignItems: 'center', paddingTop: 80, gap: 6 },
  emptyIcon:     { fontSize: 44, marginBottom: 8 },
  emptyTitle:    { fontSize: 16, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  emptySubtitle: { fontSize: 13, fontFamily: 'Volte-Medium', color: TEXT_MUTED },

  // Gift card
  giftCard: {
    backgroundColor: WHITE,
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  giftCardDimmed: { opacity: 0.5 },
  giftLeft:       { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  giftIcon:       { fontSize: 26, width: 32, textAlign: 'center' },
  giftInfo:       { flex: 1, gap: 3 },
  giftTitle:      { fontSize: 14, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  giftBody:       { fontSize: 13, fontFamily: 'Volte-Medium', color: TEXT_MUTED },
  giftMetaRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  giftMeta:       { fontSize: 11, fontFamily: 'Volte-Medium', color: TEXT_MUTED },
  giftMetaDot:    { fontSize: 11, color: TEXT_MUTED },

  // Claim button
  claimBtn: {
    backgroundColor: BRAND_PURPLE,
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
    alignItems: 'center', minWidth: 70,
  },
  claimBtnDisabled: { backgroundColor: BORDER },
  claimBtnClaimed:  { backgroundColor: PURPLE_LIGHT },
  claimBtnExpired:  { backgroundColor: '#F5F5F5' },
  claimBtnText:         { fontSize: 13, fontFamily: 'Volte-Semibold', color: WHITE },
  claimBtnTextClaimed:  { color: BRAND_PURPLE },
  claimBtnTextExpired:  { color: TEXT_MUTED },

  // Success sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 12,
  },
  sheetHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 8 },
  sheetCloseBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  sheetContent:  { padding: 24, alignItems: 'center', gap: 10 },
  sheetEmoji:    { fontSize: 52, marginBottom: 4 },
  sheetTitle:    { fontSize: 22, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  sheetSubtitle: { fontSize: 14, fontFamily: 'Volte-Medium', color: TEXT_MUTED, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  sheetDismiss:     { width: '100%', backgroundColor: BRAND_PURPLE, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  sheetDismissText: { fontSize: 16, fontFamily: 'Volte-Semibold', color: WHITE },
});
