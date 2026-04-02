// ─── app/booking/extend.tsx ───────────────────────────────────────────────────

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { THEME } from "@/theme/theme";
import { showError, showSuccess } from "@/utils/toast";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";

const { width } = Dimensions.get("window");
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ─── TYPES ────────────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
type ExtensionType = "hours" | "days";

interface ExtensionOption {
  id: string;
  duration: number;
  type: ExtensionType;
  label: string;
  sublabel: string;
  pricePerBag: number;
  popular?: boolean;
  savings?: string;
}

interface BookingSummary {
  id: string;
  storeName: string;
  bagCount: number;
  currentEndTime: string;
  currentEndDate: string;
  originalRate: number;
  rateType: "hourly" | "daily";
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// TODO: Replace with real API hooks when backend is ready

const MOCK_BOOKING_SUMMARY: BookingSummary = {
  id: "HLD-8392",
  storeName: "LuggageHero JFK T4",
  bagCount: 3,
  currentEndTime: "6:00 PM",
  currentEndDate: "Today, Jan 15",
  originalRate: 8.95,
  rateType: "daily",
};

const EXTENSION_OPTIONS: ExtensionOption[] = [
  {
    id: "ext-1h",
    duration: 1,
    type: "hours",
    label: "1 Hour",
    sublabel: "Quick extension",
    pricePerBag: 1.5,
  },
  {
    id: "ext-2h",
    duration: 2,
    type: "hours",
    label: "2 Hours",
    sublabel: "Short delay",
    pricePerBag: 2.75,
    savings: "Save 8%",
  },
  {
    id: "ext-4h",
    duration: 4,
    type: "hours",
    label: "4 Hours",
    sublabel: "Half-day extension",
    pricePerBag: 5.0,
    popular: true,
    savings: "Save 17%",
  },
  {
    id: "ext-1d",
    duration: 1,
    type: "days",
    label: "1 Day",
    sublabel: "Full day extension",
    pricePerBag: 7.95,
    savings: "Save 11%",
  },
  {
    id: "ext-2d",
    duration: 2,
    type: "days",
    label: "2 Days",
    sublabel: "Weekend extension",
    pricePerBag: 14.95,
    savings: "Save 16%",
  },
  {
    id: "ext-7d",
    duration: 7,
    type: "days",
    label: "1 Week",
    sublabel: "Extended storage",
    pricePerBag: 44.95,
    savings: "Save 28%",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const calculateNewEndTime = (
  currentTime: string,
  duration: number,
  type: ExtensionType
): string => {
  // TODO: Replace with proper date calculation using actual timestamps
  if (type === "hours") {
    const hourMatch = currentTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!hourMatch) return currentTime;

    let hour = parseInt(hourMatch[1], 10);
    const minute = hourMatch[2];
    const period = hourMatch[3].toUpperCase();

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    hour = (hour + duration) % 24;
    const newPeriod = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute} ${newPeriod}`;
  }

  // For days, just show "+ N days"
  return `${currentTime} + ${duration} day${duration > 1 ? "s" : ""}`;
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function ExtendBookingScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Validate route param
  if (!bookingId) {
    if (__DEV__) {
      console.warn("Booking ID missing from extend screen params");
    }
    router.back();
    return null;
  }

  // TODO: Replace with real API hook
  // const { data: bookingSummary, isLoading } = useBookingSummary(bookingId);
  const bookingSummary = MOCK_BOOKING_SUMMARY;
  const isLoading = false;

  const selectedExtension = useMemo(
    () => EXTENSION_OPTIONS.find((opt) => opt.id === selectedOption) ?? null,
    [selectedOption]
  );

  const extensionCost = useMemo(() => {
    if (!selectedExtension) return 0;
    return selectedExtension.pricePerBag * bookingSummary.bagCount;
  }, [selectedExtension, bookingSummary.bagCount]);

  const newEndTime = useMemo(() => {
    if (!selectedExtension) return bookingSummary.currentEndTime;
    return calculateNewEndTime(
      bookingSummary.currentEndTime,
      selectedExtension.duration,
      selectedExtension.type
    );
  }, [selectedExtension, bookingSummary.currentEndTime]);

  const handleConfirmExtend = useCallback(() => {
    if (!selectedExtension || isProcessing) return;
    setShowConfirmModal(true);
  }, [selectedExtension, isProcessing]);

  const onConfirmExtension = useCallback(async () => {
    if (!selectedExtension) return;
    setIsProcessing(true);
    try {
      // Simulate API call (TODO: Replace with actual mutation)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      showSuccess(
        `Your booking has been extended by ${selectedExtension.label}. New pickup: ${newEndTime}`,
        "Storage Extended! ✅"
      );

      router.replace({
        pathname: "/booking/[id]",
        params: { id: bookingId },
      });
    } catch (err) {
      if (__DEV__) {
        console.error("Extend booking error:", err);
      }
      showError("We couldn't process your extension. Please try again or contact support.");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedExtension, newEndTime, bookingId, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.PRIMARY} />
        <Text style={styles.loadingText}>Loading booking...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Extend Storage</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── CURRENT BOOKING SUMMARY ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIconBg}>
                <Ionicons name="time" size={22} color={THEME.PRIMARY} />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryTitle}>Current Booking</Text>
                <Text style={styles.summaryBookingId}>
                  #{bookingSummary.id}
                </Text>
              </View>
              <View style={styles.summaryBagBadge}>
                <Text style={styles.summaryBagCount}>
                  {bookingSummary.bagCount}
                </Text>
                <Text style={styles.summaryBagLabel}>bags</Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryDetailsRow}>
              <View style={styles.summaryDetail}>
                <Ionicons
                  name="storefront-outline"
                  size={14}
                  color={THEME.TEXT_MUTED}
                />
                <Text style={styles.summaryDetailText} numberOfLines={1}>
                  {bookingSummary.storeName}
                </Text>
              </View>
              <View style={styles.summaryDetail}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={THEME.TEXT_MUTED}
                />
                <Text style={styles.summaryDetailText}>
                  {bookingSummary.currentEndDate}
                </Text>
              </View>
            </View>

            {/* Current End Time */}
            <View style={styles.currentTimeContainer}>
              <View style={styles.currentTimeRow}>
                <View>
                  <Text style={styles.currentTimeLabel}>CURRENT PICKUP</Text>
                  <Text style={styles.currentTimeValue}>
                    {bookingSummary.currentEndTime}
                  </Text>
                </View>

                {selectedExtension && (
                  <>
                    <View style={styles.timeArrow}>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={THEME.PRIMARY}
                      />
                    </View>
                    <View>
                      <Text style={styles.newTimeLabel}>NEW PICKUP</Text>
                      <Text style={styles.newTimeValue}>{newEndTime}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── EXTENSION OPTIONS ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={styles.sectionTitle}>Choose Extension Duration</Text>
          <Text style={styles.sectionSubtitle}>
            Select how long you'd like to extend your storage
          </Text>

          <View style={styles.optionsGrid}>
            {EXTENSION_OPTIONS.map((option, index) => (
              <Animated.View
                key={option.id}
                entering={FadeInRight.delay(250 + index * 60).springify()}
              >
                <ExtensionOptionCard
                  option={option}
                  bagCount={bookingSummary.bagCount}
                  isSelected={selectedOption === option.id}
                  onSelect={() => setSelectedOption(option.id)}
                />
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* ── PRICE BREAKDOWN ──────────────────────────────────────── */}
        {selectedExtension && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Price Breakdown</Text>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>
                  {selectedExtension.label} × {bookingSummary.bagCount} bag
                  {bookingSummary.bagCount > 1 ? "s" : ""}
                </Text>
                <Text style={styles.breakdownValue}>
                  ${(selectedExtension.pricePerBag * bookingSummary.bagCount).toFixed(2)}
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Rate per bag</Text>
                <Text style={styles.breakdownValueMuted}>
                  ${selectedExtension.pricePerBag.toFixed(2)}
                </Text>
              </View>

              {selectedExtension.savings && (
                <View style={styles.savingsRow}>
                  <Ionicons name="pricetag" size={14} color="#16a34a" />
                  <Text style={styles.savingsText}>
                    {selectedExtension.savings} compared to standard rate
                  </Text>
                </View>
              )}

              <View style={styles.breakdownDivider} />

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTotalLabel}>Total to Pay</Text>
                <Text style={styles.breakdownTotalValue}>
                  ${extensionCost.toFixed(2)}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── POLICIES ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={styles.policiesContainer}>
            <PolicyItem
              icon="shield-checkmark-outline"
              text="Same insurance coverage applies to extended period"
            />
            <PolicyItem
              icon="card-outline"
              text="Payment processed with your saved payment method"
            />
            <PolicyItem
              icon="refresh-outline"
              text="Extension can be further extended if needed"
            />
            <PolicyItem
              icon="close-circle-outline"
              text="No refund on extensions once confirmed"
            />
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── BOTTOM CTA ─────────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(300).springify()}
        style={styles.bottomBar}
      >
        <View style={styles.bottomBarContent}>
          {selectedExtension ? (
            <View style={styles.bottomPriceContainer}>
              <Text style={styles.bottomPriceLabel}>Extension Cost</Text>
              <Text style={styles.bottomPriceValue}>
                ${extensionCost.toFixed(2)}
              </Text>
            </View>
          ) : (
            <View style={styles.bottomPriceContainer}>
              <Text style={styles.bottomPriceLabel}>Select Duration</Text>
              <Text style={styles.bottomPriceHint}>
                Choose an option above
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!selectedOption || isProcessing) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmExtend}
            disabled={!selectedOption || isProcessing}
            accessibilityLabel={
              selectedExtension
                ? `Confirm extension for $${extensionCost.toFixed(2)}`
                : "Select an extension duration first"
            }
            accessibilityRole="button"
          >
            <LinearGradient
              colors={
                selectedOption && !isProcessing
                  ? [THEME.PRIMARY, THEME.SECONDARY]
                  : ["#9ca3af", "#9ca3af"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmButtonGradient}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="time-outline" size={18} color="#FFF" />
                  <Text style={styles.confirmButtonText}>Confirm & Pay</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {selectedExtension && (
        <ConfirmationModal
          visible={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={onConfirmExtension}
          title="Confirm Extension"
          message={`Extend storage by ${selectedExtension.label} for $${extensionCost.toFixed(2)}?\n\nNew end time: ${newEndTime}`}
          confirmLabel="Confirm & Pay"
          cancelLabel="Cancel"
          icon="time-outline"
        />
      )}
    </SafeAreaView>
  );
}

// ─── SUB COMPONENTS ───────────────────────────────────────────────────────────

const ExtensionOptionCard = ({
  option,
  bagCount,
  isSelected,
  onSelect,
}: {
  option: ExtensionOption;
  bagCount: number;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const scale = useSharedValue(1);
  const selected = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    selected.value = withTiming(isSelected ? 1 : 0, { duration: 200 });
  }, [isSelected, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: interpolateColor(
      selected.value,
      [0, 1],
      ["rgba(0,0,0,0.06)", THEME.PRIMARY]
    ),
    backgroundColor: interpolateColor(
      selected.value,
      [0, 1],
      ["#FFF", `${THEME.PRIMARY}06`]
    ),
  }));

  const totalCost = option.pricePerBag * bagCount;

  return (
    <AnimatedTouchable
      style={[styles.optionCard, animatedStyle]}
      onPress={onSelect}
      onPressIn={() => {
        scale.value = withSpring(0.97);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      activeOpacity={0.9}
      accessibilityLabel={`${option.label}: $${totalCost.toFixed(2)} total for ${bagCount} bags`}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
    >
      {/* Popular / Savings Badges */}
      <View style={styles.optionBadgeRow}>
        {option.popular && (
          <View style={styles.popularBadge}>
            <Ionicons name="star" size={10} color="#FFF" />
            <Text style={styles.popularBadgeText}>Popular</Text>
          </View>
        )}
        {option.savings && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsBadgeText}>{option.savings}</Text>
          </View>
        )}
      </View>

      <View style={styles.optionContent}>
        {/* Radio Circle */}
        <View
          style={[
            styles.radioCircle,
            isSelected && styles.radioCircleSelected,
          ]}
        >
          {isSelected && <View style={styles.radioInner} />}
        </View>

        {/* Option Info */}
        <View style={styles.optionInfo}>
          <Text
            style={[
              styles.optionLabel,
              isSelected && styles.optionLabelSelected,
            ]}
          >
            {option.label}
          </Text>
          <Text style={styles.optionSublabel}>{option.sublabel}</Text>
        </View>

        {/* Price */}
        <View style={styles.optionPriceContainer}>
          <Text
            style={[
              styles.optionPrice,
              isSelected && styles.optionPriceSelected,
            ]}
          >
            ${totalCost.toFixed(2)}
          </Text>
          <Text style={styles.optionPricePer}>
            ${option.pricePerBag.toFixed(2)}/bag
          </Text>
        </View>
      </View>
    </AnimatedTouchable>
  );
};

const PolicyItem = ({
  icon,
  text,
}: {
  icon: IoniconsName;
  text: string;
}) => (
  <View style={styles.policyItem}>
    <Ionicons name={icon} size={18} color={THEME.TEXT_MUTED} />
    <Text style={styles.policyText}>{text}</Text>
  </View>
);

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.BACKGROUND_LIGHT,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: THEME.TEXT_MUTED,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    textAlign: "center",
  },
  headerSpacer: {
    width: 38,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: `${THEME.PRIMARY}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  summaryBookingId: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    marginTop: 1,
  },
  summaryBagBadge: {
    alignItems: "center",
    backgroundColor: `${THEME.PRIMARY}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  summaryBagCount: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.PRIMARY,
  },
  summaryBagLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: THEME.TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 14,
  },
  summaryDetailsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 14,
  },
  summaryDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  summaryDetailText: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    fontWeight: "500",
    flex: 1,
  },

  // Current / New Time
  currentTimeContainer: {
    backgroundColor: THEME.BACKGROUND_LIGHT,
    borderRadius: 14,
    padding: 14,
  },
  currentTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  currentTimeLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: THEME.TEXT_MUTED,
    letterSpacing: 1,
    textAlign: "center",
  },
  currentTimeValue: {
    fontSize: 20,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
    textAlign: "center",
    marginTop: 2,
  },
  timeArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${THEME.PRIMARY}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  newTimeLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#16a34a",
    letterSpacing: 1,
    textAlign: "center",
  },
  newTimeValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#16a34a",
    textAlign: "center",
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    marginBottom: 16,
  },

  // Options Grid
  optionsGrid: {
    gap: 10,
    marginBottom: 24,
  },

  // Option Card
  optionCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    position: "relative",
    overflow: "hidden",
  },
  optionBadgeRow: {
    flexDirection: "row",
    position: "absolute",
    top: 0,
    right: 0,
    gap: 4,
  },
  popularBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    gap: 3,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  savingsBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  savingsBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#16a34a",
    letterSpacing: 0.3,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleSelected: {
    borderColor: THEME.PRIMARY,
    borderWidth: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.PRIMARY,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  optionLabelSelected: {
    color: THEME.PRIMARY,
  },
  optionSublabel: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    marginTop: 2,
  },
  optionPriceContainer: {
    alignItems: "flex-end",
  },
  optionPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  optionPriceSelected: {
    color: THEME.PRIMARY,
  },
  optionPricePer: {
    fontSize: 10,
    color: THEME.TEXT_MUTED,
    marginTop: 2,
  },

  // Breakdown Card
  breakdownCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  breakdownValueMuted: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
  },
  savingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16a34a",
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 10,
  },
  breakdownTotalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  breakdownTotalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: THEME.PRIMARY,
  },

  // Policies
  policiesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  policyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  policyText: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    flex: 1,
    lineHeight: 18,
  },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  bottomBarContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 16,
  },
  bottomPriceContainer: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: THEME.TEXT_MUTED,
    fontWeight: "500",
  },
  bottomPriceValue: {
    fontSize: 22,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
    marginTop: 2,
  },
  bottomPriceHint: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    marginTop: 2,
  },
  confirmButton: {
    flex: 1.2,
    borderRadius: 16,
    overflow: "hidden",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },

  bottomSpacer: {
    height: 40,
  },
});