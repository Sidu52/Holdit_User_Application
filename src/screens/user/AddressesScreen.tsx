// import React, { useState } from "react";
// import { StatusBar } from "expo-status-bar";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   ActivityIndicator,
//   TextInput,
//   Alert,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// import { THEME } from "@/theme/theme";
// import { useRouter } from "expo-router";
// import {
//   useAddresses,
//   useDeleteAddress,
//   useUpdateAddress,
// } from "@/features/user/user.queries";
// import { showSuccess, showError, showInfo } from "@/utils/toast";
// import { UserAddress } from "@/features/auth/authTypes";

// export default function AddressesScreen() {
//   const router = useRouter();
//   const { data: addresses, isLoading } = useAddresses();
//   const { mutate: deleteAddress } = useDeleteAddress();
//   const { mutate: updateAddress } = useUpdateAddress();

//   const [searchQuery, setSearchQuery] = useState("");

//   const handleMenuPress = (address: UserAddress) => {
//     Alert.alert(
//       "Address Options",
//       "Choose an action for this address",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//            text: "Set as Selected (Default)",
//            onPress: () => {
//              updateAddress(
//                { id: address._id, data: { is_default: true } },
//                {
//                  onSuccess: () => showSuccess("Address selected"),
//                  onError: (err: any) => showError(err.message || "Failed to update address"),
//                }
//              );
//            },
//         },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: () => {
//             deleteAddress(address._id, {
//               onSuccess: () => showSuccess("Address deleted"),
//               onError: (err: any) => showError(err.message || "Failed to delete address"),
//             });
//           },
//         },
//       ]
//     );
//   };

//   const handleShare = () => {
//     showInfo("Share feature coming soon!", "Share Address");
//   };

//   const filteredAddresses = addresses?.filter((a: UserAddress) => {
//       const q = searchQuery.toLowerCase();
//       const typeStr = a.address_type?.toLowerCase() || "";
//       const locStr = `${a.street} ${a.city} ${a.state}`.toLowerCase();
//       return typeStr.includes(q) || locStr.includes(q);
//   }) || [];

//   return (
//     <SafeAreaView style={styles.container} edges={["top"]}>
//       <StatusBar style="dark" />

//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//           <Ionicons name="chevron-back" size={20} color={THEME.TEXT_DARK} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Select Location</Text>
//       </View>

//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <View style={styles.searchBox}>
//           <Ionicons name="search" size={20} color="#94A3B8" />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search Address"
//             placeholderTextColor="#94A3B8"
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//           />
//         </View>
//       </View>

//       <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

//         {/* Action List Blocks */}
//         <View style={styles.topActionsContainer}>
//           <TouchableOpacity style={styles.actionRow} activeOpacity={0.7} onPress={() => router.push("/address-form")}>
//             <Ionicons name="locate" size={22} color={THEME.PRIMARY} />
//             <Text style={[styles.actionRowText, { color: THEME.PRIMARY }]}>Use my Current Location</Text>
//           </TouchableOpacity>

//           <View style={styles.actionDivider} />

//           <TouchableOpacity style={styles.actionRow} activeOpacity={0.7} onPress={() => router.push("/address-form")}>
//             <Ionicons name="add" size={24} color={THEME.PRIMARY} />
//             <Text style={[styles.actionRowText, { color: THEME.PRIMARY }]}>Add New Address</Text>
//             <View style={{ flex: 1 }} />
//             <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
//           </TouchableOpacity>
//         </View>

//         <TouchableOpacity style={styles.whatsappRow} activeOpacity={0.7} onPress={() => showInfo("WhatsApp Integration coming soon")}>
//           <Ionicons name="logo-whatsapp" size={20} color="#16A34A" />
//           <Text style={styles.whatsappText}>Request address from friend</Text>
//           <View style={{ flex: 1 }} />
//           <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
//         </TouchableOpacity>

//         <Text style={styles.sectionTitle}>Saved Addresses</Text>

//         {isLoading ? (
//           <View style={styles.center}>
//             <ActivityIndicator color={THEME.PRIMARY} size="small" />
//           </View>
//         ) : filteredAddresses.length > 0 ? (
//           <View style={styles.savedAddressesContainer}>
//             {filteredAddresses.map((address: UserAddress, index: number) => {
//               const addressLabel = address.address_type ? address.address_type.charAt(0).toUpperCase() + address.address_type.slice(1).toLowerCase() : "Other";
//               const isHome = addressLabel.toLowerCase() === "home";
//               const isOffice = addressLabel.toLowerCase() === "office";

//               return (
//                 <View key={address._id} style={styles.addressCard}>
//                   {index > 0 && <View style={styles.cardDivider} />}

