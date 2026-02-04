import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // Built-in with Expo
import { SafeAreaView } from "react-native-safe-area-context";
import { THEME } from "@/constants/theme";
import { useResendOtp, useVerifyOtp } from "@/features/auth/auth.queries";
import { showError, showSuccess } from "@/lib/toast";
import { tokenService } from "@/services/token";
const OTPVerificationScreen = () => {
  const router = useRouter();
  const { mutate: reSendOtp, isPending } = useResendOtp();
  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtp();
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [timer, setTimer] = useState(30);

  // Refs for auto-focusing next input
  const inputs = useRef<TextInput[]>([]);

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move to next input if text is entered
    if (text && index < 3) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Move to previous input on backspace if current is empty
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleResendOtp = () => {
    if (isPending) {
      return;
    }

    reSendOtp(mobile, {
      onSuccess: (res) => {
        showSuccess("OTP Sent successfully");
        setOtp(["", "", "", ""]);
        setTimer(30); // timer starts from 30 seconds
      },
      onError: (err) => {
        showError(err.message);
        console.log("OTP Error:", err);
      },
    });
  };

  const handleVerify = () => {
    if (!mobile || isVerifying) return;
    const code = otp.join("");
    if (code.length !== 4) {
      showError("Please enter valid 4 digit OTP");
      return;
    }

    verifyOtp(
      { phone: mobile, code },
      {
        onSuccess: async (res) => {
          showSuccess("OTP verified successfully");
          console.log("res", res);
          // save tokens
          await tokenService.setTokens(res.accessToken, res.refreshToken);
          router.replace("/(tabs)");
        },

        onError: (err) => {
          const message =
            err.response?.data?.message ||
            err.message ||
            "OTP verification failed";

          showError(message);
          console.log("OTP Error:", {
            message,
            status: err.response?.status,
            data: err.response?.data,
          });
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Top App Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Hero Illustration Placeholder */}
          <View style={styles.illustrationContainer}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="shield-checkmark"
                size={50}
                color={THEME.PRIMARY}
              />
            </View>
          </View>

          {/* Headline */}
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.subtitle}>
            We have sent the code verification to your mobile number{" "}
            <Text style={styles.phoneNumber}>{mobile}</Text>
          </Text>

          {/* OTP Input Fields */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) inputs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  otp[index] ? styles.otpInputActive : null,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                value={digit}
                selectionColor={THEME.PRIMARY}
              />
            ))}
          </View>

          {/* Resend Timer */}
          {timer === 0 ? (
            <TouchableOpacity
              onPress={handleResendOtp}
              style={styles.resendButton}
            >
              <Text style={styles.resendText}>Resend Code</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>Resend code in </Text>
              <Text style={styles.timerCount}>
                00:{timer < 10 ? `0${timer}` : timer}
              </Text>
            </View>
          )}
        </View>
        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            otp.join("").length < 4 && styles.buttonDisabled,
          ]}
          onPress={handleVerify}
          disabled={otp.join("").length < 4}
        >
          <Text style={styles.verifyButtonText}>
            {isVerifying ? "Verifying..." : "Verify Account"}
          </Text>
          {!isVerifying && (
            <Ionicons name="arrow-forward" size={20} color={THEME.TEXT_MAIN} />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
export default OTPVerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.LIGHT_BACKGROUND,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  illustrationContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: "rgba(29, 60, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: THEME.TEXT_DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: THEME.TEXT_SUB,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  phoneNumber: {
    color: THEME.TEXT_DARK,
    fontWeight: "600",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 32,
  },
  otpInput: {
    width: 60,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: THEME.TEXT_DARK,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  otpInputActive: {
    borderColor: THEME.PRIMARY,
    borderWidth: 2,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  timerText: {
    fontSize: 14,
    color: THEME.TEXT_SUB,
  },
  timerCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: THEME.PRIMARY,
  },
  verifyButton: {
    width: "100%",
    maxWidth: 400,
    marginHorizontal: "auto",
    backgroundColor: THEME.PRIMARY,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: THEME.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: THEME.BUTTON_DISABLED,
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: THEME.TEXT_MAIN,
    fontSize: 18,
    fontWeight: "bold",
  },
  resendButton: {
    marginTop: 20,
  },
  resendText: {
    color: THEME.PRIMARY,
    fontWeight: "bold",
    fontSize: 14,
  },
});
