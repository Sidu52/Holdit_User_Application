import { THEME } from "@/constants/theme";
import { useUser } from "@/features/user/user.queries";
import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  Easing,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SplashProps {
  onFinish: () => void;
}

const TEXT_CONTENT = "HOLDIT";
const { width } = Dimensions.get("window");

const SplashScreen: React.FC<SplashProps> = ({ onFinish }) => {
  // Animation Value for the Container
  const containerScale = useRef(new Animated.Value(1)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  // Animation Values for the Line
  const lineScaleX = useRef(new Animated.Value(0)).current;

  // Create an array of Animated Values for each letter (for staggered effect)
  const letterAnimations = useRef(
    TEXT_CONTENT.split("").map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    startAnimationSequence();
  }, []);

  const startAnimationSequence = () => {
    // Letters slide up (TranslateY) and fade in (Opacity)
    const letterEntrance = letterAnimations.map((anim) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)), // Slight bounce effect
      }),
    );

    Animated.sequence([
      // Wait a tiny bit
      Animated.delay(200),

      // Animate letters in one by one
      Animated.stagger(100, letterEntrance),

      // Expand the Red Accent Line
      Animated.timing(lineScaleX, {
        toValue: 1,
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Cubic bezier for smooth motion
        useNativeDriver: true,
      }),

      // Hold for a moment (Branding moment)
      Animated.delay(800),

      // Exit Animation (Zoom whole screen towards camera)
      Animated.parallel([
        Animated.timing(containerScale, {
          toValue: 1.5,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // NAVIGATE TO HOME SCREEN HERE
      onFinish();
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />

      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: containerOpacity,
            transform: [{ scale: containerScale }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.textRow}>
            {TEXT_CONTENT.split("").map((char, index) => {
              // Interpolate values for individual letter animations
              const translateY = letterAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0], // Move from bottom 50px to 0
              });

              const opacity = letterAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              });

              const scale = letterAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              });

              return (
                <Animated.Text
                  key={`${char}-${index}`}
                  style={[
                    styles.textChar,
                    {
                      opacity,
                      transform: [{ translateY }, { scale }],
                    },
                  ]}
                >
                  {char}
                </Animated.Text>
              );
            })}
          </View>

          {/* The Red Accent Line */}
          <Animated.View
            style={[
              styles.accentLine,
              {
                transform: [{ scaleX: lineScaleX }],
              },
            ]}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.PRIMARY,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.PRIMARY,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 150, // Fixed height to contain animation
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingBottom: 5,
  },
  textChar: {
    color: THEME.TEXT_PRIMARY,
    fontFamily: "Audiowide_400Regular",
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 4,
    includeFontPadding: false,
  },
  accentLine: {
    height: 4,
    width: width * 0.4,
    backgroundColor: THEME.PRIMARY_LIGHTER,
    marginTop: 10,
    borderRadius: 2,
    shadowColor: THEME.PRIMARY_LIGHTER,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default SplashScreen;
