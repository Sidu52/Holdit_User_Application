import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

type OfferBannerProps = {
  tag?: string;
  title: string;
  description: string;
  couponCode?: string;
  buttonText?: string;
  onPress?: () => void;
};

export const OfferBanner: React.FC<OfferBannerProps> = ({
  tag = "New offer",
  title,
  description,
  couponCode,
  buttonText,
  onPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Glow */}
      <View style={styles.glow} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.tag}>{tag}</Text>

        <Text style={styles.title}>{title}</Text>

        <Text style={styles.description}>
          {description}{" "}
          {couponCode && <Text style={styles.coupon}>{couponCode}</Text>}
        </Text>

        {buttonText && onPress && (
          <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Icon Placeholder */}
      <Text style={styles.icon}>🧳</Text>
    </View>
  );
};

const PRIMARY = "#FACC15"; // Tailwind primary equivalent
const DARK = "#1c190d";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f172a",
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
    minHeight: 180,
    marginBottom: 16,
  },

  content: {
    zIndex: 10,
    maxWidth: width * 0.75,
  },

  tag: {
    alignSelf: "flex-start",
    backgroundColor: PRIMARY,
    color: DARK,
    fontSize: 10,
    fontWeight: "800",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 28,
    marginBottom: 6,
  },

  description: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 16,
  },

  coupon: {
    color: PRIMARY,
    fontWeight: "700",
    letterSpacing: 2,
  },

  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  buttonText: {
    color: DARK,
    fontWeight: "800",
    fontSize: 14,
  },

  glow: {
    position: "absolute",
    right: -40,
    bottom: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: PRIMARY,
    opacity: 0.12,
  },

  icon: {
    position: "absolute",
    top: 10,
    right: 10,
    fontSize: 70,
    opacity: 0.2,
  },
});
