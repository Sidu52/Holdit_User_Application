import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  BackHandler,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "../../theme/theme";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { hideStatusPopup } from "../../store/uiSlice";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

export default function StatusPopup() {
  const dispatch = useDispatch();
  const { visible, config } = useSelector((state: RootState) => state.ui.statusPopup);

  useEffect(() => {
    // Disable back button on Android if canClose is false
    const backAction = () => {
      if (visible && config && !config.canClose) {
        return true; // prevent back action
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [visible, config]);

  if (!visible || !config) return null;

  const getIcon = () => {
    switch (config.type) {
      case "update":
        return "cloud-download";
      case "warning":
        return "warning";
      case "coming_soon":
        return "time";
      default:
        return "information-circle";
    }
  };

  const getIconColor = () => {
    switch (config.type) {
      case "warning":
        return THEME.ERROR;
      case "update":
        return THEME.PRIMARY;
      case "coming_soon":
        return "#EBAE2B";
      default:
        return THEME.PRIMARY_LIGHTER;
    }
  };

  const handleClose = () => {
    if (config.canClose) {
      dispatch(hideStatusPopup());
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.contentContainer}>
          <View style={styles.card}>
            {/* CLOSE BUTTON (IF ALLOWED) */}
            {config.canClose && (
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Ionicons name="close" size={24} color={THEME.TEXT_MUTED} />
              </TouchableOpacity>
            )}

            {/* ILLUSTRATION / ICON */}
            <View style={styles.iconWrapper}>
              {config.image ? (
                <Image source={{ uri: config.image }} style={styles.mainImage} />
              ) : (
                <View style={[styles.iconCircle, { backgroundColor: getIconColor() + "15" }]}>
                   <Ionicons name={getIcon()} size={40} color={getIconColor()} />
                </View>
              )}
            </View>

            {/* TEXT CONTENT */}
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.message}>{config.message}</Text>

            {/* ACTION BUTTON */}
            {config.primaryAction && (
              <TouchableOpacity 
                style={styles.primaryBtn}
                onPress={() => {
                   // In a real app, you might mapping string keys to functions
                   // or just rely on the parent dispatching the right thing.
                   if (config.canClose) dispatch(hideStatusPopup());
                }}
              >
                <Text style={styles.primaryBtnText}>{config.primaryAction.label}</Text>
              </TouchableOpacity>
            )}

            {/* EMERGENCY LINK (FOR FORCE UPDATES) */}
            {!config.canClose && (
               <TouchableOpacity style={styles.supportLink}>
                  <Text style={styles.supportText}>Need help? Contact Support</Text>
               </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    width: "85%",
    maxWidth: 400,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 32,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
  },
  iconWrapper: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  mainImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: "cover",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: THEME.TEXT_DARK,
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryBtn: {
    width: "100%",
    height: 56,
    backgroundColor: THEME.PRIMARY,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: THEME.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  supportLink: {
     marginTop: 20,
  },
  supportText: {
     color: THEME.PRIMARY_LIGHTER,
     fontSize: 13,
     fontWeight: "600",
     textDecorationLine: "underline",
  }
});
