import { THEME } from "@/theme/theme";; // Update theme constant to #f4d125
import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  MapPin,
  ShieldCheck,
} from "lucide-react-native";
// import { useCreateBooking } from "@/features/booking/booking.queries";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useUserLocation } from "@/hooks/useUserLocation";

// Configuration based on your HTML
const PRICES = { small: 5, medium: 8, large: 12, other: 10 };
const SERVICE_FEE = 2.5;
const BASE_FARE = 5.0;

export default function BookingScreen() {
  const { data: location } = useUserLocation();
  // const { mutateAsync, isPending } = useCreateBooking();

  const [luggage, setLuggage] = useState({
    small: 1,
    medium: 1,
    large: 0,
    other: 0,
  });
  const [pickupLocation, setPickupLocation] = useState({
    address: "Connaught Place, Delhi",
    lat: location?.lat,
    lng: location?.lng,
  });

  useEffect(() => {
    console.log("location", location);
    setPickupLocation((prev) => ({
      ...prev,
      lat: location?.lat,
      lng: location?.lng,
    }));
  }, [location]);

  const updateCount = (type: keyof typeof luggage, delta: number) => {
    setLuggage((prev) => ({
      ...prev,
      [type]: Math.max(0, (prev[type] || 0) + delta),
    }));
  };

  // Price Calculations
  const storageFee = useMemo(() => {
    return Object.entries(luggage).reduce(
      (acc, [key, count]) => acc + count * PRICES[key as keyof typeof PRICES],
      0,
    );
  }, [luggage]);

  const totalItems = Object.values(luggage).reduce((a, b) => a + b, 0);
  const totalAmount = storageFee + SERVICE_FEE + BASE_FARE;

  // Handle Booking Submission
  const handleSubmit = async () => {
    const totalItems = Object.values(luggage).reduce((a, b) => a + b, 0);

    if (totalItems === 0) {
      Alert.alert("Select luggage", "Please add at least one luggage item.");
      return;
    }

    const payload = {
      luggage,
      pickupLocation,
      pricing: {
        baseFare: BASE_FARE,
        serviceFee: SERVICE_FEE,
        storageFee,
        totalAmount,
      },
    };

    try {
      // const response = await mutateAsync(payload);
      // console.log("location ", response);
    } catch (error: any) {
      console.log("ERROR", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView
          style={{ backgroundColor: THEME.PRIMARY, paddingBottom: 16 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton}>
              <ArrowLeft size={24} color="white" strokeWidth={3} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Holdit Booking</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Luggage Selection */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Select Luggage</Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>VERIFIED</Text>
          </View>
        </View>

        <View style={styles.listGap}>
          <LuggageCard
            title="Small"
            price={PRICES.small}
            count={luggage.small}
            onAdd={() => updateCount("small", 1)}
            onRemove={() => updateCount("small", -1)}
            isActive={luggage.small > 0}
          />
          <LuggageCard
            title="Medium"
            price={PRICES.medium}
            count={luggage.medium}
            onAdd={() => updateCount("medium", 1)}
            onRemove={() => updateCount("medium", -1)}
            isActive={luggage.medium > 0}
          />
          <LuggageCard
            title="Large"
            price={PRICES.large}
            count={luggage.large}
            onAdd={() => updateCount("large", 1)}
            onRemove={() => updateCount("large", -1)}
            isActive={luggage.large > 0}
          />
        </View>

        {/* Location Card */}
        <Text
          style={[styles.sectionLabel, { marginTop: 24, marginBottom: 12 }]}
        >
          Pickup Location
        </Text>
        <View style={styles.locationCard}>
          <View style={styles.locationIconWrap}>
            <MapPin
              size={22}
              color="#f4d125"
              fill="#f4d125"
              fillOpacity={0.2}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.locationMain}>Connaught Place, Delhi</Text>
            <Text style={styles.locationSub}>A-Block, Inner Circle</Text>
          </View>
          <TouchableOpacity style={styles.changeBtn}>
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Security Banner */}
        <View style={styles.securityBanner}>
          <View style={styles.securityIcon}>
            <ShieldCheck size={20} color="#f4d125" />
          </View>
          <View>
            <Text style={styles.securityTitle}>Safe & Secure Storage</Text>
            <Text style={styles.securitySub}>
              All storage locations are verified and insured.
            </Text>
          </View>
        </View>

        {/* Price Summary */}
        <Text
          style={[styles.sectionLabel, { marginTop: 24, marginBottom: 12 }]}
        >
          Price Summary
        </Text>
        <View style={styles.summaryCard}>
          <SummaryRow label="Base Fare" value={`$${BASE_FARE.toFixed(2)}`} />
          <SummaryRow
            label={`Storage Fee (${totalItems} items)`}
            value={`$${storageFee.toFixed(2)}`}
          />
          <SummaryRow
            label="Service Fee"
            value={`$${SERVICE_FEE.toFixed(2)}`}
          />
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.mainButton}
          activeOpacity={0.9}
          onPress={handleSubmit}
          // disabled={isPending}
        >
          <Text style={styles.mainButtonText}>
            {true
            // isPending
             ? "Creating Booking..." : "Continue to Scheduling"}
          </Text>
          <ArrowRight size={20} color="white" strokeWidth={3} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------- Components ---------- */

const LuggageCard = ({
  title,
  price,
  count,
  onAdd,
  onRemove,
  isActive,
}: any) => (
  <View style={[styles.luggageCard, isActive && styles.luggageCardActive]}>
    <View style={styles.luggageIconPlaceholder} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={styles.luggageTitle}>{title}</Text>
      <Text style={styles.luggagePrice}>${price.toFixed(2)}/day</Text>
    </View>
    <View style={styles.counterGroup}>
      <TouchableOpacity onPress={onRemove} style={styles.countBtnSecondary}>
        <Minus size={14} color={count > 0 ? "white" : "#94A3B8"} />
      </TouchableOpacity>
      <Text style={styles.countText}>{count}</Text>
      <TouchableOpacity onPress={onAdd} style={styles.countBtnPrimary}>
        <Plus size={14} color="white" strokeWidth={3} />
      </TouchableOpacity>
    </View>
  </View>
);

const SummaryRow = ({ label, value }: any) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BACKGROUND_LIGHT },
  header: {
    backgroundColor: THEME.PRIMARY,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    color: THEME.TEXT_PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: THEME.TEXT_PRIMARY },

  scrollContent: { padding: 16, paddingBottom: 120 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: THEME.TEXT_DARK_SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  verifiedBadge: {
    backgroundColor: THEME.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "900",
    color: THEME.TEXT_SECONDARY,
  },

  listGap: { gap: 10 },
  luggageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
  },
  luggageCardActive: { borderColor: THEME.PRIMARY, borderWidth: 2 },
  luggageIconPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: THEME.BACKGROUND_LIGHT,
    borderRadius: 8,
  },
  luggageTitle: { fontSize: 14, fontWeight: "700", color: THEME.TEXT_DARK },
  luggagePrice: {
    fontSize: 11,
    color: THEME.TEXT_DARK_SECONDARY,
    marginTop: 2,
  },

  counterGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.BACKGROUND_TERTIARY,
    padding: 4,
    borderRadius: 10,
    gap: 10,
  },
  countBtnSecondary: {
    width: 28,
    height: 28,
    backgroundColor: THEME.SURFACE_PRIMARY,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
  },
  countBtnPrimary: {
    width: 28,
    height: 28,
    backgroundColor: THEME.PRIMARY,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    width: 16,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: THEME.TEXT_PRIMARY,
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
  },
  locationIconWrap: {
    width: 44,
    height: 44,
    backgroundColor: THEME.TRANSPARENT_PRIMARY,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  locationMain: { fontSize: 14, fontWeight: "700", color: THEME.TEXT_DARK },
  locationSub: { fontSize: 11, color: THEME.TEXT_DARK_SECONDARY, marginTop: 2 },
  changeBtn: {
    backgroundColor: THEME.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: THEME.TEXT_SECONDARY,
  },

  securityBanner: {
    flexDirection: "row",
    backgroundColor: THEME.BACKGROUND,
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    alignItems: "center",
  },
  securityIcon: {
    width: 36,
    height: 36,
    backgroundColor: THEME.TRANSPARENT_SECONDARY,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  securityTitle: { fontSize: 12, fontWeight: "700", color: THEME.TEXT_PRIMARY },
  securitySub: { fontSize: 10, color: THEME.TEXT_TERTIARY, marginTop: 2 },

  summaryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
    gap: 12,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 13, color: THEME.TEXT_DARK_SECONDARY },
  summaryValue: { fontSize: 13, fontWeight: "600", color: THEME.TEXT_DARK },
  divider: {
    height: 1,
    backgroundColor: THEME.BORDER_LIGHT,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 14, fontWeight: "800", color: THEME.TEXT_DARK },
  totalBadge: {
    backgroundColor: THEME.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  totalValue: { fontSize: 18, fontWeight: "800", color: THEME.TEXT_SECONDARY },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.BORDER_LIGHT,
    paddingBottom: 34,
  },
  mainButton: {
    backgroundColor: THEME.PRIMARY,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: THEME.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: THEME.TEXT_SECONDARY,
  },
});
