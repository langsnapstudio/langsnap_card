import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/lib/auth';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const BG_CREAM     = '#F8F5EF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';
const WHITE        = '#FFFFFF';

const WELCOME_SHOWN_KEY = 'langsnap:welcome_shown';

// ── Deck data (placeholder) ────────────────────────────────────────────────────
const DECKS = [
  { id: '1', title: 'Animals', subtitle: '動物', color: '#F5C842', image: require('@/assets/images/illustration-dog.png') },
  { id: '2', title: 'Fruits & Vegetables', subtitle: '水果蔬菜', color: '#4CAF50', image: require('@/assets/images/illustration-pineapple.png') },
  { id: '3', title: 'Food & Drinks', subtitle: '食物飲料', color: '#E53935', image: require('@/assets/images/illustration-bubble-tea.png') },
];

// ── Welcome Bottom Sheet ───────────────────────────────────────────────────────
function WelcomeSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sheetHandle} />

        {/* Creator avatar */}
        <View style={styles.creatorAvatar}>
          <Image
            source={require('@/assets/images/illustration-dog.png')}
            style={styles.creatorImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.welcomeTitle}>Welcome to Langsnap! 👋</Text>
        <Text style={styles.welcomeBody}>
          Hey there! I'm so glad you're here.{'\n\n'}
          I built Langsnap to make learning Chinese feel natural and fun — one word at a time.{'\n\n'}
          Pick a deck that catches your eye and dive in. Enjoy the journey! 🌟
        </Text>

        <TouchableOpacity style={styles.welcomeBtn} onPress={handleClose} activeOpacity={0.85}>
          <Text style={styles.welcomeBtnText}>Let's start learning!</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ── Learn Tab ─────────────────────────────────────────────────────────────────
export default function LearnScreen() {
  const { profile } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome sheet only on first visit
  useEffect(() => {
    AsyncStorage.getItem(WELCOME_SHOWN_KEY).then(val => {
      if (!val) {
        // Small delay so the tab transition finishes first
        setTimeout(() => setShowWelcome(true), 500);
        AsyncStorage.setItem(WELCOME_SHOWN_KEY, 'true');
      }
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hi, {profile?.display_name?.split(' ')[0] ?? 'there'} 👋
            </Text>
            <Text style={styles.subGreeting}>What do you want to learn today?</Text>
          </View>
        </View>

        {/* Themes section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Themes</Text>
            <TouchableOpacity>
              <Text style={styles.showAll}>show all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deckRow}>
            {DECKS.map(deck => (
              <TouchableOpacity key={deck.id} style={[styles.deckCard, { backgroundColor: deck.color }]} activeOpacity={0.85}>
                <Image source={deck.image} style={styles.deckImage} resizeMode="contain" />
                <Text style={styles.deckTitle}>{deck.title}</Text>
                <Text style={styles.deckSubtitle}>{deck.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* More coming soon */}
        <View style={styles.moreSection}>
          <Text style={styles.moreText}>More decks coming soon ✨</Text>
        </View>

      </ScrollView>

      <WelcomeSheet visible={showWelcome} onClose={() => setShowWelcome(false)} />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_CREAM },
  scroll:   { paddingBottom: 40 },

  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting:    { fontSize: 22, color: TEXT_DARK, fontFamily: 'Volte-Bold' },
  subGreeting: { fontSize: 14, color: TEXT_MUTED, fontFamily: 'Volte', marginTop: 4 },

  section:       { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle:  { fontSize: 20, color: TEXT_DARK, fontFamily: 'Volte-Bold' },
  showAll:       { fontSize: 14, color: TEXT_MUTED, fontFamily: 'Volte-Medium' },

  deckRow: { paddingLeft: 24, gap: 12, paddingRight: 24 },
  deckCard: {
    width: 160, borderRadius: 18,
    padding: 12, paddingBottom: 16,
    overflow: 'hidden',
  },
  deckImage:    { width: '100%', height: 120, marginBottom: 12 },
  deckTitle:    { fontSize: 15, color: WHITE, fontFamily: 'Volte-Bold', marginBottom: 2 },
  deckSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'Volte' },

  moreSection: { alignItems: 'center', paddingTop: 8 },
  moreText:    { fontSize: 14, color: TEXT_MUTED, fontFamily: 'Volte' },

  // Welcome sheet
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E0DDD8', marginBottom: 28,
  },
  creatorAvatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#F5C842',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  creatorImage:   { width: 70, height: 70 },
  welcomeTitle:   { fontSize: 22, color: TEXT_DARK, fontFamily: 'Volte-Bold', marginBottom: 16, textAlign: 'center' },
  welcomeBody:    { fontSize: 15, lineHeight: 24, color: TEXT_MUTED, fontFamily: 'Volte', textAlign: 'center', marginBottom: 28 },
  welcomeBtn: {
    width: '100%', height: 52, borderRadius: 14,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
  },
  welcomeBtnText: { fontSize: 17, color: WHITE, fontFamily: 'Volte-Semibold' },
});
