import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const WARM_BG = '#F2EDE4';
const BLACK_TEXT = '#1A1A1A';
const GOLD_BRAND = '#D99A3D';
const DARK_ARC = '#241B15';

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  // Shared Values for animations
  const spinnerRotation = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(16);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    // Hide static native splash screen
    SplashScreen.hideAsync().catch(() => {});

    // Continuous 360-degree rotation for the circular loader ring
    spinnerRotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );

    // Fade in text
    textOpacity.value = withDelay(150, withTiming(1, { duration: 400 }));
    textTranslateY.value = withDelay(150, withSpring(0, { damping: 15 }));

    // Fade out splash overlay after ~1.5 seconds to reveal app
    overlayOpacity.value = withDelay(
      1500,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) {
          runOnJS(setVisible)(false);
        }
      })
    );
  }, []);

  const spinnerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.splashOverlay, overlayAnimatedStyle]} pointerEvents="none">
      <View style={styles.centerContainer}>
        {/* Clean Circular Loader Ring (Logo removed from inside) */}
        <View style={styles.loaderRingWrapper}>
          <Animated.View style={[styles.spinnerArc, spinnerAnimatedStyle]} />
        </View>

        {/* Clean Brand Text: bizreels */}
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.brandTitleText}>
            biz<Text style={styles.brandTitleGold}>reels</Text>
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Image source={require('@/assets/icon.png')} style={styles.logoImageSmall} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: WARM_BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  loaderRingWrapper: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerArc: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'rgba(217, 154, 61, 0.2)',
    borderTopColor: GOLD_BRAND,
    borderRightColor: DARK_ARC,
  },
  textContainer: {
    alignItems: 'center',
  },
  brandTitleText: {
    color: BLACK_TEXT,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'lowercase',
  },
  brandTitleGold: {
    color: GOLD_BRAND,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: 64,
  },
  logoImageSmall: {
    width: 48,
    height: 48,
  },
});
