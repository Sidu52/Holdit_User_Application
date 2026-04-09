import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    Dimensions,
    Keyboard,
    Animated,
    Platform,
    Easing,
} from "react-native";
import BackgroundGradient from "../../components/ui/BackgroundGradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { THEME } from "../../theme/theme";
import { useLogin } from "../../features/auth/authQueries";
import { showSuccess, showError } from "../../utils/toast";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// lazy loading
const Image1 = require("../../assets/images/login/man_with_luggage.jpg");
const Image2 = require("../../assets/images/login/059ba1dd-4356-403f-b988-dda2fb01589e.jpg");
const Image3 = require("../../assets/images/login/2107.q705.014.F.m005.c5.bag luggage illustration.jpg");
const Image4 = require("../../assets/images/login/8672003.jpg");
const Image5 = require("../../assets/images/login/smiley-woman-posing-her-baggage.jpg");

const { width } = Dimensions.get("window");

const MOBILE_MIN_LENGTH = 10;
const MOBILE_MAX_LENGTH = 15;

// Using placeholder images for the infinite scroll grid
const ROW1_IMAGES = [
    Image5,
    Image2,
    Image1,
];

const ROW2_IMAGES = [
    Image4,
    Image3,
    Image1,
];

// Duplicate for seamless infinite loop
const GRID_IMAGES_ROW1 = [...ROW1_IMAGES, ...ROW1_IMAGES];
const GRID_IMAGES_ROW2 = [...ROW2_IMAGES, ...ROW2_IMAGES];

const IMAGE_WIDTH = (width - 40) / 3;
const GAP = 10;
const TOTAL_OFFSET = (IMAGE_WIDTH + GAP) * ROW1_IMAGES.length;

