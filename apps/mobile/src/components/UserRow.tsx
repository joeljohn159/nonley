import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { colors } from "../theme/colors";

import Avatar from "./Avatar";

interface UserRowProps {
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  subtitle?: string;
  showOnline?: boolean;
  online?: boolean;
  onPress?: () => void;
  rightAction?: React.ReactNode;
}

function UserRowInner({
  name,
  avatarUrl,
  subtitle,
  showOnline = false,
  online = false,
  onPress,
  rightAction,
}: UserRowProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Avatar
        uri={avatarUrl}
        name={name}
        size={44}
        showOnline={showOnline}
        online={online}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name ?? "Anonymous"}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightAction && <View style={styles.action}>{rightAction}</View>}
    </TouchableOpacity>
  );
}

const UserRow = memo(UserRowInner);
export default UserRow;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 1,
  },
  action: {
    marginLeft: 8,
  },
});
