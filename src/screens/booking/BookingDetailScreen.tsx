import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Linking,
  Share,
  ActivityIndicator,
  RefreshControl,
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
  withRepeat,
  withSequence,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolation,
  cancelAnimation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { THEME } from "@/theme/theme";
import { useBookingDetail as useBooking, useCancelBooking } from "@/features/booking/booking.queries";
import { useStoreDetail } from "@/features/stores/stores.queries";
import { format } from "date-fns";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { useBookingTracking } from "@/hooks/useBookingTracking";

const { width } = Dimensions.get("window");
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// ─── TYPES ────────────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

type BookingStatus =
  | "confirmed"
  | "pickup_scheduled"
  | "picked_up"
  | "in_storage"
  | "delivery_scheduled"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled";

import { Booking, TimelineEntry } from "@/features/auth/authTypes";

interface BookingItem {
  id: string;
  type: "small" | "medium" | "large" | "special";
  label: string;
  description: string;
  tagId: string;
}

interface TrackingEvent {
  id: string;
  status: string;
  title: string;
  description: string;
  timestamp: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

// ──────── HELPERS ──────────────────────────────────────────────────────────────

const getStatusConfig = (
  status: string
): {
  label: string;
  color: string;
  bgColor: string;
  icon: IoniconsName;
  description: string;
} => {
  switch (status) {
    case "created":
    case "confirmed":
      return {
        label: "Confirmed",
        color: "#2563eb",
        bgColor: "#dbeafe",
        icon: "checkmark-circle",
        description: "Your booking is confirmed",
      };
    case "store_assigned":
      return {
        label: "Store Assigned",
        color: "#7c3aed",
        bgColor: "#ede9fe",
        icon: "business",
        description: "Store has been assigned",
      };
    case "driver_assigned":
    case "driver_arrived":
    case "pickup_scheduled":
      return {
        label: "Pickup Scheduled",
        color: "#7c3aed",
        bgColor: "#ede9fe",
        icon: "calendar",
        description: "Driver is on the way",
      };
    case "picked_up":
      return {
        label: "Items Received",
        color: "#0891b2",
        bgColor: "#cffafe",
        icon: "cube",
        description: "Driver has your items",
      };
    case "at_store":
    case "in_storage":
    case "stored":
      return {
        label: "Stored",
        color: "#16a34a",
        bgColor: "#dcfce7",
        icon: "shield-checkmark",
        description: "Items are securely stored",
      };
    case "completed":
      return {
        label: "Completed",
        color: "#6b7280",
        bgColor: "#f3f4f6",
        icon: "checkmark-done",
        description: "Booking complete",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        color: "#ef4444",
        bgColor: "#fee2e2",
        icon: "close-circle",
        description: "Booking has been cancelled",
      };
    case "no_driver_available":
      return {
        label: "No Driver Available",
        color: "#ef4444",
        bgColor: "#fee2e2",
        icon: "alert-circle",
        description: "Unable to find a driver for your return request. Please contact support.",
      };
    default:
      return {
        label: status.replace("_", " ").toUpperCase(),
        color: "#6b7280",
        bgColor: "#f3f4f6",
        icon: "help-circle",
        description: "",
      };
  }
};

const getItemIcon = (type: BookingItem["type"]): IoniconsName => {
  switch (type) {
    case "small":
      return "bag-handle-outline";
    case "medium":
      return "briefcase-outline";
    case "large":
      return "cube-outline";
    case "special":
      return "diamond-outline";
    default:
      return "cube-outline";
  }
};

const getItemColor = (type: BookingItem["type"]): string => {
  switch (type) {
    case "small":
      return "#0891b2";
    case "medium":
      return "#2563eb";
    case "large":
      return "#7c3aed";
    case "special":
      return "#ea580c";
    default:
      return THEME.TEXT_MUTED;
  }
};



// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollY = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullTracking, setShowFullTracking] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const cancelBooking = useCancelBooking();

