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
const BRAND_PURPLE   = '#7D69AB';
const BG_CREAM       = '#F8F5EF';
const TEXT_DARK      = '#262626';
const TEXT_MUTED     = '#9097A3';
const BORDER_DEFAULT = '#CFD4DC';
const TOTAL_STEPS    = 3;

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
export default function ReadingScreen() {
  const { user, profile, refreshProfile } = useAuth();
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
    // _layout.tsx guard routes to (tabs) now that all fields are set
  };

  const languageLabel =
    profile?.target_language === 'taiwan'
      ? 'Mandarin Chinese (Taiwan) 🇹🇼'
      : 'Mandarin Chinese (Mainland) 🇨🇳';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <ProgressBar total={TOTAL_STEPS} step={3} />

        {/* Language confirmation row */}
        <View style={styles.langRow}>
          <Text style={styles.langLabel}>{languageLabel}</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.changeLink}>Change</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>How do you prefer reading system?</Text>
        <Text style={styles.subheading}>This can be changed later in Settings.</Text>

        <View style={styles.optionList}>
          {READING_SYSTEMS.map(sys => {
            const isSelected = selected === sys.id;
            return (
              <TouchableOpacity
                key={sys.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setSelected(sys.id)}
                activeOpacity={0.8}
              >
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {sys.label}
                  </Text>
                  <Text style={styles.optionDesc}>{sys.desc}</Text>
                  <Text style={[styles.optionExample, isSelected && styles.optionExampleSelected]}>
                    {sys.example}
                  </Text>
                </View>
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

  langRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 20,
  },
  langLabel: {
    flex: 1, fontSize: 14,
    color: TEXT_DARK, fontFamily: 'Volte-Medium',
  },
  changeLink: {
    fontSize: 14, color: BRAND_PURPLE, fontFamily: 'Volte-Semibold',
  },

  heading:    { fontSize: 26, lineHeight: 34, color: TEXT_DARK, fontFamily: 'Volte-Bold', marginBottom: 8 },
  subheading: { fontSize: 14, color: TEXT_MUTED, fontFamily: 'Volte', marginBottom: 32 },

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
  optionText:  { flex: 1, gap: 3 },
  optionLabel: { fontSize: 16, color: TEXT_DARK, fontFamily: 'Volte-Semibold' },
  optionLabelSelected: { color: BRAND_PURPLE },
  optionDesc:  { fontSize: 13, color: TEXT_MUTED, fontFamily: 'Volte' },
  optionExample: { fontSize: 15, color: TEXT_MUTED, fontFamily: 'Volte-Medium', marginTop: 4 },
  optionExampleSelected: { color: BRAND_PURPLE },

  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: BORDER_DEFAULT,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 12,
  },
  radioSelected: { borderColor: BRAND_PURPLE },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: BRAND_PURPLE },

  footer:              { paddingHorizontal: 24, paddingBottom: 34 },
  continueBtn:         { height: 52, borderRadius: 14, backgroundColor: BRAND_PURPLE, alignItems: 'center', justifyContent: 'center' },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText:     { fontSize: 17, color: '#FFFFFF', fontFamily: 'Volte-Semibold' },
});
