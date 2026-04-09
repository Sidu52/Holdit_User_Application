// import React, {
//   useState,
//   useEffect,
//   useRef,
//   useMemo,
//   useCallback,
// } from "react";
// import { StatusBar } from "expo-status-bar";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ActivityIndicator,
//   Platform,
//   Dimensions,
//   Keyboard,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import MapView, { Marker } from "react-native-maps";
// import * as Location from "expo-location";
// import BottomSheet, {
//   BottomSheetScrollView,
//   BottomSheetTextInput,
//   BottomSheetBackdrop,
// } from "@gorhom/bottom-sheet";
// import { Ionicons, MaterialIcons } from "@expo/vector-icons";
// import { THEME } from "@/theme/theme";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import {
//   useProfile,
//   useCreateAddress,
//   useUpdateAddress,
// } from "@/features/user/user.queries";
// import { showSuccess, showError } from "@/utils/toast";

// const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// export default function AddressFormScreen() {
//   const router = useRouter();
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const isEdit = !!id;

//   const { data: user } = useProfile();
//   const { mutate: createAddress, isPending: isCreating } = useCreateAddress();
//   const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress();

//   const isPending = isCreating || isUpdating;

//   // Refs
//   const mapRef = useRef<MapView>(null);
//   const bottomSheetRef = useRef<BottomSheet>(null);

//   // Map State
//   const [region, setRegion] = useState({
//     latitude: 19.076, // Default Mumbai
//     longitude: 72.8777,
//     latitudeDelta: 0.01,
//     longitudeDelta: 0.01,
//   });

//   const [markerPosition, setMarkerPosition] = useState({
//     latitude: 19.076,
//     longitude: 72.8777,
//   });

//   // Form State
//   const [form, setForm] = useState({
//     street: "",
//     city: "",
//     state: "",
//     postal_code: "",
//     country: "",
//     is_default: false,
//     address_type: "Home",
//   });

//   // Initialization
//   useEffect(() => {
//     if (isEdit && user?.addresses) {
//       const addr = user.addresses.find((a) => a._id === id);
//       if (addr) {
//         setForm({
//           street: addr.street,
//           city: addr.city,
//           state: addr.state,
//           postal_code: addr.postal_code,
//           country: addr.country,
//           is_default: addr.is_default,
//           address_type: addr.address_type || "Home",
//         });
//         if (addr.coordinates) {
//           const coords = {
//             latitude: addr.coordinates[1],
//             longitude: addr.coordinates[0],
//           };
//           setRegion({
//             ...coords,
//             latitudeDelta: 0.005,
//             longitudeDelta: 0.005,
//           });
//           setMarkerPosition(coords);
//         }
//       }
//     } else {
//       getCurrentLocation();
//     }
//   }, [id, user]);

//   const getCurrentLocation = async () => {
//     let { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== "granted") {
//       showError("Permission to access location was denied");
//       return;
//     }

//     let loc = await Location.getCurrentPositionAsync({});
//     const newRegion = {
//       latitude: loc.coords.latitude,
//       longitude: loc.coords.longitude,
//       latitudeDelta: 0.005,
//       longitudeDelta: 0.005,
//     };
//     setRegion(newRegion);
//     setMarkerPosition({
//       latitude: loc.coords.latitude,
//       longitude: loc.coords.longitude,
//     });
//     mapRef.current?.animateToRegion(newRegion, 1000);
//     reverseGeocode(loc.coords.latitude, loc.coords.longitude);
//   };

//   const reverseGeocode = async (lat: number, lng: number) => {
//     try {
//       const result = await Location.reverseGeocodeAsync({
//         latitude: lat,
//         longitude: lng,
//       });
//       if (result && result.length > 0) {
//         const addr = result[0];
//         setForm((prev) => ({
//           ...prev,
//           street: addr.name || addr.street || prev.street,
//           city: addr.city || prev.city,
//           state: addr.region || prev.state,
//           postal_code: addr.postalCode || prev.postal_code,
//           country: addr.country || prev.country,
//         }));
//       }
//     } catch (err) {
//       console.warn("Reverse geocode failed", err);
//     }
//   };

