import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.6 4.6 0 01-2 3.02v2.5h3.24c1.9-1.75 3-4.33 3-7.31z" fill="#4285F4" />
      <Path d="M10 20c2.7 0 4.97-.9 6.63-2.46l-3.24-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H1.07v2.58A10 10 0 0010 20z" fill="#34A853" />
      <Path d="M4.41 11.88A6.01 6.01 0 014.1 10c0-.65.11-1.28.31-1.88V5.54H1.07A10 10 0 000 10c0 1.61.38 3.13 1.07 4.46l3.34-2.58z" fill="#FBBC05" />
      <Path d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.86-2.86C14.96.99 12.7 0 10 0A10 10 0 001.07 5.54l3.34 2.58C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335" />
    </Svg>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE    = '#7D69AB';
const BG_CREAM        = '#F8F5EF';
const TEXT_DARK       = '#262626';
const GOOGLE_BTN_BORDER = '#CFD4DC';
const GOOGLE_BTN_TEXT   = '#344054';

// Matches Figma Make: 3 flashcards cycling
const FLASHCARDS = [
  { char: '狗',  color: '#7d69ab', image: require('@/assets/images/illustration-dog.png') },
  { char: '菠萝', color: '#ab9b69', image: require('@/assets/images/illustration-pineapple.png') },
  { char: '珍奶', color: '#ab6969', image: require('@/assets/images/illustration-bubble-tea.png') },
];

const EASE = Easing.inOut(Easing.ease);

// Stack slot positions — all cards share top:0, transforms handle visual placement
// ty is derived so each card's visual top edge matches: front=32, middle=16, back=0
const DEPTH_POS = [
  { ty: 32,  scl: 1.000, opa: 1.0 }, // 0: front
  { ty: 11,  scl: 0.933, opa: 0.6 }, // 1: middle  (visual top ≈ 16)
  { ty: -13, scl: 0.817, opa: 0.2 }, // 2: back    (visual top ≈ 0)
  { ty: -13, scl: 0.817, opa: 0.0 }, // 3: hidden  (same position, invisible)
] as const;
const EXIT_POS = { ty: 52, scl: 1.0, opa: 0.0 };

