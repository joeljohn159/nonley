import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { colors } from "../theme/colors";

import Avatar from "./Avatar";

interface ChatBubbleProps {
  content: string;
  senderName: string;
  senderAvatar: string;
  isMine: boolean;
  timestamp: Date;
  showSender?: boolean;
}

function formatTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

function ChatBubbleInner({
  content,
  senderName,
  senderAvatar,
  isMine,
  timestamp,
  showSender = true,
}: ChatBubbleProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.wrapper,
        isMine ? styles.wrapperMine : styles.wrapperTheirs,
      ]}
    >
      {!isMine && showSender && (
        <View style={styles.avatarContainer}>
          <Avatar uri={senderAvatar} name={senderName} size={28} />
        </View>
      )}
      <View style={styles.bubbleColumn}>
        {!isMine && showSender && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
          ]}
        >
          <Text
            style={[
              styles.content,
              isMine ? styles.contentMine : styles.contentTheirs,
            ]}
          >
            {content}
          </Text>
        </View>
        <Text
          style={[
            styles.timestamp,
            isMine ? styles.timestampMine : styles.timestampTheirs,
          ]}
        >
          {formatTime(timestamp)}
        </Text>
      </View>
    </View>
  );
}

const ChatBubble = memo(ChatBubbleInner);
export default ChatBubble;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  wrapperMine: {
    justifyContent: "flex-end",
  },
  wrapperTheirs: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: "flex-end",
    marginBottom: 16,
  },
  bubbleColumn: {
    maxWidth: "75%",
  },
  senderName: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 2,
    marginLeft: 8,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.surfaceElevated,
    borderBottomLeftRadius: 4,
  },
  content: {
    fontSize: 15,
    lineHeight: 20,
  },
  contentMine: {
    color: colors.white,
  },
  contentTheirs: {
    color: colors.text,
  },
  timestamp: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  timestampMine: {
    textAlign: "right",
    marginRight: 4,
  },
  timestampTheirs: {
    textAlign: "left",
    marginLeft: 8,
  },
});
