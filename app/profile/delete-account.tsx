import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';

// ── Constants ──────────────────────────────────────────────────────────────────
const BG_CREAM  = '#F8F5EF';
const WHITE     = '#FFFFFF';
const TEXT_DARK = '#262626';
const TEXT_MUTED= '#525252';
const RED       = '#EF4444';
const RED_LIGHT = '#FEF2F2';
const BORDER    = '#E8E5DF';

// ── What gets deleted ──────────────────────────────────────────────────────────
const DELETION_ITEMS = [
  { icon: '👤', text: 'Your profile, username, and avatar' },
  { icon: '📚', text: 'All word progress and SRS data' },
  { icon: '🔥', text: 'Your streak and energy history' },
  { icon: '👥', text: 'All followers and following relationships' },
  { icon: '👑', text: 'Active subscription (no refund)' },
];

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function DeleteAccountScreen() {
  const router  = useRouter();
  const { signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);

  function handleDelete() {
    Alert.alert(
      'Delete my account',
      'This will deactivate your account immediately. You have 30 days to recover it by contacting support.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            // In production: call API to deactivate account before signing out.
            // For now, sign out to simulate deactivation.
            await signOut();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Delete Account</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* Warning icon */}
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="warning" size={36} color={RED} />
          </View>
        </View>

        <Text style={styles.heading}>Are you sure you want to delete your account?</Text>
        <Text style={styles.subheading}>
          The following will be permanently deleted after 30 days:
        </Text>

        {/* Deletion list */}
        <View style={styles.listCard}>
          {DELETION_ITEMS.map((item, i) => (
            <View key={i} style={[styles.listRow, i < DELETION_ITEMS.length - 1 && styles.listRowBorder]}>
              <Text style={styles.listIcon}>{item.icon}</Text>
              <Text style={styles.listText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* 30-day recovery notice */}
        <View style={styles.recoveryCard}>
          <Ionicons name="time-outline" size={18} color={TEXT_MUTED} style={{ marginTop: 1 }} />
          <Text style={styles.recoveryText}>
            {'Your account is deactivated immediately and hidden from other users. You have '}
            <Text style={styles.recoveryBold}>30 days to recover it</Text>
            {' by contacting support at support@langsnap.app. After 30 days, all data is permanently deleted.'}
          </Text>
        </View>

      </ScrollView>

      {/* Delete button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
          onPress={handleDelete}
          activeOpacity={0.85}
          disabled={deleting}
        >
          {deleting
            ? <ActivityIndicator color={WHITE} />
            : <Text style={styles.deleteBtnText}>Delete my account</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          disabled={deleting}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_CREAM },

  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn:    { width: 32 },
  navTitle:   { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  navSpacer:  { width: 32 },

  content: { paddingHorizontal: 20, paddingBottom: 24 },

  iconWrap:   { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: RED_LIGHT,
    alignItems: 'center', justifyContent: 'center',
  },

  heading: {
    fontSize: 22, fontFamily: 'Volte-Semibold', color: TEXT_DARK,
    textAlign: 'center', lineHeight: 30, marginBottom: 12,
  },
  subheading: {
    fontSize: 14, fontFamily: 'Volte-Medium', color: TEXT_MUTED,
    textAlign: 'center', marginBottom: 20,
  },

  listCard: {
    backgroundColor: WHITE, borderRadius: 16,
    paddingHorizontal: 16, marginBottom: 16,
  },
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14,
  },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  listIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  listText: { flex: 1, fontSize: 14, fontFamily: 'Volte-Medium', color: TEXT_DARK },

  recoveryCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: WHITE, borderRadius: 14, padding: 14,
  },
  recoveryText: {
    flex: 1, fontSize: 13, fontFamily: 'Volte-Medium',
    color: TEXT_MUTED, lineHeight: 20,
  },
  recoveryBold: { fontFamily: 'Volte-Semibold', color: TEXT_DARK },

  footer: { paddingHorizontal: 20, paddingBottom: 8, gap: 10 },
  deleteBtn: {
    height: 52, borderRadius: 14,
    backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnDisabled: { opacity: 0.6 },
  deleteBtnText: { fontSize: 16, fontFamily: 'Volte-Semibold', color: WHITE },
  cancelBtn: {
    height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 15, fontFamily: 'Volte-Medium', color: TEXT_MUTED },
});
