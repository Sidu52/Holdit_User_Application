import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Carousel from "react-native-reanimated-carousel";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SLIDES } from "@/constants/data";

import { THEME } from "@/constants/theme";
import { useSendOtp } from "@/features/auth/auth.queries";
import { showSuccess, showError } from "@/lib/toast";

const { width } = Dimensions.get("window");

const MOBILE_MIN_LENGTH = 10;
const MOBILE_MAX_LENGTH = 15;

export default function LoginScreen() {
  const router = useRouter();
  const [mobile, setMobile] = useState<string>("");
  const { mutate: sendOtp, isPending } = useSendOtp();

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
    if (isPending) {
      return;
    }
    if (!trimmedMobile) {
      showError("Please enter your mobile number");
      return;
    }
    if (!isValidMobile(trimmedMobile)) {
      showError(
        `Please enter a valid mobile number (${MOBILE_MIN_LENGTH}-${MOBILE_MAX_LENGTH} digits)`,
      );
      return;
    }

    sendOtp(trimmedMobile, {
      onSuccess: (_res) => {
        showSuccess("OTP sent successfully");
        router.push({
          pathname: "/otp_verification",
          params: { mobile: trimmedMobile },
        });
      },
      onError: (err) => {
        showError("Failed to send OTP. Please try again.");
        if (__DEV__) {
          console.error("OTP Error:", err);
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Holdit</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {/* CAROUSEL */}
        <View style={styles.carouselWrap}>
          <Carousel
            loop
            autoPlay
            autoPlayInterval={3000}
            width={width - 32}
            height={200}
            data={SLIDES}
            scrollAnimationDuration={1000}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <LinearGradient
                  colors={["rgba(0,0,0,0.6)", "transparent"]}
                  style={styles.gradient}
                />
                <Image
                  source={{ uri: item.image }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <View style={styles.slideTextWrap}>
                  <Text style={styles.slideTitle}>{item.title}</Text>
                </View>
              </View>
            )}
          />
        </View>

        {/* TEXT */}
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Let’s get moving</Text>
        </View>

        <View style={styles.descWrap}>
          <Text style={styles.description}>
            Enter your mobile number to continue.
          </Text>
        </View>

        {/* INPUT */}
        <View style={styles.inputWrap}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            keyboardType="phone-pad"
            placeholder="Enter your mobile number"
            value={mobile}
            onChangeText={handleMobileChange}
            style={styles.input}
          />
        </View>
      </View>

      {/* BOTTOM CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInner}>
          <Text style={styles.terms}>
            By clicking continue, you agree to our{" "}
            <Text style={styles.link}>Terms</Text> and{" "}
            <Text style={styles.link}>Privacy Policy</Text>.
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>
              {isPending ? "Loading..." : "Send OTP"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.BACKGROUND_LIGHT,
    fontFamily: "Lexend_400Regular",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    opacity: 0,
  },

  content: {
    flex: 1,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    paddingBottom: 120,
  },

  carouselWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  slide: {
    borderRadius: 16,
    overflow: "hidden",
    height: 200,
  },

  gradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  slideTextWrap: {
    position: "absolute",
    bottom: 20,
    left: 20,
    zIndex: 20,
  },

  slideTitle: {
    color: THEME.TEXT_PRIMARY,
    fontSize: 28,
    fontWeight: "800",
  },

  titleWrap: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: THEME.TEXT_DARK,
  },

  descWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  description: {
    fontSize: 16,
    color: THEME.TEXT_DARK_SECONDARY,
    lineHeight: 24,
  },

  inputWrap: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER_LIGHT,
    paddingHorizontal: 16,
    fontSize: 18,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: THEME.BORDER_LIGHT,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  bottomInner: {
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    gap: 12,
  },

  terms: {
    fontSize: 12,
    textAlign: "center",
    color: THEME.TEXT_DARK_SECONDARY,
    paddingHorizontal: 16,
  },

  link: {
    color: THEME.INFO,
  },

  button: {
    backgroundColor: THEME.PRIMARY_LIGHTER,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: THEME.TEXT_PRIMARY,
    fontWeight: "700",
    fontSize: 16,
  },
});
