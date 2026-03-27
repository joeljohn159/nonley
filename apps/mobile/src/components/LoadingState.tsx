import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

import { colors } from "../theme/colors";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingState({
  message,
  fullScreen = true,
}: LoadingStateProps): React.JSX.Element {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
});
