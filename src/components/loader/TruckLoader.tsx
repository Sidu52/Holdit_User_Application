import React from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { THEME } from "@/theme/theme";

const TruckLoader = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={THEME.PRIMARY || "#0000ff"} />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
});

export default TruckLoader;
