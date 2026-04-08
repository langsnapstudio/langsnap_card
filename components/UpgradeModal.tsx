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
  { icon: '🎨', text: '500+ studio-illustrated flashcards' },
  { icon: '🔓', text: 'Unlock all levels (Lv. 3 and above)' },
  { icon: '🧠', text: 'More ways to remember vocabulary' },
  { icon: '📝', text: 'Exclusive mock test content' },
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

        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={22} color={TEXT_MUTED} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ── Crown hero ─────────────────────────────────────────────── */}
          <View style={styles.hero}>
            <View style={styles.crownCircle}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
            <Text style={styles.heroTitle}>Go Premium</Text>
            <Text style={styles.heroSubtitle}>
              Unlock everything and build your vocabulary faster
            </Text>
          </View>

          {/* ── Benefits ───────────────────────────────────────────────── */}
          <View style={styles.benefitsCard}>
            {BENEFITS.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>{b.icon}</Text>
                <Text style={styles.benefitText}>{b.text}</Text>
                <Ionicons name="checkmark-circle" size={18} color={BRAND_PURPLE} />
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
                  style={[styles.planCard, selected && styles.planCardSelected, plan.highlight && !selected && styles.planCardHighlight]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <View style={[styles.planBadge, selected && styles.planBadgeSelected]}>
                      <Text style={[styles.planBadgeText, selected && styles.planBadgeTextSelected]}>
                        {plan.badge}
                      </Text>
                    </View>
                  )}

                  <View style={styles.planContent}>
                    <View style={styles.planLeft}>
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected && <View style={styles.radioDot} />}
                      </View>
                      <View>
                        <Text style={[styles.planLabel, selected && styles.planLabelSelected]}>
                          {plan.label}
                        </Text>
                        <Text style={styles.planPerMonth}>{plan.perMonth}</Text>
                      </View>
                    </View>
                    <Text style={[styles.planPrice, selected && styles.planPriceSelected]}>
                      {plan.price}
                    </Text>
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

          <Text style={styles.legalText}>
            Subscription renews automatically. Cancel anytime in your App Store settings.
            By subscribing you agree to our Terms of Use and Privacy Policy.
          </Text>

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
  closeBtn: {
    position: 'absolute', top: 16, right: 20, zIndex: 10,
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
    padding: 16, marginBottom: 20, gap: 12,
  },
  benefitRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  benefitText: { flex: 1, fontSize: 14, fontFamily: 'Volte-Medium', color: TEXT_DARK },

  // Plans
  plansWrap: { gap: 10, marginBottom: 20 },
  planCard: {
    borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: WHITE, overflow: 'hidden',
  },
  planCardSelected:  { borderColor: BRAND_PURPLE, backgroundColor: PURPLE_LIGHT },
  planCardHighlight: { borderColor: BRAND_PURPLE },

  planBadge: {
    backgroundColor: PURPLE_LIGHT,
    paddingHorizontal: 12, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  planBadgeSelected:     { backgroundColor: BRAND_PURPLE },
  planBadgeText:         { fontSize: 11, fontFamily: 'Volte-Semibold', color: BRAND_PURPLE },
  planBadgeTextSelected: { color: WHITE },

  planContent:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  planLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  radioSelected:{ borderColor: BRAND_PURPLE },
  radioDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND_PURPLE },

  planLabel:         { fontSize: 15, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  planLabelSelected: { color: BRAND_PURPLE },
  planPerMonth:      { fontSize: 12, fontFamily: 'Volte-Medium', color: TEXT_MUTED, marginTop: 1 },
  planPrice:         { fontSize: 16, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
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
  legalText:   { fontSize: 11, fontFamily: 'Volte', color: TEXT_MUTED, textAlign: 'center', lineHeight: 17 },
});
