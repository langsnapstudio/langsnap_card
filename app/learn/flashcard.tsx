import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
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
const BRAND_PURPLE = '#7D69AB';
const CARD_PURPLE  = '#6B5A9E';
const CARD_GHOST_2 = '#897BB1'; // slightly lighter, opaque
const CARD_GHOST_3 = '#A09AC0'; // more lighter, opaque
const WHITE        = '#FFFFFF';
const WHITE_70     = 'rgba(255,255,255,0.7)';
const WHITE_40     = 'rgba(255,255,255,0.4)';

const SCREEN_WIDTH  = Dimensions.get('window').width;
const H_PAD         = 24;
const CARD_W        = SCREEN_WIDTH - H_PAD * 2;
const CARD_H        = Math.round(CARD_W / 0.7);
const GHOST_PEEK    = 48;
const SWIPE_OUT     = SCREEN_WIDTH * 1.3;
const SWIPE_THRESH  = CARD_W * 0.35;

// ── Mock cards ────────────────────────────────────────────────────────────────
type Card = {
  id: string; word: string; pinyin: string;
  meaning: string; partOfSpeech: string; illustration: any;
};

const ANIMALS_CARDS: Card[] = [
  { id: '1', word: '狗', pinyin: 'gǒu',   meaning: 'dog',     partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '2', word: '猫', pinyin: 'māo',   meaning: 'cat',     partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-pineapple.png') },
  { id: '3', word: '鸟', pinyin: 'niǎo',  meaning: 'bird',    partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '4', word: '鱼', pinyin: 'yú',    meaning: 'fish',    partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-pineapple.png') },
  { id: '5', word: '马', pinyin: 'mǎ',    meaning: 'horse',   partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '6', word: '牛', pinyin: 'niú',   meaning: 'cow/ox',  partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-pineapple.png') },
  { id: '7', word: '猪', pinyin: 'zhū',   meaning: 'pig',     partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '8', word: '羊', pinyin: 'yáng',  meaning: 'sheep',   partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-pineapple.png') },
  { id: '9', word: '兔', pinyin: 'tù',    meaning: 'rabbit',  partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '10', word: '熊', pinyin: 'xióng', meaning: 'bear',   partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-pineapple.png') },
];

const FRUITS_CARDS: Card[] = [
  { id: '1', word: '菠萝', pinyin: 'bōluó',     meaning: 'pineapple',  partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-pineapple.png') },
  { id: '2', word: '苹果', pinyin: 'píngguǒ',   meaning: 'apple',      partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '3', word: '香蕉', pinyin: 'xiāngjiāo', meaning: 'banana',     partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-pineapple.png') },
  { id: '4', word: '橙子', pinyin: 'chéngzi',   meaning: 'orange',     partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '5', word: '西瓜', pinyin: 'xīguā',     meaning: 'watermelon', partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-pineapple.png') },
];

function getCards(deckId: string): Card[] {
  return deckId === 't2' ? FRUITS_CARDS : ANIMALS_CARDS;
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function FlashcardScreen() {
  const router = useRouter();
  const { deckId, deckTitle } = useLocalSearchParams<{ deckId: string; deckTitle: string; packLevel: string }>();

  const cards    = getCards(deckId ?? 't1');
  const [index, setIndex]       = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const swipeX   = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(0);
  indexRef.current = index;

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRotate  = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  const flip = () => {
    const to = isFlipped ? 0 : 180;
    Animated.spring(flipAnim, { toValue: to, friction: 8, tension: 40, useNativeDriver: true }).start();
    setIsFlipped(f => !f);
  };

  const advance = (dir: 'next' | 'prev') => {
    flipAnim.setValue(0);
    setIsFlipped(false);
    if (dir === 'next') {
      if (indexRef.current >= cards.length - 1) {
        router.push({ pathname: '/learn/success', params: { deckId, deckTitle, cardCount: String(cards.length) } });
      } else {
        setIndex(i => i + 1);
      }
    } else {
      if (indexRef.current > 0) setIndex(i => i - 1);
    }
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 80,
      onPanResponderMove: Animated.event([null, { dx: swipeX }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESH) {
          Animated.timing(swipeX, { toValue: -SWIPE_OUT, duration: 200, useNativeDriver: false })
            .start(() => { swipeX.setValue(0); advance('next'); });
        } else if (g.dx > SWIPE_THRESH) {
          Animated.timing(swipeX, { toValue: SWIPE_OUT, duration: 200, useNativeDriver: false })
            .start(() => { swipeX.setValue(0); advance('prev'); });
        } else {
          Animated.spring(swipeX, { toValue: 0, friction: 8, tension: 40, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipeX, { toValue: 0, friction: 8, tension: 40, useNativeDriver: false }).start();
      },
    })
  ).current;

  const card     = cards[index];
  const nextCard = cards[index + 1] ?? null;
  const progress = (index + 1) / cards.length;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      {/* Progress */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="exit-outline" size={26} color={WHITE} style={{ transform: [{ scaleX: -1 }] }} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Learn</Text>
        <TouchableOpacity hitSlop={12}>
          <Ionicons name="settings-outline" size={24} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* Card stack */}
      <View style={s.area}>
        {/* Ghost card 3 — back, narrowest */}
        <View style={[s.ghost, s.ghost3]} />
        {/* Ghost card 2 — middle */}
        <View style={[s.ghost, s.ghost2]} />

        {/* Next card — sits at same position as front, fully visible behind it */}
        <View style={s.card}>
          {nextCard && (
            <>
              <Image source={nextCard.illustration} style={{ width: CARD_W * 0.6, height: CARD_W * 0.6, marginBottom: 24 }} resizeMode="contain" />
              <Text style={s.word}>{nextCard.word}</Text>
            </>
          )}
        </View>

        {/* Front card — draggable, on top */}
        <Animated.View style={[s.card, { transform: [{ translateX: swipeX }] }]} {...pan.panHandlers}>
          {/* Front face */}
          <Animated.View style={[s.face, { transform: [{ perspective: 1200 }, { rotateY: frontRotate }] }]}>
            <Pressable style={s.cardInner} onPress={flip}>
              <Image source={card.illustration} style={s.illustration} resizeMode="contain" />
              <Text style={s.word}>{card.word}</Text>
              <TouchableOpacity style={s.speaker} hitSlop={12}>
                <Ionicons name="volume-medium-outline" size={22} color={WHITE_70} />
              </TouchableOpacity>
            </Pressable>
          </Animated.View>

          {/* Back face */}
          <Animated.View style={[s.face, s.faceBack, { transform: [{ perspective: 1200 }, { rotateY: backRotate }] }]}>
            <Pressable style={s.cardInner} onPress={flip}>
              <View style={s.backTop}>
                <Text style={s.wordSm}>{card.word}</Text>
                <Image source={card.illustration} style={s.illustrationSm} resizeMode="contain" />
              </View>
              <Text style={s.pinyin}>{card.pinyin}</Text>
              <View style={s.posPill}><Text style={s.posText}>{card.partOfSpeech}</Text></View>
              <Text style={s.meaning}>{card.meaning}</Text>
              <TouchableOpacity style={s.speaker} hitSlop={12}>
                <Ionicons name="volume-medium-outline" size={22} color={WHITE_70} />
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity onPress={() => advance('prev')} disabled={index === 0} style={s.navBtn}>
          <Ionicons name="chevron-back" size={28} color={index === 0 ? WHITE_40 : WHITE_70} />
        </TouchableOpacity>
        <Text style={s.navCount}>{index + 1} / {cards.length}</Text>
        <TouchableOpacity onPress={() => advance('next')} style={s.navBtn}>
          <Ionicons name="chevron-forward" size={28} color={WHITE_70} />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND_PURPLE },

  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  progressFill:  { height: 3, backgroundColor: WHITE, borderRadius: 2 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12,
  },
  headerTitle: { fontSize: 18, color: WHITE, fontFamily: 'Volte-Semibold' },

  // Card area — flex container, centers the deck stack vertically
  area: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Ghost cards — same height as card, offset down so they peek below
  ghost: {
    position: 'absolute',
    height: CARD_H,
    borderRadius: 28,
  },
  ghost3: {
    top: 24,
    left: 16,
    right: 16,
    backgroundColor: CARD_GHOST_3,
  },
  ghost2: {
    top: 12,
    left: 8,
    right: 8,
    backgroundColor: CARD_GHOST_2,
  },

  // Main card — fills the area width, sits above ghosts
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CARD_H,
    borderRadius: 28,
    backgroundColor: CARD_PURPLE,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInner: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Flip faces — fill parent card absolutely
  face: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 28,
    backgroundColor: CARD_PURPLE,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  faceBack: { backgroundColor: CARD_PURPLE },

  // Card content
  illustration:   { width: '60%', aspectRatio: 1, marginBottom: 24 },
  word:           { fontSize: 56, color: WHITE, fontFamily: 'Volte-Bold' },
  speaker:        { position: 'absolute', bottom: 20, right: 20 },

  backTop: {
    flexDirection: 'row', width: '100%',
    justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20,
  },
  wordSm:        { fontSize: 40, color: WHITE, fontFamily: 'Volte-Bold' },
  illustrationSm:{ width: 80, height: 80 },
  pinyin:        { fontSize: 22, color: WHITE_70, fontFamily: 'Volte', marginBottom: 12, alignSelf: 'flex-start' },
  posPill: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 20,
  },
  posText:  { fontSize: 13, color: WHITE_70, fontFamily: 'Volte-Medium' },
  meaning:  { fontSize: 32, color: WHITE, fontFamily: 'Volte-Bold', alignSelf: 'flex-start' },

  // Nav
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingBottom: 20, paddingTop: 8, gap: 24,
  },
  navBtn:   { padding: 8 },
  navCount: { fontSize: 15, color: WHITE_70, fontFamily: 'Volte-Medium', minWidth: 50, textAlign: 'center' },
});