// ── FlashcardStack ─────────────────────────────────────────────────────────────
// 4 rotating slots — all 3 visible cards animate simultaneously:
//   front exits down, middle shifts to front, back shifts to middle, hidden fades in as new back
function FlashcardStack() {
  // 4 slots × 3 props = 12 shared values
  const s0ty = useSharedValue(DEPTH_POS[0].ty); const s0scl = useSharedValue(DEPTH_POS[0].scl); const s0opa = useSharedValue(DEPTH_POS[0].opa);
  const s1ty = useSharedValue(DEPTH_POS[1].ty); const s1scl = useSharedValue(DEPTH_POS[1].scl); const s1opa = useSharedValue(DEPTH_POS[1].opa);
  const s2ty = useSharedValue(DEPTH_POS[2].ty); const s2scl = useSharedValue(DEPTH_POS[2].scl); const s2opa = useSharedValue(DEPTH_POS[2].opa);
  const s3ty = useSharedValue(DEPTH_POS[3].ty); const s3scl = useSharedValue(DEPTH_POS[3].scl); const s3opa = useSharedValue(DEPTH_POS[3].opa);

  const animsRef = useRef([
    { ty: s0ty, scl: s0scl, opa: s0opa },
    { ty: s1ty, scl: s1scl, opa: s1opa },
    { ty: s2ty, scl: s2scl, opa: s2opa },
    { ty: s3ty, scl: s3scl, opa: s3opa },
  ]);

  const as0 = useAnimatedStyle(() => ({ opacity: s0opa.value, transform: [{ translateY: s0ty.value }, { scale: s0scl.value }] }));
  const as1 = useAnimatedStyle(() => ({ opacity: s1opa.value, transform: [{ translateY: s1ty.value }, { scale: s1scl.value }] }));
  const as2 = useAnimatedStyle(() => ({ opacity: s2opa.value, transform: [{ translateY: s2ty.value }, { scale: s2scl.value }] }));
  const as3 = useAnimatedStyle(() => ({ opacity: s3opa.value, transform: [{ translateY: s3ty.value }, { scale: s3scl.value }] }));
  const animStyles = [as0, as1, as2, as3];

  // slotDepths[i] = depth of slot i (0=front, 1=middle, 2=back, 3=hidden)
  const [slotDepths, setSlotDepths] = useState([0, 1, 2, 3]);
  const slotDepthsRef = useRef([0, 1, 2, 3]);

  // Which flashcard each slot displays; slot 3 pre-loaded with card 0 (first new back)
  const [slotCards, setSlotCards] = useState([0, 1, 2, 0]);
  const nextCardRef = useRef(3);

  const advance = useCallback(() => {
    const depths = slotDepthsRef.current;
    const frontSlot  = depths.indexOf(0);
    const midSlot    = depths.indexOf(1);
    const backSlot   = depths.indexOf(2);
    const hiddenSlot = depths.indexOf(3);
    const a = animsRef.current;
    const cfg = { duration: 500, easing: EASE };

    // Assign next card to the slot about to become the new back
    const nextCard = nextCardRef.current % FLASHCARDS.length;
    nextCardRef.current++;
    setSlotCards(prev => { const n = [...prev]; n[hiddenSlot] = nextCard; return n; });

    // Snap hidden slot to back position (invisible) before it animates in
    a[hiddenSlot].ty.value  = DEPTH_POS[3].ty;
    a[hiddenSlot].scl.value = DEPTH_POS[3].scl;
    a[hiddenSlot].opa.value = 0;

    // Front → exits down, then snaps to hidden
    a[frontSlot].ty.value  = withTiming(EXIT_POS.ty, cfg, () => {
      a[frontSlot].ty.value  = DEPTH_POS[3].ty;
      a[frontSlot].scl.value = DEPTH_POS[3].scl;
      a[frontSlot].opa.value = 0;
    });
    a[frontSlot].scl.value = withTiming(EXIT_POS.scl, cfg);
    a[frontSlot].opa.value = withTiming(EXIT_POS.opa, { duration: 220, easing: EASE }); // fade fast so z-order doesn't matter

    // Middle → front
    a[midSlot].ty.value  = withTiming(DEPTH_POS[0].ty,  cfg);
    a[midSlot].scl.value = withTiming(DEPTH_POS[0].scl, cfg);
    a[midSlot].opa.value = withTiming(DEPTH_POS[0].opa, cfg);

    // Back → middle
    a[backSlot].ty.value  = withTiming(DEPTH_POS[1].ty,  cfg);
    a[backSlot].scl.value = withTiming(DEPTH_POS[1].scl, cfg);
    a[backSlot].opa.value = withTiming(DEPTH_POS[1].opa, cfg);

    // Hidden → back (fade in)
    a[hiddenSlot].ty.value  = withTiming(DEPTH_POS[2].ty,  cfg);
    a[hiddenSlot].scl.value = withTiming(DEPTH_POS[2].scl, cfg);
    a[hiddenSlot].opa.value = withTiming(DEPTH_POS[2].opa, cfg);

    // Rotate depths: 0→3 (exits to hidden), 1→0, 2→1, 3→2
    const newDepths = depths.map(d => (d + 3) % 4);
    slotDepthsRef.current = newDepths;
    setSlotDepths(newDepths);
  }, []);

  useEffect(() => {
    const tid = setInterval(advance, 2500);
    return () => clearInterval(tid);
  }, [advance]);

  return (
    <View style={styles.cardStack}>
      {([0, 1, 2, 3] as const).map(slot => {
        const card = FLASHCARDS[slotCards[slot]];
        const zIndex = 4 - slotDepths[slot]; // front=4, middle=3, back=2, hidden=1
        return (
          <Animated.View
            key={slot}
            style={[styles.cardBase, { backgroundColor: card.color, zIndex }, animStyles[slot]]}
          >
            <Image source={card.image} style={styles.cardImg} resizeMode="contain" />
            <Text style={styles.cardChar}>{card.char}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ── SignInScreen ───────────────────────────────────────────────────────────────
export default function SignInScreen() {
  const { signInWithGoogle } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  async function handleGoogleSignIn() {
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoadingGoogle(false);
    }
  }

  function handleAppleSignIn() {
    // Apple Sign-In — coming soon
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.appName}>Langsnap</Text>
      </View>

      <FlashcardStack />

      <Text style={styles.headline}>
        {'Learn Chinese\nthrough 500+ illustrated flashcard'}
      </Text>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} activeOpacity={0.8} disabled={loadingGoogle}>
          {loadingGoogle
            ? <ActivityIndicator size="small" color={GOOGLE_BTN_TEXT} />
            : <><GoogleIcon size={20} /><Text style={styles.googleButtonText}>Sign in with Google</Text></>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.appleButton} onPress={handleAppleSignIn} activeOpacity={0.8}>
          <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
          <Text style={styles.appleButtonText}>Sign in with Apple</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_CREAM,
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Header
  header: { alignItems: 'center', marginTop: 24 },
  logoImage: { width: 64, height: 64 },
  welcomeText: {
    marginTop: 4,
    fontSize: 24,
    lineHeight: 32,
    color: TEXT_DARK,
    fontFamily: 'Volte-Semibold',
  },
  appName: {
    fontSize: 32,
    lineHeight: 36,
    color: BRAND_PURPLE,
    fontFamily: 'Volte-Semibold',
  },

  // Card stack container — height covers back card (top≈0) through exit overshoot
  cardStack: {
    marginTop: 52,
    width: 120,
    height: 210,
    alignSelf: 'center',
  },
  // All 4 slots share the same base — position is controlled purely by transforms
  cardBase: {
    position: 'absolute',
    width: 120,
    height: 144,
    borderRadius: 16,
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardImg: { width: 48, height: 48, marginBottom: 16 },
  cardChar: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: 'Volte',
  },

  // Headline
  headline: {
    marginTop: 52,
    fontSize: 24,
    lineHeight: 32,
    color: TEXT_DARK,
    textAlign: 'center',
    fontFamily: 'Volte-Semibold',
  },

  // Buttons
  buttonsContainer: {
    marginTop: 'auto',
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: 280,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOOGLE_BTN_BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  googleButtonText: {
    fontSize: 16,
    lineHeight: 24,
    color: GOOGLE_BTN_TEXT,
    fontFamily: 'Volte-Semibold',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: 280,
    height: 44,
    backgroundColor: '#000000',
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  appleButtonText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    fontFamily: 'Volte-Semibold',
  },
});
