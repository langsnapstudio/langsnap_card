import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE  = '#7D69AB';
const PURPLE_LIGHT  = '#EDE9F5';
const PURPLE_DARK   = '#5C4D8A';
const WHITE         = '#FFFFFF';
const TEXT_DARK     = '#262626';
const TEXT_MUTED    = '#9097A3';
const BG_CREAM      = '#F8F5EF';
const BORDER        = '#E8E5DF';
const AMBER         = '#F59E0B';

// ── Pricing plans ─────────────────────────────────────────────────────────────
const PLANS = [
  { id: 'yearly',   label: 'Yearly',    badge: 'Best value', price: '฿2,029', perMonth: '฿169/mo',  highlight: true  },
  { id: 'quarter',  label: '3 Months',  badge: 'Save 16%',   price: '฿629',   perMonth: '฿209/mo',  highlight: false },
  { id: 'monthly',  label: 'Monthly',   badge: null,         price: '฿249',   perMonth: '฿249/mo',  highlight: false },
];

// ── Benefits ──────────────────────────────────────────────────────────────────
const BENEFITS = [
  { icon: '🎨', text: '500+ illustrated flashcards, all levels unlocked' },
  { icon: '🎮', text: 'More fun ways to practice — games, quizzes & more' },
  { icon: '📝', text: 'Exclusive decks and content, just for Premium' },
];

// ── Types ──────────────────────────────────────────────────────────────────────
type Props = {
  visible:  boolean;
  onClose:  () => void;
  onSubscribe?: (planId: string) => void;
};

export default function UpgradeModal({ visible, onClose, onSubscribe }: Props) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const [selectedPlan, setSelectedPlan] = React.useState('yearly');

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
    onClose();
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


        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ── Crown hero ─────────────────────────────────────────────── */}
          <View style={styles.hero}>
            <View style={styles.crownCircle}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
            <Text style={styles.heroTitle}>Go Premium</Text>
            <Text style={styles.heroSubtitle}>
              Full access to every deck, pack, and level
            </Text>
          </View>

          {/* ── Benefits ───────────────────────────────────────────────── */}
          <View style={styles.benefitsCard}>
            {BENEFITS.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>{b.icon}</Text>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>

          {/* ── Plan selector ──────────────────────────────────────────── */}
          <View style={styles.plansWrap}>
            {PLANS.map(plan => {
              const selected = selectedPlan === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, selected && styles.planCardSelected]}
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
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Subscribe button ───────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.subscribeBtn}
            activeOpacity={0.85}
            onPress={handleSubscribe}
          >
            <Text style={styles.subscribeBtnText}>Subscribe now</Text>
          </TouchableOpacity>

          {/* ── Restore + legal ────────────────────────────────────────── */}
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
    padding: 16, marginBottom: 20, gap: 18,
  },
  benefitRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  benefitText: { flex: 1, fontSize: 14, fontFamily: 'Volte-Medium', color: TEXT_DARK },

  // Plans
  plansWrap: { flexDirection: 'row', gap: 10, marginBottom: 20, alignItems: 'stretch' },
  planCard: {
    flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: WHITE, overflow: 'hidden',
  },
  planCardSelected: { borderColor: BRAND_PURPLE, backgroundColor: PURPLE_LIGHT },

  planBadge: {
    backgroundColor: BRAND_PURPLE,
    paddingHorizontal: 8, paddingVertical: 4,
    alignItems: 'center',
  },
  planBadgePlaceholder:  { height: 24 },
  planBadgeSelected:     { backgroundColor: BRAND_PURPLE },
  planBadgeText:         { fontSize: 11, fontFamily: 'Volte-Semibold', color: WHITE },
  planBadgeTextSelected: { color: WHITE },

  planContent:  { padding: 12, paddingVertical: 16, alignItems: 'flex-start' },
  planLabel:         { fontSize: 14, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  planLabelSelected: { color: BRAND_PURPLE },
  planPerMonth:      { fontSize: 11, fontFamily: 'Volte-Medium', color: TEXT_MUTED, marginTop: 2 },
  planPrice:         { fontSize: 16, fontFamily: 'Volte-Semibold', color: TEXT_DARK, marginTop: 16 },
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