export default function LoginScreen() {
    const router = useRouter();
    const [mobile, setMobile] = useState<string>("");
    const [hasReferral, setHasReferral] = useState(false);
    const { mutate: sendOtp, isPending } = useLogin();

    // Animation Refs
    const kbdAnim = useRef(new Animated.Value(0)).current;
    const scrollAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Keyboard animations
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showListener = Keyboard.addListener(showEvent, () => {
            Animated.timing(kbdAnim, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }).start();
        });

        const hideListener = Keyboard.addListener(hideEvent, () => {
            Animated.timing(kbdAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.inOut(Easing.quad),
            }).start();
        });

        // Continuous scrolling animation
        Animated.loop(
            Animated.timing(scrollAnim, {
                toValue: 1,
                duration: 15000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        return () => {
            showListener.remove();
            hideListener.remove();
        };
    }, []);

    const handleMobileChange = (text: string) => {
        const sanitized = text.replace(/[^0-9]/g, "");
        if (sanitized.length <= MOBILE_MAX_LENGTH) {
            setMobile(sanitized);
        }
    };

    const isValidMobile = (number: string): boolean => {
        return (
            number.length >= MOBILE_MIN_LENGTH &&
            number.length <= MOBILE_MAX_LENGTH &&
            /^[0-9]+$/.test(number)
        );
    };

    const handleLogin = () => {
        const trimmedMobile = mobile.trim();
        if (isPending) return;
        if (!trimmedMobile) {
            showError("Please enter your mobile number");
            return;
        }
        if (!isValidMobile(trimmedMobile)) {
            showError(`Please enter a valid mobile number (${MOBILE_MIN_LENGTH}-${MOBILE_MAX_LENGTH} digits)`);
            return;
        }

        sendOtp(trimmedMobile, {
            onSuccess: () => {
                showSuccess("OTP sent successfully");
                router.push({
                    pathname: "/otp_verification",
                    params: { mobile: trimmedMobile },
                });
            },
            onError: (err) => {
                showError("Failed to send OTP. Please try again.");
                if (__DEV__) console.error("OTP Error:", err);
            },
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={THEME.PRIMARY} />

            <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
            >
                {/* HERO / HEADER SECTION */}
                <BackgroundGradient
                    primaryColor={THEME.PRIMARY}
                    secondaryColor={THEME.PRIMARY}
                    bottomColor={THEME.PRIMARY}
                    style={styles.header}
                >
                    <SafeAreaView edges={["top"]} style={styles.safeTop}>
                        {/* <TouchableOpacity
                            style={styles.skipButton}
                            onPress={() => router.replace("/(tabs)")}
                        >
                            <Text style={styles.skipText}>Skip login</Text>
                        </TouchableOpacity> */}

                        <Animated.View style={[
                            styles.headerContent,

                        ]}>
                            <Text style={styles.headerTitle}>Holdit</Text>
                            <View style={styles.headerTextWrap}>
                                <Text style={styles.headerText}>Get safe & secure luggage storage in minutes!</Text>
                            </View>
                        </Animated.View>
                    </SafeAreaView>
                </BackgroundGradient>

                {/* IMAGE GRID - Infinite Horizontal Scroll */}
                <View style={styles.gridSection}>
                    {/* Row 1 - Left to Right */}
                    <Animated.View style={[
                        styles.gridRow,
                        {
                            transform: [{
                                translateX: scrollAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-TOTAL_OFFSET, 0],
                                })
                            }]
                        }
                    ]}>
                        {GRID_IMAGES_ROW1.map((uri, idx) => (
                            <Image key={idx} source={uri} style={styles.gridImage} />
                        ))}
                    </Animated.View>

                    {/* Row 2 - Right to Left */}
                    <Animated.View style={[
                        styles.gridRow,
                        {
                            transform: [{
                                translateX: scrollAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -TOTAL_OFFSET],
                                })
                            }]
                        }
                    ]}>
                        {GRID_IMAGES_ROW2.map((uri, idx) => (
                            <Image key={idx} source={uri} style={styles.gridImage} />
                        ))}
                    </Animated.View>
                </View>

                {/* FORM SECTION */}
                <Animated.View style={[
                    styles.formContainer,
                    {
                        transform: [{
                            translateY: kbdAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -150],
                            })
                        }]
                    }
                ]}>
                    <LinearGradient
                        colors={["rgba(255,255,255,0)", "#ffffff"]}
                        style={styles.topShadow}
                    />
                    <Text style={styles.formTitle}>Log in or Sign up</Text>

                    <View style={[styles.inputWrapper, mobile.length > 0 && styles.inputWrapperActive]}>
                        <View style={styles.countryCode}>
                            <Text style={styles.countryCodeText}>+91</Text>
                        </View>
                        <TextInput
                            keyboardType="phone-pad"
                            placeholder="Enter mobile number"
                            value={mobile}
                            onChangeText={handleMobileChange}
                            style={styles.input}
                            placeholderTextColor={THEME.TEXT_DARK_SECONDARY}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, !isValidMobile(mobile) && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={isPending}
                    >
                        <Text style={styles.loginButtonText}>
                            {isPending ? "Loading..." : "Continue"}
                        </Text>
                    </TouchableOpacity>

                    {/* <TouchableOpacity
                        style={styles.referralToggle}
                        onPress={() => setHasReferral(!hasReferral)}
                    >
                        <View style={[styles.checkbox, hasReferral && styles.checkboxActive]}>
                            {hasReferral && <Ionicons name="checkmark" size={14} color="white" />}
                        </View>
                        <Text style={styles.referralText}>Have a referral code?</Text>
                    </TouchableOpacity> */}

                    <View style={styles.footerWrap}>
                        <Text style={styles.footerText}>
                            By continuing, you agree to our{" "}
                            <Text style={styles.footerLink}>Terms of Service</Text> &{" "}
                            <Text style={styles.footerLink}>Privacy Policy</Text>
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.BACKGROUND_LIGHT,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        borderBottomLeftRadius: 60,
        borderBottomRightRadius: 60,
        paddingBottom: 40,
        paddingTop: 20,
        zIndex: 10,
    },
    safeTop: {
        width: "100%",
    },
    skipButton: {
        position: "absolute",
        top: 20,
        right: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        zIndex: 20,
    },
    skipText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
    },
    headerContent: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 40,
        paddingHorizontal: 32,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 46,
        fontWeight: "900",
        color: "white",
        letterSpacing: -1,
    },
    headerTextWrap: {
        marginTop: 12,
    },
    headerText: {
        fontSize: 18,
        fontWeight: "800",
        color: "white",
        textAlign: "center",
        lineHeight: 28,
    },
    gridSection: {
        height: 230,
        paddingVertical: 15,
        gap: 10,
        overflow: "hidden",
    },
    gridRow: {
        flexDirection: "row",
        gap: GAP,
    },
    gridImage: {
        width: IMAGE_WIDTH,
        height: 100,
        borderRadius: 16,
        backgroundColor: "#eee",
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 40,
        alignItems: "center",
        backgroundColor: "#fff",
        marginTop: -40,
        zIndex: 30,
        position: "relative",
    },
    topShadow: {
        position: "absolute",
        top: -60,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 25,
    },
    formTitle: {
        fontSize: 28,
        fontWeight: "900",
        color: THEME.TEXT_DARK,
        marginBottom: 24,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        height: 64,
        borderWidth: 1.5,
        borderColor: THEME.BORDER_LIGHT,
        borderRadius: 16,
        backgroundColor: "white",
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    inputWrapperActive: {
        borderColor: THEME.PRIMARY,
    },
    countryCode: {
        paddingRight: 12,
        borderRightWidth: 1,
        borderRightColor: THEME.BORDER_LIGHT,
        marginRight: 12,
    },
    countryCodeText: {
        fontSize: 18,
        fontWeight: "800",
        color: THEME.TEXT_DARK,
    },
    input: {
        flex: 1,
        fontSize: 18,
        fontWeight: "800",
        color: THEME.TEXT_DARK,
    },
    loginButton: {
        width: "100%",
        height: 60,
        backgroundColor: THEME.PRIMARY,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    loginButtonDisabled: {
        backgroundColor: "#eee",
    },
    loginButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "800",
    },
    referralToggle: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 32,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: THEME.PRIMARY,
        marginRight: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxActive: {
        backgroundColor: THEME.PRIMARY,
    },
    referralText: {
        fontSize: 16,
        fontWeight: "800",
        color: THEME.PRIMARY_LIGHTER,
    },
    footerWrap: {
        marginTop: "auto",
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 12,
        color: THEME.TEXT_DARK_SECONDARY,
        textAlign: "center",
        lineHeight: 18,
    },
    footerLink: {
        fontWeight: "800",
        textDecorationLine: "underline",
    },
});