//   const onRegionChangeComplete = (newRegion: any) => {
//     setMarkerPosition({
//       latitude: newRegion.latitude,
//       longitude: newRegion.longitude,
//     });
//     reverseGeocode(newRegion.latitude, newRegion.longitude);
//   };

//   const handleSubmit = () => {
//     if (!form.street || !form.city || !form.postal_code) {
//       showError("Please fill in the required fields");
//       return;
//     }

//     const payload = {
//       ...form,
//       country: form.country || "India",
//       coordinates: [markerPosition.longitude, markerPosition.latitude] as [
//         number,
//         number,
//       ],
//     };

//     if (isEdit) {
//       updateAddress(
//         { id: id!, data: payload },
//         {
//           onSuccess: () => {
//             showSuccess("Address updated");
//             router.back();
//           },
//           onError: (err: any) => showError(err.message || "Update failed"),
//         },
//       );
//     } else {
//       createAddress(payload, {
//         onSuccess: () => {
//           showSuccess("Address added");
//           router.back();
//         },
//         onError: (err: any) => showError(err.message || "Creation failed"),
//       });
//     }
//   };

//   // Bottom Sheet Configuration
//   const snapPoints = useMemo(() => ["40%", "85%"], []);
//   const renderBackdrop = useCallback(
//     (props: any) => (
//       <BottomSheetBackdrop
//         {...props}
//         appearsOnIndex={1}
//         disappearsOnIndex={0}
//         opacity={0.3}
//       />
//     ),
//     [],
//   );

//   return (
//     <View style={styles.container}>
//       <StatusBar style="dark" />
//       <MapView
//         ref={mapRef}
//         style={styles.map}
//         initialRegion={region}
//         onRegionChangeComplete={onRegionChangeComplete}
//         showsUserLocation
//         showsMyLocationButton={false}
//       />

//       {/* Center Pin Overlay (Drop Pin Effect) */}
//       <View style={styles.markerFixed} pointerEvents="none">
//         <Ionicons name="location" size={44} color={THEME.PRIMARY} />
//         <View style={styles.markerShadow} />
//       </View>

//       {/* Floating Header Actions */}
//       <SafeAreaView style={styles.headerOverlay} edges={["top"]}>
//         <View style={styles.headerTop}>
//           <TouchableOpacity
//             onPress={() => router.back()}
//             style={styles.circleBtn}
//           >
//             <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
//           </TouchableOpacity>
//           <Text style={styles.overlayTitle}>
//             {isEdit ? "Edit Address" : "Add New Address"}
//           </Text>
//           <TouchableOpacity
//             style={styles.circleBtn}
//             onPress={getCurrentLocation}
//           >
//             <MaterialIcons name="my-location" size={22} color={THEME.PRIMARY} />
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>

//       <BottomSheet
//         ref={bottomSheetRef}
//         index={0}
//         snapPoints={snapPoints}
//         backdropComponent={renderBackdrop}
//         handleIndicatorStyle={{ backgroundColor: THEME.BORDER_LIGHT, width: 50 }}
//         backgroundStyle={{
//           backgroundColor: THEME.BACKGROUND_LIGHT,
//           borderRadius: 30,
//         }}
//         keyboardBehavior="extend"
//         keyboardBlurBehavior="restore"
//       >
//         <BottomSheetScrollView
//           contentContainerStyle={styles.sheetContent}
//           keyboardShouldPersistTaps="handled"
//         >
//           <View style={styles.sheetHeader}>
//             <Text style={styles.sheetTitle}>Address Details</Text>
//             <Text style={styles.sheetSubtitle}>
//               Move the map to drop the pin on your exact location
//             </Text>
//           </View>

