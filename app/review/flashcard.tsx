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
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getReviewSession, setReviewSummary } from '@/constants/review-store';
import { cardTextColor } from '@/constants/mock-packs';
import type { ExampleSentence } from '@/constants/mock-packs';
import { saveSRSResults } from '@/constants/srs-store';
import { useAuth } from '@/lib/auth';
import { useSheetDismiss } from '@/hooks/useSheetDismiss';

const REVIEW_TUTORIAL_KEY = 'langsnap:tutorial_review_manual_shown';

// ── Layout ────────────────────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BRAND_PURPLE = '#7D69AB';

const CARD_W    = Math.min(320, SCREEN_W - 48);
const CARD_H    = CARD_W * (400 / 280);
const CARD_LEFT = (SCREEN_W - CARD_W) / 2;
const CARD_CENTER_Y = (SCREEN_H - CARD_H) / 2;
const BADGE_TOP     = CARD_CENTER_Y - 20 - 48; // fixed — badges don't move with card
const CARD_TOP      = CARD_CENTER_Y + 4;        // card shifted down ~24px from original

const DEPTH = [
  { scale: 0.93, dy:   0, opacity: 1.0 },
  { scale: 0.90, dy: -12, opacity: 1.0 },
  { scale: 0.87, dy: -24, opacity: 1.0 },
];

