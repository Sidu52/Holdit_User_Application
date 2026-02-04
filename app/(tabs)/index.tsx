import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import BackgroundGradient from "@/components/ui/BackgroundGradient";
import { useUser, useNearestStore } from "@/features/user/user.queries";
import { OfferBanner } from "@/components/banner/OfferBanner";
import { TipsSafetySection } from "@/components/carousel/TipsSafetySection";
import { tipsData } from "@/store/tipsData";
import { useRouter } from "expo-router";
import { getInitials } from "@/utils/helper";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useUser();
  const { data: nearestStore, isLoading: isLoadingNearestStore } =
    useNearestStore(user?.location?.lat, user?.location?.lng);
  const fullName = `${user.first_name} ${user.last_name}`;
  const initials = getInitials(user.first_name, user.last_name);

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <BackgroundGradient
        primaryColor={THEME.PRIMARY}
        secondaryColor={THEME.SECOUNDARY}
        bottomColor={THEME.LIGHT_BACKGROUND}
      >
        {/* HEADER */}
        <SafeAreaView edges={["top"]} style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="location-on" size={20} color={THEME.PRIMARY} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>NEAREST STORE</Text>
              <Text style={styles.locationValue} numberOfLines={1}>
                124 West 42nd St, NY
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={THEME.TEXT_SUB}
              />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/profile",
                })
              }
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* HOW IT WORKS BANNER */}
        <TouchableOpacity activeOpacity={0.9} style={styles.bannerContainer}>
          <View style={styles.bannerGradient}>
            <View>
              <Text style={styles.bannerTitle}>How it works</Text>
              <Text style={styles.bannerSubtitle}>
                Hassle-free luggage management
              </Text>
            </View>

            <View style={styles.stepContainer}>
              <StepItem icon="calendar-today" label="Book" />
              <View style={styles.stepDivider} />
              <StepItem icon="person-search" label="Pickup" />
              <View style={styles.stepDivider} />
              <StepItem icon="lock" label="Store" />
              <View style={styles.stepDivider} />
              <StepItem icon="local-shipping" label="Delivered" />
            </View>
          </View>
        </TouchableOpacity>
      </BackgroundGradient>
      <View style={styles.scrollContent}>
        {/* QUICK ACTIONS GRID */}
        {/* <View style={styles.grid}>
          <ActionCard
            icon="luggage"
            label="Drop off Bags"
            color="#3b82f6"
            bgColor="#eff6ff"
          />
          <ActionCard
            icon="assignment-return"
            label="Get Bags Back"
            color="#059669"
            bgColor="#ecfdf5"
          />
          <ActionCard
            icon="update"
            label="Extend Time"
            color="#ea580c"
            bgColor="#fff7ed"
          />
          <ActionCard
            icon="support-agent"
            label="Support"
            color="#7c3aed"
            bgColor="#f5f3ff"
          />
        </View> */}
        <OfferBanner
          title="Experience baggage-free travel"
          description="Book your first storage and get 20% off with code"
          couponCode="WELCOME"
          buttonText="Book Now"
          onPress={() => console.log("CTA pressed")}
        />
        <TipsSafetySection data={tipsData} />;{/* ACTIVE STORAGE CARD */}
        <View style={styles.activeCard}>
          <View style={styles.activeHeader}>
            <View>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.activeTitle}>Active Storage</Text>
              </View>
              <Text style={styles.bookingId}>Booking #HLD-8392</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.itemCount}>3</Text>
              <Text style={styles.itemLabel}>ITEMS</Text>
            </View>
          </View>

          <View style={styles.timerBox}>
            <View style={styles.timerIcon}>
              <Ionicons name="time-outline" size={20} color={THEME.PRIMARY} />
            </View>
            <View>
              <Text style={styles.timerLabel}>ESTIMATED RETURN</Text>
              <Text style={styles.timerValue}>Today, 2:00 PM</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.manageButton}>
            <Text style={styles.manageButtonText}>Manage Booking</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
        {/* RECENT ACTIVITY */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityItem}>
          <View style={[styles.activityIcon, { backgroundColor: "#dcfce7" }]}>
            <Ionicons name="checkmark-circle" size={25} color="#16a34a" />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>Picked up from Airport</Text>
            <Text style={styles.activityDesc}>
              JFK Terminal 4 • 2 hours ago
            </Text>
          </View>
          <Text style={styles.activityAmount}>-24.00</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// Reusable Components
const StepItem = ({ icon, label }: { icon: any; label: string }) => (
  <View style={styles.stepItem}>
    <MaterialIcons name={icon} size={14} color="#FFF" />
    <Text style={styles.stepLabel}>{label}</Text>
  </View>
);

const ActionCard = ({ icon, label, color, bgColor }: any) => (
  <TouchableOpacity style={styles.card}>
    <View style={[styles.cardIconBox, { backgroundColor: bgColor }]}>
      <MaterialIcons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.cardLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F5F1" },
  header: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  locationTextContainer: { flex: 1 },
  locationLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
  },
  locationValue: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  notifBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    backgroundColor: "#ef4444",
    borderRadius: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: THEME.TEXT_MAIN,
    fontSize: 15,
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
    flex: 1,
    gap: 20,
  },

  // Banner
  bannerContainer: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    backgroundColor: THEME.PRIMARY,
    overflow: "hidden",
    marginBottom: 20,
  },
  bannerGradient: { flex: 1, padding: 20, justifyContent: "space-between" },
  bannerTitle: { color: "#FFF", fontSize: 20, fontWeight: "900" },
  bannerSubtitle: { color: "#bfdbfe", fontSize: 12, fontWeight: "500" },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 12,
    borderRadius: 15,
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepLabel: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  stepDivider: {
    width: 20,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },

  // Grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 25 },
  card: {
    width: (width - 52) / 2,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
    }),
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardLabel: { fontSize: 12, fontWeight: "700", color: "#334155" },

  // Active Storage
  activeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 25,
  },
  activeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: "#22c55e",
    borderRadius: 4,
  },
  activeTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  bookingId: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 2,
  },
  itemCount: { fontSize: 24, fontWeight: "900", color: THEME.PRIMARY },
  itemLabel: { fontSize: 10, fontWeight: "800", color: "#94a3b8" },
  timerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  timerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  timerLabel: { fontSize: 10, fontWeight: "800", color: "#64748b" },
  timerValue: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  manageButton: {
    backgroundColor: THEME.PRIMARY,
    height: 52,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  manageButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },

  // Activity
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  viewAll: { color: THEME.PRIMARY, fontWeight: "700", fontSize: 14 },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  activityInfo: { flex: 1, marginLeft: 12 },
  activityTitle: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  activityDesc: { fontSize: 11, color: "#64748b", marginTop: 2 },
  activityAmount: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
});
