import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ALL_LANGUAGES } from '@/constants/languages';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const PURPLE_LIGHT = '#EDE9F5';
const BG_CREAM     = '#F8F5EF';
const WHITE        = '#FFFFFF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function AddLanguageScreen() {
  const router = useRouter();
  const { profile, user, refreshProfile } = useAuth();

  const [selected, setSelected] = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);

  const activeLangId = profile?.target_language ?? 'mainland';

  // Show all languages except the currently active one
  const available = ALL_LANGUAGES.filter(l => l.id !== activeLangId);

  async function handleAdd() {
    if (!user || !selected) return;
    setSaving(true);
    const updates: Record<string, string> = { target_language: selected };
    if (selected === 'mainland') updates.reading_system = 'pinyin';
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (!error) {
      await refreshProfile();
      router.back();
    }
    setSaving(false);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Add a language</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <Text style={styles.subtitle}>
          Choose a language to add to your courses. You can switch between languages anytime.
        </Text>

        {available.map(lang => {
          const isSelected = selected === lang.id;
          return (
            <TouchableOpacity
              key={lang.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              activeOpacity={0.8}
              onPress={() => setSelected(lang.id)}
            >
              <View style={styles.emojiWrap}>
                <Text style={styles.emoji}>{lang.emoji}</Text>
              </View>
              <Text style={styles.cardLabel}>{lang.label}</Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={22} color={BRAND_PURPLE} />
              )}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addBtn, (!selected || saving) && styles.addBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleAdd}
          disabled={!selected || saving}
        >
          {saving
            ? <ActivityIndicator color={WHITE} />
            : <Text style={styles.addBtnText}>Add language</Text>
          }
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG_CREAM },
  scrollContent: { padding: 16 },

  navBar:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  navBtn:   { width: 32 },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Volte-Semibold', color: TEXT_DARK },

  subtitle: {
    fontSize: 14, fontFamily: 'Volte-Medium', color: TEXT_MUTED,
    lineHeight: 20, marginBottom: 20, paddingHorizontal: 4,
  },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: WHITE, borderRadius: 16,
    padding: 16, marginBottom: 10,
    borderWidth: 2, borderColor: 'transparent',
  },
  cardSelected: { borderColor: BRAND_PURPLE },

  emojiWrap: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji:     { fontSize: 24 },
  cardLabel: { flex: 1, fontSize: 15, fontFamily: 'Volte-Semibold', color: TEXT_DARK },

  footer: { paddingHorizontal: 16, paddingBottom: 8 },
  addBtn: {
    height: 52, borderRadius: 14,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { fontSize: 16, fontFamily: 'Volte-Semibold', color: WHITE },
});
