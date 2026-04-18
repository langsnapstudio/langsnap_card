import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getReviewSession } from '@/constants/review-store';
import type { Card } from '@/constants/mock-packs';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE   = '#7D69AB';
const GREEN_CORRECT  = '#4ADE80'; // success green
const WHITE          = '#FFFFFF';
const TEXT_DARK      = '#262626';
const TEXT_MUTED     = 'rgba(255,255,255,0.65)';

const { width: SCREEN_W } = Dimensions.get('window');
const BTN_W = Math.min(280, SCREEN_W - 80); // ~230px on 393w phone, scales on larger screens

// ── Types ──────────────────────────────────────────────────────────────────────
type QuestionType = 'char_to_meaning' | 'audio_to_char';

type QuizQuestion = {
  type:         QuestionType;
  card:         Card;
  options:      string[];  // 4 answer choices (shuffled)
  correctIndex: number;    // which option is correct
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(cards: Card[]): QuizQuestion[] {
  return cards.map((card, i) => {
    // Alternate types: even = char→meaning, odd = audio→char (if audio exists)
    const useAudio = i % 2 === 1 && !!card.audioUrl;
    const type: QuestionType = useAudio ? 'audio_to_char' : 'char_to_meaning';

    const others = cards.filter(c => c.id !== card.id);

    if (type === 'char_to_meaning') {
      const wrongMeanings = shuffle(others.map(c => c.meaning)).slice(0, 3);
      const options       = shuffle([card.meaning, ...wrongMeanings]);
      return { type, card, options, correctIndex: options.indexOf(card.meaning) };
    } else {
      const wrongWords = shuffle(others.map(c => c.word)).slice(0, 3);
      const options    = shuffle([card.word, ...wrongWords]);
      return { type, card, options, correctIndex: options.indexOf(card.word) };
    }
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function QuizScreen() {
  const router    = useRouter();
  const session   = getReviewSession();
  const cards     = session?.cards ?? [];
  const questions = useRef(buildQuestions(cards)).current;
  const total     = questions.length;

  const [qIndex,        setQIndex]        = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered,      setAnswered]      = useState(false);
  const [score,         setScore]         = useState(0);
  const scoreRef = useRef(0);

  // Audio
  const soundRef     = useRef<Audio.Sound | null>(null);
  const sfxRef       = useRef<Audio.Sound | null>(null);
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Shake animation for wrong answer
  const shakeX = useRef(new Animated.Value(0)).current;

  // ── Audio ─────────────────────────────────────────────────────────────────
  const playAudio = useCallback(async (audioSrc: number | string) => {
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
  }, []);

  const playSfx = useCallback(async (correct: boolean) => {
    try {
      await sfxRef.current?.unloadAsync();
      const src = correct
        ? require('@/assets/audio/quiz_correct.wav')
        : require('@/assets/audio/quiz_wrong.wav');
      const { sound } = await Audio.Sound.createAsync(src);
      sfxRef.current = sound;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
      });
    } catch {}
  }, []);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    return () => {
      soundRef.current?.unloadAsync();
      sfxRef.current?.unloadAsync();
    };
  }, []);

  // Auto-play audio for audio-type questions when question loads
  useEffect(() => {
    if (qIndex >= questions.length) return;
    const q = questions[qIndex];
    if (q.type === 'audio_to_char' && q.card.audioUrl) {
      setTimeout(() => playAudio(q.card.audioUrl as number), 400);
    }
  }, [qIndex]);

  // ── Answer handling ───────────────────────────────────────────────────────
  function handleAnswer(optionIndex: number) {
    if (answered) return;

    setSelectedIndex(optionIndex);
    setAnswered(true);

    const q         = questions[qIndex];
    const isCorrect = optionIndex === q.correctIndex;

    playSfx(isCorrect);

    if (isCorrect) {
      scoreRef.current += 1;
      setScore(s => s + 1);
    } else {
      // Shake the wrong button
      Animated.sequence([
        Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  0, duration: 60, useNativeDriver: true }),
      ]).start();
    }

    // Auto-advance after 1.4s
    setTimeout(() => advance(), 1400);
  }

  function advance() {
    soundRef.current?.unloadAsync();
    soundRef.current = null;
    isPlayingRef.current = false;
    setIsPlaying(false);
    shakeX.setValue(0);

    const nextQ = qIndex + 1;
    if (nextQ >= total) {
      router.replace({ pathname: '/quiz/results', params: { score: String(scoreRef.current), total: String(total) } });
    } else {
      setQIndex(nextQ);
      setSelectedIndex(null);
      setAnswered(false);
    }
  }

  // ── Button appearance ─────────────────────────────────────────────────────
  function getButtonStyle(optionIndex: number) {
    if (!answered) return [styles.answerBtn];

    const q         = questions[qIndex];
    const isCorrect = optionIndex === q.correctIndex;
    const isSelected = optionIndex === selectedIndex;

    if (isCorrect)  return [styles.answerBtn, styles.btnCorrect, { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingHorizontal: 20 }];
    if (isSelected) return [styles.answerBtn, styles.btnWrong];
    return [styles.answerBtn, styles.btnDimmed];
  }

  function getTextStyle(optionIndex: number) {
    if (!answered) return styles.answerText;

    const q          = questions[qIndex];
    const isCorrect  = optionIndex === q.correctIndex;
    const isSelected = optionIndex === selectedIndex;

    // Correct button uses row layout — text needs flex:1 to push checkmark to the right
    if (isCorrect)  return [styles.answerText, { color: WHITE, flex: 1 }];
    if (isSelected) return [styles.answerText, { color: WHITE }];
    return [styles.answerText, { color: 'rgba(38,38,38,0.4)' }];
  }

  // ── Guard: no cards ───────────────────────────────────────────────────────
  if (!total) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView edges={['top']} style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No cards to quiz on.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const q = questions[qIndex];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={['top']} style={styles.safe}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back-circle-outline" size={30} color={WHITE} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Quiz</Text>
            <Text style={styles.headerProgress}>{qIndex + 1}/{total}</Text>
          </View>

          {/* Spacer to balance the back arrow */}
          <View style={{ width: 24 }} />
        </View>

        {/* ── Progress bar ────────────────────────────────────────────────── */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((qIndex + 1) / total) * 100}%` as any }]} />
        </View>

        {/* ── Question area ───────────────────────────────────────────────── */}
        <View style={styles.questionArea}>
          {q.type === 'char_to_meaning' ? (
            /* Type 1: show Chinese character */
            <Text style={styles.questionChar}>{q.card.word}</Text>
          ) : (
            /* Type 2: show audio play button */
            <TouchableOpacity
              style={styles.audioCircle}
              activeOpacity={0.8}
              onPress={() => playAudio(q.card.audioUrl as number)}
            >
              <Ionicons
                name={isPlaying ? 'volume-high' : 'volume-medium'}
                size={36}
                color={BRAND_PURPLE}
              />
            </TouchableOpacity>
          )}

          {/* Prompt label */}
          <Text style={styles.promptLabel}>
            {q.type === 'char_to_meaning' ? 'What does this mean?' : 'Which word do you hear?'}
          </Text>
        </View>

        {/* ── Answer buttons ──────────────────────────────────────────────── */}
        <View style={styles.answersArea}>
          {q.options.map((option, i) => {
            const isSelected = selectedIndex === i;
            const isWrong    = answered && isSelected && i !== q.correctIndex;

            return (
              <Animated.View
                key={i}
                style={isWrong ? { transform: [{ translateX: shakeX }] } : undefined}
              >
                <TouchableOpacity
                  style={getButtonStyle(i)}
                  activeOpacity={answered ? 1 : 0.75}
                  onPress={() => handleAnswer(i)}
                  disabled={answered}
                >
                  <Text style={getTextStyle(i)}>{option}</Text>
                  {answered && i === questions[qIndex].correctIndex && (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={15} color="#4ADE80" />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

      </SafeAreaView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND_PURPLE },
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle:  { fontSize: 18, color: WHITE, fontFamily: 'Volte-Semibold' },
  headerProgress: { fontSize: 13, color: TEXT_MUTED, fontFamily: 'Volte-Medium', marginTop: 2 },

  // Progress bar
  progressTrack: {
    height: 3, marginHorizontal: 24, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 0,
  },
  progressFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 2 },

  // Question area
  questionArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  questionChar: {
    fontSize: 80,
    color: WHITE,
    fontFamily: 'Volte-Semibold',
    lineHeight: 96,
  },
  audioCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptLabel: {
    fontSize: 15,
    color: TEXT_MUTED,
    fontFamily: 'Volte-Medium',
    textAlign: 'center',
  },

  // Answer buttons
  answersArea: {
    paddingHorizontal: (SCREEN_W - BTN_W) / 2,
    paddingBottom: 32,
    gap: 12,
    alignItems: 'stretch',
  },
  answerBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  btnCorrect: {
    backgroundColor: GREEN_CORRECT,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnWrong: {
    backgroundColor: '#EF4444',
  },
  btnDimmed: {
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  answerText: {
    fontSize: 15,
    color: TEXT_DARK,
    fontFamily: 'Volte-Semibold',
    textAlign: 'left',
  },

  // Empty state
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText:      { fontSize: 16, color: WHITE, fontFamily: 'Volte-Medium' },
  backBtn:        { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  backBtnText:    { fontSize: 15, color: WHITE, fontFamily: 'Volte-Semibold' },
});
