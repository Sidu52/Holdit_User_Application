import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  Linking,
  Share,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
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
import { THEME } from "@/theme/theme";;

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

interface BookingDetail {
  id: string;
  status: BookingStatus;
  createdAt: string;
  store: {
    id: string;
    name: string;
    address: string;
    phone: string;
    coordinates: { lat: number; lng: number };
  };
  items: BookingItem[];
  pricing: {
    type: "hourly" | "daily";
    ratePerBag: number;
    bagCount: number;
    duration: number;
    subtotal: number;
    discount: number;
    discountCode?: string;
    tax: number;
    total: number;
    isPaid: boolean;
    paymentMethod?: string;
    paymentLast4?: string;
  };
  schedule: {
    dropOff: string;
    dropOffTime: string;
    pickUp: string;
    pickUpTime: string;
    actualDropOff?: string;
    actualPickUp?: string;
  };
  tracking: TrackingEvent[];
  driver?: {
    name: string;
    phone: string;
    initials: string;
    rating: number;
    vehicleInfo: string;
    eta?: string;
  };
  supportTicketId?: string;
  cancellation?: {
    reason: string;
    cancelledAt: string;
    refundAmount: number;
    refundStatus: "pending" | "processed" | "failed";
  };
}

interface BookingItem {
  id: string;
  type: "small" | "medium" | "large" | "special";
  label: string;
  description: string;
  tagId: string;
}

