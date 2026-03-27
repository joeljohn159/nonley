import type { Circle } from "@nonley/types";
import { useLocalSearchParams, Stack, router } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";

import LoadingState from "../../src/components/LoadingState";
import * as api from "../../src/lib/api";
import { useAuthStore } from "../../src/stores/auth";
import { colors } from "../../src/theme/colors";

export default function CircleDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const circleId = id ?? "";
  const userId = useAuthStore((s) => s.user?.id);

  const [circle, setCircle] = useState<Circle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [joiningOrLeaving, setJoiningOrLeaving] = useState(false);

  const loadCircle = useCallback(async () => {
    try {
      setError(null);
      const data = await api.fetchCircle(circleId);
      setCircle(data);
      // Assume user is a member if they can see the circle in their list
      setIsMember(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load circle");
    }
  }, [circleId]);

  useEffect(() => {
    loadCircle().finally(() => setIsLoading(false));
  }, [loadCircle]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCircle();
    setRefreshing(false);
  }, [loadCircle]);

  const handleJoinCircle = useCallback(async () => {
    setJoiningOrLeaving(true);
    try {
      await api.joinCircle(circleId);
      setIsMember(true);
      Alert.alert("Joined!", "You are now a member of this circle.");
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Could not join circle",
      );
    } finally {
      setJoiningOrLeaving(false);
    }
  }, [circleId]);

  const handleLeaveCircle = useCallback(async () => {
    Alert.alert(
      "Leave Circle",
      `Are you sure you want to leave "${circle?.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            setJoiningOrLeaving(true);
            try {
              await api.leaveCircle(circleId);
              setIsMember(false);
              router.back();
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Could not leave circle",
              );
            } finally {
              setJoiningOrLeaving(false);
            }
          },
        },
      ],
    );
  }, [circle?.name, circleId]);

  const handleDeleteCircle = useCallback(async () => {
    Alert.alert(
      "Delete Circle",
      `Are you sure you want to delete "${circle?.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteCircle(circleId);
              router.back();
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Could not delete circle",
              );
            }
          },
        },
      ],
    );
  }, [circle?.name, circleId]);

  if (isLoading) {
    return <LoadingState message="Loading circle..." />;
  }

  if (error || !circle) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: "Circle",
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
          }}
        />
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>{"\u26A0\u{FE0F}"}</Text>
            <Text style={styles.errorTitle}>Could not load circle</Text>
            <Text style={styles.errorMessage}>
              {error ?? "Circle not found"}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadCircle}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const isOwner = circle.createdBy === userId;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: circle.name,
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Circle header */}
          <View style={styles.header}>
            <View style={styles.circleIconLarge}>
              <Text style={styles.circleIconText}>
                {circle.type === "url_based"
                  ? "\u{1F310}"
                  : circle.type === "auto_detected"
                    ? "\u{2728}"
                    : "\u{1F465}"}
              </Text>
            </View>
            <Text style={styles.circleName}>{circle.name}</Text>
            <View style={styles.badges}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {circle.isPublic ? "Public" : "Private"}
                </Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {circle.type.replace("_", " ")}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {circle.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.descriptionText}>{circle.description}</Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>
                {new Date(circle.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>
                {circle.type.replace("_", " ")}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            {isMember ? (
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={handleLeaveCircle}
                disabled={joiningOrLeaving}
              >
                <Text style={styles.leaveButtonText}>
                  {joiningOrLeaving ? "Leaving..." : "Leave Circle"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={handleJoinCircle}
                disabled={joiningOrLeaving}
              >
                <Text style={styles.joinButtonText}>
                  {joiningOrLeaving ? "Joining..." : "Join Circle"}
                </Text>
              </TouchableOpacity>
            )}

            {isOwner && (
              <TouchableOpacity
                style={styles.deleteCircleButton}
                onPress={handleDeleteCircle}
              >
                <Text style={styles.deleteCircleText}>Delete Circle</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  circleIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  circleIconText: {
    fontSize: 36,
  },
  circleName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  badges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  badge: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "capitalize",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  descriptionText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    textTransform: "capitalize",
  },
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  joinButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  leaveButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  leaveButtonText: {
    color: colors.warning,
    fontSize: 16,
    fontWeight: "600",
  },
  deleteCircleButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.danger,
    marginTop: 8,
  },
  deleteCircleText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  errorMessage: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
});
