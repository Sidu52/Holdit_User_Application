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
    ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { THEME } from "../../theme/theme";
import { useResendOtp, useVerifyOtp } from "../../features/auth/authQueries";
import { showError, showSuccess } from "../../utils/toast";

const OTP_LENGTH = 4;
const RESEND_TIMER_SECONDS = 30;

const OtpScreen = () => {
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

    const handleVerify = useCallback(
        (codeToVerify?: string) => {
            if (!mobile || isVerifying) return;

            const code = codeToVerify || otp.join("");
            if (code.length !== OTP_LENGTH || !/^[0-9]+$/.test(code)) {
                if (!codeToVerify) showError(`Please enter a valid ${OTP_LENGTH}-digit OTP`);
                return;
            }

            verifyOtp(
                { phone: mobile, otp: code },
                {
                    onSuccess: async () => {
                        showSuccess("OTP verified successfully");
                        router.replace("/(tabs)");
                    },
                    onError: (err: any) => {
                        const status = err?.status;
                        let userMessage = "OTP verification failed. Please try again.";
                        if (status === 400) {
                            userMessage = "Invalid OTP. Please check and try again.";
                        } else if (status === 410 || status === 408) {
                            userMessage = "OTP has expired. Please request a new one.";
                        }
                        showError(userMessage);
                    },
                },
            );
        },
        [mobile, isVerifying, otp, verifyOtp, router],
    );

    const handleChange = useCallback(
        (text: string, index: number) => {
            const sanitized = text.replace(/[^0-9]/g, "");
            let currentOtp = [...otp];

            if (sanitized.length > 1) {
                const pastedDigits = sanitized.slice(0, OTP_LENGTH).split("");
                pastedDigits.forEach((digit, i) => {
                    if (index + i < OTP_LENGTH) {
                        currentOtp[index + i] = digit;
                    }
                });
                setOtp(currentOtp);
                const nextIndex = Math.min(index + pastedDigits.length, OTP_LENGTH - 1);
                inputs.current[nextIndex]?.focus();
                
                if (currentOtp.join("").length === OTP_LENGTH) {
                    handleVerify(currentOtp.join(""));
                }
                return;
            }

            currentOtp[index] = sanitized;
            setOtp(currentOtp);
            if (sanitized && index < OTP_LENGTH - 1) {
                inputs.current[index + 1]?.focus();
            }

            if (currentOtp.join("").length === OTP_LENGTH) {
                handleVerify(currentOtp.join(""));
            }
        },
        [otp, handleVerify],
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
            },
        });
    }, [isPending, timer, mobile, reSendOtp]);

    const maskedMobile = mobile
        ? mobile.slice(0, 2) + "****" + mobile.slice(-2)
        : "";

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={24} color={THEME.TEXT_DARK} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.illustrationContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons
                                name="shield-checkmark"
                                size={50}
                                color={THEME.PRIMARY}
                            />
                        </View>
                    </View>

                    <Text style={styles.title}>Verification Code</Text>
                    <Text style={styles.subtitle}>
                        We have sent the code verification to your mobile number{" "}
                        <Text style={styles.phoneNumber}>{maskedMobile}</Text>
                    </Text>

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
                                editable={!isVerifying}
                            />
                        ))}
                    </View>

                    {isVerifying ? (
                        <View style={styles.timerContainer}>
                            <ActivityIndicator size="small" color={THEME.PRIMARY} style={{ marginRight: 8 }} />
                            <Text style={styles.timerCount}>Verifying OTP...</Text>
                        </View>
                    ) : timer === 0 ? (
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default OtpScreen;

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
        fontWeight: "800",
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
        fontWeight: "800",
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
        fontWeight: "900",
        color: THEME.TEXT_DARK,
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
        fontWeight: "800",
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
    },
    buttonDisabled: {
        backgroundColor: THEME.BUTTON_DISABLED,
    },
    verifyButtonText: {
        color: THEME.TEXT_PRIMARY,
        fontSize: 18,
        fontWeight: "800",
    },
    resendButton: {
        marginTop: 20,
    },
    resendText: {
        color: THEME.PRIMARY,
        fontWeight: "800",
        fontSize: 14,
    },
});
