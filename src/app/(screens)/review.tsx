import { THEME } from "@/theme/theme";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInUp,
  ScaleInCenter,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function ReviewScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const submitReview = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      // Wait a bit before going back
      setTimeout(() => {
        router.back();
      }, 2000);
    }, 1500);
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return "Terrible";
      case 2: return "Poor";
      case 3: return "Okay";
      case 4: return "Good";
      case 5: return "Excellent!";
      default: return "Tap a star to rate";
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <Animated.View entering={ScaleInCenter.springify()} style={styles.successContent}>
          <LinearGradient
            colors={["#10B981", "#059669"]}
            style={styles.successIconCircle}
          >
            <Ionicons name="checkmark" size={60} color="#FFF" />
          </LinearGradient>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successSubtitle}>
            Your feedback helps us improve the Holdit experience for everyone.
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={THEME.TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave a Review</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.headline}>How was your experience?</Text>
            <Text style={styles.subtitle}>
              Your feedback is invaluable. Please rate your overall service and luggage handling.
            </Text>
          </Animated.View>

          {/* RATING STARS */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.ratingSection}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star, idx) => (
                <StarButton 
                  key={star} 
                  active={star <= rating} 
                  onPress={() => setRating(star)}
                  index={idx}
                />
              ))}
            </View>
            <Text style={[styles.ratingLabel, rating > 0 && { color: THEME.PRIMARY }]}>
              {getRatingLabel(rating)}
            </Text>
          </Animated.View>

          {/* REVIEW INPUT */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.inputSection}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Additional Comments</Text>
              <Text style={styles.optionalText}>(Optional)</Text>
            </View>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Tell us what you loved or what we could improve..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={6}
                value={review}
                onChangeText={setReview}
                textAlignVertical="top"
              />
            </View>
          </Animated.View>

          {/* TIPS/GUIDE */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.tipsCard}>
             <Ionicons name="bulb" size={20} color={THEME.PRIMARY} />
             <Text style={styles.tipsText}>
               Think about the driver's punctuality, the store's helpfulness, and the safety of your items.
             </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtnOuter, rating === 0 && styles.submitBtnDisabled]}
          onPress={submitReview}
          disabled={rating === 0 || isSubmitting}
        >
          <LinearGradient
            colors={rating === 0 ? ["#94A3B8", "#64748B"] : [THEME.PRIMARY, THEME.SECONDARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Feedback</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const StarButton = ({ active, onPress, index }: { active: boolean; onPress: () => void; index: number }) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.4),
      withSpring(1)
    );
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={handlePress} 
        style={styles.starBtn}
      >
        <Ionicons
          name={active ? "star" : "star-outline"}
          size={48}
          color={active ? "#F59E0B" : "#CBD5E1"}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: THEME.TEXT_DARK },
  scrollContent: { padding: 24, paddingBottom: 150 },
  
  headline: {
    fontSize: 32,
    fontWeight: "900",
    color: THEME.TEXT_DARK,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.TEXT_MUTED,
    fontWeight: "500",
    lineHeight: 24,
    marginBottom: 40,
  },

  ratingSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  starBtn: {
    padding: 2,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#CBD5E1",
    letterSpacing: 0.5,
  },

  inputSection: {
    marginBottom: 24,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  optionalText: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    fontWeight: "600",
  },
  textAreaContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    minHeight: 180,
  },
  textInput: {
    fontSize: 16,
    color: THEME.TEXT_DARK,
    fontWeight: "600",
    height: "100%",
  },

  tipsCard: {
    flexDirection: "row",
    backgroundColor: `${THEME.PRIMARY}08`,
    padding: 20,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: `${THEME.PRIMARY}15`,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    lineHeight: 20,
    fontWeight: "500",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFF",
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 44 : 24,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 15 },
      android: { elevation: 16 },
    }),
  },
  submitBtnOuter: {
    borderRadius: 20,
    overflow: "hidden",
  },
  submitBtn: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: { color: "#FFF", fontSize: 18, fontWeight: "900" },

  successContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  successContent: {
    alignItems: "center",
  },
  successIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    ...Platform.select({
      ios: { shadowColor: "#10B981", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 8 },
    }),
  },
  successTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: THEME.TEXT_DARK,
    marginBottom: 16,
  },
  successSubtitle: {
    fontSize: 16,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
    lineHeight: 24,
  },
});
