// ─── app/stores.tsx ───────────────────────────────────────────────────────────

import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Layout,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { THEME } from "@/constants/theme";

const { width } = Dimensions.get("window");
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Store {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  hours: string;
  amenities: string[];
  pricePerDay: number;
  image?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity: {
    total: number;
    available: number;
  };
}

type SortOption = "distance" | "rating" | "price" | "availability";
type ViewMode = "list" | "map";


export default function StoresScreen() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortOption>("distance");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);

  // TODO: Replace with real API hook
  // const { data: stores, isLoading, refetch } = useStores();
  const stores = [];
  const isLoading = false;

  // ── Sorted & Filtered Stores ──────────────────────────────────────
  const processedStores = useMemo(() => {
    let filtered = [];

    // Filter open only
    if (showOpenOnly) {
      filtered = filtered.filter((s) => s.isOpen);
    }

    // Sort
    switch (sortBy) {
      case "distance":
        filtered.sort(
          (a, b) => parseFloat(a.distance) - parseFloat(b.distance),
        );
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "price":
        filtered.sort((a, b) => a.pricePerDay - b.pricePerDay);
        break;
      case "availability":
        filtered.sort((a, b) => b.capacity.available - a.capacity.available);
        break;
    }

    return filtered;
  }, [stores, sortBy, showOpenOnly]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleStorePress = useCallback(
    (storeId: string) => {
      //   router.push({
      //     pathname: "/stores/[id]",
      //     params: { id: storeId },
      //   });
    },
    [router],
  );

  const getSortLabel = useCallback((sort: SortOption): string => {
    switch (sort) {
      case "distance":
        return "Nearest";
      case "rating":
        return "Top Rated";
      case "price":
        return "Cheapest";
      case "availability":
        return "Available";
      default:
        return "Sort";
    }
  }, []);

  const sortOptions: {
    value: SortOption;
    label: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
  }[] = [
    { value: "distance", label: "Nearest First", icon: "navigate-outline" },
    { value: "rating", label: "Top Rated", icon: "star-outline" },
    { value: "price", label: "Lowest Price", icon: "pricetag-outline" },
    { value: "availability", label: "Most Available", icon: "cube-outline" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nearby Stores</Text>
          <Text style={styles.headerSubtitle}>
            {processedStores.length} stores found
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/search")}
          style={styles.searchButton}
          accessibilityLabel="Search stores"
          accessibilityRole="button"
        >
          <Feather name="search" size={20} color={THEME.TEXT_DARK} />
        </TouchableOpacity>
      </View>

      {/* Controls Bar */}
      <View style={styles.controlsBar}>
        {/* Sort Button */}
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortSheet(!showSortSheet)}
          accessibilityLabel={`Sort by ${getSortLabel(sortBy)}`}
          accessibilityRole="button"
        >
          <Ionicons name="swap-vertical" size={16} color={THEME.PRIMARY} />
          <Text style={styles.sortButtonText}>{getSortLabel(sortBy)}</Text>
          <Ionicons
            name={showSortSheet ? "chevron-up" : "chevron-down"}
            size={14}
            color={THEME.TEXT_MUTED}
          />
        </TouchableOpacity>

        {/* Open Only Toggle */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            showOpenOnly && styles.toggleButtonActive,
          ]}
          onPress={() => setShowOpenOnly(!showOpenOnly)}
          accessibilityLabel={`${showOpenOnly ? "Show all stores" : "Show only open stores"}`}
          accessibilityRole="switch"
          accessibilityState={{ checked: showOpenOnly }}
        >
          <View
            style={[styles.toggleDot, showOpenOnly && styles.toggleDotActive]}
          />
          <Text
            style={[styles.toggleText, showOpenOnly && styles.toggleTextActive]}
          >
            Open Now
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {/* View Mode Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleBtn,
              viewMode === "list" && styles.viewToggleBtnActive,
            ]}
            onPress={() => setViewMode("list")}
            accessibilityLabel="List view"
            accessibilityRole="button"
          >
            <Ionicons
              name="list"
              size={18}
              color={viewMode === "list" ? "#FFF" : THEME.TEXT_MUTED}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleBtn,
              viewMode === "map" && styles.viewToggleBtnActive,
            ]}
            onPress={() => setViewMode("map")}
            accessibilityLabel="Map view"
            accessibilityRole="button"
          >
            <Ionicons
              name="map"
              size={18}
              color={viewMode === "map" ? "#FFF" : THEME.TEXT_MUTED}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort Dropdown */}
      {showSortSheet && (
        <Animated.View
          entering={FadeInUp.duration(200)}
          style={styles.sortDropdown}
        >
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                sortBy === option.value && styles.sortOptionActive,
              ]}
              onPress={() => {
                setSortBy(option.value);
                setShowSortSheet(false);
              }}
              accessibilityLabel={`Sort by ${option.label}`}
              accessibilityRole="menuitem"
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={
                  sortBy === option.value ? THEME.PRIMARY : THEME.TEXT_MUTED
                }
              />
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Ionicons name="checkmark" size={18} color={THEME.PRIMARY} />
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* Store List */}
      {viewMode === "list" ? (
        <FlatList
          data={processedStores}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={THEME.PRIMARY}
              colors={[THEME.PRIMARY]}
            />
          }
          ListEmptyComponent={
            <Animated.View
              entering={FadeInDown.springify()}
              style={styles.emptyContainer}
            >
              <View style={styles.emptyIconBg}>
                <Ionicons
                  name="storefront-outline"
                  size={48}
                  color={THEME.TEXT_MUTED}
                />
              </View>
              <Text style={styles.emptyTitle}>No stores found</Text>
              <Text style={styles.emptySubtitle}>
                {showOpenOnly
                  ? "No stores are currently open. Try showing all stores."
                  : "No stores available in this area."}
              </Text>
              {showOpenOnly && (
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => setShowOpenOnly(false)}
                >
                  <Text style={styles.emptyActionText}>Show All Stores</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 80).springify()}
              layout={Layout.springify()}
            >
              <StoreListCard
                store={item}
                onPress={() => handleStorePress(item.id)}
              />
            </Animated.View>
          )}
        />
      ) : (
        // Map View Placeholder
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={64} color={THEME.TEXT_MUTED} />
          <Text style={styles.mapPlaceholderTitle}>Map View</Text>
          <Text style={styles.mapPlaceholderSubtitle}>
            Coming soon — Interactive map with store locations
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── STORE LIST CARD ──────────────────────────────────────────────────────────

const StoreListCard = ({
  store,
  onPress,
}: {
  store: Store;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const availabilityPercent = Math.round(
    (store.capacity.available / store.capacity.total) * 100,
  );

  const getAvailabilityColor = () => {
    if (availabilityPercent > 50) return "#16a34a";
    if (availabilityPercent > 20) return "#d97706";
    return "#ef4444";
  };

  return (
    <AnimatedTouchable
      style={[styles.storeCard, animatedStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      activeOpacity={0.9}
      accessibilityLabel={`${store.name}, ${store.distance} away, ${store.rating} stars, $${store.pricePerDay} per day`}
      accessibilityRole="button"
    >
      {/* Top Section */}
      <View style={styles.storeCardTop}>
        <View style={styles.storeCardInfo}>
          <View style={styles.storeNameRow}>
            <Text style={styles.storeName} numberOfLines={1}>
              {store.name}
            </Text>
            <View
              style={[
                styles.openBadge,
                {
                  backgroundColor: store.isOpen ? "#dcfce7" : "#fee2e2",
                },
              ]}
            >
              <View
                style={[
                  styles.openDot,
                  {
                    backgroundColor: store.isOpen ? "#16a34a" : "#ef4444",
                  },
                ]}
              />
              <Text
                style={[
                  styles.openText,
                  { color: store.isOpen ? "#16a34a" : "#ef4444" },
                ]}
              >
                {store.isOpen ? "Open" : "Closed"}
              </Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <Ionicons
              name="location-outline"
              size={13}
              color={THEME.TEXT_MUTED}
            />
            <Text style={styles.addressText} numberOfLines={1}>
              {store.address}
            </Text>
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceValue}>${store.pricePerDay.toFixed(2)}</Text>
          <Text style={styles.priceLabel}>per day</Text>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.storeCardBottom}>
        {/* Distance */}
        <View style={styles.metaItem}>
          <Ionicons name="navigate" size={14} color={THEME.PRIMARY} />
          <Text style={styles.metaText}>{store.distance}</Text>
        </View>

        {/* Rating */}
        <View style={styles.metaItem}>
          <Ionicons name="star" size={14} color="#f59e0b" />
          <Text style={styles.metaText}>
            {store.rating}{" "}
            <Text style={styles.metaSubtext}>({store.reviewCount})</Text>
          </Text>
        </View>

        {/* Hours */}
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={THEME.TEXT_MUTED} />
          <Text style={styles.metaText}>{store.hours}</Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Availability */}
        <View style={styles.availabilityContainer}>
          <View style={styles.availabilityBar}>
            <View
              style={[
                styles.availabilityFill,
                {
                  width: `${availabilityPercent}%`,
                  backgroundColor: getAvailabilityColor(),
                },
              ]}
            />
          </View>
          <Text
            style={[styles.availabilityText, { color: getAvailabilityColor() }]}
          >
            {store.capacity.available} spots
          </Text>
        </View>
      </View>

      {/* Amenities */}
      <View style={styles.amenitiesRow}>
        {store.amenities.map((amenity) => (
          <View key={amenity} style={styles.amenityChip}>
            <Ionicons
              name={getAmenityIcon(amenity)}
              size={10}
              color={THEME.PRIMARY}
            />
            <Text style={styles.amenityText}>{formatAmenity(amenity)}</Text>
          </View>
        ))}
      </View>
    </AnimatedTouchable>
  );
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getAmenityIcon = (
  amenity: string,
): React.ComponentProps<typeof Ionicons>["name"] => {
  switch (amenity) {
    case "security":
      return "shield-checkmark-outline";
    case "insurance":
      return "document-text-outline";
    case "large-bags":
      return "bag-handle-outline";
    case "fragile":
      return "wine-outline";
    default:
      return "checkmark-outline";
  }
};

const formatAmenity = (amenity: string): string => {
  switch (amenity) {
    case "security":
      return "Secured";
    case "insurance":
      return "Insured";
    case "large-bags":
      return "Large Bags";
    case "fragile":
      return "Fragile OK";
    default:
      return amenity;
  }
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BACKGROUND_LIGHT,
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
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  headerSubtitle: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    marginTop: 1,
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },

  // Controls
  controlsBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: `${THEME.PRIMARY}10`,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.PRIMARY,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: THEME.BACKGROUND_LIGHT,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: "#dcfce7",
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.TEXT_MUTED,
  },
  toggleDotActive: {
    backgroundColor: "#16a34a",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.TEXT_MUTED,
  },
  toggleTextActive: {
    color: "#16a34a",
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: THEME.BACKGROUND_LIGHT,
    borderRadius: 10,
    padding: 2,
  },
  viewToggleBtn: {
    width: 34,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  viewToggleBtnActive: {
    backgroundColor: THEME.PRIMARY,
  },

  // Sort Dropdown
  sortDropdown: {
    position: "absolute",
    top: 150,
    left: 16,
    right: 16,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 8,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: `${THEME.PRIMARY}08`,
  },
  sortOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: THEME.TEXT_DARK,
  },
  sortOptionTextActive: {
    color: THEME.PRIMARY,
    fontWeight: "700",
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },

  // Store Card
  storeCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
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
  storeCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  storeCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  storeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    flex: 1,
  },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  openText: {
    fontSize: 10,
    fontWeight: "700",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addressText: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    flex: 1,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "800",
    color: THEME.PRIMARY,
  },
  priceLabel: {
    fontSize: 10,
    color: THEME.TEXT_MUTED,
    marginTop: 1,
  },

  // Bottom Meta
  storeCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "500",
    color: THEME.TEXT_DARK,
  },
  metaSubtext: {
    fontWeight: "400",
    color: THEME.TEXT_MUTED,
  },

  // Availability
  availabilityContainer: {
    alignItems: "flex-end",
    gap: 3,
  },
  availabilityBar: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  availabilityFill: {
    height: "100%",
    borderRadius: 2,
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: "600",
  },

  // Amenities
  amenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${THEME.PRIMARY}08`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  amenityText: {
    fontSize: 10,
    fontWeight: "500",
    color: THEME.PRIMARY,
  },

  // Empty
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: THEME.PRIMARY,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
  },

  // Map Placeholder
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  mapPlaceholderSubtitle: {
    fontSize: 13,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
  },
});
