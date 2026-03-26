import type { RoomPresence, Reaction, ReactionType } from "@nonley/types";

// --- Utilities ---
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    return parsed.href;
  } catch {
    return "";
  }
}

// --- Shadow DOM setup ---
if (!document.getElementById("nonley-host")) {
  const host = document.createElement("div");
  host.id = "nonley-host";
  host.style.cssText =
    "position:fixed;bottom:16px;right:16px;z-index:2147483647;";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .bubble { display:flex; align-items:center; gap:8px; height:40px; padding:0 12px; border-radius:20px; border:none; cursor:pointer; font-size:14px; font-weight:500; background:#1a1a2e; color:#e0e0e0; box-shadow:0 2px 12px rgba(0,0,0,0.3); transition:all 200ms ease; font-family:inherit; }
    .bubble:hover { box-shadow:0 4px 20px rgba(0,0,0,0.4); }
    .bubble.empty { opacity:0.5; background:#2a2a3e; color:#666; }
    .dot { width:8px; height:8px; border-radius:50%; background:#4ade80; transition:background 300ms ease; }
    .dot.inactive { background:#666; }
    .panel { position:absolute; bottom:48px; right:0; width:320px; max-height:400px; border-radius:12px; background:#1a1a2e; color:#e0e0e0; box-shadow:0 4px 24px rgba(0,0,0,0.4); overflow:hidden; display:none; flex-direction:column; font-family:inherit; }
    .panel.open { display:flex; }
    .panel-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid #2a2a3e; font-size:13px; font-weight:600; }
    .close-btn { background:none; border:none; color:#e0e0e0; cursor:pointer; font-size:18px; padding:4px; }
    .panel-body { flex:1; overflow-y:auto; padding:8px 0; }
    .section-title { padding:4px 16px; font-size:11px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:0.05em; }
    .user-row { display:flex; align-items:center; padding:6px 16px; gap:10px; cursor:pointer; transition:background 150ms ease; }
    .user-row:hover { background:rgba(255,255,255,0.03); }
    .avatar { width:28px; height:28px; border-radius:50%; background:#3a3a5e; background-size:cover; flex-shrink:0; }
    .user-name { flex:1; font-size:13px; font-weight:500; }
    .wave-btn { background:none; border:none; cursor:pointer; font-size:16px; padding:2px; opacity:0.7; transition:opacity 150ms; }
    .wave-btn:hover { opacity:1; }
    .crowd-text { padding:8px 16px; font-size:12px; color:#888; }
    .reaction-bar { display:flex; gap:2px; padding:6px 16px; border-top:1px solid #2a2a3e; }
    .reaction-btn { flex:1; padding:6px; background:none; border:none; border-radius:6px; cursor:pointer; font-size:15px; opacity:0.7; transition:all 150ms; }
    .reaction-btn:hover { opacity:1; background:rgba(255,255,255,0.05); }
    .reaction-btn:disabled { opacity:0.3; cursor:not-allowed; }
    .reaction-float { position:absolute; bottom:48px; right:8px; font-size:20px; pointer-events:none; opacity:1; transition:opacity 500ms ease, transform 3s ease; }
    .reaction-float.fade { opacity:0; transform:translateY(-40px); }
    .focus-indicator { padding:8px 16px; font-size:11px; color:#818cf8; text-align:center; }
    .hidden { display:none !important; }
  `;
  shadow.appendChild(style);

  const container = document.createElement("div");
  shadow.appendChild(container);

  // --- State ---
  const state: {
    isOpen: boolean;
    focusMode: boolean;
    room: RoomPresence | null;
    reactionCooldown: boolean;
  } = { isOpen: false, focusMode: false, room: null, reactionCooldown: false };

  const REACTIONS: Array<{ type: ReactionType; icon: string; label: string }> =
    [
      { type: "wave", icon: "\u{1F44B}", label: "Wave" },
      { type: "nod", icon: "\u2713", label: "Nod" },
      { type: "lightbulb", icon: "\u{1F4A1}", label: "Interesting" },
      { type: "question", icon: "\u2753", label: "Confused" },
      { type: "fire", icon: "\u{1F525}", label: "Great" },
    ];

  const render = () => {
    if (state.focusMode) {
      container.innerHTML = "";
      return;
    }

    const count = state.room?.totalCount ?? 0;
    const ring1 = state.room?.ring1 ?? [];
    const ring2 = state.room?.ring2 ?? [];
    const ring3 = state.room?.ring3Count ?? 0;

    container.innerHTML = `
      <div class="panel ${state.isOpen ? "open" : ""}">
        <div class="panel-header">
          <span>${count} ${count === 1 ? "person" : "people"} here</span>
          <button class="close-btn" aria-label="Close panel">\u00D7</button>
        </div>
        <div class="panel-body">
          ${
            ring1.length > 0
              ? `
            <div class="section-title">Your People</div>
            ${ring1.map((u) => userRow(u)).join("")}
          `
              : ""
          }
          ${
            ring2.length > 0
              ? `
            <div class="section-title">Neighbors</div>
            ${ring2.map((u) => userRow(u)).join("")}
          `
              : ""
          }
          ${ring3 > 0 ? `<div class="crowd-text">+${ring3} others browsing this page</div>` : ""}
        </div>
        <div class="reaction-bar">
          ${REACTIONS.map((r) => `<button class="reaction-btn" data-type="${r.type}" title="${r.label}" aria-label="${r.label}" ${state.reactionCooldown ? "disabled" : ""}>${r.icon}</button>`).join("")}
        </div>
      </div>
      <button class="bubble ${count === 0 ? "empty" : ""}" aria-label="${count} people here">
        <span class="dot ${count === 0 ? "inactive" : ""}"></span>
        <span>${count}</span>
      </button>
    `;

    // Bind events
    container.querySelector(".bubble")?.addEventListener("click", () => {
      state.isOpen = !state.isOpen;
      render();
    });
    container.querySelector(".close-btn")?.addEventListener("click", () => {
      state.isOpen = false;
      render();
    });

    container.querySelectorAll(".wave-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const uid = (btn as HTMLElement).dataset.uid;
        if (uid) {
          chrome.runtime.sendMessage({
            type: "SEND_REACTION",
            reactionType: "wave",
            toUserId: uid,
          });
        }
      });
    });

    container.querySelectorAll(".reaction-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = (btn as HTMLElement).dataset.type as ReactionType;
        if (type && !state.reactionCooldown) {
          chrome.runtime.sendMessage({
            type: "SEND_REACTION",
            reactionType: type,
            toUserId: "",
          });
          state.reactionCooldown = true;
          render();
          setTimeout(() => {
            state.reactionCooldown = false;
            render();
          }, 10000);
        }
      });
    });
  };

  const userRow = (u: {
    userId: string;
    name: string | null;
    avatarUrl: string | null;
  }): string => {
    const safeName = escapeHtml(u.name || "Anonymous");
    const safeAvatar = u.avatarUrl ? sanitizeImageUrl(u.avatarUrl) : "";
    return `
      <div class="user-row" role="button" tabindex="0">
        <div class="avatar" ${safeAvatar ? `style="background-image:url('${safeAvatar}')"` : ""}></div>
        <span class="user-name">${safeName}</span>
        <button class="wave-btn" data-uid="${escapeHtml(u.userId)}" aria-label="Wave at ${safeName}">\u{1F44B}</button>
      </div>
    `;
  };

  const showReactionFloat = (reaction: Reaction) => {
    const icons: Record<string, string> = {
      wave: "\u{1F44B}",
      nod: "\u2713",
      lightbulb: "\u{1F4A1}",
      question: "\u2753",
      fire: "\u{1F525}",
    };
    const el = document.createElement("span");
    el.className = "reaction-float";
    el.textContent = icons[reaction.type] ?? "\u{1F44B}";
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add("fade"));
    setTimeout(() => el.remove(), 3000);
  };

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "PRESENCE_UPDATE") {
      state.room = message.room;
      render();
    }
    if (message.type === "REACTION") {
      showReactionFloat(message.reaction);
    }
  });

  // Notify background of current URL
  chrome.runtime.sendMessage({
    type: "TAB_URL_CHANGED",
    url: window.location.href,
  });

  // SPA navigation detection
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      chrome.runtime.sendMessage({ type: "TAB_URL_CHANGED", url: lastUrl });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Also listen for popstate (back/forward)
  window.addEventListener("popstate", () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      chrome.runtime.sendMessage({ type: "TAB_URL_CHANGED", url: lastUrl });
    }
  });

  // Page unload - notify background
  window.addEventListener("pagehide", () => {
    chrome.runtime.sendMessage({ type: "PAGE_UNLOAD" });
  });

  // Focus mode keyboard shortcut
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "F") {
      e.preventDefault();
      state.focusMode = !state.focusMode;
      chrome.runtime.sendMessage({
        type: "TOGGLE_FOCUS",
        enabled: state.focusMode,
      });
      render();
    }
  });

  // Load focus mode from storage
  chrome.storage.local.get(["focusMode"], (result) => {
    if (result.focusMode) {
      state.focusMode = true;
      render();
    }
  });

  render();
}
