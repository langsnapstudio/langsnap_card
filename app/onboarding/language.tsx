import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { ALL_LANGUAGES } from '@/constants/languages';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE    = '#7D69AB';
const BG_CREAM        = '#F8F5EF';
const TEXT_DARK       = '#262626';
const BORDER_DEFAULT  = '#E5E5E5';
const BORDER_SELECTED = BRAND_PURPLE;

// Only Mandarin variants are available for onboarding (others are Phase 2)
const ONBOARDING_LANGUAGES = ALL_LANGUAGES.filter(l =>
  l.id === 'mainland' || l.id === 'taiwan'
);

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function LanguageScreen() {
  const { user, refreshProfile } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);

  const handleContinue = async () => {
    if (!user || !selected) return;
    setSaving(true);

    const updates: Record<string, string> = { target_language: selected };
    if (selected === 'mainland') updates.reading_system = 'pinyin';

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) { console.error(error.message); setSaving(false); return; }
    await refreshProfile();
    // _layout.tsx guard handles routing:
    // - mainland → (tabs) since reading_system is now set
    // - taiwan   → /onboarding/reading
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <Text style={styles.heading}>What language do you want to learn?</Text>

        <View style={styles.optionList}>
          {ONBOARDING_LANGUAGES.map(lang => {
            const isSelected = selected === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setSelected(lang.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.optionEmoji}>{lang.emoji}</Text>
                <Text style={styles.optionLabel}>{lang.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!selected || saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#FFF" />
            : <Text style={styles.continueBtnText}>Continue</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: BG_CREAM },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 48 },

  heading: {
    fontSize: 28, lineHeight: 36,
    color: TEXT_DARK, fontFamily: 'Volte-Semibold',
    marginBottom: 36,
  },

  optionList: { gap: 12 },

  option: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12, borderWidth: 2,
    borderColor: BORDER_DEFAULT,
    paddingHorizontal: 16, paddingVertical: 18,
  },
  optionSelected: {
    borderColor: BORDER_SELECTED,
  },

  optionEmoji: { fontSize: 28, marginRight: 14 },
  optionLabel: { fontSize: 16, color: TEXT_DARK, fontFamily: 'Volte-Medium', flex: 1 },

  footer: { paddingHorizontal: 24, paddingBottom: 36 },
  continueBtn: {
    height: 56, borderRadius: 14,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { fontSize: 17, color: '#FFFFFF', fontFamily: 'Volte-Semibold' },
});
