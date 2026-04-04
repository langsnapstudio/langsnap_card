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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const BG_CREAM     = '#F8F5EF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';
const WHITE        = '#FFFFFF';

const WELCOME_SHOWN_KEY = 'langsnap:welcome_shown';

// ── Mock data ──────────────────────────────────────────────────────────────────
const ENERGY_COUNT = 1;

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
            <Text style={styles.showAll}>show all</Text>
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

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />

        <View style={styles.creatorAvatar}>
          <Image
            source={require('@/assets/images/illustration-dog.png')}
            style={styles.creatorImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.welcomeTitle}>{'Welcome to Langsnap!'}</Text>

        <View style={styles.bodyBlock}>
          <Text style={styles.welcomeBody}>
            {"Hey, I'm Septymo\nDesigner. Language learner. Solo creator of this app."}
          </Text>
          <Text style={[styles.welcomeBody, styles.bodyPara]}>
            {'I built this app because I wanted a more enjoyable and memorable way to learn vocabulary. With 500+ hand-drawn illustrated flashcards, I believe it can help you learn more effectively — and have more fun doing it, just like it did for me.'}
          </Text>
          <Text style={[styles.welcomeBody, styles.bodyPara]}>
            {"By being here, you're supporting not just a language app, but every crafted illustration I poured into it. Thank you — it means everything."}
          </Text>
          <Text style={[styles.welcomeBody, styles.bodyPara]}>
            {'Now — pick a deck that catches your eye and dive in. Enjoy the journey!'}
          </Text>
        </View>

        <TouchableOpacity style={styles.welcomeBtn} onPress={handleClose} activeOpacity={0.85}>
          <Text style={styles.welcomeBtnText}>{"Let's start learning!"}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ── Learn Tab ─────────────────────────────────────────────────────────────────
export default function LearnScreen() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(WELCOME_SHOWN_KEY).then(val => {
      if (!val) {
        setTimeout(() => setShowWelcome(true), 500);
        AsyncStorage.setItem(WELCOME_SHOWN_KEY, 'true');
      }
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ── Energy badge ────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.energyBadge} activeOpacity={0.8}>
          <Ionicons name="flash" size={14} color="#F5C842" />
          <Text style={styles.energyCount}>{ENERGY_COUNT}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

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

      <WelcomeSheet visible={showWelcome} onClose={() => setShowWelcome(false)} />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const CARD_WIDTH = 160;
const CARD_HEIGHT = 160;

const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: BG_CREAM },
  scrollContent: { paddingBottom: 40 },

  // Top bar with energy badge
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
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
  sectionTitle: { fontSize: 22, color: TEXT_DARK, fontFamily: 'Volte-Bold' },
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
  deckTitle:    { fontSize: 15, color: TEXT_DARK,  fontFamily: 'Volte-Bold',   marginBottom: 2 },
  deckSubtitle: { fontSize: 13, color: TEXT_MUTED, fontFamily: 'Volte' },

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
  creatorAvatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#F5C842',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, overflow: 'hidden',
    alignSelf: 'center',
  },
  creatorImage:   { width: 70, height: 70 },
  welcomeTitle:   { fontSize: 22, color: TEXT_DARK, fontFamily: 'Volte-Bold', textAlign: 'center', marginBottom: 16 },
  bodyBlock:      { marginBottom: 28 },
  bodyPara:       { marginTop: 14 },
  welcomeBody:    { fontSize: 15, lineHeight: 24, color: TEXT_MUTED, fontFamily: 'Volte', textAlign: 'center' },
  welcomeBtn: {
    width: '100%', height: 52, borderRadius: 14,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
  },
  welcomeBtnText: { fontSize: 17, color: WHITE, fontFamily: 'Volte-Semibold' },
});
