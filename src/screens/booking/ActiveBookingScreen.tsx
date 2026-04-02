import React, { useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "@/theme/theme";;
import BackgroundGradient from "@/components/ui/BackgroundGradient";
import { useProfile, useNearestStore } from "@/features/user/user.queries";
import { useActiveBooking, useBookingHistory } from "@/features/booking/bookingQueries";
import { OfferBanner } from "@/components/banner/OfferBanner";
import { TipsSafetySection } from "@/components/carousel/TipsSafetySection";
import { tipsData } from "@/store/tipsData";
import { useRouter } from "expo-router";
import { getInitials } from "@/utils/helper";
import { formatDateForDisplay } from "@/utils/date";

const { width } = Dimensions.get("window");
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];
type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const formatCurrencyTemp = (amount: number): string => {
  const prefix = amount < 0 ? "-" : "+";
  return `${prefix}$${Math.abs(amount).toFixed(2)}`;
};

export default function HomeScreen() {
  const router = useRouter();
  const scrollY = useSharedValue(0);

  // Data Hooks
  const {
    data: user,
    isLoading,
    isError,
    refetch: refetchProfile,
  } = useProfile();
  const { data: nearestStore, isLoading: isStoreLoading } = useNearestStore(
    user?.location?.coordinates || null,
  );

  const [refreshing, setRefreshing] = React.useState(false);

  const { data: activeBookingResponse, refetch: refetchBooking } = useActiveBooking();
  const activeBooking = activeBookingResponse?.bookings?.[0] || (activeBookingResponse && (activeBookingResponse as any)._id ? activeBookingResponse : null);
  const { data: recentActivity, refetch: refetchActivity } = useBookingHistory();

  // FIX: Remove console.log that exposes user PII in production
  if (__DEV__) {
    console.log("User profile loaded:", user?._id);
  }

  // Memoize computed values
  const initials = useMemo(
    () => getInitials(user?.first_name, user?.last_name) || "?",
    [user?.first_name, user?.last_name],
  );

  // Display user's own address or fallback
  const displayAddress = useMemo(() => {
    if (user?.location?.address) return user.location.address;
    if (isStoreLoading) return "Locating...";
    if (nearestStore?.nearest.store_address) return nearestStore.nearest.store_address;
    return "Set your address";
  }, [user?.location?.address, isStoreLoading, nearestStore?.nearest.store_address]);

  // const storeDistance = useMemo(() => {
  //   if (nearestStore?.distance) return `${nearestStore.distance} km away`;
  //   return "";
  // }, [nearestStore?.distance]);

  // ── Activity Icon Mapping ────────────────────────────────────────────
  const getActivityMeta = useCallback(
    (type: string): { icon: IoniconsName; color: string; bg: string } => {
      switch (type) {
        case "pickup":
          return { icon: "checkmark-circle", color: "#16a34a", bg: "#dcfce7" };
        case "delivery":
          return { icon: "cube", color: "#2563eb", bg: "#dbeafe" };
        case "storage":
          return { icon: "time", color: "#d97706", bg: "#fef3c7" };
        case "refund":
          return { icon: "arrow-undo", color: "#7c3aed", bg: "#ede9fe" };
        default:
          return { icon: "ellipse", color: "#6b7280", bg: "#f3f4f6" };
      }
    },
    [],
  );

  // ── Pull to Refresh ──────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchProfile(),
        refetchBooking(),
        refetchActivity(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchProfile, refetchBooking, refetchActivity]);

  // ── Scroll Handler ───────────────────────────────────────────────────
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // ── Animated Header ──────────────────────────────────────────────────
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 100], [1, 0.95]),
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 100], [0, -10], "clamp"),
      },
    ],
  }));

  // ── Loading State ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.PRIMARY} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────
  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline" size={64} color={THEME.TEXT_MUTED} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSubtitle}>
          We couldn't load your dashboard
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <AnimatedScrollView
      showsVerticalScrollIndicator={false}
      style={styles.container}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      scrollEnabled={true}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={THEME.PRIMARY}
          colors={[THEME.PRIMARY]}
        />
      }
    >
      <BackgroundGradient
        primaryColor={THEME.PRIMARY}
        secondaryColor={THEME.SECONDARY}
        bottomColor={THEME.BACKGROUND_LIGHT}
      >
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <SafeAreaView edges={["top"]} style={styles.header}>
          <Animated.View style={[styles.headerContent, headerAnimatedStyle]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.locationContentHeader}
                onPress={() => router.push("/addresses")}
                accessibilityLabel={`Your address: ${displayAddress}`}
                accessibilityRole="button"
              >
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color={THEME.PRIMARY}
                />
                <View style={styles.headerLocationTextContainer}>
                  <Text style={styles.headerLocationLabel}>YOUR LOCATION</Text>
                  <Text style={styles.headerLocationValue} numberOfLines={1}>
                    {displayAddress}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={THEME.TEXT_MUTED}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => router.push("/profile")}
                style={styles.avatarContainerHeader}
                accessibilityLabel="Go to profile"
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={[THEME.PRIMARY, THEME.SECONDARY]}
                  style={styles.avatarGradientSmall}
                >
                  <Text style={styles.avatarTextSmall}>{initials}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>

        {/* HOW IT WORKS */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.bannerContainer}
            // onPress={() => router.push("/how-it-works")}
            accessibilityLabel="Learn how luggage storage works"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={[THEME.PRIMARY, THEME.SECONDARY]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerHeader}>
                <View>
                  <Text style={styles.bannerTitle}>How it works</Text>
                  <Text style={styles.bannerSubtitle}>
                    Hassle-free luggage management
                  </Text>
                </View>
                <View style={styles.bannerIcon}>
                  <Ionicons
                    name="information-circle"
                    size={24}
                    color="rgba(255,255,255,0.6)"
                  />
                </View>
              </View>

              <View style={styles.stepContainer}>
                <StepItem step={1} icon="calendar-today" label="Book" />
                <StepConnector />
                <StepItem step={2} icon="person-search" label="Pickup" />
                <StepConnector />
                <StepItem step={3} icon="lock" label="Store" />
                <StepConnector />
                <StepItem step={4} icon="local-shipping" label="Deliver" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </BackgroundGradient>

      <View style={styles.scrollContent}>
        {/* ── BOOK NOW CTA ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.bookNowWrapper}>
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => router.push("/book-now")}
            style={styles.bookNowButton}
            accessibilityLabel="Book new storage"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={[THEME.PRIMARY, THEME.SECONDARY]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.bookNowGradient}
            >
              <View style={styles.bookNowIconWrap}>
                 <LinearGradient
                   colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
                   style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                 />
                <Ionicons name="add-circle" size={28} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookNowTitle}>Start New Booking</Text>
                <Text style={styles.bookNowSubtitle}>Secure storage in just a few taps</Text>
              </View>
              <View style={styles.bookNowArrow}>
                <Ionicons name="chevron-forward" size={20} color="#FFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── ACTIVE BOOKING ────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Booking</Text>
            {activeBooking && (
              <TouchableOpacity
                onPress={() => {
                  const bid = activeBooking?._id || activeBooking?.id;
                  if (bid) {
                    router.push({ pathname: "/booking/[id]", params: { id: bid } });
                  }
                }}
                accessibilityLabel="View booking details"
                accessibilityRole="button"
              >
                <Text style={styles.viewAll}>Details</Text>
              </TouchableOpacity>
            )}
          </View>

          {activeBooking ? (
            <ActiveBookingCard
              booking={activeBooking}
              onManage={() => {
                const bid = activeBooking?._id || activeBooking?.id;
                if (bid) {
                  router.push({
                    pathname: "/booking/[id]",
                    params: { id: bid },
                  });
                }
              }}
            />
          ) : (
            <View style={styles.emptyBookingCard}>
              <View style={styles.emptyBookingIconWrap}>
                <Ionicons name="cube-outline" size={36} color={THEME.PRIMARY} />
              </View>
              <Text style={styles.emptyBookingTitle}>No Active Booking</Text>
              <Text style={styles.emptyBookingDesc}>
                You don't have any active storage right now.
              </Text>
              <TouchableOpacity
                style={styles.emptyBookingCta}
                onPress={() => router.push("/book-now")}
                accessibilityLabel="Start a new booking"
                accessibilityRole="button"
              >
                <Text style={styles.emptyBookingCtaText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* ── OFFER BANNER ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <OfferBanner
            title="Experience baggage-free travel"
            description="Book your first storage and get 20% off with code"
            couponCode="WELCOME"
            buttonText="Book Now"
            onPress={() => router.push("/book-now")}
          />
        </Animated.View>

        {/* ── TIPS & SAFETY ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <TipsSafetySection data={tipsData} />
        </Animated.View>

        {/* ── RECENT ACTIVITY ────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(800).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity
              // onPress={() => router.push("/activity")}
              accessibilityLabel="View all activity"
              accessibilityRole="button"
            >
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* TODO: Replace `recentActivity` with real hook data when API is ready */}
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((booking: any, index: number) => {
              const meta = getActivityMeta(booking.status === "completed" ? "storage" : "pickup");
              return (
                <Animated.View
                  key={(booking as any)?._id || (booking as any)?.id || index}
                  entering={FadeInRight.delay(850 + index * 100).springify()}
                >
                  <TouchableOpacity
                    style={styles.activityItem}
                    onPress={() => {
                      const bid = (booking as any)?._id || (booking as any)?.id;
                      if (bid) {
                        router.push({
                          pathname: "/booking/[id]",
                          params: { id: bid },
                        });
                      }
                    }}
                    accessibilityLabel={`Booking ${booking._id}, ${booking.status}`}
                    accessibilityRole="button"
                  >
                    <View
                      style={[
                        styles.activityIcon,
                        { backgroundColor: meta.bg },
                      ]}
                    >
                      <Ionicons name={meta.icon} size={22} color={meta.color} />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle} numberOfLines={1}>
                        Booking #{(((booking as any)?._id || (booking as any)?.id) || "").slice(-4).toUpperCase()}
                      </Text>
                      <Text style={styles.activityDesc} numberOfLines={1}>
                        {booking.pickupLocation?.address || "No address"}
                      </Text>
                    </View>
                    <View style={styles.activityAmountContainer}>
                      <Text
                        style={[
                          styles.activityAmount,
                          {
                            color: THEME.PRIMARY,
                          },
                        ]}
                      >
                        {booking.status.toUpperCase()}
                      </Text>
                      <Text style={styles.activityTime}>
                        {formatDateForDisplay(booking.createdAt)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="No recent activity"
              description="Your booking activity will appear here"
            />
          )}
        </Animated.View>

        {/* ── BOTTOM SPACER ──────────────────────────────────────────── */}
        <View style={styles.bottomSpacer} />
      </View>
    </AnimatedScrollView>
  );
}

