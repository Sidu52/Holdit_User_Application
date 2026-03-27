import { Stack } from "expo-router";
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

function RootInner() {
  const { isAuthenticated, loading: isLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);

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
          <>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(screens)" />
          </>
        ) : (
          <Stack.Screen name="(tabs)" />
        )}
      </Stack>
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
