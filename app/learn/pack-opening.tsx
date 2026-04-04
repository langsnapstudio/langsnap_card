import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  PanResponder,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

// ── Constants ──────────────────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const BRAND_PURPLE = '#7D69AB';
const CARD_COLOR   = '#6B5A9E';
const BG_CREAM     = '#F4F0E8';

const PKG_W            = Math.min(360, SCREEN_W - 40);
const PKG_H            = PKG_W * (505 / 320);
const CUT_Y            = PKG_H * 0.1544;
const PKG_LEFT         = (SCREEN_W - PKG_W) / 2;
const PKG_TOP          = Math.min(SCREEN_H * 0.28, SCREEN_H - PKG_H - 40);
const PKG_ENTER_OFFSET = (SCREEN_H / 2 - PKG_H / 2) - PKG_TOP;
const PKG_HALF_OFF     = SCREEN_H - PKG_H / 2 - PKG_TOP;

const CARD_W         = Math.round(PKG_W * 0.90);
const CARD_H         = CARD_W * (400 / 280);
const CARD_LEFT      = (SCREEN_W - CARD_W) / 2;
const CARD_TOP       = (SCREEN_H - CARD_H) / 2;
const CARD_INITIAL_Y = PKG_TOP + CUT_Y + PKG_HALF_OFF - CARD_H / 2 - CARD_TOP;

// 3 depth positions — indexed 0=front,1=mid,2=back
const DEPTH = [
  { scale: 0.93, dy:   0, opacity: 1.00 },
  { scale: 0.90, dy: -12, opacity: 0.55 },
  { scale: 0.87, dy: -24, opacity: 0.25 },
];

// Front card dimensions (all 3 slots share this; scale handles depth)
const FRONT_W    = CARD_W * DEPTH[0].scale;
const FRONT_H    = CARD_H * DEPTH[0].scale;
const FRONT_LEFT = CARD_LEFT + CARD_W * (1 - DEPTH[0].scale) / 2;

// Relative scales (normalised to front = 1)
const REL_MID  = DEPTH[1].scale / DEPTH[0].scale;
const REL_BACK = DEPTH[2].scale / DEPTH[0].scale;

