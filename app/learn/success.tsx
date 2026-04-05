import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { getCurrentPack } from '@/constants/pack-store';
import { cardTextColor } from '@/constants/mock-packs';
import type { Card } from '@/constants/mock-packs';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE  = '#7D69AB';
const DEEP_PURPLE   = '#6B5A9E'; // slightly darker for share card bg
const WHITE         = '#FFFFFF';
const WHITE_70      = 'rgba(255,255,255,0.7)';
const WHITE_40      = 'rgba(255,255,255,0.4)';

const SCREEN_WIDTH  = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Share card dimensions — 9:16 story ratio, sized for crisp rendering
const SHARE_W = 390;
const SHARE_H = Math.round(SHARE_W * (16 / 9)); // 693px

// Card fan angles — left, centre, right
const FAN_POSITIONS = [
  { rotate: '-18deg', translateX: -70, translateY: 20 },
  { rotate:   '0deg', translateX:   0, translateY:  0 },
  { rotate:  '18deg', translateX:  70, translateY: 20 },
];

// Pick the 3 fan cards — uses featuredCardIds if set by back office, else random
function pickFanCards(cards: Card[], featuredIds?: [string, string, string]): Card[] {
  if (!cards.length) return [];
  if (featuredIds) {
    const byId = Object.fromEntries(cards.map(c => [c.id, c]));
    const pinned = featuredIds.map(id => byId[id]).filter(Boolean);
    if (pinned.length === 3) return pinned;
  }
  return [...cards].sort(() => Math.random() - 0.5).slice(0, 3);
}

// ── Confetti ───────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#4F8EF7', '#FF6B6B', '#FFD93D', '#6BCB77', '#C77DFF', '#FF9F1C', '#FF9AD5'];
const CONFETTI_COUNT  = 40;

type ConfettiPiece = {
  x: number; color: string; w: number; h: number;
  fallAnim: Animated.Value; rotateAnim: Animated.Value;
  duration: number; delay: number;
};

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, () => ({
    x:          Math.random() * SCREEN_WIDTH,
    color:      CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    w:          7 + Math.random() * 7,
    h:          4 + Math.random() * 4,
    fallAnim:   new Animated.Value(0),
    rotateAnim: new Animated.Value(0),
    duration:   2400 + Math.random() * 2000,
    delay:      Math.random() * 2500,
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
        const translateY = p.fallAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, SCREEN_HEIGHT + 24] });
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

// ── Fan card (reused in both live screen and share image) ──────────────────────
function FanCardView({ card, size = 160 }: { card: Card; size?: number }) {
  const h         = Math.round(size * (220 / 160));
  const imgSize   = Math.round(size * 0.44);
  const fontSize  = Math.round(size * 0.225);
  const bgColor   = card.cardColor;
  const txtColor  = cardTextColor(bgColor);
  return (
    <View style={{
      width: size, height: h, borderRadius: 20,
      backgroundColor: bgColor,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
    }}>
      <Image source={card.illustrationUrl as any} style={{ width: imgSize, height: imgSize }} resizeMode="contain" />
      <Text style={{ fontSize, color: txtColor, fontFamily: 'Volte-Bold', marginTop: 8 }}>{card.word}</Text>
    </View>
  );
}

