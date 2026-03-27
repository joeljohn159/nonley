import { CHAT } from "@nonley/config";
import type { RoomChatMessage } from "@nonley/types";
import { useLocalSearchParams, Stack } from "expo-router";
import React, {
  useCallback,
  useState,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";

import ChatBubble from "../../src/components/ChatBubble";
import EmptyState from "../../src/components/EmptyState";
import * as api from "../../src/lib/api";
import { usePresenceClient } from "../../src/lib/presence";
import { useAuthStore } from "../../src/stores/auth";
import { useChatStore } from "../../src/stores/chat";
import { colors } from "../../src/theme/colors";

export default function ChatDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = id ?? "";

  const messages = useChatStore((s) => s.messages[chatId] ?? []);
  const activeChat = useChatStore((s) =>
    s.activeChats.find((c) => c.id === chatId),
  );
  const markChatRead = useChatStore((s) => s.markChatRead);
  const userId = useAuthStore((s) => s.user?.id);
  const client = usePresenceClient();

  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList<RoomChatMessage>>(null);

  const chatKind = activeChat?.kind ?? "whisper";
  const chatName = activeChat?.name ?? "Chat";

  // Mark as read on mount
  useEffect(() => {
    markChatRead(chatId);
  }, [chatId, markChatRead]);

  // Load friend messages if this is a friend chat
  useEffect(() => {
    if (chatKind === "friend") {
      api
        .fetchFriendMessages(chatId)
        .then((friendMessages) => {
          const chatStore = useChatStore.getState();
          for (const msg of friendMessages) {
            chatStore.addMessage(chatId, {
              id: msg.id,
              chatId: msg.friendshipId,
              senderId: msg.senderId,
              senderName: msg.senderName,
              senderAvatar: msg.senderAvatar,
              content: msg.content,
              createdAt: msg.createdAt,
            });
          }
        })
        .catch(() => {
          // Failed to load messages; user will see empty state
        });
    }
  }, [chatId, chatKind]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    if (text.length > CHAT.MAX_MESSAGE_LENGTH) {
      return;
    }

    setSending(true);
    setInputText("");

    try {
      switch (chatKind) {
        case "whisper":
          client?.sendWhisper(chatId, text);
          break;
        case "group":
          client?.sendGroupChat(chatId, text);
          break;
        case "friend":
          await api.sendFriendMessage(chatId, text);
          break;
        case "next_person":
          client?.sendWhisper(chatId, text);
          break;
      }
    } catch {
      // Message failed to send - restore input
      setInputText(text);
    } finally {
      setSending(false);
    }
  }, [inputText, sending, chatKind, chatId, client]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB;
    });
  }, [messages]);

  const renderMessage = useCallback(
    ({ item, index }: { item: RoomChatMessage; index: number }) => {
      const isMine = item.senderId === userId;
      const previousMessage = index > 0 ? sortedMessages[index - 1] : undefined;
      const showSender =
        !isMine &&
        (!previousMessage || previousMessage.senderId !== item.senderId);

      return (
        <ChatBubble
          content={item.content}
          senderName={item.senderName}
          senderAvatar={item.senderAvatar}
          isMine={isMine}
          timestamp={item.createdAt}
          showSender={showSender}
        />
      );
    },
    [userId, sortedMessages],
  );

  const keyExtractor = useCallback((item: RoomChatMessage) => item.id, []);

  const characterCount = inputText.length;
  const isOverLimit = characterCount > CHAT.MAX_MESSAGE_LENGTH;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: chatName,
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {/* Chat kind indicator */}
          <View style={styles.chatKindBar}>
            <Text style={styles.chatKindText}>
              {chatKind === "whisper"
                ? "\u{1F4AD} Whisper — private, ephemeral"
                : chatKind === "group"
                  ? "\u{1F465} Group Chat"
                  : chatKind === "next_person"
                    ? "\u{1F3B2} Next Person — meet someone new"
                    : "\u{1F49C} Friend Chat"}
            </Text>
          </View>

          {/* Messages */}
          {sortedMessages.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={sortedMessages}
              renderItem={renderMessage}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
            />
          ) : (
            <EmptyState
              icon={"\u{1F44B}"}
              title="Start the conversation"
              description="Say something! Messages in whispers and groups are ephemeral and disappear after 24 hours."
            />
          )}

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={CHAT.MAX_MESSAGE_LENGTH + 10}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSend}
            />
            <View style={styles.inputActions}>
              {characterCount > CHAT.MAX_MESSAGE_LENGTH * 0.8 && (
                <Text
                  style={[
                    styles.charCount,
                    isOverLimit && styles.charCountOver,
                  ]}
                >
                  {characterCount}/{CHAT.MAX_MESSAGE_LENGTH}
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isOverLimit || sending) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isOverLimit || sending}
              >
                <Text style={styles.sendButtonText}>
                  {sending ? "..." : "\u{2191}"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  chatKindBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatKindText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  messageList: {
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  charCount: {
    color: colors.textMuted,
    fontSize: 10,
  },
  charCountOver: {
    color: colors.danger,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceElevated,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
});