  // Validate route param
  if (!id || id === "undefined" || id === "null") {
    if (__DEV__) {
      console.warn("Invalid Booking ID in route params:", id);
    }
    router.replace("/(tabs)");
    return null;
  }

  const { data: booking, isLoading, isError, refetch } = useBooking(id);
  const { driverLocation, isConnected: isSocketConnected } = useBookingTracking(id);

  // Fetch store detail if not populated in booking
  const { data: storeDetailData, isLoading: isStoreLoading } = useStoreDetail(booking?.storeId);

  // Normalize store object
  const store = useMemo(() => {
    if (booking?.store) {
      const s = booking.store;
      return {
        id: s._id,
        name: s.store_name,
        address: s.store_address,
        phone: s.store_contact_number,
        coordinates: {
          lat: s.location.coordinates[1],
          lng: s.location.coordinates[0],
        },
      };
    }
    if (storeDetailData?.store) {
      const s = storeDetailData.store;
      return {
        id: s._id,
        name: s.store_name,
        address: s.store_address,
        phone: s.store_contact_number,
        coordinates: {
          lat: s.location.coordinates[1],
          lng: s.location.coordinates[0],
        },
      };
    }
    return null;
  }, [booking?.store, storeDetailData?.store]);

  const statusConfig = useMemo(
    () => getStatusConfig(booking?.status || ""),
    [booking?.status]
  );

  const isActive = useMemo(() => {
    const activeStatuses = [
      "created",
      "confirmed",
      "store_assigned",
      "driver_assigned",
      "driver_arrived",
      "picked_up",
      "at_store",
      "in_storage",
      "stored",
    ];
    return activeStatuses.includes(booking?.status || "");
  }, [booking?.status]);

  const canCancel = useMemo(() => {
    const cancellableStatuses = ["created", "confirmed", "store_assigned"];
    return cancellableStatuses.includes(booking?.status || "");
  }, [booking?.status]);

  const canExtend = useMemo(() => {
    const extendableStatuses = ["at_store", "in_storage", "stored"];
    return extendableStatuses.includes(booking?.status || "");
  }, [booking?.status]);

  const canReturn = useMemo(() => {
    const returnableStatuses = ["at_store", "in_storage", "stored"];
    return returnableStatuses.includes(booking?.status || "");
  }, [booking?.status]);

  const canReview = useMemo(() => {
    const reviewableStatuses = ["completed", "delivered"];
    return reviewableStatuses.includes(booking?.status || "");
  }, [booking?.status]);

  const atStoreTime = useMemo(() => {
    const event = booking?.timeline?.find((evt: any) => evt.status === "at_store" || evt.status === "in_storage" || evt.status === "stored");
    if (event?.timestamp) {
      return format(new Date(event.timestamp), "hh:mm a, MMM dd");
    }
    if (booking?.status === "in_storage" || booking?.status === "at_store" || booking?.status === "stored") {
      return format(new Date(), "hh:mm a, MMM dd");
    }
    return null;
  }, [booking?.timeline, booking?.status]);

  // ── Data Transformation ───────────────────────────────────────────
  const items = useMemo(() => {
    if (!booking?.luggage) return [];
    const result: BookingItem[] = [];
    const luggage = booking.luggage;
    const bookingCode = booking._id.slice(-8).toUpperCase();

    if (luggage.small && luggage.small > 0) {
      result.push({
        id: "small",
        type: "small",
        label: "Small Bag",
        description: `${luggage.small} item(s)`,
        tagId: bookingCode,
      });
    }
    if (luggage.medium && luggage.medium > 0) {
      result.push({
        id: "medium",
        type: "medium",
        label: "Medium Bag",
        description: `${luggage.medium} item(s)`,
        tagId: bookingCode,
      });
    }
    if (luggage.large && luggage.large > 0) {
      result.push({
        id: "large",
        type: "large",
        label: "Large Bag",
        description: `${luggage.large} item(s)`,
        tagId: bookingCode,
      });
    }
    if (luggage.other && luggage.other > 0) {
      result.push({
        id: "other",
        type: "special",
        label: "Other Item",
        description: `${luggage.other} item(s)`,
        tagId: bookingCode,
      });
    }
    return result;
  }, [booking?.luggage, booking?._id]);

