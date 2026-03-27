import type { ReactionType } from "@nonley/types";
import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { colors } from "../theme/colors";

interface ReactionBarProps {
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
}

interface ReactionConfig {
  type: ReactionType;
  emoji: string;
  label: string;
}

const REACTIONS: ReactionConfig[] = [
  { type: "wave", emoji: "\u{1F44B}", label: "Wave" },
  { type: "nod", emoji: "\u{1F44D}", label: "Nod" },
  { type: "lightbulb", emoji: "\u{1F4A1}", label: "Idea" },
  { type: "question", emoji: "\u2753", label: "Question" },
  { type: "fire", emoji: "\u{1F525}", label: "Fire" },
];

function ReactionBarInner({
  onReact,
  disabled = false,
}: ReactionBarProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {REACTIONS.map((reaction) => (
        <TouchableOpacity
          key={reaction.type}
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={() => onReact(reaction.type)}
          disabled={disabled}
          activeOpacity={0.6}
        >
          <Text style={styles.emoji}>{reaction.emoji}</Text>
          <Text style={[styles.label, disabled && styles.labelDisabled]}>
            {reaction.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const ReactionBar = memo(ReactionBarInner);
export default ReactionBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 16,
  },
  button: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  labelDisabled: {
    color: colors.border,
  },
});
