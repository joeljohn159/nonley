import type { Friend, FriendRequest } from "@nonley/types";
import { router } from "expo-router";
import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";

import EmptyState from "../../src/components/EmptyState";
import LoadingState from "../../src/components/LoadingState";
import UserRow from "../../src/components/UserRow";
import * as api from "../../src/lib/api";
import { useFriendsStore } from "../../src/stores/friends";
import { colors } from "../../src/theme/colors";

export default function FriendsScreen(): React.JSX.Element {
  const friends = useFriendsStore((s) => s.friends);
  const pendingRequests = useFriendsStore((s) => s.pendingRequests);
  const isLoading = useFriendsStore((s) => s.isLoading);
  const error = useFriendsStore((s) => s.error);
  const fetchFriends = useFriendsStore((s) => s.fetchFriends);
  const fetchPendingRequests = useFriendsStore((s) => s.fetchPendingRequests);

  const [refreshing, setRefreshing] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, [fetchFriends, fetchPendingRequests]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFriends(), fetchPendingRequests()]);
    setRefreshing(false);
  }, [fetchFriends, fetchPendingRequests]);

  const handleAcceptRequest = useCallback(
    async (requestId: string) => {
      try {
        await api.respondToFriendRequest(requestId, "accept");
        useFriendsStore.getState().handleRequestDeclined(requestId);
        await fetchFriends();
      } catch (err) {
        Alert.alert(
          "Error",
          err instanceof Error ? err.message : "Could not accept request",
        );
      }
    },
    [fetchFriends],
  );

  const handleDeclineRequest = useCallback(async (requestId: string) => {
    try {
      await api.respondToFriendRequest(requestId, "decline");
      useFriendsStore.getState().handleRequestDeclined(requestId);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Could not decline request",
      );
    }
  }, []);

  const handleSearchUser = useCallback(async () => {
    const trimmed = searchEmail.trim();
    if (!trimmed) return;

    setSearching(true);
    try {
      const found = await api.lookupUserByEmail(trimmed);
      if (found) {
        Alert.alert(
          "User Found",
          `Send friend request to ${found.name ?? trimmed}?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Send Request",
              onPress: async () => {
                try {
                  await api.sendFriendRequest(found.id);
                  Alert.alert("Success", "Friend request sent!");
                  setSearchEmail("");
                  setShowAddFriend(false);
                } catch (err) {
                  Alert.alert(
                    "Error",
                    err instanceof Error
                      ? err.message
                      : "Could not send request",
                  );
                }
              },
            },
          ],
        );
      } else {
        Alert.alert("Not Found", "No user found with that email address.");
      }
    } catch {
      Alert.alert("Error", "Failed to search. Please try again.");
    } finally {
      setSearching(false);
    }
  }, [searchEmail]);

  const handleRemoveFriend = useCallback((friend: Friend) => {
    Alert.alert(
      "Remove Friend",
      `Remove ${friend.name ?? "this friend"} from your friends list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await api.removeFriend(friend.friendshipId);
              useFriendsStore.getState().removeFriend(friend.friendshipId);
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Could not remove friend",
              );
            }
          },
        },
      ],
    );
  }, []);

  const renderPendingRequest = useCallback(
    ({ item }: { item: FriendRequest }) => (
      <UserRow
        userId={item.fromId}
        name={item.from?.name ?? null}
        avatarUrl={item.from?.avatarUrl ?? null}
        subtitle="Sent you a friend request"
        rightAction={
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptRequest(item.id)}
            >
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleDeclineRequest(item.id)}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        }
      />
    ),
    [handleAcceptRequest, handleDeclineRequest],
  );

  const renderFriend = useCallback(
    ({ item }: { item: Friend }) => (
      <UserRow
        userId={item.userId}
        name={item.name}
        avatarUrl={item.avatarUrl}
        showOnline
        online={item.online}
        subtitle={item.online ? "Online" : "Offline"}
        onPress={() => router.push(`/chat/${item.friendshipId}`)}
        rightAction={
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => handleRemoveFriend(item)}
          >
            <Text style={styles.moreButtonText}>{"\u22EF"}</Text>
          </TouchableOpacity>
        }
      />
    ),
    [handleRemoveFriend],
  );

  const keyExtractorRequest = useCallback((item: FriendRequest) => item.id, []);

  const keyExtractorFriend = useCallback(
    (item: Friend) => item.friendshipId,
    [],
  );

  if (isLoading && friends.length === 0) {
    return <LoadingState message="Loading friends..." />;
  }

  // Sort friends: online first
  const sortedFriends = [...friends].sort((a, b) => {
    if (a.online && !b.online) return -1;
    if (!a.online && b.online) return 1;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Add friend */}
      <View style={styles.addFriendBar}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddFriend(!showAddFriend)}
        >
          <Text style={styles.addButtonText}>
            {showAddFriend ? "Cancel" : "+ Add Friend"}
          </Text>
        </TouchableOpacity>
      </View>

      {showAddFriend && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter email address..."
            placeholderTextColor={colors.textMuted}
            value={searchEmail}
            onChangeText={setSearchEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleSearchUser}
          />
          <TouchableOpacity
            style={[
              styles.searchButton,
              searching && styles.searchButtonDisabled,
            ]}
            onPress={handleSearchUser}
            disabled={searching}
          >
            <Text style={styles.searchButtonText}>
              {searching ? "..." : "Search"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Friend Requests ({pendingRequests.length})
          </Text>
          <FlatList
            data={pendingRequests}
            renderItem={renderPendingRequest}
            keyExtractor={keyExtractorRequest}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Friends list */}
      {sortedFriends.length > 0 ? (
        <FlatList
          data={sortedFriends}
          renderItem={renderFriend}
          keyExtractor={keyExtractorFriend}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              Friends ({sortedFriends.length})
            </Text>
          }
        />
      ) : (
        <EmptyState
          icon={"\u{1F91D}"}
          title="No friends yet"
          description="Add friends by their email address. When you're both online, you can chat and see where each other is hanging out."
          action={
            <TouchableOpacity
              style={styles.addFriendAction}
              onPress={() => setShowAddFriend(true)}
            >
              <Text style={styles.addFriendActionText}>Add a friend</Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addFriendBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "flex-end",
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    color: colors.white,
    fontSize: 13,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  acceptText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  declineButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  declineText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  moreButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  moreButtonText: {
    color: colors.textMuted,
    fontSize: 20,
  },
  addFriendAction: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addFriendActionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
});
