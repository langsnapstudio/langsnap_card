import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { incrementFeat } from '@/constants/feat-store';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const WHITE        = '#FFFFFF';
const GREEN        = '#22C55E';
const RED          = '#EF4444';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Score tiers ────────────────────────────────────────────────────────────────
function getTier(ratio: number): { title: string; subtitle: string; showConfetti: boolean; scoreColor: string } {
  if (ratio === 1)        return { title: 'Flawless!',            subtitle: 'You got every single one.\nAbsolute legend.',        showConfetti: true,  scoreColor: GREEN };
  if (ratio >= 0.8)       return { title: 'So close to perfect!', subtitle: 'Your memory is sharper\nthan it looks.',             showConfetti: true,  scoreColor: GREEN };
  if (ratio >= 0.6)       return { title: 'Solid effort!',        subtitle: "You're building something real.\nKeep going.",       showConfetti: false, scoreColor: GREEN };
  if (ratio >= 0.4)       return { title: 'Room to grow',         subtitle: "Every miss is a word that'll\nstick next time.",     showConfetti: false, scoreColor: RED   };
  return                         { title: 'The grind starts here', subtitle: "Don't worry — even the best\nstarted at zero.",     showConfetti: false, scoreColor: RED   };
}

// ── Confetti ──────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#4F8EF7', '#FF6B6B', '#FFD93D', '#6BCB77', '#C77DFF', '#FF9F1C', '#FF9AD5'];
const CONFETTI_COUNT  = 55;

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

// ── Animated score counter ─────────────────────────────────────────────────────
function AnimatedScore({ score, total, scoreColor }: { score: number; total: number; scoreColor: string }) {
  const animVal      = useRef(new Animated.Value(0)).current;
  const displayRef   = useRef(new Animated.Value(0)).current;

  // We drive a JS counter via listener for the number, and scale+opacity via native driver
  const [displayCount, setDisplayCount] = React.useState(0);

  const scale   = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pop-in animation
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Count-up
    const listenerId = animVal.addListener(({ value }) => {
      setDisplayCount(Math.round(value));
    });
    Animated.timing(animVal, {
      toValue:         score,
      duration:        900,
      easing:          Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setDisplayCount(score);
      animVal.removeListener(listenerId);
    });

    return () => animVal.removeAllListeners();
  }, []);

  return (
    <Animated.View style={[styles.scoreCircle, { transform: [{ scale }], opacity }]}>
      <Text style={styles.scoreLabel}>Your score</Text>
      <Text style={[styles.scoreNum, { color: scoreColor }]}>{displayCount}</Text>
      <Text style={styles.scoreDenom}>of {total}</Text>
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function QuizResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ score: string; total: string }>();

  const score = parseInt(params.score ?? '0', 10);
  const total = parseInt(params.total ?? '0', 10);
  const ratio = total > 0 ? score / total : 0;

  const { title, subtitle, showConfetti, scoreColor } = getTier(ratio);

  // Staggered fade-in for title + subtitle + bar + button
  const titleOpacity    = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    incrementFeat('quiz_taker');
    Animated.stagger(120, [
      Animated.timing(titleOpacity,    { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(btnOpacity,      { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        <View style={styles.content}>
          {/* Score */}
          <AnimatedScore score={score} total={total} scoreColor={scoreColor} />

          {/* Title */}
          <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
            {title}
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
            {subtitle}
          </Animated.Text>

        </View>

        {/* Done button */}
        <Animated.View style={{ opacity: btnOpacity, paddingHorizontal: 24, paddingBottom: 8 }}>
          <TouchableOpacity
            style={styles.doneBtn}
            activeOpacity={0.85}
            onPress={() => router.replace('/(tabs)/review')}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>

      </SafeAreaView>

      {showConfetti && <Confetti />}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND_PURPLE },
  safe: { flex: 1 },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },

  // Score circle
  scoreCircle: {
    width: 190, height: 190, borderRadius: 95,
    backgroundColor: '#F5F0E8',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
    gap: 2,
  },
  scoreLabel:{ fontSize: 14, fontFamily: 'Volte-Medium', color: '#525252' },
  scoreNum:  { fontSize: 80, fontFamily: 'Volte-Semibold', lineHeight: 88 },
  scoreDenom:{ fontSize: 18, fontFamily: 'Volte-Medium', color: '#525252' },

  // Text
  title: {
    fontSize: 26,
    fontFamily: 'Volte-Semibold',
    color: WHITE,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Volte-Medium',
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Done button
  doneBtn: {
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 17, fontFamily: 'Volte-Semibold', color: BRAND_PURPLE },
});
