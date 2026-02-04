import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useUser } from "@/features/user/user.queries";
import { getInitials } from "@/utils/helper";

/* ---------------- HELPERS ---------------- */


const formatMemberSince = (date?: string) => {
  if (!date) return "";
  const d = new Date(date);
  return `Member Since ${d.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  })}`;
};

/* ---------------- UI COMPONENTS ---------------- */

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
};

const MenuItem = ({ icon, label, value, onPress }: MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIcon}>
      <Ionicons name={icon} size={20} color={THEME.ACCENT} />
    </View>

    <Text style={styles.menuLabel}>{label}</Text>

    {value && <Text style={styles.menuValue}>{value}</Text>}

    <Ionicons name="chevron-forward" size={18} color={THEME.TEXT_DISABLED} />
  </TouchableOpacity>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

/* ---------------- SCREEN ---------------- */

export default function ProfileScreen() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useUser();

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
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={THEME.TEXT_MAIN} />
        </TouchableOpacity>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {user.is_active && (
            <View style={styles.verifiedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={THEME.PRIMARY}
              />
            </View>
          )}
        </View>

        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.subtitle}>{formatMemberSince(user.createdAt)}</Text>
      </View>

      {/* ---------- ACCOUNT ---------- */}
      <Section title="Account Information">
        <MenuItem
          icon="person-outline"
          label="Personal Information"
          value={user.email}
        />
        <MenuItem
          icon="location-outline"
          label="My Address"
          value={user.address}
        />
        <MenuItem icon="call-outline" label="Phone" value={user.phone} />
      </Section>

      {/* ---------- ACTIVITY ---------- */}
      <Section title="Activity">
        <MenuItem icon="time-outline" label="Booking History" />
        <MenuItem icon="briefcase-outline" label="My Luggage" />
      </Section>

      {/* ---------- SETTINGS ---------- */}
      <Section title="Settings">
        <MenuItem icon="notifications-outline" label="Notifications" />
        <MenuItem icon="moon-outline" label="App Theme" value="Light" />
        <MenuItem
          icon="language-outline"
          label="Language"
          value="English (US)"
        />
      </Section>

      {/* ---------- SUPPORT ---------- */}
      <Section title="Support & Legal">
        <MenuItem icon="help-circle-outline" label="Help Center" />
        <MenuItem icon="document-text-outline" label="Terms & Conditions" />
        <MenuItem icon="shield-checkmark-outline" label="Privacy Policy" />
      </Section>

      {/* ---------- LOGOUT ---------- */}
      <TouchableOpacity style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={20} color={THEME.ERROR} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Holdit v2.4.0 • Built for your journey
      </Text>
    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.LIGHT_BACKGROUND,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    backgroundColor: THEME.PRIMARY,
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },

  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: THEME.PRIMARY_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },

  avatarText: {
    color: THEME.TEXT_MAIN,
    fontSize: 28,
    fontWeight: "800",
  },

  verifiedBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 2,
  },

  name: {
    fontSize: 22,
    fontWeight: "800",
    color: THEME.TEXT_MAIN,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: THEME.TEXT_SUB,
    marginLeft: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },

  card: {
    backgroundColor: THEME.CARD_BG,
    borderRadius: 20,
    marginHorizontal: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },

  menuIcon: {
    backgroundColor: THEME.INPUT_BG,
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },

  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: THEME.TEXT_MAIN,
  },

  menuValue: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.TEXT_DISABLED,
    marginRight: 6,
  },

  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#fdecec",
    borderRadius: 20,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  logoutText: {
    fontWeight: "800",
    color: THEME.ERROR,
    fontSize: 14,
  },

  footerText: {
    textAlign: "center",
    fontSize: 10,
    color: THEME.TEXT_DISABLED,
    marginTop: 16,
  },
});
