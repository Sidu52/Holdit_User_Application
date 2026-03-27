import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { THEME } from "@/theme/theme";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  useProfile,
  useCreateAddress,
  useUpdateAddress,
} from "@/features/user/user.queries";
import { showSuccess, showError } from "@/utils/toast";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function AddressFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEdit = !!id;

  const { data: user } = useProfile();
  const { mutate: createAddress, isPending: isCreating } = useCreateAddress();
  const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress();

  const isPending = isCreating || isUpdating;

  // Refs
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Map State
  const [region, setRegion] = useState({
    latitude: 19.076, // Default Mumbai
    longitude: 72.8777,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [markerPosition, setMarkerPosition] = useState({
    latitude: 19.076,
    longitude: 72.8777,
  });

  // Form State
  const [form, setForm] = useState({
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    is_default: false,
  });

  // Initialization
  useEffect(() => {
    if (isEdit && user?.addresses) {
      const addr = user.addresses.find((a) => a._id === id);
      if (addr) {
        setForm({
          street: addr.street,
          city: addr.city,
          state: addr.state,
          postal_code: addr.postal_code,
          country: addr.country,
          is_default: addr.is_default,
        });
        if (addr.coordinates) {
          const coords = {
            latitude: addr.coordinates[1],
            longitude: addr.coordinates[0],
          };
          setRegion({
            ...coords,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
          setMarkerPosition(coords);
        }
      }
    } else {
      getCurrentLocation();
    }
  }, [id, user]);

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      showError("Permission to access location was denied");
      return;
    }

    let loc = await Location.getCurrentPositionAsync({});
    const newRegion = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
    setRegion(newRegion);
    setMarkerPosition({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
    mapRef.current?.animateToRegion(newRegion, 1000);
    reverseGeocode(loc.coords.latitude, loc.coords.longitude);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (result && result.length > 0) {
        const addr = result[0];
        setForm((prev) => ({
          ...prev,
          street: addr.name || addr.street || prev.street,
          city: addr.city || prev.city,
          state: addr.region || prev.state,
          postal_code: addr.postalCode || prev.postal_code,
          country: addr.country || prev.country,
        }));
      }
    } catch (err) {
      console.warn("Reverse geocode failed", err);
    }
  };

  const onRegionChangeComplete = (newRegion: any) => {
    setMarkerPosition({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    });
    reverseGeocode(newRegion.latitude, newRegion.longitude);
  };

  const handleSubmit = () => {
    if (!form.street || !form.city || !form.postal_code) {
      showError("Please fill in the required fields");
      return;
    }

    const payload = {
      ...form,
      coordinates: [markerPosition.longitude, markerPosition.latitude] as [
        number,
        number,
      ],
    };

    if (isEdit) {
      updateAddress(
        { id: id!, data: payload },
        {
          onSuccess: () => {
            showSuccess("Address updated");
            router.back();
          },
          onError: (err: any) => showError(err.message || "Update failed"),
        },
      );
    } else {
      createAddress(payload, {
        onSuccess: () => {
          showSuccess("Address added");
          router.back();
        },
        onError: (err: any) => showError(err.message || "Creation failed"),
      });
    }
  };

  // Bottom Sheet Configuration
  const snapPoints = useMemo(() => ["40%", "85%"], []);
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={1}
        disappearsOnIndex={0}
        opacity={0.3}
      />
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
      />

      {/* Center Pin Overlay (Drop Pin Effect) */}
      <View style={styles.markerFixed} pointerEvents="none">
        <Ionicons name="location" size={44} color={THEME.PRIMARY} />
        <View style={styles.markerShadow} />
      </View>

      {/* Floating Header Actions */}
      <SafeAreaView style={styles.headerOverlay} edges={["top"]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.circleBtn}
          >
            <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.overlayTitle}>
            {isEdit ? "Edit Address" : "Add New Address"}
          </Text>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={getCurrentLocation}
          >
            <MaterialIcons name="my-location" size={22} color={THEME.PRIMARY} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: THEME.BORDER_LIGHT, width: 50 }}
        backgroundStyle={{
          backgroundColor: THEME.BACKGROUND_LIGHT,
          borderRadius: 30,
        }}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Address Details</Text>
            <Text style={styles.sheetSubtitle}>
              Move the map to drop the pin on your exact location
            </Text>
          </View>

          <View style={styles.form}>
            {/* Street */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street / Building</Text>
              <BottomSheetTextInput
                style={styles.input}
                placeholder="Ex. 123 Main St"
                value={form.street}
                onChangeText={(t) => setForm({ ...form, street: t })}
              />
            </View>

            <View style={styles.row}>
              {/* City */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>City</Text>
                <BottomSheetTextInput
                  style={styles.input}
                  placeholder="City"
                  value={form.city}
                  onChangeText={(t) => setForm({ ...form, city: t })}
                />
              </View>
              {/* State */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>State</Text>
                <BottomSheetTextInput
                  style={styles.input}
                  placeholder="State"
                  value={form.state}
                  onChangeText={(t) => setForm({ ...form, state: t })}
                />
              </View>
            </View>

            <View style={styles.row}>
              {/* Postal Code */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Postal Code</Text>
                <BottomSheetTextInput
                  style={styles.input}
                  placeholder="000000"
                  keyboardType="number-pad"
                  value={form.postal_code}
                  onChangeText={(t) => setForm({ ...form, postal_code: t })}
                />
              </View>
              {/* Country */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Country</Text>
                <BottomSheetTextInput
                  style={styles.input}
                  placeholder="Country"
                  value={form.country}
                  onChangeText={(t) => setForm({ ...form, country: t })}
                />
              </View>
            </View>

            {/* Default Toggle */}
            <TouchableOpacity
              style={styles.defaultToggle}
              activeOpacity={0.8}
              onPress={() => setForm({ ...form, is_default: !form.is_default })}
            >
              <View
                style={[
                  styles.checkbox,
                  form.is_default && styles.checkboxActive,
                ]}
              >
                {form.is_default && (
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                )}
              </View>
              <Text style={styles.defaultLabel}>Set as Default Address</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, isPending && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.btnText}>
                    {isEdit ? "Update Address" : "Save Address"}
                  </Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerFixed: {
    left: "50%",
    marginLeft: -22,
    marginTop: -44,
    position: "absolute",
    top: "50%",
    alignItems: "center",
  },
  markerShadow: {
    width: 8,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 4,
    marginTop: -2,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sheetHeader: {
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: THEME.TEXT_DARK_SECONDARY,
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 15,
    color: THEME.TEXT_DARK,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  defaultToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 10,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: THEME.BORDER_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: THEME.PRIMARY,
    borderColor: THEME.PRIMARY,
  },
  defaultLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  btn: {
    backgroundColor: THEME.PRIMARY,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
    shadowColor: THEME.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
