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
import { Ionicons } from '@expo/vector-icons';
import { LANGUAGE_MAP } from '@/constants/languages';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import EnergyBottomSheet from '@/components/EnergyBottomSheet';
import { getTotalEnergy } from '@/constants/energy-store';
import { useAuth } from '@/lib/auth';
import { useSheetDismiss } from '@/hooks/useSheetDismiss';
import { getMissedDays } from '@/constants/streak-store';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const BG_CREAM     = '#F8F5EF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#525252';
const WHITE        = '#FFFFFF';

const WELCOME_SHOWN_KEY     = 'langsnap:welcome_shown';
const ENERGY_GUIDE_SHOWN_KEY = 'langsnap:energy_guide_shown';


const HSK_DECKS = [
  { id: 'hsk1', title: 'HSK 3.0 Lv. 1', subtitle: '華語水平 3.0（一級）', image: require('@/assets/images/deck_cover_hsk1.png') },
  { id: 'hsk2', title: 'HSK 3.0 Lv. 2', subtitle: '華語水平 3.0（二級）', image: require('@/assets/images/deck_cover_hsk2.png') },
  { id: 'hsk3', title: 'HSK 3.0 Lv. 3', subtitle: '華語水平 3.0（三級）', image: require('@/assets/images/deck_cover_hsk3.png') },
  { id: 'hsk4', title: 'HSK 3.0 Lv. 4', subtitle: '華語水平 3.0（四級）', image: require('@/assets/images/deck_cover_hsk4.png') },
];

const THEME_DECKS = [
  { id: 't1', title: 'Animals',             subtitle: '動物',   image: require('@/assets/images/deck_cover_animals.png') },
  { id: 't2', title: 'Fruits & Vegetables', subtitle: '水果蔬菜', image: require('@/assets/images/deck_cover_fruits_vegetables.png') },
  { id: 't3', title: 'Food & Drinks',       subtitle: '食物飲料', image: require('@/assets/images/deck_cover_food_drinks.png') },
  { id: 't4', title: 'Clothe & Accessories',subtitle: '衣服配飾', image: require('@/assets/images/deck_cover_clothe_accessories.png') },
  { id: 't5', title: 'Body Parts',          subtitle: '身體部位', image: require('@/assets/images/deck_cover_body_parts.png') },
  { id: 't6', title: 'Furniture & Appliances', subtitle: '家具家電', image: require('@/assets/images/deck_cover_furniture_appliances.png') },
  { id: 't7', title: 'Sports',              subtitle: '運動',   image: require('@/assets/images/deck_cover_animals.png') },
];

// ── HSK Deck Card ──────────────────────────────────────────────────────────────
function HskCard({ deck, onPress }: { deck: typeof HSK_DECKS[0]; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.deckCard} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.hskImageBox}>
        <Image source={deck.image} style={styles.coverImage} resizeMode="cover" />
      </View>
      <Text style={styles.deckTitle}>{deck.title}</Text>
      <Text style={styles.deckSubtitle}>{deck.subtitle}</Text>
    </TouchableOpacity>
  );
}

// ── Theme Deck Card ────────────────────────────────────────────────────────────
function ThemeCard({ deck, onPress }: { deck: typeof THEME_DECKS[0]; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.deckCard} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.themeImageBox}>
        <Image source={deck.image} style={styles.coverImage} resizeMode="cover" />
      </View>
      <Text style={styles.deckTitle}>{deck.title}</Text>
      <Text style={styles.deckSubtitle}>{deck.subtitle}</Text>
    </TouchableOpacity>
  );
}

// ── Deck Section ──────────────────────────────────────────────────────────────
const MAX_CAROUSEL = 6;

function DeckSection<T extends { id: string }>({
  title, decks, onShowAll, renderItem,
}: {
  title: string;
  decks: T[];
  onShowAll: () => void;
  renderItem: (deck: T) => React.ReactNode;
}) {
  const visible = decks.slice(0, MAX_CAROUSEL);
  const hasMore  = decks.length > MAX_CAROUSEL;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {hasMore && (
          <TouchableOpacity activeOpacity={0.7} onPress={onShowAll}>
            <Text style={styles.showAll}>Show all</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.deckRow}
      >
        {visible.map(deck => renderItem(deck))}
      </ScrollView>
    </View>
  );
}

