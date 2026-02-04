import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import SignupBottomSheet from "@/components/bottomSheet/signupBottomSheet";
import { useUser } from "@/features/user/user.queries";
import TruckLoader from "@/components/loader/TruckLoader";
import { CustomTabBar } from "@/components/navigation/CustomTabBar";

export default function TabsLayout() {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <TruckLoader />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />

        <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      </Tabs>

      {!user?.isSignUp && <SignupBottomSheet />}
    </View>
  );
}
