import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const BG_CREAM     = '#F8F5EF';
const WHITE        = '#FFFFFF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';
const GREEN        = '#22C55E';
const BORDER       = '#E8E5DF';

// ── Types & mock data ──────────────────────────────────────────────────────────
type Feat = {
  id:       string;
  title:    string;
  desc:     string;
  icon:     string;
  progress: number;
  goal:     number;
  claimed:  boolean;
  reward:   number;
};

const INITIAL_FEATS: Feat[] = [
  { id: 'first_word',    title: 'First Steps',        desc: 'Learn your first word',       icon: '🌱', progress: 1,   goal: 1,   claimed: true,  reward: 5  },
  { id: 'ten_words',     title: 'Getting Started',    desc: 'Learn 10 words',              icon: '📖', progress: 10,  goal: 10,  claimed: false, reward: 10 },
  { id: 'fifty_words',   title: 'Vocabulary Builder', desc: 'Learn 50 words',              icon: '🧠', progress: 42,  goal: 50,  claimed: false, reward: 20 },
  { id: 'week_streak',   title: 'Week Warrior',       desc: 'Keep a 7-day streak',         icon: '🔥', progress: 7,   goal: 7,   claimed: false, reward: 15 },
  { id: 'month_streak',  title: 'Monthly Master',     desc: 'Keep a 30-day streak',        icon: '🏆', progress: 7,   goal: 30,  claimed: false, reward: 50 },
  { id: 'cards_100',     title: 'Card Collector',     desc: 'Review 100 cards',            icon: '🃏', progress: 42,  goal: 100, claimed: false, reward: 25 },
  { id: 'first_pack',    title: 'Pack Opener',        desc: 'Redeem your first pack',      icon: '🎁', progress: 1,   goal: 1,   claimed: false, reward: 5  },
  { id: 'five_decks',    title: 'Deck Explorer',      desc: 'Study from 5 different decks',icon: '🗂️', progress: 2,   goal: 5,   claimed: false, reward: 15 },
  { id: 'words_200',     title: 'Word Hoarder',       desc: 'Learn 200 words',             icon: '📚', progress: 42,  goal: 200, claimed: false, reward: 40 },
  { id: 'streak_30',     title: 'Habit Formed',       desc: 'Study 30 days in a row',      icon: '🗓️', progress: 7,   goal: 30,  claimed: false, reward: 50 },
  { id: 'quiz_perfect',  title: 'Perfectionist',      desc: 'Get 100% on a quiz',          icon: '🎯', progress: 0,   goal: 1,   claimed: false, reward: 10 },
  { id: 'cards_500',     title: 'Flashcard Fanatic',  desc: 'Review 500 cards',            icon: '⚡', progress: 42,  goal: 500, claimed: false, reward: 60 },
];

// ── Feat row ───────────────────────────────────────────────────────────────────
function FeatRow({ feat, onClaim }: { feat: Feat; onClaim: (id: string) => void }) {
  const ratio     = Math.min(feat.progress / feat.goal, 1);
  const complete  = feat.progress >= feat.goal;
  const claimable = complete && !feat.claimed;

  return (
    <View style={styles.featRow}>
      <Text style={styles.featIcon}>{feat.icon}</Text>

      <View style={styles.featInfo}>
        <View style={styles.featTitleRow}>
          <Text style={styles.featTitle}>{feat.title}</Text>
          {feat.claimed && (
            <View style={styles.claimedBadge}>
              <Ionicons name="checkmark" size={11} color={GREEN} />
              <Text style={styles.claimedText}>Claimed</Text>
            </View>
          )}
        </View>
        <Text style={styles.featDesc}>{feat.desc}</Text>

        <View style={styles.featProgressRow}>
          <View style={styles.featTrack}>
            <View style={[styles.featFill, { width: `${ratio * 100}%` as any }]} />
          </View>
          <Text style={styles.featCount}>{feat.progress}/{feat.goal}</Text>
        </View>
      </View>

      {claimable && (
        <TouchableOpacity
          style={styles.claimBtn}
          activeOpacity={0.8}
          onPress={() => onClaim(feat.id)}
        >
          <Text style={styles.claimBtnText}>+{feat.reward}</Text>
          <Text style={styles.claimBtnSub}>⚡</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function ChallengesScreen() {
  const router = useRouter();
  const [feats, setFeats] = useState<Feat[]>(INITIAL_FEATS);

  const claimed   = feats.filter(f => f.claimed).length;
  const total     = feats.length;
  const claimable = feats.filter(f => f.progress >= f.goal && !f.claimed).length;

  function handleClaim(id: string) {
    setFeats(prev => prev.map(f => f.id === id ? { ...f, claimed: true } : f));
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

      {/* ── Nav bar ──────────────────────────────────────────────────────── */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Challenges</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* ── Summary strip ────────────────────────────────────────────────── */}
      <View style={styles.summary}>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryValue}>{claimed}/{total}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryTile}>
          <Text style={[styles.summaryValue, claimable > 0 && { color: BRAND_PURPLE }]}>
            {claimable}
          </Text>
          <Text style={styles.summaryLabel}>Ready to claim</Text>
        </View>
      </View>

      {/* ── Feat list ─────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {feats.map((feat, i) => (
            <React.Fragment key={feat.id}>
              <FeatRow feat={feat} onClaim={handleClaim} />
              {i < feats.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: BG_CREAM },

  // Nav
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn:  { width: 32 },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Volte-Semibold', color: TEXT_DARK },

  // Summary
  summary: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, paddingVertical: 16,
  },
  summaryTile:    { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue:   { fontSize: 22, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  summaryLabel:   { fontSize: 12, fontFamily: 'Volte-Medium',   color: TEXT_MUTED },
  summaryDivider: { width: 1, backgroundColor: BORDER, marginVertical: 4 },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },

  // Card
  card: {
    backgroundColor: WHITE,
    borderRadius: 16, padding: 16,
  },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 4 },

  // Feat row
  featRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  featIcon:        { fontSize: 26, width: 32, textAlign: 'center' },
  featInfo:        { flex: 1, gap: 3 },
  featTitleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featTitle:       { fontSize: 14, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  featDesc:        { fontSize: 12, fontFamily: 'Volte-Medium',   color: TEXT_MUTED },
  featProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  featTrack:       { flex: 1, height: 5, borderRadius: 3, backgroundColor: BG_CREAM, overflow: 'hidden' },
  featFill:        { height: 5, borderRadius: 3, backgroundColor: BRAND_PURPLE },
  featCount:       { fontSize: 11, fontFamily: 'Volte-Medium', color: TEXT_MUTED },

  claimedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  claimedText: { fontSize: 10, fontFamily: 'Volte-Semibold', color: GREEN },

  claimBtn:     { alignItems: 'center', backgroundColor: BRAND_PURPLE, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  claimBtnText: { fontSize: 13, fontFamily: 'Volte-Semibold', color: WHITE },
  claimBtnSub:  { fontSize: 11 },
});
