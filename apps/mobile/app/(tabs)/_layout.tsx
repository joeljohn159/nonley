import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Text, StyleSheet } from "react-native";

import { useAuthStore } from "../../src/stores/auth";
import { useChatStore } from "../../src/stores/chat";
import { useFriendsStore } from "../../src/stores/friends";
import { colors } from "../../src/theme/colors";

function TabIcon({
  emoji,
  focused,
}: {
  emoji: string;
  focused: boolean;
}): React.JSX.Element {
  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      {emoji}
    </Text>
  );
}

export default function TabsLayout(): React.JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const unreadChats = useChatStore((s) =>
    s.activeChats.reduce((sum, c) => sum + c.unreadCount, 0),
  );
  const pendingRequests = useFriendsStore((s) => s.pendingRequests.length);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Presence",
          headerTitle: "nonley",
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 20,
            color: colors.primary,
          },
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={"\u{1F30D}"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={"\u{1F465}"} focused={focused} />
          ),
          tabBarBadge: pendingRequests > 0 ? pendingRequests : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: colors.white,
            fontSize: 10,
          },
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          title: "Circles",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={"\u{2B55}"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={"\u{1F4AC}"} focused={focused} />
          ),
          tabBarBadge: unreadChats > 0 ? unreadChats : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.danger,
            color: colors.white,
            fontSize: 10,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={"\u{1F464}"} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 22,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
});
