import React, { useCallback, useMemo, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { THEME } from "@/theme/theme";
import { useActiveBooking } from "@/features/booking/bookingQueries";
import { formatDateForDisplay } from "@/utils/date";

const { width } = Dimensions.get("window");

// --- UTILS ---
const getStatusMeta = (status: string) => {
  switch (status) {
    case "created":
    case "confirmed":
      return { 
        label: "Finding Driver", 
        color: "#2563eb", 
        icon: "map-marker-radius-outline" as const,
        description: "Our system is assigning the nearest driver to your pickup."
      };
    case "driver_assigned":
    case "pickup_scheduled":
      return { 
        label: "On the way", 
        color: "#7c3aed", 
        icon: "truck-delivery-outline" as const,
        description: "A driver is assigned to your pickup."
      };
    case "picked_up":
      return { 
        label: "Picked Up", 
        color: "#0891b2", 
        icon: "package-variant-closed" as const,
        description: "Your items are with our driver."
      };
    case "in_storage":
    case "at_store":
    case "stored":
      return { 
        label: "Stored Securely", 
        color: "#16a34a", 
        icon: "shield-check-outline" as const,
        description: "Your items are safe in our facility."
      };
    case "no_driver_available":
      return { 
        label: "Driver Search Failed", 
        color: "#ef4444", 
        icon: "alert-circle-outline" as const,
        description: "We couldn't find a driver for your return request. Support has been notified."
      };
    default:
      return { 
        label: status.replace("_", " ").toUpperCase(), 
        color: THEME.TEXT_MUTED, 
        icon: "information-outline" as const,
        description: "Processing your booking..."
      };
  }
};

// --- COMPONENTS ---

const Header = ({ title }: { title: string }) => (
  <SafeAreaView edges={["top"]} style={styles.header}>
    <Text style={styles.headerTitle}>{title}</Text>
  </SafeAreaView>
);

const PulseCircle = ({ delay = 0, size = 120 }: { delay?: number; size?: number }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(withTiming(2.2, { duration: 2500 }), -1, false)
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 2500 }),
          withTiming(0.6, { duration: 0 })
        ),
        -1,
        false
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    width: size,
    height: size,
    borderRadius: size / 2,
    position: "absolute",
    backgroundColor: THEME.PRIMARY,
    borderWidth: 1,
    borderColor: THEME.PRIMARY,
  }));

  return <Animated.View style={animatedStyle} />;
};

const SearchingDriverView = ({ booking }: { booking: any }) => {
  const bookingId = (booking._id || booking.id || "").slice(-8).toUpperCase();
  
  return (
    <Animated.View entering={FadeInDown.duration(800)} style={styles.searchingContainer}>
      <View style={styles.radarWrapper}>
        <PulseCircle delay={0} />
        <PulseCircle delay={800} />
        <PulseCircle delay={1600} />
        
        <View style={styles.radarCenter}>
          <LinearGradient
            colors={[THEME.PRIMARY, THEME.PRIMARY_DARK]}
            style={styles.radarCenterGradient}
          >
            <MaterialCommunityIcons name="map-marker-path" size={32} color="#FFF" />
          </LinearGradient>
        </View>
      </View>

      <View style={styles.searchingTextWrap}>
        <Text style={styles.searchingTitle}>Finding your driver...</Text>
        <Text style={styles.searchingSubtitle}>
          We're connecting you with the nearest partner for your storage pickup.
        </Text>
      </View>

      <View style={styles.searchingDetailsCard}>
        <View style={styles.searchingDetailsHeader}>
          <Text style={styles.searchingDetailsTitle}>ORDER #{bookingId}</Text>
          <View style={styles.searchingBadge}>
            <ActivityIndicator size="small" color={THEME.PRIMARY} style={{ transform: [{ scale: 0.8 }] }} />
            <Text style={styles.searchingBadgeText}>Searching</Text>
          </View>
        </View>
        
        <View style={styles.searchingDetailsRow}>
          <View style={styles.searchingDetailItem}>
            <Text style={styles.searchDetailLabel}>ITEMS</Text>
            <Text style={styles.searchDetailValue}>{booking.luggage?.totalCount || 0} Bags</Text>
          </View>
          <View style={styles.searchingDetailItem}>
            <Text style={styles.searchDetailLabel}>PICKUP</Text>
            <Text style={styles.searchDetailValue}>
              {booking.pickup?.scheduledAt ? formatDateForDisplay(booking.pickup.scheduledAt) : "N/A"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.searchingTipBox}>
        <Ionicons name="flash" size={16} color={THEME.SECONDARY} />
        <Text style={styles.searchingTipText}>Our drivers usually arrive within minutes of assignment.</Text>
      </View>
    </Animated.View>
  );
};

