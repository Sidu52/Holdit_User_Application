import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { THEME } from "@/theme/theme";

const { width } = Dimensions.get("window");

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  icon = "help-circle-outline",
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          entering={FadeInUp.duration(300)} 
          style={styles.modalContainer}
        >
          <View style={styles.header}>
            <View style={[
              styles.iconBg, 
              { backgroundColor: isDestructive ? `${THEME.ERROR}15` : `${THEME.PRIMARY}15` }
            ]}>
              <Ionicons 
                name={icon} 
                size={34} 
                color={isDestructive ? THEME.ERROR : THEME.PRIMARY} 
              />
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.confirmBtnOuter} 
              onPress={() => {
                onConfirm();
                onClose();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isDestructive ? ["#F87171", "#EF4444"] : [THEME.PRIMARY, THEME.SECONDARY]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmBtn}
              >
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: Math.min(width * 0.85, 340),
    backgroundColor: "#FFF",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: { elevation: 15 },
    }),
  },
  header: {
    marginBottom: 20,
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: THEME.TEXT_MUTED,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },
  confirmBtnOuter: {
    flex: 2,
    borderRadius: 16,
    overflow: "hidden",
  },
  confirmBtn: {
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFF",
  },
});