//           <View style={styles.form}>
//             {/* Address Type */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Save as</Text>
//               <View style={styles.typeRow}>
//                 {["Home", "Office", "Other"].map((type) => (
//                   <TouchableOpacity
//                     key={type}
//                     style={[
//                       styles.typeBtn,
//                       form.address_type === type && styles.typeBtnActive,
//                     ]}
//                     onPress={() => setForm({ ...form, address_type: type })}
//                   >
//                     <Ionicons
//                       name={type === "Home" ? "home" : type === "Office" ? "business" : "location"}
//                       size={16}
//                       color={form.address_type === type ? "#FFF" : THEME.TEXT_DARK}
//                     />
//                     <Text
//                       style={[
//                         styles.typeText,
//                         form.address_type === type && styles.typeTextActive,
//                       ]}
//                     >
//                       {type}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             </View>

//             {/* Street */}
//             <View style={styles.inputGroup}>
//               <Text style={styles.label}>Street / Building</Text>
//               <BottomSheetTextInput
//                 style={styles.input}
//                 placeholder="Ex. 123 Main St"
//                 value={form.street}
//                 onChangeText={(t) => setForm({ ...form, street: t })}
//               />
//             </View>

//             <View style={styles.row}>
//               {/* City */}
//               <View style={[styles.inputGroup, { flex: 1 }]}>
//                 <Text style={styles.label}>City</Text>
//                 <BottomSheetTextInput
//                   style={styles.input}
//                   placeholder="City"
//                   value={form.city}
//                   onChangeText={(t) => setForm({ ...form, city: t })}
//                 />
//               </View>
//               {/* State */}
//               <View style={[styles.inputGroup, { flex: 1 }]}>
//                 <Text style={styles.label}>State</Text>
//                 <BottomSheetTextInput
//                   style={styles.input}
//                   placeholder="State"
//                   value={form.state}
//                   onChangeText={(t) => setForm({ ...form, state: t })}
//                 />
//               </View>
//             </View>

//             <View style={styles.row}>
//               {/* Postal Code */}
//               <View style={[styles.inputGroup, { flex: 1 }]}>
//                 <Text style={styles.label}>Postal Code</Text>
//                 <BottomSheetTextInput
//                   style={styles.input}
//                   placeholder="000000"
//                   keyboardType="number-pad"
//                   value={form.postal_code}
//                   onChangeText={(t) => setForm({ ...form, postal_code: t })}
//                 />
//               </View>
//               {/* Country */}
//               <View style={[styles.inputGroup, { flex: 1 }]}>
//                 <Text style={styles.label}>Country</Text>
//                 <BottomSheetTextInput
//                   style={styles.input}
//                   placeholder="Country"
//                   value={form.country}
//                   onChangeText={(t) => setForm({ ...form, country: t })}
//                 />
//               </View>
//             </View>

