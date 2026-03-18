import { THEME } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function MyLuggageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("All");

  const luggageItems = [
    {
      id: "#HLD-8821",
      name: "Blue Hardcase",
      status: "In Transit",
      sub: "Arriving 2pm Today",
      type: "transit",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAA-iGapIMdZklT9vqqLglfdDg7ucEGrnr4aYp0ncZrfe_ptrCRqptxc26G41ZS69gjlMnwRL2RyPoJT_shW7pI-BNjERpwdc00f8rsfO4x-RAsRm78I20HSavgW1x2VlsR_yB5OOC3ejCI1Xnyj3CBu6M2X83grS5vDnYfvgHqGObzs-RJMej5triimBdqb0052jRY2CiB81wHq7HHgcFcPbjpsi_um-yvMrRQAPdpXfbgDSQnzvyUk6itZshVpJMM4GE91T0Ocmw",
    },
    {
      id: "#HLD-4410",
      name: "Golf Bag",
      status: "Stored",
      sub: "Warehouse A • Shelf 42",
      type: "stored",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBnUY2MbxI9VXYG6hFZ4E8gjPc6E7d1xO-Bo1qsWNSjMD0Ur2ZRFCPC2Q0xFJO0pM1qZklUGCzPU03X9W2uw6n85yToYU-asqOdhR254mNC3zDPGc9RryisdJb6wmm5xv7C3HGgY9VJcqInPqAm7MIA6gvl8_JumByBQAzeNOE1_SDulsnniMXUSODMrroBm4G0nGdk_CnXmQxzdD25cad8gvHqd0rTc6szkQmCFkaBLpnJhvgl3u1IsICZlzw3uAUIBz2WGAZO44Y",
    },
    {
      id: "#HLD-1102",
      name: "Weekend Duffel",
      status: "Pickup Ready",
      sub: "Concierge Desk",
      type: "ready",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC54VvJnxPaC5iZSAL67q8WxA6bB13l43uXWqRqqVdQNraasxtdt1Et2p5eLgf88nFAWT3R4f-G_6WWYybtiBS8Xmcun91sI7_cbuOyi8fI1lCFYVsYLxEywqHjDFXmhx4bbI0GQh8RycyzFGCwrYKjGkak65t5vf0_nBo6f0emOkWklJWaX5WtLjzotObFPr6Cp7-N3Ws63fRASO9KjWeGNWEO7qkHHUTVYvh-2xzeVMMjHW63a2n0LV9DnABvjgEMEUVBuV65ACw",
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER AREA */}
      <View style={styles.stickyHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>My Luggage</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search by ID or name"
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
        </View>

        {/* SEGMENTED CONTROL */}
        <View style={styles.segmentedControl}>
          {["All", "Stored", "In Transit"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              style={[styles.segment, filter === tab && styles.segmentActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  filter === tab && styles.segmentTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SCROLLABLE LIST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {luggageItems.map((item, index) => (
          <LuggageCard
            onPress={() =>
              router.push({
                pathname: "/requestReturn",
              })
            }
            key={index}
            item={item}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// --- Luggage Card Component ---
const LuggageCard = ({ item }: any) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "In Transit":
        return { bg: "#FFEDD5", text: "#EA580C", dot: "#F97316" };
      case "Stored":
        return { bg: "#D1FAE5", text: "#059669", dot: "#10B981" };
      default:
        return { bg: "#DBEAFE", text: "#2563EB", dot: "#3B82F6" };
    }
  };

  const statusStyle = getStatusStyle(item.status);

  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.card}>
      <View style={styles.imageContainer}>
        <ImageBackground
          source={{ uri: item.img }}
          style={styles.cardImage}
          imageStyle={{ borderRadius: 12 }}
        >
          <View
            style={[styles.statusDot, { backgroundColor: statusStyle.dot }]}
          />
        </ImageBackground>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.itemSub}>{item.sub}</Text>

        <View style={styles.idRow}>
          <Text style={styles.qrIcon}>🔳</Text>
          <Text style={styles.idText}>{item.id}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.moreBtn}>
        <Text style={styles.moreIcon}>•••</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  stickyHeader: {
    paddingHorizontal: 20,
    backgroundColor: "#F8F9FD",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#101622",
    letterSpacing: -1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${THEME.PRIMARY}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    fontSize: 24,
    color: THEME.PRIMARY,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    height: 50,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500", color: "#101622" },

  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    padding: 4,
    borderRadius: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: THEME.PRIMARY,
    shadowColor: THEME.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  segmentText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  segmentTextActive: { color: "#fff" },

  listContent: { padding: 20 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  imageContainer: { marginRight: 15 },
  cardImage: { width: 64, height: 64, position: "relative" },
  statusDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
  cardInfo: { flex: 1 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#101622",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  itemSub: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 4,
  },
  idRow: { flexDirection: "row", alignItems: "center" },
  qrIcon: { fontSize: 12, marginRight: 4, opacity: 0.5 },
  idText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  moreBtn: { padding: 10 },
  moreIcon: { color: "#CBD5E1", fontSize: 14, fontWeight: "bold" },
});
