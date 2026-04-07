import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { getReviewSummary } from '@/constants/review-store';
import type { Card } from '@/constants/mock-packs';
import { cardTextColor } from '@/constants/mock-packs';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const WHITE        = '#FFFFFF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';
const GREEN        = '#22C55E';
const RED          = '#EF4444';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Confetti (same as success screen) ─────────────────────────────────────────
const CONFETTI_COLORS = ['#4F8EF7', '#FF6B6B', '#FFD93D', '#6BCB77', '#C77DFF', '#FF9F1C', '#FF9AD5'];
const CONFETTI_COUNT  = 50;

type ConfettiPiece = {
  x: number; color: string; w: number; h: number;
  fallAnim: Animated.Value; rotateAnim: Animated.Value;
  duration: number; delay: number;
};

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, () => ({
    x:          Math.random() * SCREEN_W,
    color:      CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    w:          7 + Math.random() * 7,
    h:          4 + Math.random() * 4,
    fallAnim:   new Animated.Value(0),
    rotateAnim: new Animated.Value(0),
    duration:   2400 + Math.random() * 2000,
    delay:      Math.random() * 1500,
  }));
}

function Confetti() {
  const pieces = useRef<ConfettiPiece[]>(makeConfetti()).current;
  useEffect(() => {
    pieces.forEach(p => {
      Animated.loop(Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(p.fallAnim, { toValue: 1, duration: p.duration, useNativeDriver: true }),
      ])).start();
      Animated.loop(
        Animated.timing(p.rotateAnim, { toValue: 1, duration: p.duration * 0.7, useNativeDriver: true })
      ).start();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => {
        const translateY = p.fallAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, SCREEN_H + 24] });
        const rotate     = p.rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
        return (
          <Animated.View key={i} style={{
            position: 'absolute', left: p.x, top: 0,
            width: p.w, height: p.h, borderRadius: 2,
            backgroundColor: p.color,
            transform: [{ translateY }, { rotate }],
          }} />
        );
      })}
    </View>
  );
}

// ── Animated progress ring ─────────────────────────────────────────────────────
const RING_SIZE     = 160;
const RADIUS        = 62;
const STROKE        = 11;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ANIM_DURATION = 1200;

// AnimatedCircle — lets us pass Animated interpolated values as SVG props
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ProgressRing({ remembered, total }: { remembered: number; total: number }) {
  const ratio = total > 0 ? remembered / total : 0;

  // Single animated value drives both the arc and the counter
  const animVal = useRef(new Animated.Value(0)).current;
  const [displayCount, setDisplayCount] = useState(0);

  // Interpolate arc offset: 0 → full circle, ratio → partial fill
  const strokeDashoffset = animVal.interpolate({
    inputRange:  [0, Math.max(ratio, 0.001)],
    outputRange: [CIRCUMFERENCE, CIRCUMFERENCE * (1 - ratio)],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const listenerId = animVal.addListener(({ value }) => {
      setDisplayCount(Math.round((value / Math.max(ratio, 0.001)) * remembered));
    });

    Animated.timing(animVal, {
      toValue:        ratio,
      duration:       ANIM_DURATION,
      easing:         Easing.out(Easing.cubic),
      useNativeDriver: false, // required for SVG props
    }).start(() => {
      setDisplayCount(remembered); // snap to exact value on complete
      animVal.removeListener(listenerId);
    });

    return () => animVal.removeAllListeners();
  }, []);

  return (
    <View style={ring.wrapper}>
      <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        {/* Track */}
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
          stroke="#E0DBF0"
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Animated fill */}
        <AnimatedCircle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
          stroke={GREEN}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      {/* Animated counter */}
      <View style={ring.center}>
        <View style={ring.scoreRow}>
          <Text style={ring.scoreNum}>{displayCount}</Text>
          <Text style={ring.scoreDenom}>/{total}</Text>
        </View>
        <Text style={ring.label}>REMEMBER</Text>
      </View>
    </View>
  );
}

const ring = StyleSheet.create({
  wrapper: {
    width: RING_SIZE, height: RING_SIZE,
    alignItems: 'center', justifyContent: 'center',
  },
  center:    { position: 'absolute', alignItems: 'center' },
  scoreRow:  { flexDirection: 'row', alignItems: 'baseline' },
  scoreNum:  { fontSize: 36, fontFamily: 'Volte-Semibold', color: BRAND_PURPLE },
  scoreDenom:{ fontSize: 20, fontFamily: 'Volte-Semibold', color: TEXT_MUTED },
  label:     { fontSize: 10, fontFamily: 'Volte-Semibold', color: TEXT_MUTED, letterSpacing: 1, marginTop: 2 },
});

// ── Card row ──────────────────────────────────────────────────────────────────
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

// ── Summary Screen ────────────────────────────────────────────────────────────
export default function ReviewSummaryScreen() {
  const router  = useRouter();
  const summary = getReviewSummary();

  const remembered = summary?.remembered ?? [];
  const forgot     = summary?.forgot ?? [];
  const total      = remembered.length + forgot.length;

  const showConfetti = total > 0 && remembered.length / total >= 0.8;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* Header */}
        <Text style={styles.title}>How you did this time</Text>

        {/* Progress ring — centered */}
        <View style={styles.ringRow}>
          <ProgressRing remembered={remembered.length} total={total} />
        </View>

        {/* Card list */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {forgot.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: RED }]}>FORGOT</Text>
                <Text style={[styles.sectionCount, { color: RED }]}>{forgot.length}</Text>
              </View>
              {forgot.map((card, i) => <CardRow key={`forgot-${i}-${card.id}`} card={card} />)}
            </>
          )}

          {remembered.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: GREEN }]}>REMEMBER</Text>
                <Text style={[styles.sectionCount, { color: GREEN }]}>{remembered.length}</Text>
              </View>
              {remembered.map((card, i) => <CardRow key={`remembered-${i}-${card.id}`} card={card} />)}
            </>
          )}
        </ScrollView>

        {/* Done button */}
        <TouchableOpacity
          style={styles.doneBtn}
          activeOpacity={0.85}
          onPress={() => router.replace('/(tabs)/review')}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>

      </SafeAreaView>

      {/* Confetti — only when ≥ 80% remembered */}
      {showConfetti && <Confetti />}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: WHITE, overflow: 'hidden' },
  safeArea:{ flex: 1 },

  title: {
    fontSize: 22,
    fontFamily: 'Volte-Semibold',
    color: BRAND_PURPLE,
    textAlign: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    marginBottom: 4,
  },

  ringRow: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  scroll:        { flex: 1, backgroundColor: '#F8F5EF' },
  scrollContent: { paddingBottom: 16 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0EDE8',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: { fontSize: 13, fontFamily: 'Volte-Semibold', letterSpacing: 1.2 },
  sectionCount: { fontSize: 13, fontFamily: 'Volte-Semibold' },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDE8',
    gap: 16,
  },
  cardThumb:     { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardThumbImg:  { width: 24, height: 24 },
  cardThumbWord: { fontSize: 20, fontFamily: 'Volte-Semibold' },
  cardInfo:      { flex: 1 },
  cardMeaning:   { fontSize: 16, fontFamily: 'Volte-Semibold', color: TEXT_DARK, marginBottom: 3 },
  cardPinyin:    { fontSize: 14, fontFamily: 'Volte-Medium',   color: BRAND_PURPLE },

  doneBtn: {
    margin: 20,
    backgroundColor: BRAND_PURPLE,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 17, fontFamily: 'Volte-Semibold', color: WHITE },
});
