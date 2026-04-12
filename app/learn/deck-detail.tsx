import React, { useEffect, useRef, useState } from 'react';
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
import { DECK_DATA } from '@/constants/mock-packs';
import type { PackMeta, DeckMeta } from '@/constants/mock-packs';
import { setCurrentPack } from '@/constants/pack-store';
import UpgradeModal from '@/components/UpgradeModal';
import { incrementFeat } from '@/constants/feat-store';
import { getTotalEnergy } from '@/constants/energy-store';
import EnergyBottomSheet from '@/components/EnergyBottomSheet';
import { getActivatedPacks, markPackActivated, isActivated } from '@/constants/activated-store';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const PURPLE_LIGHT = '#EDE9F5';
const BG_CREAM     = '#F8F5EF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#525252';
const WHITE        = '#FFFFFF';
const BORDER       = '#E8E5DF';
const AMBER        = '#F5C842';

// Pack level → ordinal word
const ORDINALS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
function packName(level: number) {
  return `Pack ${ORDINALS[level - 1] ?? level}`;
}

// Per-deck emoji used as pack thumbnail
const DECK_EMOJI: Record<string, string> = {
  t1: '🐶', t2: '🍎', t3: '🍜', t4: '👕', t5: '🦷', t6: '🛋️', t7: '⚽',
  hsk1: '📘', hsk2: '📗', hsk3: '📙', hsk4: '📕',
};

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
  visible, pack, deckTitle, emoji, onCancel, onConfirm,
}: {
  visible: boolean;
  pack: PackMeta | null;
  deckTitle: string;
  emoji: string;
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

        {/* Stacked flashcard visual */}
        <View style={styles.cardStackWrap}>
          {/* Back-left card */}
          <View style={[styles.stackCard, styles.stackCardLeft]} />
          {/* Back-right card */}
          <View style={[styles.stackCard, styles.stackCardRight]} />
          {/* Front card */}
          <View style={[styles.stackCard, styles.stackCardFront]}>
            <Text style={styles.stackEmoji}>{emoji}</Text>
            <Text style={styles.stackPackName}>{packName(pack.level)}</Text>
            <Text style={styles.stackPackCards}>{pack.cardCount} cards</Text>
          </View>
        </View>

        <Text style={styles.sheetMessage}>
          {pack.energyCost > 0
            ? `Opening this pack needs ⚡${pack.energyCost}\nDo you want to proceed?`
            : `Start learning ${deckTitle} ${packName(pack.level)}?`}
        </Text>

        {/* Buttons */}
        <View style={styles.sheetButtons}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.85}>
            <Text style={styles.confirmBtnText}>Activate</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ── Progression lock helper ────────────────────────────────────────────────────
// A pack is locked if the pack before it (by level order) hasn't been activated yet.
function isProgressionLocked(
  pack: PackMeta,
  allPacks: PackMeta[],
  activatedSet: Set<string>,
  deckId: string,
): boolean {
  const idx = allPacks.findIndex(p => p.id === pack.id);
  if (idx === 0) return false; // first pack always available
  return !isActivated(activatedSet, deckId, allPacks[idx - 1].id);
}

// ── Pack action button ─────────────────────────────────────────────────────────
function PackButton({
  pack, activated, locked,
}: {
  pack: PackMeta;
  activated: boolean;
  locked: boolean;
}) {
  if (activated) {
    return (
      <View style={styles.packBtnActivated}>
        <Text style={styles.packBtnActivatedText}>Activated</Text>
      </View>
    );
  }
  if (locked) {
    return (
      <View style={styles.packBtnRow}>
        {pack.isPremium && (
          <View style={styles.packBtnCrown}>
            <Text style={styles.packBtnCrownEmoji}>👑</Text>
          </View>
        )}
        <View style={styles.packBtnLock}>
          <Ionicons name="lock-closed" size={15} color={TEXT_MUTED} />
        </View>
      </View>
    );
  }
  // Available pack — show energy cost (+ crown badge if premium)
  return (
    <View style={styles.packBtnRow}>
      {pack.isPremium && (
        <View style={styles.packBtnCrown}>
          <Text style={styles.packBtnCrownEmoji}>👑</Text>
        </View>
      )}
      <View style={styles.packBtnEnergy}>
        <Ionicons name="flash" size={13} color={AMBER} />
        <Text style={styles.packBtnEnergyText}>
          {pack.energyCost > 0 ? String(pack.energyCost) : 'Free'}
        </Text>
      </View>
    </View>
  );
}

