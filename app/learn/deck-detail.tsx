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
import { DECK_DATA } from '@/constants/mock-packs';
import type { PackMeta, DeckMeta } from '@/constants/mock-packs';
import { setCurrentPack } from '@/constants/pack-store';

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

// ── Deck Detail Screen ─────────────────────────────────────────────────────────
export default function DeckDetailScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();

  const deck: DeckMeta = DECK_DATA[deckId ?? ''] ?? DEFAULT_DECK;

  const [selectedPack, setSelectedPack] = useState<PackMeta | null>(null);

  const handlePackPress = (pack: PackMeta) => {
    if (pack.isLocked) return;
    setSelectedPack(pack);
  };

  const handleConfirm = () => {
    if (!selectedPack) return;
    // Store pack data before navigating so pack-opening can read it without
    // serialising the full card array through navigation params.
    setCurrentPack({
      pack:         selectedPack,
      packBagImage: deck.packBagImage,
      deckTitle:    deck.title,
      deckId:       deckId ?? '',
    });
    setSelectedPack(null);
    router.push({
      pathname: '/learn/pack-opening',
      params: {
        deckId,
        packId:    selectedPack.id,
        packLevel: String(selectedPack.level),
        cardCount: String(selectedPack.cardCount),
        deckTitle: deck.title,
      },
    });
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
          {deck.packs.map(pack => (
            <TouchableOpacity
              key={pack.id}
              style={[styles.packRow, pack.isLocked && styles.packRowLocked]}
              onPress={() => handlePackPress(pack)}
              activeOpacity={pack.isLocked ? 1 : 0.8}
            >
              <Image source={pack.thumbnail} style={styles.packThumb} resizeMode="contain" />
              <View style={styles.packInfo}>
                <Text style={[styles.packLevel, pack.isLocked && styles.packTextLocked]}>
                  Lv. {pack.level}
                </Text>
                <Text style={styles.packCards}>{pack.cardCount} cards</Text>
              </View>

              {/* Right side indicator */}
              {pack.isLocked ? (
                <View style={styles.lockCircle}>
                  <Ionicons name="lock-closed" size={16} color={TEXT_MUTED} />
                </View>
              ) : pack.energyCost > 0 ? (
                <View style={styles.energyTag}>
                  <Ionicons name="flash" size={13} color="#F5C842" />
                  <Text style={styles.energyTagText}>{pack.energyCost}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      <RedemptionSheet
        visible={!!selectedPack}
        pack={selectedPack}
        deckTitle={deck.title}
        onCancel={() => setSelectedPack(null)}
        onConfirm={handleConfirm}
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
  deckTitle:     { fontSize: 24, color: TEXT_DARK,    fontFamily: 'Volte-Bold' },
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
  packLevel:     { fontSize: 17, color: TEXT_DARK,  fontFamily: 'Volte-Bold',   marginBottom: 2 },
  packTextLocked:{ color: TEXT_MUTED },
  packCards:     { fontSize: 13, color: TEXT_MUTED, fontFamily: 'Volte' },

  lockCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0EDE8',
    alignItems: 'center', justifyContent: 'center',
  },
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
    fontSize: 20, color: TEXT_DARK, fontFamily: 'Volte-Bold',
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
  sheetPreviewLevel: { fontSize: 17, color: TEXT_DARK, fontFamily: 'Volte-Bold', marginBottom: 2 },
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
