import React from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { THEME } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

interface BackgroundGradientProps {
  children: React.ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
  bottomColor?: string;
}

const BackgroundGradient = ({
  children,
  primaryColor = THEME.PRIMARY,
  secondaryColor = THEME.SECOUNDARY,
  bottomColor = THEME.LIGHT_BACKGROUND,
}: BackgroundGradientProps) => {
  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <LinearGradient
        colors={[primaryColor, secondaryColor, bottomColor]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <BlurView
        intensity={Platform.OS === "ios" ? 20 : 10}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

export default BackgroundGradient;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: THEME.PRIMARY,
    borderEndEndRadius: 30,
    borderStartEndRadius: 30,
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
});
