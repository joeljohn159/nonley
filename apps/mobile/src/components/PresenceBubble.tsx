import type { PresenceUser } from "@nonley/types";
import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { colors } from "../theme/colors";

import Avatar from "./Avatar";

interface PresenceBubbleProps {
  user: PresenceUser;
  onPress?: (user: PresenceUser) => void;
}

function PresenceBubbleInner({
  user,
  onPress,
}: PresenceBubbleProps): React.JSX.Element {
  const ringColor =
    user.ring === 1
      ? colors.primary
      : user.ring === 2
        ? colors.primaryMuted
        : colors.textMuted;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(user)}
      activeOpacity={0.7}
    >
      <View style={[styles.ring, { borderColor: ringColor }]}>
        <Avatar uri={user.avatarUrl} name={user.name} size={48} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {user.privacyLevel === "anonymous" ? "Someone" : user.name}
      </Text>
      {user.privacyLevel === "anonymous" && (
        <View style={styles.anonBadge}>
          <Text style={styles.anonText}>anon</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const PresenceBubble = memo(PresenceBubbleInner);
export default PresenceBubble;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 64,
  },
  ring: {
    borderWidth: 2,
    borderRadius: 28,
    padding: 2,
  },
  name: {
    color: colors.text,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
    maxWidth: 64,
  },
  anonBadge: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
  },
  anonText: {
    color: colors.textMuted,
    fontSize: 9,
  },
});
