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

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE  = '#7D69AB';
const BG_CREAM      = '#F8F5EF';
const TEXT_DARK     = '#262626';
const TEXT_MUTED    = '#9097A3';
const SUCCESS       = '#3DAB69';
const ERROR_RED     = '#E53E3E';
const BORDER_DEFAULT = '#CFD4DC';

const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;
const TOTAL_STEPS = 3;

// ── Avatars ────────────────────────────────────────────────────────────────────
type AvatarItem = {
  id: string;
  emoji?: string;
  image?: any;
  bg: string;
};

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

function AvatarCircle({ avatar, size = 80 }: { avatar: AvatarItem; size?: number }) {
  return (
    <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatar.bg }]}>
      {avatar.image ? (
        <Image source={avatar.image} style={{ width: size * 0.75, height: size * 0.75 }} resizeMode="contain" />
      ) : (
        <Text style={{ fontSize: size * 0.45 }}>{avatar.emoji}</Text>
      )}
    </View>
  );
}

type ValidationState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

// ── Main screen ────────────────────────────────────────────────────────────────
export default function UsernameScreen() {
  const { user, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name ?? '');
  const [username, setUsername]         = useState('');
  const [validation, setValidation]     = useState<ValidationState>('idle');
  const [validationMsg, setValidationMsg] = useState('');
  const [saving, setSaving]             = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarItem>(AVATARS[0]);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [tempAvatar, setTempAvatar]     = useState<AvatarItem>(AVATARS[0]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Username validation ────────────────────────────────────────────────────
  const validateUsername = useCallback(async (value: string) => {
    const trimmed = value.trim();

    if (trimmed.length < 5) {
      setValidation('invalid');
      setValidationMsg('At least 5 characters');
      return;
    }
    if (trimmed.length > 20) {
      setValidation('invalid');
      setValidationMsg('Maximum 20 characters');
      return;
    }
    if (!USERNAME_REGEX.test(trimmed)) {
      setValidation('invalid');
      setValidationMsg('Letters and numbers only — no spaces or symbols');
      return;
    }

    setValidation('checking');
    setValidationMsg('Checking availability…');

    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', trimmed.toLowerCase())
      .maybeSingle();

    if (error) { setValidation('idle'); setValidationMsg(''); return; }

    if (data) {
      setValidation('taken');
      setValidationMsg('@' + trimmed + ' is already taken');
    } else {
      setValidation('available');
      setValidationMsg('@' + trimmed + ' is available ✓');
    }
  }, []);

  const handleUsernameChange = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    setUsername(cleaned);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (cleaned.length === 0) { setValidation('idle'); setValidationMsg(''); return; }
    debounceRef.current = setTimeout(() => validateUsername(cleaned), 500);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleContinue = async () => {
    if (!user || validation !== 'available') return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        username: username.trim().toLowerCase(),
        display_name: displayName.trim(),
        avatar_id: selectedAvatar.id,
      })
      .eq('id', user.id);

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
    return TEXT_MUTED;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>

          <ProgressBar total={TOTAL_STEPS} step={1} />

          <Text style={styles.heading}>Set up your profile</Text>
          <Text style={styles.subheading}>This is how other learners will see you.</Text>

          {/* Avatar picker trigger */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => { setTempAvatar(selectedAvatar); setAvatarPickerVisible(true); }}
            activeOpacity={0.85}
          >
            <AvatarCircle avatar={selectedAvatar} size={88} />
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={TEXT_MUTED}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Username{' '}
              <Text style={styles.labelNote}>(cannot be changed after setup)</Text>
            </Text>
            <View style={[styles.inputWrapper, { borderColor: borderColor() }]}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={styles.usernameInput}
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="yourusername"
                placeholderTextColor={TEXT_MUTED}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                maxLength={20}
              />
              {validation === 'checking' && (
                <ActivityIndicator size="small" color={TEXT_MUTED} style={styles.inputIcon} />
              )}
            </View>
            {validationMsg.length > 0 ? (
              <Text style={[styles.validationMsg, { color: msgColor() }]}>{validationMsg}</Text>
            ) : (
              <View style={styles.hintList}>
                <Text style={styles.hint}>• 5–20 characters</Text>
                <Text style={styles.hint}>• a-z alphabets and numbers only</Text>
              </View>
            )}
          </View>

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.continueBtnText}>Continue</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Avatar Picker Modal */}
      <Modal visible={avatarPickerVisible} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setAvatarPickerVisible(false)} />
        <View style={styles.pickerSheet}>
          {/* Handle */}
          <View style={styles.sheetHandle} />
          <Text style={styles.pickerTitle}>Change Avatar</Text>
          <FlatList
            data={AVATARS}
            keyExtractor={item => item.id}
            numColumns={4}
            contentContainerStyle={styles.avatarGrid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.avatarCell,
                  tempAvatar.id === item.id && styles.avatarCellSelected,
                ]}
                onPress={() => setTempAvatar(item)}
                activeOpacity={0.8}
              >
                <AvatarCircle avatar={item} size={66} />
              </TouchableOpacity>
            )}
          />
          <View style={styles.pickerFooter}>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => { setSelectedAvatar(tempAvatar); setAvatarPickerVisible(false); }}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: BG_CREAM },
  flex:      { flex: 1 },

  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },

  progressBar:    { flexDirection: 'row', gap: 6, marginBottom: 28 },
  progressSegment:{ flex: 1, height: 4, borderRadius: 2 },

  heading:    { fontSize: 26, lineHeight: 34, color: TEXT_DARK, fontFamily: 'Volte-Bold', marginBottom: 6 },
  subheading: { fontSize: 15, lineHeight: 22, color: TEXT_MUTED, fontFamily: 'Volte', marginBottom: 28 },

  avatarWrapper: { alignSelf: 'center', marginBottom: 32 },
  avatarCircle:  { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: BG_CREAM,
  },

  fieldGroup:  { marginBottom: 20 },
  label:       { fontSize: 14, color: TEXT_DARK, fontFamily: 'Volte-Semibold', marginBottom: 8 },
  labelNote:   { fontSize: 13, color: TEXT_MUTED, fontFamily: 'Volte' },

  input: {
    height: 48, borderRadius: 12, borderWidth: 1.5,
    borderColor: BORDER_DEFAULT, paddingHorizontal: 16,
    fontSize: 16, color: TEXT_DARK, fontFamily: 'Volte',
    backgroundColor: '#FFFFFF',
  },
  inputWrapper: {
    height: 48, borderRadius: 12, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16,
  },
  atSign:       { fontSize: 16, color: TEXT_MUTED, fontFamily: 'Volte', marginRight: 2 },
  usernameInput:{ flex: 1, height: '100%', fontSize: 16, color: TEXT_DARK, fontFamily: 'Volte' },
  inputIcon:    { marginLeft: 8 },

  validationMsg: { marginTop: 6, fontSize: 13, fontFamily: 'Volte-Medium' },
  hintList:      { marginTop: 8, gap: 3 },
  hint:          { fontSize: 13, color: TEXT_MUTED, fontFamily: 'Volte' },

  footer:             { paddingHorizontal: 24, paddingBottom: 24 },
  continueBtn:        { height: 52, borderRadius: 14, backgroundColor: BRAND_PURPLE, alignItems: 'center', justifyContent: 'center' },
  continueBtnDisabled:{ opacity: 0.4 },
  continueBtnText:    { fontSize: 17, color: '#FFFFFF', fontFamily: 'Volte-Semibold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
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
    fontSize: 18, fontFamily: 'Volte-Bold', color: TEXT_DARK,
    textAlign: 'center', marginBottom: 20,
  },
  avatarGrid:   { paddingHorizontal: 16, paddingBottom: 8 },
  avatarCell:   { flex: 1, alignItems: 'center', paddingVertical: 8 },
  avatarCellSelected: {
    backgroundColor: 'rgba(125,105,171,0.12)',
    borderRadius: 16,
  },
  pickerFooter: { paddingHorizontal: 24, paddingTop: 16 },
});
