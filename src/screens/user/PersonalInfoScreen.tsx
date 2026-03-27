import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/theme/theme";
import { useRouter } from "expo-router";
import { useProfile, useUpdateProfile } from "@/features/user/user.queries";
import { showSuccess, showError } from "@/utils/toast";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { formatDateForDisplay, formatDateForInput } from "@/utils/date";

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { data: user, isLoading } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    gender: user?.gender?.toLowerCase() || "",
    dob: user?.dob || "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleUpdate = () => {
    if (!form.first_name || !form.last_name) {
      showError("Name fields are required");
      return;
    }
    updateProfile(form, {
      onSuccess: () => {
        showSuccess("Profile updated successfully");
        router.back();
      },
      onError: (error: any) => {
        showError(error.message || "Failed to update profile");
      },
    });
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setForm({ ...form, dob: selectedDate.toISOString() });
    }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Information</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                value={form.first_name}
                onChangeText={(t: string) => setForm({ ...form, first_name: t })}
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                value={form.last_name}
                onChangeText={(t: string) => setForm({ ...form, last_name: t })}
              />
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
                    onPress={() => setForm({ ...form, gender: option })}
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
                style={styles.input}
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

            {/* Phone (Read Only Example) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.input, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>{user?.phone}</Text>
                <Ionicons
                  name="lock-closed"
                  size={14}
                  color={THEME.TEXT_DARK_SECONDARY}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isPending && styles.disabledButton]}
            onPress={handleUpdate}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Save Changes</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
    marginLeft: 4,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    height: 54,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
  },
  inputText: {
    fontSize: 16,
    color: THEME.TEXT_DARK,
  },
  readOnlyInput: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  readOnlyText: {
    color: THEME.TEXT_DARK_SECONDARY,
    fontSize: 16,
  },
  genderToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
    height: 54,
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
    shadowColor: THEME.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.TEXT_DARK_SECONDARY,
  },
  genderOptionTextActive: {
    color: "#FFF",
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFF",
  },
  saveButton: {
    backgroundColor: THEME.PRIMARY,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: THEME.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
