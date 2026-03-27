import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";

import LoadingState from "../../src/components/LoadingState";
import { useAuthStore } from "../../src/stores/auth";
import { colors } from "../../src/theme/colors";

WebBrowser.maybeCompleteAuthSession();

function getApiUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
}

export default function LoginScreen(): React.JSX.Element {
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [showEmailSent, setShowEmailSent] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "nonley",
    path: "auth/callback",
  });

  const handleOAuthLogin = useCallback(
    async (provider: "google" | "github") => {
      try {
        setLoading(true);

        const apiUrl = getApiUrl();
        const authUrl = `${apiUrl}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(redirectUri)}`;

        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectUri,
        );

        if (result.type === "success" && result.url) {
          const url = new URL(result.url);
          const token = url.searchParams.get("token");
          const userId = url.searchParams.get("userId");
          const userName = url.searchParams.get("name");
          const userEmail = url.searchParams.get("email");
          const userAvatar = url.searchParams.get("avatar");

          if (token && userId && userEmail) {
            await login(token, {
              id: userId,
              email: userEmail,
              name: userName,
              avatarUrl: userAvatar,
            });
          } else {
            Alert.alert(
              "Login Failed",
              "Could not complete authentication. Please try again.",
            );
          }
        }
      } catch (error) {
        Alert.alert(
          "Login Error",
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        );
      } finally {
        setLoading(false);
      }
    },
    [login, redirectUri],
  );

  const handleEmailLogin = useCallback(async () => {
    const trimmed = emailInput.trim();
    if (!trimmed || !trimmed.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const apiUrl = getApiUrl();

      const response = await fetch(`${apiUrl}/api/auth/signin/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          callbackUrl: redirectUri,
        }),
      });

      if (response.ok) {
        setShowEmailSent(true);
      } else {
        Alert.alert("Error", "Could not send magic link. Please try again.");
      }
    } catch {
      Alert.alert(
        "Network Error",
        "Could not reach the server. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  }, [emailInput, redirectUri]);

  if (loading) {
    return <LoadingState message="Signing in..." />;
  }

  if (showEmailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.checkIcon}>{"\u{2709}\u{FE0F}"}</Text>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a magic link to {emailInput}. Tap the link in the email to
            sign in.
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowEmailSent(false)}
          >
            <Text style={styles.secondaryButtonText}>Use different email</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>nonley</Text>
          <Text style={styles.tagline}>You are not alone on the internet.</Text>
        </View>

        <View style={styles.description}>
          <Text style={styles.descriptionText}>
            See who else is on the same page, song, or video right now. Say hi.
            Make friends. Or just vibe together.
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => handleOAuthLogin("google")}
            activeOpacity={0.8}
          >
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.githubButton}
            onPress={() => handleOAuthLogin("github")}
            activeOpacity={0.8}
          >
            <Text style={styles.githubButtonText}>Continue with GitHub</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.emailContainer}>
            <Text style={styles.emailInputLabel}>Email</Text>
            <TextInput
              style={styles.emailInput}
              placeholder="Enter your email address"
              placeholderTextColor={colors.textMuted}
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleEmailLogin}
            />
            <TouchableOpacity
              style={styles.emailButton}
              onPress={handleEmailLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.emailButtonText}>Send Magic Link</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to Nonley's Terms of Service and Privacy
          Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 42,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 8,
  },
  description: {
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  descriptionText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  buttons: {
    gap: 12,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  googleButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  githubButton: {
    backgroundColor: "#333333",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  githubButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    marginHorizontal: 16,
    fontSize: 13,
  },
  emailContainer: {
    gap: 8,
  },
  emailInputLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginLeft: 4,
  },
  emailInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 15,
  },
  emailButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  emailButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "500",
  },
  checkIcon: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  terms: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 32,
    lineHeight: 16,
    paddingHorizontal: 24,
  },
});
