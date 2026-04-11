import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DECK_DATA } from '@/constants/mock-packs';
import type { PackMeta, DeckMeta } from '@/constants/mock-packs';
import { setCurrentPack } from '@/constants/pack-store';
import UpgradeModal from '@/components/UpgradeModal';

const ENERGY_EXPLAINER_KEY = 'hasSeenEnergyExplainer';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const BG_CREAM     = '#F8F5EF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';
const WHITE        = '#FFFFFF';

// Fallback for decks not in the map
const DEFAULT_DECK: DeckMeta = {
  title: 'Deck', subtitle: '', wordCount: 0,
  cover:        require('@/assets/images/deck_cover_animals.png'),
  packBagImage: require('@/assets/images/pack_bag_animals.png'),
  packs: [
    {
      id: 'lv1', level: 1, cardCount: 0,
      thumbnail: require('@/assets/images/illustration-dog.png'),
      energyCost: 0, isLocked: false, isPremium: false,
      cards: [],
    },
  ],
};

// ── Redemption Bottom Sheet ────────────────────────────────────────────────────
function RedemptionSheet({
  visible, pack, deckTitle, onCancel, onConfirm,
}: {
  visible: boolean;
  pack: PackMeta | null;
  deckTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 500, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!pack) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Close */}
        <TouchableOpacity style={styles.sheetClose} onPress={onCancel} hitSlop={12}>
          <Ionicons name="close" size={22} color={TEXT_DARK} />
        </TouchableOpacity>

        <Text style={styles.sheetTitle}>Lv. {pack.level}</Text>

        {/* Pack preview card */}
        <View style={styles.sheetPreview}>
          <Image source={pack.thumbnail} style={styles.sheetThumb} resizeMode="contain" />
          <View>
            <Text style={styles.sheetPreviewLevel}>Lv. {pack.level}</Text>
            <Text style={styles.sheetPreviewCards}>{pack.cardCount} cards</Text>
          </View>
        </View>

        {/* Confirmation text */}
        <Text style={styles.sheetMessage}>
          {pack.energyCost > 0
            ? `Opening this pack needs ⚡${pack.energyCost}\nDo you want to proceed?`
            : `Start learning ${deckTitle} Lv. ${pack.level}?`}
        </Text>

        {/* Buttons */}
        <View style={styles.sheetButtons}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.85}>
            <Text style={styles.confirmBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ── Energy Explainer Sheet ─────────────────────────────────────────────────────
function EnergyExplainerSheet({
  visible, onDismiss,
}: {
  visible: boolean; onDismiss: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 500, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Icon */}
        <View style={exStyles.iconWrap}>
          <Text style={exStyles.iconEmoji}>⚡</Text>
        </View>

        <Text style={exStyles.title}>How energy works</Text>
        <Text style={exStyles.subtitle}>
          Energy is needed to open new packs and start learning.
        </Text>

        {/* Three bullet rows */}
        <View style={exStyles.rows}>
          <View style={exStyles.row}>
            <View style={exStyles.rowIcon}>
              <Ionicons name="time-outline" size={20} color={BRAND_PURPLE} />
            </View>
            <View style={exStyles.rowText}>
              <Text style={exStyles.rowTitle}>Daily refill</Text>
              <Text style={exStyles.rowDesc}>Your energy refills automatically every 24 hours.</Text>
            </View>
          </View>

          <View style={exStyles.row}>
            <View style={exStyles.rowIcon}>
              <Ionicons name="trophy-outline" size={20} color={BRAND_PURPLE} />
            </View>
            <View style={exStyles.rowText}>
              <Text style={exStyles.rowTitle}>Earn more from challenges</Text>
              <Text style={exStyles.rowDesc}>Complete challenges on your profile to earn bonus energy with no expiry.</Text>
            </View>
          </View>

          <View style={exStyles.row}>
            <View style={exStyles.rowIcon}>
              <Ionicons name="flash-outline" size={20} color={BRAND_PURPLE} />
            </View>
            <View style={exStyles.rowText}>
              <Text style={exStyles.rowTitle}>Free packs cost nothing</Text>
              <Text style={exStyles.rowDesc}>Some packs are free — no energy needed to open them.</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={exStyles.btn} onPress={onDismiss} activeOpacity={0.85}>
          <Text style={exStyles.btnText}>Got it!</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const exStyles = StyleSheet.create({
  iconWrap:  { alignSelf: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: '#EDE9F5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconEmoji: { fontSize: 30 },
  title:     { fontSize: 20, fontFamily: 'Volte-Semibold', color: TEXT_DARK, textAlign: 'center', marginBottom: 8 },
  subtitle:  { fontSize: 14, fontFamily: 'Volte', color: TEXT_MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  rows:      { gap: 16, marginBottom: 28 },
  row:       { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  rowIcon:   { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EDE9F5', alignItems: 'center', justifyContent: 'center' },
  rowText:   { flex: 1 },
  rowTitle:  { fontSize: 14, fontFamily: 'Volte-Semibold', color: TEXT_DARK, marginBottom: 2 },
  rowDesc:   { fontSize: 13, fontFamily: 'Volte', color: TEXT_MUTED, lineHeight: 18 },
  btn:       { height: 52, borderRadius: 14, backgroundColor: BRAND_PURPLE, alignItems: 'center', justifyContent: 'center' },
  btnText:   { fontSize: 16, fontFamily: 'Volte-Semibold', color: WHITE },
});

// ── Deck Detail Screen ─────────────────────────────────────────────────────────
export default function DeckDetailScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();

  const deck: DeckMeta = DECK_DATA[deckId ?? ''] ?? DEFAULT_DECK;

  const [selectedPack,      setSelectedPack]      = useState<PackMeta | null>(null);
  const [upgradeVisible,    setUpgradeVisible]    = useState(false);
  const [explainerVisible,  setExplainerVisible]  = useState(false);
  const pendingPackRef = useRef<PackMeta | null>(null);

  const handlePackPress = (pack: PackMeta) => {
    if (pack.isLocked && !pack.isPremium) return; // progression locked — no action
    if (pack.isPremium) { setUpgradeVisible(true); return; } // premium — open upgrade
    setSelectedPack(pack);
  };

  const navigateToPack = (pack: PackMeta) => {
    setCurrentPack({
      pack,
      packBagImage: deck.packBagImage,
      deckTitle:    deck.title,
      deckId:       deckId ?? '',
    });
    router.push({
      pathname: '/learn/pack-opening',
      params: {
        deckId,
        packId:    pack.id,
        packLevel: String(pack.level),
        cardCount: String(pack.cardCount),
        deckTitle: deck.title,
      },
    });
  };

  const handleConfirm = async () => {
    if (!selectedPack) return;
    const pack = selectedPack;
    setSelectedPack(null);

    const seen = await AsyncStorage.getItem(ENERGY_EXPLAINER_KEY);
    if (!seen) {
      pendingPackRef.current = pack;
      setExplainerVisible(true);
    } else {
      navigateToPack(pack);
    }
  };

  const handleExplainerDismiss = async () => {
    await AsyncStorage.setItem(ENERGY_EXPLAINER_KEY, 'true');
    setExplainerVisible(false);
    if (pendingPackRef.current) {
      const pack = pendingPackRef.current;
      pendingPackRef.current = null;
      navigateToPack(pack);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* Back */}
      <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Deck header */}
        <View style={styles.deckHeader}>
          <Image source={deck.cover} style={styles.deckCover} resizeMode="cover" />
          <View style={styles.deckMeta}>
            <Text style={styles.deckTitle}>{deck.title}</Text>
            <Text style={styles.deckSubtitle}>{deck.subtitle}</Text>
            <Text style={styles.deckWordCount}>{deck.wordCount} Words</Text>
          </View>
        </View>

        {/* Pack list */}
        <View style={styles.packList}>
          {deck.packs.map(pack => {
            const progressionLocked = pack.isLocked && !pack.isPremium;
            const premiumLocked     = pack.isPremium;
            const dimmed            = progressionLocked;

            return (
              <TouchableOpacity
                key={pack.id}
                style={[styles.packRow, dimmed && styles.packRowLocked]}
                onPress={() => handlePackPress(pack)}
                activeOpacity={progressionLocked ? 1 : 0.8}
              >
                <Image source={pack.thumbnail} style={styles.packThumb} resizeMode="contain" />
                <View style={styles.packInfo}>
                  <Text style={[styles.packLevel, dimmed && styles.packTextLocked]}>
                    Lv. {pack.level}
                  </Text>
                  <Text style={styles.packCards}>{pack.cardCount} cards</Text>
                </View>

                {/* Right side indicator */}
                {progressionLocked ? (
                  <View style={styles.lockCircle}>
                    <Ionicons name="lock-closed" size={16} color={TEXT_MUTED} />
                  </View>
                ) : premiumLocked ? (
                  <View style={styles.crownCircle}>
                    <Text style={styles.crownEmoji}>👑</Text>
                  </View>
                ) : pack.energyCost > 0 ? (
                  <View style={styles.energyTag}>
                    <Ionicons name="flash" size={13} color="#F5C842" />
                    <Text style={styles.energyTagText}>{pack.energyCost}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      <RedemptionSheet
        visible={!!selectedPack}
        pack={selectedPack}
        deckTitle={deck.title}
        onCancel={() => setSelectedPack(null)}
        onConfirm={handleConfirm}
      />
      <EnergyExplainerSheet
        visible={explainerVisible}
        onDismiss={handleExplainerDismiss}
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
  safeArea:      { flex: 1, backgroundColor: BG_CREAM },
  scrollContent: { paddingBottom: 40 },

  backBtn:  { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  backIcon: { fontSize: 32, color: TEXT_DARK, lineHeight: 36 },

  // Deck header
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 16,
  },
  deckCover:     { width: 96, height: 96, borderRadius: 18 },
  deckMeta:      { flex: 1, gap: 2 },
  deckTitle:     { fontSize: 24, color: TEXT_DARK,    fontFamily: 'Volte-Semibold' },
  deckSubtitle:  { fontSize: 15, color: TEXT_MUTED,   fontFamily: 'Volte', marginBottom: 4 },
  deckWordCount: { fontSize: 15, color: BRAND_PURPLE, fontFamily: 'Volte-Semibold' },

  // Pack list
  packList: { paddingHorizontal: 20, gap: 12 },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 14,
    gap: 14,
  },
  packRowLocked: { opacity: 0.6 },
  packThumb:     { width: 60, height: 60, borderRadius: 10 },
  packInfo:      { flex: 1 },
  packLevel:     { fontSize: 17, color: TEXT_DARK,  fontFamily: 'Volte-Semibold',   marginBottom: 2 },
  packTextLocked:{ color: TEXT_MUTED },
  packCards:     { fontSize: 13, color: TEXT_MUTED, fontFamily: 'Volte' },

  lockCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0EDE8',
    alignItems: 'center', justifyContent: 'center',
  },
  crownCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
  },
  crownEmoji: { fontSize: 18 },
  energyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  energyTagText: { fontSize: 15, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },

  // Overlay
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },

  // Bottom sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: BG_CREAM,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20,
  },
  sheetClose: { alignSelf: 'flex-end', marginBottom: 4 },
  sheetTitle: {
    fontSize: 20, color: TEXT_DARK, fontFamily: 'Volte-Semibold',
    textAlign: 'center', marginBottom: 20,
  },
  sheetPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    gap: 16,
    marginBottom: 20,
  },
  sheetThumb:        { width: 60, height: 60, borderRadius: 10 },
  sheetPreviewLevel: { fontSize: 17, color: TEXT_DARK, fontFamily: 'Volte-Semibold', marginBottom: 2 },
  sheetPreviewCards: { fontSize: 14, color: TEXT_MUTED, fontFamily: 'Volte' },
  sheetMessage: {
    fontSize: 16, color: TEXT_DARK, fontFamily: 'Volte-Semibold',
    textAlign: 'center', lineHeight: 24, marginBottom: 28,
  },
  sheetButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, height: 52, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E0DDD8',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: WHITE,
  },
  cancelBtnText:  { fontSize: 16, color: TEXT_DARK,  fontFamily: 'Volte-Semibold' },
  confirmBtn: {
    flex: 1, height: 52, borderRadius: 14,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtnText: { fontSize: 16, color: WHITE, fontFamily: 'Volte-Semibold' },
});