// ── Deck Detail Screen ─────────────────────────────────────────────────────────
export default function DeckDetailScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();

  const deck: DeckMeta = DECK_DATA[deckId ?? ''] ?? DEFAULT_DECK;
  const emoji = DECK_EMOJI[deckId ?? ''] ?? '📦';

  const [selectedPack,   setSelectedPack]   = useState<PackMeta | null>(null);
  const [upgradeVisible, setUpgradeVisible] = useState(false);
  const [energyVisible,  setEnergyVisible]  = useState(false);
  const [activatedPacks, setActivatedPacks] = useState<Set<string>>(new Set());
  const energyCount = getTotalEnergy();

  useEffect(() => {
    getActivatedPacks().then(setActivatedPacks);
  }, []);

  // Sort: unactivated first, activated last
  const sortedPacks = [...deck.packs].sort((a, b) => {
    const aAct = isActivated(activatedPacks, deckId ?? '', a.id) ? 1 : 0;
    const bAct = isActivated(activatedPacks, deckId ?? '', b.id) ? 1 : 0;
    return aAct - bAct;
  });

  const handlePackPress = (pack: PackMeta) => {
    if (isActivated(activatedPacks, deckId ?? '', pack.id)) return;                            // already activated
    if (isProgressionLocked(pack, deck.packs, activatedPacks, deckId ?? '')) return;           // previous pack not done yet
    if (pack.isPremium) { setUpgradeVisible(true); return; }
    setSelectedPack(pack);
  };

  const navigateToPack = async (pack: PackMeta) => {
    incrementFeat('first_step');
    // Mark as activated
    await markPackActivated(deckId ?? '', pack.id);
    setActivatedPacks(prev => {
      const next = new Set(prev);
      next.add(`${deckId ?? ''}:${pack.id}`);
      return next;
    });
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

  const handleConfirm = () => {
    if (!selectedPack) return;
    const pack = selectedPack;
    setSelectedPack(null);
    navigateToPack(pack);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <TouchableOpacity style={styles.energyBadge} activeOpacity={0.8} onPress={() => setEnergyVisible(true)}>
          <Ionicons name="flash" size={14} color={AMBER} />
          <Text style={styles.energyBadgeText}>{energyCount}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Deck header — matches review/deck-words sizing */}
        <View style={styles.deckHeader}>
          <View style={styles.coverWrap}>
            <Image source={deck.cover} style={styles.cover} resizeMode="cover" />
          </View>
          <View style={styles.deckMeta}>
            <Text style={styles.deckTitle}>{deck.title}</Text>
            <Text style={styles.deckSubtitle}>{deck.subtitle}</Text>
            <Text style={styles.deckWordCount}>{deck.wordCount} Words</Text>
          </View>
        </View>

        {/* Pack list */}
        <View style={styles.packList}>
          {sortedPacks.map(pack => {
            const activated = isActivated(activatedPacks, deckId ?? '', pack.id);
            const locked    = isProgressionLocked(pack, deck.packs, activatedPacks, deckId ?? '');

            return (
              <TouchableOpacity
                key={pack.id}
                style={[styles.packRow, activated && styles.packRowActivated]}
                onPress={() => handlePackPress(pack)}
                activeOpacity={(locked || activated) ? 1 : 0.8}
              >
                <View style={styles.packThumb}>
                  <Text style={styles.packThumbEmoji}>{emoji}</Text>
                </View>
                <View style={styles.packInfo}>
                  <Text style={[styles.packName, (locked || activated) && styles.packTextMuted]}>
                    {packName(pack.level)}
                  </Text>
                  <Text style={styles.packCards}>{pack.cardCount} cards</Text>
                </View>
                <PackButton pack={pack} activated={activated} locked={locked} />
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      <RedemptionSheet
        visible={!!selectedPack}
        pack={selectedPack}
        deckTitle={deck.title}
        emoji={emoji}
        onCancel={() => setSelectedPack(null)}
        onConfirm={handleConfirm}
      />
      <UpgradeModal
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
      />
      <EnergyBottomSheet visible={energyVisible} onClose={() => setEnergyVisible(false)} />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: BG_CREAM },
  scrollContent: { paddingBottom: 40 },

  navBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  backBtn:  {},
  energyBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  energyBadgeText: { fontSize: 15, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },
  backIcon: { fontSize: 32, color: TEXT_DARK, lineHeight: 36 },

  // Deck header — matches review/deck-words.tsx
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 16,
  },
  coverWrap:     { width: 72, height: 72, borderRadius: 16, overflow: 'hidden', backgroundColor: BG_CREAM },
  cover:         { width: '100%', height: '100%' },
  deckMeta:      { flex: 1, gap: 2 },
  deckTitle:     { fontSize: 22, color: TEXT_DARK,    fontFamily: 'Volte-Semibold' },
  deckSubtitle:  { fontSize: 14, color: TEXT_MUTED,   fontFamily: 'Volte', marginBottom: 4 },
  deckWordCount: { fontSize: 14, color: BRAND_PURPLE, fontFamily: 'Volte-Semibold' },

  // Pack list — challenge-card style
  packList: { paddingHorizontal: 16, gap: 10 },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  packRowActivated:  { opacity: 0.45 },
  packThumb:         { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  packThumbEmoji:    { fontSize: 26 },
  packInfo:         { flex: 1, gap: 3 },
  packName:         { fontSize: 14, color: TEXT_DARK,  fontFamily: 'Volte-Semibold' },
  packTextMuted:    { color: TEXT_MUTED },
  packCards:        { fontSize: 13, color: TEXT_MUTED, fontFamily: 'Volte-Medium' },

  // Pack action buttons (pill style)
  packBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  packBtnEnergy: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: BRAND_PURPLE,
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12,
  },
  packBtnEnergyText: { fontSize: 13, color: WHITE, fontFamily: 'Volte-Semibold' },

  packBtnActivated: {
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14,
  },
  packBtnActivatedText: { fontSize: 13, color: BRAND_PURPLE, fontFamily: 'Volte-Semibold' },

  packBtnLock: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  packBtnCrown: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
  },
  packBtnCrownEmoji: { fontSize: 18 },

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

  // Stacked flashcard visual
  cardStackWrap: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  stackCard: {
    position: 'absolute',
    width: 160, height: 200,
    borderRadius: 24,
  },
  stackCardLeft: {
    backgroundColor: '#FEF08A',
    transform: [{ rotate: '-9deg' }, { translateX: -8 }, { translateY: 6 }],
  },
  stackCardRight: {
    backgroundColor: '#BAE6FD',
    transform: [{ rotate: '7deg' }, { translateX: 8 }, { translateY: 6 }],
  },
  stackCardFront: {
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  stackEmoji:     { fontSize: 40 },
  stackPackName:  { fontSize: 20, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  stackPackCards: { fontSize: 14, fontFamily: 'Volte-Medium',   color: TEXT_MUTED },

  sheetMessage: {
    fontSize: 16, color: TEXT_DARK, fontFamily: 'Volte-Semibold',
    textAlign: 'center', lineHeight: 24, marginBottom: 24,
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
