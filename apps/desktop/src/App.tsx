/**
 * Root component with tab-based navigation.
 * Manages app detection, presence connection, and view switching.
 */

import { useState, useEffect, useCallback } from "react";

import CallOverlay from "./components/CallOverlay";
import FriendsSidebar from "./components/FriendsSidebar";
import LoginView from "./components/LoginView";
import PresencePanel from "./components/PresencePanel";
import Settings from "./components/Settings";
import TitleBar from "./components/TitleBar";
import { usePresence } from "./lib/presence";
import { onActiveAppChanged, onTrayFocusToggle } from "./lib/tauri";
import { useAppDetectionStore } from "./stores/app-detection";
import { useAuthStore } from "./stores/auth";
import { usePresenceStore } from "./stores/presence";

type Tab = "presence" | "friends" | "settings";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("presence");

  const user = useAuthStore((s) => s.user);
  const wsToken = useAuthStore((s) => s.wsToken);
  const loading = useAuthStore((s) => s.loading);
  const initialize = useAuthStore((s) => s.initialize);

  const focusMode = usePresenceStore((s) => s.focusMode);
  const setFocusMode = usePresenceStore((s) => s.setFocusMode);
  const activeCall = usePresenceStore((s) => s.activeCall);

  const setActiveApp = useAppDetectionStore((s) => s.setActiveApp);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Listen for active app changes from Tauri backend
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    onActiveAppChanged((appName) => {
      setActiveApp(appName);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [setActiveApp]);

  // Listen for tray focus toggle
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    onTrayFocusToggle(() => {
      setFocusMode(!focusMode);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [focusMode, setFocusMode]);

  const {
    joinRoom,
    leaveRoom,
    sendReaction,
    toggleFocus,
    sendFriendMessage,
    acceptCall,
    declineCall,
    endCall,
  } = usePresence({
    wsToken,
    enabled: !!user && !focusMode,
  });

  const handleToggleFocus = useCallback(
    (enabled: boolean) => {
      toggleFocus(enabled);
    },
    [toggleFocus],
  );

  // Loading screen
  if (loading) {
    return (
      <div className="bg-nonley-bg flex h-screen flex-col">
        <TitleBar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="border-nonley-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
            <p className="text-nonley-muted text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="bg-nonley-bg flex h-screen flex-col">
        <TitleBar />
        <div className="flex-1">
          <LoginView />
        </div>
      </div>
    );
  }

  // Focus mode screen
  if (focusMode) {
    return (
      <div className="bg-nonley-bg flex h-screen flex-col">
        <TitleBar />
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-4 text-4xl">🧘</div>
          <h2 className="text-nonley-text mb-1 text-lg font-medium">
            Focus Mode
          </h2>
          <p className="text-nonley-muted mb-6 text-sm">
            All presence is paused. You&apos;re invisible to others.
          </p>
          <button
            onClick={() => {
              setFocusMode(false);
              toggleFocus(false);
            }}
            className="bg-nonley-primary hover:bg-nonley-primary/90 rounded-lg px-4 py-2 text-sm text-white transition-colors"
          >
            Exit Focus Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-nonley-bg flex h-screen flex-col">
      <TitleBar />

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "presence" && (
          <PresencePanel
            joinRoom={joinRoom}
            leaveRoom={leaveRoom}
            sendReaction={sendReaction}
          />
        )}
        {activeTab === "friends" && (
          <FriendsSidebar sendFriendMessage={sendFriendMessage} />
        )}
        {activeTab === "settings" && (
          <Settings toggleFocus={handleToggleFocus} />
        )}
      </div>

      {/* Bottom tab bar */}
      <nav className="border-nonley-border bg-nonley-surface flex border-t">
        <TabButton
          active={activeTab === "presence"}
          onClick={() => setActiveTab("presence")}
          label="Presence"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          }
        />
        <TabButton
          active={activeTab === "friends"}
          onClick={() => setActiveTab("friends")}
          label="Friends"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <TabButton
          active={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
          label="Settings"
          icon={
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          }
        />
      </nav>

      {/* Call overlay */}
      {activeCall && (
        <CallOverlay
          acceptCall={acceptCall}
          declineCall={declineCall}
          endCall={endCall}
        />
      )}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

function TabButton({ active, onClick, label, icon }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
        active
          ? "text-nonley-primary"
          : "text-nonley-muted hover:text-nonley-text"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      {label}
    </button>
  );
}

export default App;
