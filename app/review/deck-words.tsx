import React, { useRef, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DECK_DATA, cardTextColor } from '@/constants/mock-packs';
import type { Card } from '@/constants/mock-packs';
import { setReviewSession, DEFAULT_REVIEW_CONFIG } from '@/constants/review-store';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const BG_CREAM     = '#F8F5EF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#525252';
const WHITE        = '#FFFFFF';

// ── Card row ───────────────────────────────────────────────────────────────────
function CardRow({ card }: { card: Card }) {
  const bg       = card.cardColor ?? BRAND_PURPLE;
  const txtColor = cardTextColor(bg);

  return (
    <View style={styles.cardRow}>
      <View style={[styles.cardThumb, { backgroundColor: bg }]}>
        {card.illustrationUrl ? (
          <Image source={card.illustrationUrl as any} style={styles.cardThumbImg} resizeMode="contain" />
        ) : (
          <Text style={[styles.cardThumbWord, { color: txtColor }]}>{card.word}</Text>
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardMeaning}>{card.meaning}</Text>
        <Text style={styles.cardPinyin}>{card.pinyin}</Text>
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function DeckWordsScreen() {
  const router  = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const deck = DECK_DATA[deckId ?? ''];

  const [activeTag,       setActiveTag]       = useState<string | null>(null);
  const [navTitleVisible, setNavTitleVisible] = useState(false);

  if (!deck) return null;

  const allCards: Card[] = deck.packs.flatMap(p => p.cards);
  const allTags = [...new Set(allCards.flatMap(c => c.tags ?? []))];
  const visibleCards = activeTag
    ? allCards.filter(c => c.tags?.includes(activeTag))
    : allCards;
  const totalCount = allCards.length;

  const handleReview = () => {
    setReviewSession({ cards: allCards, deckTitle: deck.title, config: DEFAULT_REVIEW_CONFIG });
    router.push('/review/flashcard');
  };

  const handleQuiz = () => {
    setReviewSession({ cards: allCards, deckTitle: deck.title, config: DEFAULT_REVIEW_CONFIG });
    router.push('/quiz');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        {navTitleVisible && (
          <Text style={styles.navTitle}>{deck.title}</Text>
        )}
        <View style={styles.navSpacer} />
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={e => setNavTitleVisible(e.nativeEvent.contentOffset.y > 72)}
      >
        {/* Deck info */}
        <View style={styles.deckInfo}>
          <View style={styles.coverWrap}>
            <Image source={deck.cover as any} style={styles.cover} resizeMode="cover" />
          </View>
          <View style={styles.deckText}>
            <Text style={styles.deckTitle}>{deck.title}</Text>
            <Text style={styles.deckSubtitle}>{deck.subtitle}</Text>
            <Text style={styles.deckCount}>{totalCount} Words</Text>
          </View>
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeTag === null && styles.filterPillActive]}
            onPress={() => setActiveTag(null)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterLabel, activeTag === null && styles.filterLabelActive]}>
              All {totalCount}
            </Text>
          </TouchableOpacity>
          {allTags.map(tag => {
            const active = activeTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setActiveTag(tag)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                  {tag} {allCards.filter(c => c.tags?.includes(tag)).length}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Word list */}
        {visibleCards.map((card, i) => (
          <CardRow key={`${deckId}-${i}-${card.id}`} card={card} />
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={handleReview}>
          <View style={styles.actionIconCircle}>
            <Ionicons name="play" size={20} color={BRAND_PURPLE} />
          </View>
          <Text style={styles.actionLabel}>Review</Text>
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={handleQuiz}>
          <View style={styles.actionIconCircle}>
            <Ionicons name="game-controller" size={20} color={BRAND_PURPLE} />
          </View>
          <Text style={styles.actionLabel}>Quiz</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_CREAM },

  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn:   { width: 32 },
  navTitle:  { flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  navSpacer: { width: 32 },

  deckInfo:     { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingBottom: 16 },
  coverWrap:    { width: 72, height: 72, borderRadius: 16, overflow: 'hidden', backgroundColor: BG_CREAM },
  cover:        { width: '100%', height: '100%' },
  deckText:     { flex: 1, gap: 2 },
  deckTitle:    { fontSize: 22, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  deckSubtitle: { fontSize: 14, fontFamily: 'Volte',          color: TEXT_MUTED },
  deckCount:    { fontSize: 14, fontFamily: 'Volte-Semibold', color: BRAND_PURPLE, marginTop: 4 },

  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8, gap: 8,
  },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: WHITE, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  filterPillActive:  { backgroundColor: BRAND_PURPLE },
  filterLabel:       { fontSize: 14, fontFamily: 'Volte-Medium', color: TEXT_DARK },
  filterLabelActive: { color: WHITE },

  list:        { flex: 1 },
  listContent: { paddingBottom: 16 },

  cardRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10, gap: 16,
    backgroundColor: BG_CREAM,
  },
  cardThumb:     { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardThumbImg:  { width: 24, height: 24 },
  cardThumbWord: { fontSize: 20, fontFamily: 'Volte-Semibold' },
  cardInfo:      { flex: 1 },
  cardMeaning:   { fontSize: 16, fontFamily: 'Volte-Semibold', color: TEXT_DARK, marginBottom: 3 },
  cardPinyin:    { fontSize: 14, fontFamily: 'Volte-Medium',   color: BRAND_PURPLE },

  actionBar: {
    flexDirection: 'row', backgroundColor: WHITE,
    borderRadius: 20, marginHorizontal: 16, marginBottom: 8,
    paddingVertical: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  actionIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EDE9F5', alignItems: 'center', justifyContent: 'center',
  },
  actionLabel:   { fontSize: 15, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  actionDivider: { width: 1, backgroundColor: '#E8E5DF', marginVertical: 4 },
});
