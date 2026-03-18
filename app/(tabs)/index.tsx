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
import { THEME } from "@/constants/theme";
import BackgroundGradient from "@/components/ui/BackgroundGradient";
import { useProfile, useNearestStore } from "@/features/user/user.queries";
import { OfferBanner } from "@/components/banner/OfferBanner";
import { TipsSafetySection } from "@/components/carousel/TipsSafetySection";
import { tipsData } from "@/store/tipsData";
import { useRouter } from "expo-router";
import { getInitials } from "@/utils/helper";

const { width } = Dimensions.get("window");
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];
type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const MOCK_NOTIFICATION_COUNT = 3;

const MOCK_ACTIVE_BOOKING = {
  id: "HLD-8392",
  itemCount: 3,
  estimatedReturn: "Today, 2:00 PM",
  status: "active" as const,
  location: "JFK Terminal 4, New York",
};

const MOCK_RECENT_ACTIVITY = [
  {
    id: "act-001",
    title: "Picked up from Airport",
    description: "JFK Terminal 4 • 2 hours ago",
    amount: -24.0,
    type: "pickup" as const,
    timestamp: "2h ago",
  },
  {
    id: "act-002",
    title: "Storage Completed",
    description: "Manhattan Store • Yesterday",
    amount: -18.5,
    type: "storage" as const,
    timestamp: "1d ago",
  },
  {
    id: "act-003",
    title: "Refund Processed",
    description: "Booking #HLD-8201 • 3 days ago",
    amount: 12.0,
    type: "refund" as const,
    timestamp: "3d ago",
  },
];

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

  // TODO: Uncomment when backend APIs are ready
  // const { data: activeBooking, refetch: refetchBooking } = useActiveBooking();
  // const { data: recentActivity, refetch: refetchActivity } = useRecentActivity();
  // const { data: notificationCount } = useNotificationCount();

  // TODO: Remove these when real hooks are implemented
  const activeBooking = MOCK_ACTIVE_BOOKING;
  const recentActivity = MOCK_RECENT_ACTIVITY;
  const notificationCount = MOCK_NOTIFICATION_COUNT;

  // FIX: Remove console.log that exposes user PII in production
  if (__DEV__) {
    console.log("User profile loaded:", user?._id);
  }

  // Memoize computed values
  const initials = useMemo(
    () => getInitials(user?.first_name, user?.last_name) || "?",
    [user?.first_name, user?.last_name],
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const userName = useMemo(() => {
    if (user?.first_name) return user.first_name;
    return "Traveler";
  }, [user?.first_name]);

  // Use actual nearest store data instead of hardcoded address
  const storeAddress = useMemo(() => {
    if (isStoreLoading) return "Finding nearest store...";
    if (nearestStore?.nearest.store_address)
      return nearestStore.nearest.store_address;
    return "No nearby store found";
  }, [isStoreLoading, nearestStore?.nearest.store_address]);

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
        // TODO: Uncomment when real hooks exist
        // refetchBooking(),
        // refetchActivity(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchProfile]);

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
                onPress={() => router.push("/profile")}
                style={styles.avatarContainer}
                accessibilityLabel="Go to profile"
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={[THEME.PRIMARY, THEME.SECONDARY]}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
                <View style={styles.onlineIndicator} />
              </TouchableOpacity>

              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>{greeting} 👋</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {userName}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push("/search")}
                accessibilityLabel="Search"
                accessibilityRole="button"
              >
                <Feather name="search" size={22} color={THEME.TEXT_DARK} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push("/notifications")}
                accessibilityLabel={`Notifications${
                  notificationCount ? `, ${notificationCount} unread` : ""
                }`}
                accessibilityRole="button"
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={THEME.TEXT_DARK}
                />
                {/* Only show badge when there are actual notifications */}
                {notificationCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* LOCATION BAR */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.locationBar}
          >
            <TouchableOpacity
              style={styles.locationContent}
              onPress={() => router.push("/stores")}
              accessibilityLabel={`Nearest store: ${storeAddress}`}
              accessibilityRole="button"
            >
              <View style={styles.locationIconContainer}>
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color={THEME.PRIMARY}
                />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>NEAREST STORE</Text>
                <Text style={styles.locationValue} numberOfLines={1}>
                  {storeAddress}
                </Text>
              </View>
              {/* {storeDistance ? (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>{storeDistance}</Text>
                </View>
              ) : null} */}
              <Ionicons
                name="chevron-forward"
                size={16}
                color={THEME.TEXT_MUTED}
              />
            </TouchableOpacity>
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
        {/* QUICK ACTIONS */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.quickActionsContainer}
        >
          <QuickActionCard
            icon="cube-outline"
            label="Book Storage"
            description="Store your bags"
            color={THEME.PRIMARY}
            onPress={() => router.push("/schedule")}
          />
          <QuickActionCard
            icon="bicycle"
            label="Track Order"
            description="Live tracking"
            color="#2563eb"
            onPress={() => router.push("/myLuggage")}
          />
          <QuickActionCard
            icon="location-outline"
            label="Find Store"
            description="Near you"
            color="#7c3aed"
            onPress={() => router.push("/stores")}
          />
          <QuickActionCard
            icon="help-circle-outline"
            label="Get Help"
            description="24/7 support"
            color="#059669"
            onPress={() => router.push("/support")}
          />
        </Animated.View>
        {/* ── OFFER BANNER ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <OfferBanner
            title="Experience baggage-free travel"
            description="Book your first storage and get 20% off with code"
            couponCode="WELCOME"
            buttonText="Book Now"
            onPress={() => router.push("/schedule")}
          />
        </Animated.View>

        {/* ── TIPS & SAFETY ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <TipsSafetySection data={tipsData} />
        </Animated.View>

        {/* ── ACTIVE STORAGE CARD ────────────────────────────────────── */}
        {/* TODO: Replace `activeBooking` with real hook data when API is ready */}
        {activeBooking && (
          <Animated.View entering={FadeInDown.delay(700).springify()}>
            <ActiveBookingCard
              booking={activeBooking}
              onManage={() =>
                router.push({
                  pathname: "/booking/[id]",
                  params: { id: activeBooking.id },
                })
              }
            />
          </Animated.View>
        )}

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
            recentActivity.slice(0, 5).map((activity, index) => {
              const meta = getActivityMeta(activity.type);
              return (
                <Animated.View
                  key={activity.id}
                  entering={FadeInRight.delay(850 + index * 100).springify()}
                >
                  <TouchableOpacity
                    style={styles.activityItem}
                    // onPress={() =>
                    //   router.push({
                    //     pathname: "/activity/[id]",
                    //     params: { id: activity.id },
                    //   })
                    // }
                    accessibilityLabel={`${activity.title}, ${activity.description}`}
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
                        {activity.title}
                      </Text>
                      <Text style={styles.activityDesc} numberOfLines={1}>
                        {activity.description}
                      </Text>
                    </View>
                    <View style={styles.activityAmountContainer}>
                      <Text
                        style={[
                          styles.activityAmount,
                          {
                            color: activity.amount < 0 ? "#dc2626" : "#16a34a",
                          },
                        ]}
                      >
                        {formatCurrencyTemp(activity.amount)}
                      </Text>
                      <Text style={styles.activityTime}>
                        {activity.timestamp}
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

const QuickActionCard = ({
  icon,
  label,
  description,
  color,
  onPress,
}: {
  icon: IoniconsName;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.quickActionCard, animatedStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      activeOpacity={0.8}
      accessibilityLabel={`${label}: ${description}`}
      accessibilityRole="button"
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
      <Text style={styles.quickActionDesc}>{description}</Text>
    </AnimatedTouchable>
  );
};

const ActiveBookingCard = ({
  booking,
  onManage,
}: {
  booking: {
    id: string;
    itemCount: number;
    estimatedReturn: string;
    status: "active" | "pending" | "completed";
    location: string;
  };
  onManage: () => void;
}) => (
  <View style={styles.activeCard}>
    <LinearGradient
      colors={[THEME.PRIMARY, THEME.SECONDARY]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.activeCardTopBorder}
    />

    <View style={styles.activeHeader}>
      <View>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.activeTitle}>Active Storage</Text>
        </View>
        <Text style={styles.bookingId}>Booking #{booking.id}</Text>
      </View>
      <View style={styles.itemCountContainer}>
        <Text style={styles.itemCount}>{booking.itemCount}</Text>
        <Text style={styles.itemLabel}>ITEMS</Text>
      </View>
    </View>

    {booking.location ? (
      <View style={styles.bookingLocationRow}>
        <Ionicons name="location" size={14} color={THEME.TEXT_MUTED} />
        <Text style={styles.bookingLocationText} numberOfLines={1}>
          {booking.location}
        </Text>
      </View>
    ) : null}

    <View style={styles.timerBox}>
      <View style={styles.timerIcon}>
        <Ionicons name="time-outline" size={20} color={THEME.PRIMARY} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.timerLabel}>ESTIMATED RETURN</Text>
        <Text style={styles.timerValue}>{booking.estimatedReturn}</Text>
      </View>
      <View
        style={[
          styles.statusChip,
          {
            backgroundColor:
              booking.status === "active" ? "#dcfce7" : "#fef3c7",
          },
        ]}
      >
        <Text
          style={[
            styles.statusChipText,
            {
              color: booking.status === "active" ? "#16a34a" : "#d97706",
            },
          ]}
        >
          {booking.status === "active" ? "In Storage" : "Pending"}
        </Text>
      </View>
    </View>

    <TouchableOpacity
      style={styles.manageButton}
      onPress={onManage}
      accessibilityLabel={`Manage booking ${booking.id}`}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={[THEME.PRIMARY, THEME.SECONDARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.manageButtonGradient}
      >
        <Text style={styles.manageButtonText}>Manage Booking</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFF" />
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

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
    gap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  // Avatar
  avatarContainer: {
    position: "relative",
  },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#FFF",
  },

  // Greeting
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
  },
  userName: {
    fontSize: 18,
    color: THEME.TEXT_DARK,
    fontWeight: "700",
    lineHeight: 24,
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

  // Location Bar
  locationBar: {
    marginBottom: 16,
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    padding: 12,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${THEME.PRIMARY}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    color: THEME.TEXT_MUTED,
    fontWeight: "600",
    letterSpacing: 1,
  },
  locationValue: {
    fontSize: 13,
    color: THEME.TEXT_DARK,
    fontWeight: "500",
    marginTop: 1,
  },
  distanceBadge: {
    backgroundColor: `${THEME.PRIMARY}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 10,
    color: THEME.PRIMARY,
    fontWeight: "600",
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
    marginHorizontal: "auto",
  },
  quickActionCard: {
    width: width / 2 - 48,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    color: THEME.TEXT_DARK,
    fontWeight: "600",
  },
  quickActionDesc: {
    fontSize: 11,
    color: THEME.TEXT_MUTED,
    marginTop: 2,
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
