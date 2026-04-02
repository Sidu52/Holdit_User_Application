import React, { useState, useMemo, useEffect } from "react";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { THEME } from "@/theme/theme";
import { useProfile, useAddresses } from "@/features/user/user.queries";
import { 
  useSchedulePickup as useCreateBooking, 
  useActiveBookingQuery 
} from "@/features/booking/booking.queries";
import { LinearGradient } from "expo-linear-gradient";
import { showError, showSuccess, showInfo } from "@/utils/toast";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/features/booking/bookingQueries";

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

const LUGGAGE_TYPES = [
  { id: "small", label: "Small", sub: "Handbags/Briefcase", icon: "bag-personal", color: "#22D3EE" },
  { id: "medium", label: "Medium", sub: "Standard Cabin Bag", icon: "bag-suitcase-outline", color: "#818CF8" },
  { id: "large", label: "Large", sub: "Check-in Suitcase", icon: "bag-suitcase", color: "#6366F1" },
  { id: "other", label: "Other", sub: "Odd size items", icon: "bag-checked", color: "#F59E0B" },
];

export default function ScheduleBookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: user, isLoading: isUserLoading } = useProfile();
  const { data: savedAddresses, isLoading: isAddressesLoading } = useAddresses();
  const { data: activeBooking, isLoading: isActiveBookingLoading, refetch: refetchActive } = useActiveBookingQuery();
  const createBooking = useCreateBooking();

  console.log("Active booking:", activeBooking);
  
  // ── States ────────────────────────────────────────────────────────────────
  const dates = useMemo(() => generateDates(), []);
  const [selectedDateObj, setSelectedDateObj] = useState<Date>(dates[0].dateObj);
  const [selectedSlot, setSelectedSlot] = useState<number>(11);

  const [luggage, setLuggage] = useState<Record<string, number>>({
    small: 0,
    medium: 0,
    large: 0,
    other: 0,
  });
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  // Address logic
  const profileAddress = user?.location?.address || "";
  const [customAddress, setCustomAddress] = useState("");
  const [addressMode, setAddressMode] = useState<"profile" | "custom">("profile");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressInput, setAddressInput] = useState("");

  const activePickupAddress =
    addressMode === "custom" && customAddress ? customAddress : profileAddress;

  const isToday =
    selectedDateObj.getDate() === new Date().getDate() &&
    selectedDateObj.getMonth() === new Date().getMonth();
  const currentHour = new Date().getHours();

  const totalItems = Object.values(luggage).reduce((a, b) => a + b, 0);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLuggageChange = (id: string, delta: number) => {
    setLuggage((prev) => ({
      ...prev,
      [id]: Math.max(0, prev[id] + delta),
    }));
  };

  const handleOpenAddressModal = () => {
    setAddressInput(customAddress || "");
    setShowAddressModal(true);
  };

  const handleSaveAddress = () => {
    const trimmed = addressInput.trim();
    if (!trimmed) {
      showError("Please enter or select a valid address.", "Address Required");
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

  const handleUseProfile = () => {
    if (!profileAddress) {
      showError("Please add a default address in your profile settings.", "No Address Found");
      return;
    }
    setAddressMode("profile");
    setCustomAddress("");
    setShowAddressModal(false);
  };
  
const getScheduledDateTime = (): Date => {
  const date = new Date(selectedDateObj);
  // Zero out time, then apply the selected slot hour
  date.setHours(selectedSlot, 0, 0, 0);
  return date;
};

const handleConfirm = () => {
  if (totalItems === 0) {
    showError("Please add at least one luggage item.", "No Items Selected");
    return;
  }
  if (!activePickupAddress) {
    showError("Please provide a pickup address.", "Address Required");
    return;
  }

  const scheduledAt = getScheduledDateTime();
  const now = new Date();

  // Guard: slot must be in the future
  if (scheduledAt <= now) {
    showError("The selected time slot has already passed. Please choose a future time slot.", "Invalid Time");
    return;
  }

  const bookingPayload = {
    pickupLocation: {
      lat: user?.location?.coordinates[1] || 0,
      lng: user?.location?.coordinates[0] || 0,
      address: activePickupAddress,
    },
    pickupScheduledAt: scheduledAt.toISOString(), // ✅ now includes the actual slot hour
    luggage,
    notes: notes.trim(),
  };

  createBooking.mutate(bookingPayload, {
    onSuccess: () => {
      // Invalidate queries to ensure Schedule tab is fresh
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeBooking });
      
      // Redirect to Schedule tab immediately
      router.replace("/(tabs)/schedule");
    },
    onError: (err: any) => {
      const status = err?.status ?? err?.response?.status;
      const message: string = err?.message ?? "";

      if (status === 409) {
        const isCapacity = message.toLowerCase().includes("capacity");

        if (isCapacity) {
          showError("All nearby stores are currently at full capacity. Please try again later.", "Full Capacity");
        } else {
          showError("You already have an active booking. Please manage or complete it first.", "Active Booking Found");
          refetchActive();
        }
      } else if (status === 400) {
        showError("Pickup time may have expired. Please re-select your time slot and try again.", "Expired Slot");
      } else {
        showError(message || "Failed to schedule pickup. Please try again.");
      }
    },
  });
};
  // ── LOADING STATE ─────────────────────────────────────────────────────────
  const isLoading = isUserLoading || isAddressesLoading || isActiveBookingLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.PRIMARY} />
        <Text style={styles.loadingText}>Setting everything up...</Text>
      </View>
    );
  }

  // ── ACTIVE BOOKING CHECK ──────────────────────────────────────────────────
  if (activeBooking?.bookings && activeBooking.bookings.length > 0) {
    const latestBooking = activeBooking.bookings[0];
    const bid = (latestBooking as any)._id || (latestBooking as any).id;
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={THEME.TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Pickup</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.activeBookingOverlay}>
          <Animated.View entering={FadeInDown} style={styles.activeBookingCard}>
            <LinearGradient
               colors={["#F59E0B", "#D97706"]}
               style={styles.activeIconCircle}
            >
              <MaterialCommunityIcons name="alert-circle-outline" size={50} color="#FFF" />
            </LinearGradient>
            <Text style={styles.activeTitle}>Active Booking Found</Text>
            <Text style={styles.activeSubtitle}>
              You already have a booking in progress. You can only have one active booking at a time to ensure the best service.
            </Text>
            
            <TouchableOpacity 
              style={styles.viewActiveBtn}
              onPress={() => bid && router.push(`/booking/${bid}`)}
            >
              <LinearGradient
                colors={[THEME.PRIMARY, THEME.SECONDARY]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.viewActiveGradient}
              >
                <Text style={styles.viewActiveText}>Manage Active Booking</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={THEME.TEXT_DARK} />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Schedule Pickup</Text>
          <Text style={styles.headerSub}>Date, Time & Items</Text>
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
          {/* ── SECTION: ADDRESS ────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <SectionLabel icon="location" label="Pickup Location" />
            <TouchableOpacity
              style={[
                styles.addressCard,
                addressMode === "custom" && styles.addressCardCustom,
              ]}
              onPress={handleOpenAddressModal}
              activeOpacity={0.85}
            >
              <View style={[styles.addressIconWrap, { backgroundColor: addressMode === "custom" ? `${THEME.PRIMARY}15` : "#F1F5F9" }]}>
                <Ionicons
                  name={addressMode === "custom" ? "location" : "home"}
                  size={22}
                  color={THEME.PRIMARY}
                />
              </View>
              <View style={styles.addressTextWrap}>
                <Text style={styles.addressMode}>
                   {addressMode === "profile" ? "Using default account address" : "Using custom pickup location"}
                </Text>
                <Text style={styles.addressValue} numberOfLines={1}>
                  {activePickupAddress || "Select a pickup location"}
                </Text>
              </View>
              <View style={styles.changeAddressBtn}>
                <Ionicons name="pencil" size={14} color={THEME.PRIMARY} />
                <Text style={styles.changeAddressBtnText}>Change</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* ── SECTION: DATE ────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <SectionLabel icon="calendar-clear-outline" label="Pickup Date" />
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

          {/* ── SECTION: TIME ────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <SectionLabel icon="time-outline" label="Pickup Preferred Time" />
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
                    accessibilityLabel={`Time slot ${slot.time}${disabled ? ", unavailable" : ""}`}
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
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* ── SECTION: ITEMS ───────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <SectionLabel icon="briefcase-outline" label="Luggage Selection" />
            <View style={styles.luggageGrid}>
              {LUGGAGE_TYPES.map((type, index) => (
                <View key={type.id} style={styles.luggageItem}>
                  <View style={[styles.luggageIconCard, { backgroundColor: `${type.color}15` }]}>
                    <MaterialCommunityIcons name={type.icon as any} size={28} color={type.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.luggageLabel}>{type.label}</Text>
                    <Text style={styles.luggageSub} numberOfLines={1}>{type.sub}</Text>
                  </View>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => handleLuggageChange(type.id, -1)}
                    >
                      <Ionicons name="remove" size={18} color={THEME.TEXT_DARK} />
                    </TouchableOpacity>
                    <Text style={styles.stepValue}>{luggage[type.id]}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => handleLuggageChange(type.id, 1)}
                    >
                      <Ionicons name="add" size={18} color={THEME.TEXT_DARK} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── SECTION: NOTES ───────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <SectionLabel icon="create-outline" label="Additional Notes" />
            <View style={styles.notesContainer}>
              <TextInput
                style={styles.notesInput}
                placeholder="E.g. Please call 15 mins before arrival..."
                placeholderTextColor={THEME.TEXT_MUTED}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── SUMMARY STRIP ────────────────────────────────────────────── */}
      {totalItems > 0 && (
        <Animated.View entering={FadeInUp} exiting={FadeInDown} style={styles.summaryStrip}>
           <View style={styles.selectionDot} />
           <Text style={styles.summaryText}>
             {totalItems} items selected for {selectedDateObj.getDate()} {selectedDateObj.toLocaleDateString('en-US', { month: 'short' })}
           </Text>
        </Animated.View>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={styles.confirmBtnOuter}
          onPress={handleConfirm}
          disabled={createBooking.isPending}
        >
          <LinearGradient
            colors={[THEME.PRIMARY, THEME.SECONDARY]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmBtn}
          >
            {createBooking.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.confirmBtnText}>Schedule Pickup</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── ENHANCED ADDRESS MODAL ───────────────────────────────────── */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={FadeInUp.duration(300)} 
            style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
          >
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Pickup Location</Text>
            <Text style={styles.modalSubtitle}>Where should we collect your bags?</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {/* Default Profile Option */}
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  addressMode === "profile" && styles.modalOptionActive,
                ]}
                onPress={handleUseProfile}
              >
                <View style={[styles.modalOptionIcon, addressMode === "profile" && { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <Ionicons name="home" size={22} color={addressMode === "profile" ? "#FFF" : THEME.PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalOptionLabel, addressMode === "profile" && { color: "#FFF" }]}>
                    Default Profile Address
                  </Text>
                  <Text style={[styles.modalOptionAddress, addressMode === "profile" && { color: "rgba(255,255,255,0.8)" }]} numberOfLines={1}>
                    {profileAddress || "No address set in profile"}
                  </Text>
                </View>
                {addressMode === "profile" && <Ionicons name="checkmark-circle" size={20} color="#FFF" />}
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
                          {addr.is_default ? "Default Address" : `${addr.street}`}
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

              {/* Add New Custom Input */}
              <Text style={styles.miniLabel}>Or enter a new destination</Text>
              <View style={styles.modalInputWrap}>
                <Ionicons name="location-outline" size={20} color={THEME.PRIMARY} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Street, City, Landmark..."
                  placeholderTextColor={THEME.TEXT_MUTED}
                  value={addressInput}
                  onChangeText={(txt) => {
                    setAddressInput(txt);
                    // Clear customAddress state if user is typing manually to avoid conflict
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
                  <Text style={styles.modalSaveText}>Use This Address</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

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

// ── Styles ──────────────────────────────────────────────────────────────────
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
  headerSub: { fontSize: 12, color: THEME.TEXT_MUTED },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 160 },

  // Address
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  addressCardCustom: { borderColor: THEME.PRIMARY, borderWidth: 1.5 },
  addressIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  addressTextWrap: { flex: 1 },
  addressMode: { fontSize: 11, fontWeight: "600", color: THEME.TEXT_MUTED, textTransform: "uppercase" },
  addressValue: { fontSize: 14, fontWeight: "800", color: THEME.TEXT_DARK, marginTop: 4 },
  changeAddressBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${THEME.PRIMARY}10`, padding: 8, borderRadius: 8 },
  changeAddressBtnText: { fontSize: 12, fontWeight: "700", color: THEME.PRIMARY },

  // Date
  dateScroller: { gap: 10 },
  dateCard: {
    width: 72,
    height: 90,
    backgroundColor: "#FFF",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  dateCardActive: { borderColor: THEME.PRIMARY },
  dateLabel: { fontSize: 11, fontWeight: "700", color: THEME.TEXT_MUTED, textTransform: "uppercase" },
  dateDay: { fontSize: 26, fontWeight: "900", color: THEME.TEXT_DARK, marginVertical: 2 },
  dateMonth: { fontSize: 11, fontWeight: "600", color: THEME.TEXT_MUTED },
  textWhite: { color: "#FFF" },

  // Time
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeChip: {
    width: "48%",
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  timeChipActive: { borderColor: THEME.PRIMARY },
  timeChipDisabled: { backgroundColor: "#F8FAFC", opacity: 0.5 },
  timeChipText: { fontSize: 13, fontWeight: "700", color: THEME.TEXT_DARK },
  timeChipTextDisabled: { textDecorationLine: "line-through", color: "#94A3B8" },

  // Luggage
  luggageGrid: { gap: 12 },
  luggageItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  luggageIconCard: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  luggageLabel: { fontSize: 15, fontWeight: "800", color: THEME.TEXT_DARK },
  luggageSub: { fontSize: 12, color: THEME.TEXT_MUTED, marginTop: 2 },
  stepper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 12, padding: 4 },
  stepBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#F1F5F9" },
  stepValue: { paddingHorizontal: 12, fontSize: 16, fontWeight: "800", color: THEME.TEXT_DARK, minWidth: 40, textAlign: "center" },

  // Notes
  notesContainer: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  notesInput: {
    height: 100,
    fontSize: 14,
    color: THEME.TEXT_DARK,
    fontWeight: "600",
  },

  // Summary
  summaryStrip: {
    position: "absolute",
    bottom: 120,
    alignSelf: "center",
    backgroundColor: "#1E293B",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 8 } }),
  },
  selectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.PRIMARY },
  summaryText: { color: "#FFF", fontSize: 14, fontWeight: "700" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    // paddingBottom is handled dynamically
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  confirmBtnOuter: { borderRadius: 18, overflow: "hidden" },
  confirmBtn: { height: 62, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  confirmBtnText: { color: "#FFF", fontSize: 17, fontWeight: "900" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#FFF", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 /* paddingBottom is handled dynamically */ },
  modalHandle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "900", color: THEME.TEXT_DARK, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: THEME.TEXT_MUTED, marginBottom: 24 },
  miniLabel: { fontSize: 11, fontWeight: "800", color: THEME.TEXT_MUTED, textTransform: "uppercase", marginBottom: 12, letterSpacing: 0.5 },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  modalOptionActive: { backgroundColor: THEME.PRIMARY, borderColor: THEME.PRIMARY },
  modalOptionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" },
  modalOptionLabel: { fontSize: 15, fontWeight: "700", color: THEME.TEXT_DARK },
  modalOptionAddress: { fontSize: 12, color: THEME.TEXT_MUTED, marginTop: 2 },
  modalInputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 16, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  modalInput: { flex: 1, height: 50, fontSize: 14, fontWeight: "600", color: THEME.TEXT_DARK },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F9" },
  modalCancelText: { fontSize: 15, fontWeight: "700", color: THEME.TEXT_MUTED },
  modalSaveBtn: { flex: 2, height: 56, borderRadius: 16, overflow: "hidden" },
  modalSaveBtnInner: { flex: 1, alignItems: "center", justifyContent: "center" },
  modalSaveText: { fontSize: 15, fontWeight: "800", color: "#FFF" },

  // Active Booking Overlay
  activeBookingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  activeBookingCard: {
    backgroundColor: "#FFF",
    borderRadius: 32,
    padding: 32,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
      android: { elevation: 8 },
    }),
  },
  activeIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  activeTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: THEME.TEXT_DARK,
    marginBottom: 12,
    textAlign: "center",
  },
  activeSubtitle: {
    fontSize: 15,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  viewActiveBtn: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
  },
  viewActiveGradient: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  viewActiveText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  cancelBtn: {
    padding: 12,
  },
  cancelBtnText: {
    color: THEME.TEXT_MUTED,
    fontSize: 14,
    fontWeight: "700",
  },
});
