import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ── Emoji PNG assets ───────────────────────────────────────────────────────────
const EMOJI = {
  backhand:      require('@/assets/images/backhand.png'),
  playButton:    require('@/assets/images/play-button.png'),
  artistPalette: require('@/assets/images/artist-palette.png'),
  musicalNote:   require('@/assets/images/musical-note.png'),
  speechBalloon: require('@/assets/images/speech-balloon.png'),
};
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DECK_DATA } from '@/constants/mock-packs';
import UpgradeModal from '@/components/UpgradeModal';
import { DEV_IS_PREMIUM_KEY } from '@/constants/storage-keys';
import {
  setReviewSession,
  DEFAULT_REVIEW_CONFIG,
  type ReviewSessionConfig,
  type ReviewMode,
} from '@/constants/review-store';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const BG_CREAM     = '#F8F5EF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#525252';
const WHITE        = '#FFFFFF';

// ── Mock data ──────────────────────────────────────────────────────────────────
const LEARNED_COUNT = 30;

const THEME_DECKS = [
  { id: 't1', title: 'Animals',               subtitle: '動物',   image: require('@/assets/images/deck_cover_animals.png') },
  { id: 't2', title: 'Fruits & Vegetables',   subtitle: '水果蔬菜', image: require('@/assets/images/deck_cover_fruits_vegetables.png') },
  { id: 't3', title: 'Food & Drinks',         subtitle: '食物飲料', image: require('@/assets/images/deck_cover_food_drinks.png') },
  { id: 't4', title: 'Clothe & Accessories',  subtitle: '衣服配飾', image: require('@/assets/images/deck_cover_clothe_accessories.png') },
  { id: 't5', title: 'Body Parts',            subtitle: '身體部位', image: require('@/assets/images/deck_cover_body_parts.png') },
  { id: 't6', title: 'Furniture & Appliances',subtitle: '家具家電', image: require('@/assets/images/deck_cover_furniture_appliances.png') },
];

const SESSION_SIZES: Array<15 | 30 | 50> = [15, 30, 50];

