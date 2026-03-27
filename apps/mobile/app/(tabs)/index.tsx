import type { ReactionType, PresenceUser } from "@nonley/types";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";

import EmptyState from "../../src/components/EmptyState";
import PresenceBubble from "../../src/components/PresenceBubble";
import ReactionBar from "../../src/components/ReactionBar";
import { usePresenceClient } from "../../src/lib/presence";
import { useAuthStore } from "../../src/stores/auth";
import { usePresenceStore } from "../../src/stores/presence";
import { colors } from "../../src/theme/colors";

export default function HomeScreen(): React.JSX.Element {
  const currentRoom = usePresenceStore((s) => s.currentRoom);
  const connected = usePresenceStore((s) => s.connected);
  const focusMode = usePresenceStore((s) => s.focusMode);
  const reactions = usePresenceStore((s) => s.reactions);
  const user = useAuthStore((s) => s.user);
  const client = usePresenceClient();
  const selectedUserRef = useRef<PresenceUser | null>(null);

  const allUsers = useMemo(() => {
    if (!currentRoom) return [];
    return [...currentRoom.ring1, ...currentRoom.ring2];
  }, [currentRoom]);

  const handleReaction = useCallback(
    (type: ReactionType) => {
      if (!client?.connected || !selectedUserRef.current) {
        Alert.alert(
          "Select a person",
          "Tap on someone in the room to send them a reaction.",
        );
        return;
      }
      client.sendReaction(type, selectedUserRef.current.userId);
    },
    [client],
  );

  const handleUserPress = useCallback(
    (pressedUser: PresenceUser) => {
      selectedUserRef.current = pressedUser;

      if (pressedUser.privacyLevel === "ghost") {
        return;
      }

      Alert.alert(pressedUser.name, "What would you like to do?", [
        {
          text: "View Profile",
          onPress: () => router.push(`/user/${pressedUser.userId}`),
        },
        {
          text: "Whisper",
          onPress: () => {
            client?.initiateWhisper(pressedUser.userId);
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    [client],
  );

  const handleToggleFocus = useCallback(() => {
    const newState = !focusMode;
    usePresenceStore.getState().setFocusMode(newState);
    client?.toggleFocus(newState);
  }, [client, focusMode]);

  const renderUser = useCallback(
    ({ item }: { item: PresenceUser }) => (
      <PresenceBubble user={item} onPress={handleUserPress} />
    ),
    [handleUserPress],
  );

  const keyExtractor = useCallback((item: PresenceUser) => item.userId, []);

  // Incoming reactions overlay
  const userReactions = useMemo(() => {
    if (!user) return [];
    return reactions.filter((r) => r.toUserId === user.id);
  }, [reactions, user]);

  if (focusMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.focusContainer}>
          <Text style={styles.focusIcon}>{"\u{1F9D8}"}</Text>
          <Text style={styles.focusTitle}>Focus Mode</Text>
          <Text style={styles.focusDescription}>
            Nonley is paused. You are invisible to others and won't receive
            notifications.
          </Text>
          <TouchableOpacity
            style={styles.focusButton}
            onPress={handleToggleFocus}
          >
            <Text style={styles.focusButtonText}>Exit Focus Mode</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Connection status */}
      <View style={styles.statusBar}>
        <View
          style={[
            styles.statusDot,
            connected ? styles.statusOnline : styles.statusOffline,
          ]}
        />
        <Text style={styles.statusText}>
          {connected ? "Connected" : "Reconnecting..."}
        </Text>
        <TouchableOpacity
          style={styles.focusToggle}
          onPress={handleToggleFocus}
        >
          <Text style={styles.focusToggleText}>{"\u{1F9D8}"} Focus</Text>
        </TouchableOpacity>
      </View>

      {/* Incoming reactions overlay */}
      {userReactions.length > 0 && (
        <View style={styles.reactionOverlay}>
          {userReactions.map((r, index) => (
            <Text
              key={`${r.fromUserId}-${r.timestamp}-${index}`}
              style={styles.reactionEmoji}
            >
              {r.type === "wave"
                ? "\u{1F44B}"
                : r.type === "nod"
                  ? "\u{1F44D}"
                  : r.type === "lightbulb"
                    ? "\u{1F4A1}"
                    : r.type === "question"
                      ? "\u2753"
                      : "\u{1F525}"}
            </Text>
          ))}
        </View>
      )}

      {/* Room info */}
      {currentRoom ? (
        <View style={styles.roomInfo}>
          <Text style={styles.roomTitle}>Current Room</Text>
          <View style={styles.roomStats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{currentRoom.totalCount}</Text>
              <Text style={styles.statLabel}>here now</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{currentRoom.ring1.length}</Text>
              <Text style={styles.statLabel}>close</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{currentRoom.ring2.length}</Text>
              <Text style={styles.statLabel}>nearby</Text>
            </View>
            {currentRoom.ring3Count > 0 && (
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{currentRoom.ring3Count}</Text>
                <Text style={styles.statLabel}>around</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.noRoom}>
          <EmptyState
            icon={"\u{1F30C}"}
            title="No room yet"
            description="Browse the web, play music, or open an app. Nonley will detect what you're experiencing and show you who else is there."
          />
        </View>
      )}

      {/* Presence users */}
      {allUsers.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>People here</Text>
            <Text style={styles.sectionCount}>{allUsers.length} visible</Text>
          </View>
          <FlatList
            data={allUsers}
            renderItem={renderUser}
            keyExtractor={keyExtractor}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.userList}
            style={styles.userListContainer}
          />
        </>
      ) : currentRoom ? (
        <View style={styles.emptyUsers}>
          <Text style={styles.emptyUsersText}>
            {"\u{1F47B}"} No one else visible here yet
          </Text>
        </View>
      ) : null}

      {/* Reaction bar */}
      <View style={styles.reactionBarContainer}>
        <ReactionBar
          onReact={handleReaction}
          disabled={!connected || !currentRoom}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusOnline: {
    backgroundColor: colors.accent,
  },
  statusOffline: {
    backgroundColor: colors.warning,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
  },
  focusToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  focusToggleText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  reactionOverlay: {
    position: "absolute",
    top: 60,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 32,
  },
  roomInfo: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  roomTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  roomStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "700",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  noRoom: {
    flex: 1,
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  sectionCount: {
    color: colors.textMuted,
    fontSize: 13,
  },
  userListContainer: {
    flexGrow: 0,
  },
  userList: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  emptyUsers: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyUsersText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  reactionBarContainer: {
    paddingVertical: 16,
    marginTop: "auto",
  },
  focusContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  focusIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  focusTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  focusDescription: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  focusButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  focusButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
