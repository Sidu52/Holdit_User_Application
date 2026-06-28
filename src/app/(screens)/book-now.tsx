import React, { useState, useMemo, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
} from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/features/booking/bookingQueries";
import { StatusBar } from "expo-status-bar";

import { UserAddress } from "@/features/auth/authTypes";

const { width } = Dimensions.get("window");

const LUGGAGE_TYPES = [
  {
    id: "small",
    label: "Small Bag",
    sub: "Handbags/Briefcase",
    price: 49,
    oldPrice: 149,
    emoji: "🎒",
    color: "#FACC15",
  },
  {
    id: "medium",
    label: "Medium Bag",
    sub: "Standard Cabin",
    price: 99,
    oldPrice: 199,
    emoji: "💼",
    color: "#3B82F6",
  },
  {
    id: "large",
    label: "Large Bag",
    sub: "Check-in Suitcase",
    price: 149,
    oldPrice: 299,
    emoji: "🧳",
    color: "#EF4444",
  },
  {
    id: "other",
    label: "Other Item",
    sub: "Odd size items",
    price: 199,
    oldPrice: 399,
    emoji: "📦",
    color: "#10B981",
  },
];

const AVAILABLE_COUPONS = [
  {
    id: "1",
    code: "WELCOME50",
    title: "Flat ₹50 OFF",
    sub: "On your first storage booking",
    type: "discount",
  },
  {
    id: "2",
    code: "HOLDIT10",
    title: "10% Instant Discount",
    sub: "Valid on bookings above ₹200",
    type: "percent",
  },
  {
    id: "3",
    code: "AMZPAY50",
    title: "Upto ₹50 Cashback",
    sub: "Pay using Amazon Pay Wallet",
    type: "payment",
  },
  {
    id: "4",
    code: "FREEBIE",
    title: "Free Tamper-proof Seal",
    sub: "Add security to your bags for free",
    type: "service",
  },
];

