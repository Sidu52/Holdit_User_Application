import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/theme/theme";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useCompleteProfile } from "@/features/auth/auth.queries";
import { useProfile } from "@/features/user/user.queries";
import { showError, showSuccess } from "@/utils/toast";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { formatDateForInput } from "@/utils/date";

export default function SignupBottomSheet() {
  // Hooks
  const { data: user } = useProfile();
  const { data: location } = useUserLocation();
  const { mutate: completeProfile, isPending } = useCompleteProfile();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Points from bottom to top where the sheet can snap (e.g., 80% of screen)
  const snapPoints = useMemo(() => ["80%"], []);

  // Form State
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    gender: user?.gender?.toLowerCase() || "",
    dob: user?.dob || "",
    address: user?.location?.address || "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Backdrop to dim the background
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="none"
      />
    ),
    [],
  );

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setForm({ ...form, dob: selectedDate.toISOString() });
    }
  };

  // Handle Submit
  const handleSubmitForm = async () => {
    if (location && location.lat && location.lng) {
      completeProfile(
        { ...form, lat: location.lat, lng: location.lng },
        {
          onSuccess: () => {
            showSuccess("Profile Detail Updated");
          },
          onError: (err: any) => {
            showError(err.message || "Failed to update profile");
          },
        },
      );
    } else {
      showError("Locating you...");
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      enableContentPanningGesture={false}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: THEME.BORDER_LIGHT, width: 50 }}
      backgroundStyle={{ backgroundColor: THEME.BACKGROUND_LIGHT }}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustPan"
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Holdit! 👋</Text>
          <Text style={styles.subtitle}>
            Let's finish setting up your account so you can start storing
            safely.
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* First & Last Name Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>First Name</Text>
              <BottomSheetTextInput
                style={styles.input}
                placeholder="First Name"
                value={form.first_name}
                onChangeText={(t) => setForm({ ...form, first_name: t })}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name</Text>
              <BottomSheetTextInput
                style={styles.input}
                placeholder="Last Name"
                value={form.last_name}
                onChangeText={(t) => setForm({ ...form, last_name: t })}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrapper, styles.readOnlyInput]}>
              <BottomSheetTextInput
                style={[styles.input, { backgroundColor: 'transparent' }]}
                value={form.email}
                editable={false}
              />
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={THEME.SUCCESS}
                style={{ marginRight: 10 }}
              />
            </View>
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderToggleContainer}>
              {["male", "female", "other"].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.genderOption,
                    form.gender === option && styles.genderOptionActive,
                  ]}
                  onPress={() =>
                    setForm({ ...form, gender: option.toLowerCase() })
                  }
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      form.gender === option && styles.genderOptionTextActive,
                    ]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* DOB */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowDatePicker(true)}
              style={styles.inputPicker}
            >
              <Text
                style={[
                  styles.inputText,
                  !form.dob && { color: THEME.TEXT_DARK_SECONDARY },
                ]}
              >
                {form.dob ? formatDateForInput(form.dob) : "Select Date"}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={THEME.PRIMARY}
              />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={form.dob ? new Date(form.dob) : new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={onDateChange}
              />
            )}
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Home Address</Text>
            <BottomSheetTextInput
              style={[styles.input, { height: 80, paddingTop: 12 }]}
              placeholder="Enter your full address"
              multiline
              value={form.address}
              onChangeText={(t) => setForm({ ...form, address: t })}
            />
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleSubmitForm}
          style={[styles.submitButton, isPending && styles.disabledButton]}
          activeOpacity={0.8}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Complete Profile</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>

        {/* Privacy Note */}
        <Text style={styles.privacyNote}>
          By continuing, you agree to our{" "}
          <Text style={styles.link}>Terms of Service</Text> and acknowledge our{" "}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 100 : 80,
  },
  header: {
    alignItems: "center",
    marginVertical: 20,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: THEME.TEXT_DARK_SECONDARY,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    height: 52,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 15,
    color: THEME.TEXT_DARK,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
  },
  inputPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    height: 52,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
  },
  inputText: {
    fontSize: 15,
    color: THEME.TEXT_DARK,
  },
  readOnlyInput: {
    backgroundColor: "#F1F5F9",
    borderColor: THEME.BORDER_LIGHT,
  },
  genderToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
    height: 50,
    padding: 4,
  },
  genderOption: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  genderOptionActive: {
    backgroundColor: THEME.PRIMARY,
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.TEXT_DARK_SECONDARY,
  },
  genderOptionTextActive: {
    color: "#FFF",
  },
  submitButton: {
    backgroundColor: THEME.PRIMARY,
    height: 56,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    gap: 8,
    shadowColor: THEME.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  privacyNote: {
    fontSize: 12,
    color: THEME.TEXT_DARK_SECONDARY,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 18,
  },
  link: {
    color: THEME.PRIMARY,
    fontWeight: "600",
  },
});
