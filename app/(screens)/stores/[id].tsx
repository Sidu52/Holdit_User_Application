import React, { useState, useCallback, useMemo, useRef } from "react";
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
  interpolate,
  useAnimatedScrollHandler,
  Extrapolation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { THEME } from "@/constants/theme";

const { width, height } = Dimensions.get("window");
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// ─── TYPES ────────────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface StoreDetail {
  id: string;
  name: string;
  address: string;
  fullAddress: string;
  phone: string;
  email: string;
  distance: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  hours: OperatingHours[];
  amenities: Amenity[];
  pricePerDay: number;
  pricePerHour: number;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity: {
    total: number;
    available: number;
  };
  images: string[];
  policies: Policy[];
  reviews: Review[];
}

interface OperatingHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
  isToday: boolean;
}

interface Amenity {
  id: string;
  name: string;
  icon: IoniconsName;
  description: string;
}

interface Policy {
  id: string;
  title: string;
  description: string;
  icon: IoniconsName;
}

interface Review {
  id: string;
  userName: string;
  userInitials: string;
  rating: number;
  comment: string;
  timestamp: string;
  helpfulCount: number;
}

type PricingTab = "hourly" | "daily";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// TODO: Replace with real API hook (useStoreDetail)

const MOCK_STORE: StoreDetail = {
  id: "store-1",
  name: "LuggageHero JFK T4",
  address: "JFK Airport, Terminal 4, Queens, NY",
  fullAddress:
    "JFK International Airport, Terminal 4, Arrivals Hall, Queens, NY 11430",
  phone: "+1 (212) 555-0189",
  email: "jfk-t4@luggagehero.com",
  distance: "0.3 km",
  rating: 4.8,
  reviewCount: 234,
  isOpen: true,
  description:
    "Located inside JFK Terminal 4 arrivals hall, our flagship location offers 24/7 secure luggage storage with full insurance coverage. Perfect for travelers with layovers or early arrivals.",
  coordinates: { lat: 40.6413, lng: -73.7781 },
  capacity: { total: 50, available: 23 },
  pricePerDay: 8.95,
  pricePerHour: 1.5,
  images: [],
  hours: [
    {
      day: "Monday",
      open: "00:00",
      close: "23:59",
      isClosed: false,
      isToday: false,
    },
    {
      day: "Tuesday",
      open: "00:00",
      close: "23:59",
      isClosed: false,
      isToday: true,
    },
    {
      day: "Wednesday",
      open: "00:00",
      close: "23:59",
      isClosed: false,
      isToday: false,
    },
    {
      day: "Thursday",
      open: "00:00",
      close: "23:59",
      isClosed: false,
      isToday: false,
    },
    {
      day: "Friday",
      open: "00:00",
      close: "23:59",
      isClosed: false,
      isToday: false,
    },
    {
      day: "Saturday",
      open: "06:00",
      close: "22:00",
      isClosed: false,
      isToday: false,
    },
    {
      day: "Sunday",
      open: "06:00",
      close: "22:00",
      isClosed: false,
      isToday: false,
    },
  ],
  amenities: [
    {
      id: "a1",
      name: "24/7 Security",
      icon: "shield-checkmark",
      description: "CCTV monitored with on-site security staff",
    },
    {
      id: "a2",
      name: "Full Insurance",
      icon: "document-text",
      description: "Up to $3,000 coverage per bag",
    },
    {
      id: "a3",
      name: "Large Bags",
      icon: "bag-handle",
      description: "Accepts suitcases, ski equipment, strollers",
    },
    {
      id: "a4",
      name: "Fragile Items",
      icon: "wine",
      description: "Special handling for fragile belongings",
    },
    {
      id: "a5",
      name: "Climate Control",
      icon: "thermometer",
      description: "Temperature and humidity controlled storage",
    },
    {
      id: "a6",
      name: "Easy Access",
      icon: "accessibility",
      description: "Wheelchair accessible location",
    },
  ],
  policies: [
    {
      id: "p1",
      title: "Free Cancellation",
      description: "Cancel anytime before drop-off for a full refund",
      icon: "close-circle-outline",
    },
    {
      id: "p2",
      title: "No Hidden Fees",
      description: "Price includes insurance and handling",
      icon: "pricetag-outline",
    },
    {
      id: "p3",
      title: "Flexible Storage",
      description: "Store from 1 hour up to 30 days",
      icon: "time-outline",
    },
    {
      id: "p4",
      title: "Verified Identity",
      description: "All staff are background-checked and trained",
      icon: "person-circle-outline",
    },
  ],
  reviews: [
    {
      id: "r1",
      userName: "Sarah M.",
      userInitials: "SM",
      rating: 5,
      comment:
        "Incredibly convenient location right in the terminal. Staff was friendly and my bags were safe. Highly recommend!",
      timestamp: "2 days ago",
      helpfulCount: 12,
    },
    {
      id: "r2",
      userName: "James K.",
      userInitials: "JK",
      rating: 5,
      comment:
        "Used this service during a 10-hour layover. Drop-off and pickup was seamless. Worth every penny.",
      timestamp: "1 week ago",
      helpfulCount: 8,
    },
    {
      id: "r3",
      userName: "Maria L.",
      userInitials: "ML",
      rating: 4,
      comment:
        "Great service overall. Location was easy to find. Only minor issue was a short wait during peak hours.",
      timestamp: "2 weeks ago",
      helpfulCount: 5,
    },
    {
      id: "r4",
      userName: "David P.",
      userInitials: "DP",
      rating: 5,
      comment:
        "Third time using LuggageHero. Consistent, reliable, and affordable. My go-to for JFK storage.",
      timestamp: "3 weeks ago",
      helpfulCount: 15,
    },
  ],
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function StoreDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollY = useSharedValue(0);

  const [pricingTab, setPricingTab] = useState<PricingTab>("daily");
  const [showAllHours, setShowAllHours] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [bagCount, setBagCount] = useState(1);

  // TODO: Replace with real API hook
  // const { data: store, isLoading, isError } = useStoreDetail(id);
  const store = MOCK_STORE;
  const isLoading = false;
  const isError = false;

  // Validate route param
  if (!id) {
    if (__DEV__) {
      console.warn("Store ID missing from route params");
    }
    router.replace("/stores");
    return null;
  }

  const availabilityPercent = useMemo(
    () => Math.round((store.capacity.available / store.capacity.total) * 100),
    [store.capacity],
  );

  const getAvailabilityColor = useCallback(() => {
    if (availabilityPercent > 50) return "#16a34a";
    if (availabilityPercent > 20) return "#d97706";
    return "#ef4444";
  }, [availabilityPercent]);

  const getAvailabilityLabel = useCallback(() => {
    if (availabilityPercent > 50) return "Good Availability";
    if (availabilityPercent > 20) return "Limited Spots";
    if (availabilityPercent > 0) return "Almost Full";
    return "Full";
  }, [availabilityPercent]);

  const totalPrice = useMemo(() => {
    const rate =
      pricingTab === "daily" ? store.pricePerDay : store.pricePerHour;
    return (rate * bagCount).toFixed(2);
  }, [pricingTab, bagCount, store.pricePerDay, store.pricePerHour]);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0]; // 1-5 stars
    store.reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating - 1]++;
      }
    });
    return dist.reverse(); // 5 stars first
  }, [store.reviews]);

  // ── Scroll Animation ──────────────────────────────────────────────
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 150], [0, 1], Extrapolation.CLAMP),
  }));

  const headerTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [100, 180],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [100, 180],
          [10, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // ── Actions ────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: store.name,
        message: `Check out ${store.name} for luggage storage! Located at ${store.address}. From $${store.pricePerDay}/day.`,
      });
    } catch (err) {
      if (__DEV__) {
        console.error("Share error:", err);
      }
    }
  }, [store]);

  const handleCall = useCallback(() => {
    const phoneUrl = `tel:${store.phone.replace(/[^+0-9]/g, "")}`;
    Linking.canOpenURL(phoneUrl).then((supported) => {
      if (supported) {
        Linking.openURL(phoneUrl);
      }
    });
  }, [store.phone]);

  const handleDirections = useCallback(() => {
    const url = Platform.select({
      ios: `maps:0,0?q=${store.coordinates.lat},${store.coordinates.lng}`,
      android: `geo:${store.coordinates.lat},${store.coordinates.lng}?q=${store.coordinates.lat},${store.coordinates.lng}(${store.name})`,
    });
    if (url) {
      Linking.openURL(url);
    }
  }, [store]);

  const handleBookNow = useCallback(() => {
    router.push({
      pathname: "/schedule",
      params: {
        storeId: store.id,
        storeName: store.name,
        bagCount: bagCount.toString(),
        pricing: pricingTab,
      },
    });
  }, [router, store.id, store.name, bagCount, pricingTab]);

  const incrementBags = useCallback(() => {
    setBagCount((prev) => Math.min(prev + 1, 10));
  }, []);

  const decrementBags = useCallback(() => {
    setBagCount((prev) => Math.max(prev - 1, 1));
  }, []);

  // ── Loading ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.PRIMARY} />
        <Text style={styles.loadingText}>Loading store details...</Text>
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
        <Text style={styles.errorTitle}>Store not found</Text>
        <Text style={styles.errorSubtitle}>
          This store may no longer be available
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

          <Animated.Text
            style={[styles.headerFloatingTitle, headerTitleStyle]}
            numberOfLines={1}
          >
            {store.name}
          </Animated.Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleShare}
              style={styles.headerButton}
              accessibilityLabel="Share store"
              accessibilityRole="button"
            >
              <Ionicons
                name="share-outline"
                size={20}
                color={THEME.TEXT_DARK}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ── CONTENT ────────────────────────────────────────────────── */}
      <AnimatedScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── HERO SECTION ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <LinearGradient
            colors={[THEME.PRIMARY, THEME.SECONDARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroIconContainer}>
                <Ionicons name="storefront" size={40} color="#FFF" />
              </View>
              <Text style={styles.heroStoreName}>{store.name}</Text>

              <View style={styles.heroMeta}>
                <View style={styles.heroMetaItem}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.heroMetaText}>
                    {store.rating}{" "}
                    <Text style={styles.heroMetaSubtext}>
                      ({store.reviewCount} reviews)
                    </Text>
                  </Text>
                </View>
                <View style={styles.heroMetaDot} />
                <View style={styles.heroMetaItem}>
                  <Ionicons
                    name="navigate"
                    size={14}
                    color="rgba(255,255,255,0.7)"
                  />
                  <Text style={styles.heroMetaText}>{store.distance}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.heroStatusBadge,
                  {
                    backgroundColor: store.isOpen
                      ? "rgba(34,197,94,0.2)"
                      : "rgba(239,68,68,0.2)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.heroStatusDot,
                    {
                      backgroundColor: store.isOpen ? "#22c55e" : "#ef4444",
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.heroStatusText,
                    { color: store.isOpen ? "#bbf7d0" : "#fecaca" },
                  ]}
                >
                  {store.isOpen ? "Open Now" : "Currently Closed"}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── QUICK ACTIONS BAR ─────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.quickActionsBar}
        >
          <QuickAction icon="call-outline" label="Call" onPress={handleCall} />
          <QuickAction
            icon="navigate-outline"
            label="Directions"
            onPress={handleDirections}
          />
          <QuickAction
            icon="share-outline"
            label="Share"
            onPress={handleShare}
          />
          <QuickAction
            icon="heart-outline"
            label="Save"
            onPress={() => {
              // TODO: Implement save/favorite
            }}
          />
        </Animated.View>

        {/* ── ADDRESS CARD ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <TouchableOpacity
            style={styles.addressCard}
            onPress={handleDirections}
            accessibilityLabel={`Address: ${store.fullAddress}. Tap for directions.`}
            accessibilityRole="button"
          >
            <View style={styles.addressIconContainer}>
              <Ionicons name="location" size={22} color={THEME.PRIMARY} />
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressTitle}>Address</Text>
              <Text style={styles.addressText}>{store.fullAddress}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={THEME.TEXT_MUTED} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── ABOUT ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <SectionCard title="About This Store">
            <Text style={styles.descriptionText}>{store.description}</Text>
          </SectionCard>
        </Animated.View>

        {/* ── AVAILABILITY ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <SectionCard title="Availability">
            <View style={styles.availabilityRow}>
              <View style={styles.availabilityInfo}>
                <Text
                  style={[
                    styles.availabilityLabel,
                    { color: getAvailabilityColor() },
                  ]}
                >
                  {getAvailabilityLabel()}
                </Text>
                <Text style={styles.availabilityCount}>
                  {store.capacity.available} of {store.capacity.total} spots
                  available
                </Text>
              </View>
              <View style={styles.availabilityCircle}>
                <Text
                  style={[
                    styles.availabilityPercent,
                    { color: getAvailabilityColor() },
                  ]}
                >
                  {availabilityPercent}%
                </Text>
              </View>
            </View>

            <View style={styles.availabilityBarContainer}>
              <View style={styles.availabilityBarBg}>
                <Animated.View
                  style={[
                    styles.availabilityBarFill,
                    {
                      width: `${availabilityPercent}%`,
                      backgroundColor: getAvailabilityColor(),
                    },
                  ]}
                />
              </View>
            </View>
          </SectionCard>
        </Animated.View>

        {/* ── PRICING ───────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <SectionCard title="Pricing">
            {/* Pricing Tabs */}
            <View style={styles.pricingTabs}>
              <TouchableOpacity
                style={[
                  styles.pricingTab,
                  pricingTab === "hourly" && styles.pricingTabActive,
                ]}
                onPress={() => setPricingTab("hourly")}
                accessibilityRole="tab"
                accessibilityState={{ selected: pricingTab === "hourly" }}
              >
                <Text
                  style={[
                    styles.pricingTabText,
                    pricingTab === "hourly" && styles.pricingTabTextActive,
                  ]}
                >
                  Per Hour
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pricingTab,
                  pricingTab === "daily" && styles.pricingTabActive,
                ]}
                onPress={() => setPricingTab("daily")}
                accessibilityRole="tab"
                accessibilityState={{ selected: pricingTab === "daily" }}
              >
                <Text
                  style={[
                    styles.pricingTabText,
                    pricingTab === "daily" && styles.pricingTabTextActive,
                  ]}
                >
                  Per Day
                </Text>
              </TouchableOpacity>
            </View>

            {/* Price Display */}
            <View style={styles.priceDisplay}>
              <View>
                <Text style={styles.priceMainValue}>
                  $
                  {pricingTab === "daily"
                    ? store.pricePerDay.toFixed(2)
                    : store.pricePerHour.toFixed(2)}
                </Text>
                <Text style={styles.pricePerUnit}>
                  per bag / {pricingTab === "daily" ? "day" : "hour"}
                </Text>
              </View>

              {/* Bag Counter */}
              <View style={styles.bagCounter}>
                <Text style={styles.bagCounterLabel}>Bags</Text>
                <View style={styles.bagCounterControls}>
                  <TouchableOpacity
                    onPress={decrementBags}
                    style={[
                      styles.counterButton,
                      bagCount <= 1 && styles.counterButtonDisabled,
                    ]}
                    disabled={bagCount <= 1}
                    accessibilityLabel="Decrease bag count"
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={bagCount <= 1 ? THEME.TEXT_MUTED : THEME.PRIMARY}
                    />
                  </TouchableOpacity>
                  <Text style={styles.bagCountText}>{bagCount}</Text>
                  <TouchableOpacity
                    onPress={incrementBags}
                    style={[
                      styles.counterButton,
                      bagCount >= 10 && styles.counterButtonDisabled,
                    ]}
                    disabled={bagCount >= 10}
                    accessibilityLabel="Increase bag count"
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={bagCount >= 10 ? THEME.TEXT_MUTED : THEME.PRIMARY}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Estimated Total */}
            <View style={styles.estimatedTotal}>
              <Text style={styles.estimatedLabel}>Estimated Total</Text>
              <Text style={styles.estimatedValue}>${totalPrice}</Text>
            </View>
          </SectionCard>
        </Animated.View>

        {/* ── AMENITIES ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <SectionCard title="Amenities & Features">
            <View style={styles.amenitiesGrid}>
              {store.amenities.map((amenity, index) => (
                <Animated.View
                  key={amenity.id}
                  entering={FadeInRight.delay(450 + index * 60).springify()}
                  style={styles.amenityCard}
                >
                  <View style={styles.amenityIconContainer}>
                    <Ionicons
                      name={amenity.icon}
                      size={22}
                      color={THEME.PRIMARY}
                    />
                  </View>
                  <Text style={styles.amenityName}>{amenity.name}</Text>
                  <Text style={styles.amenityDesc} numberOfLines={2}>
                    {amenity.description}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </SectionCard>
        </Animated.View>

        {/* ── OPERATING HOURS ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(450).springify()}>
          <SectionCard title="Operating Hours">
            {(showAllHours
              ? store.hours
              : store.hours.filter((h) => h.isToday)
            ).map((hours) => (
              <View
                key={hours.day}
                style={[styles.hoursRow, hours.isToday && styles.hoursRowToday]}
              >
                <View style={styles.hoursDayContainer}>
                  <Text
                    style={[
                      styles.hoursDay,
                      hours.isToday && styles.hoursDayToday,
                    ]}
                  >
                    {hours.day}
                  </Text>
                  {hours.isToday && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>Today</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.hoursTime,
                    hours.isClosed && styles.hoursTimeClosed,
                  ]}
                >
                  {hours.isClosed
                    ? "Closed"
                    : hours.open === "00:00" && hours.close === "23:59"
                      ? "Open 24 Hours"
                      : `${hours.open} - ${hours.close}`}
                </Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.showAllButton}
              onPress={() => setShowAllHours(!showAllHours)}
              accessibilityLabel={
                showAllHours ? "Show less hours" : "Show all hours"
              }
              accessibilityRole="button"
            >
              <Text style={styles.showAllText}>
                {showAllHours ? "Show Less" : "Show All Hours"}
              </Text>
              <Ionicons
                name={showAllHours ? "chevron-up" : "chevron-down"}
                size={16}
                color={THEME.PRIMARY}
              />
            </TouchableOpacity>
          </SectionCard>
        </Animated.View>

        {/* ── POLICIES ──────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <SectionCard title="Policies">
            {store.policies.map((policy, index) => (
              <Animated.View
                key={policy.id}
                entering={FadeInRight.delay(550 + index * 60).springify()}
              >
                <View style={styles.policyItem}>
                  <View style={styles.policyIconContainer}>
                    <Ionicons
                      name={policy.icon}
                      size={18}
                      color={THEME.PRIMARY}
                    />
                  </View>
                  <View style={styles.policyContent}>
                    <Text style={styles.policyTitle}>{policy.title}</Text>
                    <Text style={styles.policyDesc}>{policy.description}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </SectionCard>
        </Animated.View>

        {/* ── REVIEWS ───────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(550).springify()}>
          <SectionCard
            title="Reviews"
            rightAction={
              <TouchableOpacity
                onPress={() => setShowAllReviews(!showAllReviews)}
                accessibilityLabel={
                  showAllReviews ? "Show fewer reviews" : "See all reviews"
                }
                accessibilityRole="button"
              >
                <Text style={styles.seeAllReviews}>
                  {showAllReviews ? "Show Less" : "See All"}
                </Text>
              </TouchableOpacity>
            }
          >
            {/* Rating Summary */}
            <View style={styles.ratingSummary}>
              <View style={styles.ratingBig}>
                <Text style={styles.ratingBigNumber}>{store.rating}</Text>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={
                        star <= Math.floor(store.rating)
                          ? "star"
                          : star <= store.rating + 0.5
                            ? "star-half"
                            : "star-outline"
                      }
                      size={14}
                      color="#f59e0b"
                    />
                  ))}
                </View>
                <Text style={styles.ratingCount}>
                  {store.reviewCount} reviews
                </Text>
              </View>

              <View style={styles.ratingBars}>
                {ratingDistribution.map((count, index) => {
                  const starNum = 5 - index;
                  const percent =
                    store.reviews.length > 0
                      ? (count / store.reviews.length) * 100
                      : 0;
                  return (
                    <View key={starNum} style={styles.ratingBarRow}>
                      <Text style={styles.ratingBarLabel}>{starNum}</Text>
                      <Ionicons name="star" size={10} color="#f59e0b" />
                      <View style={styles.ratingBarBg}>
                        <View
                          style={[
                            styles.ratingBarFill,
                            { width: `${percent}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.ratingBarCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Review Cards */}
            {(showAllReviews ? store.reviews : store.reviews.slice(0, 2)).map(
              (review, index) => (
                <Animated.View
                  key={review.id}
                  entering={FadeInDown.delay(600 + index * 80).springify()}
                >
                  <ReviewCard review={review} />
                </Animated.View>
              ),
            )}
          </SectionCard>
        </Animated.View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </AnimatedScrollView>

      {/* ── BOTTOM CTA BAR ─────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInUp.delay(300).springify()}
        style={styles.bottomBar}
      >
        <View style={styles.bottomBarContent}>
          <View style={styles.bottomPriceContainer}>
            <Text style={styles.bottomPriceLabel}>
              Total for {bagCount} bag{bagCount > 1 ? "s" : ""}
            </Text>
            <Text style={styles.bottomPriceValue}>${totalPrice}</Text>
          </View>

          <TouchableOpacity
            onPress={handleBookNow}
            style={[
              styles.bookButton,
              !store.isOpen && styles.bookButtonDisabled,
            ]}
            disabled={!store.isOpen || store.capacity.available === 0}
            accessibilityLabel={`Book storage for ${bagCount} bags at $${totalPrice}`}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={
                store.isOpen && store.capacity.available > 0
                  ? [THEME.PRIMARY, THEME.SECONDARY]
                  : ["#9ca3af", "#9ca3af"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookButtonGradient}
            >
              <Text style={styles.bookButtonText}>
                {!store.isOpen
                  ? "Store Closed"
                  : store.capacity.available === 0
                    ? "No Spots Available"
                    : "Book Now"}
              </Text>
              {store.isOpen && store.capacity.available > 0 && (
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── SUB COMPONENTS ───────────────────────────────────────────────────────────

const SectionCard = ({
  title,
  children,
  rightAction,
}: {
  title: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionCardHeader}>
      <Text style={styles.sectionCardTitle}>{title}</Text>
      {rightAction}
    </View>
    {children}
  </View>
);

const QuickAction = ({
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
      style={[styles.quickAction, animatedStyle]}
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

const ReviewCard = ({ review }: { review: Review }) => (
  <View style={styles.reviewCard}>
    <View style={styles.reviewHeader}>
      <View style={styles.reviewAvatar}>
        <Text style={styles.reviewAvatarText}>{review.userInitials}</Text>
      </View>
      <View style={styles.reviewUserInfo}>
        <Text style={styles.reviewUserName}>{review.userName}</Text>
        <Text style={styles.reviewTimestamp}>{review.timestamp}</Text>
      </View>
      <View style={styles.reviewRating}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= review.rating ? "star" : "star-outline"}
            size={12}
            color="#f59e0b"
          />
        ))}
      </View>
    </View>
    <Text style={styles.reviewComment}>{review.comment}</Text>
    <View style={styles.reviewFooter}>
      <TouchableOpacity
        style={styles.helpfulButton}
        accessibilityLabel={`${review.helpfulCount} people found this helpful`}
        accessibilityRole="button"
      >
        <Ionicons name="thumbs-up-outline" size={14} color={THEME.TEXT_MUTED} />
        <Text style={styles.helpfulText}>Helpful ({review.helpfulCount})</Text>
      </TouchableOpacity>
    </View>
  </View>
);

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
  headerFloatingTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },

  // Scroll
  scrollContent: {
    paddingBottom: 120,
  },

  // Hero
  heroGradient: {
    paddingTop: 110,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: "center",
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroStoreName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 12,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  heroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroMetaText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  heroMetaSubtext: {
    fontWeight: "400",
    color: "rgba(255,255,255,0.7)",
  },
  heroMetaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  heroStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  heroStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroStatusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Quick Actions
  quickActionsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    paddingHorizontal: 20,
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
  quickAction: {
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

  // Address Card
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    gap: 12,
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
  addressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${THEME.PRIMARY}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  addressContent: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    fontWeight: "500",
    color: THEME.TEXT_DARK,
    lineHeight: 18,
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
  sectionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },

  // Description
  descriptionText: {
    fontSize: 14,
    color: THEME.TEXT_MUTED,
    lineHeight: 22,
  },

  // Availability
  availabilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  availabilityCount: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
  },
  availabilityCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: THEME.BACKGROUND_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  availabilityPercent: {
    fontSize: 16,
    fontWeight: "800",
  },
  availabilityBarContainer: {
    marginTop: 4,
  },
  availabilityBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.BACKGROUND_LIGHT,
    overflow: "hidden",
  },
  availabilityBarFill: {
    height: "100%",
    borderRadius: 4,
  },

  // Pricing
  pricingTabs: {
    flexDirection: "row",
    backgroundColor: THEME.BACKGROUND_LIGHT,
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  pricingTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  pricingTabActive: {
    backgroundColor: "#FFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  pricingTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.TEXT_MUTED,
  },
  pricingTabTextActive: {
    color: THEME.TEXT_DARK,
  },
  priceDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  priceMainValue: {
    fontSize: 32,
    fontWeight: "800",
    color: THEME.PRIMARY,
  },
  pricePerUnit: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    marginTop: 2,
  },
  bagCounter: {
    alignItems: "center",
    gap: 6,
  },
  bagCounterLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bagCounterControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.BACKGROUND_LIGHT,
    borderRadius: 12,
    gap: 4,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  counterButtonDisabled: {
    opacity: 0.4,
  },
  bagCountText: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    minWidth: 28,
    textAlign: "center",
  },
  estimatedTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: 16,
  },
  estimatedLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: THEME.TEXT_MUTED,
  },
  estimatedValue: {
    fontSize: 22,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },

  // Amenities
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  amenityCard: {
    width: (width - 72) / 2,
    backgroundColor: THEME.BACKGROUND_LIGHT,
    borderRadius: 14,
    padding: 14,
  },
  amenityIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: `${THEME.PRIMARY}12`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  amenityName: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 4,
  },
  amenityDesc: {
    fontSize: 11,
    color: THEME.TEXT_MUTED,
    lineHeight: 15,
  },

  // Hours
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  hoursRowToday: {
    backgroundColor: `${THEME.PRIMARY}06`,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 0,
  },
  hoursDayContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hoursDay: {
    fontSize: 14,
    fontWeight: "500",
    color: THEME.TEXT_DARK,
  },
  hoursDayToday: {
    fontWeight: "700",
    color: THEME.PRIMARY,
  },
  todayBadge: {
    backgroundColor: THEME.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFF",
  },
  hoursTime: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  hoursTimeClosed: {
    color: "#ef4444",
  },
  showAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 14,
    gap: 4,
  },
  showAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.PRIMARY,
  },

  // Policies
  policyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  policyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${THEME.PRIMARY}10`,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  policyContent: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
    marginBottom: 2,
  },
  policyDesc: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    lineHeight: 17,
  },

  // Reviews
  seeAllReviews: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.PRIMARY,
  },
  ratingSummary: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  ratingBig: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.06)",
  },
  ratingBigNumber: {
    fontSize: 40,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
    lineHeight: 44,
  },
  ratingStars: {
    flexDirection: "row",
    gap: 2,
    marginVertical: 4,
  },
  ratingCount: {
    fontSize: 11,
    color: THEME.TEXT_MUTED,
  },
  ratingBars: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  ratingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingBarLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.TEXT_MUTED,
    width: 10,
    textAlign: "right",
  },
  ratingBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.BACKGROUND_LIGHT,
    overflow: "hidden",
  },
  ratingBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#f59e0b",
  },
  ratingBarCount: {
    fontSize: 11,
    fontWeight: "500",
    color: THEME.TEXT_MUTED,
    width: 16,
    textAlign: "right",
  },

  // Review Card
  reviewCard: {
    backgroundColor: THEME.BACKGROUND_LIGHT,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${THEME.PRIMARY}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewAvatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.PRIMARY,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  reviewTimestamp: {
    fontSize: 11,
    color: THEME.TEXT_MUTED,
    marginTop: 1,
  },
  reviewRating: {
    flexDirection: "row",
    gap: 1,
  },
  reviewComment: {
    fontSize: 13,
    color: THEME.TEXT_DARK,
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewFooter: {
    flexDirection: "row",
  },
  helpfulButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  helpfulText: {
    fontSize: 11,
    fontWeight: "500",
    color: THEME.TEXT_MUTED,
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
    fontSize: 24,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
    marginTop: 2,
  },
  bookButton: {
    flex: 1.2,
    borderRadius: 16,
    overflow: "hidden",
  },
  bookButtonDisabled: {
    opacity: 0.7,
  },
  bookButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 40,
  },
});
