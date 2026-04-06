import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE    = '#7D69AB';
const BG_CREAM        = '#F8F5EF';
const TEXT_DARK       = '#262626';
const TEXT_MUTED      = '#737373';
const BORDER_DEFAULT  = '#E5E5E5';
const BORDER_SELECTED = '#4B6FD0';

const READING_SYSTEMS = [
  {
    id: 'pinyin',
    label: 'Pinyin',
    desc: 'Romanised spelling system',
    example: 'nǐ hǎo',
  },
  {
    id: 'zhuyin',
    label: 'Zhuyin (BoPoMoFo)',
    desc: 'Phonetic script used in Taiwan',
    example: 'ㄋㄧˇ ㄏㄠˇ',
  },
];

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function ReadingScreen() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);

  const handleContinue = async () => {
    if (!user || !selected) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ reading_system: selected })
      .eq('id', user.id);

    if (error) { console.error(error.message); setSaving(false); return; }
    await refreshProfile();
    // _layout.tsx guard routes to (tabs) once all fields are set
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Back to language */}
        <TouchableOpacity onPress={() => router.replace('/onboarding/language')} style={styles.backRow} hitSlop={12}>
          <Text style={styles.backLink}>← Mandarin Chinese (Taiwan)</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>How do you prefer to read?</Text>
        <Text style={styles.subheading}>This can be changed later in Settings.</Text>

        <View style={styles.optionList}>
          {READING_SYSTEMS.map(sys => {
            const isSelected = selected === sys.id;
            return (
              <TouchableOpacity
                key={sys.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setSelected(sys.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.optionLabel}>{sys.label}</Text>
                <Text style={styles.optionDesc}>{sys.desc}</Text>
                <Text style={styles.optionExample}>{sys.example}</Text>
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
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },

  backRow:   { marginBottom: 28 },
  backLink:  { fontSize: 14, color: BRAND_PURPLE, fontFamily: 'Volte-Medium' },

  heading: {
    fontSize: 28, lineHeight: 36,
    color: TEXT_DARK, fontFamily: 'Volte-Semibold',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14, color: TEXT_MUTED,
    fontFamily: 'Volte', marginBottom: 32,
  },

  optionList: { gap: 12 },

  option: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, borderWidth: 1,
    borderColor: BORDER_DEFAULT,
    paddingHorizontal: 16, paddingVertical: 18,
    gap: 4,
  },
  optionSelected: {
    borderColor: BORDER_SELECTED,
  },

  optionLabel:   { fontSize: 16, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },
  optionDesc:    { fontSize: 13, color: TEXT_MUTED, fontFamily: 'Volte' },
  optionExample: { fontSize: 15, color: TEXT_MUTED, fontFamily: 'Volte-Medium', marginTop: 4 },

  footer: { paddingHorizontal: 24, paddingBottom: 36 },
  continueBtn: {
    height: 56, borderRadius: 14,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { fontSize: 17, color: '#FFFFFF', fontFamily: 'Volte-Semibold' },
});
