import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const BG_CREAM     = '#F8F5EF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';
const WHITE        = '#FFFFFF';

// Card fan angles
const FAN_CARDS = [
  { rotate: '-18deg', translateX: -70, translateY: 20 },
  { rotate:   '0deg', translateX:   0, translateY:  0 },
  { rotate:  '18deg', translateX:  70, translateY: 20 },
];

// ── Success Screen ─────────────────────────────────────────────────────────────
export default function SuccessScreen() {
  const router = useRouter();
  const { deckId, deckTitle, cardCount } = useLocalSearchParams<{
    deckId: string; deckTitle: string; cardCount: string;
  }>();

  // Animate cards fanning out
  const fanAnims = useRef(FAN_CARDS.map(() => new Animated.Value(0))).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ...fanAnims.map((anim, i) =>
          Animated.spring(anim, {
            toValue: 1,
            delay: i * 80,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          })
        ),
      ]),
    ]).start();
  }, []);

  const handleDone = () => {
    router.back();
    router.back(); // back past flashcard to deck detail
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {/* Card fan */}
      <View style={styles.fanArea}>
        {FAN_CARDS.map((config, i) => {
          const scale = fanAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
          const opacity = fanAnims[i];
          return (
            <Animated.View
              key={i}
              style={[
                styles.fanCard,
                {
                  opacity,
                  transform: [
                    { scale },
                    { rotate: config.rotate },
                    { translateX: config.translateX },
                    { translateY: config.translateY },
                  ],
                },
              ]}
            >
              <Image
                source={require('@/assets/images/illustration-dog.png')}
                style={styles.fanCardImage}
                resizeMode="contain"
              />
            </Animated.View>
          );
        })}
      </View>

      {/* Text content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.wellDone}>Well Done!</Text>
        <Text style={styles.subText}>
          You've learned{' '}
          <Text style={styles.countHighlight}>{cardCount ?? '10'}</Text>
          {' '}new words
        </Text>
        {deckTitle ? (
          <Text style={styles.deckName}>{deckTitle}</Text>
        ) : null}
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={[styles.buttons, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8}>
          <Text style={styles.shareBtnText}>Share to Story</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_CREAM,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },

  // Fan
  fanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  fanCard: {
    position: 'absolute',
    width: 160,
    height: 220,
    borderRadius: 20,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  fanCardImage: { width: 100, height: 100 },

  // Text
  content:        { alignItems: 'center', paddingHorizontal: 32, gap: 8 },
  wellDone:       { fontSize: 36, color: TEXT_DARK, fontFamily: 'Volte-Bold', textAlign: 'center' },
  subText:        { fontSize: 17, color: TEXT_MUTED, fontFamily: 'Volte', textAlign: 'center' },
  countHighlight: { color: BRAND_PURPLE, fontFamily: 'Volte-Bold' },
  deckName:       { fontSize: 14, color: TEXT_MUTED, fontFamily: 'Volte', textAlign: 'center' },

  // Buttons
  buttons: { width: '100%', paddingHorizontal: 24, gap: 12, paddingTop: 32 },
  shareBtn: {
    width: '100%', height: 52, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E0DDD8',
    backgroundColor: WHITE,
    alignItems: 'center', justifyContent: 'center',
  },
  shareBtnText: { fontSize: 16, color: TEXT_DARK,  fontFamily: 'Volte-Semibold' },
  doneBtn: {
    width: '100%', height: 52, borderRadius: 14,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
  },
  doneBtnText:  { fontSize: 16, color: WHITE, fontFamily: 'Volte-Semibold' },
});
