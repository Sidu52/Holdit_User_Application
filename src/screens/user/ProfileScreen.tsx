import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/theme/theme";;
import { useRouter } from "expo-router";
import { useProfile } from "@/features/user/user.queries";
import { getInitials } from "@/utils/helper";

/* ---------------- HELPERS ---------------- */

const formatMemberSince = (date?: string) => {
  if (!date) return "MEMBER SINCE 2024";
  const d = new Date(date);
  return `MEMBER SINCE ${d.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  })}`.toUpperCase();
};

/* ---------------- UI COMPONENTS ---------------- */

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
};

const MenuItem = ({ icon, label, value, onPress, isLast }: MenuItemProps) => (
  <TouchableOpacity
    style={[styles.menuItem, isLast && { borderBottomWidth: 0 }]}
    onPress={onPress}
  >
    <View style={styles.menuIconContainer}>
      <Ionicons name={icon} size={18} color={THEME.PRIMARY_LIGHTER} />
    </View>

    <Text style={styles.menuLabel}>{label}</Text>

    {value && (
      <View style={styles.valueBadge}>
        <Text style={styles.menuValue}>{value}</Text>
      </View>
    )}

    <Ionicons
      name="chevron-forward"
      size={16}
      color={THEME.BUTTON_TEXT_DISABLED}
    />
  </TouchableOpacity>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

/* ---------------- SCREEN ---------------- */

export default function ProfileScreen() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useProfile();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={THEME.PRIMARY} />
      </View>
    );
  }

  if (isError || !user) {
    return (
      <View style={styles.center}>
        <Text style={{ color: THEME.ERROR }}>Failed to load profile</Text>
      </View>
    );
  }

  const fullName = `${user.first_name} ${user.last_name}`;
  const initials = getInitials(user.first_name, user.last_name);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" />

      {/* ---------- DARK HEADER CARD ---------- */}
      <View style={styles.headerCard}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {user.is_active && (
            <View style={styles.verifiedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={THEME.PRIMARY_LIGHTER}
              />
            </View>
          )}
        </View>

        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.subtitle}>{formatMemberSince(user.createdAt)}</Text>
      </View>

      <View style={styles.contentPadding}>
        {/* ---------- ACCOUNT ---------- */}
        <Section title="ACCOUNT INFORMATION">
          <MenuItem
            icon="person"
            label="Personal Information"
            onPress={() => router.push("/personal-info")}
          />
          <MenuItem
            icon="location"
            label="My Addresses"
            value={user.addresses?.length > 0 ? "Saved" : undefined}
            onPress={() => router.push("/addresses")}
            isLast
          />
        </Section>

        {/* ---------- ACTIVITY ---------- */}
        <Section title="ACTIVITY">
          <MenuItem icon="time" label="Booking History" />
          <MenuItem icon="briefcase" label="My Luggage" isLast />
        </Section>

        {/* ---------- SETTINGS ---------- */}
        <Section title="SETTINGS">
          <MenuItem
            icon="notifications"
            label="Notifications"
            onPress={() => router.push("/notifications")}
          />
          <MenuItem icon="moon" label="App Theme" value="Light" />
          <MenuItem icon="globe" label="Language" value="English (US)" isLast />
        </Section>

        {/* ---------- SUPPORT ---------- */}
        <Section title="SUPPORT & LEGAL">
          <MenuItem icon="help-circle" label="Help Center" />
          <MenuItem icon="document-text" label="Privacy Policy" isLast />
        </Section>

        {/* ---------- LOGOUT ---------- */}
        <TouchableOpacity style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={THEME.ERROR} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Holdit v2.4.0 • Built for your journey
        </Text>
      </View>
    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BACKGROUND_LIGHT,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCard: {
    backgroundColor: THEME.PRIMARY,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#DCEEFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#EBAE2B", // Yellow ring from the image
  },
  avatarText: {
    color: "#1A2B48",
    fontSize: 26,
    fontWeight: "bold",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderRadius: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#A0ABBB",
    letterSpacing: 0.5,
  },
  contentPadding: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
  valueBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  menuValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  logoutBtn: {
    marginTop: 10,
    backgroundColor: "#FFF1F1",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: {
    fontWeight: "700",
    color: THEME.ERROR,
    fontSize: 15,
  },
  footerText: {
    textAlign: "center",
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 20,
  },
});
