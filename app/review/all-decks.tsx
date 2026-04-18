import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DECK_DATA } from '@/constants/mock-packs';
import { getActivatedPacks } from '@/constants/activated-store';

const BRAND_PURPLE = '#7D69AB';
const BG_CREAM     = '#F8F5EF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#525252';
const WHITE        = '#FFFFFF';

const THEME_DECKS = [
  { id: 't1', title: 'Animals',               subtitle: '動物',   image: require('@/assets/images/deck_cover_animals.png') },
  { id: 't2', title: 'Fruits & Vegetables',   subtitle: '水果蔬菜', image: require('@/assets/images/deck_cover_fruits_vegetables.png') },
  { id: 't3', title: 'Food & Drinks',         subtitle: '食物飲料', image: require('@/assets/images/deck_cover_food_drinks.png') },
  { id: 't4', title: 'Clothe & Accessories',  subtitle: '衣服配飾', image: require('@/assets/images/deck_cover_clothe_accessories.png') },
  { id: 't5', title: 'Body Parts',            subtitle: '身體部位', image: require('@/assets/images/deck_cover_body_parts.png') },
  { id: 't6', title: 'Furniture & Appliances',subtitle: '家具家電', image: require('@/assets/images/deck_cover_furniture_appliances.png') },
  { id: 't7', title: 'Sports',                subtitle: '運動',   image: require('@/assets/images/deck_cover_animals.png') },
];

const HSK_DECKS = [
  { id: 'hsk1', title: 'HSK 3.0 Lv. 1', subtitle: '華語水平 3.0（一級）', image: require('@/assets/images/deck_cover_hsk1.png') },
  { id: 'hsk2', title: 'HSK 3.0 Lv. 2', subtitle: '華語水平 3.0（二級）', image: require('@/assets/images/deck_cover_hsk2.png') },
  { id: 'hsk3', title: 'HSK 3.0 Lv. 3', subtitle: '華語水平 3.0（三級）', image: require('@/assets/images/deck_cover_hsk3.png') },
  { id: 'hsk4', title: 'HSK 3.0 Lv. 4', subtitle: '華語水平 3.0（四級）', image: require('@/assets/images/deck_cover_hsk4.png') },
];

const CARD_W = 160;
const CARD_H = 160;

export default function AllDecksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [themeDecks, setThemeDecks] = useState<typeof THEME_DECKS>([]);
  const [hskDecks,   setHskDecks]   = useState<typeof HSK_DECKS>([]);

  useEffect(() => {
    getActivatedPacks().then(activated => {
      setThemeDecks(THEME_DECKS.filter(d =>
        DECK_DATA[d.id]?.packs.some(p => activated.has(`${d.id}:${p.id}`))
      ));
      setHskDecks(HSK_DECKS.filter(d =>
        DECK_DATA[d.id]?.packs.some(p => activated.has(`${d.id}:${p.id}`))
      ));
    });
  }, []);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back-circle-outline" size={30} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Decks</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.creamSection}>
          {hskDecks.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>HSK</Text>
              </View>
              <View style={styles.grid}>
                {hskDecks.map(deck => (
                  <TouchableOpacity key={deck.id} style={styles.deckCard} activeOpacity={0.85}
                    onPress={() => router.push(`/review/deck-words?deckId=${deck.id}`)}>
                    <View style={styles.deckImageBox}>
                      <Image source={deck.image} style={styles.deckImage} resizeMode="cover" />
                    </View>
                    <Text style={styles.deckTitle} numberOfLines={1}>{deck.title}</Text>
                    <Text style={styles.deckSubtitle} numberOfLines={1}>{deck.subtitle}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {themeDecks.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: hskDecks.length > 0 ? 32 : 0 }]}>
                <Text style={styles.sectionTitle}>Themes</Text>
              </View>
              <View style={styles.grid}>
                {themeDecks.map(deck => (
                  <TouchableOpacity key={deck.id} style={styles.deckCard} activeOpacity={0.85}
                    onPress={() => router.push(`/review/deck-words?deckId=${deck.id}`)}>
                    <View style={styles.deckImageBox}>
                      <Image source={deck.image} style={styles.deckImage} resizeMode="cover" />
                    </View>
                    <Text style={styles.deckTitle} numberOfLines={1}>{deck.title}</Text>
                    <Text style={styles.deckSubtitle} numberOfLines={1}>{deck.subtitle}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: BRAND_PURPLE },
  header: {
    backgroundColor: BRAND_PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Volte-Semibold', color: WHITE },

  scroll: { flex: 1 },
  scrollContent: {},

  creamSection: {
    backgroundColor: BG_CREAM,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 28,
    minHeight: 600,
  },

  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 22, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 14,
  },
  deckCard:    { width: CARD_W },
  deckImageBox: {
    width: CARD_W, height: CARD_H,
    borderRadius: 16, marginBottom: 10, overflow: 'hidden',
  },
  deckImage:    { width: '100%', height: '100%' },
  deckTitle:    { fontSize: 15, color: TEXT_DARK,  fontFamily: 'Volte-Semibold', marginBottom: 2 },
  deckSubtitle: { fontSize: 13, color: TEXT_MUTED, fontFamily: 'Volte' },
});