interface TrackingEvent {
  id: string;
  status: BookingStatus;
  title: string;
  description: string;
  timestamp: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// TODO: Replace with real API hook (useBookingDetail)

const MOCK_BOOKING: BookingDetail = {
  id: "HLD-8392",
  status: "in_storage",
  createdAt: "2024-01-15T10:30:00Z",
  store: {
    id: "store-1",
    name: "LuggageHero JFK T4",
    address: "JFK Airport, Terminal 4, Arrivals Hall, Queens, NY 11430",
    phone: "+1 (212) 555-0189",
    coordinates: { lat: 40.6413, lng: -73.7781 },
  },
  items: [
    {
      id: "item-1",
      type: "large",
      label: "Large Suitcase",
      description: "Black Samsonite rolling suitcase",
      tagId: "TAG-A001",
    },
    {
      id: "item-2",
      type: "medium",
      label: "Backpack",
      description: "Blue hiking backpack",
      tagId: "TAG-A002",
    },
    {
      id: "item-3",
      type: "small",
      label: "Carry-on Bag",
      description: "Brown leather duffel",
      tagId: "TAG-A003",
    },
  ],
  pricing: {
    type: "daily",
    ratePerBag: 8.95,
    bagCount: 3,
    duration: 1,
    subtotal: 26.85,
    discount: 5.37,
    discountCode: "WELCOME",
    tax: 1.93,
    total: 23.41,
    isPaid: true,
    paymentMethod: "visa",
    paymentLast4: "4242",
  },
  schedule: {
    dropOff: "Today, Jan 15",
    dropOffTime: "10:30 AM",
    pickUp: "Today, Jan 15",
    pickUpTime: "6:00 PM",
    actualDropOff: "10:35 AM",
  },
  tracking: [
    {
      id: "t1",
      status: "confirmed",
      title: "Booking Confirmed",
      description: "Your booking has been confirmed",
      timestamp: "10:30 AM",
      isCompleted: true,
      isCurrent: false,
    },
    {
      id: "t2",
      status: "pickup_scheduled",
      title: "Drop-off Scheduled",
      description: "Drop-off at LuggageHero JFK T4",
      timestamp: "10:30 AM",
      isCompleted: true,
      isCurrent: false,
    },
    {
      id: "t3",
      status: "picked_up",
      title: "Items Received",
      description: "3 items checked in and tagged",
      timestamp: "10:35 AM",
      isCompleted: true,
      isCurrent: false,
    },
    {
      id: "t4",
      status: "in_storage",
      title: "Securely Stored",
      description: "Your items are in our secure storage facility",
      timestamp: "10:40 AM",
      isCompleted: true,
      isCurrent: true,
    },
    {
      id: "t5",
      status: "delivery_scheduled",
      title: "Pickup Scheduled",
      description: "Scheduled for 6:00 PM today",
      timestamp: "6:00 PM",
      isCompleted: false,
      isCurrent: false,
    },
    {
      id: "t6",
      status: "delivered",
      title: "Items Returned",
      description: "All items returned to you",
      timestamp: "",
      isCompleted: false,
      isCurrent: false,
    },
    {
      id: "t7",
      status: "completed",
      title: "Booking Complete",
      description: "Thank you for using HoldMyBag!",
      timestamp: "",
      isCompleted: false,
      isCurrent: false,
    },
  ],
  driver: {
    name: "Michael R.",
    phone: "+1 (212) 555-0234",
    initials: "MR",
    rating: 4.9,
    vehicleInfo: "White Toyota Camry • NY-ABC-1234",
    eta: "15 min",
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getStatusConfig = (
  status: BookingStatus
): {
  label: string;
  color: string;
  bgColor: string;
  icon: IoniconsName;
  description: string;
} => {
  switch (status) {
    case "confirmed":
      return {
        label: "Confirmed",
        color: "#2563eb",
        bgColor: "#dbeafe",
        icon: "checkmark-circle",
        description: "Your booking is confirmed",
      };
    case "pickup_scheduled":
      return {
        label: "Drop-off Scheduled",
        color: "#7c3aed",
        bgColor: "#ede9fe",
        icon: "calendar",
        description: "Drop-off has been scheduled",
      };
    case "picked_up":
      return {
        label: "Items Received",
        color: "#0891b2",
        bgColor: "#cffafe",
        icon: "cube",
        description: "Your items have been received",
      };
    case "in_storage":
      return {
        label: "In Storage",
        color: "#16a34a",
        bgColor: "#dcfce7",
        icon: "shield-checkmark",
        description: "Items are securely stored",
      };
    case "delivery_scheduled":
      return {
        label: "Pickup Scheduled",
        color: "#d97706",
        bgColor: "#fef3c7",
        icon: "time",
        description: "Your pickup has been scheduled",
      };
    case "out_for_delivery":
      return {
        label: "On The Way",
        color: "#ea580c",
        bgColor: "#fff7ed",
        icon: "car",
        description: "Your items are on the way",
      };
    case "delivered":
      return {
        label: "Delivered",
        color: "#16a34a",
        bgColor: "#dcfce7",
        icon: "checkmark-done-circle",
        description: "Items have been returned",
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
    default:
      return {
        label: "Unknown",
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

const getPaymentIcon = (method?: string): IoniconsName => {
  switch (method) {
    case "visa":
    case "mastercard":
      return "card";
    case "apple_pay":
      return "logo-apple";
    case "google_pay":
      return "logo-google";
    default:
      return "card-outline";
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

  // Validate route param
  if (!id) {
    if (__DEV__) {
      console.warn("Booking ID missing from route params");
    }
    router.replace("/(tabs)/myLuggage");
    return null;
  }

  // TODO: Replace with real API hook
  // const { data: booking, isLoading, isError, refetch } = useBookingDetail(id);
  const booking = MOCK_BOOKING;
  const isLoading = false;
  const isError = false;

  const statusConfig = useMemo(
    () => getStatusConfig(booking.status),
    [booking.status]
  );

  const isActive = useMemo(() => {
    const activeStatuses: BookingStatus[] = [
      "confirmed",
      "pickup_scheduled",
      "picked_up",
      "in_storage",
      "delivery_scheduled",
      "out_for_delivery",
    ];
    return activeStatuses.includes(booking.status);
  }, [booking.status]);

  const canCancel = useMemo(() => {
    const cancellableStatuses: BookingStatus[] = [
      "confirmed",
      "pickup_scheduled",
    ];
    return cancellableStatuses.includes(booking.status);
  }, [booking.status]);

  const canExtend = useMemo(() => {
    const extendableStatuses: BookingStatus[] = [
      "in_storage",
      "delivery_scheduled",
    ];
    return extendableStatuses.includes(booking.status);
  }, [booking.status]);

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
    // TODO: await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: `Booking #${booking.id}`,
        message: `My luggage booking #${booking.id} at ${booking.store.name}. Status: ${statusConfig.label}.`,
      });
    } catch (err) {
      if (__DEV__) {
        console.error("Share error:", err);
      }
    }
  }, [booking, statusConfig]);

  const handleCallStore = useCallback(() => {
    const phone = booking.store.phone.replace(/[^+0-9]/g, "");
    Linking.canOpenURL(`tel:${phone}`).then((supported) => {
      if (supported) Linking.openURL(`tel:${phone}`);
    });
  }, [booking.store.phone]);

  const handleCallDriver = useCallback(() => {
    if (!booking.driver?.phone) return;
    const phone = booking.driver.phone.replace(/[^+0-9]/g, "");
    Linking.canOpenURL(`tel:${phone}`).then((supported) => {
      if (supported) Linking.openURL(`tel:${phone}`);
    });
  }, [booking.driver?.phone]);

  const handleDirections = useCallback(() => {
    const { lat, lng } = booking.store.coordinates;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${booking.store.name})`,
    });
    if (url) Linking.openURL(url);
  }, [booking.store]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? You will receive a full refund if cancelled before drop-off.",
      [
        { text: "Keep Booking", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: () => {
            // TODO: Call cancel API
            // cancelBooking(booking.id);
            if (__DEV__) {
              console.log("Cancel booking:", booking.id);
            }
          },
        },
      ]
    );
  }, [booking.id]);

  const handleExtend = useCallback(() => {
    router.push({
      pathname: "/booking/extend",
      params: { bookingId: booking.id },
    });
  }, [router, booking.id]);

  const handleSupport = useCallback(() => {
    router.push({
      pathname: "/support",
      params: { bookingId: booking.id },
    });
  }, [router, booking.id]);

  const handleViewStore = useCallback(() => {
    router.push({
      pathname: "/stores/[id]",
      params: { id: booking.store.id },
    });
  }, [router, booking.store.id]);

  const formatCountdown = (val: number) => val.toString().padStart(2, "0");

  // ── Loading / Error ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.PRIMARY} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (isError) {
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

  // ── Visible Tracking Steps ─────────────────────────────────────────
  const visibleTracking = showFullTracking
    ? booking.tracking
    : booking.tracking.filter((t) => t.isCompleted || t.isCurrent);

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
              Booking #{booking.id}
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
            colors={[statusConfig.color, `${statusConfig.color}cc`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusHero}
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
                  <Ionicons name={statusConfig.icon} size={32} color="#FFF" />
                </View>
              </View>

              <Text style={styles.statusLabel}>{statusConfig.label}</Text>
              <Text style={styles.statusDesc}>{statusConfig.description}</Text>

              <View style={styles.bookingIdBadge}>
                <Text style={styles.bookingIdText}>#{booking.id}</Text>
              </View>
            </View>

            {/* Countdown Timer (if active) */}
            {isActive && (
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

        {/* ── SCHEDULE CARD ────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Schedule</Text>

            <View style={styles.scheduleRow}>
              {/* Drop-off */}
              <View style={styles.scheduleItem}>
                <View
                  style={[
                    styles.scheduleIconBg,
                    { backgroundColor: "#dbeafe" },
                  ]}
                >
                  <Ionicons name="arrow-down-circle" size={20} color="#2563eb" />
                </View>
                <View>
                  <Text style={styles.scheduleLabel}>DROP-OFF</Text>
                  <Text style={styles.scheduleDate}>
                    {booking.schedule.dropOff}
                  </Text>
                  <Text style={styles.scheduleTime}>
                    {booking.schedule.dropOffTime}
                  </Text>
                  {booking.schedule.actualDropOff && (
                    <Text style={styles.scheduleActual}>
                      Actual: {booking.schedule.actualDropOff}
                    </Text>
                  )}
                </View>
              </View>

              {/* Connector */}
              <View style={styles.scheduleConnector}>
                <View style={styles.scheduleConnectorLine} />
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={THEME.TEXT_MUTED}
                />
                <View style={styles.scheduleConnectorLine} />
              </View>

              {/* Pick-up */}
              <View style={styles.scheduleItem}>
                <View
                  style={[
                    styles.scheduleIconBg,
                    { backgroundColor: "#dcfce7" },
                  ]}
                >
                  <Ionicons name="arrow-up-circle" size={20} color="#16a34a" />
                </View>
                <View>
                  <Text style={styles.scheduleLabel}>PICK-UP</Text>
                  <Text style={styles.scheduleDate}>
                    {booking.schedule.pickUp}
                  </Text>
                  <Text style={styles.scheduleTime}>
                    {booking.schedule.pickUpTime}
                  </Text>
                  {booking.schedule.actualPickUp && (
                    <Text style={styles.scheduleActual}>
                      Actual: {booking.schedule.actualPickUp}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── DRIVER CARD (if assigned) ────────────────────────────── */}
        {booking.driver && (
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Assigned Driver</Text>

              <View style={styles.driverCard}>
                <View style={styles.driverAvatar}>
                  <LinearGradient
                    colors={[THEME.PRIMARY, THEME.SECONDARY]}
                    style={styles.driverAvatarGradient}
                  >
                    <Text style={styles.driverInitials}>
                      {booking.driver.initials}
                    </Text>
                  </LinearGradient>
                </View>

                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{booking.driver.name}</Text>
                  <View style={styles.driverRatingRow}>
                    <Ionicons name="star" size={12} color="#f59e0b" />
                    <Text style={styles.driverRating}>
                      {booking.driver.rating}
                    </Text>
                  </View>
                  <Text style={styles.driverVehicle}>
                    {booking.driver.vehicleInfo}
                  </Text>
                </View>

                {booking.driver.eta && (
                  <View style={styles.etaBadge}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={THEME.PRIMARY}
                    />
                    <Text style={styles.etaText}>
                      ETA: {booking.driver.eta}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.driverActions}>
                <TouchableOpacity
                  style={styles.driverActionBtn}
                  onPress={handleCallDriver}
                  accessibilityLabel="Call driver"
                  accessibilityRole="button"
                >
                  <Ionicons name="call" size={18} color={THEME.PRIMARY} />
                  <Text style={styles.driverActionText}>Call</Text>
                </TouchableOpacity>
                <View style={styles.driverActionDivider} />
                <TouchableOpacity
                  style={styles.driverActionBtn}
                  onPress={() => {
                    // TODO: Implement chat
                  }}
                  accessibilityLabel="Message driver"
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="chatbubble"
                    size={18}
                    color={THEME.PRIMARY}
                  />
                  <Text style={styles.driverActionText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── ITEMS LIST ───────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Your Items ({booking.items.length})
              </Text>
            </View>

            {booking.items.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInRight.delay(350 + index * 80).springify()}
              >
                <View
                  style={[
                    styles.itemCard,
                    index === booking.items.length - 1 && styles.itemCardLast,
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
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={handleViewStore}
            activeOpacity={0.7}
            accessibilityLabel={`View store: ${booking.store.name}`}
            accessibilityRole="button"
          >
            <View style={styles.storeInfoRow}>
              <View style={styles.storeIconBg}>
                <Ionicons name="storefront" size={22} color={THEME.PRIMARY} />
              </View>
              <View style={styles.storeInfoContent}>
                <Text style={styles.storeInfoName}>{booking.store.name}</Text>
                <Text style={styles.storeInfoAddress} numberOfLines={1}>
                  {booking.store.address}
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

        {/* ── PRICING BREAKDOWN ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(550).springify()}>
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.sectionHeaderRow}
              onPress={() => setShowPriceBreakdown(!showPriceBreakdown)}
              accessibilityLabel={
                showPriceBreakdown
                  ? "Hide price breakdown"
                  : "Show price breakdown"
              }
              accessibilityRole="button"
            >
              <Text style={styles.sectionTitle}>Payment</Text>
              <View style={styles.priceTotalBadge}>
                <Text style={styles.priceTotalText}>
                  ${booking.pricing.total.toFixed(2)}
                </Text>
                <Ionicons
                  name={showPriceBreakdown ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={THEME.PRIMARY}
                />
              </View>
            </TouchableOpacity>

            {showPriceBreakdown && (
              <Animated.View entering={FadeInDown.duration(200)}>
                {/* Rate Info */}
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    {booking.pricing.bagCount} bag
                    {booking.pricing.bagCount > 1 ? "s" : ""} ×{" "}
                    {booking.pricing.duration}{" "}
                    {booking.pricing.type === "daily" ? "day" : "hour"}
                    {booking.pricing.duration > 1 ? "s" : ""} × $
                    {booking.pricing.ratePerBag.toFixed(2)}
                  </Text>
                  <Text style={styles.priceValue}>
                    ${booking.pricing.subtotal.toFixed(2)}
                  </Text>
                </View>

                {/* Discount */}
                {booking.pricing.discount > 0 && (
                  <View style={styles.priceRow}>
                    <View style={styles.discountRow}>
                      <Text style={styles.discountLabel}>Discount</Text>
                      {booking.pricing.discountCode && (
                        <View style={styles.discountCodeBadge}>
                          <Text style={styles.discountCodeText}>
                            {booking.pricing.discountCode}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.discountValue}>
                      -${booking.pricing.discount.toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Tax */}
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Tax</Text>
                  <Text style={styles.priceValue}>
                    ${booking.pricing.tax.toFixed(2)}
                  </Text>
                </View>

                {/* Divider */}
                <View style={styles.priceDivider} />

                {/* Total */}
                <View style={styles.priceRow}>
                  <Text style={styles.priceTotalLabel}>Total</Text>
                  <Text style={styles.priceTotalValue}>
                    ${booking.pricing.total.toFixed(2)}
                  </Text>
                </View>

                {/* Payment Method */}
                <View style={styles.paymentMethodRow}>
                  <Ionicons
                    name={getPaymentIcon(booking.pricing.paymentMethod)}
                    size={20}
                    color={THEME.TEXT_DARK}
                  />
                  <Text style={styles.paymentMethodText}>
                    {booking.pricing.paymentMethod?.toUpperCase()} ••••{" "}
                    {booking.pricing.paymentLast4}
                  </Text>
                  <View
                    style={[
                      styles.paymentStatusBadge,
                      {
                        backgroundColor: booking.pricing.isPaid
                          ? "#dcfce7"
                          : "#fef3c7",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.paymentStatusText,
                        {
                          color: booking.pricing.isPaid
                            ? "#16a34a"
                            : "#d97706",
                        },
                      ]}
                    >
                      {booking.pricing.isPaid ? "Paid" : "Pending"}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </View>
        </Animated.View>

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
                  ${booking.cancellation.refundAmount.toFixed(2)}
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
                  {booking.cancellation.refundStatus.charAt(0).toUpperCase() +
                    booking.cancellation.refundStatus.slice(1)}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </AnimatedScrollView>
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
    paddingTop: 110,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  statusHeroContent: {
    alignItems: "center",
  },
  statusIconWrapper: {
    position: "relative",
    marginBottom: 16,
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  pulseCircle: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
  },
  statusIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  statusDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 12,
  },
  bookingIdBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bookingIdText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFF",
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
});