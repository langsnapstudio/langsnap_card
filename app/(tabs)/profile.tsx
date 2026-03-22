import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';

const BRAND_PURPLE = '#7D69AB';
const BG_CREAM     = '#F8F5EF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';

const AVATAR_IMAGES: Record<string, any> = {
  dog:        require('@/assets/images/illustration-dog.png'),
  pineapple:  require('@/assets/images/illustration-pineapple.png'),
  bubble_tea: require('@/assets/images/illustration-bubble-tea.png'),
};
const AVATAR_COLORS: Record<string, string> = {
  dog: '#F5C842', fox: '#F5A342', panda: '#555555', elephant: '#B0CCDF',
  rabbit: '#E8E8E4', strawberry: '#F5C8C8', blueberry: '#9BB5E8',
  pineapple: '#4CAF50', corn: '#2E9E7A', burger: '#E53935',
  sushi: '#424242', pizza: '#26C6DA', bubble_tea: '#8D6E63', flower: '#F48FB1',
};
const AVATAR_EMOJI: Record<string, string> = {
  fox: '🦊', panda: '🐼', elephant: '🐘', rabbit: '🐰',
  strawberry: '🍓', blueberry: '🫐', corn: '🌽', burger: '🍔',
  sushi: '🍱', pizza: '🍕', flower: '🌸',
};

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();

  const avatarId    = profile?.avatar_id ?? 'dog';
  const avatarColor = AVATAR_COLORS[avatarId] ?? '#F5C842';
  const avatarImage = AVATAR_IMAGES[avatarId];
  const avatarEmoji = AVATAR_EMOJI[avatarId];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          {avatarImage ? (
            <Image source={avatarImage} style={styles.avatarImg} resizeMode="contain" />
          ) : (
            <Text style={styles.avatarEmoji}>{avatarEmoji ?? '🐶'}</Text>
          )}
        </View>

        <Text style={styles.name}>{profile?.display_name ?? '—'}</Text>
        <Text style={styles.username}>@{profile?.username ?? '—'}</Text>

        <View style={styles.divider} />

        {/* Language info */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Learning</Text>
          <Text style={styles.rowValue}>
            {profile?.target_language === 'taiwan'
              ? 'Mandarin Chinese (Taiwan) 🇹🇼'
              : 'Mandarin Chinese (Mainland) 🇨🇳'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Reading system</Text>
          <Text style={styles.rowValue}>
            {profile?.reading_system === 'zhuyin' ? 'Zhuyin (BoPoMoFo)' : 'Pinyin'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: BG_CREAM },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 48 },

  avatar: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, overflow: 'hidden',
  },
  avatarImg:   { width: 74, height: 74 },
  avatarEmoji: { fontSize: 42 },

  name:     { fontSize: 22, color: TEXT_DARK, fontFamily: 'Volte-Bold', marginBottom: 4 },
  username: { fontSize: 15, color: TEXT_MUTED, fontFamily: 'Volte-Medium', marginBottom: 32 },

  divider: { width: '100%', height: 1, backgroundColor: '#E8E5DF', marginVertical: 20 },

  row:       { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel:  { fontSize: 14, color: TEXT_MUTED, fontFamily: 'Volte' },
  rowValue:  { fontSize: 14, color: TEXT_DARK, fontFamily: 'Volte-Medium', flexShrink: 1, textAlign: 'right' },

  signOutBtn: {
    marginTop: 20, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E0DBF0',
  },
  signOutText: { fontSize: 15, color: BRAND_PURPLE, fontFamily: 'Volte-Semibold' },
});
