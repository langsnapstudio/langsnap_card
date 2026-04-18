import React, { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCurrentPack } from '@/constants/pack-store';
import { cardTextColor } from '@/constants/mock-packs';
import type { ExampleSentence } from '@/constants/mock-packs';
import { useAuth } from '@/lib/auth';
import { useSheetDismiss } from '@/hooks/useSheetDismiss';

const AUTOPLAY_KEY   = 'langsnap:autoplay_audio';
const TUTORIAL_KEY   = 'langsnap:tutorial_learn_shown';

// ── Constants ──────────────────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const BRAND_PURPLE = '#7D69AB';
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

const DEPTH = [
  { scale: 0.93, dy:   0, opacity: 1.0 },
  { scale: 0.90, dy: -12, opacity: 1.0 },
  { scale: 0.87, dy: -24, opacity: 1.0 },
];

const FRONT_W    = CARD_W * DEPTH[0].scale;
const FRONT_H    = CARD_H * DEPTH[0].scale;
const FRONT_LEFT = CARD_LEFT + CARD_W * (1 - DEPTH[0].scale) / 2;

const REL_MID  = DEPTH[1].scale / DEPTH[0].scale;
const REL_BACK = DEPTH[2].scale / DEPTH[0].scale;

const FALLBACK_BAG = require('@/assets/images/pack_bag_animals.png');

// ── Example sentence block ────────────────────────────────────────────────────
function ExampleBlock({ ex, txtColor, mutedTxt, isZhuyin }: {
  ex: ExampleSentence; txtColor: string; mutedTxt: string; isZhuyin: boolean;
}) {
  const romaji = isZhuyin && ex.zhuyin ? ex.zhuyin : ex.pinyin;
  return (
    <View style={exStyles.block}>
      <Text style={[exStyles.chinese, { color: txtColor }]}>{ex.chinese}</Text>
      {!!romaji && <Text style={[exStyles.romaji, { color: mutedTxt }]}>{romaji}</Text>}
      <Text style={[exStyles.meaning, { color: mutedTxt }]}>{ex.meaning}</Text>
    </View>
  );
}
const exStyles = StyleSheet.create({
  block:   { marginBottom: 8 },
  chinese: { fontSize: 14, fontFamily: 'Volte-Semibold', lineHeight: 20 },
  romaji:  { fontSize: 13, fontFamily: 'Volte-Medium',   lineHeight: 19 },
  meaning: { fontSize: 13, fontFamily: 'Volte',          lineHeight: 19 },
});