const FRONT_W    = CARD_W * DEPTH[0].scale;
const FRONT_H    = CARD_H * DEPTH[0].scale;
const FRONT_LEFT = CARD_LEFT + CARD_W * (1 - DEPTH[0].scale) / 2;
const REL_MID    = DEPTH[1].scale / DEPTH[0].scale;
const REL_BACK   = DEPTH[2].scale / DEPTH[0].scale;

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
export default function ReviewFlashcardScreen() {
  const router  = useRouter();
  const { profile } = useAuth();
  const isTaiwan    = profile?.target_language === 'taiwan';
  const [showZhuyin, setShowZhuyin] = useState(profile?.reading_system === 'zhuyin');
  const isZhuyin = isTaiwan && showZhuyin;

  const [showSettings,  setShowSettings]  = useState(false);
  const settingsSlide = useRef(new Animated.Value(300)).current;
  const settingsFade  = useRef(new Animated.Value(0)).current;
  const { dragY: settingsDragY, panHandlers: settingsPanHandlers } = useSheetDismiss(closeSettings);

  function openSettings() {
    settingsSlide.setValue(300);
    settingsDragY.setValue(0);
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
  const session = getReviewSession();
  const config  = session?.config;

  // Fixed queue — no recycling, one pass through all cards
  const queueRef   = useRef([...(session?.cards ?? [])]);
  const srsResults = useRef<Record<string, boolean>>({});  // cardId → true=got it, false=missed

  const isAutoplay = config?.mode === 'autoplay';

  const [showTutorial, setShowTutorial] = useState(false);
  const tutorialOpacity = useRef(new Animated.Value(0)).current;
  const shouldShowTutorial = useRef(false);

  const slotCardsRef   = useRef([0, 1, 2]);
  const frontSlotRef   = useRef(0);
  const globalIndexRef = useRef(0);
  const [globalIndex, setGlobalIndex] = useState(0);

  const soundRef      = useRef<Audio.Sound | null>(null);
  const isPlayingRef  = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const autoPlayRef   = useRef(config?.autoplayAudio ?? true);
  const isAutoplayRef = useRef(isAutoplay);

  // Start interactive immediately — no pack animation
  const isInteractiveRef = useRef(true);
  const isFlippedRef     = useRef(false);
  const isDraggingRef    = useRef(false);

  // Timer ref for autoplay auto-advance
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pause / resume state (autoplay only)
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);

  // ── Slot animated values ──────────────────────────────────────────────────
  const slotOpacity = useRef(
    DEPTH.map((d, i) => new Animated.Value(i < queueRef.current.length ? d.opacity : 0))
  ).current;
  const slotScale   = useRef([1, REL_MID, REL_BACK].map(s => new Animated.Value(s))).current;
  const slotDy      = useRef(DEPTH.map(d => new Animated.Value(d.dy))).current;
  const slotX       = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  const slotRotate  = useRef(slotX.map(x => x.interpolate({
    inputRange: [-SCREEN_W, 0, SCREEN_W],
    outputRange: ['-20deg', '0deg', '20deg'],
  }))).current;

  // ── Flip values ───────────────────────────────────────────────────────────
  const slotFlip         = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  const slotFrontRotY    = useRef(slotFlip.map(f => f.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] }))).current;
  const slotBackRotY     = useRef(slotFlip.map(f => f.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] }))).current;
  const slotFrontOpacity = useRef(slotFlip.map(f => f.interpolate({ inputRange: [0, 89, 90, 180], outputRange: [1, 1, 0, 0] }))).current;
  const slotBackOpacity  = useRef(slotFlip.map(f => f.interpolate({ inputRange: [0, 89, 90, 180], outputRange: [0, 0, 1, 1] }))).current;

  // ── Swipe label opacity (driven by front card X — no state re-renders) ────
  const frontPanX = useRef(new Animated.Value(0)).current;

  const gotItOpacity = frontPanX.interpolate({
    inputRange: [0, 40, 100],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });
  const missedOpacity = frontPanX.interpolate({
    inputRange: [-100, -40, 0],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  });

  // ── Setup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    if (!isAutoplay) {
      AsyncStorage.getItem(REVIEW_TUTORIAL_KEY).then(val => {
        if (!val) {
          shouldShowTutorial.current = true;
          AsyncStorage.setItem(REVIEW_TUTORIAL_KEY, 'true');
          setTimeout(() => {
            setShowTutorial(true);
            Animated.timing(tutorialOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
          }, 600);
        }
      });
    }
    if (autoPlayRef.current && queueRef.current[0]?.audioUrl) {
      setTimeout(() => playAudio(queueRef.current[0].audioUrl as number), 500);
    }
    return () => {
      soundRef.current?.unloadAsync();
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    };
  }, []);

  // ── Autoplay timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAutoplay || isPaused) return;
    const autoFlip = config?.autoFlip ?? false;

    if (autoFlip) {
      // Phase 1: show front for 2s, then flip to back
      autoplayTimerRef.current = setTimeout(() => {
        if (isPausedRef.current) return;
        const front = frontSlotRef.current;
        isFlippedRef.current = true;
        Animated.spring(slotFlip[front], {
          toValue: 180, friction: 8, tension: 40, useNativeDriver: true,
        }).start();
        // Phase 2: show back for 2s, then exit
        autoplayTimerRef.current = setTimeout(() => {
          if (isPausedRef.current) return;
          triggerAutoplayExitRef.current();
        }, 2000);
      }, 2000);
    } else {
      autoplayTimerRef.current = setTimeout(() => {
        if (isPausedRef.current) return;
        triggerAutoplayExitRef.current();
      }, 4000);
    }

    return () => {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    };
  }, [globalIndex, isAutoplay, isPaused]);

  // ── Pause / resume toggle (autoplay mode) ─────────────────────────────────
  const togglePause = () => {
    const next = !isPausedRef.current;
    isPausedRef.current = next;
    setIsPaused(next);
    if (next && autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
    }
    // Un-pausing re-triggers the timer effect via isPaused state change
  };

  // ── Skip to next card (clears pending timer first to avoid double-advance) ─
  const skipNext = () => {
    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    triggerAutoplayExitRef.current();
  };

  // ── Go to previous card (reset slot state to targetIdx) ───────────────────
  const goToPrevious = () => {
    const targetIdx = Math.max(0, globalIndexRef.current - 1);
    if (targetIdx === globalIndexRef.current) return; // already at first card

    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);

    // Reset all three slots to position targetIdx, targetIdx+1, targetIdx+2
    const qLen = queueRef.current.length;
    frontSlotRef.current  = 0;
    slotCardsRef.current  = [targetIdx, targetIdx + 1, targetIdx + 2];
    isFlippedRef.current  = false;
    isPlayingRef.current  = false;
    setIsPlaying(false);
    soundRef.current?.unloadAsync();
    soundRef.current = null;

    slotFlip[0].setValue(0);    slotFlip[1].setValue(0);    slotFlip[2].setValue(0);
    slotX[0].setValue(0);       slotX[1].setValue(0);       slotX[2].setValue(0);
    slotDy[0].setValue(0);      slotDy[1].setValue(-12);    slotDy[2].setValue(-24);
    slotScale[0].setValue(1);   slotScale[1].setValue(REL_MID); slotScale[2].setValue(REL_BACK);
    slotOpacity[0].setValue(targetIdx     < qLen ? 1.0 : 0);
    slotOpacity[1].setValue(targetIdx + 1 < qLen ? 1.0 : 0);
    slotOpacity[2].setValue(targetIdx + 2 < qLen ? 1.0 : 0);

    globalIndexRef.current = targetIdx;
    setGlobalIndex(targetIdx);

    // Play audio for the card we're returning to
    const audio = queueRef.current[targetIdx]?.audioUrl;
    if (autoPlayRef.current && audio) {
      setTimeout(() => playAudio(audio as number), 200);
    }
  };

  // ── Audio ─────────────────────────────────────────────────────────────────
  async function playAudio(audioSrc: number | string) {
    if (!audioSrc || isPlayingRef.current) return;
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getZIndex = (slotIdx: number) => {
    const front = frontSlotRef.current;
    const mid   = (front + 1) % 3;
    if (slotIdx === front) return 22;
    if (slotIdx === mid)   return 21;
    return 20;
  };

  const getSlotColor = (slotIdx: number): string => {
    const card = queueRef.current[slotCardsRef.current[slotIdx]];
    return card?.cardColor ?? '#6B5A9E';
  };

  // ── Shared post-exit slot rotation ───────────────────────────────────────
  const applySlotRotation = (front: number, mid: number, back: number, nextGI: number, willHaveMid: boolean, willHaveBack: boolean) => {
    isFlippedRef.current  = false;
    isPlayingRef.current  = false;
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

    if (nextGI >= queueRef.current.length) {
      // Session complete — save SRS and show summary
      saveSRSResults(srsResults.current);
      const queue = queueRef.current;
      setReviewSummary({
        remembered: queue.filter(c => srsResults.current[c.id] === true),
        forgot:     queue.filter(c => srsResults.current[c.id] === false),
      });
      router.replace('/review/summary');
      return;
    }

    setGlobalIndex(nextGI);

    const nextAudio = queueRef.current[nextGI]?.audioUrl;
    if (autoPlayRef.current && nextAudio) {
      setTimeout(() => playAudio(nextAudio as number), 400);
    }

    if (willHaveBack && newBackCardIdx < queueRef.current.length) {
      requestAnimationFrame(() => {
        Animated.timing(slotOpacity[front], { toValue: 1.0, duration: 200, useNativeDriver: true }).start();
      });
    }
  };

  // ── Swipe exit (manual mode) ──────────────────────────────────────────────
  const triggerExitRef = useRef<(flyDir: 1 | -1) => void>(() => {});
  triggerExitRef.current = (flyDir) => {
    const front   = frontSlotRef.current;
    const mid     = (front + 1) % 3;
    const back    = (front + 2) % 3;
    const curGI   = globalIndexRef.current;
    const nextGI  = curGI + 1;
    const gotIt   = flyDir > 0;
    const curCard = queueRef.current[curGI];

    // ── SRS: record result ────────────────────────────────────────────────
    if (curCard) {
      srsResults.current[curCard.id] = gotIt;
    }

    const qLen = queueRef.current.length;
    const willHaveMid  = nextGI + 1 < qLen;
    const willHaveBack = nextGI + 2 < qLen;
    const hasMid       = curGI + 1 < qLen;
    const hasBack      = curGI + 2 < qLen;
    const DUR          = 280;
    const ease         = Easing.out(Easing.quad);

    frontPanX.setValue(0);

    Animated.parallel([
      Animated.timing(slotX[front],       { toValue: flyDir * SCREEN_W * 1.5, duration: DUR, easing: ease, useNativeDriver: true }),
      Animated.timing(slotOpacity[front], { toValue: 0, duration: DUR * 0.6, easing: ease, useNativeDriver: true }),
      ...(hasMid ? [
        Animated.timing(slotScale[mid],   { toValue: 1,       duration: DUR, easing: ease, useNativeDriver: true }),
        Animated.timing(slotDy[mid],      { toValue: 0,       duration: DUR, easing: ease, useNativeDriver: true }),
        Animated.timing(slotOpacity[mid], { toValue: 1.0,     duration: DUR,               useNativeDriver: true }),
      ] : []),
      ...(hasBack ? [
        Animated.timing(slotScale[back],  { toValue: REL_MID, duration: DUR, easing: ease, useNativeDriver: true }),
        Animated.timing(slotDy[back],     { toValue: -12,     duration: DUR, easing: ease, useNativeDriver: true }),
        Animated.timing(slotOpacity[back],{ toValue: 1.0,     duration: DUR,               useNativeDriver: true }),
      ] : []),
    ]).start(() => {
      slotX[front].setValue(0);
      slotFlip[front].setValue(0);
      applySlotRotation(front, mid, back, nextGI, willHaveMid, willHaveBack);
    });
  };

  // ── Autoplay exit (slide down + fade) ─────────────────────────────────────
  const triggerAutoplayExitRef = useRef<() => void>(() => {});
  triggerAutoplayExitRef.current = () => {
    const front  = frontSlotRef.current;
    const mid    = (front + 1) % 3;
    const back   = (front + 2) % 3;
    const nextGI = globalIndexRef.current + 1;

    const qLen = queueRef.current.length;
    const willHaveMid  = nextGI + 1 < qLen;
    const willHaveBack = nextGI + 2 < qLen;
    const hasMid       = globalIndexRef.current + 1 < qLen;
    const hasBack      = globalIndexRef.current + 2 < qLen;
    const DUR          = 420;
    const easeIn       = Easing.in(Easing.quad);
    const easeOut      = Easing.out(Easing.quad);

    Animated.parallel([
      // Front card slides down + fades out
      Animated.timing(slotDy[front],      { toValue: 80,      duration: DUR,       easing: easeIn,  useNativeDriver: true }),
      Animated.timing(slotOpacity[front], { toValue: 0,       duration: DUR * 0.7, easing: easeIn,  useNativeDriver: true }),
      // Mid rises to front
      ...(hasMid ? [
        Animated.timing(slotScale[mid],   { toValue: 1,       duration: DUR, easing: easeOut, useNativeDriver: true }),
        Animated.timing(slotDy[mid],      { toValue: 0,       duration: DUR, easing: easeOut, useNativeDriver: true }),
        Animated.timing(slotOpacity[mid], { toValue: 1.0,     duration: DUR,                  useNativeDriver: true }),
      ] : []),
      // Back rises to mid
      ...(hasBack ? [
        Animated.timing(slotScale[back],  { toValue: REL_MID, duration: DUR, easing: easeOut, useNativeDriver: true }),
        Animated.timing(slotDy[back],     { toValue: -12,     duration: DUR, easing: easeOut, useNativeDriver: true }),
        Animated.timing(slotOpacity[back],{ toValue: 1.0,     duration: DUR,                  useNativeDriver: true }),
      ] : []),
    ]).start(() => {
      slotFlip[front].setValue(0);
      applySlotRotation(front, mid, back, nextGI, willHaveMid, willHaveBack);
    });
  };

  // ── PanResponder ──────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        !isAutoplayRef.current &&
        isInteractiveRef.current &&
        Math.abs(g.dx) > 8 &&
        Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => { isDraggingRef.current = true; },
      onPanResponderMove: (_, g) => {
        slotX[frontSlotRef.current].setValue(g.dx);
        frontPanX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        isDraggingRef.current = false;
        frontPanX.setValue(0);
        if (Math.abs(g.dx) > 100 || Math.abs(g.vx) > 0.5) {
          triggerExitRef.current(g.dx > 0 ? 1 : -1);
        } else {
          Animated.spring(slotX[frontSlotRef.current], { toValue: 0, friction: 8, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        frontPanX.setValue(0);
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

  const dismissReviewTutorial = () => {
    Animated.timing(tutorialOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setShowTutorial(false);
    });
  };

  const progress = queueRef.current.length > 0 ? (globalIndex + 1) / queueRef.current.length : 0;

  const ghostLayout = {
    position: 'absolute' as const,
    left: FRONT_LEFT, top: CARD_TOP,
    width: FRONT_W, height: FRONT_H,
    borderRadius: 20,
  };

  // ── Render slot ───────────────────────────────────────────────────────────
  const renderSlot = (slotIdx: number) => {
    const card   = queueRef.current[slotCardsRef.current[slotIdx]];
    const zIndex = getZIndex(slotIdx);
    const bg     = getSlotColor(slotIdx);
    if (!card) return null;

    const txtColor = cardTextColor(bg);
    const mutedTxt = txtColor === '#ffffff' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)';
    const pillBg   = txtColor === '#ffffff' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
    const isFront  = slotIdx === frontSlotRef.current;

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
        <Pressable style={StyleSheet.absoluteFill} onPress={handleFlip}>
          {/* Front face */}
          <Animated.View style={[styles.abs, styles.face, {
            backgroundColor: bg,
            opacity: slotFrontOpacity[slotIdx],
            transform: [{ perspective: 1200 }, { rotateY: slotFrontRotY[slotIdx] }],
            ...((config?.showIllustration === false) && { justifyContent: 'center', paddingBottom: 0 }),
          }]}>
            {(config?.showIllustration ?? true) && (
              <Image source={card.illustrationUrl as any} style={styles.illustration} resizeMode="contain" />
            )}
            <Text style={[styles.wordText, { color: txtColor }]}>{card.word}</Text>
            {!isAutoplay && (
              <Text style={[styles.tapHint, { color: mutedTxt }]}>Tap to reveal</Text>
            )}
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

            {!isAutoplay && (
              <Text style={[styles.tapHint, { color: mutedTxt, alignSelf: 'center' }]}>Tap to flip back</Text>
            )}
          </Animated.View>
        </Pressable>

        {/* Audio button */}
        <TouchableOpacity
          style={[styles.audioBtn, { zIndex: zIndex + 10 }]}
          hitSlop={12}
          onPress={() => playAudio(card.audioUrl)}
        >
          <Ionicons
            name={isPlaying && isFront ? 'volume-high' : 'volume-medium-outline'}
            size={22}
            color={mutedTxt}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ── Swipe hint labels (manual mode only) ─────────────────────────────────
  const leftHintOpacity  = frontPanX.interpolate({ inputRange: [-50, 0, 50], outputRange: [0.2, 1, 0.2], extrapolate: 'clamp' });
  const rightHintOpacity = frontPanX.interpolate({ inputRange: [-50, 0, 50], outputRange: [0.2, 1, 0.2], extrapolate: 'clamp' });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* 3 card slots — rendered back→front */}
      {[2, 1, 0].map(renderSlot)}

      {/* Got it / Missed it badges — above card stack, manual mode only */}
      {!isAutoplay && (
        <>
          <Animated.View style={[styles.swipeBadge, styles.gotItBadge, { opacity: gotItOpacity }]}>
            <Text style={styles.gotItText}>Got it</Text>
          </Animated.View>
          <Animated.View style={[styles.swipeBadge, styles.missedBadge, { opacity: missedOpacity }]}>
            <Text style={styles.missedText}>Missed it</Text>
          </Animated.View>
        </>
      )}

      {/* Swipe hints row — manual mode only */}
      {!isAutoplay && (
        <View style={styles.hintsRow}>
          <Animated.View style={[styles.hintPill, { opacity: leftHintOpacity }]}>
            <Ionicons name="arrow-back" size={14} color="rgba(255,255,255,0.55)" />
            <Text style={styles.hintText}>Missed it</Text>
          </Animated.View>
          <Animated.View style={[styles.hintPill, { opacity: rightHintOpacity }]}>
            <Text style={styles.hintText}>Got it</Text>
            <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.55)" />
          </Animated.View>
        </View>
      )}

      {/* Autoplay controls — previous / pause / next, Spotify-style */}
      {isAutoplay && (
        <View style={styles.autoplayControls}>
          <TouchableOpacity onPress={goToPrevious} hitSlop={12} style={styles.autoplaySkipBtn}>
            <Ionicons name="play-skip-back" size={26} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <TouchableOpacity onPress={togglePause} style={styles.autoplayPauseBtn} activeOpacity={0.8}>
            <Ionicons name={isPaused ? 'play' : 'pause'} size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity onPress={skipNext} hitSlop={12} style={styles.autoplaySkipBtn}>
            <Ionicons name="play-skip-forward" size={26} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      )}

      {/* Top nav */}
      <View style={styles.navBar}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back-circle-outline" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Review</Text>
          <TouchableOpacity hitSlop={12} onPress={openSettings}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* First-time tutorial overlay — manual mode only */}
      {showTutorial && !isAutoplay && (
        <Animated.View style={[styles.abs, StyleSheet.absoluteFillObject, { zIndex: 60, opacity: tutorialOpacity }]}>
          <Pressable style={[StyleSheet.absoluteFill, tutStyles.overlay]} onPress={dismissReviewTutorial}>
            {/* Flip section */}
            <View style={tutStyles.tutBlock}>
              <Ionicons name="phone-portrait-outline" size={34} color="white" />
              <Text style={tutStyles.tutTitle}>Flip to see the meaning</Text>
              <Text style={tutStyles.tutSub}>Tap the card</Text>
            </View>

            {/* Horizontal dashed line */}
            <View style={tutStyles.dashedH} />

            {/* Swipe section — two columns split by vertical dashed */}
            <View style={tutStyles.swipeRow}>
              <View style={tutStyles.swipeCol}>
                <Ionicons name="arrow-back-outline" size={32} color="white" />
                <Text style={tutStyles.tutTitle}>Missed it</Text>
                <Text style={tutStyles.tutSub}>Swipe left</Text>
              </View>
              <View style={tutStyles.dashedV} />
              <View style={tutStyles.swipeCol}>
                <Ionicons name="arrow-forward-outline" size={32} color="white" />
                <Text style={tutStyles.tutTitle}>Got it</Text>
                <Text style={tutStyles.tutSub}>Swipe right</Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* Settings sheet */}
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
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#7D69AB' },
  abs:  { position: 'absolute' },

  face: {
    width: '100%', height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 130,
    backfaceVisibility: 'hidden',
  },

  illustration:    { width: 90, height: 90, position: 'absolute', top: '28%' },
  wordText:        { fontSize: 48, fontFamily: 'Volte-Semibold' },
  tapHint:         { position: 'absolute', bottom: 20, fontSize: 13, fontFamily: 'Volte-Semibold' },
  audioBtn:        { position: 'absolute', bottom: 16, right: 16 },
  backIllustration: { position: 'absolute', top: 18, right: 18, width: 60, height: 60 },
  backWord:         { fontSize: 32, fontFamily: 'Volte-Semibold', marginBottom: 2, marginRight: 70 },
  backRomaji: { fontSize: 14, fontFamily: 'Volte-Semibold', marginBottom: 2 },

  settingsOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  settingsSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: 40,
  },
  sheetHandle:  { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sheetTitle:   { fontSize: 18, fontFamily: 'Volte-Semibold', color: '#262626' },
  settingRow:   { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8, marginBottom: 16 },
  settingLabel: { fontSize: 16, fontFamily: 'Volte-Semibold', color: '#262626', marginBottom: 4 },
  settingDesc:  { fontSize: 13, fontFamily: 'Volte', color: '#525252' },

  romajiToggleGroup:         { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  romajiToggleBtn:           { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F9FAFB' },
  romajiToggleBtnActive:     { backgroundColor: BRAND_PURPLE },
  romajiToggleBtnText:       { fontSize: 14, fontFamily: 'Volte-Semibold', color: '#6B7280' },
  romajiToggleBtnTextActive: { color: '#FFFFFF' },
  backMeaning:      { fontSize: 22, fontFamily: 'Volte-Semibold', marginTop: 40, marginBottom: 2 },
  posPill:          { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  posText:          { fontSize: 12, fontFamily: 'Volte-Semibold' },
  divider:          { height: 1, alignSelf: 'stretch', opacity: 0.3, marginVertical: 10 },
  tagsRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tagPill:          { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText:          { fontSize: 11, fontFamily: 'Volte-Semibold' },

  // Swipe feedback badges — positioned above card stack in purple area
  swipeBadge: {
    position: 'absolute',
    top: BADGE_TOP,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 2.5,
    zIndex: 30,
  },
  gotItBadge: {
    right: 24,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ rotate: '6deg' }],
  },
  gotItText:   { fontSize: 15, fontFamily: 'Volte-Semibold', color: '#ffffff' },
  missedBadge: {
    left: 24,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ rotate: '-6deg' }],
  },
  missedText: { fontSize: 15, fontFamily: 'Volte-Semibold', color: '#ffffff' },

  // Swipe hint labels below the card stack
  hintsRow: {
    position: 'absolute',
    left: 24, right: 24,
    bottom: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: 'Volte-Semibold' },

  // Autoplay controls — pause/resume + skip, shown in place of swipe hints
  autoplayControls: {
    position: 'absolute',
    bottom: 52,
    left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  autoplayPauseBtn: {
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoplaySkipBtn: {
    width: 44, height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Top nav
  navBar:        { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 },
  progressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 64, marginHorizontal: 16, borderRadius: 2 },
  progressFill:  { height: '100%', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 2 },
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16,
  },
  navTitle: { fontSize: 18, color: '#fff', fontFamily: 'Volte-Semibold' },
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
    paddingVertical: 24,
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
  dashedH: {
    width: '80%',
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  swipeRow: {
    flexDirection: 'row',
    width: '80%',
    paddingTop: 8,
  },
  swipeCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  dashedV: {
    width: 1.5,
    borderLeftWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.25)',
    marginTop: 8,
  },
});
