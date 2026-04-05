import React, { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
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
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';
const WHITE        = '#FFFFFF';

const ENERGY_COUNT = 1;

// ── Filter tabs ────────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',        label: 'All',        icon: null },
  { id: 'common',     label: 'Common',     icon: 'chatbubble-ellipses-outline' },
  { id: 'occasional', label: 'Occasional', icon: 'sparkles-outline' },
  { id: 'specialize', label: 'Specialize', icon: 'trophy-outline' },
] as const;

type FilterId = typeof FILTERS[number]['id'];

// ── Mock deck data ─────────────────────────────────────────────────────────────
type ThemeDeck = {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  filter: FilterId;
};

const ALL_THEME_DECKS: ThemeDeck[] = [
  { id: 't1', title: 'Animals',               subtitle: '動物',   image: require('@/assets/images/deck_cover_animals.png'),              filter: 'common' },
  { id: 't2', title: 'Fruits & Vegetables',   subtitle: '水果蔬菜', image: require('@/assets/images/deck_cover_fruits_vegetables.png'),    filter: 'common' },
  { id: 't3', title: 'Food & Drinks',         subtitle: '食物飲料', image: require('@/assets/images/deck_cover_food_drinks.png'),          filter: 'common' },
  { id: 't4', title: 'Clothe & Accessories',  subtitle: '衣服配飾', image: require('@/assets/images/deck_cover_clothe_accessories.png'),   filter: 'occasional' },
  { id: 't5', title: 'Body Parts',            subtitle: '身體部位', image: require('@/assets/images/deck_cover_body_parts.png'),           filter: 'occasional' },
  { id: 't6', title: 'Furniture & Appliances',subtitle: '家具家電', image: require('@/assets/images/deck_cover_furniture_appliances.png'), filter: 'specialize' },
  { id: 't7', title: 'Sports',               subtitle: '運動',   image: require('@/assets/images/deck_cover_animals.png'),              filter: 'occasional' },
];

// ── Theme List Screen ──────────────────────────────────────────────────────────
export default function ThemeListScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  const decks = activeFilter === 'all'
    ? ALL_THEME_DECKS
    : ALL_THEME_DECKS.filter(d => d.filter === activeFilter);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Themes</Text>

        <TouchableOpacity style={styles.energyBadge} activeOpacity={0.8}>
          <Ionicons name="flash" size={14} color="#F5C842" />
          <Text style={styles.energyCount}>{ENERGY_COUNT}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter tabs ───────────────────────────────────────────────────── */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => {
          const active = f.id === activeFilter;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setActiveFilter(f.id)}
              activeOpacity={0.75}
            >
              {f.icon && (
                <Ionicons
                  name={f.icon as any}
                  size={14}
                  color={active ? WHITE : TEXT_MUTED}
                />
              )}
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── 2-column grid ─────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.gridScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        {chunk(decks, 2).map((row, i) => (
          <View key={i} style={styles.gridRow}>
            {row.map(deck => (
              <TouchableOpacity
                key={deck.id}
                style={styles.gridCard}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/learn/deck-detail', params: { deckId: deck.id } })}
              >
                <View style={styles.cardImageBox}>
                  <Image source={deck.image} style={styles.cardImage} resizeMode="cover" />
                </View>
                <Text style={styles.cardTitle}>{deck.title}</Text>
                <Text style={styles.cardSubtitle}>{deck.subtitle}</Text>
              </TouchableOpacity>
            ))}
            {/* Fill empty slot if odd number in last row */}
            {row.length === 1 && <View style={styles.gridCard} />}
          </View>
        ))}
      </ScrollView>

    </SafeAreaView>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const GRID_PADDING = 20;
const GRID_GAP     = 12;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_CREAM },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn:     { width: 36, alignItems: 'flex-start' },
  backIcon:    { fontSize: 32, color: TEXT_DARK, lineHeight: 36, marginTop: -4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, color: TEXT_DARK, fontFamily: 'Volte-Bold' },
  energyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  energyIcon:  { fontSize: 14 },
  energyCount: { fontSize: 15, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },

  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 20,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterPillActive:  { backgroundColor: BRAND_PURPLE },
  filterLabel:       { fontSize: 14, color: TEXT_DARK, fontFamily: 'Volte-Medium' },
  filterLabelActive: { color: WHITE },

  // Grid
  gridScroll: { flex: 1 },
  grid:    { paddingHorizontal: GRID_PADDING, paddingBottom: 40, gap: GRID_GAP },
  gridRow: { flexDirection: 'row', gap: GRID_GAP },
  gridCard:{ flex: 1 },

  cardImageBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: '100%' },
  cardTitle:    { fontSize: 15, color: TEXT_DARK,  fontFamily: 'Volte-Bold',   marginBottom: 2 },
  cardSubtitle: { fontSize: 13, color: TEXT_MUTED, fontFamily: 'Volte' },
});
