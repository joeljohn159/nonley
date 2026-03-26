import { render } from "preact";
import { useState, useEffect } from "preact/hooks";

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
      <div style={{ padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: "20px", fontWeight: "bold", color: "#818cf8" }}>
          nonley
        </div>
        <p style={{ color: "#888", fontSize: "12px", marginTop: "12px" }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!state.authed) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: "#818cf8",
            marginBottom: "8px",
          }}
        >
          nonley
        </h1>
        <p style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>
          You are never alone on the internet.
        </p>
        <button
          onClick={() =>
            chrome.tabs.create({ url: "https://nonley.com/login" })
          }
          style={btnPrimary}
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
          marginBottom: "12px",
        }}
      >
        <h1 style={{ fontSize: "16px", fontWeight: "bold", color: "#818cf8" }}>
          nonley
        </h1>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            color: state.connected ? "#4ade80" : "#888",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: state.connected ? "#4ade80" : "#666",
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
          padding: "10px 0",
          borderBottom: "1px solid #2a2a3e",
          marginBottom: "10px",
        }}
      >
        <div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#e0e0e0" }}>
            Focus Mode
          </div>
          <div style={{ fontSize: "11px", color: "#888" }}>
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
            width: "40px",
            height: "22px",
            borderRadius: "11px",
            border: "none",
            cursor: "pointer",
            background: state.focusMode ? "#818cf8" : "#2a2a3e",
            position: "relative",
            transition: "background 200ms",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "2px",
              left: state.focusMode ? "20px" : "2px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "white",
              transition: "left 200ms",
            }}
          />
        </button>
      </div>

      <div style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}>
        <p>
          Press{" "}
          <kbd
            style={{
              background: "#2a2a3e",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "11px",
            }}
          >
            Ctrl+Shift+F
          </kbd>{" "}
          to toggle focus mode from any page.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          borderTop: "1px solid #2a2a3e",
          paddingTop: "12px",
        }}
      >
        <button
          onClick={() => chrome.tabs.create({ url: "https://nonley.com" })}
          style={btnOutline}
        >
          Open Dashboard
        </button>
        <button
          onClick={() =>
            chrome.tabs.create({ url: "https://nonley.com/settings" })
          }
          style={btnOutline}
        >
          Settings
        </button>
        <button
          onClick={() => {
            chrome.storage.local.remove(["authToken"]);
            setState((s) => ({ ...s, authed: false }));
          }}
          style={{
            ...btnOutline,
            color: "#f87171",
            borderColor: "rgba(248,113,113,0.3)",
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

const btnPrimary: Record<string, string> = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  background: "#818cf8",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "500",
};

const btnOutline: Record<string, string> = {
  width: "100%",
  padding: "8px",
  borderRadius: "8px",
  background: "transparent",
  color: "#818cf8",
  border: "1px solid #2a2a3e",
  cursor: "pointer",
  fontSize: "12px",
};

render(<Popup />, document.getElementById("app")!);
