import { render } from "preact";
import { useState, useEffect } from "preact/hooks";

const APP_URL = "http://localhost:3000";

interface PopupState {
  loading: boolean;
  authed: boolean;
  connected: boolean;
  focusMode: boolean;
  currentTab: { tabId: number; roomHash: string } | null;
}

function Popup() {
  const [state, setState] = useState<PopupState>({
    loading: true,
    authed: false,
    connected: false,
    focusMode: false,
    currentTab: null,
  });

  useEffect(() => {
    chrome.storage.local.get(["authToken", "focusMode"], (result) => {
      const authed = !!result.authToken;
      const focusMode = !!result.focusMode;

      chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
        setState({
          loading: false,
          authed,
          connected: response?.connected ?? false,
          focusMode,
          currentTab: response?.currentTab ?? null,
        });
      });
    });
  }, []);

  if (state.loading) {
    return (
      <div style={styles.container}>
        <p style={styles.brand}>nonley</p>
        <p style={{ color: "#a3a3a3", fontSize: "13px", marginTop: "12px" }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!state.authed) {
    return (
      <div style={styles.container}>
        <p style={styles.brand}>nonley</p>
        <p style={{ fontSize: "14px", color: "#171717", marginBottom: "4px" }}>
          Sign in to get started
        </p>
        <p
          style={{
            fontSize: "12px",
            color: "#a3a3a3",
            marginBottom: "16px",
          }}
        >
          See who else is on the same page as you.
        </p>
        <button
          onClick={() => chrome.tabs.create({ url: `${APP_URL}/login` })}
          style={styles.btnPrimary}
        >
          Sign in to Nonley
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <p style={styles.brand}>nonley</p>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            color: state.connected ? "#16a34a" : "#a3a3a3",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: state.connected ? "#16a34a" : "#d4d4d4",
            }}
          />
          {state.connected ? "Connected" : "Offline"}
        </span>
      </div>

      {/* Focus Mode Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 0",
          borderBottom: "1px solid #e5e5e5",
          marginBottom: "12px",
        }}
      >
        <div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#171717" }}>
            Focus Mode
          </div>
          <div style={{ fontSize: "11px", color: "#a3a3a3" }}>
            Hides all Nonley UI
          </div>
        </div>
        <button
          onClick={() => {
            const newFocus = !state.focusMode;
            chrome.runtime.sendMessage({
              type: "TOGGLE_FOCUS",
              enabled: newFocus,
            });
            chrome.storage.local.set({ focusMode: newFocus });
            setState((s) => ({ ...s, focusMode: newFocus }));
          }}
          style={{
            width: "36px",
            height: "20px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            background: state.focusMode ? "#171717" : "#e5e5e5",
            position: "relative",
            transition: "background 200ms",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "2px",
              left: state.focusMode ? "18px" : "2px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "white",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              transition: "left 200ms",
            }}
          />
        </button>
      </div>

      <div style={{ fontSize: "11px", color: "#a3a3a3", marginBottom: "12px" }}>
        Press{" "}
        <kbd
          style={{
            background: "#f5f5f5",
            border: "1px solid #e5e5e5",
            padding: "1px 5px",
            borderRadius: "3px",
            fontSize: "10px",
            color: "#525252",
          }}
        >
          Ctrl+Shift+F
        </kbd>{" "}
        to toggle focus mode from any page.
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          borderTop: "1px solid #e5e5e5",
          paddingTop: "12px",
        }}
      >
        <button
          onClick={() => chrome.tabs.create({ url: APP_URL })}
          style={styles.btnOutline}
        >
          Open Dashboard
        </button>
        <button
          onClick={() => chrome.tabs.create({ url: `${APP_URL}/settings` })}
          style={styles.btnOutline}
        >
          Settings
        </button>
        <button
          onClick={() => {
            chrome.storage.local.remove(["authToken"]);
            setState((s) => ({ ...s, authed: false }));
          }}
          style={{
            ...styles.btnOutline,
            color: "#ef4444",
            borderColor: "#fecaca",
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    textAlign: "center" as const,
  },
  brand: {
    fontSize: "13px",
    fontWeight: "500",
    textTransform: "uppercase" as const,
    letterSpacing: "0.15em",
    color: "#a3a3a3",
    margin: "0 0 12px 0",
  },
  btnPrimary: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    background: "#171717",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  } as Record<string, string>,
  btnOutline: {
    width: "100%",
    padding: "8px",
    borderRadius: "8px",
    background: "white",
    color: "#525252",
    border: "1px solid #e5e5e5",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
  } as Record<string, string>,
};

render(<Popup />, document.getElementById("app")!);
