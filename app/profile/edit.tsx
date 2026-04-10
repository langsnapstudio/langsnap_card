import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const PURPLE_LIGHT = '#EDE9F5';
const BG_CREAM     = '#F8F5EF';
const WHITE        = '#FFFFFF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';
const BORDER       = '#E8E5DF';

// ── Avatar map ─────────────────────────────────────────────────────────────────
const AVATAR_IMAGES: Record<string, any> = {
  dog:         require('@/assets/images/avatar-dog.png'),
  cat:         require('@/assets/images/avatar-cat.png'),
  sheep:       require('@/assets/images/avatar-sheep.png'),
  elephant:    require('@/assets/images/avatar-elephant.png'),
  rabbit:      require('@/assets/images/avatar-rabbit.png'),
  watermelon:  require('@/assets/images/avatar-watermelon.png'),
  dragonfruit: require('@/assets/images/avatar-dragonfruit.png'),
  pineapple:   require('@/assets/images/avatar-pineapple.png'),
  corn:        require('@/assets/images/avatar-corn.png'),
  hamburger:   require('@/assets/images/avatar-hamburger.png'),
  sushi:       require('@/assets/images/avatar-sushi.png'),
  pizza:       require('@/assets/images/avatar-pizza.png'),
  streamedbun: require('@/assets/images/avatar-streamedbun.png'),
  bubbletea:   require('@/assets/images/avatar-bubbletea.png'),
  hotcocoa:    require('@/assets/images/avatar-hotcocoa.png'),
  beer:        require('@/assets/images/avatar-beer.png'),
};

type AvatarItem = { id: string; fallbackBg: string };

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

function AvatarCircle({ avatarId, size = 88 }: { avatarId: string; size?: number }) {
  const image = AVATAR_IMAGES[avatarId];
  const fallback = AVATARS.find(a => a.id === avatarId)?.fallbackBg ?? PURPLE_LIGHT;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      overflow: 'hidden', backgroundColor: image ? 'transparent' : fallback,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {image
        ? <Image source={image} style={{ width: size, height: size }} resizeMode="cover" />
        : <View style={{ width: size * 0.4, height: size * 0.4, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.35)' }} />
      }
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, user, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [avatarId,    setAvatarId]    = useState(profile?.avatar_id ?? 'dog');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSelectAvatar(item: AvatarItem) {
    setPickerVisible(false);
    if (item.id === avatarId || !user) return;
    setAvatarId(item.id);
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_id: item.id })
      .eq('id', user.id);
    if (!error) await refreshProfile();
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id);
    if (!error) await refreshProfile();
    setSaving(false);
    router.back();
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} hitSlop={12} style={styles.navBtn} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={BRAND_PURPLE} />
            : <Text style={styles.saveBtn}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={() => setPickerVisible(true)} activeOpacity={0.85}>
            <AvatarCircle avatarId={avatarId} size={96} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPickerVisible(true)} activeOpacity={0.7}>
            <Text style={styles.changeAvatarText}>Change avatar</Text>
          </TouchableOpacity>
        </View>

        {/* Fields */}
        <View style={styles.card}>

          {/* Name */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={TEXT_MUTED}
              autoCorrect={false}
            />
          </View>

          <View style={styles.divider} />

          {/* Username */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Username</Text>
            <Text style={styles.fieldReadOnly}>@{profile?.username ?? '—'}</Text>
          </View>

          <View style={styles.divider} />

          {/* Email */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldReadOnly}>{user?.email ?? '—'}</Text>
          </View>

        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Avatar picker bottom sheet */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <Pressable style={styles.overlay} onPress={() => setPickerVisible(false)} />
        <View style={styles.pickerSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.pickerTitle}>Change Avatar</Text>
          <FlatList
            data={AVATARS}
            keyExtractor={item => item.id}
            numColumns={4}
            contentContainerStyle={styles.pickerGrid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerCell, avatarId === item.id && styles.pickerCellSelected]}
                onPress={() => handleSelectAvatar(item)}
                activeOpacity={0.8}
              >
                <AvatarCircle avatarId={item.id} size={68} />
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
  root:          { flex: 1, backgroundColor: BG_CREAM },
  scrollContent: { paddingBottom: 16 },

  // Nav
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: BG_CREAM,
  },
  navBtn:   { width: 48 },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  saveBtn:  { fontSize: 15, fontFamily: 'Volte-Semibold', color: BRAND_PURPLE, textAlign: 'right' },

  // Avatar section
  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  changeAvatarText: { fontSize: 14, fontFamily: 'Volte-Semibold', color: BRAND_PURPLE },

  // Card + fields
  card: {
    backgroundColor: WHITE,
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, gap: 12,
  },
  fieldLabel:   { width: 80, fontSize: 15, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  fieldInput:   { flex: 1, fontSize: 15, fontFamily: 'Volte-Medium', color: TEXT_DARK },
  fieldReadOnly:{ flex: 1, fontSize: 15, fontFamily: 'Volte-Medium', color: TEXT_MUTED },
  divider:      { height: 1, backgroundColor: BORDER },

  // Avatar picker
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
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
  pickerGrid:         { paddingHorizontal: 12, paddingBottom: 8 },
  pickerCell:         { flex: 1, alignItems: 'center', paddingVertical: 8 },
  pickerCellSelected: { backgroundColor: 'rgba(125,105,171,0.12)', borderRadius: 16 },
});
