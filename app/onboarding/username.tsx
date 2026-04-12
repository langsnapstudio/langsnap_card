import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
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

const USERNAME_REGEX = /^[a-z0-9]+$/;

// ── Avatars ────────────────────────────────────────────────────────────────────
// Images already include their background color (square, gets clipped to circle)
// Naming: avatar-[animal/food].png in assets/images/
// Fallback bg color shown as placeholder until image file is added
type AvatarItem = { id: string; fallbackBg: string };

const AVATAR_IMAGES: Record<string, any> = {
  dog:          require('@/assets/images/avatar-dog.png'),
  cat:          require('@/assets/images/avatar-cat.png'),
  sheep:        require('@/assets/images/avatar-sheep.png'),
  elephant:     require('@/assets/images/avatar-elephant.png'),
  rabbit:       require('@/assets/images/avatar-rabbit.png'),
  watermelon:   require('@/assets/images/avatar-watermelon.png'),
  dragonfruit:  require('@/assets/images/avatar-dragonfruit.png'),
  pineapple:    require('@/assets/images/avatar-pineapple.png'),
  corn:         require('@/assets/images/avatar-corn.png'),
  hamburger:    require('@/assets/images/avatar-hamburger.png'),
  sushi:        require('@/assets/images/avatar-sushi.png'),
  pizza:        require('@/assets/images/avatar-pizza.png'),
  streamedbun:  require('@/assets/images/avatar-streamedbun.png'),
  bubbletea:    require('@/assets/images/avatar-bubbletea.png'),
  hotcocoa:     require('@/assets/images/avatar-hotcocoa.png'),
  beer:         require('@/assets/images/avatar-beer.png'),
};

const AVATARS: AvatarItem[] = [
  { id: 'dog',         fallbackBg: '#F5C842' },
  { id: 'cat',         fallbackBg: '#E07A45' },
  { id: 'sheep',       fallbackBg: '#606060' },
  { id: 'elephant',    fallbackBg: '#B0CCDF' },
  { id: 'rabbit',      fallbackBg: '#E8E8E4' },
  { id: 'watermelon',  fallbackBg: '#E05C5C' },
  { id: 'dragonfruit', fallbackBg: '#9BB5E8' },
  { id: 'pineapple',   fallbackBg: '#4CAF50' },
  { id: 'corn',        fallbackBg: '#2E9E7A' },
  { id: 'hamburger',   fallbackBg: '#E53935' },
  { id: 'sushi',       fallbackBg: '#424242' },
  { id: 'pizza',       fallbackBg: '#26C6DA' },
  { id: 'streamedbun', fallbackBg: '#D4A574' },
  { id: 'bubbletea',   fallbackBg: '#8D6E63' },
  { id: 'hotcocoa',    fallbackBg: '#6D4C41' },
  { id: 'beer',        fallbackBg: '#F5A623' },
];