export default function BookNowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: user, isLoading: isUserLoading } = useProfile();
  const { data: addresses } = useAddresses();

  const createBooking = useCreateBooking();

  // STATE
  const [luggage, setLuggage] = useState<Record<string, number>>({
    small: 0,
    medium: 0,
    large: 0,
    other: 0,
  });
  const [activeTab, setActiveTab] = useState<"Tip" | "Instructions">("Tip");
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressMode, setAddressMode] = useState<"profile" | "saved" | "custom">("profile");
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<UserAddress | null>(null);
  const [customAddress, setCustomAddress] = useState("");
  const [isBagSelected, setIsBagSelected] = useState(true);

  // Edit User Bottom Sheet
  const [showEditUser, setShowEditUser] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  // Override display names if user edited them locally
  const [localFirstName, setLocalFirstName] = useState<string | null>(null);
  const [localLastName, setLocalLastName] = useState<string | null>(null);
  const [localPhone, setLocalPhone] = useState<string | null>(null);

  // Coupons Modal
  const [showAllCoupons, setShowAllCoupons] = useState(false);
  const [typedCoupon, setTypedCoupon] = useState("");

  const toggleCoupon = (code: string) => {
    if (couponCode === code) {
      setCouponCode("");
      showInfo("Coupon removed");
    } else {
      setCouponCode(code);
      showSuccess(`Coupon ${code} applied!`);
    }
  };

  const openEditUser = () => {
    setEditFirstName(localFirstName ?? user?.first_name ?? "");
    setEditLastName(localLastName ?? user?.last_name ?? "");
    setEditPhone(localPhone ?? user?.phone ?? "");
    setShowEditUser(true);
  };

  const saveEditUser = () => {
    setLocalFirstName(editFirstName.trim() || null);
    setLocalLastName(editLastName.trim() || null);
    setLocalPhone(editPhone.trim() || null);
    setShowEditUser(false);
  };

  // Resolved display values
  const displayFirstName = localFirstName ?? user?.first_name ?? "";
  const displayLastName = localLastName ?? user?.last_name ?? "";
  const displayPhone = localPhone ?? user?.phone ?? "";

  // COMPUTED
  const totalItems = Object.values(luggage).reduce((a, b) => a + b, 0);
  const subtotal = LUGGAGE_TYPES.reduce((acc, item) => acc + (luggage[item.id] * item.price), 0);
  const totalSavings = LUGGAGE_TYPES.reduce((acc, item) => acc + (luggage[item.id] * (item.oldPrice - item.price)), 0);
  const totalToPay = subtotal + tipAmount;
  // Resolve default address from saved addresses list
  const defaultAddress = useMemo(() => {
    return user?.addresses?.find((addr) => addr.is_default) || addresses?.find((addr) => addr.is_default);
  }, [user?.addresses, addresses]);

  const defaultAddressString = useMemo(() => {
    if (!defaultAddress) return null;
    return [
      defaultAddress.street,
      defaultAddress.city,
      defaultAddress.state,
      defaultAddress.postal_code,
      defaultAddress.country,
    ].filter(Boolean).join(", ");
  }, [defaultAddress]);

  // Automatically fall back to default address if profile home has no set address
  useEffect(() => {
    if (addressMode === "profile" && !user?.location?.address && defaultAddress && !selectedSavedAddress) {
      setAddressMode("saved");
      setSelectedSavedAddress(defaultAddress);
    }
  }, [addressMode, user?.location?.address, defaultAddress, selectedSavedAddress]);

  const displayAddress = useMemo(() => {
    if (addressMode === "custom") return customAddress;
    if (addressMode === "saved" && selectedSavedAddress) {
      return [
        selectedSavedAddress.street,
        selectedSavedAddress.city,
        selectedSavedAddress.state,
        selectedSavedAddress.postal_code,
        selectedSavedAddress.country,
      ].filter(Boolean).join(", ");
    }
    return user?.location?.address || defaultAddressString || "Set your address";
  }, [addressMode, customAddress, selectedSavedAddress, user?.location?.address, defaultAddressString]);

  // HANDLERS
  const handleLuggageChange = (id: string, delta: number) => {
    setLuggage((prev) => ({
      ...prev,
      [id]: Math.max(0, prev[id] + delta),
    }));
  };

  const handleConfirm = (method: "cash" | "online") => {
    console.log("------------------------method", method);
    if (totalItems === 0) {
      showError("Please add at least one luggage item.", "No Items Selected");
      return;
    }
    if (!displayAddress || displayAddress === "Set your address") {
      showError("Please provide a pickup address.", "Address Required");
      return;
    }

    let bookingLat = 0;
    let bookingLng = 0;

    if (addressMode === "custom") {
      bookingLat = user?.location?.coordinates?.[1] || 0;
      bookingLng = user?.location?.coordinates?.[0] || 0;
    } else if (addressMode === "saved" && selectedSavedAddress) {
      bookingLng = selectedSavedAddress.coordinates?.[0] || 0;
      bookingLat = selectedSavedAddress.coordinates?.[1] || 0;
    } else {
      if (user?.location?.address && user?.location?.coordinates) {
        bookingLng = user.location.coordinates[0] || 0;
        bookingLat = user.location.coordinates[1] || 0;
      } else if (defaultAddress) {
        bookingLng = defaultAddress.coordinates?.[0] || 0;
        bookingLat = defaultAddress.coordinates?.[1] || 0;
      }
    }

    const payload: any = {
      pickupLocation: {
        lat: bookingLat,
        lng: bookingLng,
        address: displayAddress,
      },
      luggage,
    };

    if (notes.trim()) payload.notes = notes.trim();
    if (tipAmount > 0) payload.tipAmount = tipAmount;
    if (couponCode.trim()) payload.coupenCode = couponCode.trim();

    console.log("------------------------payload", payload);
    createBooking.mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeBooking });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings });
        showSuccess("Booking scheduled successfully!");
        router.replace("/(tabs)/schedule");
      },
      onError: (err: any) => {
        showError(err?.message || "Failed to schedule pickup.");
      },
    });
  };

  if (isUserLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={THEME.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* 1. Header (Compact Location Bar) */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationBar} onPress={() => setShowAddressModal(true)}>
            <View>
              <View style={styles.locationRow}>
                <Text style={styles.locationTitle}>Home</Text>
                <Ionicons name="chevron-down" size={14} color={THEME.TEXT_DARK} />
              </View>
              <Text style={styles.locationValue} numberOfLines={1}>{displayAddress}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 4.5 Coupons & Offers Section */}
        <View style={styles.couponSection}>
          {totalSavings > 0 && (
            <View style={styles.savingsBanner}>
              <Text style={styles.savingsBannerText}>
                Yay! You saved <Text style={{ fontWeight: "900" }}>₹{totalSavings}</Text> on this order <Ionicons name="chevron-down" size={12} color="#16A34A" />
              </Text>
            </View>
          )}
          <View style={styles.couponHeaderCard}>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
            <Text style={styles.couponHeaderText}>Apply coupons + payment offers & save more</Text>
          </View>

          <View style={styles.couponBodyCard}>
            <Text style={styles.couponTitle}>Coupons & offers</Text>

            {/* Offer 1.1 */}
            <View style={styles.couponRow}>
              <View style={[styles.couponIconBox, { backgroundColor: "#F0FDF4" }]}>
                <Ionicons name="pricetag" size={18} color="#16A34A" />
              </View>
              <View style={styles.couponInfo}>
                <Text style={styles.couponRowTitle}>Save ₹50 with BONUSOFF50</Text>
                <Text style={styles.couponRowSub}>Shop for ₹233 more to apply</Text>
                <TouchableOpacity onPress={() => setShowAllCoupons(true)}>
                  <Text style={styles.viewCouponsLink}>View all coupons <Ionicons name="chevron-forward" size={10} /></Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.lockedBtn}
                onPress={() => showInfo("Add more items to unlock this coupon!")}
              >
                <Text style={styles.lockedBtnText}>Locked</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.couponDivider} />

            {/* Offer 2 */}
            <View style={styles.couponRow}>
              <View style={[styles.couponIconBox, { backgroundColor: "#1F2937" }]}>
                <Text style={styles.payIconText}>pay</Text>
              </View>
              <View style={styles.couponInfo}>
                <Text style={styles.couponRowTitle}>Upto ₹50 Cashback with Amazon Pay</Text>
                <TouchableOpacity onPress={() => setShowAllCoupons(true)}>
                  <Text style={styles.viewCouponsLink}>View all payment offers <Ionicons name="chevron-forward" size={10} /></Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={couponCode === "AMZPAY50" ? styles.removeBtn : styles.applyBtn}
                onPress={() => toggleCoupon("AMZPAY50")}
              >
                <Text style={couponCode === "AMZPAY50" ? styles.removeBtnText : styles.applyBtnText}>
                  {couponCode === "AMZPAY50" ? "Remove" : "Apply"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 2. Selection Header */}
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionTitle}>Select items to store</Text>
          <Text style={styles.selectionSub}>Prices are per item / 24 hours</Text>
        </View>

        {/* 3. Luggage Selection (Simplified List style) */}
        <View style={styles.section}>
          <View style={styles.luggageList}>
            {LUGGAGE_TYPES.map((item, idx) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(idx * 50).springify()} style={styles.luggageRow}>
                <View style={styles.luggageIconBox}>
                  <Text style={styles.luggageEmoji}>{item.emoji}</Text>
                </View>

                <View style={styles.luggageDetails}>
                  <Text style={styles.luggageLabel}>{item.label}</Text>
                  <Text style={styles.luggageSubText}>{item.sub}</Text>
                  <Text style={styles.luggagePrice}>₹{item.price} / day</Text>
                </View>

                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, luggage[item.id] === 0 && styles.stepperDisabled]}
                    onPress={() => handleLuggageChange(item.id, -1)}
                    disabled={luggage[item.id] === 0}
                  >
                    <Ionicons name="remove" size={18} color={luggage[item.id] === 0 ? "#CBD5E1" : THEME.PRIMARY} />
                  </TouchableOpacity>

                  <Text style={styles.stepperValue}>{luggage[item.id]}</Text>

                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleLuggageChange(item.id, 1)}
                  >
                    <Ionicons name="add" size={18} color={THEME.PRIMARY} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* 4. Interactive Tabs (Give a Tip / Instructions) */}
        <View style={styles.tabSection}>
          <View style={styles.tabHeader}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "Tip" && styles.activeTab]}
              onPress={() => setActiveTab("Tip")}
            >
              <Text style={[styles.tabLabel, activeTab === "Tip" && styles.activeTabLabel]}>Give a Tip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "Instructions" && styles.activeTab]}
              onPress={() => setActiveTab("Instructions")}
            >
              <Text style={[styles.tabLabel, activeTab === "Instructions" && styles.activeTabLabel]}>Pickup Instructions</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContent}>
            {activeTab === "Tip" ? (
              <View style={styles.tipInner}>
                <View style={styles.tipTextRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tipHeadline}>Tip Pickup Partner</Text>
                    <Text style={styles.tipSubline}>Help them earn a little extra for their effort. 100% of this tip will go to them.</Text>
                  </View>
                  <Image
                    source={{ uri: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png" }}
                    style={styles.driverImg}
                  />
                </View>

                <View style={styles.tipAmountRow}>
                  {[10, 35, 50].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.tipChip, tipAmount === amt && styles.activeTipChip]}
                      onPress={() => setTipAmount(amt)}
                    >
                      <Text style={styles.tipChipEmoji}>{amt === 10 ? "☕" : amt === 35 ? "🥪" : "🍲"}</Text>
                      <Text style={[styles.tipChipText, tipAmount === amt && styles.activeTipChipText]}>₹{amt}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.tipChip}
                    onPress={() => {
                      // Toggle or custom logic
                      showInfo("Enter custom tip in the instructions if needed", "Custom Tip");
                    }}
                  >
                    <Text style={styles.tipChipEmoji}>🙏</Text>
                    <Text style={styles.tipChipText}>Other</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.instructionInner}>
                <TextInput
                  style={styles.instructionInput}
                  placeholder="e.g., Leave at reception, call upon arrival..."
                  multiline
                  value={notes}
                  onChangeText={(val) => setNotes(val)}
                  placeholderTextColor={THEME.TEXT_DARK_SECONDARY}
                />
              </View>
            )}
          </View>
        </View>


        {/* 5. User Identity Card */}
        <View style={styles.identityCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.identityLabel}>
              Ordering for <Text style={styles.identityName}>{displayFirstName} {displayLastName}</Text>, {displayPhone}
            </Text>
          </View>
          <TouchableOpacity onPress={openEditUser}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* 6. GST Invoice Card (TEMP DISABLED) */}
        {/* <TouchableOpacity style={styles.gstCard}>
          <View style={styles.gstIconBox}>
            <Ionicons name="document-text-outline" size={20} color={THEME.TEXT_DARK} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.gstTitle}>Get GST Invoice</Text>
            <Text style={styles.gstSub}>Claim up to 28% with the GST Invoice</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={THEME.TEXT_DARK} />
        </TouchableOpacity> */}

        {/* 7. Security / Bag Toggle */}
        <TouchableOpacity
          style={styles.securityToggle}
          activeOpacity={0.8}
          onPress={() => setIsBagSelected(!isBagSelected)}
        >
          <Ionicons
            name={isBagSelected ? "checkbox" : "square-outline"}
            size={24}
            color={isBagSelected ? THEME.PRIMARY : THEME.TEXT_DARK_SECONDARY}
          />
          <Text style={styles.securityText}>I need tamper-proof security seals (Eco-friendly) 🌱</Text>
          <Ionicons name="chevron-forward" size={20} color={THEME.TEXT_DARK_SECONDARY} />
        </TouchableOpacity>

      </ScrollView>

      {/* 8. Sticky Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.footerRow}>
          <View style={styles.toPayBox}>
            <Text style={styles.toPayLabel}>To Pay</Text>
            <Text style={styles.toPayValue}>₹{totalToPay}</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.fullWidthPayBtn}
              onPress={() => handleConfirm("online")}
              disabled={createBooking.isPending}
            >
              <LinearGradient colors={[THEME.PRIMARY, THEME.PRIMARY_LIGHT]} style={styles.primaryGradientFull}>
                {createBooking.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.payText}>Pay Online & Confirm</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ADDRESS MODAL */}
      <Modal visible={showAddressModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Delivery Location</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Ionicons name="close" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {user?.location?.address ? (
                <TouchableOpacity
                  style={[
                    styles.modalAddressItem,
                    addressMode === "profile" && !selectedSavedAddress && { borderColor: THEME.PRIMARY, borderWidth: 1 }
                  ]}
                  onPress={() => { setAddressMode("profile"); setSelectedSavedAddress(null); setShowAddressModal(false); }}
                >
                  <Ionicons name="location-outline" size={20} color={THEME.PRIMARY} />
                  <Text style={styles.modalAddressText}>{user.location.address}</Text>
                </TouchableOpacity>
              ) : null}

              {addresses && addresses.map((addr) => {
                const formatted = [addr.street, addr.city, addr.state, addr.postal_code, addr.country].filter(Boolean).join(", ");
                const isSelected = addressMode === "saved" && selectedSavedAddress?._id === addr._id;
                return (
                  <TouchableOpacity
                    key={addr._id}
                    style={[
                      styles.modalAddressItem,
                      isSelected && { borderColor: THEME.PRIMARY, borderWidth: 1 }
                    ]}
                    onPress={() => {
                      setAddressMode("saved");
                      setSelectedSavedAddress(addr);
                      setShowAddressModal(false);
                    }}
                  >
                    <Ionicons name={addr.address_type === "Home" ? "home-outline" : "briefcase-outline"} size={20} color={THEME.PRIMARY} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", fontSize: 13, color: THEME.TEXT_DARK }}>
                        {addr.address_type || "Saved Address"} {addr.is_default && "(Default)"}
                      </Text>
                      <Text style={styles.modalAddressText}>{formatted}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[styles.modalAddressItem, { backgroundColor: THEME.TRANSPARENT_PRIMARY || "rgba(79, 70, 229, 0.1)" }]}
                onPress={() => {
                  setShowAddressModal(false);
                  router.push("/addresses");
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color={THEME.PRIMARY} />
                <Text style={[styles.modalAddressText, { color: THEME.PRIMARY, fontWeight: "700" }]}>Manage / Add New Address</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT USER BOTTOM SHEET */}
      <Modal visible={showEditUser} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.editUserSheet}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Details</Text>
                <Text style={styles.editUserSubtitle}>Used for booking confirmation</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditUser(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={THEME.TEXT_DARK} />
              </TouchableOpacity>
            </View>

            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={16} color={THEME.TEXT_DARK_SECONDARY} style={styles.inputIcon} />
                <TextInput
                  style={styles.editInput}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor={THEME.TEXT_DARK_SECONDARY}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={16} color={THEME.TEXT_DARK_SECONDARY} style={styles.inputIcon} />
                <TextInput
                  style={styles.editInput}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Enter last name"
                  placeholderTextColor={THEME.TEXT_DARK_SECONDARY}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={16} color={THEME.TEXT_DARK_SECONDARY} style={styles.inputIcon} />
                <TextInput
                  style={styles.editInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Enter phone number"
                  placeholderTextColor={THEME.TEXT_DARK_SECONDARY}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.editUserActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditUser(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEditUser}>
                <LinearGradient
                  colors={[THEME.PRIMARY, THEME.PRIMARY_LIGHT]}
                  style={styles.saveBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                  <Text style={styles.saveBtnText}>Save Details</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ALL COUPONS MODAL */}
      <Modal visible={showAllCoupons} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.allCouponsSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Offers</Text>
              <TouchableOpacity onPress={() => setShowAllCoupons(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} />
              </TouchableOpacity>
            </View>

            {/* Manual Entry */}
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.manualCouponInput}
                placeholder="Enter coupon code"
                value={typedCoupon}
                onChangeText={setTypedCoupon}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.manualApplyBtn}
                onPress={() => {
                  if (typedCoupon.trim()) {
                    toggleCoupon(typedCoupon.trim().toUpperCase());
                    setTypedCoupon("");
                  }
                }}
              >
                <Text style={styles.manualApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.couponsListScroll}>
              {AVAILABLE_COUPONS.map((cp) => (
                <View key={cp.id} style={styles.couponListItem}>
                  <View style={[styles.listItemIcon, {
                    backgroundColor: cp.type === "discount" ? "#F0FDF4" :
                      cp.type === "payment" ? "#1F2937" : "#EFF6FF"
                  }]}>
                    {cp.type === "payment" ? (
                      <Text style={styles.payIconTextSmall}>pay</Text>
                    ) : (
                      <Ionicons
                        name={cp.type === "discount" ? "pricetag" : "gift"}
                        size={16}
                        color={cp.type === "discount" ? "#16A34A" : THEME.PRIMARY}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cpListTitle}>{cp.title}</Text>
                    <Text style={styles.cpListSub}>{cp.sub}</Text>
                    <Text style={styles.cpListCode}>{cp.code}</Text>
                  </View>
                  <TouchableOpacity
                    style={couponCode === cp.code ? styles.removeBtnList : styles.applyBtnList}
                    onPress={() => toggleCoupon(cp.code)}
                  >
                    <Text style={couponCode === cp.code ? styles.removeBtnTextList : styles.applyBtnTextList}>
                      {couponCode === cp.code ? "Remove" : "Apply"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Header
  header: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER_LIGHT,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  locationBar: {
    flex: 1,
    marginHorizontal: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  locationValue: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
    marginTop: 2,
  },
  favButton: {
    padding: 8,
  },
  // Scroll Content
  scrollContent: {
    paddingBottom: 150,
  },
  // Sections
  section: {
    marginTop: 10,
  },
  selectionHeader: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  selectionSub: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
    marginTop: 4,
  },
  luggageList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  luggageRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
  },
  luggageIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  luggageEmoji: {
    fontSize: 24,
  },
  luggageDetails: {
    flex: 1,
  },
  luggageLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  luggageSubText: {
    fontSize: 11,
    color: THEME.TEXT_DARK_SECONDARY,
    marginTop: 2,
  },
  luggagePrice: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.PRIMARY,
    marginTop: 4,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8F9FA",
    padding: 6,
    borderRadius: 15,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
  },
  stepperDisabled: {
    opacity: 0.5,
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
    minWidth: 20,
    textAlign: "center",
  },
  // Tab Section
  tabSection: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: THEME.TRANSPARENT_PRIMARY,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: THEME.TRANSPARENT_SECONDARY,
  },
  tabHeader: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.5)",
    padding: 6,
    borderRadius: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabLabel: {
    color: THEME.TEXT_DARK,
    fontWeight: "800",
  },
  tabContent: {
    padding: 20,
  },
  tipInner: {
  },
  tipTextRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipHeadline: {
    fontSize: 15,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  tipSubline: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
    lineHeight: 18,
    marginTop: 4,
  },
  safetyLink: {
    fontSize: 12,
    color: "#6B7280",
    textDecorationLine: "underline",
    marginTop: 8,
  },
  driverImg: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  tipAmountRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  tipChip: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  activeTipChip: {
    borderColor: THEME.PRIMARY,
    backgroundColor: THEME.TRANSPARENT_PRIMARY,
  },
  tipChipEmoji: {
    fontSize: 12,
  },
  tipChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  activeTipChipText: {
    color: THEME.PRIMARY,
  },
  instructionInner: {
    minHeight: 100,
  },
  instructionInput: {
    fontSize: 14,
    color: THEME.TEXT_DARK,
  },
  // Identity Card
  identityCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
    alignItems: "center",
  },
  identityLabel: {
    fontSize: 14,
    color: THEME.TEXT_DARK,
  },
  identityName: {
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  editText: {
    color: THEME.PRIMARY,
    fontWeight: "800",
    fontSize: 14,
  },
  // Savings Banner
  savingsBanner: {
    backgroundColor: "#DCFCE7",
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  savingsBannerText: {
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "600",
  },
  // Coupon Section
  couponSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  couponHeaderCard: {
    backgroundColor: "#EFF6FF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    borderBottomWidth: 0,
    gap: 10,
  },
  newBadge: {
    backgroundColor: THEME.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
  },
  couponHeaderText: {
    fontSize: 12,
    color: "#437b66ff",
    fontWeight: "700",
    flex: 1,
  },
  couponBodyCard: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
  },
  couponTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
    marginBottom: 16,
  },
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  couponIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
  },
  payIconText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
  },
  couponInfo: {
    flex: 1,
  },
  couponRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  couponRowSub: {
    fontSize: 11,
    color: "#D97706",
    fontWeight: "600",
    marginTop: 2,
  },
  viewCouponsLink: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
    fontWeight: "600",
    marginTop: 4,
  },
  applyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#BE123C",
  },
  lockedBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  lockedBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#9CA3AF",
  },
  removeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#DC2626",
  },
  couponDivider: {
    height: 1,
    backgroundColor: THEME.BORDER_LIGHT,
    marginVertical: 16,
    borderStyle: "dashed",
    borderRadius: 1,
  },
  // All Coupons Sheet
  allCouponsSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: "85%",
  },
  couponInputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  manualCouponInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: THEME.BORDER_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  manualApplyBtn: {
    backgroundColor: THEME.PRIMARY,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
  },
  manualApplyText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
  couponsListScroll: {
    marginTop: 8,
  },
  couponListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 16,
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  payIconTextSmall: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
  },
  cpListTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  cpListSub: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
    marginTop: 2,
  },
  cpListCode: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.PRIMARY,
    backgroundColor: THEME.TRANSPARENT_PRIMARY,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  applyBtnList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  applyBtnTextList: {
    color: "#BE123C",
    fontWeight: "800",
    fontSize: 14,
  },
  removeBtnList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  removeBtnTextList: {
    color: "#DC2626",
    fontWeight: "800",
    fontSize: 14,
  },
  // Edit User Sheet
  editUserSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 20,
  },
  editUserSubtitle: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  inputGroup: {
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.TEXT_DARK_SECONDARY,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: THEME.BORDER_LIGHT,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  editInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  editUserActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.TEXT_DARK_SECONDARY,
  },
  saveBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  saveBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFF",
  },
  // GST Card
  gstCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
    alignItems: "center",
    gap: 12,
  },
  gstIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  gstTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  gstSub: {
    fontSize: 11,
    color: THEME.TEXT_DARK_SECONDARY,
    marginTop: 2,
  },
  // Security Toggle
  securityToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    gap: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#065F46",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.BORDER_LIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toPayBox: {
  },
  toPayLabel: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
    fontWeight: "600",
  },
  toPayValue: {
    fontSize: 22,
    fontWeight: "900",
    color: THEME.TEXT_DARK,
  },
  buttonRow: {
    flex: 1,
    marginLeft: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  fullWidthPayBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  primaryGradientFull: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  payText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  modalAddressItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    gap: 12,
  },
  modalAddressText: {
    fontSize: 14,
    color: THEME.TEXT_DARK,
    flex: 1,
  },
});