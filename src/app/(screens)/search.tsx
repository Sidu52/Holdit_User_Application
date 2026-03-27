// ─── app/(tabs)/search.tsx ────────────────────────────────────────────────────

import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Layout,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { THEME } from "@/theme/theme";

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
}

interface SearchFilter {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// TODO: Replace with real API hooks when backend is ready

const MOCK_RECENT_SEARCHES = [
  "JFK Airport Terminal 4",
  "Times Square",
  "Grand Central Station",
  "Brooklyn Bridge",
  "Central Park",
];

const MOCK_POPULAR_LOCATIONS = [
  {
    id: "pop-1",
    name: "JFK International Airport",
    address: "Queens, NY 11430",
    icon: "airplane" as const,
    storeCount: 5,
  },
  {
    id: "pop-2",
    name: "Penn Station",
    address: "234 W 31st St, New York",
    icon: "train" as const,
    storeCount: 3,
  },
  {
    id: "pop-3",
    name: "Times Square",
    address: "Manhattan, NY 10036",
    icon: "business" as const,
    storeCount: 8,
  },
  {
    id: "pop-4",
    name: "Grand Central Terminal",
    address: "89 E 42nd St, New York",
    icon: "train" as const,
    storeCount: 4,
  },
];

const MOCK_SEARCH_RESULTS: Store[] = [
  {
    id: "store-1",
    name: "LuggageHero JFK T4",
    address: "JFK Airport, Terminal 4, Queens, NY",
    distance: "0.3 km",
    rating: 4.8,
    reviewCount: 234,
    isOpen: true,
    hours: "Open 24/7",
    amenities: ["security", "insurance", "large-bags"],
    pricePerDay: 8.95,
  },
  {
    id: "store-2",
    name: "StoreRight Times Square",
    address: "1560 Broadway, New York, NY 10036",
    distance: "1.2 km",
    rating: 4.6,
    reviewCount: 189,
    isOpen: true,
    hours: "8:00 AM - 10:00 PM",
    amenities: ["security", "insurance"],
    pricePerDay: 7.5,
  },
  {
    id: "store-3",
    name: "SafeKeep Grand Central",
    address: "89 E 42nd St, New York, NY 10017",
    distance: "2.1 km",
    rating: 4.9,
    reviewCount: 312,
    isOpen: false,
    hours: "Opens at 7:00 AM",
    amenities: ["security", "insurance", "large-bags", "fragile"],
    pricePerDay: 9.99,
  },
];

const SEARCH_FILTERS: SearchFilter[] = [
  { id: "all", label: "All", icon: "grid-outline" },
  { id: "nearby", label: "Nearby", icon: "location-outline" },
  { id: "open-now", label: "Open Now", icon: "time-outline" },
  { id: "top-rated", label: "Top Rated", icon: "star-outline" },
  { id: "cheapest", label: "Cheapest", icon: "pricetag-outline" },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState(MOCK_RECENT_SEARCHES);

  // TODO: Replace with real API search hook
  // const { data: results, isLoading, mutate: search } = useSearchStores();
  const [results, setResults] = useState<Store[]>([]);
  const isLoading = false;

  const handleSearch = useCallback((text: string) => {
    // Sanitize input
    const sanitized = text.replace(/[<>{}]/g, "");
    setQuery(sanitized);

    if (sanitized.trim().length >= 2) {
      setIsSearching(true);
      setHasSearched(true);

      // TODO: Replace with real API call with debounce
      setTimeout(() => {
        const filtered = MOCK_SEARCH_RESULTS.filter(
          (store) =>
            store.name.toLowerCase().includes(sanitized.toLowerCase()) ||
            store.address.toLowerCase().includes(sanitized.toLowerCase()),
        );
        setResults(filtered);
        setIsSearching(false);
      }, 500);
    } else {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
    }
  }, []);

  const handleSubmitSearch = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    Keyboard.dismiss();

    // Add to recent searches (avoid duplicates, max 10)
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (s) => s.toLowerCase() !== trimmed.toLowerCase(),
      );
      return [trimmed, ...filtered].slice(0, 10);
    });
  }, [query]);

  const handleClearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  }, []);

  const handleRemoveRecentSearch = useCallback((search: string) => {
    setRecentSearches((prev) => prev.filter((s) => s !== search));
  }, []);

  const handleClearAllRecent = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const handleStorePress = useCallback(
    (storeId: string) => {
      router.push({
        pathname: "/stores/[id]",
        params: { id: storeId },
      });
    },
    [router],
  );

  const handlePopularPress = useCallback(
    (locationName: string) => {
      setQuery(locationName);
      handleSearch(locationName);
    },
    [handleSearch],
  );

  // ── Filtered Results ───────────────────────────────────────────────
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    switch (activeFilter) {
      case "open-now":
        filtered = filtered.filter((s) => s.isOpen);
        break;
      case "top-rated":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "cheapest":
        filtered.sort((a, b) => a.pricePerDay - b.pricePerDay);
        break;
      case "nearby":
        filtered.sort(
          (a, b) => parseFloat(a.distance) - parseFloat(b.distance),
        );
        break;
      default:
        break;
    }

    return filtered;
  }, [results, activeFilter]);

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
        </TouchableOpacity>

        <View style={styles.searchInputContainer}>
          <Feather name="search" size={18} color={THEME.TEXT_MUTED} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search stores, airports, stations..."
            placeholderTextColor={THEME.TEXT_MUTED}
            value={query}
            onChangeText={handleSearch}
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={100}
            accessibilityLabel="Search input"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={THEME.TEXT_MUTED}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      {hasSearched && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <FlatList
            horizontal
            data={SEARCH_FILTERS}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  activeFilter === item.id && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(item.id)}
                accessibilityLabel={`Filter: ${item.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: activeFilter === item.id }}
              >
                <Ionicons
                  name={item.icon}
                  size={14}
                  color={activeFilter === item.id ? "#FFF" : THEME.TEXT_DARK}
                />
                <Text
                  style={[
                    styles.filterLabel,
                    activeFilter === item.id && styles.filterLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      )}

      <FlatList
        data={hasSearched ? filteredResults : []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          !hasSearched ? (
            <View>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <Animated.View
                  entering={FadeInDown.delay(100).springify()}
                  style={styles.section}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Searches</Text>
                    <TouchableOpacity
                      onPress={handleClearAllRecent}
                      accessibilityLabel="Clear all recent searches"
                      accessibilityRole="button"
                    >
                      <Text style={styles.clearAll}>Clear All</Text>
                    </TouchableOpacity>
                  </View>

                  {recentSearches.slice(0, 5).map((search, index) => (
                    <Animated.View
                      key={search}
                      entering={FadeInRight.delay(150 + index * 50).springify()}
                    >
                      <TouchableOpacity
                        style={styles.recentItem}
                        onPress={() => {
                          setQuery(search);
                          handleSearch(search);
                        }}
                        accessibilityLabel={`Search for ${search}`}
                        accessibilityRole="button"
                      >
                        <Ionicons
                          name="time-outline"
                          size={18}
                          color={THEME.TEXT_MUTED}
                        />
                        <Text style={styles.recentText} numberOfLines={1}>
                          {search}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveRecentSearch(search)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          accessibilityLabel={`Remove ${search} from recent`}
                          accessibilityRole="button"
                        >
                          <Ionicons
                            name="close"
                            size={16}
                            color={THEME.TEXT_MUTED}
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </Animated.View>
              )}

              {/* Popular Locations */}
              <Animated.View
                entering={FadeInDown.delay(300).springify()}
                style={styles.section}
              >
                <Text style={styles.sectionTitle}>Popular Locations</Text>

                {MOCK_POPULAR_LOCATIONS.map((location, index) => (
                  <Animated.View
                    key={location.id}
                    entering={FadeInRight.delay(350 + index * 80).springify()}
                  >
                    <TouchableOpacity
                      style={styles.popularItem}
                      onPress={() => handlePopularPress(location.name)}
                      accessibilityLabel={`${location.name}, ${location.storeCount} stores`}
                      accessibilityRole="button"
                    >
                      <View style={styles.popularIcon}>
                        <Ionicons
                          name={location.icon}
                          size={20}
                          color={THEME.PRIMARY}
                        />
                      </View>
                      <View style={styles.popularInfo}>
                        <Text style={styles.popularName}>{location.name}</Text>
                        <Text style={styles.popularAddress}>
                          {location.address}
                        </Text>
                      </View>
                      <View style={styles.storeCountBadge}>
                        <Text style={styles.storeCountText}>
                          {location.storeCount} stores
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </Animated.View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          hasSearched && !isSearching ? (
            <Animated.View
              entering={FadeInDown.springify()}
              style={styles.emptyContainer}
            >
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={THEME.TEXT_MUTED}
                />
              </View>
              <Text style={styles.emptyTitle}>No stores found</Text>
              <Text style={styles.emptySubtitle}>
                Try searching for a different location or adjust your filters
              </Text>
            </Animated.View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            layout={Layout.springify()}
          >
            <StoreCard store={item} onPress={() => handleStorePress(item.id)} />
          </Animated.View>
        )}
      />

      {/* Loading Overlay */}
      {isSearching && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={THEME.PRIMARY} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── STORE CARD COMPONENT ─────────────────────────────────────────────────────

const StoreCard = ({
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
      accessibilityLabel={`${store.name}, ${store.distance} away, rated ${store.rating}`}
      accessibilityRole="button"
    >
      {/* Header Row */}
      <View style={styles.storeHeader}>
        <View style={styles.storeNameRow}>
          <Text style={styles.storeName} numberOfLines={1}>
            {store.name}
          </Text>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: store.isOpen ? "#22c55e" : "#ef4444" },
            ]}
          />
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={styles.ratingText}>{store.rating}</Text>
          <Text style={styles.reviewCount}>({store.reviewCount})</Text>
        </View>
      </View>

      {/* Address */}
      <View style={styles.storeAddressRow}>
        <Ionicons name="location-outline" size={14} color={THEME.TEXT_MUTED} />
        <Text style={styles.storeAddress} numberOfLines={1}>
          {store.address}
        </Text>
      </View>

      {/* Details Row */}
      <View style={styles.storeDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="navigate-outline" size={14} color={THEME.PRIMARY} />
          <Text style={styles.detailText}>{store.distance}</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color={THEME.PRIMARY} />
          <Text
            style={[
              styles.detailText,
              { color: store.isOpen ? "#16a34a" : "#ef4444" },
            ]}
          >
            {store.hours}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={styles.priceText}>
          ${store.pricePerDay.toFixed(2)}
          <Text style={styles.priceUnit}>/day</Text>
        </Text>
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

  // Search Header
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    backgroundColor: "#FFF",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.BACKGROUND_LIGHT,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: THEME.TEXT_DARK,
    fontWeight: "400",
  },

  // Filters
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.BACKGROUND_LIGHT,
    gap: 6,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: THEME.PRIMARY,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  filterLabelActive: {
    color: "#FFF",
  },

  // Content
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginTop: 16,
    marginBottom: 12,
  },
  clearAll: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.PRIMARY,
  },

  // Recent Searches
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  recentText: {
    flex: 1,
    fontSize: 14,
    color: THEME.TEXT_DARK,
    fontWeight: "400",
  },

  // Popular Locations
  popularItem: {
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
      android: { elevation: 1 },
    }),
  },
  popularIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: `${THEME.PRIMARY}12`,
    justifyContent: "center",
    alignItems: "center",
  },
  popularInfo: {
    flex: 1,
  },
  popularName: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  popularAddress: {
    fontSize: 11,
    color: THEME.TEXT_MUTED,
    marginTop: 2,
  },
  storeCountBadge: {
    backgroundColor: `${THEME.PRIMARY}12`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  storeCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.PRIMARY,
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
  storeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  storeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400e",
  },
  reviewCount: {
    fontSize: 10,
    color: "#b45309",
  },
  storeAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  storeAddress: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    flex: 1,
  },
  storeDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: "500",
    color: THEME.TEXT_DARK,
  },
  detailDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.PRIMARY,
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: "400",
    color: THEME.TEXT_MUTED,
  },
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

  // Empty State
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.BACKGROUND_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
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

  // Loading
  loadingOverlay: {
    position: "absolute",
    top: 140,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "500",
    color: THEME.TEXT_DARK,
  },
});
