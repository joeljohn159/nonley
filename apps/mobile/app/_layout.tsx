import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";

import { useNotifications } from "../src/hooks/useNotifications";
import { usePresenceManager } from "../src/lib/presence";
import { useAuthStore } from "../src/stores/auth";
import { colors } from "../src/theme/colors";

SplashScreen.preventAutoHideAsync();

export default function RootLayout(): React.JSX.Element {
  const initialize = useAuthStore((s) => s.initialize);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Manage presence client lifecycle (auto-connects when wsToken is available)
  usePresenceManager();

  // Register for push notifications
  useNotifications();

  useEffect(() => {
    initialize().finally(() => {
      SplashScreen.hideAsync();
    });
  }, [initialize]);

  if (isLoading) {
    return (
      <>
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="chat/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: "600" },
          }}
        />
        <Stack.Screen
          name="circle/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: "600" },
          }}
        />
        <Stack.Screen
          name="user/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: "600" },
          }}
        />
      </Stack>
    </>
  );
}
