import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Clipboard,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const PURPLE_LIGHT = '#EDE9F5';
const WHITE        = '#FFFFFF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#525252';
const BG_CREAM     = '#F8F5EF';
const BORDER       = '#E8E5DF';

type Props = {
  visible:   boolean;
  username:  string;
  onClose:   () => void;
};

export default function QRCodeModal({ visible, username, onClose }: Props) {
  const profileUrl = `https://langsnap.app/u/${username}`;

  // Slide-up animation
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function handleCopy() {
    Clipboard.setString(profileUrl);
    if (Platform.OS === 'android') {
      // Toast on Android handled by ToastAndroid if needed
    } else {
      Alert.alert('Copied!', 'Profile link copied to clipboard.');
    }
  }

  async function handleShare() {
    try {
      await Share.share({
        message: `Check out my Langsnap profile! ${profileUrl}`,
        url:     profileUrl,
      });
    } catch {}
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Share profile</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={TEXT_MUTED} />
          </TouchableOpacity>
        </View>

        {/* QR Code */}
        <View style={styles.qrWrap}>
          <View style={styles.qrCard}>
            <QRCode
              value={profileUrl}
              size={180}
              color={TEXT_DARK}
              backgroundColor={WHITE}
              logo={undefined}
            />
          </View>
          <Text style={styles.username}>@{username}</Text>
          <Text style={styles.profileUrl} numberOfLines={1}>{profileUrl}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={handleCopy}>
            <View style={styles.actionIcon}>
              <Ionicons name="link-outline" size={20} color={BRAND_PURPLE} />
            </View>
            <Text style={styles.actionLabel}>Copy link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={handleShare}>
            <View style={styles.actionIcon}>
              <Ionicons name="share-outline" size={20} color={BRAND_PURPLE} />
            </View>
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPad} />
      </Animated.View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },

  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: BORDER,
    alignSelf: 'center', marginBottom: 16,
  },

  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sheetTitle: { fontSize: 17, fontFamily: 'Volte-Semibold', color: TEXT_DARK },

  // QR
  qrWrap: { alignItems: 'center', gap: 12, marginBottom: 28 },
  qrCard: {
    padding: 20, borderRadius: 20,
    backgroundColor: WHITE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  username:   { fontSize: 18, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  profileUrl: { fontSize: 13, fontFamily: 'Volte-Medium', color: TEXT_MUTED },

  // Actions
  actions: {
    flexDirection: 'row', gap: 6,
  },
  actionBtn: {
    flex: 1, alignItems: 'center', gap: 8,
    backgroundColor: WHITE,
    borderRadius: 16, paddingVertical: 16,
  },
  actionIcon: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 14, fontFamily: 'Volte-Semibold', color: TEXT_DARK },

  bottomPad: { height: 36 },
});