// ── Avatar circle ──────────────────────────────────────────────────────────────
// Images are square with baked-in background — clip to circle via overflow:hidden
function AvatarCircle({ avatar, size = 120 }: { avatar: AvatarItem; size?: number }) {
  const image = AVATAR_IMAGES[avatar.id];
  return (
    <View style={[
      styles.avatarCircle,
      { width: size, height: size, borderRadius: size / 2,
        backgroundColor: image ? 'transparent' : avatar.fallbackBg },
    ]}>
      {image ? (
        <Image
          source={image}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : (
        // Dim placeholder until image file is added
        <View style={{ width: size * 0.4, height: size * 0.4,
          borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.35)' }} />
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
  const [nameFocused, setNameFocused]       = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // ── Validation ───────────────────────────────────────────────────────────────
  const validateUsername = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 5 || trimmed.length > 20) { setValidation('invalid'); setValidationMsg('Username must be 5-20 characters'); return; }
    if (!USERNAME_REGEX.test(trimmed)) { setValidation('invalid'); setValidationMsg('a-z alphabets and numbers only'); return; }

    setValidation('checking'); setValidationMsg('Checking…');
    const { data, error } = await supabase.from('profiles').select('username').eq('username', trimmed.toLowerCase()).maybeSingle();
    if (error) { setValidation('idle'); setValidationMsg(''); return; }
    if (data) {
      setValidation('taken'); setValidationMsg('This username is already taken.');
    } else {
      setValidation('available'); setValidationMsg('');
    }
  }, []);

  const handleUsernameChange = (value: string) => {
    // Strip anything that isn't a-z or 0-9, and auto-lowercase
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
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

  // ── Input border helpers ─────────────────────────────────────────────────────
  const nameBorderColor  = nameFocused ? BRAND_PURPLE : BORDER_DEFAULT;
  const nameBorderWidth  = 1;

  const isUsernameError = validation === 'taken' || validation === 'invalid';
  const usernameBorderColor = () => {
    if (!usernameFocused) {
      return isUsernameError ? ERROR_RED : BORDER_DEFAULT;
    }
    if (validation === 'available') return SUCCESS;
    if (isUsernameError) return ERROR_RED;
    return BRAND_PURPLE;
  };
  const usernameBorderWidth = 1;
  const msgColor = () => {
    if (validation === 'available') return SUCCESS;
    if (isUsernameError) return ERROR_RED;
    return TEXT_SECONDARY;
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={styles.container}>
          <Text style={styles.heading}>Set up your profile</Text>
          <Text style={styles.subheading}>This is how other learners will see you.</Text>

          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.9}
          >
            <AvatarCircle avatar={selectedAvatar} size={120} />
            <Text style={styles.changeAvatarLink}>Change your avatar</Text>
          </TouchableOpacity>

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={[styles.input, { borderColor: nameBorderColor, borderWidth: nameBorderWidth }]}
              value={displayName}
              onChangeText={setDisplayName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
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
              <Text style={styles.fieldLabelNote}>(Cannot be changed after this step)</Text>
            </Text>
            <View style={[styles.inputRow, { borderColor: usernameBorderColor(), borderWidth: usernameBorderWidth }]}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={styles.usernameInput}
                value={username}
                onChangeText={handleUsernameChange}
                onFocus={() => setUsernameFocused(true)}
                onBlur={() => setUsernameFocused(false)}
                placeholder="yourusername"
                placeholderTextColor={TEXT_PLACEHOLDER}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                keyboardType="ascii-capable"
                returnKeyType="done"
                maxLength={20}
              />
              {validation === 'checking' && (
                <ActivityIndicator size="small" color={TEXT_PLACEHOLDER} style={{ marginLeft: 8 }} />
              )}
              {validation === 'available' && (
                <Ionicons name="checkmark-circle" size={20} color={SUCCESS} style={{ marginLeft: 8 }} />
              )}
            </View>
            {validationMsg.length > 0 ? (
              <Text style={[styles.validationMsg, { color: msgColor() }]}>{validationMsg}</Text>
            ) : null}
            <View style={styles.hintBlock}>
              <Text style={styles.hintLine}>• 5–20 Characters</Text>
              <Text style={styles.hintLine}>• A-Z alphabets and numbers only</Text>
            </View>
          </View>
        </View>

        {/* Continue button — hidden when keyboard is up */}
        {!keyboardVisible && <View style={styles.footer}>
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
        </View>}
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
                style={[styles.gridCell, selectedAvatar.id === item.id && styles.gridCellSelected]}
                onPress={() => { setSelectedAvatar(item); setPickerVisible(false); }}
                activeOpacity={0.8}
              >
                <AvatarCircle avatar={item} size={68} />
              </TouchableOpacity>
            )}
          />
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
  avatarWrapper:    { alignSelf: 'center', alignItems: 'center', marginBottom: 28, gap: 10 },
  avatarCircle:     { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  changeAvatarLink: { fontSize: 13, fontFamily: 'Volte-Medium', color: BRAND_PURPLE },

  // Fields — gap 24 between them
  fieldGroup: { marginBottom: 24 },

  // Label — 14px Semibold, #525252
  fieldLabel:     { fontSize: 14, lineHeight: 16, color: TEXT_SECONDARY, fontFamily: 'Volte-Semibold', marginBottom: 8 },
  fieldLabelBold: { fontFamily: 'Volte-Semibold' },
  fieldLabelNote: { fontFamily: 'Volte' },

  // Input — h=40, radius 8, white bg; border is applied inline (1px default → 2px focused/error)
  input: {
    height: 40, borderRadius: 8, borderWidth: 1,
    borderColor: BORDER_DEFAULT,
    paddingHorizontal: 12,
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

  // Validation message (error / success / checking)
  validationMsg: { marginTop: 6, fontSize: 12, lineHeight: 16, fontFamily: 'Volte-Medium' },
  // Hints — separate info block with larger gap
  hintBlock: { marginTop: 20, gap: 4 },
  hintLine:  { fontSize: 13, lineHeight: 18, color: TEXT_SECONDARY, fontFamily: 'Volte' },

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
});
