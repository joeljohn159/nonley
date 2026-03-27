import type { Circle } from "@nonley/types";
import { router } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
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
  Modal,
} from "react-native";

import EmptyState from "../../src/components/EmptyState";
import LoadingState from "../../src/components/LoadingState";
import * as api from "../../src/lib/api";
import { colors } from "../../src/theme/colors";

interface CircleItemProps {
  circle: Circle;
  onPress: () => void;
}

function CircleItem({ circle, onPress }: CircleItemProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={styles.circleItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.circleIconContainer}>
        <Text style={styles.circleIcon}>
          {circle.type === "url_based"
            ? "\u{1F310}"
            : circle.type === "auto_detected"
              ? "\u{2728}"
              : "\u{1F465}"}
        </Text>
      </View>
      <View style={styles.circleInfo}>
        <Text style={styles.circleName} numberOfLines={1}>
          {circle.name}
        </Text>
        {circle.description && (
          <Text style={styles.circleDescription} numberOfLines={2}>
            {circle.description}
          </Text>
        )}
        <View style={styles.circleMeta}>
          <Text style={styles.circleType}>
            {circle.isPublic ? "Public" : "Private"}
          </Text>
          <Text style={styles.circleTypeSeparator}>{" \u2022 "}</Text>
          <Text style={styles.circleType}>{circle.type.replace("_", " ")}</Text>
        </View>
      </View>
      <Text style={styles.circleArrow}>{"\u203A"}</Text>
    </TouchableOpacity>
  );
}

export default function CirclesScreen(): React.JSX.Element {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleDescription, setNewCircleDescription] = useState("");
  const [newCirclePublic, setNewCirclePublic] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadCircles = useCallback(async () => {
    try {
      setError(null);
      const data = await api.fetchCircles();
      setCircles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load circles");
    }
  }, []);

  useEffect(() => {
    loadCircles().finally(() => setIsLoading(false));
  }, [loadCircles]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCircles();
    setRefreshing(false);
  }, [loadCircles]);

  const handleCreateCircle = useCallback(async () => {
    const name = newCircleName.trim();
    if (!name) {
      Alert.alert("Missing Name", "Please enter a name for the circle.");
      return;
    }

    setCreating(true);
    try {
      const circle = await api.createCircle({
        name,
        description: newCircleDescription.trim() || undefined,
        isPublic: newCirclePublic,
      });
      setCircles((prev) => [circle, ...prev]);
      setShowCreate(false);
      setNewCircleName("");
      setNewCircleDescription("");
      setNewCirclePublic(true);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Could not create circle",
      );
    } finally {
      setCreating(false);
    }
  }, [newCircleName, newCircleDescription, newCirclePublic]);

  const renderCircle = useCallback(
    ({ item }: { item: Circle }) => (
      <CircleItem
        circle={item}
        onPress={() => router.push(`/circle/${item.id}`)}
      />
    ),
    [],
  );

  const keyExtractor = useCallback((item: Circle) => item.id, []);

  if (isLoading) {
    return <LoadingState message="Loading circles..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreate(true)}
        >
          <Text style={styles.createButtonText}>+ New Circle</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {circles.length > 0 ? (
        <FlatList
          data={circles}
          renderItem={renderCircle}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <EmptyState
          icon={"\u{2B55}"}
          title="No circles yet"
          description="Circles are groups of people who share interests. Create a circle or join one to connect with like-minded people."
          action={
            <TouchableOpacity
              style={styles.createAction}
              onPress={() => setShowCreate(true)}
            >
              <Text style={styles.createActionText}>Create a circle</Text>
            </TouchableOpacity>
          }
        />
      )}

      {/* Create Circle Modal */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Circle</Text>
            <TouchableOpacity onPress={handleCreateCircle} disabled={creating}>
              <Text
                style={[
                  styles.modalCreate,
                  creating && styles.modalCreateDisabled,
                ]}
              >
                {creating ? "Creating..." : "Create"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Circle name"
                placeholderTextColor={colors.textMuted}
                value={newCircleName}
                onChangeText={setNewCircleName}
                autoFocus
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="What is this circle about?"
                placeholderTextColor={colors.textMuted}
                value={newCircleDescription}
                onChangeText={setNewCircleDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Public circle</Text>
              <TouchableOpacity
                style={[styles.toggle, newCirclePublic && styles.toggleActive]}
                onPress={() => setNewCirclePublic(!newCirclePublic)}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    newCirclePublic && styles.toggleKnobActive,
                  ]}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.toggleHint}>
              {newCirclePublic
                ? "Anyone can find and join this circle"
                : "Only invited members can join"}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerActions: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "flex-end",
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  createButtonText: {
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  circleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  circleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  circleIcon: {
    fontSize: 24,
  },
  circleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  circleName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  circleDescription: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  circleMeta: {
    flexDirection: "row",
    marginTop: 4,
  },
  circleType: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: "capitalize",
  },
  circleTypeSeparator: {
    color: colors.textMuted,
    fontSize: 11,
  },
  circleArrow: {
    color: colors.textMuted,
    fontSize: 24,
    marginLeft: 8,
  },
  createAction: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createActionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    color: colors.textMuted,
    fontSize: 16,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  modalCreate: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  modalCreateDisabled: {
    opacity: 0.5,
  },
  modalBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 16,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceElevated,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
  },
  toggleKnobActive: {
    alignSelf: "flex-end",
  },
  toggleHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