// ── Welcome Bottom Sheet ───────────────────────────────────────────────────────
function WelcomeSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const { dragY, panHandlers } = useSheetDismiss(handleClose);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(400);
      dragY.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: Animated.add(slideAnim, dragY) }] }]} {...panHandlers}>
        <View style={styles.sheetHandle} />
        <TouchableOpacity style={styles.sheetCloseBtn} onPress={handleClose} hitSlop={12}>
          <Ionicons name="close" size={22} color={TEXT_DARK} />
        </TouchableOpacity>

        <View style={styles.creatorAvatar}>
          <Image
            source={require('@/assets/images/avatar-me.png')}
            style={styles.creatorImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.welcomeTitle}>{'Welcome to Langsnap!'}</Text>

        <View style={styles.bodyBlock}>
          <Text style={styles.welcomeBody}>
            {"Hey, I'm Septymo 👋🏻\nDesigner & Solo creator of this app."}
          </Text>
          <Text style={[styles.welcomeBody, styles.bodyPara]}>
            {'I hope '}
            <Text style={styles.welcomeBodyBold}>{'500+ crafted illustrated flashcards'}</Text>
            {' I poured into this app could help you learn more effectively — and have more fun doing it. Thank you for your support. 🙏🏻'}
          </Text>
          <Text style={[styles.welcomeBody, styles.bodyPara]}>
            {'Now — pick a deck that catches your eye and dive in. Enjoy the journey! ✨'}
          </Text>
        </View>

        <TouchableOpacity style={styles.welcomeBtn} onPress={handleClose} activeOpacity={0.85}>
          <Text style={styles.welcomeBtnText}>{"Let's start learning!"}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ── Energy Guide Overlay ───────────────────────────────────────────────────────
