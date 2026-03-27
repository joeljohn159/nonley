import { Redirect, Stack } from "expo-router";
import React from "react";

import { useAuthStore } from "../../src/stores/auth";
import { colors } from "../../src/theme/colors";

export default function AuthLayout(): React.JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}
