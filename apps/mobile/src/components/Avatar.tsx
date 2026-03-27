import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";

import { colors } from "../theme/colors";

interface AvatarProps {
  uri: string | null;
  name: string | null;
  size?: number;
  showOnline?: boolean;
  online?: boolean;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return (parts[0]?.[0] ?? "?").toUpperCase();
  }
  return (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
}

function getAvatarColor(name: string | null): string {
  if (!name) return colors.surfaceElevated;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 50%, 40%)`;
}

export default function Avatar({
  uri,
  name,
  size = 40,
  showOnline = false,
  online = false,
}: AvatarProps): React.JSX.Element {
  const indicatorSize = Math.max(10, size * 0.28);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: getAvatarColor(name),
            },
          ]}
        >
          <Text
            style={[styles.initials, { fontSize: size * 0.4 }]}
            numberOfLines={1}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}
      {showOnline && (
        <View
          style={[
            styles.indicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              backgroundColor: online ? colors.accent : colors.textMuted,
              borderWidth: indicatorSize * 0.2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  image: {
    backgroundColor: colors.surfaceElevated,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: colors.white,
    fontWeight: "600",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderColor: colors.background,
  },
});