const NoActiveBookingView = ({ onBookNow }: { onBookNow: () => void }) => (
  <Animated.View 
    entering={FadeInDown.duration(600).springify()} 
    style={styles.emptyContainer}
  >
    <View style={styles.emptyIconCircle}>
      <LinearGradient
        colors={[THEME.PRIMARY_LIGHT, THEME.PRIMARY]}
        style={styles.emptyIconGradient}
      >
        <MaterialCommunityIcons name="calendar-clock" size={80} color="#FFF" />
      </LinearGradient>
    </View>
    
    <Text style={styles.emptyTitle}>No Active Storage</Text>
    <Text style={styles.emptySubtitle}>
      Need to store your luggage? Schedule a pickup and travel light.
    </Text>
    
    <TouchableOpacity 
      style={styles.bookNowCta}
      onPress={onBookNow}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[THEME.SECONDARY, THEME.SECONDARY_DARK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.ctaGradient}
      >
        <Text style={styles.ctaText}>Book Now</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFF" />
      </LinearGradient>
    </TouchableOpacity>
  </Animated.View>
);

const ActiveBookingView = ({ booking, onManage }: { booking: any; onManage: () => void }) => {
  const meta = useMemo(() => getStatusMeta(booking.status), [booking.status]);
  const bookingId = (booking._id || booking.id || "").slice(-8).toUpperCase();
  
  return (
    <Animated.View entering={FadeInUp.duration(600)} style={styles.activeContainer}>
      {/* Status Card */}
      <View style={styles.statusCard}>
        <LinearGradient
          colors={[`${meta.color}20`, "transparent"]}
          style={styles.statusCardGradient}
        />
        <View style={styles.statusHeader}>
          <View style={[styles.statusBadge, { backgroundColor: meta.color }]}>
            <MaterialCommunityIcons name={meta.icon} size={20} color="#FFF" />
            <Text style={styles.statusBadgeText}>{meta.label}</Text>
          </View>
          <Text style={styles.orderId}>ORDER #{bookingId}</Text>
        </View>
        
        <Text style={styles.statusDescription}>{meta.description}</Text>
        
        <View style={styles.divider} />
        
        {/* Booking Brief */}
        <View style={styles.briefRow}>
          <View style={styles.briefItem}>
            <Text style={styles.briefLabel}>ITEMS</Text>
            <Text style={styles.briefValue}>{booking.luggage?.totalCount || 0} Bags</Text>
          </View>
          <View style={styles.briefItem}>
            <Text style={styles.briefLabel}>SCHEDULED</Text>
            <Text style={styles.briefValue}>
              {booking.pickup?.scheduledAt ? formatDateForDisplay(booking.pickup.scheduledAt) : "N/A"}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="call-outline" size={20} color={THEME.PRIMARY} />
            </View>
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="navigate-outline" size={20} color={THEME.PRIMARY} />
            </View>
            <Text style={styles.actionLabel}>Route</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="chatbubble-outline" size={20} color={THEME.PRIMARY} />
            </View>
            <Text style={styles.actionLabel}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Primary CTA */}
      <TouchableOpacity 
        style={styles.manageCta}
        onPress={onManage}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[THEME.PRIMARY, THEME.PRIMARY_DARK]}
          style={styles.manageGradient}
        >
          <Text style={styles.manageText}>Manage Booking Details</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Supporting Text */}
      <View style={styles.helpBox}>
        <Ionicons name="information-circle-outline" size={20} color={THEME.TEXT_MUTED} />
        <Text style={styles.helpText}>
          You can track your driver or extend your storage time in the manage details section.
        </Text>
      </View>
    </Animated.View>
  );
};

