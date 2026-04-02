import React from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { THEME } from "@/theme/theme";
import { useRouter } from "expo-router";
import {
  useAddresses,
  useDeleteAddress,
  useUpdateAddress,
} from "@/features/user/user.queries";
import { showSuccess, showError } from "@/utils/toast";
import { UserAddress } from "@/features/auth/authTypes";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";

export default function AddressesScreen() {
  const router = useRouter();
  const { data: addresses, isLoading } = useAddresses();
  const { mutate: deleteAddress } = useDeleteAddress();
  const { mutate: updateAddress } = useUpdateAddress();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(null);

  const handleDelete = (id: string) => {
    setSelectedAddressId(id);
    setShowDeleteModal(true);
  };

  const onConfirmDelete = () => {
    if (!selectedAddressId) return;
    deleteAddress(selectedAddressId, {
      onSuccess: () => showSuccess("Address deleted"),
      onError: (err: any) =>
        showError(err.message || "Failed to delete address"),
    });
  };

  const handleSetDefault = (id: string) => {
    updateAddress(
      { id, data: { is_default: true } },
      {
        onSuccess: () => showSuccess("Default address updated"),
        onError: (err: any) =>
          showError(err.message || "Failed to update default address"),
      },
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={THEME.PRIMARY} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity
          onPress={() => router.push("/address-form")}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={THEME.PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {addresses && addresses.length > 0 ? (
          <View style={styles.list}>
            {addresses.map((address: UserAddress) => (
              <TouchableOpacity
                key={address._id}
                style={[
                  styles.addressCard,
                  address.is_default && styles.defaultCard,
                ]}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/address-form",
                    params: { id: address._id },
                  })
                }
              >
                <View style={styles.addressIconContainer}>
                  <Ionicons
                    name={address.is_default ? "home" : "location"}
                    size={22}
                    color={address.is_default ? THEME.PRIMARY : "#64748B"}
                  />
                </View>

                <View style={styles.addressInfo}>
                  <View style={styles.addressHeader}>
                    <Text style={styles.addressLabel}>
                      {address.is_default ? "Default Address" : "Address"}
                    </Text>
                    {address.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {address.street}, {address.city}, {address.state}{" "}
                    {address.postal_code}
                  </Text>
                </View>

                <View style={styles.actions}>
                  {!address.is_default && (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(address._id)}
                      style={styles.actionButton}
                      accessibilityLabel="Set as default"
                    >
                      <Ionicons
                        name="star-outline"
                        size={20}
                        color={THEME.PRIMARY}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDelete(address._id)}
                    style={styles.actionButton}
                    accessibilityLabel="Delete address"
                  >
                    <Ionicons name="trash-outline" size={20} color={THEME.ERROR} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="location-outline"
                size={64}
                color={THEME.BORDER_LIGHT}
              />
            </View>
            <Text style={styles.emptyTitle}>No addresses saved</Text>
            <Text style={styles.emptySubtitle}>
              Add an address to make your bookings faster and easier.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => router.push("/address-form")}
            >
              <Text style={styles.emptyAddButtonText}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ConfirmationModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={onConfirmDelete}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        icon="trash-outline"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  list: {
    gap: 16,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  defaultCard: {
    borderColor: THEME.PRIMARY_LIGHTER,
    borderWidth: 1.5,
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  addressInfo: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
  },
  defaultBadge: {
    backgroundColor: THEME.PRIMARY_LIGHTER,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: THEME.PRIMARY,
  },
  addressText: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME.TEXT_DARK,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: THEME.TEXT_DARK_SECONDARY,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyAddButton: {
    backgroundColor: THEME.PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: THEME.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyAddButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