// ─── REUSABLE COMPONENTS ──────────────────────────────────────────────────────

const StepItem = ({
  step,
  icon,
  label,
}: {
  step: number;
  icon: MaterialIconName;
  label: string;
}) => (
  <View style={styles.stepItem}>
    <View style={styles.stepNumberContainer}>
      <Text style={styles.stepNumber}>{step}</Text>
    </View>
    <MaterialIcons name={icon} size={18} color="#FFF" />
    <Text style={styles.stepLabel}>{label}</Text>
  </View>
);

const StepConnector = () => (
  <View style={styles.stepConnector}>
    <View style={styles.stepConnectorLine} />
    <Ionicons name="chevron-forward" size={10} color="rgba(255,255,255,0.5)" />
  </View>
);


const ActiveBookingCard = ({
  booking,
  onManage,
}: {
  booking: any;
  onManage: () => void;
}) => {
  const bid = booking?._id || booking?.id;
  const displayId = booking.bookingCode
    ? booking.bookingCode.split("-").pop()
    : bid?.slice(-6).toUpperCase() || "N/A";
    
  const scheduledTime = booking.pickup?.scheduledAt
    ? new Date(booking.pickup.scheduledAt).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "TBD";

  const isStoredMode = booking.status === "in_storage" || booking.status === "at_store" || booking.status === "stored";

  return (
    <View style={styles.activeCard}>
      <LinearGradient
        colors={[THEME.PRIMARY, THEME.SECONDARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.activeCardTopBorder}
      />

      <View style={styles.activeHeader}>
        <View style={styles.activeHeaderLeft}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isStoredMode ? "#22c55e" : THEME.PRIMARY }]} />
            <Text style={styles.activeTitle}>{isStoredMode ? "Stored Securely" : "Pickup Scheduled"}</Text>
          </View>
          <Text style={styles.bookingId}>Order #{displayId}</Text>
        </View>
        <View style={styles.itemCountContainer}>
           <LinearGradient
             colors={[`${THEME.PRIMARY}20`, `${THEME.PRIMARY}05`]}
             style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
           />
          <Text style={styles.itemCount}>{booking.luggage?.totalCount || 0}</Text>
          <Text style={styles.itemLabel}>ITEMS</Text>
        </View>
      </View>

      {booking.pickupLocation?.address ? (
        <View style={styles.bookingLocationRow}>
          <View style={styles.locationSmallIcon}>
            <Ionicons name="location" size={12} color={THEME.PRIMARY} />
          </View>
          <Text style={styles.bookingLocationText} numberOfLines={1}>
            {booking.pickupLocation.address}
          </Text>
        </View>
      ) : null}

      <View style={styles.timerBox}>
        <View style={styles.timerIcon}>
          <Ionicons name="time" size={20} color={THEME.PRIMARY} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.timerLabel}>{isStoredMode ? "STORED SINCE" : "PICKUP WINDOW"}</Text>
          <Text style={styles.timerValue}>{scheduledTime}</Text>
        </View>
        <View
          style={[
            styles.statusChip,
            {
              backgroundColor: isStoredMode ? "#dcfce7" : "#fffbeb",
            },
          ]}
        >
          <Text
            style={[
              styles.statusChipText,
              {
                color: isStoredMode ? "#16a34a" : "#d97706",
              },
            ]}
          >
            {booking.status ? booking.status.replace("_", " ").toUpperCase() : "PENDING"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.manageButton}
        onPress={onManage}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[THEME.PRIMARY, THEME.SECONDARY]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.manageButtonGradient}
        >
          <Text style={styles.manageButtonText}>Manage Your Booking</Text>
          <Ionicons name="chevron-forward" size={16} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const EmptyState = ({
  icon,
  title,
  description,
}: {
  icon: IoniconsName;
  title: string;
  description: string;
}) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name={icon} size={40} color={THEME.TEXT_MUTED} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyDescription}>{description}</Text>
  </View>
);

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },

  // Loading & Error
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
    fontWeight: "600",
    color: THEME.TEXT_DARK,
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: THEME.PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Header
  header: {
    paddingHorizontal: 20,
    backgroundColor: "transparent",
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationContentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLocationTextContainer: {
    maxWidth: width * 0.5,
  },
  headerLocationLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  headerLocationValue: {
    fontSize: 13,
    color: "#FFF",
    fontWeight: "600",
  },
  avatarContainerHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarGradientSmall: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTextSmall: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  greetingBar: {
    marginTop: 4,
  },
  greetingTextMain: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "600",
  },

  // Icon Button
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.04)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  notifBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "700",
  },

  // Book Now CTA
  bookNowWrapper: {
    marginBottom: 24,
  },
  bookNowButton: {
    borderRadius: 18,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: THEME.PRIMARY,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  bookNowGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
    borderRadius: 18,
  },
  bookNowIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  bookNowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  bookNowSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },

  // Empty Active Booking
  emptyBookingCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emptyBookingIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${THEME.PRIMARY}12`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyBookingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 6,
  },
  emptyBookingDesc: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyBookingCta: {
    backgroundColor: THEME.PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBookingCtaText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Banner
  bannerContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  bannerGradient: {
    padding: 20,
    borderRadius: 20,
  },
  bannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  bannerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
  },

  // Steps
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepItem: {
    alignItems: "center",
    gap: 6,
  },
  stepNumberContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  stepNumber: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "700",
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  stepConnector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  stepConnectorLine: {
    width: 16,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 1,
  },

  // Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Active Booking Card
  activeCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: THEME.PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  activeCardTopBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  activeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  bookingId: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    marginTop: 4,
    marginLeft: 18,
  },
  itemCountContainer: {
    alignItems: "center",
    backgroundColor: `${THEME.PRIMARY}10`,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  itemCount: {
    fontSize: 22,
    fontWeight: "700",
    color: THEME.PRIMARY,
    lineHeight: 26,
  },
  itemLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: THEME.TEXT_MUTED,
    letterSpacing: 1,
  },
  activeHeaderLeft: {
    flex: 1,
  },
  locationSmallIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: `${THEME.PRIMARY}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  bookingLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    marginLeft: 18,
  },
  bookingLocationText: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    flex: 1,
  },
  bookNowArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Timer
  timerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.BACKGROUND_LIGHT,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  timerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${THEME.PRIMARY}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: THEME.TEXT_MUTED,
    letterSpacing: 0.5,
  },
  timerValue: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginTop: 2,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: "600",
  },

  // Manage Button
  manageButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  manageButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    gap: 8,
  },
  manageButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.PRIMARY,
  },

  // Activity
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  activityDesc: {
    fontSize: 11,
    color: THEME.TEXT_MUTED,
    marginTop: 2,
  },
  activityAmountContainer: {
    alignItems: "flex-end",
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  activityTime: {
    fontSize: 10,
    color: THEME.TEXT_MUTED,
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.BACKGROUND_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  emptyDescription: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    marginTop: 4,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 100,
  },
});
