import React, { useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

// ── Design tokens (exact from Figma) ──────────────────────────────────────────
const BRAND_PURPLE   = '#7D69AB';
const BG_CREAM       = '#F8F6EF';   // rgb(248,246,239)
const TEXT_DARK      = '#262626';   // rgb(38,38,38)
const TEXT_SECONDARY = '#525252';   // rgb(82,82,82)  — labels, subheading, hints
const TEXT_PLACEHOLDER = '#A3A3A3'; // rgb(163,163,163)
const BORDER_DEFAULT = '#E5E5E5';   // rgb(229,229,229)
const SUCCESS        = '#3DAB69';
const ERROR_RED      = '#E53E3E';

const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;
const TOTAL_STEPS    = 3;

// ── Avatars ────────────────────────────────────────────────────────────────────
type AvatarItem = { id: string; emoji?: string; image?: any; bg: string };

const AVATARS: AvatarItem[] = [
  { id: 'dog',        image: require('@/assets/images/illustration-dog.png'),        bg: '#F5C842' },
  { id: 'fox',        emoji: '🦊', bg: '#F5A342' },
  { id: 'panda',      emoji: '🐼', bg: '#555555' },
  { id: 'elephant',   emoji: '🐘', bg: '#B0CCDF' },
  { id: 'rabbit',     emoji: '🐰', bg: '#E8E8E4' },
  { id: 'strawberry', emoji: '🍓', bg: '#F5C8C8' },
  { id: 'blueberry',  emoji: '🫐', bg: '#9BB5E8' },
  { id: 'pineapple',  image: require('@/assets/images/illustration-pineapple.png'),  bg: '#4CAF50' },
  { id: 'corn',       emoji: '🌽', bg: '#2E9E7A' },
  { id: 'burger',     emoji: '🍔', bg: '#E53935' },
  { id: 'sushi',      emoji: '🍱', bg: '#424242' },
  { id: 'pizza',      emoji: '🍕', bg: '#26C6DA' },
  { id: 'bubble_tea', image: require('@/assets/images/illustration-bubble-tea.png'), bg: '#8D6E63' },
  { id: 'flower',     emoji: '🌸', bg: '#F48FB1' },
];

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgressBar({ total, step }: { total: number; step: number }) {
  return (
    <View style={styles.progressBar}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            { backgroundColor: i < step ? BRAND_PURPLE : '#FFFFFF' },
          ]}
        />
      ))}
    </View>
  );
}

// ── Avatar circle ──────────────────────────────────────────────────────────────
function AvatarCircle({ avatar, size = 120 }: { avatar: AvatarItem; size?: number }) {
  return (
    <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatar.bg }]}>
      {avatar.image ? (
        <Image source={avatar.image} style={{ width: size * 0.78, height: size * 0.78 }} resizeMode="contain" />
      ) : (
        <Text style={{ fontSize: size * 0.46 }}>{avatar.emoji}</Text>
      )}
    </View>
  );
}

