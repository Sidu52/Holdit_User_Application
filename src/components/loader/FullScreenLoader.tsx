import React from "react";
import { View, StyleSheet } from "react-native";
import SkeletonLoader from "./SkeletonLoader";
import LuggageLoader from "./LuggageLoader";
import { StatusBar } from "expo-status-bar";

const FullScreenLoader = () => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SkeletonLoader />
      <LuggageLoader />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffffff",
  },
});

export default FullScreenLoader;