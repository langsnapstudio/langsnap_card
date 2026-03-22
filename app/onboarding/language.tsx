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

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE  = '#7D69AB';
const BG_CREAM      = '#F8F5EF';
const TEXT_DARK     = '#262626';
const TEXT_MUTED    = '#9097A3';
const BORDER_DEFAULT = '#CFD4DC';
const TOTAL_STEPS   = 3;

const LANGUAGES = [
  { id: 'mainland', label: 'Mandarin Chinese (Mainland)', flag: '🇨🇳' },
  { id: 'taiwan',   label: 'Mandarin Chinese (Taiwan)',   flag: '🇹🇼' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
function ProgressBar({ total, step }: { total: number; step: number }) {
  return (
    <View style={styles.progressBar}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.progressSegment, { backgroundColor: i < step ? BRAND_PURPLE : '#D9D5E4' }]}
        />
      ))}
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function LanguageScreen() {
  const { user, refreshProfile } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);

  const handleContinue = async () => {
    if (!user || !selected) return;
    setSaving(true);

    // For mainland users, set reading_system to 'pinyin' automatically
    const updates: Record<string, string> = { target_language: selected };
    if (selected === 'mainland') updates.reading_system = 'pinyin';

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) { console.error(error.message); setSaving(false); return; }
    await refreshProfile();
    // _layout.tsx guard handles routing:
    // - mainland → goes to (tabs) since reading_system is now set
    // - taiwan → goes to /onboarding/reading
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <ProgressBar total={TOTAL_STEPS} step={2} />

        <Text style={styles.heading}>What language do you want to learn?</Text>

        <View style={styles.optionList}>
          {LANGUAGES.map(lang => {
            const isSelected = selected === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setSelected(lang.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.optionFlag}>{lang.flag}</Text>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {lang.label}
                </Text>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
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

  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },

  progressBar:     { flexDirection: 'row', gap: 6, marginBottom: 28 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },

  heading: {
    fontSize: 26, lineHeight: 34,
    color: TEXT_DARK, fontFamily: 'Volte-Bold',
    marginBottom: 40,
  },

  optionList: { gap: 12 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14, borderWidth: 1.5,
    borderColor: BORDER_DEFAULT,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  optionSelected: {
    borderColor: BRAND_PURPLE,
    backgroundColor: 'rgba(125,105,171,0.06)',
  },
  optionFlag:  { fontSize: 22, marginRight: 12 },
  optionLabel: { flex: 1, fontSize: 16, color: TEXT_DARK, fontFamily: 'Volte-Medium' },
  optionLabelSelected: { color: BRAND_PURPLE, fontFamily: 'Volte-Semibold' },

  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: BORDER_DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: BRAND_PURPLE },
  radioDot: {
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: BRAND_PURPLE,
  },

  footer:              { paddingHorizontal: 24, paddingBottom: 34 },
  continueBtn:         { height: 52, borderRadius: 14, backgroundColor: BRAND_PURPLE, alignItems: 'center', justifyContent: 'center' },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText:     { fontSize: 17, color: '#FFFFFF', fontFamily: 'Volte-Semibold' },
});
