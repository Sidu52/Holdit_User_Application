import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/theme/theme";
import { useRouter } from "expo-router";

interface ComingSoonBannerProps {
  onPressChangeLocation?: () => void;
}

export const ComingSoonBanner = ({ onPressChangeLocation }: ComingSoonBannerProps) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPressChangeLocation) {
      onPressChangeLocation();
    } else {
      router.push("/addresses");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}><Text style={{ color: THEME.PRIMARY_DARK }}>We're</Text> coming</Text>
          <Text style={styles.title}>Soon!</Text>
          <Text style={styles.description}>
            Holdit isn't serviceable in your current area yet. We're expanding fast!
          </Text>
          <TouchableOpacity style={styles.linkButton} onPress={handlePress}>
            <Text style={styles.linkText}>Try a different location</Text>
            <Ionicons name="arrow-forward" size={14} color={THEME.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginHorizontal: 20,
    // marginBottom: 20,
    // borderRadius: 20,
    // overflow: "hidden",
    // borderWidth: 1,
    // borderColor: "#FEF3C7",
    // elevation: 2,
    // shadowColor: "#D97706",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.1,
    // shadowRadius: 10,
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  textContainer: {
    flex: 1,
    alignItems: "center",
    textAlign: "center",
  },
  title: {
    fontSize: 38,
    fontWeight: "800",
    color: "#ffffffff",
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    color: "#ffffffff",
    marginBottom: 12,
    alignItems: "center",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 20,
  },
  linkText: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.PRIMARY,
  },
});