// ── Success Screen ─────────────────────────────────────────────────────────────
export default function SuccessScreen() {
  const router = useRouter();
  const { deckTitle, cardCount } = useLocalSearchParams<{
    deckId: string; deckTitle: string; cardCount: string;
  }>();

  const packData = getCurrentPack();
  const fanCards = useRef(
    pickFanCards(packData?.pack.cards ?? [], packData?.pack.featuredCardIds)
  ).current;

  const shareRef   = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Live fan animations
  const fanAnims = useRef(FAN_POSITIONS.map(() => new Animated.Value(0))).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ...fanAnims.map((anim, i) =>
          Animated.spring(anim, { toValue: 1, delay: i * 80, friction: 7, tension: 50, useNativeDriver: true })
        ),
      ]),
    ]).start();
  }, []);

  const handleShare = async () => {
    if (isSharing) return;
    try {
      setIsSharing(true);
      // Capture the off-screen story card (full 9:16 layout with logo + text)
      const uri = await captureRef(shareRef, { format: 'png', quality: 1 });

      let igAvailable = false;
      try {
        igAvailable = Platform.OS === 'ios' && await Linking.canOpenURL('instagram-stories://share');
      } catch { /* fall through */ }

      if (igAvailable) {
        await Linking.openURL(`instagram-stories://share?backgroundImage=${encodeURIComponent(uri)}`);
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share to Instagram Story' });
        } else {
          Alert.alert('Sharing not available on this device');
        }
      }
    } catch (e) {
      Alert.alert('Could not share', String(e));
    } finally {
      setIsSharing(false);
    }
  };

  const handleDone = () => {
    router.back();
    router.back();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* ── Live fan (animated) ────────────────────────────────────────── */}
        <View style={styles.fanArea}>
          {FAN_POSITIONS.map((config, i) => {
            const card    = fanCards[i];
            const scale   = fanAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
            const opacity = fanAnims[i];
            return (
              <Animated.View
                key={i}
                style={{
                  position: 'absolute',
                  opacity,
                  transform: [{ scale }, { rotate: config.rotate }, { translateX: config.translateX }, { translateY: config.translateY }],
                }}
              >
                {card ? <FanCardView card={card} size={160} /> : null}
              </Animated.View>
            );
          })}
        </View>

        {/* ── Text ──────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.wellDone}>Well Done!</Text>
          <Text style={styles.subText}>
            You've collected{' '}
            <Text style={styles.countHighlight}>{cardCount ?? '10'}</Text>
            {' '}new flashcards
          </Text>
          {deckTitle ? <Text style={styles.deckName}>{deckTitle}</Text> : null}
        </Animated.View>

        {/* ── Buttons ───────────────────────────────────────────────────── */}
        <Animated.View style={[styles.buttons, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[styles.shareBtn, isSharing && { opacity: 0.7 }]}
            onPress={handleShare} activeOpacity={0.8} disabled={isSharing}
          >
            <Ionicons name="logo-instagram" size={20} color={WHITE} style={{ marginRight: 8 }} />
            <Text style={styles.shareBtnText}>{isSharing ? 'Preparing…' : 'Share to Story'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.7}>
            <Ionicons name="checkmark" size={20} color={WHITE} style={{ marginRight: 6 }} />
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>

      </SafeAreaView>

      {/* ── Off-screen story card (captured for Instagram share) ───────── */}
      {/* Positioned far off-screen so it renders but stays invisible      */}
      <ViewShot
        ref={shareRef}
        options={{ format: 'png', quality: 1 }}
        style={[styles.shareCard, { position: 'absolute', top: SCREEN_HEIGHT * 3, left: 0 }]}
      >
        {/* Background */}
        <View style={StyleSheet.absoluteFill} />

        {/* Fan cards — static, no animation needed for capture */}
        <View style={styles.shareFanArea}>
          {FAN_POSITIONS.map((config, i) => {
            const card = fanCards[i];
            return card ? (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  transform: [
                    { rotate: config.rotate },
                    { translateX: config.translateX },
                    { translateY: config.translateY },
                  ],
                }}
              >
                <FanCardView card={card} size={120} />
              </View>
            ) : null;
          })}
        </View>

        {/* Text */}
        <View style={styles.shareTextBlock}>
          <Text style={styles.shareWellDone}>Well Done! 🎉</Text>
          <Text style={styles.shareSubText}>
            {`You've collected `}
            <Text style={styles.shareCountHighlight}>{cardCount ?? '10'}</Text>
            {` new flashcards`}
          </Text>
          {deckTitle ? <Text style={styles.shareDeckName}>{deckTitle}</Text> : null}
        </View>

        {/* Logo */}
        <Image
          source={require('@/assets/images/logo-inverted.png')}
          style={styles.shareLogo}
          resizeMode="contain"
        />
      </ViewShot>

      {/* Confetti overlay */}
      <Confetti />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BRAND_PURPLE, overflow: 'hidden' },
  safeArea: {
    flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 40,
  },

  // Live fan
  fanArea: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },

  // Text
  content:        { alignItems: 'center', paddingHorizontal: 32, gap: 8 },
  wellDone:       { fontSize: 36, color: WHITE,  fontFamily: 'Volte-Bold', textAlign: 'center' },
  subText:        { fontSize: 17, color: WHITE_70, fontFamily: 'Volte', textAlign: 'center' },
  countHighlight: { color: WHITE, fontFamily: 'Volte-Bold' },
  deckName:       { fontSize: 14, color: WHITE_40, fontFamily: 'Volte', textAlign: 'center' },

  // Buttons
  buttons: { width: '100%', paddingHorizontal: 24, gap: 4, paddingTop: 32 },
  shareBtn: {
    width: '100%', height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  shareBtnText: { fontSize: 16, color: WHITE, fontFamily: 'Volte-Semibold' },
  doneBtn: {
    width: '100%', height: 52, borderRadius: 14,
    backgroundColor: 'transparent',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  doneBtnText: { fontSize: 16, color: WHITE, fontFamily: 'Volte-Semibold' },

  // Off-screen share card (9:16 story ratio)
  shareCard: {
    width: SHARE_W, height: SHARE_H,
    backgroundColor: DEEP_PURPLE,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 100,
    paddingBottom: 60,
    paddingHorizontal: 32,
  },
  shareFanArea: {
    width: SHARE_W, height: 220,
    alignItems: 'center', justifyContent: 'center',
  },
  shareTextBlock: { alignItems: 'center', gap: 8 },
  shareWellDone:       { fontSize: 40, color: WHITE,  fontFamily: 'Volte-Bold', textAlign: 'center' },
  shareSubText:        { fontSize: 18, color: WHITE_70, fontFamily: 'Volte', textAlign: 'center' },
  shareCountHighlight: { color: WHITE, fontFamily: 'Volte-Bold' },
  shareDeckName:       { fontSize: 14, color: WHITE_40, fontFamily: 'Volte', textAlign: 'center' },
  shareLogo:           { width: 100, height: 40 },
});
