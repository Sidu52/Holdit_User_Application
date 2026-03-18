import { THEME } from "@/constants/theme";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from "react-native";

export default function RequestReturnScreen() {
  const [locationType, setLocationType] = useState<"original" | "new">(
    "original",
  );
  const [selectedDate, setSelectedDate] = useState(12);
  const [selectedSlot, setSelectedSlot] = useState("13:00 - 15:00");

  const dates = [
    { day: 12, label: "Today", month: "Oct" },
    { day: 13, label: "Sat", month: "Oct" },
    { day: 14, label: "Sun", month: "Oct" },
    { day: 15, label: "Mon", month: "Oct" },
  ];

  const timeSlots = [
    { time: "09:00 - 11:00", disabled: true },
    { time: "11:00 - 13:00", disabled: false },
    { time: "13:00 - 15:00", disabled: false },
    { time: "15:00 - 17:00", disabled: false },
  ];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Return</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.headline}>Let's get your bags back to you.</Text>

        {/* ORDER SUMMARY CARD */}
        <View style={styles.orderCard}>
          <View style={styles.orderInfo}>
            <Text style={styles.storageId}>STORAGE ID</Text>
            <Text style={styles.orderNo}>Order #4402</Text>
            <Text style={styles.orderItems}>2 Suitcases, 1 Backpack</Text>
          </View>
          <ImageBackground
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCqJEi5_0fgOIaF0hP5aNW4ae-23jbFSNXaJRImEXsw91j7Bki48DkAo75JVqntiRk-m4TUBOt5jvuoiCR-SohMVIWJulycF96th92syiRyfzFx-NQj_RXNwTwy2kZRUF8mhEnPEMskWoRFvccBbBuxDDdO3PzstNJXNYjjZ5jGFB2SaSfV1nGdv6wyluZ3Zd4iKPLQlohNsXK4bYs0gveJGwpfT9jWbe6sT0nQ2ynewCYwTdciHo5JJHB8hAxdcGE4xpu8Dv_t80c",
            }}
            style={styles.orderImage}
            imageStyle={{ borderRadius: 12 }}
          >
            <View style={styles.imageOverlay} />
          </ImageBackground>
        </View>

        {/* LOCATION TOGGLE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where to?</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              onPress={() => setLocationType("original")}
              style={[
                styles.segment,
                locationType === "original" && styles.segmentActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  locationType === "original" && styles.segmentTextActive,
                ]}
              >
                Original Pickup
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLocationType("new")}
              style={[
                styles.segment,
                locationType === "new" && styles.segmentActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  locationType === "new" && styles.segmentTextActive,
                ]}
              >
                New Address
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MAP & ADDRESS */}
        <View style={styles.addressSection}>
          <ImageBackground
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCafafuUjEc9KDMOvH-icXhwvKMLsJk5y3FSu5EI4nm59f2H_S_NbmkyX31vODPYG9iMhmAhrQPhvTMuxcoKXOoaJaKzTjfdE66uz-4lSEdggn18LKCBQ78stQxKUfrChRweaE6uVb_L0A1MT-nntCYgRBINwUsYn2_7nhLiSnwSYr8as_jtdRFz1DmivTDO3dPIpv1IICg-PkPwda1LS4wWtZxdiSYc53WbXsf0smNgXzn5diwpikAjXF4aj-oxYPGU-LnB68tWqs",
            }}
            style={styles.mapPreview}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={styles.pinContainer}>
              <View style={styles.pin} />
            </View>
          </ImageBackground>

          <View style={styles.addressRow}>
            <View style={styles.addressDetails}>
              <View style={styles.addressTitleRow}>
                <Text style={styles.addressMain}>123 W 45th St, Apt 4B</Text>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
              <Text style={styles.addressSub}>New York, NY 10036</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DATE PICKER */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Window</Text>
            <Text style={styles.viewCalendar}>View Calendar</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dateScroller}
          >
            {dates.map((item) => (
              <TouchableOpacity
                key={item.day}
                onPress={() => setSelectedDate(item.day)}
                style={[
                  styles.dateCard,
                  selectedDate === item.day && styles.dateCardActive,
                ]}
              >
                <Text
                  style={[
                    styles.dateLabel,
                    selectedDate === item.day && styles.textWhite,
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.dateDay,
                    selectedDate === item.day && styles.textWhite,
                  ]}
                >
                  {item.day}
                </Text>
                <Text
                  style={[
                    styles.dateLabel,
                    selectedDate === item.day && styles.textWhite,
                  ]}
                >
                  {item.month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* TIME SLOTS */}
        <View style={styles.timeGrid}>
          {timeSlots.map((slot) => {
            const isSelected = selectedSlot === slot.time;
            return (
              <TouchableOpacity
                key={slot.time}
                disabled={slot.disabled}
                onPress={() => setSelectedSlot(slot.time)}
                style={[
                  styles.timeChip,
                  isSelected && styles.timeChipActive,
                  slot.disabled && styles.timeChipDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.timeChipText,
                    isSelected && styles.textWhite,
                    slot.disabled && styles.timeChipTextDisabled,
                  ]}
                >
                  {slot.time}
                </Text>
                {isSelected && <Text style={styles.checkMark}>●</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Delivery Fee</Text>
          <Text style={styles.feeValue}>$15.00</Text>
        </View>
        <TouchableOpacity style={styles.confirmBtn}>
          <Text style={styles.confirmBtnText}>Confirm Return</Text>
          <Text style={styles.arrowIcon}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FD" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: "#F8F9FD",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, fontWeight: "bold" },
  headerTitle: { fontSize: 17, fontWeight: "800" },
  content: { padding: 20, paddingBottom: 150 },
  headline: {
    fontSize: 28,
    fontWeight: "900",
    color: "#101622",
    marginBottom: 20,
  },

  orderCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 24,
  },
  orderInfo: { flex: 1, justifyContent: "center" },
  storageId: {
    fontSize: 10,
    fontWeight: "800",
    color: THEME.PRIMARY,
    letterSpacing: 1,
  },
  orderNo: {
    fontSize: 20,
    fontWeight: "800",
    color: "#101622",
    marginVertical: 2,
  },
  orderItems: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  orderImage: { width: 80, height: 80 },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
  },

  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#101622",
    marginBottom: 12,
  },
  viewCalendar: { fontSize: 13, color: THEME.PRIMARY, fontWeight: "700" },

  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    padding: 4,
    borderRadius: 14,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  segmentActive: { backgroundColor: THEME.PRIMARY, elevation: 2 },
  segmentText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  segmentTextActive: { color: "#fff" },

  addressSection: { marginBottom: 24 },
  mapPreview: {
    width: "100%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  pinContainer: {
    width: 40,
    height: 40,
    backgroundColor: THEME.PRIMARY,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  pin: { width: 8, height: 8, backgroundColor: "#fff", borderRadius: 4 },
  addressRow: { flexDirection: "row", marginTop: 15, alignItems: "flex-start" },
  addressDetails: { flex: 1 },
  addressTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  addressMain: { fontSize: 15, fontWeight: "800", color: "#101622" },
  verifiedIcon: { color: "#22C55E", fontWeight: "bold" },
  addressSub: { fontSize: 13, color: "#64748B", marginTop: 2 },
  editText: { color: THEME.PRIMARY, fontWeight: "700", fontSize: 14 },

  dateScroller: { marginHorizontal: -20, paddingHorizontal: 20 },
  dateCard: {
    width: 75,
    height: 90,
    backgroundColor: "#fff",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  dateCardActive: {
    backgroundColor: THEME.PRIMARY,
    borderColor: THEME.PRIMARY,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  dateDay: {
    fontSize: 22,
    fontWeight: "900",
    color: "#101622",
    marginVertical: 2,
  },
  textWhite: { color: "#fff" },

  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  timeChip: {
    width: "48%",
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  timeChipActive: {
    backgroundColor: THEME.PRIMARY,
    borderColor: THEME.PRIMARY,
  },
  timeChipDisabled: { backgroundColor: "#F1F5F9", opacity: 0.6 },
  timeChipText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  timeChipTextDisabled: {
    textDecorationLine: "line-through",
    color: "#94A3B8",
  },
  checkMark: { color: "#fff", fontSize: 10 },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  feeLabel: { fontSize: 14, color: "#64748B", fontWeight: "600" },
  feeValue: { fontSize: 20, fontWeight: "900", color: "#101622" },
  confirmBtn: {
    backgroundColor: THEME.PRIMARY,
    height: 60,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  arrowIcon: { color: "#fff", fontSize: 20 },
});
