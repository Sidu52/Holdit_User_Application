import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";

const Skeleton = ({ style }: { style?: any }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return <Animated.View style={[styles.base, style, { opacity }]} />;
};

export default Skeleton;

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#E5E7EB",
  },
});
