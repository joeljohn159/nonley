import { router } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";

import Avatar from "../../src/components/Avatar";
import EmptyState from "../../src/components/EmptyState";
import { usePresenceClient } from "../../src/lib/presence";
import { useChatStore } from "../../src/stores/chat";
import type { ActiveChat } from "../../src/stores/chat";
import { colors } from "../../src/theme/colors";

function formatRelativeTime(date: Date | null): string {
  if (!date) return "";
  const now = new Date();
  const d = date instanceof Date ? date : new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

function getChatKindLabel(kind: ActiveChat["kind"]): string {
  switch (kind) {
    case "whisper":
      return "Whisper";
    case "group":
      return "Group";
    case "friend":
      return "Friend";
    case "next_person":
      return "Next Person";
  }
}

function getChatKindIcon(kind: ActiveChat["kind"]): string {
  switch (kind) {
    case "whisper":
      return "\u{1F4AD}";
    case "group":
      return "\u{1F465}";
    case "friend":
      return "\u{1F49C}";
    case "next_person":
      return "\u{1F3B2}";
  }
}

export default function ChatScreen(): React.JSX.Element {
  const activeChats = useChatStore((s) => s.activeChats);
  const whisperRequests = useChatStore((s) => s.whisperRequests);
  const nextPersonSearching = useChatStore((s) => s.nextPersonSearching);
  const markChatRead = useChatStore((s) => s.markChatRead);
  const client = usePresenceClient();

  const sortedChats = useMemo(() => {
    return [...activeChats].sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [activeChats]);

  const handleChatPress = useCallback(
    (chat: ActiveChat) => {
      markChatRead(chat.id);
      router.push(`/chat/${chat.id}`);
    },
    [markChatRead],
  );

  const handleAcceptWhisper = useCallback(
    (chatId: string) => {
      client?.acceptWhisper(chatId);
    },
    [client],
  );

  const handleDeclineWhisper = useCallback(
    (chatId: string) => {
      client?.declineWhisper(chatId);
      useChatStore.getState().removeWhisperRequest(chatId);
    },
    [client],
  );

  const handleNextPerson = useCallback(() => {
    const roomHash = client?.roomHash;
    if (!roomHash) {
      Alert.alert("No Room", "You need to be in a room to use Next Person.");
      return;
    }
    useChatStore.getState().setNextPersonSearching(true);
    client?.nextPerson(roomHash);
  }, [client]);

  const renderWhisperRequest = useCallback(
    ({ item }: { item: (typeof whisperRequests)[number] }) => (
      <View style={styles.requestItem}>
        <Avatar uri={item.from.avatarUrl} name={item.from.name} size={40} />
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{item.from.name}</Text>
          <Text style={styles.requestLabel}>wants to whisper</Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptWhisper(item.chatId)}
          >
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => handleDeclineWhisper(item.chatId)}
          >
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleAcceptWhisper, handleDeclineWhisper],
  );

  const renderChat = useCallback(
    ({ item }: { item: ActiveChat }) => (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
        activeOpacity={0.7}
      >
        <Avatar uri={item.avatarUrl} name={item.name} size={48} />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.chatTime}>
              {formatRelativeTime(item.lastMessageAt)}
            </Text>
          </View>
          <View style={styles.chatBottom}>
            <Text style={styles.chatKindBadge}>
              {getChatKindIcon(item.kind)} {getChatKindLabel(item.kind)}
            </Text>
            {item.lastMessage && (
              <Text style={styles.chatPreview} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            )}
          </View>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unreadCount > 99 ? "99+" : item.unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    [handleChatPress],
  );

  const keyExtractorChat = useCallback((item: ActiveChat) => item.id, []);
  const keyExtractorRequest = useCallback(
    (item: (typeof whisperRequests)[number]) => item.chatId,
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Next Person button */}
      <View style={styles.nextPersonBar}>
        <TouchableOpacity
          style={[
            styles.nextPersonButton,
            nextPersonSearching && styles.nextPersonButtonSearching,
          ]}
          onPress={handleNextPerson}
          disabled={nextPersonSearching}
          activeOpacity={0.7}
        >
          <Text style={styles.nextPersonIcon}>{"\u{1F3B2}"}</Text>
          <Text style={styles.nextPersonText}>
            {nextPersonSearching ? "Finding someone..." : "Meet someone new"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Whisper requests */}
      {whisperRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Whisper Requests ({whisperRequests.length})
          </Text>
          <FlatList
            data={whisperRequests}
            renderItem={renderWhisperRequest}
            keyExtractor={keyExtractorRequest}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Active chats */}
      {sortedChats.length > 0 ? (
        <FlatList
          data={sortedChats}
          renderItem={renderChat}
          keyExtractor={keyExtractorChat}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              Active Chats ({sortedChats.length})
            </Text>
          }
        />
      ) : whisperRequests.length === 0 ? (
        <EmptyState
          icon={"\u{1F4AC}"}
          title="No active chats"
          description="Start a whisper by tapping on someone in your room, or try meeting someone new with Next Person."
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  nextPersonBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  nextPersonButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  nextPersonButtonSearching: {
    borderColor: colors.primary,
    opacity: 0.7,
  },
  nextPersonIcon: {
    fontSize: 20,
  },
  nextPersonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
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
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 12,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
  requestLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 1,
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
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    color: colors.textMuted,
    fontSize: 12,
  },
  chatBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  chatKindBadge: {
    color: colors.textMuted,
    fontSize: 11,
  },
  chatPreview: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
});
