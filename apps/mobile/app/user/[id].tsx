import type { UserProfile } from "@nonley/types";
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
} from "react-native";

import Avatar from "../../src/components/Avatar";
import LoadingState from "../../src/components/LoadingState";
import * as api from "../../src/lib/api";
import { usePresenceClient } from "../../src/lib/presence";
import { useAuthStore } from "../../src/stores/auth";
import { colors } from "../../src/theme/colors";

export default function UserProfileScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profileUserId = id ?? "";
  const currentUserId = useAuthStore((s) => s.user?.id);
  const client = usePresenceClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  const isOwnProfile = currentUserId === profileUserId;

  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      const data = await api.fetchProfile(profileUserId);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    }
  }, [profileUserId]);

  useEffect(() => {
    loadProfile().finally(() => setIsLoading(false));
  }, [loadProfile]);

  const handleSendFriendRequest = useCallback(async () => {
    setSendingRequest(true);
    try {
      await api.sendFriendRequest(profileUserId);
      Alert.alert(
        "Friend Request Sent",
        "They'll be notified of your request.",
      );
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Could not send friend request",
      );
    } finally {
      setSendingRequest(false);
    }
  }, [profileUserId]);

  const handleWhisper = useCallback(() => {
    client?.initiateWhisper(profileUserId);
    Alert.alert(
      "Whisper Sent",
      "Waiting for them to accept your whisper request...",
    );
  }, [client, profileUserId]);

  const handleWave = useCallback(async () => {
    try {
      await api.sendWave(profileUserId);
      Alert.alert("Wave Sent!", "They'll see your wave.");
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Could not send wave",
      );
    }
  }, [profileUserId]);

  if (isLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (error || !profile) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: "Profile",
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
          }}
        />
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>{"\u26A0\u{FE0F}"}</Text>
            <Text style={styles.errorTitle}>Profile not found</Text>
            <Text style={styles.errorMessage}>
              {error ?? "This user may have their privacy set to ghost mode."}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.retryText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Profile",
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Avatar and name */}
          <View style={styles.header}>
            <Avatar uri={null} name={null} size={80} />
            <Text style={styles.userId}>User</Text>

            {/* Warmth score */}
            <View style={styles.warmthContainer}>
              <Text style={styles.warmthLabel}>Warmth</Text>
              <View style={styles.warmthBarBackground}>
                <View
                  style={[
                    styles.warmthBarFill,
                    {
                      width: `${Math.min(100, Math.max(0, profile.warmthScore))}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.warmthValue}>{profile.warmthScore}</Text>
            </View>
          </View>

          {/* Bio */}
          {profile.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bio</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          )}

          {/* Interests */}
          {profile.interests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestsList}>
                {profile.interests.map((interest) => (
                  <View key={interest} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Location */}
          {(profile.locationCity || profile.locationCountry) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.locationText}>
                {[profile.locationCity, profile.locationCountry]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            </View>
          )}

          {/* Actions (only for other users) */}
          {!isOwnProfile && (
            <View style={styles.actionsSection}>
              <TouchableOpacity style={styles.waveButton} onPress={handleWave}>
                <Text style={styles.waveButtonText}>{"\u{1F44B}"} Wave</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.whisperButton}
                onPress={handleWhisper}
              >
                <Text style={styles.whisperButtonText}>
                  {"\u{1F4AD}"} Whisper
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.friendRequestButton,
                  sendingRequest && styles.friendRequestButtonDisabled,
                ]}
                onPress={handleSendFriendRequest}
                disabled={sendingRequest}
              >
                <Text style={styles.friendRequestText}>
                  {sendingRequest
                    ? "Sending..."
                    : "\u{1F91D} Send Friend Request"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  userId: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 16,
  },
  warmthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  warmthLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  warmthBarBackground: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceElevated,
    overflow: "hidden",
  },
  warmthBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  warmthValue: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "right",
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
    marginBottom: 8,
  },
  bioText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  interestsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestTag: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  interestText: {
    color: colors.text,
    fontSize: 13,
  },
  locationText: {
    color: colors.text,
    fontSize: 15,
  },
  actionsSection: {
    paddingHorizontal: 16,
    paddingTop: 32,
    gap: 12,
  },
  waveButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  waveButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  whisperButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  whisperButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  friendRequestButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  friendRequestButtonDisabled: {
    opacity: 0.5,
  },
  friendRequestText: {
    color: colors.white,
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
    lineHeight: 20,
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
