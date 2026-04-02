import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { THEME } from "@/theme/theme";
import { useProfile, useAddresses } from "@/features/user/user.queries";
import { useBookingDetail as useBooking, useRequestReturn } from "@/features/booking/booking.queries";
import { LinearGradient } from "expo-linear-gradient";
import { showError, showSuccess } from "@/utils/toast";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

// ── Date and Time helpers ───────────────────────────────────────────────────
const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      dateObj: d,
      day: d.getDate(),
      label:
        i === 0
          ? "Today"
          : i === 1
          ? "Tmrw"
          : d.toLocaleDateString("en-US", { weekday: "short" }),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return dates;
};

const TIME_SLOTS = [
  { time: "09:00 – 11:00", startHour: 9, icon: "sunny-outline" },
  { time: "11:00 – 13:00", startHour: 11, icon: "partly-sunny-outline" },
  { time: "13:00 – 15:00", startHour: 13, icon: "partly-sunny-outline" },
  { time: "15:00 – 17:00", startHour: 15, icon: "cloud-outline" },
  { time: "17:00 – 19:00", startHour: 17, icon: "moon-outline" },
  { time: "19:00 – 21:00", startHour: 19, icon: "moon-outline" },
];

export default function RequestReturnScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  
  // Queries
  const { data: user, isLoading: isUserLoading } = useProfile();
  const { data: savedAddresses, isLoading: isAddressesLoading } = useAddresses();
  const { data: booking, isLoading: isBookingLoading } = useBooking(bookingId);
  const requestReturn = useRequestReturn();

  // States
  const dates = useMemo(() => generateDates(), []);
  const [selectedDateObj, setSelectedDateObj] = useState<Date>(dates[0].dateObj);
  const [selectedSlot, setSelectedSlot] = useState<number>(11);

  // Address logic
  const profileAddress = user?.location?.address || "";
  const originalPickupAddress = booking?.pickupLocation?.address || profileAddress;
  
  const [customAddress, setCustomAddress] = useState("");
  const [addressMode, setAddressMode] = useState<"original" | "custom">("original");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressInput, setAddressInput] = useState("");

  const activeDeliveryAddress =
    addressMode === "custom" && customAddress ? customAddress : originalPickupAddress;

  const isToday =
    selectedDateObj.getDate() === new Date().getDate() &&
    selectedDateObj.getMonth() === new Date().getMonth();
  const currentHour = new Date().getHours();

  // Handlers
  const handleOpenAddressModal = () => {
    setAddressInput(customAddress || "");
    setShowAddressModal(true);
  };

  const handleSaveAddress = () => {
    const trimmed = addressInput.trim();
    if (!trimmed) {
      showError("Please enter/select a valid address.", "Address Required");
      return;
    }
    setCustomAddress(trimmed);
    setAddressMode("custom");
    setShowAddressModal(false);
  };

  const handleSelectFromSaved = (address: string) => {
    setCustomAddress(address);
    setAddressMode("custom");
    setShowAddressModal(false);
  };

  const handleUseOriginalAddress = () => {
    setAddressMode("original");
    setCustomAddress("");
    setShowAddressModal(false);
  };

  const handleConfirmReturn = () => {
    if (!bookingId) return;

    const payload = {
      bookingId,
      returnLocation: {
        lat: user?.location?.coordinates[1] || 0,
        lng: user?.location?.coordinates[0] || 0,
        address: activeDeliveryAddress,
      },
      returnScheduledAt: selectedDateObj.toISOString(),
    };

    requestReturn.mutate(payload, {
      onSuccess: () => {
        showSuccess("Your return request has been submitted.", "Request Received");
        router.replace("/(tabs)");
      },
      onError: (err: any) => {
        showError(err.response?.data?.message || "Failed to submit return request.");
      }
    });
  };

  if (isUserLoading || isBookingLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.PRIMARY} />
        <Text style={styles.loadingText}>Fetching details...</Text>
      </View>
    );
  }

  const bookingCode = booking?._id?.slice(-8).toUpperCase() || "N/A";
  const itemTotal = booking?.luggage?.totalBags || 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={THEME.TEXT_DARK} />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Request Return</Text>
          <Text style={styles.headerSub}>Booking #{bookingCode}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.Text entering={FadeInDown.delay(100)} style={styles.headline}>
            Let's get your bags home.
          </Animated.Text>

          {/* ── ORDER SUMMARY CARD ────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.orderCard}>
            <LinearGradient
              colors={["#FFF", "#F8FAFC"]}
              style={styles.orderCardContent}
            >
              <View style={styles.orderInfo}>
                <View style={styles.badgeRow}>
                  <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>ORDER #{bookingCode.split('-').pop()}</Text>
                  </View>
                </View>
                <Text style={styles.itemSummary}>{itemTotal} Luggage Items</Text>
                <Text style={styles.statusNote}>Securely stored in facility</Text>
              </View>
              
              <View style={styles.orderIconWrap}>
                 <Ionicons name="cube" size={32} color={THEME.PRIMARY} />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── SECTION: DELIVERY ADDRESS ────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <SectionLabel icon="location" label="Return To" />
            <TouchableOpacity
              style={[
                styles.addressCard,
                addressMode === "custom" && styles.addressCardCustom,
              ]}
              onPress={handleOpenAddressModal}
              activeOpacity={0.85}
            >
              <View style={[styles.addressIconWrap, { backgroundColor: addressMode === "custom" ? `${THEME.PRIMARY}18` : "#F0F9FF" }]}>
                <Ionicons
                  name={addressMode === "custom" ? "location" : "home"}
                  size={22}
                  color={THEME.PRIMARY}
                />
              </View>
              <View style={styles.addressTextWrap}>
                <Text style={styles.addressMode}>
                  {addressMode === "custom" ? "Custom Address" : "Original Location"}
                </Text>
                <Text style={styles.addressValue} numberOfLines={2}>
                  {activeDeliveryAddress}
                </Text>
              </View>
              <View style={styles.changeAddressBtn}>
                <Ionicons name="pencil" size={15} color={THEME.PRIMARY} />
                <Text style={styles.changeAddressBtnText}>Edit</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* ── SECTION: DATE ────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <SectionLabel icon="calendar-outline" label="Delivery Date" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScroller}
            >
              {dates.map((item, index) => {
                const isSelected =
                  selectedDateObj.getDate() === item.dateObj.getDate() &&
                  selectedDateObj.getMonth() === item.dateObj.getMonth();
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedDateObj(item.dateObj)}
                    style={[styles.dateCard, isSelected && styles.dateCardActive]}
                  >
                    {isSelected && (
                      <LinearGradient
                        colors={[THEME.PRIMARY, THEME.SECONDARY]}
                        style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                      />
                    )}
                    <Text style={[styles.dateLabel, isSelected && styles.textWhite]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.dateDay, isSelected && styles.textWhite]}>
                      {item.day}
                    </Text>
                    <Text style={[styles.dateMonth, isSelected && styles.textWhite]}>
                      {item.month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* ── SECTION: TIME SLOT ───────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <SectionLabel icon="time-outline" label="Preferred Window" />
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((slot) => {
                const disabled = isToday && currentHour + 1 >= slot.startHour;
                const isSelected = selectedSlot === slot.startHour;
                return (
                  <TouchableOpacity
                    key={slot.time}
                    disabled={disabled}
                    onPress={() => setSelectedSlot(slot.startHour)}
                    style={[
                      styles.timeChip,
                      isSelected && styles.timeChipActive,
                      disabled && styles.timeChipDisabled,
                    ]}
                  >
                    {isSelected && (
                      <LinearGradient
                        colors={[THEME.PRIMARY, THEME.SECONDARY]}
                        style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                      />
                    )}
                    <Ionicons
                      name={slot.icon as any}
                      size={14}
                      color={isSelected ? "#FFF" : disabled ? "#CBD5E1" : THEME.TEXT_MUTED}
                    />
                    <Text
                      style={[
                        styles.timeChipText,
                        isSelected && styles.textWhite,
                        disabled && styles.timeChipTextDisabled,
                      ]}
                    >
                      {slot.time}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={14} color="#FFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── FOOTER CTA ────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <View style={styles.priceStrip}>
          <Text style={styles.priceLabel}>Return Delivery Fee</Text>
          <Text style={styles.priceValue}>$15.00</Text>
        </View>

        <TouchableOpacity
          style={styles.confirmBtnOuter}
          onPress={handleConfirmReturn}
          disabled={requestReturn.isPending}
        >
          <LinearGradient
            colors={[THEME.PRIMARY, THEME.SECONDARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmBtn}
          >
            {requestReturn.isPending ? (
               <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.confirmBtnText}>Confirm Return Request</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── ENHANCED ADDRESS MODAL ────────────────────────────────────── */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(300)} style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Delivery Address</Text>
            <Text style={styles.modalSubtitle}>
              Where should we deliver your items?
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {/* Original address option */}
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  addressMode === "original" && styles.modalOptionActive,
                ]}
                onPress={handleUseOriginalAddress}
              >
                <View style={[styles.modalOptionIcon, addressMode === "original" && { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <Ionicons name="refresh-circle" size={22} color={addressMode === "original" ? "#FFF" : THEME.PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalOptionLabel, addressMode === "original" && { color: "#FFF" }]}>
                    Original Pickup Location
                  </Text>
                  <Text
                    style={[styles.modalOptionAddress, addressMode === "original" && { color: "rgba(255,255,255,0.8)" }]}
                    numberOfLines={1}
                  >
                    {originalPickupAddress}
                  </Text>
                </View>
                {addressMode === "original" && (
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                )}
              </TouchableOpacity>

              {/* Saved Addresses List */}
              {savedAddresses && savedAddresses.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.miniLabel}>Saved in My Account</Text>
                  {savedAddresses.map((addr) => (
                    <TouchableOpacity
                      key={addr._id}
                      style={[
                        styles.modalOption,
                        customAddress === `${addr.street}, ${addr.city}` && styles.modalOptionActive,
                      ]}
                      onPress={() => handleSelectFromSaved(`${addr.street}, ${addr.city}`)}
                    >
                      <View style={[styles.modalOptionIcon, customAddress === `${addr.street}, ${addr.city}` && { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                        <Ionicons 
                          name={addr.is_default ? 'home' : 'location'} 
                          size={20} 
                          color={customAddress === `${addr.street}, ${addr.city}` ? "#FFF" : THEME.PRIMARY} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalOptionLabel, customAddress === `${addr.street}, ${addr.city}` && { color: "#FFF" }]}>
                          {addr.is_default ? "Default Address" : addr.street}
                        </Text>
                        <Text style={[styles.modalOptionAddress, customAddress === `${addr.street}, ${addr.city}` && { color: "rgba(255,255,255,0.8)" }]} numberOfLines={1}>
                          {`${addr.street}, ${addr.city}`}
                        </Text>
                      </View>
                      {customAddress === `${addr.street}, ${addr.city}` && <Ionicons name="checkmark-circle" size={20} color="#FFF" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.miniLabel}>Or enter a new destination</Text>
              <View style={styles.modalInputWrap}>
                <Ionicons name="location-outline" size={20} color={THEME.PRIMARY} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Street, Hotel, or Station..."
                  placeholderTextColor={THEME.TEXT_MUTED}
                  value={addressInput}
                  onChangeText={(txt) => {
                    setAddressInput(txt);
                    if (txt === "") setCustomAddress("");
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveAddress}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddressModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, !addressInput.trim() && { opacity: 0.5 }]}
                onPress={handleSaveAddress}
                disabled={!addressInput.trim()}
              >
                <LinearGradient
                  colors={[THEME.PRIMARY, THEME.SECONDARY]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.modalSaveBtnInner, { borderRadius: 16 }]}
                >
                  <Text style={styles.modalSaveText}>Update Address</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const SectionLabel = ({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) => (
  <View style={sectionLabelStyles.row}>
    <Ionicons name={icon} size={18} color={THEME.PRIMARY} />
    <Text style={sectionLabelStyles.text}>{label}</Text>
  </View>
);
const sectionLabelStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 28, marginBottom: 14 },
  text: { fontSize: 16, fontWeight: "800", color: THEME.TEXT_DARK },
});

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BACKGROUND_LIGHT },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: THEME.BACKGROUND_LIGHT },
  loadingText: { marginTop: 12, fontSize: 15, color: THEME.TEXT_MUTED, fontWeight: "600" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: THEME.TEXT_DARK },
  headerSub: { fontSize: 12, color: THEME.TEXT_MUTED, marginTop: 2 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 180, paddingTop: 10 },

  headline: {
    fontSize: 24,
    fontWeight: "900",
    color: THEME.TEXT_DARK,
    marginBottom: 20,
    letterSpacing: -0.5,
  },

  // Order Card
  orderCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
    ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
        android: { elevation: 3 },
    }),
  },
  orderCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  orderInfo: { flex: 1 },
  badgeRow: { marginBottom: 8 },
  idBadge: {
    alignSelf: "flex-start",
    backgroundColor: `${THEME.PRIMARY}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  idBadgeText: { fontSize: 10, fontWeight: "900", color: THEME.PRIMARY, letterSpacing: 0.5 },
  itemSummary: { fontSize: 18, fontWeight: "800", color: THEME.TEXT_DARK },
  statusNote: { fontSize: 13, color: THEME.TEXT_MUTED, marginTop: 2 },
  orderIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  // Address Card
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 14,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  addressCardCustom: { borderColor: THEME.PRIMARY },
  addressIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addressTextWrap: { flex: 1 },
  addressMode: { fontSize: 11, fontWeight: "700", color: THEME.TEXT_MUTED, textTransform: "uppercase" },
  addressValue: { fontSize: 14, fontWeight: "700", color: THEME.TEXT_DARK, marginTop: 4 },
  changeAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${THEME.PRIMARY}12`,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  changeAddressBtnText: { fontSize: 12, fontWeight: "700", color: THEME.PRIMARY },

  // Date picker
  dateScroller: { gap: 10 },
  dateCard: {
    width: 72,
    height: 90,
    backgroundColor: "#FFF",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  dateCardActive: { borderColor: THEME.PRIMARY },
  dateLabel: { fontSize: 11, fontWeight: "700", color: THEME.TEXT_MUTED, textTransform: "uppercase" },
  dateDay: { fontSize: 26, fontWeight: "900", color: THEME.TEXT_DARK, marginVertical: 2 },
  dateMonth: { fontSize: 11, fontWeight: "600", color: THEME.TEXT_MUTED },
  textWhite: { color: "#FFF" },

  // Time slots
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeChip: {
    width: "48%",
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  timeChipActive: { borderColor: THEME.PRIMARY },
  timeChipDisabled: { backgroundColor: "#F8FAFC", opacity: 0.5 },
  timeChipText: { fontSize: 13, fontWeight: "700", color: THEME.TEXT_DARK },
  timeChipTextDisabled: { textDecorationLine: "line-through", color: "#94A3B8" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.07, shadowRadius: 12 },
      android: { elevation: 16 },
    }),
  },
  priceStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  priceLabel: { fontSize: 14, fontWeight: "600", color: THEME.TEXT_MUTED },
  priceValue: { fontSize: 22, fontWeight: "900", color: THEME.TEXT_DARK },

  confirmBtnOuter: { borderRadius: 20, overflow: "hidden" },
  confirmBtn: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 20,
  },
  confirmBtnText: { color: "#FFF", fontSize: 17, fontWeight: "800" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: THEME.TEXT_DARK, marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: THEME.TEXT_MUTED, marginBottom: 20 },
  miniLabel: { fontSize: 11, fontWeight: "800", color: THEME.TEXT_MUTED, textTransform: "uppercase", marginBottom: 12, letterSpacing: 0.5 },
  
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  modalOptionActive: { backgroundColor: THEME.PRIMARY, borderColor: THEME.PRIMARY },
  modalOptionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" },
  modalOptionLabel: { fontSize: 15, fontWeight: "700", color: THEME.TEXT_DARK },
  modalOptionAddress: { fontSize: 12, color: THEME.TEXT_MUTED, marginTop: 2 },

  modalInputLabel: { fontSize: 12, fontWeight: "800", color: THEME.TEXT_MUTED, marginBottom: 10, textTransform: "uppercase" },
  modalInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  modalInput: { flex: 1, fontSize: 15, color: THEME.TEXT_DARK, paddingVertical: 14, fontWeight: "600" },

  modalActions: { flexDirection: "row", gap: 12 },
  modalCancelBtn: { flex: 1, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F9" },
  modalCancelText: { fontSize: 15, fontWeight: "700", color: THEME.TEXT_DARK },
  modalSaveBtn: { flex: 2, borderRadius: 18, overflow: "hidden" },
  modalSaveBtnInner: { height: 54, alignItems: "center", justifyContent: "center" },
  modalSaveText: { fontSize: 15, fontWeight: "800", color: "#FFF" },
});
