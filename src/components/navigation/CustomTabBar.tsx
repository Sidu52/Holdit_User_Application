import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.container}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          if (!isFocused) {
            navigation.navigate(route.name);
          }
        };

        const icon = route.name === "index" ? "home" : "search";

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[styles.tab, isFocused && styles.activeTab]}
          >
            <Ionicons
              name={icon}
              size={22}
              color={isFocused ? "#000" : "#999"}
            />
            <Text style={[styles.label, isFocused && styles.activeLabel]}>
              {options.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    borderTopEndRadius: 26,
    borderTopStartRadius: 26,
  },

  tab: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },

  activeTab: {
    backgroundColor: "#f4f4f4",
  },

  label: {
    fontSize: 11,
    marginTop: 2,
    color: "#999",
  },

  activeLabel: {
    color: "#000",
    fontWeight: "600",
  },
});
