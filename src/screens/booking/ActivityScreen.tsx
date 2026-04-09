import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useBookings, useBookingHistory } from "@/features/booking/bookingQueries";
import { Booking, UserAddress } from "@/features/auth/authTypes";
import { formatDateForDisplay } from "@/utils/date";
import { THEME } from "@/theme/theme";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  Layout,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

type TabType = "History" | "Luggage";

export default function ActivityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: TabType }>();
  const [activeTab, setActiveTab] = useState<TabType>(params.tab || "Luggage");

  // Update tab if params change
  useEffect(() => {
    if (params.tab) {
      setActiveTab(params.tab);
    }
  }, [params.tab]);
  
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allBookings, isLoading: isBookingsLoading, refetch: refetchBookings } = useBookings();
  const { data: historyBookings, isLoading: isHistoryLoading, refetch: refetchHistory } = useBookingHistory();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchBookings(), refetchHistory()]);
    setRefreshing(false);
  }, [refetchBookings, refetchHistory]);

  const luggageItems = useMemo(() => {
    const bookingsArray = Array.isArray(allBookings) 
      ? allBookings 
      : (allBookings as any)?.bookings || [];

    const activeStatuses = ["pickup_scheduled", "at_store", "in_transit", "stored", "return_requested", "return_scheduled"];
    let filtered = bookingsArray.filter((b: Booking) => activeStatuses.includes(b.status.toLowerCase()));
    
    if (searchQuery) {
      filtered = filtered.filter((b: Booking) => 
        b._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.pickupLocation.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [allBookings, searchQuery]);

  const historyItems = useMemo(() => {
    const historyArray = Array.isArray(historyBookings) 
      ? historyBookings 
      : (historyBookings as any)?.bookings || [];

    let filtered = historyArray;
    if (searchQuery) {
      filtered = filtered.filter((b: Booking) => 
        b._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.pickupLocation.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [historyBookings, searchQuery]);

  const isLoading = isBookingsLoading || isHistoryLoading;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── STICKY HEADER ────────────────────────────────────────────── */}
      <View style={styles.headerArea}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>Manage your</Text>
            <Text style={styles.headerTitle}>Activity</Text>
          </View>
          <TouchableOpacity 
            style={styles.headerActionBtn}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={24} color={THEME.TEXT_DARK} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={THEME.TEXT_MUTED} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ID or address"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "Luggage" && styles.activeTab]}
            onPress={() => setActiveTab("Luggage")}
          >
            <Text style={[styles.tabText, activeTab === "Luggage" && styles.activeTabText]}>Current Luggage</Text>
            {activeTab === "Luggage" && <View style={styles.activeTabLine} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "History" && styles.activeTab]}
            onPress={() => setActiveTab("History")}
          >
            <Text style={[styles.tabText, activeTab === "History" && styles.activeTabText]}>History</Text>
            {activeTab === "History" && <View style={styles.activeTabLine} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── LIST CONTENT ─────────────────────────────────────────────── */}
      {isLoading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={THEME.PRIMARY} size="large" />
          <Text style={styles.loadingText}>Fetching activity...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.PRIMARY} />
          }
        >
          {activeTab === "Luggage" ? (
            luggageItems.length > 0 ? (
              <Animated.View entering={FadeInDown.duration(300)}>
                {luggageItems.map((item: Booking, idx: number) => {
                  const bookingId = (item as any)._id || (item as any).id;
                  return (
                    <BookingCard
                      key={bookingId || `luggage-${idx}`}
                      booking={item}
                      index={idx}
                      onPress={() => bookingId && router.push(`/booking/${bookingId}`)}
                    />
                  );
                })}
              </Animated.View>
            ) : (
              <EmptyState 
                title="No active luggage" 
                subtitle="When you schedule a pickup or have items in storage, they'll appear here." 
                icon="cube-outline"
                btnLabel="Book Now"
                onBtnPress={() => router.push("/book-now")}
              />
            )
          ) : (
            historyItems.length > 0 ? (
              <Animated.View entering={FadeInDown.duration(300)}>
                {historyItems.map((item: Booking, idx: number) => {
                  const bookingId = (item as any)._id || (item as any).id;
                  return (
                    <BookingCard
                      key={bookingId || `history-${idx}`}
                      booking={item}
                      index={idx}
                      onPress={() => bookingId && router.push(`/booking/${bookingId}`)}
                    />
                  );
                })}
              </Animated.View>
            ) : (
              <EmptyState 
                title="History is clear" 
                subtitle="Your completed journeys and past bookings will be listed here." 
                icon="time-outline"
              />
            )
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push("/book-now")}
      >
        <LinearGradient
          colors={[THEME.PRIMARY, THEME.SECONDARY]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={30} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ── Booking Card Component ───────────────────────────────────────────────
const BookingCard = ({ booking, onPress, index }: { booking: Booking; onPress: () => void; index: number }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "at_store":
      case "stored":
        return { 
          colors: ["#10B981", "#059669"], 
          label: "In Storage", 
          icon: "shield-check",
          lightBg: "#ECFDF5" 
        };
      case "in_transit":
        return { 
          colors: ["#F97316", "#EA580C"], 
          label: "In Transit", 
          icon: "truck-delivery",
          lightBg: "#FFF7ED" 
        };
      case "pickup_scheduled":
      case "return_scheduled":
        return { 
          colors: ["#3B82F6", "#2563EB"], 
          label: "Scheduled", 
          icon: "calendar-clock",
          lightBg: "#EFF6FF" 
        };
      case "completed":
        return { 
          colors: ["#64748B", "#475569"], 
          label: "Completed", 
          icon: "check-circle",
          lightBg: "#F8FAFC" 
        };
      case "cancelled":
        return { 
          colors: ["#EF4444", "#DC2626"], 
          label: "Cancelled", 
          icon: "close-circle",
          lightBg: "#FEF2F2" 
        };
      default:
        return { 
          colors: [THEME.PRIMARY, THEME.SECONDARY], 
          label: status, 
          icon: "cube",
          lightBg: "#F5F3FF" 
        };
    }
  };

  const config = getStatusConfig(booking.status);
  const formattedDate = formatDateForDisplay(new Date(booking.createdAt));
  const bookingId = (booking as any)._id || (booking as any).id;
  const shortId = bookingId ? bookingId.slice(-8).toUpperCase() : "N/A";

  return (
    <Animated.View entering={FadeInRight.delay(index * 100).duration(400)}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        style={styles.card} 
        onPress={onPress}
        disabled={!bookingId}
      >
        <View style={styles.cardContent}>
          {/* Status Bar */}
          <View style={[styles.statusBar, { backgroundColor: config.colors[0] }]} />
          
          <View style={styles.cardMain}>
            <View style={styles.cardHeader}>
              <View style={styles.idWrap}>
                <Text style={styles.orderIdText}>ORDER #{shortId}</Text>
                <Text style={styles.dateText}>{formattedDate}</Text>
              </View>
              
              <LinearGradient
                colors={[config.colors[0] + '15', config.colors[0] + '05']}
                style={styles.statusBadge}
              >
                <MaterialCommunityIcons name={config.icon as any} size={14} color={config.colors[0]} />
                <Text style={[styles.statusText, { color: config.colors[0] }]}>{config.label}</Text>
              </LinearGradient>
            </View>

            <View style={styles.addressSection}>
              <View style={styles.locIconWrap}>
                 <Ionicons name="location" size={16} color={THEME.PRIMARY} />
              </View>
              <Text style={styles.addressText} numberOfLines={1}>{booking.pickupLocation.address}</Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.detailItem}>
                <Ionicons name="briefcase-outline" size={14} color={THEME.TEXT_MUTED} />
                <Text style={styles.detailText}>{booking.luggage.totalBags} Bags</Text>
              </View>
              <View style={styles.footerDivider} />
              <View style={styles.viewDetailLink}>
                <Text style={styles.viewDetailText}>Manage Booking</Text>
                <Ionicons name="chevron-forward" size={12} color={THEME.PRIMARY} />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const EmptyState = ({ title, subtitle, icon, btnLabel, onBtnPress }: any) => (
  <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyContainer}>
    <View style={styles.emptyIconCircle}>
      <Ionicons name={icon} size={64} color="#CBD5E1" />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
    
    {btnLabel && (
      <TouchableOpacity 
        style={styles.emptyBtn} 
        onPress={onBtnPress}
      >
        <LinearGradient
          colors={[THEME.PRIMARY, THEME.SECONDARY]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyBtnGradient}
        >
          <Text style={styles.emptyBtnText}>{btnLabel}</Text>
        </LinearGradient>
      </TouchableOpacity>
    )}
  </Animated.View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: THEME.TEXT_DARK_SECONDARY,
    fontWeight: "800",
  },
  
  // Header
  headerArea: {
    backgroundColor: "#FFF",
    paddingHorizontal: 24,
    paddingTop: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: THEME.TEXT_DARK_SECONDARY,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: THEME.TEXT_DARK,
    letterSpacing: -0.5,
  },
  headerActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF4D4D",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  
  searchSection: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    height: 54,
    borderRadius: 18,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: THEME.TEXT_DARK,
    fontWeight: "600",
  },
  
  tabContainer: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 4,
  },
  tab: {
    paddingVertical: 12,
    position: "relative",
  },
  activeTab: {},
  tabText: {
    fontSize: 15,
    fontWeight: "800",
    color: THEME.TEXT_DARK_SECONDARY,
  },
  activeTabText: {
    color: THEME.PRIMARY,
  },
  activeTabLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: THEME.PRIMARY,
    borderRadius: 3,
  },
  
  // List
  scrollContent: {
    padding: 24,
  },
  
  // Card
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  cardContent: {
    flexDirection: "row",
  },
  statusBar: {
    width: 6,
  },
  cardMain: {
    flex: 1,
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  idWrap: {
    flex: 1,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 11,
    color: THEME.TEXT_DARK_SECONDARY,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addressSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  locIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${THEME.PRIMARY}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: THEME.TEXT_DARK,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
    fontWeight: "800",
  },
  footerDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#E2E8F0",
  },
  viewDetailLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailText: {
    fontSize: 12,
    fontWeight: "800",
    color: THEME.PRIMARY,
  },
  
  // Empty
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: THEME.TEXT_DARK,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.TEXT_DARK_SECONDARY,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
    marginBottom: 32,
  },
  emptyBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  emptyBtnGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
  },
  
  // FAB
  fab: {
    position: "absolute",
    bottom: 30,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    ...Platform.select({
      ios: { shadowColor: THEME.PRIMARY, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  fabGradient: {
    flex: 1,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
