import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';

const BRAND_PURPLE = '#7D69AB';
const BG_CREAM     = '#F8F5EF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#9097A3';

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
  bubbletea:   require('@/assets/images/avatar-bubbletea.png'),
  hotcocoa:    require('@/assets/images/avatar-hotcocoa.png'),
};

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();

  const avatarId    = profile?.avatar_id ?? 'dog';
  const avatarImage = AVATAR_IMAGES[avatarId];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarImage ? 'transparent' : '#F5C842' }]}>
          {avatarImage ? (
            <Image source={avatarImage} style={styles.avatarImg} resizeMode="cover" />
          ) : (
            <View style={{ width: 48, height: 48, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.35)' }} />
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
  avatarImg: { width: 96, height: 96 },

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