function EnergyGuideOverlay({ visible, onDismiss, energyCount }: {
  visible: boolean; onDismiss: () => void; energyCount: number;
}) {
  const insets    = useSafeAreaInsets();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.88);
    }
  }, [visible]);

  // Match topBar: paddingTop=8, badge height ~32px, paddingBottom=12
  const badgeTop = insets.top + 8;
  const cardTop  = badgeTop + 32 + 10; // badge bottom + gap

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {/* Dim backdrop — tapping anywhere dismisses */}
      <Animated.View style={[StyleSheet.absoluteFill, guideStyles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </Animated.View>

      {/* Replicated energy badge — sits above dim, non-interactive */}
      <View style={[guideStyles.fakeBadge, { top: badgeTop, right: 20 }]}>
        <Ionicons name="flash" size={14} color="#F5C842" />
        <Text style={guideStyles.fakeBadgeCount}>{energyCount}</Text>
      </View>

      {/* Popup card — anchored below the badge, right-aligned */}
      <Animated.View style={[guideStyles.card, { top: cardTop, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Arrow pointing up toward badge */}
        <View style={guideStyles.arrow} />

        <View style={guideStyles.iconCircle}>
          <Ionicons name="flash" size={28} color="#F5C842" />
        </View>
        <Text style={guideStyles.title}>How energy works</Text>
        <Text style={guideStyles.subtitle}>
          Energy is needed to open new packs and start learning.
        </Text>
        <TouchableOpacity style={guideStyles.btn} onPress={onDismiss} activeOpacity={0.85}>
          <Text style={guideStyles.btnText}>Got it!</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ── Learn Tab ─────────────────────────────────────────────────────────────────
export default function LearnScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [showWelcome,     setShowWelcome]     = useState(false);
  const [showEnergy,      setShowEnergy]      = useState(false);
  const [showEnergyGuide, setShowEnergyGuide] = useState(false);
  const langKey  = profile?.target_language ?? 'mainland';
  const langConf = LANGUAGE_MAP[langKey] ?? LANGUAGE_MAP['mainland'];
  const energyCount = getTotalEnergy(langKey);
  const [missedDays, setMissedDays] = useState(0);

  useEffect(() => {
    getMissedDays(langKey).then(setMissedDays);
  }, [langKey]);

  useEffect(() => {
    AsyncStorage.getItem(WELCOME_SHOWN_KEY).then(val => {
      if (!val) {
        AsyncStorage.setItem(WELCOME_SHOWN_KEY, 'true');
        setTimeout(() => setShowWelcome(true), 500);
      } else {
        // Welcome already seen — check if energy guide still needs to show
        AsyncStorage.getItem(ENERGY_GUIDE_SHOWN_KEY).then(seen => {
          if (!seen) setTimeout(() => setShowEnergyGuide(true), 400);
        });
      }
    });
  }, []);

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    AsyncStorage.getItem(ENERGY_GUIDE_SHOWN_KEY).then(seen => {
      if (!seen) setTimeout(() => setShowEnergyGuide(true), 350);
    });
  };

  const handleEnergyGuideDismiss = () => {
    setShowEnergyGuide(false);
    AsyncStorage.setItem(ENERGY_GUIDE_SHOWN_KEY, 'true');
  };

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ── Top bar: language indicator (left) + energy badge (right) ───── */}
        <View style={styles.topBar}>
          {/* Language indicator */}
          <TouchableOpacity
            style={styles.langBadge}
            activeOpacity={0.6}
            onPress={() => router.push('/profile/courses')}
          >
            <Text style={styles.langEmoji}>{langConf.emoji}</Text>
            <Text style={styles.langLabel}>{langConf.shortLabel}</Text>
          </TouchableOpacity>

          {/* Energy badge */}
          <TouchableOpacity style={styles.energyBadge} activeOpacity={0.8} onPress={() => setShowEnergy(true)}>
            <Ionicons name="flash" size={14} color="#F5C842" />
            <Text style={styles.energyCount}>{energyCount}</Text>
          </TouchableOpacity>
        </View>

        {/* Streak freeze banner */}
        {missedDays > 0 && (
          <View style={styles.freezeBanner}>
            <Text style={styles.freezeBannerText}>🧊 Freeze active · Study today to protect your streak</Text>
          </View>
        )}

        {/* ── HSK section ───────────────────────────────────────────────── */}
        <DeckSection
          title="HSK"
          onShowAll={() => {/* TODO: HSK list screen */}}
          renderItem={(deck) => (
            <HskCard
              key={deck.id}
              deck={deck}
              onPress={() => router.push({ pathname: '/learn/deck-detail', params: { deckId: deck.id } })}
            />
          )}
          decks={HSK_DECKS}
        />

        {/* ── Theme section ─────────────────────────────────────────────── */}
        <DeckSection
          title="Theme"
          onShowAll={() => router.push('/learn/theme-list')}
          renderItem={(deck) => (
            <ThemeCard
              key={deck.id}
              deck={deck}
              onPress={() => router.push({ pathname: '/learn/deck-detail', params: { deckId: deck.id } })}
            />
          )}
          decks={THEME_DECKS}
        />

      </ScrollView>

      <WelcomeSheet visible={showWelcome} onClose={handleWelcomeClose} />
      <EnergyBottomSheet visible={showEnergy} onClose={() => setShowEnergy(false)} languageId={langKey} />
      <EnergyGuideOverlay visible={showEnergyGuide} onDismiss={handleEnergyGuideDismiss} energyCount={energyCount} />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const CARD_WIDTH = 160;
const CARD_HEIGHT = 160;

const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: BG_CREAM, overflow: 'hidden' },
  scrollContent: { paddingBottom: 40 },

  // Top bar with energy badge
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langEmoji: { fontSize: 18 },
  langLabel: { fontSize: 15, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  energyCount: { fontSize: 15, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },

  // Sections
  section:       { marginBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 22, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },
  showAll:      { fontSize: 14, color: TEXT_MUTED, fontFamily: 'Volte-Medium' },

  // Deck row
  deckRow: { paddingLeft: 24, paddingRight: 12, gap: 14 },
  deckCard: { width: CARD_WIDTH },

  // Deck image boxes
  hskImageBox: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18,
    marginBottom: 10,
    overflow: 'hidden',
  },
  themeImageBox: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18,
    marginBottom: 10,
    overflow: 'hidden',
  },
  coverImage: { width: '100%', height: '100%' },

  // Shared card text
  deckTitle:    { fontSize: 15, color: TEXT_DARK,  fontFamily: 'Volte-Semibold',   marginBottom: 2 },
  deckSubtitle: { fontSize: 13, color: TEXT_MUTED, fontFamily: 'Volte' },

  // Banners
  freezeBanner: {
    backgroundColor: '#DBEAFE',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  freezeBannerText: {
    fontSize: 13,
    fontFamily: 'Volte-Semibold',
    color: '#1E40AF',
    textAlign: 'center',
  },

  // Welcome sheet
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E0DDD8', marginBottom: 28,
    alignSelf: 'center',
  },
  sheetCloseBtn: {
    position: 'absolute', top: 16, right: 16,
    zIndex: 10,
  },
  creatorAvatar: {
    marginBottom: 20,
    alignSelf: 'center',
  },
  creatorImage:   { width: 88, height: 88 },
  welcomeTitle:   { fontSize: 22, color: TEXT_DARK, fontFamily: 'Volte-Semibold', textAlign: 'center', marginBottom: 16 },
  bodyBlock:      { marginBottom: 28 },
  bodyPara:       { marginTop: 14 },
  welcomeBody:     { fontSize: 15, lineHeight: 24, color: TEXT_MUTED, fontFamily: 'Volte', textAlign: 'center' },
  welcomeBodyBold: { fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  welcomeBtn: {
    width: '100%', height: 52, borderRadius: 14,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
  },
  welcomeBtnText: { fontSize: 17, color: WHITE, fontFamily: 'Volte-Semibold' },
});

// ── Energy guide overlay styles ────────────────────────────────────────────────
const guideStyles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.6)' },

  // Replicated energy badge — floats above the dim
  fakeBadge: {
    position: 'absolute',
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  fakeBadgeCount: { fontSize: 15, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },

  // Popup card — absolutely positioned below badge, right-aligned
  card: {
    position: 'absolute',
    right: 16,
    width: 270,
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 12,
  },
  // Small up-pointing triangle arrow toward the badge
  arrow: {
    position: 'absolute', top: -8, right: 28,
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: WHITE,
  },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#EDE9F5',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  title:    { fontSize: 18, fontFamily: 'Volte-Semibold', color: TEXT_DARK, textAlign: 'center' },
  subtitle: { fontSize: 13, fontFamily: 'Volte', color: TEXT_MUTED, textAlign: 'center', lineHeight: 19, marginBottom: 8 },
  btn: {
    width: '100%', height: 48, borderRadius: 14,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontSize: 15, fontFamily: 'Volte-Semibold', color: WHITE },
});
