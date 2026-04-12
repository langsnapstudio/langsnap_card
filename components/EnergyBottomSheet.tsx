import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getEnergyState, getCountdownString } from '@/constants/energy-store';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const PURPLE_LIGHT = '#EDE9F5';
const BG_CREAM     = '#F8F5EF';
const WHITE        = '#FFFFFF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#525252';
const AMBER        = '#F59E0B';
const BORDER       = '#E8E5DF';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function EnergyBottomSheet({ visible, onClose }: Props) {
  const router = useRouter();

  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  // Refresh countdown every 30s while open
  const [, tick] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => tick(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const energy  = getEnergyState();
  const isEmpty = energy.timeLimited === 0 && energy.noTimeLimit === 0;
  const countdown = getCountdownString(energy.nextRefillAt);

  function handleGoToChallenges() {
    onClose();
    setTimeout(() => router.push('/profile/challenges'), 300);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />

        {isEmpty ? <EmptyState countdown={countdown} onGoToChallenges={handleGoToChallenges} onClose={onClose} />
                 : <NormalState energy={energy} countdown={countdown} onClose={onClose} />}

        <View style={styles.bottomPad} />
      </Animated.View>
    </Modal>
  );
}

// ── Normal state ───────────────────────────────────────────────────────────────
function NormalState({ energy, countdown, onClose }: {
  energy: ReturnType<typeof getEnergyState>;
  countdown: string;
  onClose: () => void;
}) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Your energy</Text>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={22} color={TEXT_MUTED} />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Use energy to unlock new flashcard packs</Text>

      <View style={styles.energyRow}>
        {/* Time-limited energy */}
        <View style={[styles.energyTile, { backgroundColor: '#FEF3C7' }]}>
          <View style={styles.energyTileInner}>
            <Ionicons name="flash" size={22} color={AMBER} />
            <Text style={styles.energyCount}>{energy.timeLimited}</Text>
          </View>
          <Text style={styles.energyLabel}>Daily energy</Text>
          <View style={styles.refillBadge}>
            <Ionicons name="time-outline" size={11} color={TEXT_MUTED} />
            <Text style={styles.refillText}>Refills in {countdown}</Text>
          </View>
        </View>

        {/* No-time-limit energy */}
        <View style={[styles.energyTile, { backgroundColor: PURPLE_LIGHT }]}>
          <View style={styles.energyTileInner}>
            <Ionicons name="flash" size={22} color={BRAND_PURPLE} />
            <Text style={styles.energyCount}>{energy.noTimeLimit}</Text>
          </View>
          <Text style={styles.energyLabel}>Bonus energy</Text>
          <View style={styles.refillBadge}>
            <Ionicons name="infinite-outline" size={11} color={TEXT_MUTED} />
            <Text style={styles.refillText}>No expiry</Text>
          </View>
        </View>
      </View>

      {/* How to earn */}
      <Text style={styles.howToEarnHeader}>How to earn</Text>
      <View style={styles.bulletRows}>
        <View style={styles.bulletRow}>
          <View style={styles.bulletIcon}>
            <Ionicons name="time-outline" size={18} color={BRAND_PURPLE} />
          </View>
          <View style={styles.bulletText}>
            <Text style={styles.bulletTitle}>Daily refill</Text>
            <Text style={styles.bulletDesc}>Refills automatically every 24 hours.</Text>
          </View>
        </View>
        <View style={styles.bulletRow}>
          <View style={styles.bulletIcon}>
            <Ionicons name="trophy-outline" size={18} color={BRAND_PURPLE} />
          </View>
          <View style={styles.bulletText}>
            <Text style={styles.bulletTitle}>Earn more from challenges</Text>
            <Text style={styles.bulletDesc}>Complete challenges to earn bonus energy.</Text>
          </View>
        </View>
        <View style={styles.bulletRow}>
          <View style={styles.bulletIcon}>
            <Ionicons name="star-outline" size={18} color={BRAND_PURPLE} />
          </View>
          <View style={styles.bulletText}>
            <Text style={styles.bulletTitle}>Go Premium for more</Text>
            <Text style={styles.bulletDesc}>Get 3 bonus energy per renewal.</Text>
          </View>
        </View>
      </View>
    </>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ countdown, onGoToChallenges, onClose }: {
  countdown: string;
  onGoToChallenges: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>You're out of energy</Text>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={22} color={TEXT_MUTED} />
        </TouchableOpacity>
      </View>

      <View style={styles.emptyContent}>
        {/* Empty energy icon */}
        <View style={styles.emptyIconWrap}>
          <Ionicons name="flash-off" size={40} color={TEXT_MUTED} />
        </View>

        <Text style={styles.emptyTitle}>No energy left</Text>
        <Text style={styles.emptyBody}>
          Your daily energy refills in{' '}
          <Text style={styles.emptyCountdown}>{countdown}</Text>
        </Text>

        {/* Countdown bar */}
        <View style={styles.countdownBar}>
          <View style={styles.countdownFill} />
        </View>

        <Text style={styles.emptyHint}>
          Or earn bonus energy instantly by completing Challenges — no waiting needed.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.challengesBtn}
        activeOpacity={0.85}
        onPress={onGoToChallenges}
      >
        <Ionicons name="trophy-outline" size={18} color={WHITE} />
        <Text style={styles.challengesBtnText}>Go to Challenges</Text>
      </TouchableOpacity>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: BORDER, alignSelf: 'center', marginBottom: 20,
  },
  bottomPad: { height: 36 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 6,
  },
  title:    { fontSize: 18, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  subtitle: { fontSize: 14, fontFamily: 'Volte-Medium', color: TEXT_MUTED, marginBottom: 24 },

  // Normal state — energy tiles
  energyRow:       { flexDirection: 'row', gap: 12, marginBottom: 20 },
  energyTile:      { flex: 1, borderRadius: 16, padding: 16, gap: 6 },
  energyTileInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  energyCount:      { fontSize: 36, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  energyLabel:      { fontSize: 16, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  refillBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refillText:       { fontSize: 12, fontFamily: 'Volte-Medium', color: TEXT_MUTED },

  howToEarnHeader: { fontSize: 16, fontFamily: 'Volte-Semibold', color: TEXT_MUTED, letterSpacing: 0.5, marginTop: 24, marginBottom: 16 },

  bulletRows: { gap: 20 },
  bulletRow:  { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  bulletIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDE9F5', alignItems: 'center', justifyContent: 'center' },
  bulletText: { flex: 1 },
  bulletTitle:{ fontSize: 14, fontFamily: 'Volte-Semibold', color: TEXT_DARK, marginBottom: 2 },
  bulletDesc: { fontSize: 13, fontFamily: 'Volte', color: TEXT_MUTED, lineHeight: 18 },

  // Empty state
  emptyContent:   { alignItems: 'center', paddingVertical: 8, gap: 8, marginBottom: 24 },
  emptyIconWrap:  {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: BG_CREAM,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle:     { fontSize: 18, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  emptyBody:      { fontSize: 15, fontFamily: 'Volte-Medium', color: TEXT_MUTED, textAlign: 'center' },
  emptyCountdown: { fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  countdownBar:   { width: '100%', height: 6, borderRadius: 3, backgroundColor: BG_CREAM, overflow: 'hidden', marginVertical: 4 },
  countdownFill:  { width: '35%', height: 6, borderRadius: 3, backgroundColor: AMBER },
  emptyHint:      { fontSize: 13, fontFamily: 'Volte-Medium', color: TEXT_MUTED, textAlign: 'center', lineHeight: 20 },

  challengesBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: BRAND_PURPLE,
    borderRadius: 16, paddingVertical: 16,
  },
  challengesBtnText: { fontSize: 16, fontFamily: 'Volte-Semibold', color: WHITE },
});
