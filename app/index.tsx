import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const BRAND_PURPLE = '#7D69AB';

function navigateToSignIn() {
  router.replace('/sign-in');
}

export default function SplashScreen() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.72);
  const translateY = useSharedValue(12);

  useEffect(() => {
    // Cards snap into position
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withSpring(1, { damping: 10, stiffness: 80, mass: 0.8 });
    translateY.value = withSpring(0, { damping: 10, stiffness: 80, mass: 0.8 });

    // Fade out then navigate after 2.4s
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 380 }, (finished) => {
        if (finished) runOnJS(navigateToSignIn)();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={logoStyle}>
        <Image
          source={require('@/assets/images/logo-inverted.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 145,
  },
});
