import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { THEME } from "@/constants/theme";
import { useResendOtp, useVerifyOtp } from "@/features/auth/auth.queries";
import { showError, showSuccess } from "@/lib/toast";
import { tokenService } from "@/services/token";

const OTP_LENGTH = 4;
const RESEND_TIMER_SECONDS = 30;

const OTPVerificationScreen = () => {
  const router = useRouter();
  const { mutate: reSendOtp, isPending } = useResendOtp();
  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtp();
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(RESEND_TIMER_SECONDS);

  useEffect(() => {
    if (!mobile || mobile.trim().length === 0) {
      showError("Invalid session. Please enter your mobile number again.");
      router.replace("/login");
    }
  }, [mobile, router]);

  // Refs for auto-focusing next input
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = useCallback(
    (text: string, index: number) => {
      const sanitized = text.replace(/[^0-9]/g, "");
      if (sanitized.length > 1) {
        const pastedDigits = sanitized.slice(0, OTP_LENGTH).split("");
        const newOtp = [...otp];
        pastedDigits.forEach((digit, i) => {
          if (index + i < OTP_LENGTH) {
            newOtp[index + i] = digit;
          }
        });
        setOtp(newOtp);
        const nextIndex = Math.min(index + pastedDigits.length, OTP_LENGTH - 1);
        inputs.current[nextIndex]?.focus();
        return;
      }

      const newOtp = [...otp];
      newOtp[index] = sanitized;
      setOtp(newOtp);
      if (sanitized && index < OTP_LENGTH - 1) {
        inputs.current[index + 1]?.focus();
      }
    },
    [otp],
  );
  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputs.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  const handleResendOtp = useCallback(() => {
    if (isPending || timer > 0) {
      return;
    }

    if (!mobile) {
      showError("Mobile number is missing.");
      return;
    }

    reSendOtp(mobile, {
      onSuccess: (_res) => {
        showSuccess("OTP sent successfully");
        setOtp(Array(OTP_LENGTH).fill(""));
        setTimer(RESEND_TIMER_SECONDS);
        inputs.current[0]?.focus();
      },
      onError: (err) => {
        showError("Failed to resend OTP. Please try again.");
        if (__DEV__) {
          console.error("Resend OTP Error:", err);
        }
      },
    });
  }, [isPending, timer, mobile, reSendOtp]);

  const handleVerify = useCallback(() => {
    if (!mobile || isVerifying) return;

    const code = otp.join("");
    if (code.length !== OTP_LENGTH || !/^[0-9]+$/.test(code)) {
      showError(`Please enter a valid ${OTP_LENGTH}-digit OTP`);
      return;
    }

    verifyOtp(
      { phone: mobile, otp: code },
      {
        onSuccess: async (res) => {
          console.log("RES", res);
          if (!res?.accessToken || !res?.refreshToken) {
            showError("Authentication failed. Invalid server response.");
            if (__DEV__) {
              console.error("Missing tokens in verify response:", res);
            }
            return;
          }

          try {
            await tokenService.setTokens(res.accessToken, res.refreshToken);
            showSuccess("OTP verified successfully");
            router.replace("/(tabs)");
          } catch (storageErr) {
            showError("Failed to save session. Please try again.");
            if (__DEV__) {
              console.error("Token storage error:", storageErr);
            }
          }
        },
        onError: (err) => {
          const status = err?.response?.status;

          let userMessage = "OTP verification failed. Please try again.";
          if (status === 400) {
            userMessage = "Invalid OTP. Please check and try again.";
          } else if (status === 410 || status === 408) {
            userMessage = "OTP has expired. Please request a new one.";
          } else if (status === 429) {
            userMessage = "Too many attempts. Please wait and try again.";
          }

          showError(userMessage);

          if (__DEV__) {
            console.error("OTP Verification Error:", {
              message: err?.message,
              status,
              data: err?.response?.data,
            });
          }
        },
      },
    );
  }, [mobile, isVerifying, otp, verifyOtp, router]);
  const maskedMobile = mobile
    ? mobile.slice(0, 2) + "****" + mobile.slice(-2)
    : "";

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
          {/* Hero Illustration */}
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
            {/* FIX 15: Show masked number */}
            <Text style={styles.phoneNumber}>{maskedMobile}</Text>
          </Text>

          {/* OTP Input Fields */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputs.current[index] = ref;
                }}
                style={[styles.otpInput, digit ? styles.otpInputActive : null]}
                keyboardType="number-pad"
                maxLength={1}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                value={digit}
                selectionColor={THEME.PRIMARY}
                secureTextEntry={false}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                accessibilityLabel={`OTP digit ${index + 1} of ${OTP_LENGTH}`}
              />
            ))}
          </View>

          {/* Resend Timer */}
          {timer === 0 ? (
            <TouchableOpacity
              onPress={handleResendOtp}
              style={styles.resendButton}
              disabled={isPending}
            >
              <Text style={styles.resendText}>
                {isPending ? "Sending..." : "Resend Code"}
              </Text>
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
            (otp.join("").length < OTP_LENGTH || isVerifying) &&
              styles.buttonDisabled,
          ]}
          onPress={handleVerify}
          disabled={otp.join("").length < OTP_LENGTH || isVerifying}
        >
          <Text style={styles.verifyButtonText}>
            {isVerifying ? "Verifying..." : "Verify Account"}
          </Text>
          {!isVerifying && (
            <Ionicons
              name="arrow-forward"
              size={20}
              color={THEME.TEXT_PRIMARY}
            />
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
    backgroundColor: THEME.BACKGROUND_LIGHT,
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
    color: THEME.TEXT_DARK_SECONDARY,
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
    borderColor: THEME.BORDER_LIGHT,
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
    color: THEME.TEXT_DARK_SECONDARY,
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
    color: THEME.TEXT_PRIMARY,
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
