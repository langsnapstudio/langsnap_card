import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSheetDismiss } from '@/hooks/useSheetDismiss';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE  = '#7D69AB';
const PURPLE_LIGHT  = '#EDE9F5';
const WHITE         = '#FFFFFF';
const TEXT_DARK     = '#262626';
const TEXT_MUTED    = '#525252';
const BG_CREAM      = '#F8F5EF';
const BORDER        = '#E8E5DF';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Pricing plans ─────────────────────────────────────────────────────────────
const PLANS = [
  { id: 'yearly',   label: 'Yearly',   badge: 'Best value', price: '฿2,508', perMonth: '฿209/mo', saving: 'Save 28%' },
  { id: 'quarter',  label: '3 Months', badge: null,         price: '฿747',   perMonth: '฿249/mo', saving: 'Save 14%' },
  { id: 'monthly',  label: 'Monthly',  badge: null,         price: '฿289',   perMonth: '฿289/mo', saving: null       },
];

// ── Benefits ──────────────────────────────────────────────────────────────────
const BENEFITS = [
  { icon: '🎨', text: 'All levels unlocked across every deck' },
  { icon: '🎵', text: 'Auto-play, games & quizzes' },
  { icon: '⚡', text: '+3 bonus energy on every renewal' },
  { icon: '🧊', text: '2 streak freezes' },
  { icon: '📝', text: 'Exclusive decks, just for Premium' },
];

// ── Confetti ──────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#4F8EF7', '#FF6B6B', '#FFD93D', '#6BCB77', '#C77DFF', '#FF9F1C', '#FF9AD5'];
const CONFETTI_COUNT  = 60;

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
    duration:   2400 + Math.random() * 2000,
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

// ── Premium Success Sheet ─────────────────────────────────────────────────────
function PremiumSuccessSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const soundRef  = useRef<Audio.Sound | null>(null);
  const { dragY, panHandlers } = useSheetDismiss(onClose);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(500);
      dragY.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 55, useNativeDriver: true }),
      ]).start();

      // Play success sound
      // TODO: swap to require('@/assets/audio/success.wav') once file is added
      (async () => {
        try {
          await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
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
        Animated.timing(slideAnim, { toValue: 500, duration: 180, useNativeDriver: true }),
      ]).start();
      soundRef.current?.unloadAsync();
    }

    return () => { soundRef.current?.unloadAsync(); };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim }]} />

      <Animated.View style={[successStyles.sheet, { transform: [{ translateY: Animated.add(slideAnim, dragY) }] }]} {...panHandlers}>
        <View style={successStyles.handle} />
        <TouchableOpacity style={successStyles.closeBtn} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={22} color="#262626" />
        </TouchableOpacity>

        {/* Crown */}
        <View style={successStyles.crownWrap}>
          <Text style={successStyles.crownEmoji}>👑</Text>
        </View>

        <Text style={successStyles.title}>You're now Premium!</Text>
        <Text style={successStyles.subtitle}>
          Welcome to the full Langsnap experience. Every deck, every level, every word — it's all yours.
        </Text>

        {/* Benefit pills — 3 top row, 2 bottom row */}
        <View style={{ gap: 8, marginTop: 8, marginBottom: 32 }}>
          <View style={successStyles.pillsRow}>
            <View style={successStyles.pill}><Text style={successStyles.pillText}>⚡ More energy</Text></View>
            <View style={successStyles.pill}><Text style={successStyles.pillText}>🎵 Auto-play</Text></View>
            <View style={successStyles.pill}><Text style={successStyles.pillText}>🔓 All levels</Text></View>
          </View>
          <View style={successStyles.pillsRow}>
            <View style={successStyles.pill}><Text style={successStyles.pillText}>🧊 Extra freeze</Text></View>
            <View style={successStyles.pill}><Text style={successStyles.pillText}>✨ Exclusive content</Text></View>
          </View>
        </View>

        <TouchableOpacity style={successStyles.ctaBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={successStyles.ctaBtnText}>Enjoy Premium 🎉</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Confetti on top of the sheet */}
      {visible && <Confetti />}
    </Modal>
  );
}

