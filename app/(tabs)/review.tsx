import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BG_CREAM  = '#F8F5EF';
const TEXT_DARK = '#262626';
const TEXT_MUTED = '#9097A3';

export default function ReviewScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Review</Text>
        <Text style={styles.sub}>Your review sessions will appear here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: BG_CREAM },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title:     { fontSize: 24, color: TEXT_DARK, fontFamily: 'Volte-Bold', marginBottom: 8 },
  sub:       { fontSize: 15, color: TEXT_MUTED, fontFamily: 'Volte', textAlign: 'center' },
});
