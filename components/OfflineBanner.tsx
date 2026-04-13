import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG_CREAM    = '#F8F5EF';
const TEXT_DARK   = '#262626';
const TEXT_MUTED  = '#525252';
const BRAND_PURPLE = '#7D69AB';

type Props = { onRetry: () => void };

export default function NoInternetScreen({ onRetry }: Props) {
  const insets   = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRetry = async () => {
    setChecking(true);
    onRetry();
    // Show spinner briefly so it feels responsive
    setTimeout(() => setChecking(false), 1500);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
        { opacity: fadeAnim },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-offline-outline" size={48} color={TEXT_MUTED} />
        </View>

        <Text style={styles.title}>No internet connection</Text>
        <Text style={styles.body}>
          Check your Wi-Fi or mobile data and try again. Your progress is saved locally.
        </Text>

        <TouchableOpacity
          style={styles.retryBtn}
          activeOpacity={0.75}
          onPress={handleRetry}
          disabled={checking}
        >
          <Ionicons
            name={checking ? 'reload-outline' : 'refresh-outline'}
            size={16}
            color={BRAND_PURPLE}
          />
          <Text style={styles.retryText}>{checking ? 'Checking…' : 'Try again'}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG_CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEEBE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Volte-Semibold',
    color: TEXT_DARK,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    fontFamily: 'Volte-Medium',
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BRAND_PURPLE,
  },
  retryText: {
    fontSize: 15,
    fontFamily: 'Volte-Semibold',
    color: BRAND_PURPLE,
  },
});