//             {/* Default Toggle */}
//             <TouchableOpacity
//               style={styles.defaultToggle}
//               activeOpacity={0.8}
//               onPress={() => setForm({ ...form, is_default: !form.is_default })}
//             >
//               <View
//                 style={[
//                   styles.checkbox,
//                   form.is_default && styles.checkboxActive,
//                 ]}
//               >
//                 {form.is_default && (
//                   <Ionicons name="checkmark" size={16} color="#FFF" />
//                 )}
//               </View>
//               <Text style={styles.defaultLabel}>Set as Default Address</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.btn, isPending && styles.btnDisabled]}
//               onPress={handleSubmit}
//               disabled={isPending}
//             >
//               {isPending ? (
//                 <ActivityIndicator color="#FFF" />
//               ) : (
//                 <>
//                   <Text style={styles.btnText}>
//                     {isEdit ? "Update Address" : "Save Address"}
//                   </Text>
//                   <Ionicons name="checkmark-circle" size={20} color="#FFF" />
//                 </>
//               )}
//             </TouchableOpacity>
//           </View>
//         </BottomSheetScrollView>
//       </BottomSheet>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   map: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   markerFixed: {
//     left: "50%",
//     marginLeft: -22,
//     marginTop: -44,
//     position: "absolute",
//     top: "50%",
//     alignItems: "center",
//   },
//   markerShadow: {
//     width: 8,
//     height: 4,
//     backgroundColor: "rgba(0,0,0,0.2)",
//     borderRadius: 4,
//     marginTop: -2,
//   },
//   headerOverlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//   },
//   headerTop: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingTop: Platform.OS === "android" ? 40 : 10,
//   },
//   circleBtn: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: "rgba(255,255,255,0.9)",
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   overlayTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: THEME.TEXT_DARK,
//     backgroundColor: "rgba(255,255,255,0.9)",
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     overflow: "hidden",
//   },
//   sheetContent: {
//     paddingHorizontal: 24,
//     paddingTop: 10,
//     paddingBottom: 40,
//   },
//   sheetHeader: {
//     marginBottom: 24,
//   },
//   sheetTitle: {
//     fontSize: 20,
//     fontWeight: "800",
//     color: THEME.TEXT_DARK,
//   },
//   sheetSubtitle: {
//     fontSize: 14,
//     color: THEME.TEXT_DARK_SECONDARY,
//     marginTop: 4,
//   },
//   form: {
//     gap: 16,
//   },
//   row: {
//     flexDirection: "row",
//     gap: 12,
//   },
//   inputGroup: {
//     gap: 6,
//   },
//   label: {
//     fontSize: 13,
//     fontWeight: "700",
//     color: THEME.TEXT_DARK,
//     marginLeft: 4,
//   },
//   input: {
//     backgroundColor: "#F1F5F9",
//     borderRadius: 12,
//     height: 50,
//     paddingHorizontal: 16,
//     fontSize: 15,
//     color: THEME.TEXT_DARK,
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//   },
//   defaultToggle: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 8,
//     gap: 10,
//     paddingVertical: 8,
//   },
//   checkbox: {
//     width: 24,
//     height: 24,
//     borderRadius: 6,
//     borderWidth: 2,
//     borderColor: THEME.BORDER_LIGHT,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   checkboxActive: {
//     backgroundColor: THEME.PRIMARY,
//     borderColor: THEME.PRIMARY,
//   },
//   defaultLabel: {
//     fontSize: 15,
//     fontWeight: "600",
//     color: THEME.TEXT_DARK,
//   },
//   btn: {
//     backgroundColor: THEME.PRIMARY,
//     height: 56,
//     borderRadius: 16,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 10,
//     marginTop: 10,
//     shadowColor: THEME.PRIMARY,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.25,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   btnDisabled: {
//     opacity: 0.7,
//   },
//   btnText: {
//     color: "#FFF",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   typeRow: {
//     flexDirection: "row",
//     gap: 12,
//     marginTop: 4,
//   },
//   typeBtn: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 12,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//     backgroundColor: "#FFF",
//     gap: 6,
//   },
//   typeBtnActive: {
//     backgroundColor: THEME.PRIMARY,
//     borderColor: THEME.PRIMARY,
//   },
//   typeText: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: THEME.TEXT_DARK,
//   },
//   typeTextActive: {
//     color: "#FFF",
//   },
// });


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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
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
import {
  reverseGeocode,
  GeocodedAddress,
  cancelPendingGeocode
} from "@/utils/geocoding";

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
  const webViewRef = useRef<WebView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Location State
  const [markerPosition, setMarkerPosition] = useState({
    latitude: 19.076, // Default Mumbai
    longitude: 72.8777,
  });

  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Form State
  const [form, setForm] = useState({
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    is_default: false,
    address_type: "Home",
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
          address_type: addr.address_type || "Home",
        });
        if (addr.coordinates) {
          const newPosition = {
            latitude: addr.coordinates[1],
            longitude: addr.coordinates[0],
          };
          setMarkerPosition(newPosition);
          // Update map position
          setTimeout(() => {
            updateMapPosition(newPosition.latitude, newPosition.longitude);
          }, 1000);
        }
      }
    } else {
      // Auto-load current location on mount
      getCurrentLocation();
    }

    // Cleanup debounced geocode on unmount
    return () => {
      cancelPendingGeocode();
    };
  }, [id, user]);

  /**
   * Generate OpenStreetMap HTML with Leaflet
   * No API key required - uses free OSM tiles
   */
  const generateMapHTML = (lat: number, lng: number) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Map</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
        <style>
          * { margin: 0; padding: 0; }
          body { height: 100vh; width: 100%; }
          #map { width: 100%; height: 100%; }
          .custom-marker {
            background-color: #FF6B6B;
            border: 3px solid white;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([${lat}, ${lng}], 15);
          
          // Use free OpenStreetMap tiles - no API key needed
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            className: 'map-tiles'
          }).addTo(map);
          
          // Add marker at current position
          const marker = L.marker([${lat}, ${lng}], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: '📍',
              iconSize: [44, 44],
              iconAnchor: [22, 44]
            })
          }).addTo(map);
          
          // Update map when device moves
          window.updateMapPosition = function(lat, lng) {
            map.setView([lat, lng], 15);
            marker.setLatLng([lat, lng]);
          };
          
          // Handle map clicks to set new location
          map.on('click', function(e) {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'locationSelected',
              latitude: lat,
              longitude: lng
            }));
          });
          
          // Show user location button (using device GPS)
          L.Control.extend({
            setPosition: function() { return this; }
          });
        </script>
      </body>
      </html>
    `;
  };

  /**
   * Update map position via WebView message
   */
  const updateMapPosition = (lat: number, lng: number) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (typeof window.updateMapPosition === 'function') {
          window.updateMapPosition(${lat}, ${lng});
        }
      `);
    }
  };

  /**
   * Get current device location using Expo Location
   */
  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showError("Permission to access location was denied");
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      setMarkerPosition({ latitude, longitude });

      // Update map with new position
      setTimeout(() => {
        updateMapPosition(latitude, longitude);
      }, 500);

      // Auto-geocode the location
      await performReverseGeocode(latitude, longitude);
    } catch (err) {
      console.error("Error getting location:", err);
      showError("Failed to get your location");
    } finally {
      setIsLocating(false);
    }
  };

  /**
   * Perform reverse geocoding using Nominatim
   */
  const performReverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const address = await reverseGeocode(lat, lng);

      if (address) {
        setForm((prev) => ({
          ...prev,
          street: address.street || prev.street,
          city: address.city || prev.city,
          state: address.state || prev.state,
          postal_code: address.postal_code || prev.postal_code,
          country: address.country || prev.country,
        }));
      }
    } catch (err) {
      console.error("Reverse geocode error:", err);
      // Silently fail - user can manually enter address
    } finally {
      setIsGeocoding(false);
    }
  };

  /**
   * Handle location refresh button press
   */
  const handleRefreshLocation = async () => {
    await getCurrentLocation();
  };

  /**
   * Handle map location selection (when user taps on map)
   */
  const handleMapMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'locationSelected') {
        const { latitude, longitude } = message;
        setMarkerPosition({ latitude, longitude });
        performReverseGeocode(latitude, longitude);
      }
    } catch (err) {
      console.error("Error handling map message:", err);
    }
  };

  /**
   * Validate and submit form
   */
  const handleSubmit = () => {
    if (!form.street || !form.city || !form.postal_code) {
      showError("Please fill in street, city, and postal code");
      return;
    }

    const payload = {
      ...form,
      country: form.country || "India",
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
        }
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
  const snapPoints = useMemo(() => ["40%", "50%"], []);
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={1}
        disappearsOnIndex={0}
        opacity={0.3}
      />
    ),
    []
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* OpenStreetMap Background (Free tiles, no API key) */}
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{
          html: generateMapHTML(markerPosition.latitude, markerPosition.longitude),
        }}
        onMessage={handleMapMessage}
        javaScriptEnabled={true}
        onLoad={() => setMapLoaded(true)}
        scalesPageToFit={true}
        scrollEnabled={true}
      />

      {/* Center Pin Overlay */}
      {!mapLoaded && (
        <View style={styles.mapLoadingOverlay}>
          <ActivityIndicator size="large" color={THEME.PRIMARY} />
          <Text style={styles.mapLoadingText}>Loading map...</Text>
        </View>
      )}

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
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.overlayTitle}>
            {isEdit ? "Edit Address" : "Add New Address"}
          </Text>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={handleRefreshLocation}
            activeOpacity={0.7}
            disabled={isLocating}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={THEME.PRIMARY} />
            ) : (
              <MaterialIcons name="my-location" size={22} color={THEME.PRIMARY} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Hint Text */}
      {mapLoaded && !isEdit && (
        <View style={styles.hintContainer}>
          <Ionicons name="information-circle" size={16} color={THEME.PRIMARY} />
          <Text style={styles.hintText}>Tap map to select location</Text>
        </View>
      )}

      {/* Bottom Sheet Form */}
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
              Move the map or tap to drop the pin on your exact location
            </Text>
          </View>

          <View style={styles.form}>
            {/* Address Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Save as</Text>
              <View style={styles.typeRow}>
                {["Home", "Office", "Other"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeBtn,
                      form.address_type === type && styles.typeBtnActive,
                    ]}
                    onPress={() => setForm({ ...form, address_type: type })}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        type === "Home"
                          ? "home"
                          : type === "Office"
                            ? "business"
                            : "location"
                      }
                      size={16}
                      color={form.address_type === type ? "#FFF" : THEME.TEXT_DARK}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        form.address_type === type && styles.typeTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Street / Building */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street / Building</Text>
              <BottomSheetTextInput
                style={styles.input}
                placeholder="Ex. 123 Main Street"
                placeholderTextColor="#A0AEC0"
                value={form.street}
                onChangeText={(t) => setForm({ ...form, street: t })}
              />
            </View>

            {/* City & State */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>City</Text>
                <BottomSheetTextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#A0AEC0"
                  value={form.city}
                  onChangeText={(t) => setForm({ ...form, city: t })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>State</Text>
                <BottomSheetTextInput
                  style={styles.input}
                  placeholder="State"
                  placeholderTextColor="#A0AEC0"
                  value={form.state}
                  onChangeText={(t) => setForm({ ...form, state: t })}
                />
              </View>
            </View>

            {/* Postal Code & Country */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Postal Code</Text>
                <BottomSheetTextInput
                  style={styles.input}
                  placeholder="400001"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="number-pad"
                  value={form.postal_code}
                  onChangeText={(t) => setForm({ ...form, postal_code: t })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Country</Text>
                <BottomSheetTextInput
                  style={styles.input}
                  placeholder="India"
                  placeholderTextColor="#A0AEC0"
                  value={form.country}
                  onChangeText={(t) => setForm({ ...form, country: t })}
                />
              </View>
            </View>

            {/* Loading indicators */}
            {(isGeocoding || isLocating) && (
              <View style={styles.geocodingStatus}>
                <ActivityIndicator size="small" color={THEME.PRIMARY} />
                <Text style={styles.geocodingText}>
                  {isLocating ? "Getting location..." : "Looking up address..."}
                </Text>
              </View>
            )}

            {/* Default Address Toggle */}
            <TouchableOpacity
              style={styles.defaultToggle}
              activeOpacity={0.7}
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

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.btn, (isPending || isLocating || isGeocoding) && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={isPending || isLocating || isGeocoding}
              activeOpacity={0.8}
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
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  mapLoadingText: {
    marginTop: 16,
    fontSize: 14,
    color: THEME.TEXT_DARK,
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
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  hintContainer: {
    position: "absolute",
    bottom: "42%",
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hintText: {
    fontSize: 13,
    fontWeight: "500",
    color: THEME.PRIMARY,
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
  geocodingStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#E6F1FB",
    borderRadius: 10,
    gap: 10,
  },
  geocodingText: {
    fontSize: 13,
    color: THEME.PRIMARY,
    fontWeight: "500",
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
    opacity: 0.6,
  },
  btnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  typeRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFF",
    gap: 6,
  },
  typeBtnActive: {
    backgroundColor: THEME.PRIMARY,
    borderColor: THEME.PRIMARY,
  },
  typeText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  typeTextActive: {
    color: "#FFF",
  },
});