  const trackingEvents = useMemo(() => {
    if (!booking?.timeline) return [];
    return (booking.timeline as TimelineEntry[]).map((item: any, index: number) => ({
      id: `t-${index}`,
      status: item.status,
      title: getStatusConfig(item.status).label,
      description: item.note,
      timestamp: item.timestamp ? format(new Date(item.timestamp), "hh:mm a") : "",
      isCompleted: true,
      isCurrent: index === booking.timeline.length - 1,
    }));
  }, [booking?.timeline]);

  const visibleTracking = useMemo(() => {
    if (showFullTracking) return [...trackingEvents].reverse();
    return trackingEvents.length > 0 ? [trackingEvents[trackingEvents.length - 1]] : [];
  }, [trackingEvents, showFullTracking]);

  // ── Countdown Timer ────────────────────────────────────────────────
  const [countdown, setCountdown] = useState({
    hours: 7,
    minutes: 25,
    seconds: 0,
  });

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          clearInterval(interval);
          return prev;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // ── Pulsing Animation for Active Status ────────────────────────────
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
    return () => {
      cancelAnimation(pulseAnim);
    };
  }, [isActive, pulseAnim]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: interpolate(pulseAnim.value, [1, 1.15], [0.6, 0]),
  }));

  // ── Scroll Animation ──────────────────────────────────────────────
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, 120],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const headerTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [80, 150],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  // ── Actions ────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleShare = useCallback(async () => {
    if (!booking) return;
    try {
      await Share.share({
        title: `Booking #${booking.bookingCode}`,
        message: `My luggage booking #${booking.bookingCode}${store ? ` at ${store.name}` : ""}. Status: ${statusConfig.label}.`,
      });
    } catch (err) {
      if (__DEV__) {
        console.error("Share error:", err);
      }
    }
  }, [booking, statusConfig]);

  const handleCallStore = useCallback(() => {
    if (!store?.phone) return;
    const phone = store.phone.replace(/[^+0-9]/g, "");
    Linking.canOpenURL(`tel:${phone}`).then((supported) => {
      if (supported) Linking.openURL(`tel:${phone}`);
    });
  }, [store?.phone]);

  const handleCallDriver = useCallback(() => {
    return;
  }, []);

  const handleDirections = useCallback(() => {
    if (!store?.coordinates) return;
    const { lat, lng } = store.coordinates;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${store.name})`,
    });
    if (url) Linking.openURL(url);
  }, [store]);

  const handleCancel = useCallback(() => {
    setShowCancelModal(true);
  }, []);

  const onConfirmCancel = useCallback(() => {
    cancelBooking.mutate(
      { bookingId: id, reason: "Cancelled by user" },
      {
        onSuccess: () => {
          showSuccess("Your booking has been cancelled successfully.", "Booking Cancelled");
          refetch();
        },
        onError: (err: any) => {
          showError(err.response?.data?.message || "Failed to cancel booking. Please try again.");
        },
      }
    );
  }, [id, cancelBooking, refetch]);

  const handleExtend = useCallback(() => {
    router.push({
      pathname: "/booking/extend",
      params: { bookingId: id },
    });
  }, [router, id]);

  const handleRequestReturn = useCallback(() => {
    router.push({
      pathname: "/requestReturn",
      params: { bookingId: id },
    });
  }, [router, id]);

  const handleLeaveReview = useCallback(() => {
    router.push({
      pathname: "/review",
      params: { bookingId: id },
    });
  }, [router, id]);

  const handleSupport = useCallback(() => {
    router.push({
      pathname: "/support",
      params: { bookingId: id },
    });
  }, [router, id]);

  const handleViewStore = useCallback(() => {
    if (!store?.id) return;
    router.push({
      pathname: "/stores/[id]",
      params: { id: store.id },
    });
  }, [router, store?.id]);

  const formatCountdown = (val: number) => val.toString().padStart(2, "0");

  // ── Loading / Error ────────────────────────────────────────────────
  if (isLoading || (booking?.storeId && isStoreLoading)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.PRIMARY} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (isError || !booking) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={["top"]}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={THEME.TEXT_MUTED}
        />
        <Text style={styles.errorTitle}>Booking not found</Text>
        <Text style={styles.errorSubtitle}>
          This booking may have been removed or doesn't exist
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── FLOATING HEADER ────────────────────────────────────────── */}
      <SafeAreaView edges={["top"]} style={styles.floatingHeader}>
        <Animated.View style={[styles.headerBg, headerBgStyle]} />
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={22} color={THEME.TEXT_DARK} />
          </TouchableOpacity>

          <Animated.View style={[styles.headerCenter, headerTitleStyle]}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Booking #{booking.bookingCode}
            </Text>
            <View
              style={[
                styles.headerStatusDot,
                { backgroundColor: statusConfig.color },
              ]}
            />
          </Animated.View>

          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerButton}
            accessibilityLabel="Share booking"
            accessibilityRole="button"
          >
            <Ionicons
              name="share-outline"
              size={20}
              color={THEME.TEXT_DARK}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── CONTENT ────────────────────────────────────────────────── */}
      <AnimatedScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.PRIMARY}
            colors={[THEME.PRIMARY]}
          />
        }
      >
        {/* ── STATUS HERO ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient
            colors={[THEME.PRIMARY, THEME.SECONDARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statusHero, { borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }]}
          >
            <View style={styles.statusHeroContent}>
              {/* Pulsing Circle */}
              <View style={styles.statusIconWrapper}>
                {isActive && (
                  <Animated.View
                    style={[
                      styles.pulseCircle,
                      { borderColor: "#FFF" },
                      pulseStyle,
                    ]}
                  />
                )}
                <View style={styles.statusIconCircle}>
                  <Ionicons name={statusConfig.icon} size={36} color="#FFF" />
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.statusLabel}>{statusConfig.label}</Text>
                {isSocketConnected && isActive && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}
              </View>
              <Text style={styles.statusDesc}>{statusConfig.description}</Text>

              <View style={styles.bookingIdBadge}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.1)"]}
                  style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
                />
                <Text style={styles.bookingIdText}>ORDER #{(booking?.bookingCode || booking?._id || "").slice(-8).toUpperCase()}</Text>
              </View>
            </View>

            {/* Countdown Timer or Stored Time (if active) */}
            {isActive && booking?.status !== "at_store" && booking?.status !== "in_storage" && booking?.status !== "stored" && (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownLabel}>TIME REMAINING</Text>
                <View style={styles.countdownRow}>
                  <CountdownUnit
                    value={formatCountdown(countdown.hours)}
                    label="HRS"
                  />
                  <Text style={styles.countdownSeparator}>:</Text>
                  <CountdownUnit
                    value={formatCountdown(countdown.minutes)}
                    label="MIN"
                  />
                  <Text style={styles.countdownSeparator}>:</Text>
                  <CountdownUnit
                    value={formatCountdown(countdown.seconds)}
                    label="SEC"
                  />
                </View>
              </View>
            )}

            {(booking?.status === "at_store" || booking?.status === "in_storage" || booking?.status === "stored") && atStoreTime && (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownLabel}>STORED AT</Text>
                <Text style={{color: '#FFF', fontSize: 24, fontWeight: '800', marginTop: 8}}>{atStoreTime}</Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* ── QUICK ACTIONS ────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.quickActionsCard}
        >
          <QuickActionButton
            icon="call-outline"
            label="Call Store"
            onPress={handleCallStore}
          />
          <QuickActionButton
            icon="navigate-outline"
            label="Directions"
            onPress={handleDirections}
          />
          {booking.driver && (
            <QuickActionButton
              icon="call-outline"
              label="Call Driver"
              onPress={handleCallDriver}
            />
          )}
          <QuickActionButton
            icon="chatbubble-outline"
            label="Support"
            onPress={handleSupport}
          />
        </Animated.View>

        {/* ── PICKUP CARD ────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Pickup Details</Text>

            <View style={styles.scheduleRow}>
              <View style={styles.scheduleItem}>
                <View
                  style={[
                    styles.scheduleIconBg,
                    { backgroundColor: "#dbeafe" },
                  ]}
                >
                  <Ionicons name="location" size={20} color="#2563eb" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleLabel}>PICKUP LOCATION</Text>
                  <Text style={styles.scheduleDate} numberOfLines={2}>
                    {booking.pickupLocation?.address || "No address provided"}
                  </Text>
                </View>
              </View>

              <View style={styles.scheduleItem}>
                <View
                  style={[
                    styles.scheduleIconBg,
                    { backgroundColor: "#ede9fe" },
                  ]}
                >
                  <Ionicons name="time" size={20} color="#7c3aed" />
                </View>
                <View>
                  <Text style={styles.scheduleLabel}>SCHEDULED AT</Text>
                  <Text style={styles.scheduleTime}>
                    {booking.pickup?.scheduledAt
                      ? format(new Date(booking.pickup.scheduledAt), "hh:mm a")
                      : "TBD"}
                  </Text>
                  <Text style={styles.scheduleDate}>
                    {booking.pickup?.scheduledAt
                      ? format(new Date(booking.pickup.scheduledAt), "MMM dd, yyyy")
                      : ""}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── DRIVER INFO HIDDEN IF NOT AVAILABLE ────────────────── */}

        {/* ── ITEMS LIST ───────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Your Items ({items.length})
              </Text>
            </View>

            {items.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInRight.delay(350 + index * 80).springify()}
              >
                <View
                  style={[
                    styles.itemCard,
                    index === items.length - 1 && styles.itemCardLast,
                  ]}
                >
                  <View
                    style={[
                      styles.itemIconBg,
                      { backgroundColor: `${getItemColor(item.type)}12` },
                    ]}
                  >
                    <Ionicons
                      name={getItemIcon(item.type)}
                      size={22}
                      color={getItemColor(item.type)}
                    />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemDescription}>
                      {item.description}
                    </Text>
                  </View>
                  <View style={styles.tagBadge}>
                    <Ionicons
                      name="pricetag"
                      size={10}
                      color={THEME.PRIMARY}
                    />
                    <Text style={styles.tagText}>{item.tagId}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* ── TRACKING TIMELINE ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tracking</Text>

            <View style={styles.timeline}>
              {visibleTracking.map((event, index) => {
                const eventStatus = getStatusConfig(event.status);
                const isLast = index === visibleTracking.length - 1;

                return (
                  <Animated.View
                    key={event.id}
                    entering={FadeInDown.delay(450 + index * 60).springify()}
                  >
                    <View style={styles.timelineItem}>
                      {/* Timeline Line */}
                      {!isLast && (
                        <View
                          style={[
                            styles.timelineLine,
                            {
                              backgroundColor: event.isCompleted
                                ? statusConfig.color
                                : "rgba(0,0,0,0.08)",
                            },
                          ]}
                        />
                      )}

                      {/* Timeline Dot */}
                      <View
                        style={[
                          styles.timelineDot,
                          event.isCurrent && styles.timelineDotCurrent,
                          {
                            backgroundColor: event.isCompleted
                              ? statusConfig.color
                              : event.isCurrent
                              ? statusConfig.color
                              : "rgba(0,0,0,0.08)",
                            borderColor: event.isCurrent
                              ? `${statusConfig.color}30`
                              : "transparent",
                          },
                        ]}
                      >
                        {event.isCompleted || event.isCurrent ? (
                          <Ionicons
                            name={
                              event.isCurrent
                                ? "radio-button-on"
                                : "checkmark"
                            }
                            size={event.isCurrent ? 10 : 12}
                            color="#FFF"
                          />
                        ) : null}
                      </View>

                      {/* Event Content */}
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <Text
                            style={[
                              styles.timelineTitle,
                              event.isCurrent && {
                                color: statusConfig.color,
                                fontWeight: "700",
                              },
                              !event.isCompleted &&
                                !event.isCurrent && {
                                  color: THEME.TEXT_MUTED,
                                },
                            ]}
                          >
                            {event.title}
                          </Text>
                          {event.timestamp ? (
                            <Text style={styles.timelineTime}>
                              {event.timestamp}
                            </Text>
                          ) : null}
                        </View>
                        <Text
                          style={[
                            styles.timelineDesc,
                            !event.isCompleted &&
                              !event.isCurrent && {
                                color: `${THEME.TEXT_MUTED}80`,
                              },
                          ]}
                        >
                          {event.description}
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.showAllTrackingBtn}
              onPress={() => setShowFullTracking(!showFullTracking)}
              accessibilityLabel={
                showFullTracking
                  ? "Show less tracking"
                  : "Show all tracking steps"
              }
              accessibilityRole="button"
            >
              <Text style={styles.showAllTrackingText}>
                {showFullTracking ? "Show Less" : "Show All Steps"}
              </Text>
              <Ionicons
                name={showFullTracking ? "chevron-up" : "chevron-down"}
                size={16}
                color={THEME.PRIMARY}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── STORE INFO ───────────────────────────────────────────── */}
        {store && (
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <TouchableOpacity
              style={styles.sectionCard}
              onPress={handleViewStore}
              activeOpacity={0.7}
              accessibilityLabel={`View store: ${store.name}`}
              accessibilityRole="button"
            >
              <View style={styles.storeInfoRow}>
                <View style={styles.storeIconBg}>
                  <Ionicons name="storefront" size={22} color={THEME.PRIMARY} />
                </View>
                <View style={styles.storeInfoContent}>
                  <Text style={styles.storeInfoName}>{store.name}</Text>
                  <Text style={styles.storeInfoAddress} numberOfLines={1}>
                    {store.address}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={THEME.TEXT_MUTED}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── PRICING BREAKDOWN HIDDEN IF NO TOTAL ────────────────── */}
        {booking.pricing.total && (
          <Animated.View entering={FadeInDown.delay(550).springify()}>
            <View style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.sectionHeaderRow}
                onPress={() => setShowPriceBreakdown(!showPriceBreakdown)}
              >
                <Text style={styles.sectionTitle}>Payment</Text>
                <View style={styles.priceTotalBadge}>
                  <Text style={styles.priceTotalText}>
                    {booking.pricing.currency} {(booking.pricing.total || 0).toFixed(2)}
                  </Text>
                  <Ionicons
                    name={showPriceBreakdown ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={THEME.PRIMARY}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ── ACTION BUTTONS ───────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={styles.actionButtonsContainer}
        >
          {canExtend && (
            <TouchableOpacity
              style={styles.extendButton}
              onPress={handleExtend}
              accessibilityLabel="Extend storage time"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[THEME.PRIMARY, THEME.SECONDARY]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.extendButtonGradient}
              >
                <Ionicons name="time-outline" size={20} color="#FFF" />
                <Text style={styles.extendButtonText}>Extend Storage</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {canReturn && (
            <TouchableOpacity
              style={styles.extendButton}
              onPress={handleRequestReturn}
              accessibilityLabel="Request return parcel"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[THEME.PRIMARY, THEME.SECONDARY]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.extendButtonGradient}
              >
                <Ionicons name="car-outline" size={20} color="#FFF" />
                <Text style={styles.extendButtonText}>Request Return</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {canReview && (
            <TouchableOpacity
              style={styles.extendButton}
              onPress={handleLeaveReview}
              accessibilityLabel="Leave a Review"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={["#0891b2", "#0284c7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.extendButtonGradient}
              >
                <Ionicons name="star-outline" size={20} color="#FFF" />
                <Text style={styles.extendButtonText}>Leave Review</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              accessibilityLabel="Cancel booking"
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleSupport}
            accessibilityLabel="Get help with this booking"
            accessibilityRole="button"
          >
            <Ionicons
              name="help-circle-outline"
              size={18}
              color={THEME.TEXT_DARK}
            />
            <Text style={styles.supportButtonText}>Need Help?</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── CANCELLATION INFO (if cancelled) ─────────────────────── */}
        {booking.status === "cancelled" && booking.cancellation && (
          <Animated.View entering={FadeInDown.delay(650).springify()}>
            <View style={[styles.sectionCard, styles.cancelledCard]}>
              <View style={styles.cancelledHeader}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
                <Text style={styles.cancelledTitle}>Booking Cancelled</Text>
              </View>
              <Text style={styles.cancelledReason}>
                Reason: {booking.cancellation.reason}
              </Text>
              <Text style={styles.cancelledDate}>
                Cancelled on {booking.cancellation.cancelledAt}
              </Text>

              <View style={styles.refundRow}>
                <Text style={styles.refundLabel}>Refund Amount</Text>
                <Text style={styles.refundAmount}>
                  ${(booking.cancellation.refundAmount || 0).toFixed(2)}
                </Text>
              </View>
              <View
                style={[
                  styles.refundStatusBadge,
                  {
                    backgroundColor:
                      booking.cancellation.refundStatus === "processed"
                        ? "#dcfce7"
                        : booking.cancellation.refundStatus === "pending"
                        ? "#fef3c7"
                        : "#fee2e2",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.refundStatusText,
                    {
                      color:
                        booking.cancellation.refundStatus === "processed"
                          ? "#16a34a"
                          : booking.cancellation.refundStatus === "pending"
                          ? "#d97706"
                          : "#ef4444",
                    },
                  ]}
                >
                  Refund{" "}
                  {booking.cancellation.refundStatus ? (booking.cancellation.refundStatus.charAt(0).toUpperCase() +
                    booking.cancellation.refundStatus.slice(1)) : "Pending"}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </AnimatedScrollView>

      <ConfirmationModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={onConfirmCancel}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? You will receive a full refund if cancelled before drop-off."
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
        isDestructive
        icon="close-circle-outline"
      />
    </View>
  );
}

// ─── SUB COMPONENTS ───────────────────────────────────────────────────────────

const CountdownUnit = ({
  value,
  label,
}: {
  value: string;
  label: string;
}) => (
  <View style={styles.countdownUnit}>
    <View style={styles.countdownValueBg}>
      <Text style={styles.countdownValue}>{value}</Text>
    </View>
    <Text style={styles.countdownUnitLabel}>{label}</Text>
  </View>
);

const QuickActionButton = ({
  icon,
  label,
  onPress,
}: {
  icon: IoniconsName;
  label: string;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.quickActionBtn, animatedStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.9);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={styles.quickActionIconBg}>
        <Ionicons name={icon} size={20} color={THEME.PRIMARY} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </AnimatedTouchable>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },

  // Loading / Error
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.BACKGROUND_LIGHT,
    paddingHorizontal: 40,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
  },
  errorButton: {
    backgroundColor: THEME.PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  errorButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Floating Header
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  headerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // Status Hero
  statusHero: {
    paddingTop: 100,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  statusHeroContent: {
    alignItems: "center",
  },
  statusIconWrapper: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  statusIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  pulseCircle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 45,
    borderWidth: 3,
  },
  statusLabel: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFF",
    marginBottom: 8,
  },
  statusDesc: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  bookingIdBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  bookingIdText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },

  // Countdown
  countdownContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  countdownUnit: {
    alignItems: "center",
    gap: 4,
  },
  countdownValueBg: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  countdownValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
  },
  countdownUnitLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1,
  },
  countdownSeparator: {
    fontSize: 24,
    fontWeight: "800",
    color: "rgba(255,255,255,0.4)",
    marginBottom: 16,
  },

  // Quick Actions
  quickActionsCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  quickActionBtn: {
    alignItems: "center",
    gap: 6,
  },
  quickActionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: `${THEME.PRIMARY}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },

  // Section Card
  sectionCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 20,
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
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 16,
  },

  // Schedule
  scheduleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  scheduleItem: {
    flex: 1,
    alignItems: "center",
    gap: 10,
  },
  scheduleIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.TEXT_MUTED,
    letterSpacing: 1,
    textAlign: "center",
  },
  scheduleDate: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
    textAlign: "center",
    marginTop: 2,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
    textAlign: "center",
    marginTop: 2,
  },
  scheduleActual: {
    fontSize: 11,
    color: "#16a34a",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
  },
  scheduleConnector: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    gap: 4,
  },
  scheduleConnectorLine: {
    width: 12,
    height: 1.5,
    backgroundColor: "rgba(0,0,0,0.1)",
  },

  // Driver Card
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  driverAvatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  driverInitials: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  driverRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  driverRating: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  driverVehicle: {
    fontSize: 11,
    color: THEME.TEXT_MUTED,
    marginTop: 3,
  },
  etaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${THEME.PRIMARY}10`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  etaText: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.PRIMARY,
  },
  driverActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: 12,
  },
  driverActionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  driverActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.PRIMARY,
  },
  driverActionDivider: {
    width: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
  },

  // Items
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
    gap: 12,
  },
  itemCardLast: {
    borderBottomWidth: 0,
  },
  itemIconBg: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  itemDescription: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    marginTop: 2,
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${THEME.PRIMARY}08`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.PRIMARY,
    letterSpacing: 0.5,
  },

  // Timeline
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    minHeight: 60,
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    left: 11,
    top: 28,
    bottom: -4,
    width: 2,
    borderRadius: 1,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    borderWidth: 3,
  },
  timelineDotCurrent: {
    borderWidth: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
    flex: 1,
  },
  timelineTime: {
    fontSize: 11,
    fontWeight: "500",
    color: THEME.TEXT_MUTED,
  },
  timelineDesc: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    lineHeight: 17,
  },
  showAllTrackingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  showAllTrackingText: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.PRIMARY,
  },

  // Store Info
  storeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  storeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: `${THEME.PRIMARY}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  storeInfoContent: {
    flex: 1,
  },
  storeInfoName: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  storeInfoAddress: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    marginTop: 2,
  },

  // Pricing
  priceTotalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priceTotalText: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.PRIMARY,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    flex: 1,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  discountLabel: {
    fontSize: 13,
    color: "#16a34a",
  },
  discountCodeBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderStyle: "dashed",
  },
  discountCodeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#16a34a",
    letterSpacing: 0.5,
  },
  discountValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#16a34a",
  },
  priceDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 8,
  },
  priceTotalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  priceTotalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: "500",
    color: THEME.TEXT_DARK,
    flex: 1,
  },
  paymentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Action Buttons
  actionButtonsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  extendButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  extendButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  extendButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: "#ef4444",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
  },
  supportButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },

  // Cancelled Card
  cancelledCard: {
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
  },
  cancelledHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  cancelledTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ef4444",
  },
  cancelledReason: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    marginBottom: 4,
  },
  cancelledDate: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    marginBottom: 16,
  },
  refundRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  refundLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: THEME.TEXT_DARK,
  },
  refundAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  refundStatusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refundStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  bottomSpacer: {
    height: 40,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff4444',
  },
  liveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});