export default function ScheduleScreen() {
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const { data: activeBookingResponse, isLoading, isError, refetch } = useActiveBooking();

  const activeBooking = useMemo(() => {
    if (!activeBookingResponse) return null;
    return activeBookingResponse.bookings?.[0] || 
           (activeBookingResponse._id ? activeBookingResponse : null);
  }, [activeBookingResponse]);

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.PRIMARY} />
        <Text style={styles.loadingText}>Synchronizing your schedule...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={64} color={THEME.TEXT_MUTED} />
        <Text style={styles.errorTitle}>Connection Issues</Text>
        <Text style={styles.errorSubtitle}>We couldn't reach the server. Please check your internet.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Your Schedule" />
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={false} 
            onRefresh={onRefresh} 
            tintColor={THEME.PRIMARY} 
          />
        }
      >
        {activeBooking ? (
          activeBooking.status === "created" || activeBooking.status === "confirmed" ? (
            <SearchingDriverView booking={activeBooking} />
          ) : (
            <ActiveBookingView 
              booking={activeBooking} 
              onManage={() => {
                const bid = activeBooking._id || activeBooking.id;
                router.push({ pathname: "/booking/[id]", params: { id: bid } });
              }}
            />
          )
        ) : (
          <NoActiveBookingView onBookNow={() => router.push("/book-now")} />
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },
  header: {
    backgroundColor: THEME.BACKGROUND_LIGHT,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginTop: 10,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },
  loadingText: {
    marginTop: 12,
    color: THEME.TEXT_MUTED,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
    marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 14,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: THEME.PRIMARY,
  },
  retryText: {
    color: "#FFF",
    fontWeight: "600",
  },

  // Searching Animation Styles
  searchingContainer: {
    alignItems: "center",
    paddingTop: 20,
  },
  radarWrapper: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  radarCenter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFF",
    padding: 2,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: THEME.PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  radarCenterGradient: {
    flex: 1,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
  },
  searchingTextWrap: {
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  searchingTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
    marginBottom: 10,
  },
  searchingSubtitle: {
    fontSize: 14,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
    lineHeight: 20,
  },
  searchingDetailsCard: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  searchingDetailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  searchingDetailsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.TEXT_MUTED,
    letterSpacing: 0.5,
  },
  searchingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F7FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  searchingBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.PRIMARY,
  },
  searchingDetailsRow: {
    flexDirection: "row",
    gap: 40,
  },
  searchingDetailItem: {
    gap: 4,
  },
  searchDetailLabel: {
    fontSize: 10,
    color: THEME.TEXT_MUTED,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  searchDetailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  searchingTipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEFCE8",
    padding: 15,
    borderRadius: 16,
    marginTop: 20,
    width: "100%",
  },
  searchingTipText: {
    flex: 1,
    fontSize: 12,
    color: "#854D0E",
    fontWeight: "500",
    lineHeight: 16,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  emptyIconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: "hidden",
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: THEME.PRIMARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  emptyIconGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  bookNowCta: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: THEME.SECONDARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  ctaText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Active State
  activeContainer: {
    gap: 20,
  },
  statusCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    position: "relative",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statusCardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  orderId: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  statusDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 20,
  },
  briefRow: {
    flexDirection: "row",
    gap: 30,
    marginBottom: 24,
  },
  briefItem: {
    gap: 4,
  },
  briefLabel: {
    fontSize: 10,
    color: THEME.TEXT_MUTED,
    fontWeight: "700",
    letterSpacing: 1,
  },
  briefValue: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
  },
  actionButton: {
    alignItems: "center",
    gap: 8,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F8F9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EEF0",
  },
  actionLabel: {
    fontSize: 12,
    color: THEME.TEXT_DARK,
    fontWeight: "500",
  },
  manageCta: {
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: THEME.PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  manageGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  manageText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  helpBox: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: "center",
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    lineHeight: 18,
  },
});