type ValidationState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function UsernameScreen() {
  const { user, refreshProfile } = useAuth();

  const [displayName, setDisplayName]   = useState(user?.user_metadata?.full_name ?? '');
  const [username, setUsername]         = useState('');
  const [validation, setValidation]     = useState<ValidationState>('idle');
  const [validationMsg, setValidationMsg] = useState('');
  const [saving, setSaving]             = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarItem>(AVATARS[0]);
  const [pickerVisible, setPickerVisible]   = useState(false);
  const [tempAvatar, setTempAvatar]     = useState<AvatarItem>(AVATARS[0]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Validation ───────────────────────────────────────────────────────────────
  const validateUsername = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 5) { setValidation('invalid'); setValidationMsg('At least 5 characters'); return; }
    if (trimmed.length > 20) { setValidation('invalid'); setValidationMsg('Maximum 20 characters'); return; }
    if (!USERNAME_REGEX.test(trimmed)) { setValidation('invalid'); setValidationMsg('Letters and numbers only'); return; }

    setValidation('checking'); setValidationMsg('Checking…');
    const { data, error } = await supabase.from('profiles').select('username').eq('username', trimmed.toLowerCase()).maybeSingle();
    if (error) { setValidation('idle'); setValidationMsg(''); return; }
    if (data) {
      setValidation('taken'); setValidationMsg('@' + trimmed + ' is already taken');
    } else {
      setValidation('available'); setValidationMsg('@' + trimmed + ' is available ✓');
    }
  }, []);

  const handleUsernameChange = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    setUsername(cleaned);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (cleaned.length === 0) { setValidation('idle'); setValidationMsg(''); return; }
    debounceRef.current = setTimeout(() => validateUsername(cleaned), 500);
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleContinue = async () => {
    if (!user || validation !== 'available') return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      username: username.trim().toLowerCase(),
      display_name: displayName.trim(),
      avatar_id: selectedAvatar.id,
    }).eq('id', user.id);
    if (error) { console.error(error.message); setSaving(false); return; }
    await refreshProfile();
  };

  const canContinue = displayName.trim().length > 0 && validation === 'available' && !saving;

  const borderColor = () => {
    if (validation === 'available') return SUCCESS;
    if (validation === 'taken' || validation === 'invalid') return ERROR_RED;
    return BORDER_DEFAULT;
  };
  const msgColor = () => {
    if (validation === 'available') return SUCCESS;
    if (validation === 'taken' || validation === 'invalid') return ERROR_RED;
    return TEXT_SECONDARY;
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={styles.container}>
          <ProgressBar total={TOTAL_STEPS} step={1} />

          <Text style={styles.heading}>Set up your profile</Text>
          <Text style={styles.subheading}>This is how other learners will see you.</Text>

          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => { setTempAvatar(selectedAvatar); setPickerVisible(true); }}
            activeOpacity={0.9}
          >
            <AvatarCircle avatar={selectedAvatar} size={120} />
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={TEXT_PLACEHOLDER}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              <Text style={styles.fieldLabelBold}>Username </Text>
              <Text style={styles.fieldLabelNote}>(cannot be changed after this step)</Text>
            </Text>
            <View style={[styles.inputRow, { borderColor: borderColor() }]}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={styles.usernameInput}
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="yourusername"
                placeholderTextColor={TEXT_PLACEHOLDER}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                maxLength={20}
              />
              {validation === 'checking' && (
                <ActivityIndicator size="small" color={TEXT_PLACEHOLDER} />
              )}
            </View>
            {validationMsg.length > 0 ? (
              <Text style={[styles.validationMsg, { color: msgColor() }]}>{validationMsg}</Text>
            ) : (
              <View style={styles.hintBlock}>
                <Text style={styles.hintLine}>• 5–20 characters</Text>
                <Text style={styles.hintLine}>• a-z alphabets and numbers only</Text>
              </View>
            )}
          </View>
        </View>

        {/* Continue button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btn, !canContinue && styles.btnDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.btnText}>Continue</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Avatar picker */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <Pressable style={styles.overlay} onPress={() => setPickerVisible(false)} />
        <View style={styles.pickerSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.pickerTitle}>Change Avatar</Text>
          <FlatList
            data={AVATARS}
            keyExtractor={item => item.id}
            numColumns={4}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.gridCell, tempAvatar.id === item.id && styles.gridCellSelected]}
                onPress={() => setTempAvatar(item)}
                activeOpacity={0.8}
              >
                <AvatarCircle avatar={item} size={68} />
              </TouchableOpacity>
            )}
          />
          <View style={styles.pickerFooter}>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => { setSelectedAvatar(tempAvatar); setPickerVisible(false); }}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: BG_CREAM },
  flex:  { flex: 1 },

  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },

  // Progress bar — exact Figma: h=6, gap=8, inactive=white, pill radius
  progressBar:     { flexDirection: 'row', gap: 8, marginBottom: 22 },
  progressSegment: { flex: 1, height: 6, borderRadius: 999 },

  // Heading — 24px Semibold, #262626, lineH 32
  heading: {
    fontSize: 24, lineHeight: 32,
    color: TEXT_DARK, fontFamily: 'Volte-Semibold',
    marginBottom: 4,
  },

  // Subheading — 14px Regular, #525252, lineH 16
  subheading: {
    fontSize: 14, lineHeight: 16,
    color: TEXT_SECONDARY, fontFamily: 'Volte',
    marginBottom: 24,
  },

  // Avatar — centered, 120px
  avatarWrapper: { alignSelf: 'center', marginBottom: 36 },
  avatarCircle:  { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 999,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: BG_CREAM,
  },

  // Fields — gap 24 between them
  fieldGroup: { marginBottom: 24 },

  // Label — 14px, #525252
  fieldLabel:     { fontSize: 14, lineHeight: 16, color: TEXT_SECONDARY, fontFamily: 'Volte', marginBottom: 8 },
  fieldLabelBold: { fontFamily: 'Volte-Semibold' },
  fieldLabelNote: { fontFamily: 'Volte' },

  // Input — h=40, border 1px #E5E5E5, radius 8, white bg, padding h=12 v=10
  input: {
    height: 40, borderRadius: 8, borderWidth: 1,
    borderColor: BORDER_DEFAULT,
    paddingHorizontal: 12, paddingVertical: 9.5,
    fontSize: 14, color: TEXT_DARK, fontFamily: 'Volte',
    backgroundColor: '#FFFFFF',
  },
  inputRow: {
    height: 40, borderRadius: 8, borderWidth: 1,
    borderColor: BORDER_DEFAULT,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  atSign: {
    fontSize: 14, color: TEXT_DARK, fontFamily: 'Volte', marginRight: 2,
  },
  usernameInput: {
    flex: 1, height: '100%',
    fontSize: 14, color: TEXT_DARK, fontFamily: 'Volte',
  },

  // Validation / hints — 14px #525252
  validationMsg: { marginTop: 6, fontSize: 12, fontFamily: 'Volte-Medium' },
  hintBlock:     { marginTop: 8, gap: 2 },
  hintLine:      { fontSize: 14, lineHeight: 16, color: TEXT_SECONDARY, fontFamily: 'Volte' },

  // Footer — button pinned bottom
  footer: { paddingHorizontal: 16, paddingBottom: 34 },
  btn: {
    height: 42, borderRadius: 8,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 16, color: '#FFFFFF', fontFamily: 'Volte-Semibold' },

  // Avatar picker modal
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  pickerSheet: {
    backgroundColor: BG_CREAM,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 34,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#D9D5E4', alignSelf: 'center', marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18, fontFamily: 'Volte-Semibold', color: TEXT_DARK,
    textAlign: 'center', marginBottom: 20,
  },
  grid:          { paddingHorizontal: 12, paddingBottom: 8 },
  gridCell:      { flex: 1, alignItems: 'center', paddingVertical: 8 },
  gridCellSelected: { backgroundColor: 'rgba(125,105,171,0.12)', borderRadius: 16 },
  pickerFooter:  { paddingHorizontal: 16, paddingTop: 16 },
});
