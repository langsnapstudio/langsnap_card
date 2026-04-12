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
import { getReviewSummary } from '@/constants/review-store';
import type { Card } from '@/constants/mock-packs';
import { cardTextColor } from '@/constants/mock-packs';
import { incrementFeat } from '@/constants/feat-store';
import { recordStudySession } from '@/constants/streak-store';
import { useAuth } from '@/lib/auth';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const WHITE        = '#FFFFFF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#525252';
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

// ── Animated progress bar ──────────────────────────────────────────────────────
const ANIM_DURATION = 1200;

function ProgressBar({ remembered, total }: { remembered: number; total: number }) {
  const ratio    = total > 0 ? remembered / total : 0;
  const animVal  = useRef(new Animated.Value(0)).current;
  const [displayCount, setDisplayCount] = useState(0);

  const fillWidth = animVal.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const listenerId = animVal.addListener(({ value }) => {
      setDisplayCount(Math.round(value * remembered));
    });
    Animated.timing(animVal, {
      toValue:         ratio,
      duration:        ANIM_DURATION,
      easing:          Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setDisplayCount(remembered);
      animVal.removeListener(listenerId);
    });
    return () => animVal.removeAllListeners();
  }, []);

  return (
    <View style={bar.wrapper}>
      <View style={bar.scoreRow}>
        <Text style={bar.scoreNum}>{displayCount}</Text>
        <Text style={bar.scoreDenom}>/{total}</Text>
      </View>
      <Text style={bar.label}>REMEMBER</Text>
      <View style={bar.track}>
        <Animated.View style={[bar.fill, { width: fillWidth }]} />
      </View>
    </View>
  );
}

const bar = StyleSheet.create({
  wrapper:   { paddingHorizontal: 28, paddingTop: 8, paddingBottom: 32, alignItems: 'center' },
  scoreRow:  { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  scoreNum:  { fontSize: 52, fontFamily: 'Volte-Semibold', color: WHITE },
  scoreDenom:{ fontSize: 26, fontFamily: 'Volte-Semibold', color: 'rgba(255,255,255,0.55)' },
  label:     { fontSize: 13, fontFamily: 'Volte-Semibold', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.2, marginBottom: 20 },
  track:     { height: 10, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden', alignSelf: 'stretch' },
  fill:      { height: 10, borderRadius: 6, backgroundColor: GREEN },
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
  const { profile } = useAuth();
  const summary = getReviewSummary();

  const remembered = summary?.remembered ?? [];
  const forgot     = summary?.forgot ?? [];
  const total      = remembered.length + forgot.length;

  const showConfetti = total > 0 && remembered.length / total >= 0.8;

  // Record study session + feats on mount
  useEffect(() => {
    const lang = profile?.target_language ?? 'mainland';
    const isPremium = false;
    recordStudySession(lang, isPremium);
    incrementFeat('first_review');
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* Purple header */}
        <View style={styles.header}>
          <Text style={styles.title}>How you did this time</Text>
          <ProgressBar remembered={remembered.length} total={total} />
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

  header: {
    backgroundColor: BRAND_PURPLE,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Volte-Semibold',
    color: WHITE,
    textAlign: 'center',
    paddingTop: 28,
    paddingHorizontal: 24,
    marginBottom: 16,
  },

  scroll:        { flex: 1, backgroundColor: '#F8F5EF' },
  scrollContent: { paddingBottom: 16 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 6,
  },
  sectionTitle: { fontSize: 12, fontFamily: 'Volte-Semibold', letterSpacing: 1.4 },
  sectionCount: { fontSize: 12, fontFamily: 'Volte-Semibold' },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
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
