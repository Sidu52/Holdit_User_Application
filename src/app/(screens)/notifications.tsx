// ─── app/notifications.tsx ────────────────────────────────────────────────────

import React, { useState, useCallback, useMemo } from "react";
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
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  Layout,
  SlideOutRight,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { THEME } from "@/theme/theme";

const { width } = Dimensions.get("window");

// ─── TYPES ────────────────────────────────────────────────────────────────────

type NotificationType =
  | "booking"
  | "pickup"
  | "delivery"
  | "promo"
  | "system"
  | "payment";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    bookingId?: string;
    amount?: number;
    promoCode?: string;
  };
}

type FilterTab = "all" | "unread";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// TODO: Replace with real API hook (useNotifications)

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    type: "pickup",
    title: "Pickup Confirmed",
    message:
      "Your luggage pickup from JFK Terminal 4 has been confirmed. Driver arriving in 15 mins.",
    timestamp: "5 min ago",
    isRead: false,
    metadata: { bookingId: "HLD-8392" },
  },
  {
    id: "notif-2",
    type: "booking",
    title: "Booking Successful",
    message:
      "Your storage booking #HLD-8392 has been confirmed for 3 items at LuggageHero JFK T4.",
    timestamp: "1 hour ago",
    isRead: false,
    metadata: { bookingId: "HLD-8392" },
  },
  {
    id: "notif-3",
    type: "promo",
    title: "Weekend Special! 🎉",
    message:
      "Get 30% off on all bookings this weekend. Use code WEEKEND30 at checkout.",
    timestamp: "3 hours ago",
    isRead: false,
    metadata: { promoCode: "WEEKEND30" },
  },
  {
    id: "notif-4",
    type: "delivery",
    title: "Delivery Completed",
    message:
      "Your 2 bags have been delivered to Marriott Times Square. Thank you for using HoldMyBag!",
    timestamp: "Yesterday",
    isRead: true,
    metadata: { bookingId: "HLD-8201" },
  },
  {
    id: "notif-5",
    type: "payment",
    title: "Payment Received",
    message: "Payment of $24.00 for booking #HLD-8201 has been processed.",
    timestamp: "Yesterday",
    isRead: true,
    metadata: { bookingId: "HLD-8201", amount: 24.0 },
  },
  {
    id: "notif-6",
    type: "system",
    title: "App Update Available",
    message:
      "A new version of HoldMyBag is available. Update now for improved performance and features.",
    timestamp: "2 days ago",
    isRead: true,
  },
  {
    id: "notif-7",
    type: "promo",
    title: "First-time User Offer",
    message:
      "Welcome to HoldMyBag! Use code WELCOME for 20% off your first booking.",
    timestamp: "3 days ago",
    isRead: true,
    metadata: { promoCode: "WELCOME" },
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [refreshing, setRefreshing] = useState(false);

  // TODO: Replace with real API hook
  // const { data: notifications, isLoading, refetch } = useNotifications();
  const isLoading = false;

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    if (activeTab === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, activeTab]);

  // Group by date
  const groupedNotifications = useMemo(() => {
    const groups: { title: string; data: Notification[] }[] = [];
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const older: Notification[] = [];

    filteredNotifications.forEach((notif) => {
      const ts = notif.timestamp.toLowerCase();
      if (
        ts.includes("min") ||
        ts.includes("hour") ||
        ts.includes("just now")
      ) {
        today.push(notif);
      } else if (ts.includes("yesterday")) {
        yesterday.push(notif);
      } else {
        older.push(notif);
      }
    });

    if (today.length > 0) groups.push({ title: "Today", data: today });
    if (yesterday.length > 0)
      groups.push({ title: "Yesterday", data: yesterday });
    if (older.length > 0) groups.push({ title: "Earlier", data: older });

    return groups;
  }, [filteredNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const handleDeleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      // Mark as read
      handleMarkAsRead(notification.id);

      // Navigate based on type
      if (
        notification.metadata?.bookingId &&
        (notification.type === "booking" ||
          notification.type === "pickup" ||
          notification.type === "delivery" ||
          notification.type === "payment")
      ) {
        router.push({
          pathname: "/booking/[id]",
          params: { id: notification.metadata.bookingId },
        });
      }
    },
    [handleMarkAsRead, router],
  );

  const getNotificationMeta = useCallback(
    (
      type: NotificationType,
    ): {
      icon: React.ComponentProps<typeof Ionicons>["name"];
      color: string;
      bg: string;
    } => {
      switch (type) {
        case "booking":
          return {
            icon: "calendar",
            color: "#2563eb",
            bg: "#dbeafe",
          };
        case "pickup":
          return {
            icon: "cube",
            color: "#7c3aed",
            bg: "#ede9fe",
          };
        case "delivery":
          return {
            icon: "checkmark-circle",
            color: "#16a34a",
            bg: "#dcfce7",
          };
        case "promo":
          return {
            icon: "pricetag",
            color: "#ea580c",
            bg: "#fff7ed",
          };
        case "payment":
          return {
            icon: "card",
            color: "#0891b2",
            bg: "#cffafe",
          };
        case "system":
          return {
            icon: "settings",
            color: "#6b7280",
            bg: "#f3f4f6",
          };
        default:
          return {
            icon: "notifications",
            color: THEME.PRIMARY,
            bg: `${THEME.PRIMARY}15`,
          };
      }
    },
    [],
  );

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

        <Text style={styles.headerTitle}>Notifications</Text>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            style={styles.markAllButton}
            accessibilityLabel="Mark all as read"
            accessibilityRole="button"
          >
            <Ionicons name="checkmark-done" size={20} color={THEME.PRIMARY} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.tabActive]}
          onPress={() => setActiveTab("all")}
          accessibilityLabel="Show all notifications"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "all" }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && styles.tabTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "unread" && styles.tabActive]}
          onPress={() => setActiveTab("unread")}
          accessibilityLabel={`Show unread notifications, ${unreadCount} unread`}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "unread" }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "unread" && styles.tabTextActive,
            ]}
          >
            Unread
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={groupedNotifications}
        keyExtractor={(item) => item.title}
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
                name="notifications-off-outline"
                size={48}
                color={THEME.TEXT_MUTED}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === "unread"
                ? "All caught up!"
                : "No notifications yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === "unread"
                ? "You've read all your notifications"
                : "Your notifications will appear here"}
            </Text>
          </Animated.View>
        }
        renderItem={({ item: group, index: groupIndex }) => (
          <Animated.View
            entering={FadeInDown.delay(groupIndex * 100).springify()}
          >
            <Text style={styles.groupTitle}>{group.title}</Text>
            {group.data.map((notification, index) => {
              const meta = getNotificationMeta(notification.type);
              return (
                <Animated.View
                  key={notification.id}
                  entering={FadeInRight.delay(
                    groupIndex * 100 + index * 80,
                  ).springify()}
                  exiting={SlideOutRight.duration(300)}
                  layout={Layout.springify()}
                >
                  <TouchableOpacity
                    style={[
                      styles.notificationCard,
                      !notification.isRead && styles.notificationUnread,
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                    activeOpacity={0.7}
                    accessibilityLabel={`${notification.title}: ${notification.message}. ${notification.timestamp}`}
                    accessibilityRole="button"
                  >
                    {!notification.isRead && <View style={styles.unreadDot} />}

                    <View
                      style={[
                        styles.notifIconContainer,
                        { backgroundColor: meta.bg },
                      ]}
                    >
                      <Ionicons name={meta.icon} size={20} color={meta.color} />
                    </View>

                    <View style={styles.notifContent}>
                      <View style={styles.notifHeader}>
                        <Text
                          style={[
                            styles.notifTitle,
                            !notification.isRead && styles.notifTitleUnread,
                          ]}
                          numberOfLines={1}
                        >
                          {notification.title}
                        </Text>
                        <Text style={styles.notifTimestamp}>
                          {notification.timestamp}
                        </Text>
                      </View>
                      <Text style={styles.notifMessage} numberOfLines={2}>
                        {notification.message}
                      </Text>

                      {notification.metadata?.promoCode && (
                        <View style={styles.promoContainer}>
                          <View style={styles.promoCodeBadge}>
                            <Text style={styles.promoCodeText}>
                              {notification.metadata.promoCode}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteNotification(notification.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityLabel={`Delete notification: ${notification.title}`}
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
              );
            })}
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}

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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginLeft: 12,
  },
  markAllButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${THEME.PRIMARY}12`,
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.BACKGROUND_LIGHT,
    gap: 6,
  },
  tabActive: {
    backgroundColor: THEME.PRIMARY,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  tabTextActive: {
    color: "#FFF",
  },
  unreadBadge: {
    backgroundColor: "#FFF",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.PRIMARY,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 12,
  },

  // Notification Card
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    position: "relative",
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
  notificationUnread: {
    backgroundColor: `${THEME.PRIMARY}04`,
    borderLeftWidth: 3,
    borderLeftColor: THEME.PRIMARY,
  },
  unreadDot: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.PRIMARY,
  },
  notifIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 8,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: THEME.TEXT_DARK,
    flex: 1,
  },
  notifTitleUnread: {
    fontWeight: "700",
  },
  notifTimestamp: {
    fontSize: 11,
    color: THEME.TEXT_MUTED,
  },
  notifMessage: {
    fontSize: 12,
    color: THEME.TEXT_MUTED,
    lineHeight: 18,
  },
  promoContainer: {
    marginTop: 8,
  },
  promoCodeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderStyle: "dashed",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  promoCodeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ea580c",
    letterSpacing: 1,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },

  // Empty State
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
});
