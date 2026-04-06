import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DECK_DATA } from '@/constants/mock-packs';
import { setReviewSession } from '@/constants/review-store';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const BG_CREAM     = '#F8F5EF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';
const WHITE        = '#FFFFFF';

// ── Mock data ──────────────────────────────────────────────────────────────────
const LEARNED_COUNT = 30;

const THEME_DECKS = [
  { id: 't1', title: 'Animals',             subtitle: '動物',   image: require('@/assets/images/deck_cover_animals.png') },
  { id: 't2', title: 'Fruits & Vegetables', subtitle: '水果蔬菜', image: require('@/assets/images/deck_cover_fruits_vegetables.png') },
  { id: 't3', title: 'Food & Drinks',       subtitle: '食物飲料', image: require('@/assets/images/deck_cover_food_drinks.png') },
  { id: 't4', title: 'Clothe & Accessories',subtitle: '衣服配飾', image: require('@/assets/images/deck_cover_clothe_accessories.png') },
  { id: 't5', title: 'Body Parts',          subtitle: '身體部位', image: require('@/assets/images/deck_cover_body_parts.png') },
  { id: 't6', title: 'Furniture & Appliances', subtitle: '家具家電', image: require('@/assets/images/deck_cover_furniture_appliances.png') },
];

// ── Review Screen ──────────────────────────────────────────────────────────────
export default function ReviewScreen() {
  const router = useRouter();

  // Use Animals lv1 cards for the review/quiz session (only pack with cards for now)
  const reviewCards = DECK_DATA['t1'].packs[0].cards;

  const handleReview = () => {
    setReviewSession({ cards: reviewCards, deckTitle: 'Animals' });
    router.push('/review/flashcard');
  };

  const handleQuiz = () => {
    setReviewSession({ cards: reviewCards, deckTitle: 'Animals' });
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
          {/* Review button */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={handleReview}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#EDE9F5' }]}>
              <Ionicons name="play" size={22} color={BRAND_PURPLE} />
            </View>
            <Text style={styles.actionLabel}>Review</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.actionDivider} />

          {/* Quiz button */}
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
              onPress={() => { /* TODO: navigate to deck review */ }}
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
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const DECK_W = 160;
const DECK_H = 160;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND_PURPLE },

  // Purple header
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

  // Cream scroll area
  scroll: {
    flex: 1,
    backgroundColor: BG_CREAM,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
  },

  // Action card
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 15,
    color: TEXT_DARK,
    fontFamily: 'Volte-Semibold',
  },
  actionDivider: {
    width: 1,
    backgroundColor: '#E8E5DF',
    marginVertical: 4,
  },

  // Themes section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 22, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },
  showAll:      { fontSize: 14, color: TEXT_MUTED, fontFamily: 'Volte-Medium' },

  // Deck carousel
  deckRow: { paddingLeft: 24, paddingRight: 12, gap: 14 },
  deckCard: { width: DECK_W },
  deckImageBox: {
    width: DECK_W,
    height: DECK_H,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  deckImage:    { width: '100%', height: '100%' },
  deckTitle:    { fontSize: 13, color: TEXT_DARK,  fontFamily: 'Volte-Semibold',   marginBottom: 2 },
  deckSubtitle: { fontSize: 11, color: TEXT_MUTED, fontFamily: 'Volte' },
});
