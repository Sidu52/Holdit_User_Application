import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import SignupBottomSheet from "@/components/bottomSheet/signupBottomSheet";
import { useProfile } from "@/features/user/user.queries";
import FullScreenLoader from "@/components/loader/FullScreenLoader";
import { CustomTabBar } from "@/components/navigation/CustomTabBar";
import { useRouter } from "expo-router";

export default function TabsLayout() {
  const router = useRouter();
  const { data: user, isLoading, isError, error } = useProfile();

  // An unauthenticated user should be redirected back to login.
  if (isError) {
    console.log("ENTER TO ERROR", isError)
    const status = (error as any)?.response?.status;
    if (status === 401 || status === 403) {
      router.replace("/login");
      return null;
    }
    return
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <FullScreenLoader />
      </View>
    );
  }

  // always showing the signup bottom sheet (which may not be intended).
  if (!user) {
    if (__DEV__) {
      console.warn("Profile loaded but user data is null/undefined");
    }
    router.replace("/login");
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => (user?.is_signup ? <CustomTabBar {...props} /> : null)}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="schedule" options={{ title: "Schedule" }} />
      </Tabs>
      {!user?.is_signup && <SignupBottomSheet />}
    </View>
  );
}
