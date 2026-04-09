import React from "react";
import { View, StyleSheet } from "react-native";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import LinearGradient from "react-native-linear-gradient";

const SkeletonLoader = () => {
  return (
    <View style={styles.container}>
      <ShimmerPlaceholder
        LinearGradient={LinearGradient}
        style={styles.short}
      />
      <ShimmerPlaceholder
        LinearGradient={LinearGradient}
        style={styles.medium}
      />
      <ShimmerPlaceholder
        LinearGradient={LinearGradient}
        style={styles.long}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  short: {
    height: 10,
    width: "30%",
    borderRadius: 10,
    marginBottom: 15,
  },
  medium: {
    height: 12,
    width: "60%",
    borderRadius: 10,
    marginBottom: 15,
  },
  long: {
    height: 16,
    width: "90%",
    borderRadius: 12,
  },
});

export default SkeletonLoader;