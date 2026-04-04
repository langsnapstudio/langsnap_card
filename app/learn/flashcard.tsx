import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE  = '#7D69AB';
const CARD_PURPLE   = '#6B5A9E';
const CARD_PURPLE_2 = '#7A6AAD';
const WHITE         = '#FFFFFF';
const WHITE_70      = 'rgba(255,255,255,0.7)';
const WHITE_40      = 'rgba(255,255,255,0.4)';

// ── Mock cards per pack ────────────────────────────────────────────────────────
type Card = {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  partOfSpeech: string;
  illustration: any;
};

const ANIMALS_CARDS: Card[] = [
  { id: '1', word: '狗', pinyin: 'gǒu',  meaning: 'dog',     partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '2', word: '猫', pinyin: 'māo',  meaning: 'cat',     partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '3', word: '鸟', pinyin: 'niǎo', meaning: 'bird',    partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '4', word: '鱼', pinyin: 'yú',   meaning: 'fish',    partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '5', word: '马', pinyin: 'mǎ',   meaning: 'horse',   partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '6', word: '牛', pinyin: 'niú',  meaning: 'cow/ox',  partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '7', word: '猪', pinyin: 'zhū',  meaning: 'pig',     partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '8', word: '羊', pinyin: 'yáng', meaning: 'sheep',   partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '9', word: '兔', pinyin: 'tù',   meaning: 'rabbit',  partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '10',word: '熊', pinyin: 'xióng',meaning: 'bear',    partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
];

const FRUITS_CARDS: Card[] = [
  { id: '1', word: '菠萝', pinyin: 'bōluó',  meaning: 'pineapple', partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-pineapple.png') },
  { id: '2', word: '苹果', pinyin: 'píngguǒ',meaning: 'apple',     partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-pineapple.png') },
  { id: '3', word: '香蕉', pinyin: 'xiāngjiāo',meaning: 'banana',  partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-pineapple.png') },
  { id: '4', word: '橙子', pinyin: 'chéngzi', meaning: 'orange',   partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-pineapple.png') },
  { id: '5', word: '西瓜', pinyin: 'xīguā',   meaning: 'watermelon',partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-pineapple.png') },
];

function getCards(deckId: string): Card[] {
  if (deckId === 't2') return FRUITS_CARDS;
  return ANIMALS_CARDS;
}

// ── Flashcard Screen ───────────────────────────────────────────────────────────
export default function FlashcardScreen() {
  const router = useRouter();
  const { deckId, deckTitle, packLevel } = useLocalSearchParams<{
    deckId: string; deckTitle: string; packLevel: string;
  }>();

  const cards = getCards(deckId ?? 't1');
  const [index,    setIndex]    = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Flip animation
  const flipAnim = useRef(new Animated.Value(0)).current;

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRotate  = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  const flip = () => {
    const toValue = isFlipped ? 0 : 180;
    Animated.spring(flipAnim, { toValue, friction: 8, tension: 40, useNativeDriver: true }).start();
    setIsFlipped(!isFlipped);
  };

  const goNext = () => {
    if (index >= cards.length - 1) {
      router.push({
        pathname: '/learn/success',
        params: { deckId, deckTitle, cardCount: String(cards.length) },
      });
      return;
    }
    flipAnim.setValue(0);
    setIsFlipped(false);
    setIndex(i => i + 1);
  };

  const goPrev = () => {
    if (index === 0) return;
    flipAnim.setValue(0);
    setIsFlipped(false);
    setIndex(i => i - 1);
  };

  // Swipe to navigate
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 15 && Math.abs(g.dy) < 60,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -40) goNext();
        else if (g.dx > 40) goPrev();
      },
    })
  ).current;

  const card = cards[index];
  const progress = (index + 1) / cards.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="exit-outline" size={26} color={WHITE} style={{ transform: [{ scaleX: -1 }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learn</Text>
        <TouchableOpacity hitSlop={12}>
          <Ionicons name="settings-outline" size={24} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* Card area */}
      <View style={styles.cardArea} {...panResponder.panHandlers}>

        {/* Ghost cards (deck effect) */}
        <View style={[styles.card, styles.ghostCard3]} />
        <View style={[styles.card, styles.ghostCard2]} />

        {/* Front face */}
        <Animated.View
          style={[
            styles.card,
            styles.cardFace,
            { transform: [{ perspective: 1200 }, { rotateY: frontRotate }] },
          ]}
        >
          <Pressable style={styles.cardTouchable} onPress={flip}>
            <Image source={card.illustration} style={styles.cardIllustration} resizeMode="contain" />
            <Text style={styles.cardWord}>{card.word}</Text>
            <TouchableOpacity style={styles.speakerBtn} hitSlop={12}>
              <Ionicons name="volume-medium-outline" size={22} color={WHITE_70} />
            </TouchableOpacity>
          </Pressable>
        </Animated.View>

        {/* Back face */}
        <Animated.View
          style={[
            styles.card,
            styles.cardFace,
            styles.cardBack,
            { transform: [{ perspective: 1200 }, { rotateY: backRotate }] },
          ]}
        >
          <Pressable style={styles.cardTouchable} onPress={flip}>
            <View style={styles.backTop}>
              <Text style={styles.cardWordSmall}>{card.word}</Text>
              <Image source={card.illustration} style={styles.cardIllustrationSmall} resizeMode="contain" />
            </View>
            <Text style={styles.pinyinText}>{card.pinyin}</Text>
            <View style={styles.posPill}>
              <Text style={styles.posText}>{card.partOfSpeech}</Text>
            </View>
            <Text style={styles.meaningText}>{card.meaning}</Text>
            <TouchableOpacity style={styles.speakerBtn} hitSlop={12}>
              <Ionicons name="volume-medium-outline" size={22} color={WHITE_70} />
            </TouchableOpacity>
          </Pressable>
        </Animated.View>
      </View>

      {/* Navigation hint */}
      <View style={styles.navHint}>
        <TouchableOpacity onPress={goPrev} disabled={index === 0} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={28} color={index === 0 ? WHITE_40 : WHITE_70} />
        </TouchableOpacity>
        <Text style={styles.navCounter}>{index + 1} / {cards.length}</Text>
        <TouchableOpacity onPress={goNext} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={28} color={WHITE_70} />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BRAND_PURPLE },

  // Progress bar
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 0 },
  progressFill:  { height: 3, backgroundColor: WHITE, borderRadius: 2 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 18, color: WHITE, fontFamily: 'Volte-Semibold' },

  // Card area
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  card: {
    position: 'absolute',
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 28,
    backgroundColor: CARD_PURPLE,
  },
  ghostCard2: {
    backgroundColor: CARD_PURPLE_2,
    transform: [{ translateY: 10 }, { scaleX: 0.96 }],
    opacity: 0.7,
  },
  ghostCard3: {
    backgroundColor: CARD_PURPLE_2,
    transform: [{ translateY: 20 }, { scaleX: 0.92 }],
    opacity: 0.4,
  },
  cardFace: {
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backgroundColor: CARD_PURPLE,
  },
  cardTouchable: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Front
  cardIllustration: { width: '60%', aspectRatio: 1, marginBottom: 24 },
  cardWord:         { fontSize: 56, color: WHITE, fontFamily: 'Volte-Bold' },

  // Back
  backTop: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardWordSmall:         { fontSize: 40, color: WHITE, fontFamily: 'Volte-Bold' },
  cardIllustrationSmall: { width: 80, height: 80 },
  pinyinText:  { fontSize: 22, color: WHITE_70, fontFamily: 'Volte', marginBottom: 12, alignSelf: 'flex-start' },
  posPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 20,
  },
  posText:     { fontSize: 13, color: WHITE_70, fontFamily: 'Volte-Medium' },
  meaningText: { fontSize: 32, color: WHITE, fontFamily: 'Volte-Bold', alignSelf: 'flex-start' },

  // Speaker
  speakerBtn: { position: 'absolute', bottom: 20, right: 20 },

  // Nav
  navHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
    paddingTop: 8,
    gap: 24,
  },
  navBtn:     { padding: 8 },
  navCounter: { fontSize: 15, color: WHITE_70, fontFamily: 'Volte-Medium', minWidth: 50, textAlign: 'center' },
});
