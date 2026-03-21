import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND_PURPLE = '#7D69AB';
const BG_CREAM = '#F8F5EF';
const TEXT_DARK = '#262626';
const GOOGLE_BTN_BORDER = '#CFD4DC';
const GOOGLE_BTN_TEXT = '#344054';

export default function SignInScreen() {
  function handleGoogleSignIn() {
    // TODO: implement Google SSO
  }

  function handleAppleSignIn() {
    // TODO: implement Apple SSO
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header: logo + title */}
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.appName}>Langsnap</Text>
      </View>

      {/* Flashcard stack illustration */}
      <View style={styles.cardStack}>
        {/* Back card (20% opacity) */}
        <View style={[styles.card, styles.cardBack]} />
        {/* Mid card (60% opacity) */}
        <View style={[styles.card, styles.cardMid]} />
        {/* Front card (100%) */}
        <View style={[styles.card, styles.cardFront]}>
          <Image
            source={require('@/assets/images/illustration-dog.png')}
            style={styles.dogIllustration}
            resizeMode="contain"
          />
          <Text style={styles.chineseChar}>狗</Text>
        </View>
      </View>

      {/* Headline */}
      <Text style={styles.headline}>
        {'Learn Chinese\nthrough 500+ illustrated flashcard'}
      </Text>

      {/* Sign-in buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-google" size={22} color="#EA4335" />
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.appleButton}
          onPress={handleAppleSignIn}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
          <Text style={styles.appleButtonText}>Sign in with Apple</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_CREAM,
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginTop: 24,
  },
  logoImage: {
    width: 64,
    height: 64,
  },
  welcomeText: {
    marginTop: 4,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: TEXT_DARK,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  appName: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '600',
    color: BRAND_PURPLE,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },

  // ── Flashcard stack ────────────────────────────────────────────────────────
  cardStack: {
    marginTop: 52,
    width: 120,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    borderRadius: 16,
    backgroundColor: BRAND_PURPLE,
  },
  cardBack: {
    width: 98,
    height: 118,
    opacity: 0.2,
    top: 0,
    // offset right slightly to create depth
    transform: [{ translateX: 4 }],
  },
  cardMid: {
    width: 112,
    height: 134,
    opacity: 0.6,
    top: 0,
    transform: [{ translateX: 0 }],
  },
  cardFront: {
    width: 120,
    height: 144,
    opacity: 1,
    top: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dogIllustration: {
    width: 64,
    height: 58,
  },
  chineseChar: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'PingFang TC' : 'sans-serif',
  },

  // ── Headline ───────────────────────────────────────────────────────────────
  headline: {
    marginTop: 52,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: TEXT_DARK,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },

  // ── Buttons ────────────────────────────────────────────────────────────────
  buttonsContainer: {
    marginTop: 'auto',
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: 280,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOOGLE_BTN_BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  googleButtonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: GOOGLE_BTN_TEXT,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: 280,
    height: 44,
    backgroundColor: '#000000',
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  appleButtonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
