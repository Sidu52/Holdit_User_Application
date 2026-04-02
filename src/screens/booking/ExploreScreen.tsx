import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/theme/theme";

const { width } = Dimensions.get("window");

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Find storage near you</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={THEME.TEXT_MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city, area or landmark..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={THEME.TEXT_MUTED}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={THEME.TEXT_MUTED} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.placeholderCard}>
          <Ionicons name="map-outline" size={48} color={THEME.PRIMARY} />
          <Text style={styles.placeholderTitle}>Search for Storage</Text>
          <Text style={styles.placeholderText}>
            Enter a location to find available storage partners and book your spot.
          </Text>
        </View>

        <View style={styles.quickLinks}>
          <Text style={styles.sectionTitle}>Popular Areas</Text>
          <View style={styles.chipContainer}>
            {["Mumbai", "Delhi", "Bangalore", "Pune", "Chennai"].map((city) => (
              <TouchableOpacity key={city} style={styles.chip}>
                <Text style={styles.chipText}>{city}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  subtitle: {
    fontSize: 15,
    color: THEME.TEXT_MUTED,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: THEME.TEXT_DARK,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  placeholderCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    backgroundColor: "#f9fafb",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#f3f4f6",
    borderStyle: "dashed",
    marginTop: 20,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginTop: 15,
  },
  placeholderText: {
    fontSize: 14,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  quickLinks: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 15,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  chipText: {
    fontSize: 14,
    color: THEME.TEXT_DARK,
    fontWeight: "500",
  },
});