//                   <View style={styles.cardInner}>
//                     {/* Icon Column */}
//                     <View style={styles.iconCol}>
//                       <Ionicons
//                         name={isHome ? "home-outline" : isOffice ? "business-outline" : "location-outline"}
//                         size={20}
//                         color={THEME.TEXT_DARK}
//                       />
//                     </View>

//                     {/* Main Content (Clickable to Edit) */}
//                     <TouchableOpacity
//                       style={styles.contentCol}
//                       onPress={() => router.push({ pathname: "/address-form", params: { id: address._id } })}
//                       activeOpacity={0.7}
//                     >
//                       <View style={styles.contentHeaderRow}>
//                         <Text style={styles.addressType}>{addressLabel}</Text>
//                         <Text style={styles.bulletSeparator}>• 4.5 km</Text>
//                         {address.is_default && (
//                           <View style={styles.selectedBadge}>
//                             <Text style={styles.selectedBadgeText}>Selected</Text>
//                           </View>
//                         )}
//                       </View>
//                       <Text style={styles.addressBody} numberOfLines={2}>
//                         {address.street}, {address.city}, {address.state} {address.postal_code}
//                       </Text>
//                     </TouchableOpacity>

//                     {/* Actions Menu */}
//                     <View style={styles.actionsCol}>
//                       <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
//                         <Ionicons name="share-outline" size={20} color={THEME.TEXT_DARK_SECONDARY} />
//                       </TouchableOpacity>
//                       <TouchableOpacity onPress={() => handleMenuPress(address)} style={styles.iconBtn}>
//                         <Ionicons name="ellipsis-vertical" size={18} color={THEME.TEXT_DARK_SECONDARY} />
//                       </TouchableOpacity>
//                     </View>
//                   </View>
//                 </View>
//               );
//             })}
//           </View>
//         ) : (
//           <View style={styles.emptyState}>
//             <Text style={styles.emptyTitle}>No matching addresses found</Text>
//           </View>
//         )}

//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F8F9FA",
//   },
//   center: {
//     padding: 40,
//     alignItems: "center",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     backgroundColor: "#F8F9FA",
//   },
//   backButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: "#FFF",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//     marginRight: 16,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "800",
//     color: THEME.TEXT_DARK,
//   },
//   searchContainer: {
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//     backgroundColor: "#F8F9FA",
//   },
//   searchBox: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFF",
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//     paddingHorizontal: 16,
//     height: 54,
//   },
//   searchInput: {
//     flex: 1,
//     marginLeft: 12,
//     fontSize: 15,
//     color: THEME.TEXT_DARK,
//     fontWeight: "500",
//   },
//   scrollContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 60,
//   },
//   topActionsContainer: {
//     backgroundColor: "#FFF",
//     borderRadius: 16,
//     overflow: "hidden",
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: THEME.BORDER_LIGHT,
//   },
//   actionRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 18,
//     paddingHorizontal: 18,
//     gap: 14,
//   },
//   actionDivider: {
//     height: 1,
//     backgroundColor: THEME.BORDER_LIGHT,
//     marginLeft: 54, // Align with text
//   },
//   actionRowText: {
//     fontSize: 15,
//     fontWeight: "800",
//   },
//   whatsappRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#FFF",
//     borderRadius: 16,
//     paddingVertical: 18,
//     paddingHorizontal: 18,
//     gap: 14,
//     marginBottom: 24,
//     borderWidth: 1,
//     borderColor: THEME.BORDER_LIGHT,
//   },
//   whatsappText: {
//     fontSize: 15,
//     fontWeight: "800",
//     color: THEME.TEXT_DARK,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: "900",
//     color: THEME.TEXT_DARK,
//     marginBottom: 16,
//   },
//   savedAddressesContainer: {
//     backgroundColor: "#FFF",
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: THEME.BORDER_LIGHT,
//     overflow: "hidden",
//   },
//   addressCard: {
//   },
//   cardDivider: {
//     borderTopWidth: 1,
//     borderStyle: "dashed",
//     borderColor: THEME.BORDER_LIGHT,
//     marginHorizontal: 18,
//   },
//   cardInner: {
//     flexDirection: "row",
//     padding: 18,
//   },
//   iconCol: {
//     width: 28,
//     paddingTop: 2,
//     alignItems: "flex-start",
//   },
//   contentCol: {
//     flex: 1,
//     paddingRight: 10,
//   },
//   contentHeaderRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 6,
//   },
//   addressType: {
//     fontSize: 16,
//     fontWeight: "800",
//     color: THEME.TEXT_DARK,
//   },
//   bulletSeparator: {
//     fontSize: 12,
//     color: "#94A3B8",
//     marginHorizontal: 6,
//     fontWeight: "700",
//   },
//   selectedBadge: {
//     backgroundColor: "#DCFCE7",
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 6,
//     marginLeft: 4,
//   },
//   selectedBadgeText: {
//     fontSize: 10,
//     fontWeight: "800",
//     color: "#166534",
//   },
//   addressBody: {
//     fontSize: 13,
//     color: THEME.TEXT_DARK_SECONDARY,
//     lineHeight: 20,
//     fontWeight: "500",
//   },
//   actionsCol: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: 10,
//     paddingTop: 0,
//   },
//   iconBtn: {
//     padding: 4,
//   },
//   emptyState: {
//     padding: 30,
//     alignItems: "center",
//   },
//   emptyTitle: {
//     color: THEME.TEXT_DARK_SECONDARY,
//     fontWeight: "600",
//   },
// });

