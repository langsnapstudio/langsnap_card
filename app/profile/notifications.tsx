import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// ── Constants ──────────────────────────────────────────────────────────────────
const BRAND_PURPLE = '#7D69AB';
const BG_CREAM     = '#F8F5EF';
const WHITE        = '#FFFFFF';
const TEXT_DARK    = '#262626';
const TEXT_MUTED   = '#525252';
const BORDER       = '#E8E5DF';

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${period}`;
}

const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

// ── Time Picker Sheet ──────────────────────────────────────────────────────────
function TimePickerSheet({ visible, hour, minute, onConfirm, onClose }: {
  visible: boolean;
  hour: number;
  minute: number;
  onConfirm: (h: number, m: number) => void;
  onClose: () => void;
}) {
  const [selHour,   setSelHour]   = useState(hour);
  const [selMinute, setSelMinute] = useState(minute);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSelHour(hour);
      setSelMinute(minute);
      slideAnim.setValue(400);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 400, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', opacity: fadeAnim }]} />
      </TouchableOpacity>

      <Animated.View style={[tpStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={tpStyles.handle} />
        <View style={tpStyles.header}>
          <Text style={tpStyles.title}>Reminder time</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={TEXT_MUTED} />
          </TouchableOpacity>
        </View>

        <View style={tpStyles.pickerRow}>
          {/* Hour column */}
          <View style={tpStyles.pickerCol}>
            <Text style={tpStyles.colLabel}>Hour</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {HOURS.map(h => (
                <TouchableOpacity
                  key={h}
                  style={[tpStyles.item, selHour === h && tpStyles.itemSelected]}
                  onPress={() => setSelHour(h)}
                  activeOpacity={0.7}
                >
                  <Text style={[tpStyles.itemText, selHour === h && tpStyles.itemTextSelected]}>
                    {h % 12 === 0 ? 12 : h % 12} {h >= 12 ? 'PM' : 'AM'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={tpStyles.separator} />

          {/* Minute column */}
          <View style={tpStyles.pickerCol}>
            <Text style={tpStyles.colLabel}>Minute</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {MINUTES.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[tpStyles.item, selMinute === m && tpStyles.itemSelected]}
                  onPress={() => setSelMinute(m)}
                  activeOpacity={0.7}
                >
                  <Text style={[tpStyles.itemText, selMinute === m && tpStyles.itemTextSelected]}>
                    :{m.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={tpStyles.preview}>
          <Text style={tpStyles.previewText}>{formatTime(selHour, selMinute)}</Text>
        </View>

        <TouchableOpacity
          style={tpStyles.confirmBtn}
          activeOpacity={0.85}
          onPress={() => onConfirm(selHour, selMinute)}
        >
          <Text style={tpStyles.confirmText}>Set reminder</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </Animated.View>
    </Modal>
  );
}

// ── Setting Row ────────────────────────────────────────────────────────────────
function SettingRow({ icon, label, value, onValueChange }: {
  icon: string;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: BORDER, true: BRAND_PURPLE }}
        thumbColor={WHITE}
      />
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();

  const [reminder,       setReminder]       = useState(false);
  const [reminderTime,   setReminderTime]   = useState({ hour: 20, minute: 0 });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [freezeNotif,    setFreezeNotif]    = useState(true);
  const [followerNotif,  setFollowerNotif]  = useState(true);
  const [milestoneNotif, setMilestoneNotif] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Notifications</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Reminders */}
        <Text style={styles.sectionHeader}>Reminders</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🔔"
            label="Practice reminder"
            value={reminder}
            onValueChange={setReminder}
          />
          {reminder && (
            <TouchableOpacity
              style={styles.timeRow}
              activeOpacity={0.7}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.timeLabel}>Daily reminder time</Text>
              <View style={styles.timeValue}>
                <Text style={styles.timeValueText}>
                  {formatTime(reminderTime.hour, reminderTime.minute)}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={TEXT_MUTED} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Activity */}
        <Text style={styles.sectionHeader}>Activity</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🧊"
            label="Streak freeze alert"
            value={freezeNotif}
            onValueChange={setFreezeNotif}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="👥"
            label="New follower"
            value={followerNotif}
            onValueChange={setFollowerNotif}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="🏆"
            label="Friend milestones"
            value={milestoneNotif}
            onValueChange={setMilestoneNotif}
          />
        </View>
        <Text style={styles.hint}>
          Friend milestones notify you when a friend hits a 7-day streak, 30-day streak, or learns 50 words.
        </Text>

      </ScrollView>

      <TimePickerSheet
        visible={showTimePicker}
        hour={reminderTime.hour}
        minute={reminderTime.minute}
        onConfirm={(h, m) => { setReminderTime({ hour: h, minute: m }); setShowTimePicker(false); }}
        onClose={() => setShowTimePicker(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_CREAM },

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn:  { width: 36 },
  navTitle: { fontSize: 17, fontFamily: 'Volte-Semibold', color: TEXT_DARK },

  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },

  sectionHeader: {
    fontSize: 13, fontFamily: 'Volte-Semibold',
    color: TEXT_MUTED, textTransform: 'uppercase',
    letterSpacing: 0.6, marginTop: 24, marginBottom: 10, marginLeft: 4,
  },

  card: {
    backgroundColor: WHITE, borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 14,
  },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  settingIcon:  { fontSize: 20, width: 28, textAlign: 'center' },
  settingLabel: { flex: 1, fontSize: 15, fontFamily: 'Volte-Medium', color: TEXT_DARK },

  divider: { height: 1, backgroundColor: BORDER, marginVertical: 14 },

  timeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingLeft: 40, paddingTop: 18, paddingBottom: 4,
  },
  timeLabel:     { fontSize: 13, fontFamily: 'Volte-Medium', color: TEXT_MUTED },
  timeValue:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeValueText: { fontSize: 13, fontFamily: 'Volte-Semibold', color: BRAND_PURPLE },

  hint: {
    fontSize: 12, fontFamily: 'Volte-Medium', color: TEXT_MUTED,
    lineHeight: 18, marginTop: 10, marginHorizontal: 4,
  },
});

// ── Time picker styles ─────────────────────────────────────────────────────────
const tpStyles = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: BORDER, alignSelf: 'center', marginBottom: 20,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  title:         { fontSize: 18, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  pickerRow:     { flexDirection: 'row', gap: 16, height: 200 },
  pickerCol:     { flex: 1 },
  colLabel: {
    fontSize: 12, fontFamily: 'Volte-Semibold', color: TEXT_MUTED,
    textAlign: 'center', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  item:             { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  itemSelected:     { backgroundColor: '#EDE9F5' },
  itemText:         { fontSize: 15, fontFamily: 'Volte-Medium', color: TEXT_MUTED, textAlign: 'center' },
  itemTextSelected: { fontFamily: 'Volte-Semibold', color: BRAND_PURPLE },
  separator:        { width: 1, backgroundColor: BORDER, marginVertical: 28 },
  preview: {
    alignItems: 'center', paddingVertical: 16,
    borderTopWidth: 1, borderColor: BORDER, marginTop: 12,
  },
  previewText: { fontSize: 28, fontFamily: 'Volte-Semibold', color: TEXT_DARK },
  confirmBtn: {
    backgroundColor: BRAND_PURPLE, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 12,
  },
  confirmText: { fontSize: 16, fontFamily: 'Volte-Semibold', color: WHITE },
});
