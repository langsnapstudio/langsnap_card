import React, { useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSheetDismiss } from '@/hooks/useSheetDismiss';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const BG_CREAM     = '#F8F5EF';
const WHITE        = '#FFFFFF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#525252';
const BORDER       = '#E5E5E5';
const SUCCESS      = '#3DAB69';

const FEATURES = [
  'Flashcard review',
  'Review tab',
  'Profile',
  'Energy',
  'Streak',
  'Other',
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function ReportBugSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const { dragY, panHandlers } = useSheetDismiss(onClose);

  const [description, setDescription] = useState('');
  const [feature,     setFeature]     = useState<string | null>(null);
  const [submitted,   setSubmitted]   = useState(false);
  const [showPicker,  setShowPicker]  = useState(false);

  React.useEffect(() => {
    if (visible) {
      slideAnim.setValue(500);
      dragY.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 500, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        // Reset state after sheet hides
        setDescription('');
        setFeature(null);
        setSubmitted(false);
        setShowPicker(false);
      });
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!description.trim()) return;
    Keyboard.dismiss();
    // TODO: send to backend / log for creator
    console.log('[Report Bug]', { description: description.trim(), feature });
    setSubmitted(true);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kvWrap}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY: Animated.add(slideAnim, dragY) }] }]} {...panHandlers}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={TEXT_DARK} />
          </TouchableOpacity>

          {submitted ? (
            /* ── Success state ───────────────────────────────────────────── */
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color={SUCCESS} />
              </View>
              <Text style={styles.successTitle}>Thanks for the report!</Text>
              <Text style={styles.successSub}>We'll look into it.</Text>
              <TouchableOpacity style={styles.doneBtn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Form state ──────────────────────────────────────────────── */
            <>
              <Text style={styles.title}>Report a bug</Text>
              <Text style={styles.subtitle}>
                Found something broken? Let us know and we'll get it fixed.
              </Text>

              {/* Description field */}
              <Text style={styles.label}>Describe the issue <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.textArea}
                placeholder="What happened? What did you expect to happen?"
                placeholderTextColor={TEXT_MUTED}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Feature dropdown */}
              <Text style={[styles.label, { marginTop: 16 }]}>Which feature? <Text style={styles.optional}>(optional)</Text></Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowPicker(p => !p)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pickerText, !feature && { color: TEXT_MUTED }]}>
                  {feature ?? 'Select a feature…'}
                </Text>
                <Ionicons
                  name={showPicker ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={TEXT_MUTED}
                />
              </TouchableOpacity>

              {showPicker && (
                <View style={styles.dropdownList}>
                  {FEATURES.map((f, i) => (
                    <React.Fragment key={f}>
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => { setFeature(f); setShowPicker(false); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.dropdownItemText, feature === f && { color: BRAND_PURPLE, fontFamily: 'Volte-Semibold' }]}>
                          {f}
                        </Text>
                        {feature === f && (
                          <Ionicons name="checkmark" size={16} color={BRAND_PURPLE} />
                        )}
                      </TouchableOpacity>
                      {i < FEATURES.length - 1 && <View style={styles.dropdownDivider} />}
                    </React.Fragment>
                  ))}
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, !description.trim() && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={!description.trim()}
              >
                <Text style={styles.submitBtnText}>Submit report</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  kvWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: BG_CREAM,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#D1CCC4',
    alignSelf: 'center',
    marginBottom: 12,
  },
  closeBtn: { alignSelf: 'flex-end', marginBottom: 4 },

  title:    { fontSize: 20, fontFamily: 'Volte-Semibold', color: TEXT_DARK, marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: 'Volte', color: TEXT_MUTED, lineHeight: 20, marginBottom: 20 },

  label:    { fontSize: 13, fontFamily: 'Volte-Semibold', color: TEXT_DARK, marginBottom: 8 },
  required: { color: '#E53E3E' },
  optional: { color: TEXT_MUTED, fontFamily: 'Volte' },

  textArea: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Volte',
    color: TEXT_DARK,
    minHeight: 100,
  },

  picker: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: { fontSize: 15, fontFamily: 'Volte', color: TEXT_DARK },

  dropdownList: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemText: { fontSize: 15, fontFamily: 'Volte', color: TEXT_DARK },
  dropdownDivider:  { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },

  submitBtn: {
    marginTop: 24,
    height: 52,
    borderRadius: 14,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#C4BAD8' },
  submitBtnText: { fontSize: 16, fontFamily: 'Volte-Semibold', color: WHITE },

  // Success
  successWrap:  { alignItems: 'center', paddingVertical: 24 },
  successIcon:  { marginBottom: 16 },
  successTitle: { fontSize: 20, fontFamily: 'Volte-Semibold', color: TEXT_DARK, marginBottom: 6 },
  successSub:   { fontSize: 14, fontFamily: 'Volte', color: TEXT_MUTED, marginBottom: 28 },
  doneBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { fontSize: 16, fontFamily: 'Volte-Semibold', color: WHITE },
});