// ── Cards ─────────────────────────────────────────────────────────────────────
const CARDS = [
  { id: '1',  word: '狗', pinyin: 'gǒu',   meaning: 'dog',    partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '2',  word: '猫', pinyin: 'māo',   meaning: 'cat',    partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '3',  word: '鸟', pinyin: 'niǎo',  meaning: 'bird',   partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '4',  word: '鱼', pinyin: 'yú',    meaning: 'fish',   partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '5',  word: '马', pinyin: 'mǎ',    meaning: 'horse',  partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '6',  word: '牛', pinyin: 'niú',   meaning: 'cow/ox', partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '7',  word: '猪', pinyin: 'zhū',   meaning: 'pig',    partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '8',  word: '羊', pinyin: 'yáng',  meaning: 'sheep',  partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '9',  word: '兔', pinyin: 'tù',    meaning: 'rabbit', partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
  { id: '10', word: '熊', pinyin: 'xióng', meaning: 'bear',   partOfSpeech: 'n.', illustration: require('@/assets/images/illustration-dog.png') },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function PackOpeningScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ── 3-slot recycling ──────────────────────────────────────────────────────
  // slotCards[slotIdx] = which CARDS index that slot currently holds
  // frontSlot = which slot is currently in the front (interactive) position
  const slotCardsRef = useRef([0, 1, 2]);
  const frontSlotRef = useRef(0);

  // globalIndex drives the progress bar only
  const globalIndexRef = useRef(0);
  const [globalIndex, setGlobalIndex] = useState(0);

  const isInteractiveRef = useRef(false);
  const isFlippedRef     = useRef(false);
  const isDraggingRef    = useRef(false);

  // Per-slot animated values — slot i always keeps its own values
  const slotOpacity = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  const slotScale   = useRef([1, REL_MID, REL_BACK].map(s => new Animated.Value(s))).current;
  const slotDy      = useRef(Array.from({ length: 3 }, () => new Animated.Value(CARD_INITIAL_Y))).current;

  // Swipe x applies only to whichever slot is front
  const swipeX = useRef(new Animated.Value(0)).current;
  const swipeRotate = swipeX.interpolate({
    inputRange: [-SCREEN_W, 0, SCREEN_W],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  // Flip applies only to front slot
  const flipAnim         = useRef(new Animated.Value(0)).current;
  const frontRotate      = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRotate       = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });
  const frontFaceOpacity = flipAnim.interpolate({ inputRange: [0, 89, 90, 180], outputRange: [1, 1, 0, 0] });
  const backFaceOpacity  = flipAnim.interpolate({ inputRange: [0, 89, 90, 180], outputRange: [0, 0, 1, 1] });

  // ── Pack animation values ──────────────────────────────────────────────────
  const pkgSlide       = useRef(new Animated.Value(PKG_ENTER_OFFSET)).current;
  const cutWidth       = useRef(new Animated.Value(0)).current;
  const topHalfY       = useRef(new Animated.Value(PKG_HALF_OFF)).current;
  const topHalfOpacity = useRef(new Animated.Value(0)).current;
  const bottomHalfY    = useRef(new Animated.Value(SCREEN_H + PKG_H)).current;
  const navOpacity     = useRef(new Animated.Value(0)).current;
  const bgAnim         = useRef(new Animated.Value(0)).current;

  // ── Slot z-index helper — computed each render ────────────────────────────
  // Must be called INSIDE render (after state updates) to be current
  const getZIndex = (slotIdx: number) => {
    const front = frontSlotRef.current;
    const mid   = (front + 1) % 3;
    if (slotIdx === front) return 22;
    if (slotIdx === mid)   return 21;
    return 20;
  };

  // ── Swipe exit ────────────────────────────────────────────────────────────
  const triggerExitRef = useRef<(flyDir: 1 | -1) => void>(() => {});
  triggerExitRef.current = (flyDir) => {
    const front    = frontSlotRef.current;
    const mid      = (front + 1) % 3;
    const back     = (front + 2) % 3;
    const nextGI   = globalIndexRef.current + 1;

    // Which depth positions will be occupied after the transition?
    const willHaveMid  = nextGI + 1 < CARDS.length;
    const willHaveBack = nextGI + 2 < CARDS.length;

    // Only animate visible slots
    const hasMid  = globalIndexRef.current + 1 < CARDS.length;
    const hasBack = globalIndexRef.current + 2 < CARDS.length;

    const DUR  = 280;
    const ease = Easing.out(Easing.quad);

    Animated.parallel([
      // Front flies off
      Animated.timing(swipeX, { toValue: flyDir * SCREEN_W * 1.5, duration: DUR, easing: ease, useNativeDriver: true }),
      // Mid → front (content already rendered — no re-render needed!)
      ...(hasMid ? [
        Animated.timing(slotScale[mid],   { toValue: 1,       duration: DUR, easing: ease, useNativeDriver: true }),
        Animated.timing(slotDy[mid],      { toValue: 0,        duration: DUR, easing: ease, useNativeDriver: true }),
        Animated.timing(slotOpacity[mid], { toValue: 1.0,      duration: DUR,               useNativeDriver: true }),
      ] : []),
      // Back → mid
      ...(hasBack ? [
        Animated.timing(slotScale[back],   { toValue: REL_MID, duration: DUR, easing: ease, useNativeDriver: true }),
        Animated.timing(slotDy[back],      { toValue: -12,      duration: DUR, easing: ease, useNativeDriver: true }),
        Animated.timing(slotOpacity[back], { toValue: 0.55,     duration: DUR,               useNativeDriver: true }),
      ] : []),
    ]).start(() => {
      // ── All setValue in one JS tick (same native frame) ─────────────────
      swipeX.setValue(0);
      flipAnim.setValue(0);
      isFlippedRef.current = false;

      // Advance front pointer
      frontSlotRef.current = mid;

      // Recycle old front slot as the new back
      const newBackCardIdx = nextGI + 2;
      slotCardsRef.current[front] = newBackCardIdx; // assign new content
      slotOpacity[front].setValue(0);               // hide instantly (content change happens on next render)
      slotScale[front].setValue(REL_BACK);
      slotDy[front].setValue(-24);

      // Snap mid and back to their precise base positions
      slotScale[mid].setValue(1);     slotDy[mid].setValue(0);   slotOpacity[mid].setValue(1.0);
      slotScale[back].setValue(REL_MID); slotDy[back].setValue(-12); slotOpacity[back].setValue(willHaveMid ? 0.55 : 0);

      globalIndexRef.current = nextGI;

      if (nextGI >= CARDS.length) {
        router.push({ pathname: '/learn/success', params: { ...params, cardCount: String(CARDS.length) } });
        return;
      }

      // Update progress bar (triggers re-render — content in recycled slot now correct)
      setGlobalIndex(nextGI);

      // Fade recycled slot (new back) in after React re-renders its content
      if (willHaveBack && newBackCardIdx < CARDS.length) {
        requestAnimationFrame(() => {
          Animated.timing(slotOpacity[front], { toValue: 0.25, duration: 200, useNativeDriver: true }).start();
        });
      }
    });
  };

  // ── PanResponder ──────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        isInteractiveRef.current && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => { isDraggingRef.current = true; },
      onPanResponderMove: (_, g) => { swipeX.setValue(g.dx); },
      onPanResponderRelease: (_, g) => {
        isDraggingRef.current = false;
        if (Math.abs(g.dx) > 100 || Math.abs(g.vx) > 0.5) {
          triggerExitRef.current(g.dx > 0 ? 1 : -1);
        } else {
          Animated.spring(swipeX, { toValue: 0, friction: 8, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        Animated.spring(swipeX, { toValue: 0, friction: 8, useNativeDriver: true }).start();
      },
    })
  ).current;

  // ── Flip ──────────────────────────────────────────────────────────────────
  const handleFlip = () => {
    if (!isInteractiveRef.current || isDraggingRef.current) return;
    const toValue = isFlippedRef.current ? 0 : 180;
    isFlippedRef.current = !isFlippedRef.current;
    Animated.spring(flipAnim, { toValue, friction: 8, tension: 40, useNativeDriver: true }).start();
  };

  // ── Pack opening + card entrance ──────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => {
      Animated.timing(pkgSlide, {
        toValue: PKG_HALF_OFF, duration: 700,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }).start();
    }, 300);

    const t2 = setTimeout(() => {
      Animated.timing(cutWidth, { toValue: PKG_W, duration: 1000, useNativeDriver: false }).start();
    }, 1800);

    const t3 = setTimeout(() => {
      topHalfOpacity.setValue(1);
      pkgSlide.setValue(SCREEN_H * 3);
      bottomHalfY.setValue(PKG_HALF_OFF);

      Animated.parallel([
        Animated.timing(topHalfY,       { toValue: SCREEN_H / 2 - PKG_TOP, duration: 1000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(topHalfOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]).start(() => {
        Animated.timing(bottomHalfY, { toValue: SCREEN_H, duration: 1000, useNativeDriver: true }).start();

        // Spring all 3 slots to their entrance positions staggered
        [0, 1, 2].forEach((slotIdx, order) => {
          const d = DEPTH[order]; // slot 0=front, 1=mid, 2=back at start
          const cardExists = slotCardsRef.current[slotIdx] < CARDS.length;
          setTimeout(() => {
            Animated.parallel([
              Animated.spring(slotDy[slotIdx], { toValue: d.dy, friction: 7, tension: 50, useNativeDriver: true }),
              Animated.timing(slotOpacity[slotIdx], { toValue: cardExists ? d.opacity : 0, duration: 400, useNativeDriver: true }),
            ]).start();
          }, order * 300);
        });
      });
    }, 3200);

    const t4 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(bgAnim,     { toValue: 1, duration: 600, useNativeDriver: false }),
        Animated.timing(navOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        isInteractiveRef.current = true;
      });
    }, 5200);

    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  const progress = (globalIndex + 1) / CARDS.length;

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1], outputRange: [BG_CREAM, BRAND_PURPLE],
  });

  const ghostLayout = {
    position: 'absolute' as const,
    left:        FRONT_LEFT,
    top:         CARD_TOP,
    width:       FRONT_W,
    height:      FRONT_H,
    borderRadius: 20,
    backgroundColor: CARD_COLOR,
  };

  // ── Render each slot ──────────────────────────────────────────────────────
  const renderSlot = (slotIdx: number) => {
    const isFront  = slotIdx === frontSlotRef.current;
    const cardIdx  = slotCardsRef.current[slotIdx];
    const card     = CARDS[cardIdx];
    const zIndex   = getZIndex(slotIdx);

    if (!card) return null;

    const transforms: any[] = [
      { translateY: slotDy[slotIdx] },
    ];
    if (isFront) {
      transforms.push({ translateX: swipeX });
      transforms.push({ rotate: swipeRotate });
    } else {
      transforms.push({ scale: slotScale[slotIdx] });
    }

    return (
      <Animated.View
        key={slotIdx}
        style={[ghostLayout, {
          zIndex,
          opacity: slotOpacity[slotIdx],
          transform: transforms,
        }]}
        {...(isFront ? panResponder.panHandlers : {})}
      >
        {isFront ? (
          // Front: full flip interaction
          <Pressable style={StyleSheet.absoluteFill} onPress={handleFlip}>
            <Animated.View style={[styles.abs, styles.face, {
              opacity: frontFaceOpacity,
              transform: [{ perspective: 1200 }, { rotateY: frontRotate }],
            }]}>
              <Image source={card.illustration} style={styles.illustration} resizeMode="contain" />
              <Text style={styles.wordText}>{card.word}</Text>
              <Text style={styles.tapHint}>Tap to reveal</Text>
            </Animated.View>
            <Animated.View style={[styles.abs, styles.face, {
              opacity: backFaceOpacity,
              transform: [{ perspective: 1200 }, { rotateY: backRotate }],
            }]}>
              <Text style={styles.pinyinText}>{card.pinyin}</Text>
              <View style={styles.posPill}>
                <Text style={styles.posText}>{card.partOfSpeech}</Text>
              </View>
              <Text style={styles.meaningText}>{card.meaning}</Text>
              <Text style={styles.tapHint}>Tap to flip back</Text>
            </Animated.View>
          </Pressable>
        ) : (
          // Ghost: pre-render content so it's painted before it arrives at front
          <View style={[styles.face, { opacity: 0.0 }]}>
            <Image source={card.illustration} style={styles.illustration} resizeMode="contain" />
            <Text style={styles.wordText}>{card.word}</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[styles.root, { backgroundColor: bgColor }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── Bottom half ──────────────────────────────────────────────────── */}
      <Animated.View style={[styles.abs, {
        left: PKG_LEFT, top: PKG_TOP + CUT_Y,
        width: PKG_W, height: PKG_H - CUT_Y,
        overflow: 'hidden', zIndex: 28,
        transform: [{ translateY: bottomHalfY }],
      }]}>
        <Image source={require('@/assets/images/pack_bag_animals.png')}
          style={{ width: PKG_W, height: PKG_H, marginTop: -CUT_Y }} resizeMode="contain" />
      </Animated.View>

      {/* ── Full pack ────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.abs, {
        left: PKG_LEFT, top: PKG_TOP,
        width: PKG_W, height: PKG_H,
        zIndex: 30,
        transform: [{ translateY: pkgSlide }],
      }]}>
        <Image source={require('@/assets/images/pack_bag_animals.png')}
          style={{ width: PKG_W, height: PKG_H }} resizeMode="contain" />
        <Animated.View style={[styles.cutLine, { width: cutWidth, top: CUT_Y - 1 }]} />
      </Animated.View>

      {/* ── Top half ─────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.abs, {
        left: PKG_LEFT, top: PKG_TOP,
        width: PKG_W, height: CUT_Y,
        overflow: 'hidden', zIndex: 31,
        opacity: topHalfOpacity,
        transform: [{ translateY: topHalfY }],
      }]}>
        <Image source={require('@/assets/images/pack_bag_animals.png')}
          style={{ width: PKG_W, height: PKG_H }} resizeMode="contain" />
      </Animated.View>

      {/* ── 3 card slots (rendered back→front for correct z stacking) ──── */}
      {[2, 1, 0].map(renderSlot)}

      {/* ── Top nav ──────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.navBar, { opacity: navOpacity }]}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="exit-outline" size={26} color="white"
              style={{ transform: [{ scaleX: -1 }] }} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Learn</Text>
          <TouchableOpacity hitSlop={12}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  abs:  { position: 'absolute' },

  cutLine: {
    position: 'absolute', left: 0, height: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#fff', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 6, elevation: 4,
  },

  face: {
    width: '100%', height: '100%',
    borderRadius: 20,
    backgroundColor: CARD_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },

  illustration: { width: 90, height: 90, marginBottom: 16 },
  wordText:    { fontSize: 48, color: '#fff', fontFamily: 'Volte-Bold' },
  tapHint: {
    position: 'absolute', bottom: 20,
    fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: 'Volte-Semibold',
  },
  pinyinText: { fontSize: 24, color: 'rgba(255,255,255,0.7)', fontFamily: 'Volte-Semibold', marginBottom: 12 },
  posPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 16,
  },
  posText:    { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Volte-Semibold' },
  meaningText:{ fontSize: 36, color: '#fff', fontFamily: 'Volte-Bold' },

  navBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 50 },
  progressFill:  { height: '100%', backgroundColor: 'rgba(255,255,255,0.85)' },
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16,
  },
  navTitle: { fontSize: 18, color: '#fff', fontFamily: 'Volte-Semibold' },
});