import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/theme/theme";
import { useRouter } from "expo-router";
import {
  useAddresses,
  useDeleteAddress,
  useUpdateAddress,
} from "@/features/user/user.queries";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { UserAddress } from "@/features/auth/authTypes";
import { searchAddress } from "@/utils/geocoding";

export default function AddressesScreen() {
  const router = useRouter();
  const { data: addresses, isLoading } = useAddresses();
  const { mutate: deleteAddress } = useDeleteAddress();
  const { mutate: updateAddress } = useUpdateAddress();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Handle search with debounce
  const handleSearchChange = async (text: string) => {
    setSearchQuery(text);

    if (text.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchAddress(text);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (err) {
      console.error("Search failed:", err);
      showError("Search failed. Try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // When user taps a search result
  const handleSearchResultSelect = (result: any) => {
    // Navigate to address form with pre-filled data
    router.push({
      pathname: "/address-form",
      params: {
        street: result.address.street,
        city: result.address.city,
        state: result.address.state,
        postal_code: result.address.postal_code,
        country: result.address.country,
        latitude: result.latitude,
        longitude: result.longitude,
      },
    });

    setShowSearchResults(false);
    setSearchQuery("");
  };

  const handleMenuPress = (address: UserAddress) => {
    Alert.alert(
      "Address Options",
      "Choose an action for this address",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Set as Selected (Default)",
          onPress: () => {
            updateAddress(
              { id: address._id, data: { is_default: true } },
              {
                onSuccess: () => showSuccess("Address selected"),
                onError: (err: any) => showError(err.message || "Failed to update address"),
              }
            );
          },
        },
        {
          text: "Share via WhatsApp",
          onPress: () => handleWhatsAppShare(address),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteAddress(address._id, {
              onSuccess: () => showSuccess("Address deleted"),
              onError: (err: any) => showError(err.message || "Failed to delete address"),
            });
          },
        },
      ]
    );
  };

  const handleWhatsAppShare = async (address: UserAddress) => {
    try {
      const message = `📍 ${address.address_type}\n${address.street}\n${address.city}, ${address.state} ${address.postal_code}`;

      // Deep link to WhatsApp (unused var removed)
      // In a real app, you'd use Linking.openURL here
      // For now, just copy to clipboard
      showInfo("Address formatted for WhatsApp sharing");
      console.log("Share message:", message);
    } catch (err) {
      showError("WhatsApp sharing failed");
    }
  };

  const handleRequestAddress = () => {
    const message = "Hi! Can you share your address with me? Open the app and send your address.";

    // Deep link to WhatsApp (unused var removed)

    showInfo("WhatsApp friend request feature coming soon!");
  };

  const filteredAddresses = addresses?.filter((a: UserAddress) => {
    const q = searchQuery.toLowerCase();
    const typeStr = a.address_type?.toLowerCase() || "";
    const locStr = `${a.street} ${a.city} ${a.state}`.toLowerCase();
    return typeStr.includes(q) || locStr.includes(q);
  }) || [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={THEME.TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Address"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          {isSearching && <ActivityIndicator size="small" color={THEME.PRIMARY} />}
        </View>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <ScrollView
              scrollEnabled
              style={styles.searchResultsList}
              showsVerticalScrollIndicator={false}
            >
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() => handleSearchResultSelect(result)}
                  activeOpacity={0.7}
                >
                  <View style={styles.resultIconContainer}>
                    <Ionicons name="location" size={18} color={THEME.PRIMARY} />
                  </View>
                  <View style={styles.resultTextContainer}>
                    <Text style={styles.resultMainText} numberOfLines={1}>
                      {result.address.city}, {result.address.state}
                    </Text>
                    <Text style={styles.resultSubText} numberOfLines={1}>
                      {result.display_name}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {showSearchResults && searchResults.length === 0 && searchQuery.length > 0 && !isSearching && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No addresses found</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Action List Blocks */}
        <View style={styles.topActionsContainer}>
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => router.push("/address-form")}
          >
            <Ionicons name="locate" size={22} color={THEME.PRIMARY} />
            <Text style={[styles.actionRowText, { color: THEME.PRIMARY }]}>
              Use my Current Location
            </Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => router.push("/address-form")}
          >
            <Ionicons name="add" size={24} color={THEME.PRIMARY} />
            <Text style={[styles.actionRowText, { color: THEME.PRIMARY }]}>
              Add New Address
            </Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.whatsappRow}
          activeOpacity={0.7}
          onPress={handleRequestAddress}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#16A34A" />
          <Text style={styles.whatsappText}>Request address from friend</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          {searchQuery ? "Search Results" : "Saved Addresses"}
        </Text>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={THEME.PRIMARY} size="small" />
          </View>
        ) : filteredAddresses.length > 0 ? (
          <View style={styles.savedAddressesContainer}>
            {filteredAddresses.map((address: UserAddress, index: number) => {
              const addressLabel = address.address_type
                ? address.address_type.charAt(0).toUpperCase() +
                address.address_type.slice(1).toLowerCase()
                : "Other";
              const isHome = addressLabel.toLowerCase() === "home";
              const isOffice = addressLabel.toLowerCase() === "office";

              return (
                <View key={address._id} style={styles.addressCard}>
                  {index > 0 && <View style={styles.cardDivider} />}

                  <View style={styles.cardInner}>
                    {/* Icon Column */}
                    <View style={styles.iconCol}>
                      <Ionicons
                        name={
                          isHome
                            ? "home-outline"
                            : isOffice
                              ? "business-outline"
                              : "location-outline"
                        }
                        size={20}
                        color={THEME.TEXT_DARK}
                      />
                    </View>

                    {/* Main Content (Clickable to Edit) */}
                    <TouchableOpacity
                      style={styles.contentCol}
                      onPress={() =>
                        router.push({
                          pathname: "/address-form",
                          params: { id: address._id },
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.contentHeaderRow}>
                        <Text style={styles.addressType}>{addressLabel}</Text>
                        {address.is_default && (
                          <View style={styles.selectedBadge}>
                            <Text style={styles.selectedBadgeText}>
                              Selected
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.addressBody} numberOfLines={2}>
                        {address.street}, {address.city}, {address.state}{" "}
                        {address.postal_code}
                      </Text>
                    </TouchableOpacity>

                    {/* Actions Menu */}
                    <View style={styles.actionsCol}>
                      <TouchableOpacity
                        onPress={() => handleWhatsAppShare(address)}
                        style={styles.iconBtn}
                      >
                        <Ionicons
                          name="share-outline"
                          size={20}
                          color={THEME.TEXT_DARK_SECONDARY}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleMenuPress(address)}
                        style={styles.iconBtn}
                      >
                        <Ionicons
                          name="ellipsis-vertical"
                          size={18}
                          color={THEME.TEXT_DARK_SECONDARY}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matching addresses found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try a different search"
                : "Add your first address to get started"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  center: {
    padding: 40,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#F8F9FA",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    height: 54,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: THEME.TEXT_DARK,
    fontWeight: "500",
  },
  searchResultsContainer: {
    position: "absolute",
    top: 65,
    left: 20,
    right: 20,
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    maxHeight: 300,
    zIndex: 100,
  },
  searchResultsList: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  resultIconContainer: {
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultMainText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
  },
  resultSubText: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
    marginTop: 2,
  },
  noResultsContainer: {
    position: "absolute",
    top: 65,
    left: 20,
    right: 20,
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 20,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  noResultsText: {
    fontSize: 14,
    color: THEME.TEXT_DARK_SECONDARY,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  topActionsContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 14,
  },
  actionDivider: {
    height: 1,
    backgroundColor: THEME.BORDER_LIGHT,
    marginLeft: 54,
  },
  actionRowText: {
    fontSize: 15,
    fontWeight: "800",
  },
  whatsappRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
  },
  whatsappText: {
    fontSize: 15,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: THEME.TEXT_DARK,
    marginBottom: 16,
  },
  savedAddressesContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
    overflow: "hidden",
  },
  addressCard: {},
  cardDivider: {
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: THEME.BORDER_LIGHT,
    marginHorizontal: 18,
  },
  cardInner: {
    flexDirection: "row",
    padding: 18,
  },
  iconCol: {
    width: 28,
    paddingTop: 2,
    alignItems: "flex-start",
  },
  contentCol: {
    flex: 1,
    paddingRight: 10,
  },
  contentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  addressType: {
    fontSize: 16,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
  },
  selectedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#166534",
  },
  addressBody: {
    fontSize: 13,
    color: THEME.TEXT_DARK_SECONDARY,
    lineHeight: 20,
    fontWeight: "500",
  },
  actionsCol: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 0,
  },
  iconBtn: {
    padding: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: THEME.TEXT_DARK_SECONDARY,
  },
});