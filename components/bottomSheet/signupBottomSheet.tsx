import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme"; // Adjust path as needed
import { useUserLocation } from "@/hooks/useUserLocation";
import { useSignupUser } from "@/features/auth/auth.queries";
import { showError, showSuccess } from "@/lib/toast";

export default function SignupBottomSheet() {
  // Hooks
  const { data: location } = useUserLocation();
  // console.log("location", location);
  const { mutate: signupUser, isError, isPending } = useSignupUser();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Points from bottom to top where the sheet can snap (e.g., 65% of screen)
  const snapPoints = useMemo(() => ["25%", "65%"], []);

  // Form State
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    gender: "",
    dob: "",
    address: "",
  });

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

  // Handle Submit
  const handleSubmitForm = async () => {
    // console.log("location", location);
    if (location && location.lat && location.lng) {
      console.log("form", form);
      signupUser(
        { ...form, lat: location.lat, lng: location.lng },
        {
          onSuccess: (res) => {
            showSuccess("Profile Detail Updated");
          },
          onError: (err) => {
            showError(err.message);
            console.log("OTP Error:", err);
          },
        },
      );
    }
  };
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      enableContentPanningGesture={false}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: THEME.BORDER, width: 50 }}
      backgroundStyle={{ backgroundColor: THEME.LIGHT_BACKGROUND }}
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
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={form.first_name}
                onChangeText={(t) => setForm({ ...form, first_name: t })}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
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
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(t) => setForm({ ...form, email: t })}
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
          <View style={[styles.inputGroup, { flex: 1 }]}>
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
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* DOB */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              value={form.dob}
              onChangeText={(t) => setForm({ ...form, dob: t })}
            />
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Home Address</Text>
            <TextInput
              style={[styles.input, { height: 80, paddingTop: 12 }]}
              placeholder="Enter your full address"
              multiline
              onChangeText={(t) => setForm({ ...form, address: t })}
            />
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleSubmitForm}
          style={styles.submitButton}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {isPending ? "Loading..." : "Complete Profile"}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
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
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
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
    color: THEME.TEXT_SUB,
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
    borderColor: THEME.BORDER,
  },
  // ... existing styles ...
  genderToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    height: 50,
    padding: 4,
  },
  genderOption: {
    flex: 1,
    textTransform: "capitalize",
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
    color: THEME.TEXT_SUB,
  },
  genderOptionTextActive: {
    color: "#FFF",
  },
  selectorInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    height: 50,
    paddingHorizontal: 15,
  },
  selectorText: {
    fontSize: 15,
    color: THEME.TEXT_DARK,
  },

  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    fontSize: 16,
    color: THEME.TEXT_DARK,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
  },
  inputIcon: {
    marginLeft: 15,
  },
  readOnlyInput: {
    backgroundColor: "#F1F5F9",
    borderColor: THEME.BORDER,
  },
  checkIcon: {
    marginRight: 15,
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
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  privacyNote: {
    fontSize: 12,
    color: THEME.TEXT_DISABLED,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 18,
  },
  link: {
    color: THEME.PRIMARY,
    fontWeight: "600",
  },
});
