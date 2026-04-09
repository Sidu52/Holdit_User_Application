import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import "../../global.css";
import React from "react";
import CustomSplashScreen from "@/components/splash";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// font
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";

import {
  Lexend_400Regular,
  Lexend_600SemiBold,
} from "@expo-google-fonts/lexend";

import { Audiowide_400Regular } from "@expo-google-fonts/audiowide";
import { Providers } from "./Providers";
import { useAuth } from "@/hooks/useAuth";

SplashScreen.preventAutoHideAsync();

import StatusPopup from "@/components/ui/StatusPopup";

function RootInner() {
  const { isAuthenticated, loading: isLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Audiowide_400Regular,
    Lexend_400Regular,
    Lexend_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  // Handle redirection based on auth state
  useEffect(() => {
    // Wait for auth initialization and fonts
    if (isLoading || !fontsLoaded || !appReady) return;

    const inAuthGroup = segments[0] === "(auth)";

    console.log("[NAV] Auth:", isAuthenticated, "InAuthGroup:", inAuthGroup, "Segments:", segments);

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not already in auth group
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated but still in auth group
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, fontsLoaded, appReady, segments, router]);

  // Handle the completion of the custom animation
  const onAnimationFinish = () => {
    setAppReady(true);
  };

  if (!fontsLoaded || isLoading) {
    return null;
  }

  // Show custom splash screen
  if (!appReady) {
    return <CustomSplashScreen onFinish={onAnimationFinish} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* If not authenticated, the first thing they see is Auth */}
        {!isAuthenticated ? (
          <Stack.Screen name="(auth)" />
        ) : (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(screens)" />
          </>
        )}
      </Stack>

      <StatusPopup />
      <Toast />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <Providers>
      <RootInner />
    </Providers>
  );
}