// ── Component ─────────────────────────────────────────────────────────────────
export default function PackOpeningScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile } = useAuth();
  const isTaiwan  = profile?.target_language === 'taiwan';
  const [showZhuyin, setShowZhuyin] = useState(profile?.reading_system === 'zhuyin');
  const isZhuyin = isTaiwan && showZhuyin;

  const packData   = getCurrentPack();
  const cards      = packData?.pack.cards ?? [];
  const packBagImg = packData?.packBagImage ?? FALLBACK_BAG;

  const slotCardsRef = useRef([0, 1, 2]);
  const frontSlotRef = useRef(0);

  const globalIndexRef = useRef(0);
  const [globalIndex, setGlobalIndex] = useState(0);

  const soundRef      = useRef<Audio.Sound | null>(null);
  const isPlayingRef  = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [showTutorial, setShowTutorial] = useState(false);
  const tutorialOpacity = useRef(new Animated.Value(0)).current;
  const shouldShowTutorial = useRef(false);

  const autoPlayRef              = useRef(true);
  const [autoPlay, setAutoPlay]  = useState(true);
  const [showSettings, setShowSettings]         = useState(false);
  const [pendingAutoPlay, setPendingAutoPlay]   = useState(true);
  const settingsSlide = useRef(new Animated.Value(300)).current;
  const settingsFade  = useRef(new Animated.Value(0)).current;
  const { dragY: settingsDragY, panHandlers: settingsPanHandlers } = useSheetDismiss(closeSettings);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    AsyncStorage.getItem(AUTOPLAY_KEY).then(val => {
      const saved = val !== 'false';
      setAutoPlay(saved);
      autoPlayRef.current = saved;
    });
    AsyncStorage.getItem(TUTORIAL_KEY).then(val => {
      if (!val) shouldShowTutorial.current = true;
    });
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  function openSettings() {
    settingsSlide.setValue(300);
    settingsDragY.setValue(0);
    setPendingAutoPlay(autoPlay);
    setShowSettings(true);
    Animated.parallel([
      Animated.timing(settingsFade,  { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(settingsSlide, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
    ]).start();
  }

  function closeSettings() {
    Animated.parallel([
      Animated.timing(settingsFade,  { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(settingsSlide, { toValue: 300, duration: 220, useNativeDriver: true }),
    ]).start(() => setShowSettings(false));
  }

  function saveSettings() {
    setAutoPlay(pendingAutoPlay);
    autoPlayRef.current = pendingAutoPlay;
    AsyncStorage.setItem(AUTOPLAY_KEY, String(pendingAutoPlay));
    closeSettings();
  }

  async function playAudio(audioSrc: number | string) {
    if (!isInteractiveRef.current || !audioSrc) return;
    if (isPlayingRef.current) return;
    try {
      isPlayingRef.current = true;
      setIsPlaying(true);
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      const { sound } = await Audio.Sound.createAsync(audioSrc as number);
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          isPlayingRef.current = false;
          setIsPlaying(false);
        }
      });
      await sound.playAsync();
    } catch {
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  }

  const isInteractiveRef = useRef(false);
  const isFlippedRef     = useRef(false);
  const isDraggingRef    = useRef(false);

  // ── Per-slot animated values — NEVER swapped between slots ───────────────
  // Every slot keeps the same Animated.Value objects for its entire lifetime.
  // This is the only reliable way to prevent the 1-frame native glitch on device:
  // React Native's native renderer binds to node IDs — if the node ID for a
  // transform or opacity prop changes between renders, it causes a visual flash.

  const slotOpacity = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  const slotScale   = useRef([1, REL_MID, REL_BACK].map(s => new Animated.Value(s))).current;
  const slotDy      = useRef(Array.from({ length: 3 }, () => new Animated.Value(CARD_INITIAL_Y))).current;
  const slotX       = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  const slotRotate  = useRef(slotX.map(x => x.interpolate({
    inputRange: [-SCREEN_W, 0, SCREEN_W],
    outputRange: ['-20deg', '0deg', '20deg'],
  }))).current;

  // Per-slot flip — each slot has its own flip value so the inner JSX
  // structure is IDENTICAL for all slots (no conditional rendering based on
  // isFront). Ghost slots stay at 0 so back face is always hidden.
  const slotFlip = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  const slotFrontRotY = useRef(slotFlip.map(f =>
    f.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] })
  )).current;
  const slotBackRotY = useRef(slotFlip.map(f =>
    f.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] })
  )).current;
  const slotFrontOpacity = useRef(slotFlip.map(f =>
    f.interpolate({ inputRange: [0, 89, 90, 180], outputRange: [1, 1, 0, 0] })
  )).current;
  const slotBackOpacity = useRef(slotFlip.map(f =>
    f.interpolate({ inputRange: [0, 89, 90, 180], outputRange: [0, 0, 1, 1] })
  )).current;

  // ── Pack animation values ──────────────────────────────────────────────────
  const pkgSlide       = useRef(new Animated.Value(PKG_ENTER_OFFSET)).current;
  const cutWidth       = useRef(new Animated.Value(0)).current;
  const topHalfY       = useRef(new Animated.Value(PKG_HALF_OFF)).current;
  const topHalfOpacity = useRef(new Animated.Value(0)).current;
  const bottomHalfY    = useRef(new Animated.Value(SCREEN_H + PKG_H)).current;
  const navOpacity     = useRef(new Animated.Value(0)).current;
  const bgAnim         = useRef(new Animated.Value(0)).current;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getZIndex = (slotIdx: number) => {
    const front = frontSlotRef.current;
    const mid   = (front + 1) % 3;
    if (slotIdx === front) return 22;
    if (slotIdx === mid)   return 21;
    return 20;
  };

  const getSlotColor = (slotIdx: number): string => {
    const card = cards[slotCardsRef.current[slotIdx]];
    return card?.cardColor ?? '#6B5A9E';
  };

  // ── Swipe exit ────────────────────────────────────────────────────────────
  const triggerExitRef = useRef<(flyDir: 1 | -1) => void>(() => {});
  triggerExitRef.current = (flyDir) => {
    const front  = frontSlotRef.current;
    const mid    = (front + 1) % 3;
    const back   = (front + 2) % 3;
    const nextGI = globalIndexRef.current + 1;

    const willHaveMid  = nextGI + 1 < cards.length;
    const willHaveBack = nextGI + 2 < cards.length;
    const hasMid       = globalIndexRef.current + 1 < cards.length;
    const hasBack      = globalIndexRef.current + 2 < cards.length;

    const DUR  = 280;
    const ease = Easing.out(Easing.quad);

    Animated.parallel([
      Animated.timing(slotX[front],      { toValue: flyDir * SCREEN_W * 1.5, duration: DUR, easing: ease, useNativeDriver: true }),
      Animated.timing(slotOpacity[front], { toValue: 0, duration: DUR * 0.6, easing: ease, useNativeDriver: true }),
      ...(hasMid ? [
        Animated.timing(slotScale[mid],   { toValue: 1,       duration: DUR, easing: ease, useNativeDriver: true }),
        Animated.timing(slotDy[mid],      { toValue: 0,        duration: DUR, easing: ease, useNativeDriver: true }),
        Animated.timing(slotOpacity[mid], { toValue: 1.0,      duration: DUR,               useNativeDriver: true }),
      ] : []),
      ...(hasBack ? [
        Animated.timing(slotScale[back],   { toValue: REL_MID, duration: DUR, easing: ease, useNativeDriver: true }),
        Animated.timing(slotDy[back],      { toValue: -12,      duration: DUR, easing: ease, useNativeDriver: true }),
        Animated.timing(slotOpacity[back], { toValue: 1.0,      duration: DUR,               useNativeDriver: true }),
      ] : []),
    ]).start(() => {
      // Reset old front slot
      slotX[front].setValue(0);
      slotFlip[front].setValue(0);
      isFlippedRef.current = false;
      isPlayingRef.current = false;
      setIsPlaying(false);
      soundRef.current?.unloadAsync();
      soundRef.current = null;

      frontSlotRef.current = mid;

      const newBackCardIdx = nextGI + 2;
      slotCardsRef.current[front] = newBackCardIdx;
      slotOpacity[front].setValue(0);
      slotScale[front].setValue(REL_BACK);
      slotDy[front].setValue(-24);

      slotScale[mid].setValue(1);        slotDy[mid].setValue(0);    slotOpacity[mid].setValue(1.0);
      slotScale[back].setValue(REL_MID); slotDy[back].setValue(-12); slotOpacity[back].setValue(willHaveMid ? 1.0 : 0);

      globalIndexRef.current = nextGI;

      if (nextGI >= cards.length) {
        router.push({ pathname: '/learn/success', params: { ...params, cardCount: String(cards.length) } });
        return;
      }

      setGlobalIndex(nextGI);

      // Auto-play pronunciation for the new front card
      const nextAudio = cards[nextGI]?.audioUrl;
      if (autoPlayRef.current && nextAudio) {
        setTimeout(() => playAudio(nextAudio as number), 400);
      }

      if (willHaveBack && newBackCardIdx < cards.length) {
        requestAnimationFrame(() => {
          Animated.timing(slotOpacity[front], { toValue: 1.0, duration: 200, useNativeDriver: true }).start();
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
      onPanResponderMove: (_, g) => { slotX[frontSlotRef.current].setValue(g.dx); },
      onPanResponderRelease: (_, g) => {
        isDraggingRef.current = false;
        if (Math.abs(g.dx) > 100 || Math.abs(g.vx) > 0.5) {
          triggerExitRef.current(g.dx > 0 ? 1 : -1);
        } else {
          Animated.spring(slotX[frontSlotRef.current], { toValue: 0, friction: 8, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        Animated.spring(slotX[frontSlotRef.current], { toValue: 0, friction: 8, useNativeDriver: true }).start();
      },
    })
  ).current;

  // ── Flip ──────────────────────────────────────────────────────────────────
  const handleFlip = () => {
    if (!isInteractiveRef.current || isDraggingRef.current) return;
    const toValue = isFlippedRef.current ? 0 : 180;
    isFlippedRef.current = !isFlippedRef.current;
    Animated.spring(slotFlip[frontSlotRef.current], {
      toValue, friction: 8, tension: 40, useNativeDriver: true,
    }).start();
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

        [0, 1, 2].forEach((slotIdx, order) => {
          const d = DEPTH[order];
          const cardExists = slotCardsRef.current[slotIdx] < cards.length;
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
        if (shouldShowTutorial.current) {
          shouldShowTutorial.current = false;
          AsyncStorage.setItem(TUTORIAL_KEY, 'true');
          setShowTutorial(true);
          Animated.timing(tutorialOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        } else if (autoPlayRef.current && cards[0]?.audioUrl) {
          setTimeout(() => playAudio(cards[0].audioUrl as number), 300);
        }
      });
    }, 5200);

    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  const dismissTutorial = () => {
    Animated.timing(tutorialOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setShowTutorial(false);
      const audio = cards[globalIndexRef.current]?.audioUrl;
      if (autoPlayRef.current && audio) playAudio(audio as number);
    });
  };

  const progress = cards.length > 0 ? (globalIndex + 1) / cards.length : 0;

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1], outputRange: [BG_CREAM, BRAND_PURPLE],
  });

  const ghostLayout = {
    position: 'absolute' as const,
    left: FRONT_LEFT, top: CARD_TOP,
    width: FRONT_W,   height: FRONT_H,
    borderRadius: 20,
  };

  // ── Render each slot ──────────────────────────────────────────────────────
  // IMPORTANT: The JSX structure inside every slot is IDENTICAL regardless of
  // whether it's the front slot. Only prop VALUES differ (colors, zIndex).
  // This prevents React from unmounting/remounting the subtree when a slot
  // transitions from mid→front, which was the cause of the visual glitch.
  const renderSlot = (slotIdx: number) => {
    const card    = cards[slotCardsRef.current[slotIdx]];
    const zIndex  = getZIndex(slotIdx);
    const bg      = getSlotColor(slotIdx);
    if (!card) return null;

    const txtColor = cardTextColor(bg);
    const mutedTxt = txtColor === '#ffffff' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)';
    const pillBg   = txtColor === '#ffffff' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';

    return (
      <Animated.View
        key={slotIdx}
        style={[ghostLayout, {
          zIndex,
          opacity: slotOpacity[slotIdx],
          backgroundColor: bg,
          transform: [
            { translateY: slotDy[slotIdx] },
            { translateX: slotX[slotIdx] },
            { rotate:     slotRotate[slotIdx] },
            { scale:      slotScale[slotIdx] },
          ],
        }]}
        {...panResponder.panHandlers}
      >
        {/* Always spread panHandlers on every slot — removing the conditional
            spread eliminates a prop-count change on re-render which caused a
            1-frame flash on real device (New Architecture / Fabric). The pan
            responder's own onMoveShouldSetPanResponder already gates on
            isInteractiveRef + frontSlotRef so non-front slots ignore gestures. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleFlip}>
          {/* Front face */}
          <Animated.View style={[styles.abs, styles.face, {
            backgroundColor: bg,
            opacity: slotFrontOpacity[slotIdx],
            transform: [{ perspective: 1200 }, { rotateY: slotFrontRotY[slotIdx] }],
          }]}>
            <Image source={card.illustrationUrl as any} style={styles.illustration} resizeMode="contain" />
            <Text style={[styles.wordText, { color: txtColor }]}>{card.word}</Text>
            <Text style={[styles.tapHint, { color: mutedTxt }]}>Tap to reveal</Text>
          </Animated.View>
          {/* Back face */}
          <Animated.View style={[styles.abs, styles.face, {
            backgroundColor: bg,
            opacity: slotBackOpacity[slotIdx],
            transform: [{ perspective: 1200 }, { rotateY: slotBackRotY[slotIdx] }],
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: 22,
          }]}>
            {/* Illustration — top right */}
            <Image source={card.illustrationUrl as any} style={styles.backIllustration} resizeMode="contain" />

            {/* Word */}
            <Text style={[styles.backWord, { color: txtColor }]}>{card.word}</Text>

            {/* Pinyin or Zhuyin */}
            <Text style={[styles.backRomaji, { color: mutedTxt }]}>
              {isZhuyin && card.zhuyin ? card.zhuyin : card.pinyin}
            </Text>

            {/* Part of speech + tags inline */}
            <View style={[styles.tagsRow, { marginTop: 6 }]}>
              <View style={[styles.posPill, { backgroundColor: pillBg }]}>
                <Text style={[styles.posText, { color: mutedTxt }]}>{card.partOfSpeech}</Text>
              </View>
              {card.tags?.map(tag => (
                <View key={tag} style={[styles.tagPill, { backgroundColor: pillBg }]}>
                  <Text style={[styles.tagText, { color: mutedTxt }]}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Meaning */}
            <Text style={[styles.backMeaning, { color: txtColor }]}>{card.meaning}</Text>

            {/* Example sentences */}
            {(card.exampleSentence1 || card.exampleSentence2) && (
              <View style={[styles.divider, { backgroundColor: mutedTxt }]} />
            )}
            {card.exampleSentence1 && (
              <ExampleBlock ex={card.exampleSentence1} txtColor={txtColor} mutedTxt={mutedTxt} isZhuyin={isZhuyin} />
            )}
            {card.exampleSentence2 && (
              <ExampleBlock ex={card.exampleSentence2} txtColor={txtColor} mutedTxt={mutedTxt} isZhuyin={isZhuyin} />
            )}

            <Text style={[styles.tapHint, { color: mutedTxt, alignSelf: 'center' }]}>Tap to flip back</Text>
          </Animated.View>
        </Pressable>
        {/* Audio button outside Pressable so it always receives touches */}
        <TouchableOpacity
          style={[styles.audioBtn, { zIndex: zIndex + 10 }]}
          hitSlop={12}
          onPress={() => playAudio(card.audioUrl)}
        >
          <Ionicons name={isPlaying && slotIdx === frontSlotRef.current ? 'volume-high' : 'volume-medium-outline'} size={22} color={mutedTxt} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[styles.root, { backgroundColor: bgColor }]}>
      <StatusBar barStyle="dark-content" />

      {/* Bottom half */}
      <Animated.View style={[styles.abs, {
        left: PKG_LEFT, top: PKG_TOP + CUT_Y,
        width: PKG_W, height: PKG_H - CUT_Y,
        overflow: 'hidden', zIndex: 28,
        transform: [{ translateY: bottomHalfY }],
      }]}>
        <Image source={packBagImg as any}
          style={{ width: PKG_W, height: PKG_H, marginTop: -CUT_Y }} resizeMode="contain" />
      </Animated.View>

      {/* Full pack */}
      <Animated.View style={[styles.abs, {
        left: PKG_LEFT, top: PKG_TOP,
        width: PKG_W, height: PKG_H,
        zIndex: 30,
        transform: [{ translateY: pkgSlide }],
      }]}>
        <Image source={packBagImg as any}
          style={{ width: PKG_W, height: PKG_H }} resizeMode="contain" />
        <Animated.View style={[styles.cutLine, { width: cutWidth, top: CUT_Y - 1 }]} />
      </Animated.View>

      {/* Top half */}
      <Animated.View style={[styles.abs, {
        left: PKG_LEFT, top: PKG_TOP,
        width: PKG_W, height: CUT_Y,
        overflow: 'hidden', zIndex: 31,
        opacity: topHalfOpacity,
        transform: [{ translateY: topHalfY }],
      }]}>
        <Image source={packBagImg as any}
          style={{ width: PKG_W, height: PKG_H }} resizeMode="contain" />
      </Animated.View>

      {/* 3 card slots — rendered back→front */}
      {[2, 1, 0].map(renderSlot)}

      {/* Top nav */}
      <Animated.View style={[styles.navBar, { opacity: navOpacity }]}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back-circle-outline" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Learn</Text>
          <TouchableOpacity hitSlop={12} onPress={openSettings}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* First-time tutorial overlay */}
      {showTutorial && (
        <Animated.View style={[styles.abs, StyleSheet.absoluteFillObject, { zIndex: 60, opacity: tutorialOpacity }]}>
          <Pressable style={[StyleSheet.absoluteFill, tutStyles.overlay]} onPress={dismissTutorial}>
            <View style={tutStyles.tutBlock}>
              <Ionicons name="phone-portrait-outline" size={34} color="white" />
              <Text style={tutStyles.tutTitle}>Flip to see the meaning</Text>
              <Text style={tutStyles.tutSub}>Tap the card</Text>
            </View>
            <View style={tutStyles.dashedDivider} />
            <View style={[tutStyles.tutBlock, { position: 'relative' }]}>
              <View style={tutStyles.swipeIconRow}>
                <Ionicons name="arrow-back-outline" size={24} color="white" style={{ transform: [{ rotate: '-20deg' }] }} />
                <Ionicons name="hand-left-outline"  size={26} color="white" style={{ marginHorizontal: 8 }} />
                <Ionicons name="arrow-forward-outline" size={24} color="white" style={{ transform: [{ rotate: '20deg' }] }} />
              </View>
              <Text style={tutStyles.tutTitle}>Swipe to continue{'\n'}next card</Text>
              <Text style={tutStyles.tutSub}>Swipe left or right</Text>
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* Settings bottom sheet */}
      {showSettings && (
        <Modal transparent animationType="none" visible={showSettings} onRequestClose={closeSettings}>
          <Animated.View style={[styles.settingsOverlay, { opacity: settingsFade }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSettings} />
          </Animated.View>
          <Animated.View style={[styles.settingsSheet, { transform: [{ translateY: Animated.add(settingsSlide, settingsDragY) }] }]} {...settingsPanHandlers}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Settings</Text>
              <TouchableOpacity onPress={closeSettings} hitSlop={12}>
                <Ionicons name="close" size={22} color="#262626" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Auto-play pronunciation</Text>
                <Text style={styles.settingDesc}>Plays audio automatically when you swipe to the next card</Text>
              </View>
              <Switch
                value={pendingAutoPlay}
                onValueChange={setPendingAutoPlay}
                trackColor={{ false: '#D1D5DB', true: BRAND_PURPLE }}
                thumbColor="#FFFFFF"
              />
            </View>

            {isTaiwan && (
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Reading system</Text>
                </View>
                <View style={styles.romajiToggleGroup}>
                  <TouchableOpacity
                    style={[styles.romajiToggleBtn, !showZhuyin && styles.romajiToggleBtnActive]}
                    onPress={() => setShowZhuyin(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.romajiToggleBtnText, !showZhuyin && styles.romajiToggleBtnTextActive]}>Pinyin 拼音</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.romajiToggleBtn, showZhuyin && styles.romajiToggleBtnActive]}
                    onPress={() => setShowZhuyin(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.romajiToggleBtnText, showZhuyin && styles.romajiToggleBtnTextActive]}>Zhuyin 注音</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={saveSettings} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </Animated.View>
        </Modal>
      )}
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
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 130,
    backfaceVisibility: 'hidden',
  },

  frontContent: {},
  illustration: { width: 90, height: 90, position: 'absolute', top: '28%' },
  wordText:     { fontSize: 48, fontFamily: 'Volte-Semibold' },
  tapHint: {
    position: 'absolute', bottom: 20,
    fontSize: 13, fontFamily: 'Volte-Semibold',
  },
  audioBtn: {
    position: 'absolute', bottom: 16, right: 16,
  },
  // Back face
  backIllustration: { position: 'absolute', top: 18, right: 18, width: 60, height: 60 },
  backWord:    { fontSize: 32, fontFamily: 'Volte-Semibold', marginBottom: 2, marginRight: 70 },
  backRomaji: { fontSize: 14, fontFamily: 'Volte-Semibold', marginBottom: 2 },

  romajiToggleGroup: {
    flexDirection: 'row', borderRadius: 8,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  romajiToggleBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  romajiToggleBtnActive:     { backgroundColor: BRAND_PURPLE },
  romajiToggleBtnText:       { fontSize: 14, fontFamily: 'Volte-Semibold', color: '#6B7280' },
  romajiToggleBtnTextActive: { color: '#FFFFFF' },
  backMeaning: { fontSize: 22, fontFamily: 'Volte-Semibold', marginTop: 40, marginBottom: 2 },
  posPill:     { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  posText:     { fontSize: 12, fontFamily: 'Volte-Semibold' },

  divider: { height: 1, alignSelf: 'stretch', opacity: 0.3, marginVertical: 10 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tagPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, fontFamily: 'Volte-Semibold' },

  navBar:        { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 64, marginHorizontal: 16, borderRadius: 2 },
  progressFill:  { height: '100%', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 2 },
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16,
  },
  navTitle: { fontSize: 18, color: '#fff', fontFamily: 'Volte-Semibold' },

  // ── Settings sheet ────────────────────────────────────────────────────────
  settingsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  settingsSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12, marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: 'Volte-Semibold',
    color: '#262626',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    marginBottom: 32,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Volte-Semibold',
    color: '#262626',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
    fontFamily: 'Volte',
    color: '#525252',
  },
  saveBtn: {
    backgroundColor: '#7D69AB',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: 'Volte-Semibold',
    color: '#FFFFFF',
  },
});

const tutStyles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(15,12,24,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  tutBlock: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    width: '100%',
  },
  tutTitle: {
    fontSize: 18,
    fontFamily: 'Volte-Semibold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 26,
  },
  tutSub: {
    fontSize: 14,
    fontFamily: 'Volte',
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 4,
  },
  dashedDivider: {
    width: '75%',
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  swipeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
});