const successStyles = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 48, paddingTop: 12,
    alignItems: 'center',
  },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, marginBottom: 24, alignSelf: 'center' },
  closeBtn:   { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  crownWrap:  { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  crownEmoji: { fontSize: 40 },
  title:      { fontSize: 24, fontFamily: 'Volte-Semibold', color: TEXT_DARK, textAlign: 'center', marginBottom: 12 },
  subtitle:   { fontSize: 15, fontFamily: 'Volte', color: TEXT_MUTED, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  pillsRow:   { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  pill:       { backgroundColor: PURPLE_LIGHT, borderRadius: 20, paddingHorizontal: 14, paddingTop: 4, paddingBottom: 8 },
  pillText:   { fontSize: 13, fontFamily: 'Volte-Semibold', color: BRAND_PURPLE },
  ctaBtn:     { width: '100%', height: 56, borderRadius: 16, backgroundColor: BRAND_PURPLE, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText: { fontSize: 17, fontFamily: 'Volte-Semibold', color: WHITE },
});

// ── Types ──────────────────────────────────────────────────────────────────────
type Props = {
  visible:  boolean;
  onClose:  () => void;
  onSubscribe?: (planId: string) => void;
};

// ── Upgrade Modal ─────────────────────────────────────────────────────────────
export default function UpgradeModal({ visible, onClose, onSubscribe }: Props) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const [selectedPlan,   setSelectedPlan]   = React.useState('yearly');
  const [showSuccess,    setShowSuccess]    = React.useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 55, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 600, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function handleSubscribe() {
    onSubscribe?.(selectedPlan);
    // Animate out then close the modal and show success
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 600, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      onClose();
      setShowSuccess(true);
    });
  }

  function handleSuccessClose() {
    setShowSuccess(false);
  }

  return (
    <>
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
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={TEXT_DARK} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            {/* ── Crown hero ───────────────────────────────────────────── */}
            <View style={styles.hero}>
              <View style={styles.crownCircle}>
                <Text style={styles.crownEmoji}>👑</Text>
              </View>
              <Text style={styles.heroTitle}>Go Premium</Text>
              <Text style={styles.heroSubtitle}>
                Full access to every deck, pack, and level
              </Text>
            </View>

            {/* ── Benefits ─────────────────────────────────────────────── */}
            <View style={styles.benefitsCard}>
              {BENEFITS.map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <Text style={styles.benefitIcon}>{b.icon}</Text>
                  <Text style={styles.benefitText}>{b.text}</Text>
                </View>
              ))}
            </View>

            {/* ── Plan selector ────────────────────────────────────────── */}
            <View style={styles.plansWrap}>
              {PLANS.map(plan => {
                const selected = selectedPlan === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[styles.planCard, selected && styles.planCardSelected, !!plan.badge && styles.planCardHasBadge]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPlan(plan.id)}
                  >
                    {plan.badge ? (
                      <View style={[styles.planBadge, selected && styles.planBadgeSelected]}>
                        <Text style={[styles.planBadgeText, selected && styles.planBadgeTextSelected]}>
                          {plan.badge}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.planBadgePlaceholder} />
                    )}
                    <View style={styles.planContent}>
                      <Text style={[styles.planLabel, selected && styles.planLabelSelected]}>
                        {plan.label}
                      </Text>
                      <Text style={[styles.planPrice, selected && styles.planPriceSelected]}>
                        {plan.price}
                      </Text>
                      <Text style={styles.planPerMonth}>{plan.perMonth}</Text>
                      {plan.saving && (
                        <Text style={[styles.planSaving, selected && styles.planSavingSelected]}>
                          {plan.saving}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Subscribe button ──────────────────────────────────────── */}
            <TouchableOpacity
              style={styles.subscribeBtn}
              activeOpacity={0.85}
              onPress={handleSubscribe}
            >
              <Text style={styles.subscribeBtnText}>Subscribe now</Text>
            </TouchableOpacity>

            {/* ── Restore + legal ───────────────────────────────────────── */}
            <TouchableOpacity style={styles.restoreBtn} activeOpacity={0.7}>
              <Text style={styles.restoreText}>Restore purchase</Text>
            </TouchableOpacity>

            <View style={styles.legalRow}>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.legalLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.legalDot}>•</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </Animated.View>
      </Modal>

      {/* Premium success sheet — shown after subscription */}
      <PremiumSuccessSheet
        visible={showSuccess}
        onClose={handleSuccessClose}
      />
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 12,
    maxHeight: '92%',
  },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: BORDER, alignSelf: 'center', marginBottom: 8,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

  // Hero
  hero:         { alignItems: 'center', paddingTop: 16, paddingBottom: 24, gap: 10 },
  crownCircle:  {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  crownEmoji:   { fontSize: 36 },
  heroTitle:    { fontSize: 24, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  heroSubtitle: { fontSize: 15, fontFamily: 'Volte-Medium', color: TEXT_MUTED, textAlign: 'center', lineHeight: 22 },

  // Benefits
  benefitsCard: {
    backgroundColor: BG_CREAM, borderRadius: 16,
    padding: 16, marginBottom: 20, gap: 16,
  },
  benefitRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  benefitText: { flex: 1, fontSize: 14, fontFamily: 'Volte-Medium', color: TEXT_DARK, lineHeight: 18 },

  // Plans
  plansWrap: { flexDirection: 'row', gap: 10, marginBottom: 20, alignItems: 'stretch' },
  planCard: {
    flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: WHITE, overflow: 'hidden',
  },
  planCardSelected:  { borderColor: BRAND_PURPLE, backgroundColor: PURPLE_LIGHT },
  planCardHasBadge:  { borderTopWidth: 0 },

  planBadge: {
    backgroundColor: BRAND_PURPLE,
    height: 26, alignItems: 'center', justifyContent: 'center',
  },
  planBadgePlaceholder:  { height: 26 },
  planBadgeSelected:     { backgroundColor: BRAND_PURPLE },
  planBadgeText:         { fontSize: 14, fontFamily: 'Volte-Semibold', color: WHITE },
  planBadgeTextSelected: { color: WHITE },

  planContent:       { padding: 12, paddingVertical: 16, alignItems: 'flex-start' },
  planLabel:         { fontSize: 14, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  planLabelSelected: { color: BRAND_PURPLE },
  planPerMonth:      { fontSize: 12, fontFamily: 'Volte-Medium', color: TEXT_MUTED, marginTop: 2 },
  planSaving:        { fontSize: 12, fontFamily: 'Volte-Semibold', color: '#3DAB69', marginTop: 2 },
  planSavingSelected:{ color: '#3DAB69' },
  planPrice:         { fontSize: 20, fontFamily: 'Volte-Semibold', color: TEXT_DARK, marginTop: 8 },
  planPriceSelected: { color: BRAND_PURPLE },

  // Subscribe button
  subscribeBtn: {
    backgroundColor: BRAND_PURPLE, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  subscribeBtnText: { fontSize: 17, fontFamily: 'Volte-Semibold', color: WHITE },

  // Restore + legal
  restoreBtn:  { alignItems: 'center', paddingVertical: 8, marginBottom: 12 },
  restoreText: { fontSize: 14, fontFamily: 'Volte-Medium', color: TEXT_MUTED },
  legalRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
  legalLink:   { fontSize: 13, fontFamily: 'Volte-Medium', color: BRAND_PURPLE },
  legalDot:    { fontSize: 13, color: TEXT_MUTED },
});