// ── Review Setup Bottom Sheet ──────────────────────────────────────────────────
function ReviewSetupSheet({
  visible,
  onClose,
  onStart,
  isPremium,
  onUpgrade,
}: {
  visible: boolean;
  onClose: () => void;
  onStart: (config: ReviewSessionConfig) => void;
  isPremium: boolean;
  onUpgrade: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const [mode, setMode]                   = useState<ReviewMode>(DEFAULT_REVIEW_CONFIG.mode);
  const [sessionSize, setSessionSize]     = useState<15 | 30 | 50>(DEFAULT_REVIEW_CONFIG.sessionSize);
  const [categoryId, setCategoryId]       = useState(DEFAULT_REVIEW_CONFIG.categoryId);
  const [showIllustration, setShowIllus]  = useState(DEFAULT_REVIEW_CONFIG.showIllustration);
  const [autoplayAudio, setAutoplayAudio] = useState(DEFAULT_REVIEW_CONFIG.autoplayAudio);
  const [autoFlip, setAutoFlip]           = useState(DEFAULT_REVIEW_CONFIG.autoFlip);

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 600, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleStart = () => {
    onStart({ mode, sessionSize, showIllustration, autoplayAudio, autoFlip, categoryId });
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      {/* Dim overlay */}
      <Animated.View style={[sheet.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet panel */}
      <Animated.View style={[sheet.panel, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle + header */}
        <View style={sheet.handle} />
        <View style={sheet.header}>
          <Text style={sheet.title}>Review Setup</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={TEXT_DARK} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sheet.scrollContent}>

          {/* ── Mode ──────────────────────────────────────────────────────── */}
          <Text style={sheet.sectionLabel}>Mode</Text>
          <View style={sheet.modeRow}>
            <TouchableOpacity
              style={[sheet.modeBtn, mode === 'manual' && sheet.modeBtnActive]}
              activeOpacity={0.8}
              onPress={() => setMode('manual')}
            >
              <Image source={EMOJI.backhand} style={sheet.modeEmoji} resizeMode="contain" />
              <Text style={[sheet.modeBtnText, mode === 'manual' && sheet.modeBtnTextActive]}>Manual</Text>
              <Text style={[sheet.modeBtnSub, mode === 'manual' && sheet.modeBtnSubActive]}>Swipe to rate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[sheet.modeBtn, mode === 'autoplay' && sheet.modeBtnActive, !isPremium && sheet.modeBtnLocked]}
              activeOpacity={0.8}
              onPress={() => isPremium ? setMode('autoplay') : onUpgrade()}
            >
              <Image source={EMOJI.playButton} style={sheet.modeEmoji} resizeMode="contain" />
              <Text style={[sheet.modeBtnText, mode === 'autoplay' && sheet.modeBtnTextActive]}>Auto-play</Text>
              <Text style={[sheet.modeBtnSub, mode === 'autoplay' && sheet.modeBtnSubActive]}>ASMR style</Text>
              {!isPremium && (
                <View style={sheet.lockBadge}>
                  <Text style={sheet.lockBadgeText}>👑</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Session size ──────────────────────────────────────────────── */}
          <Text style={sheet.sectionLabel}>Cards per session</Text>
          <View style={sheet.chipRow}>
            {SESSION_SIZES.map(size => (
              <TouchableOpacity
                key={size}
                style={[sheet.chip, sessionSize === size && sheet.chipActive]}
                activeOpacity={0.8}
                onPress={() => setSessionSize(size)}
              >
                <Text style={[sheet.chipText, sessionSize === size && sheet.chipTextActive]}>{size}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Category ──────────────────────────────────────────────────── */}
          <Text style={sheet.sectionLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sheet.categoryRow}>
            <TouchableOpacity
              style={[sheet.chip, categoryId === 'all' && sheet.chipActive]}
              activeOpacity={0.8}
              onPress={() => setCategoryId('all')}
            >
              <Text style={[sheet.chipText, categoryId === 'all' && sheet.chipTextActive]}>All</Text>
            </TouchableOpacity>
            {THEME_DECKS.map(deck => (
              <TouchableOpacity
                key={deck.id}
                style={[sheet.chip, categoryId === deck.id && sheet.chipActive]}
                activeOpacity={0.8}
                onPress={() => setCategoryId(deck.id)}
              >
                <Text style={[sheet.chipText, categoryId === deck.id && sheet.chipTextActive]}>{deck.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Toggles ───────────────────────────────────────────────────── */}
          <Text style={sheet.sectionLabel}>Options</Text>
          <View style={sheet.optionsCard}>
            <View style={sheet.toggleRow}>
              <View style={sheet.toggleInfo}>
                <View style={sheet.toggleLabelRow}>
                  <Image source={EMOJI.artistPalette} style={sheet.toggleEmoji} resizeMode="contain" />
                  <Text style={sheet.toggleLabel}>Show illustrations</Text>
                </View>
                <Text style={sheet.toggleSub}>Display artwork on each card</Text>
              </View>
              <Switch
                value={showIllustration}
                onValueChange={setShowIllus}
                trackColor={{ false: '#E0DBF0', true: BRAND_PURPLE }}
                thumbColor={WHITE}
              />
            </View>
            <View style={sheet.divider} />
            <View style={sheet.toggleRow}>
              <View style={sheet.toggleInfo}>
                <View style={sheet.toggleLabelRow}>
                  <Image source={EMOJI.musicalNote} style={sheet.toggleEmoji} resizeMode="contain" />
                  <Text style={sheet.toggleLabel}>Auto-play audio</Text>
                </View>
                <Text style={sheet.toggleSub}>Play pronunciation on each card</Text>
              </View>
              <Switch
                value={autoplayAudio}
                onValueChange={setAutoplayAudio}
                trackColor={{ false: '#E0DBF0', true: BRAND_PURPLE }}
                thumbColor={WHITE}
              />
            </View>
            {mode === 'autoplay' && (
              <>
                <View style={sheet.divider} />
                <View style={sheet.toggleRow}>
                  <View style={sheet.toggleInfo}>
                    <View style={sheet.toggleLabelRow}>
                      <Image source={EMOJI.speechBalloon} style={sheet.toggleEmoji} resizeMode="contain" />
                      <Text style={sheet.toggleLabel}>Auto-flip</Text>
                    </View>
                    <Text style={sheet.toggleSub}>Reveal the back before advancing</Text>
                  </View>
                  <Switch
                    value={autoFlip}
                    onValueChange={setAutoFlip}
                    trackColor={{ false: '#E0DBF0', true: BRAND_PURPLE }}
                    thumbColor={WHITE}
                  />
                </View>
              </>
            )}
          </View>

        </ScrollView>

        {/* Start button */}
        <TouchableOpacity style={sheet.startBtn} activeOpacity={0.85} onPress={handleStart}>
          <Text style={sheet.startBtnText}>Start Review</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ── Review Screen ──────────────────────────────────────────────────────────────
export default function ReviewScreen() {
  const router = useRouter();
  const [sheetVisible,    setSheetVisible]    = useState(false);
  const [upgradeVisible,  setUpgradeVisible]  = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(DEV_IS_PREMIUM_KEY).then(val => setIsPremium(val === 'true'));
  }, []);

  const handleReviewStart = (config: ReviewSessionConfig) => {
    setSheetVisible(false);

    // Build card pool from selected category
    const sourceDecks = config.categoryId === 'all'
      ? Object.values(DECK_DATA)
      : [DECK_DATA[config.categoryId]].filter(Boolean);

    const allCards = sourceDecks.flatMap(deck =>
      deck.packs.flatMap(p => p.cards)
    );

    // Shuffle + slice to session size
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    const cards    = shuffled.slice(0, config.sessionSize);

    setReviewSession({ cards, deckTitle: 'Review', config });
    router.push('/review/flashcard');
  };

  const handleQuiz = () => {
    const reviewCards = DECK_DATA['t1'].packs[0].cards;
    setReviewSession({
      cards: reviewCards,
      deckTitle: 'Animals',
      config: DEFAULT_REVIEW_CONFIG,
    });
    router.push('/quiz');
  };

  return (
    <View style={styles.root}>
      {/* Purple header — extends behind status bar */}
      <View style={styles.headerBg}>
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <Text style={styles.headerLabel}>You've learned</Text>
          <Text style={styles.learnedCount}>{LEARNED_COUNT}</Text>
          <Text style={styles.wordsLabel}>words</Text>
        </SafeAreaView>
      </View>

      {/* Cream content area */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Action card (Review + Quiz) */}
        <View style={styles.actionCard}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => setSheetVisible(true)}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#EDE9F5' }]}>
              <Ionicons name="play" size={22} color={BRAND_PURPLE} />
            </View>
            <Text style={styles.actionLabel}>Review</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={handleQuiz}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#EDE9F5' }]}>
              <Ionicons name="game-controller" size={22} color={BRAND_PURPLE} />
            </View>
            <Text style={styles.actionLabel}>Quiz</Text>
          </TouchableOpacity>
        </View>

        {/* Themes section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Themes</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.showAll}>show all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.deckRow}
        >
          {THEME_DECKS.map((deck) => (
            <TouchableOpacity
              key={deck.id}
              style={styles.deckCard}
              activeOpacity={0.85}
              onPress={() => router.push(`/review/deck-words?deckId=${deck.id}`)}
            >
              <View style={styles.deckImageBox}>
                <Image source={deck.image} style={styles.deckImage} resizeMode="cover" />
              </View>
              <Text style={styles.deckTitle} numberOfLines={1}>{deck.title}</Text>
              <Text style={styles.deckSubtitle} numberOfLines={1}>{deck.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Review setup bottom sheet */}
      <ReviewSetupSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onStart={handleReviewStart}
        isPremium={isPremium}
        onUpgrade={() => { setSheetVisible(false); setUpgradeVisible(true); }}
      />
      <UpgradeModal
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const DECK_W = 160;
const DECK_H = 160;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND_PURPLE },

  headerBg:   { backgroundColor: BRAND_PURPLE },
  headerSafe: { alignItems: 'center', paddingBottom: 32, paddingTop: 8 },
  headerLabel: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Volte-Medium',
    marginBottom: 8,
  },
  learnedCount: {
    fontSize: 72,
    color: WHITE,
    fontFamily: 'Volte-Semibold',
    lineHeight: 80,
  },
  wordsLabel: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Volte-Medium',
    marginTop: 2,
  },

  scroll: {
    flex: 1,
    backgroundColor: BG_CREAM,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  scrollContent: { paddingTop: 24, paddingBottom: 40 },

  actionCard: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 15, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },
  actionDivider: { width: 1, backgroundColor: '#E8E5DF', marginVertical: 4 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 22, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },
  showAll:      { fontSize: 14, color: TEXT_MUTED, fontFamily: 'Volte-Medium' },

  deckRow:     { paddingLeft: 24, paddingRight: 12, gap: 14 },
  deckCard:    { width: DECK_W },
  deckImageBox: {
    width: DECK_W, height: DECK_H,
    borderRadius: 16, marginBottom: 10, overflow: 'hidden',
  },
  deckImage:    { width: '100%', height: '100%' },
  deckTitle:    { fontSize: 13, color: TEXT_DARK,  fontFamily: 'Volte-Semibold', marginBottom: 2 },
  deckSubtitle: { fontSize: 11, color: TEXT_MUTED, fontFamily: 'Volte' },
});

// ── Sheet styles ───────────────────────────────────────────────────────────────
const sheet = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 36,
    maxHeight: '88%',
  },
  handle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: '#D1CCC0',
    alignSelf: 'center',
    marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  title: { fontSize: 20, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 8 },

  sectionLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontFamily: 'Volte-Semibold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 10,
  },

  // Mode buttons
  modeRow: { flexDirection: 'row', gap: 12 },
  modeEmoji: { width: 24, height: 24, marginBottom: 4 },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
    backgroundColor: '#FAFAF8',
    gap: 4,
  },
  modeBtnActive: {
    backgroundColor: BRAND_PURPLE,
    borderColor: BRAND_PURPLE,
  },
  modeBtnText: { fontSize: 15, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },
  modeBtnTextActive: { color: WHITE },
  modeBtnSub:       { fontSize: 12, color: TEXT_MUTED, fontFamily: 'Volte' },
  modeBtnSubActive: { color: 'rgba(255,255,255,0.7)' },
  modeBtnLocked:    { opacity: 0.5 },
  lockBadge:        { position: 'absolute', top: 8, right: 8, backgroundColor: '#FEF3C7', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  lockBadgeText:    { fontSize: 12 },

  // Chip pills
  chipRow: { flexDirection: 'row', gap: 10 },
  categoryRow: { gap: 10, paddingBottom: 2 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#E8E5DF',
    backgroundColor: '#FAFAF8',
  },
  chipActive: {
    backgroundColor: BRAND_PURPLE,
    borderColor: BRAND_PURPLE,
  },
  chipText: { fontSize: 14, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },
  chipTextActive: { color: WHITE },

  // Toggle rows
  optionsCard: {
    backgroundColor: '#FAFAF8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E5DF',
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleInfo:     { flex: 1, marginRight: 12 },
  toggleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  toggleEmoji:    { width: 18, height: 18 },
  toggleLabel:    { fontSize: 15, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },
  toggleSub:      { fontSize: 12, color: TEXT_MUTED, fontFamily: 'Volte', paddingLeft: 24 }, // 18px emoji + 6px gap
  divider:     { height: 1, backgroundColor: '#E8E5DF', marginHorizontal: 16 },

  // Start button
  startBtn: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: BRAND_PURPLE,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnText: { fontSize: 17, color: WHITE, fontFamily: 'Volte-Semibold' },
});
