import type { PrivacyLevel } from "@nonley/types";
import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
} from "react-native";

import Avatar from "../../src/components/Avatar";
import * as api from "../../src/lib/api";
import { usePresenceClient } from "../../src/lib/presence";
import { useAuthStore } from "../../src/stores/auth";
import { usePresenceStore } from "../../src/stores/presence";
import { colors } from "../../src/theme/colors";

const PRIVACY_OPTIONS: Array<{
  value: PrivacyLevel;
  label: string;
  description: string;
}> = [
  {
    value: "open",
    label: "Open",
    description: "Everyone can see you",
  },
  {
    value: "circles_only",
    label: "Circles Only",
    description: "Only your circle members can see you",
  },
  {
    value: "anonymous",
    label: "Anonymous",
    description: "Visible but without identity",
  },
  {
    value: "ghost",
    label: "Ghost",
    description: "Completely invisible to everyone",
  },
];

export default function ProfileScreen(): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const focusMode = usePresenceStore((s) => s.focusMode);
  const setFocusMode = usePresenceStore((s) => s.setFocusMode);
  const client = usePresenceClient();

  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>("open");
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    // Load settings from server
    api
      .fetchSettings()
      .then((settings) => {
        setPrivacyLevel(settings.privacyDefault);
        setFocusMode(settings.focusMode);
      })
      .catch(() => {
        // Use defaults
      });
  }, [setFocusMode]);

  const handlePrivacyChange = useCallback(
    async (level: PrivacyLevel) => {
      setSavingPrivacy(true);
      const previousLevel = privacyLevel;
      setPrivacyLevel(level);

      try {
        await api.updateSettings({ privacyDefault: level });
      } catch (err) {
        setPrivacyLevel(previousLevel);
        Alert.alert(
          "Error",
          err instanceof Error
            ? err.message
            : "Could not update privacy setting",
        );
      } finally {
        setSavingPrivacy(false);
      }
    },
    [privacyLevel],
  );

  const handleFocusModeToggle = useCallback(
    async (enabled: boolean) => {
      setFocusMode(enabled);
      client?.toggleFocus(enabled);

      try {
        await api.updateSettings({ focusMode: enabled });
      } catch {
        // Revert on error
        setFocusMode(!enabled);
      }
    },
    [client, setFocusMode],
  );

  const handleChangeName = useCallback(() => {
    setNameInput(user?.name ?? "");
    setShowNameModal(true);
  }, [user?.name]);

  const handleSaveName = useCallback(async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    setSavingName(true);
    try {
      await api.updateSettings({ name: trimmed });
      useAuthStore.getState().updateUser({ name: trimmed });
      setShowNameModal(false);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Could not update name",
      );
    } finally {
      setSavingName(false);
    }
  }, [nameInput]);

  const handleExportData = useCallback(async () => {
    try {
      const data = await api.exportData();
      Alert.alert(
        "Data Exported",
        `Your data has been prepared. It contains ${Object.keys(data).length} categories of information.`,
      );
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Could not export data",
      );
    }
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "This action is irreversible. All your data will be permanently deleted within 30 days. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              'Type "DELETE MY ACCOUNT" to confirm. This cannot be undone.',
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Confirm Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await api.deleteAccount();
                      await logout();
                    } catch (err) {
                      Alert.alert(
                        "Error",
                        err instanceof Error
                          ? err.message
                          : "Could not delete account",
                      );
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [logout]);

  const handleLogout = useCallback(() => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: logout,
      },
    ]);
  }, [logout]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User info */}
        <View style={styles.userSection}>
          <Avatar
            uri={user?.avatarUrl ?? null}
            name={user?.name ?? null}
            size={80}
          />
          <Text style={styles.userName}>{user?.name ?? "Anonymous"}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ""}</Text>
          <TouchableOpacity
            style={styles.changeNameButton}
            onPress={handleChangeName}
            disabled={savingName}
          >
            <Text style={styles.changeNameText}>
              {savingName ? "Saving..." : "Change name"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Privacy setting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Privacy</Text>
          <Text style={styles.sectionDescription}>
            This controls how you appear to others by default.
          </Text>
          {PRIVACY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.privacyOption,
                privacyLevel === option.value && styles.privacyOptionSelected,
              ]}
              onPress={() => handlePrivacyChange(option.value)}
              disabled={savingPrivacy}
            >
              <View style={styles.privacyOptionContent}>
                <View style={styles.privacyRadio}>
                  {privacyLevel === option.value && (
                    <View style={styles.privacyRadioDot} />
                  )}
                </View>
                <View style={styles.privacyOptionText}>
                  <Text style={styles.privacyLabel}>{option.label}</Text>
                  <Text style={styles.privacyDescription}>
                    {option.description}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Focus mode */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{"\u{1F9D8}"} Focus Mode</Text>
              <Text style={styles.settingDescription}>
                Pause Nonley. You become invisible and won't receive
                notifications.
              </Text>
            </View>
            <Switch
              value={focusMode}
              onValueChange={handleFocusModeToggle}
              trackColor={{
                false: colors.surfaceElevated,
                true: colors.primary,
              }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportData}
          >
            <Text style={styles.actionButtonText}>Export my data</Text>
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Nonley v1.0.0</Text>
          <Text style={styles.footerText}>You are not alone.</Text>
        </View>
      </ScrollView>

      {/* Change Name Modal */}
      <Modal
        visible={showNameModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNameModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Name</Text>
            <TouchableOpacity onPress={handleSaveName} disabled={savingName}>
              <Text
                style={[
                  styles.modalSave,
                  savingName && styles.modalSaveDisabled,
                ]}
              >
                {savingName ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.modalInputLabel}>Display Name</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              placeholderTextColor={colors.textMuted}
              autoFocus
              maxLength={50}
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
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
  scrollContent: {
    paddingBottom: 48,
  },
  userSection: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
  },
  userEmail: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  changeNameButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeNameText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionDescription: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 16,
  },
  privacyOption: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  privacyOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  privacyOptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  privacyRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  privacyRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  privacyOptionText: {
    flex: 1,
  },
  privacyLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
  privacyDescription: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  settingDescription: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "500",
  },
  dangerTitle: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  logoutText: {
    color: colors.warning,
    fontSize: 15,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: 8,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 4,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
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
  modalSave: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalBody: {
    padding: 16,
  },
  modalInputLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
    marginLeft: 4,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
});
