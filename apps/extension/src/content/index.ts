import type {
  RoomPresence,
  Reaction,
  ReactionType,
  RoomChatMessage,
  GroupChatInfo,
  ChatLimitsInfo,
} from "@nonley/types";

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

// --- Auth bridge: detect login on Nonley web app ---
const NONLEY_ORIGINS = [
  "http://localhost:3000",
  "https://nonley.com",
  "https://www.nonley.com",
];

if (NONLEY_ORIGINS.includes(window.location.origin)) {
  fetch(`${window.location.origin}/api/ws-token`, {
    method: "POST",
    credentials: "include",
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((res) => {
      if (res?.data?.token) {
        chrome.storage.local.set({
          authToken: res.data.token,
          wsUrl: "ws://localhost:3001",
        });
      }
    })
    .catch(() => {});
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
    :host { all: initial; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color-scheme: light; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .bubble { display:flex; align-items:center; gap:8px; height:36px; padding:0 12px; border-radius:18px; border:1px solid #e5e5e5; cursor:pointer; font-size:13px; font-weight:500; background:#fff; color:#525252; box-shadow:0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04); transition:all 200ms ease; font-family:inherit; }
    .bubble:hover { box-shadow:0 2px 8px rgba(0,0,0,0.1); border-color:#d4d4d4; }
    .bubble.empty { opacity:0.6; color:#a3a3a3; }
    .dot { width:7px; height:7px; border-radius:50%; background:#16a34a; transition:background 300ms ease; }
    .dot.inactive { background:#d4d4d4; }
    .panel { position:absolute; bottom:44px; right:0; width:340px; max-height:500px; border-radius:12px; background:#fff; color:#171717; border:1px solid #e5e5e5; box-shadow:0 4px 16px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.04); overflow:hidden; display:none; flex-direction:column; font-family:inherit; }
    .panel.open { display:flex; }
    .panel-header { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid #f5f5f5; font-size:13px; font-weight:600; color:#171717; }
    .tabs { display:flex; gap:0; border-bottom:1px solid #f5f5f5; }
    .tab { flex:1; padding:8px 0; text-align:center; font-size:11px; font-weight:500; color:#a3a3a3; background:none; border:none; cursor:pointer; border-bottom:2px solid transparent; transition:all 150ms; font-family:inherit; }
    .tab:hover { color:#525252; }
    .tab.active { color:#171717; border-bottom-color:#171717; }
    .close-btn { background:none; border:none; color:#a3a3a3; cursor:pointer; font-size:18px; padding:4px; font-family:inherit; }
    .close-btn:hover { color:#525252; }
    .panel-body { flex:1; overflow-y:auto; padding:6px 0; min-height:120px; max-height:300px; }
    .section-title { padding:4px 16px; font-size:11px; font-weight:500; color:#a3a3a3; text-transform:uppercase; letter-spacing:0.05em; }
    .user-row { display:flex; align-items:center; padding:6px 16px; gap:10px; transition:background 150ms ease; }
    .user-row:hover { background:#f5f5f5; }
    .avatar { width:28px; height:28px; border-radius:50%; background:#f5f5f5; background-size:cover; flex-shrink:0; }
    .avatar-sm { width:22px; height:22px; border-radius:50%; background:#f5f5f5; background-size:cover; flex-shrink:0; margin-top:2px; }
    .user-name { flex:1; font-size:13px; font-weight:500; color:#171717; }
    .action-btn { background:none; border:none; cursor:pointer; font-size:14px; padding:2px 4px; opacity:0.5; transition:opacity 150ms; }
    .action-btn:hover { opacity:1; }
    .crowd-text { padding:8px 16px; font-size:12px; color:#a3a3a3; }
    .reaction-bar { display:flex; gap:2px; padding:6px 16px; border-top:1px solid #f5f5f5; }
    .reaction-btn { flex:1; padding:6px; background:none; border:none; border-radius:6px; cursor:pointer; font-size:14px; opacity:0.6; transition:all 150ms; }
    .reaction-btn:hover { opacity:1; background:#f5f5f5; }
    .reaction-btn:disabled { opacity:0.2; cursor:not-allowed; }
    .reaction-float { position:absolute; bottom:44px; right:8px; font-size:20px; pointer-events:none; opacity:1; transition:opacity 500ms ease, transform 3s ease; }
    .reaction-float.fade { opacity:0; transform:translateY(-40px); }
    .hidden { display:none !important; }
    .chat-body { flex:1; overflow-y:auto; padding:8px 14px; min-height:120px; max-height:260px; display:flex; flex-direction:column; gap:6px; }
    .chat-empty { display:flex; align-items:center; justify-content:center; height:120px; font-size:12px; color:#a3a3a3; text-align:center; padding:16px; line-height:1.5; }
    .chat-msg { display:flex; gap:8px; align-items:flex-start; }
    .chat-msg-content { flex:1; min-width:0; }
    .chat-msg-name { font-size:11px; font-weight:600; color:#525252; margin-bottom:1px; }
    .chat-msg-text { font-size:13px; color:#171717; line-height:1.4; word-break:break-word; }
    .chat-msg-time { font-size:10px; color:#a3a3a3; margin-left:4px; font-weight:400; }
    .chat-input-bar { display:flex; gap:6px; padding:8px 14px; border-top:1px solid #f5f5f5; }
    .chat-input { flex:1; padding:7px 10px; border:1px solid #e5e5e5; border-radius:8px; font-size:13px; font-family:inherit; color:#171717; background:#fff; outline:none; transition:border-color 150ms; }
    .chat-input:focus { border-color:#a3a3a3; }
    .chat-input::placeholder { color:#a3a3a3; }
    .chat-send { padding:7px 12px; border:none; border-radius:8px; background:#171717; color:#fff; font-size:12px; font-weight:500; cursor:pointer; font-family:inherit; transition:opacity 150ms; }
    .chat-send:hover { opacity:0.85; }
    .chat-send:disabled { opacity:0.3; cursor:not-allowed; }
    .next-btn { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:10px; margin:0; border:none; border-radius:8px; background:#171717; color:#fff; font-size:13px; font-weight:500; cursor:pointer; font-family:inherit; transition:opacity 150ms; }
    .next-btn:hover { opacity:0.85; }
    .next-btn:disabled { opacity:0.3; cursor:not-allowed; }
    .next-section { padding:12px 16px; }
    .next-active { padding:8px 14px; display:flex; flex-direction:column; gap:8px; }
    .next-active-header { display:flex; align-items:center; gap:10px; padding:6px 0; }
    .next-active-name { flex:1; font-size:13px; font-weight:500; color:#171717; }
    .skip-btn { padding:5px 12px; border:1px solid #e5e5e5; border-radius:6px; background:#fff; color:#525252; font-size:11px; font-weight:500; cursor:pointer; font-family:inherit; transition:all 150ms; }
    .skip-btn:hover { border-color:#d4d4d4; background:#f5f5f5; }
    .limit-badge { font-size:10px; color:#a3a3a3; font-weight:400; }
    .whisper-request-card { margin:8px 16px; padding:10px 12px; border:1px solid #e5e5e5; border-radius:8px; background:#fafafa; }
    .whisper-request-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .whisper-request-name { font-size:12px; font-weight:500; color:#171717; }
    .whisper-request-text { font-size:11px; color:#a3a3a3; margin-bottom:8px; }
    .whisper-request-actions { display:flex; gap:6px; }
    .accept-btn { flex:1; padding:6px; border:none; border-radius:6px; background:#171717; color:#fff; font-size:11px; font-weight:500; cursor:pointer; font-family:inherit; }
    .decline-btn { flex:1; padding:6px; border:1px solid #e5e5e5; border-radius:6px; background:#fff; color:#525252; font-size:11px; font-weight:500; cursor:pointer; font-family:inherit; }
    .group-card { display:flex; align-items:center; padding:8px 16px; gap:10px; cursor:pointer; transition:background 150ms; }
    .group-card:hover { background:#f5f5f5; }
    .group-icon { width:28px; height:28px; border-radius:8px; background:#f0f0f0; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
    .group-info { flex:1; min-width:0; }
    .group-name { font-size:13px; font-weight:500; color:#171717; }
    .group-meta { font-size:11px; color:#a3a3a3; }
    .create-group-bar { padding:8px 16px; border-bottom:1px solid #f5f5f5; }
    .create-group-row { display:flex; gap:6px; }
    .group-name-input { flex:1; padding:7px 10px; border:1px solid #e5e5e5; border-radius:8px; font-size:12px; font-family:inherit; color:#171717; background:#fff; outline:none; }
    .group-name-input::placeholder { color:#a3a3a3; }
    .create-group-btn { padding:7px 12px; border:none; border-radius:8px; background:#171717; color:#fff; font-size:11px; font-weight:500; cursor:pointer; font-family:inherit; white-space:nowrap; }
    .toast { position:absolute; top:8px; left:50%; transform:translateX(-50%); padding:6px 14px; border-radius:6px; background:#171717; color:#fff; font-size:11px; font-weight:500; opacity:0; transition:opacity 300ms; pointer-events:none; z-index:10; }
    .toast.show { opacity:1; }
  `;
  shadow.appendChild(style);

  const container = document.createElement("div");
  shadow.appendChild(container);

  // --- Types ---
  interface ChatMsg {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    content: string;
    createdAt: Date;
  }

  interface WhisperRequestData {
    chatId: string;
    from: { userId: string; name: string; avatarUrl: string };
  }

  interface NextPersonData {
    chatId: string;
    user: { userId: string; name: string; avatarUrl: string };
    messages: ChatMsg[];
  }

  // --- State ---
  const state: {
    isOpen: boolean;
    focusMode: boolean;
    room: RoomPresence | null;
    reactionCooldown: boolean;
    activeTab: "people" | "chat" | "private" | "groups";
    chatMessages: ChatMsg[];
    // Whisper
    pendingWhisperRequest: WhisperRequestData | null;
    activeWhisper: {
      chatId: string;
      user: { userId: string; name: string; avatarUrl: string };
      messages: ChatMsg[];
    } | null;
    // Next person
    nextPersonChat: NextPersonData | null;
    nextPersonSearching: boolean;
    // Groups
    groupChats: GroupChatInfo[];
    activeGroupChat: string | null;
    groupMessages: Record<string, ChatMsg[]>;
    // Limits
    chatLimits: ChatLimitsInfo | null;
    // Toast
    toastMessage: string;
  } = {
    isOpen: false,
    focusMode: false,
    room: null,
    reactionCooldown: false,
    activeTab: "people",
    chatMessages: [],
    pendingWhisperRequest: null,
    activeWhisper: null,
    nextPersonChat: null,
    nextPersonSearching: false,
    groupChats: [],
    activeGroupChat: null,
    groupMessages: {},
    chatLimits: null,
    toastMessage: "",
  };

  const REACTIONS: Array<{ type: ReactionType; icon: string; label: string }> =
    [
      { type: "wave", icon: "\u{1F44B}", label: "Wave" },
      { type: "nod", icon: "\u2713", label: "Nod" },
      { type: "lightbulb", icon: "\u{1F4A1}", label: "Interesting" },
      { type: "question", icon: "\u2753", label: "Confused" },
      { type: "fire", icon: "\u{1F525}", label: "Great" },
    ];

  const formatTime = (date: Date): string => {
    const d = new Date(date);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m} ${ampm}`;
  };

  const showToast = (msg: string) => {
    state.toastMessage = msg;
    render();
    setTimeout(() => {
      state.toastMessage = "";
      render();
    }, 2500);
  };

  const renderChatMessages = (messages: ChatMsg[]): string => {
    if (messages.length === 0) return "";
    return `<div class="chat-body">${messages
      .map((m) => {
        const safeName = escapeHtml(m.senderName || "Anonymous");
        const safeAvatar = m.senderAvatar
          ? sanitizeImageUrl(m.senderAvatar)
          : "";
        const safeContent = escapeHtml(m.content);
        const time = formatTime(m.createdAt);
        return `<div class="chat-msg">
        <div class="avatar-sm" ${safeAvatar ? `style="background-image:url('${safeAvatar}')"` : ""}></div>
        <div class="chat-msg-content">
          <div class="chat-msg-name">${safeName}<span class="chat-msg-time">${time}</span></div>
          <div class="chat-msg-text">${safeContent}</div>
        </div>
      </div>`;
      })
      .join("")}</div>`;
  };

  // --- Tab renderers ---

  const renderPeopleTab = (): string => {
    const ring1 = state.room?.ring1 ?? [];
    const ring2 = state.room?.ring2 ?? [];
    const ring3 = state.room?.ring3Count ?? 0;

    return `
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
        ${ring1.length === 0 && ring2.length === 0 && ring3 === 0 ? `<div class="chat-empty">No one else here yet</div>` : ""}
      </div>
      <div class="reaction-bar">
        ${REACTIONS.map((r) => `<button class="reaction-btn" data-type="${r.type}" title="${r.label}" aria-label="${r.label}" ${state.reactionCooldown ? "disabled" : ""}>${r.icon}</button>`).join("")}
      </div>
    `;
  };

  const renderChatTab = (): string => {
    const messages = state.chatMessages;
    return `
      ${messages.length === 0 ? `<div class="chat-empty">No messages yet. Say hi!</div>` : renderChatMessages(messages)}
      <div class="chat-input-bar">
        <input class="chat-input" data-chat-type="room" type="text" placeholder="Type a message..." maxlength="280" />
        <button class="chat-send" data-chat-type="room">Send</button>
      </div>
    `;
  };

  const renderPrivateTab = (): string => {
    const limits = state.chatLimits;
    const nextUsed = limits?.nextPersonSkipsToday ?? 0;
    const nextMax = limits?.nextPersonSkipsMax ?? 10;
    const whisperUsed = limits?.whisperInitiationsToday ?? 0;
    const whisperMax = limits?.whisperInitiationsMax ?? 5;

    // Active next person chat
    if (state.nextPersonChat) {
      const u = state.nextPersonChat.user;
      const safeName = escapeHtml(u.name || "Anonymous");
      const safeAvatar = u.avatarUrl ? sanitizeImageUrl(u.avatarUrl) : "";
      return `
        <div class="next-active">
          <div class="next-active-header">
            <div class="avatar" ${safeAvatar ? `style="background-image:url('${safeAvatar}')"` : ""}></div>
            <span class="next-active-name">${safeName}</span>
            <button class="skip-btn" data-action="skip-next">Skip</button>
          </div>
        </div>
        ${renderChatMessages(state.nextPersonChat.messages)}
        <div class="chat-input-bar">
          <input class="chat-input" data-chat-type="next" type="text" placeholder="Say something..." maxlength="280" />
          <button class="chat-send" data-chat-type="next">Send</button>
        </div>
      `;
    }

    // Active whisper chat
    if (state.activeWhisper) {
      const u = state.activeWhisper.user;
      const safeName = escapeHtml(u.name || "Anonymous");
      const safeAvatar = u.avatarUrl ? sanitizeImageUrl(u.avatarUrl) : "";
      return `
        <div class="next-active">
          <div class="next-active-header">
            <div class="avatar" ${safeAvatar ? `style="background-image:url('${safeAvatar}')"` : ""}></div>
            <span class="next-active-name">${safeName}</span>
            <span class="limit-badge">DM</span>
          </div>
        </div>
        ${renderChatMessages(state.activeWhisper.messages)}
        <div class="chat-input-bar">
          <input class="chat-input" data-chat-type="whisper" type="text" placeholder="Type a message..." maxlength="280" />
          <button class="chat-send" data-chat-type="whisper">Send</button>
        </div>
      `;
    }

    return `
      <div class="panel-body">
        <div class="next-section">
          <button class="next-btn" ${state.nextPersonSearching ? "disabled" : ""}>
            ${state.nextPersonSearching ? "Finding someone..." : "Meet Someone New"}
          </button>
          <div style="text-align:center;margin-top:6px;">
            <span class="limit-badge">${nextUsed}/${nextMax} today</span>
          </div>
        </div>
        ${
          state.pendingWhisperRequest
            ? `
          <div class="whisper-request-card">
            <div class="whisper-request-header">
              <div class="avatar" ${state.pendingWhisperRequest.from.avatarUrl ? `style="background-image:url('${sanitizeImageUrl(state.pendingWhisperRequest.from.avatarUrl)}')"` : ""}></div>
              <span class="whisper-request-name">${escapeHtml(state.pendingWhisperRequest.from.name || "Someone")}</span>
            </div>
            <div class="whisper-request-text">wants to chat with you</div>
            <div class="whisper-request-actions">
              <button class="accept-btn" data-chat-id="${escapeHtml(state.pendingWhisperRequest.chatId)}">Accept</button>
              <button class="decline-btn" data-chat-id="${escapeHtml(state.pendingWhisperRequest.chatId)}">Decline</button>
            </div>
          </div>
        `
            : ""
        }
        <div style="padding:8px 16px;">
          <div class="section-title" style="padding:0 0 4px 0;">Direct Messages</div>
          <div style="font-size:11px;color:#a3a3a3;line-height:1.4;">
            Click the chat icon next to someone in the People tab to start a DM.
            <span class="limit-badge">${whisperUsed}/${whisperMax} today</span>
          </div>
        </div>
      </div>
    `;
  };

  const renderGroupsTab = (): string => {
    const limits = state.chatLimits;
    const groupUsed = limits?.groupCreationsToday ?? 0;
    const groupMax = limits?.groupCreationsMax ?? 2;

    // Active group chat view
    if (state.activeGroupChat) {
      const group = state.groupChats.find(
        (g) => g.id === state.activeGroupChat,
      );
      const messages = state.groupMessages[state.activeGroupChat] ?? [];
      return `
        <div style="display:flex;align-items:center;padding:8px 14px;border-bottom:1px solid #f5f5f5;gap:8px;">
          <button class="action-btn" data-action="back-groups" style="opacity:1;font-size:16px;">\u2190</button>
          <span style="font-size:13px;font-weight:500;flex:1;">${escapeHtml(group?.name ?? "Group")}</span>
          <span class="limit-badge">${group?.participantCount ?? 0} members</span>
          <button class="skip-btn" data-action="leave-group" data-chat-id="${escapeHtml(state.activeGroupChat)}">Leave</button>
        </div>
        ${messages.length === 0 ? `<div class="chat-empty">No messages yet</div>` : renderChatMessages(messages)}
        <div class="chat-input-bar">
          <input class="chat-input" data-chat-type="group" type="text" placeholder="Type a message..." maxlength="280" />
          <button class="chat-send" data-chat-type="group">Send</button>
        </div>
      `;
    }

    return `
      <div class="create-group-bar">
        <div class="create-group-row">
          <input class="group-name-input" type="text" placeholder="Group name..." maxlength="50" />
          <button class="create-group-btn">Create <span class="limit-badge" style="color:#a3a3a3;">${groupUsed}/${groupMax}</span></button>
        </div>
      </div>
      <div class="panel-body">
        ${
          state.groupChats.length === 0
            ? `<div class="chat-empty">No groups on this page yet.<br>Create one above!</div>`
            : state.groupChats
                .map(
                  (g) => `
          <div class="group-card" data-group-id="${escapeHtml(g.id)}">
            <div class="group-icon">\u{1F465}</div>
            <div class="group-info">
              <div class="group-name">${escapeHtml(g.name)}</div>
              <div class="group-meta">${g.participantCount}${g.maxParticipants ? `/${g.maxParticipants}` : ""} members</div>
            </div>
          </div>
        `,
                )
                .join("")
        }
      </div>
    `;
  };

  // --- Main render ---

  const render = () => {
    if (state.focusMode) {
      container.innerHTML = "";
      return;
    }

    const count = state.room?.totalCount ?? 0;

    container.innerHTML = `
      ${state.toastMessage ? `<div class="toast show">${escapeHtml(state.toastMessage)}</div>` : ""}
      <div class="panel ${state.isOpen ? "open" : ""}">
        <div class="panel-header">
          <span>${count} ${count === 1 ? "person" : "people"} here</span>
          <button class="close-btn" aria-label="Close panel">\u00D7</button>
        </div>
        <div class="tabs">
          <button class="tab ${state.activeTab === "people" ? "active" : ""}" data-tab="people">People</button>
          <button class="tab ${state.activeTab === "chat" ? "active" : ""}" data-tab="chat">Chat</button>
          <button class="tab ${state.activeTab === "private" ? "active" : ""}" data-tab="private">Private</button>
          <button class="tab ${state.activeTab === "groups" ? "active" : ""}" data-tab="groups">Groups</button>
        </div>
        ${
          state.activeTab === "people"
            ? renderPeopleTab()
            : state.activeTab === "chat"
              ? renderChatTab()
              : state.activeTab === "private"
                ? renderPrivateTab()
                : renderGroupsTab()
        }
      </div>
      <button class="bubble ${count === 0 ? "empty" : ""}" aria-label="${count} people here">
        <span class="dot ${count === 0 ? "inactive" : ""}"></span>
        <span>${count}</span>
      </button>
    `;

    // --- Bind events ---

    container.querySelector(".bubble")?.addEventListener("click", () => {
      state.isOpen = !state.isOpen;
      render();
    });
    container.querySelector(".close-btn")?.addEventListener("click", () => {
      state.isOpen = false;
      render();
    });

    // Tab switching
    container.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const tabName = (tab as HTMLElement).dataset
          .tab as typeof state.activeTab;
        if (tabName && tabName !== state.activeTab) {
          state.activeTab = tabName;
          render();
        }
      });
    });

    // People tab
    if (state.activeTab === "people") {
      container.querySelectorAll("[data-action='wave']").forEach((btn) => {
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
      container.querySelectorAll("[data-action='dm']").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const uid = (btn as HTMLElement).dataset.uid;
          if (uid) {
            chrome.runtime.sendMessage({
              type: "INITIATE_WHISPER",
              targetUserId: uid,
            });
            state.activeTab = "private";
            showToast("Chat request sent!");
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
    }

    // Chat input (shared across room, whisper, next, group)
    container.querySelectorAll(".chat-send").forEach((btn) => {
      btn.addEventListener("click", () => {
        const chatType = (btn as HTMLElement).dataset.chatType;
        const input = container.querySelector(
          `.chat-input[data-chat-type="${chatType}"]`,
        ) as HTMLInputElement | null;
        if (!input) return;
        const content = input.value.trim();
        if (!content) return;

        if (chatType === "room") {
          chrome.runtime.sendMessage({ type: "SEND_ROOM_CHAT", content });
        } else if (chatType === "whisper" && state.activeWhisper) {
          chrome.runtime.sendMessage({ type: "SEND_ROOM_CHAT", content }); // whisper uses same channel for now
        } else if (chatType === "next" && state.nextPersonChat) {
          chrome.runtime.sendMessage({ type: "SEND_ROOM_CHAT", content });
        } else if (chatType === "group" && state.activeGroupChat) {
          chrome.runtime.sendMessage({
            type: "SEND_GROUP_CHAT",
            chatId: state.activeGroupChat,
            content,
          });
        }
        input.value = "";
      });
    });

    container.querySelectorAll(".chat-input").forEach((input) => {
      input.addEventListener("keydown", (e) => {
        if (
          (e as KeyboardEvent).key === "Enter" &&
          !(e as KeyboardEvent).shiftKey
        ) {
          e.preventDefault();
          const chatType = (input as HTMLElement).dataset.chatType;
          const sendBtn = container.querySelector(
            `.chat-send[data-chat-type="${chatType}"]`,
          ) as HTMLElement | null;
          sendBtn?.click();
        }
      });
    });

    // Private tab
    if (state.activeTab === "private") {
      container.querySelector(".next-btn")?.addEventListener("click", () => {
        state.nextPersonSearching = true;
        render();
        chrome.runtime.sendMessage({ type: "NEXT_PERSON" });
      });
      container
        .querySelector("[data-action='skip-next']")
        ?.addEventListener("click", () => {
          if (state.nextPersonChat) {
            chrome.runtime.sendMessage({
              type: "END_NEXT_PERSON",
              chatId: state.nextPersonChat.chatId,
            });
            state.nextPersonChat = null;
            render();
          }
        });
      container.querySelector(".accept-btn")?.addEventListener("click", () => {
        if (state.pendingWhisperRequest) {
          chrome.runtime.sendMessage({
            type: "ACCEPT_WHISPER",
            chatId: state.pendingWhisperRequest.chatId,
          });
          state.activeWhisper = {
            chatId: state.pendingWhisperRequest.chatId,
            user: state.pendingWhisperRequest.from,
            messages: [],
          };
          state.pendingWhisperRequest = null;
          render();
        }
      });
      container.querySelector(".decline-btn")?.addEventListener("click", () => {
        if (state.pendingWhisperRequest) {
          chrome.runtime.sendMessage({
            type: "DECLINE_WHISPER",
            chatId: state.pendingWhisperRequest.chatId,
          });
          state.pendingWhisperRequest = null;
          render();
        }
      });
    }

    // Groups tab
    if (state.activeTab === "groups") {
      container
        .querySelector(".create-group-btn")
        ?.addEventListener("click", () => {
          const input = container.querySelector(
            ".group-name-input",
          ) as HTMLInputElement | null;
          const name = input?.value.trim();
          if (name) {
            chrome.runtime.sendMessage({ type: "CREATE_GROUP_CHAT", name });
            if (input) input.value = "";
          }
        });
      container.querySelectorAll(".group-card").forEach((card) => {
        card.addEventListener("click", () => {
          const groupId = (card as HTMLElement).dataset.groupId;
          if (groupId) {
            state.activeGroupChat = groupId;
            chrome.runtime.sendMessage({
              type: "JOIN_GROUP_CHAT",
              chatId: groupId,
            });
            render();
          }
        });
      });
      container
        .querySelector("[data-action='back-groups']")
        ?.addEventListener("click", () => {
          state.activeGroupChat = null;
          render();
        });
      container
        .querySelector("[data-action='leave-group']")
        ?.addEventListener("click", () => {
          const chatId = (
            container.querySelector(
              "[data-action='leave-group']",
            ) as HTMLElement
          )?.dataset.chatId;
          if (chatId) {
            chrome.runtime.sendMessage({ type: "LEAVE_GROUP_CHAT", chatId });
            state.activeGroupChat = null;
            render();
          }
        });
    }

    // Auto-scroll chat bodies
    container.querySelectorAll(".chat-body").forEach((el) => {
      el.scrollTop = el.scrollHeight;
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
      <div class="user-row">
        <div class="avatar" ${safeAvatar ? `style="background-image:url('${safeAvatar}')"` : ""}></div>
        <span class="user-name">${safeName}</span>
        <button class="action-btn" data-action="dm" data-uid="${escapeHtml(u.userId)}" title="Chat">\u{1F4AC}</button>
        <button class="action-btn" data-action="wave" data-uid="${escapeHtml(u.userId)}" title="Wave">\u{1F44B}</button>
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

  // --- Message listener ---
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "PRESENCE_UPDATE") {
      state.room = message.room;
      render();
    }
    if (message.type === "REACTION") {
      showReactionFloat(message.reaction);
    }
    if (message.type === "ROOM_CHAT_MESSAGE") {
      const msg = message.message as RoomChatMessage;
      state.chatMessages.push({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderAvatar: msg.senderAvatar,
        content: msg.content,
        createdAt: msg.createdAt,
      });
      if (state.chatMessages.length > 100)
        state.chatMessages = state.chatMessages.slice(-100);
      render();
    }

    // Whisper lifecycle
    if (message.type === "WHISPER_REQUEST") {
      state.pendingWhisperRequest = message.payload;
      render();
    }
    if (message.type === "WHISPER_ACCEPTED") {
      if (
        state.pendingWhisperRequest &&
        state.pendingWhisperRequest.chatId === message.payload.chatId
      ) {
        state.activeWhisper = {
          chatId: message.payload.chatId,
          user: state.pendingWhisperRequest.from,
          messages: [],
        };
        state.pendingWhisperRequest = null;
      }
      state.activeTab = "private";
      render();
    }
    if (message.type === "WHISPER_DECLINED") {
      if (state.pendingWhisperRequest?.chatId === message.payload.chatId) {
        state.pendingWhisperRequest = null;
      }
      showToast("Chat request declined");
    }

    // Group chat
    if (message.type === "GROUP_CHAT_CREATED") {
      const chat = message.chat as GroupChatInfo;
      if (!state.groupChats.find((g) => g.id === chat.id)) {
        state.groupChats.unshift(chat);
      }
      render();
    }
    if (message.type === "GROUP_CHAT_LIST") {
      state.groupChats = message.chats as GroupChatInfo[];
      render();
    }
    if (message.type === "GROUP_CHAT_MESSAGE") {
      const msg = message.message as RoomChatMessage;
      const chatId = msg.chatId;
      if (!state.groupMessages[chatId]) state.groupMessages[chatId] = [];
      state.groupMessages[chatId].push({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderAvatar: msg.senderAvatar,
        content: msg.content,
        createdAt: msg.createdAt,
      });
      if (state.groupMessages[chatId].length > 100) {
        state.groupMessages[chatId] = state.groupMessages[chatId].slice(-100);
      }
      render();
    }
    if (message.type === "GROUP_CHAT_JOINED") {
      const g = state.groupChats.find((c) => c.id === message.payload.chatId);
      if (g) g.participantCount++;
      render();
    }
    if (message.type === "GROUP_CHAT_LEFT") {
      const g = state.groupChats.find((c) => c.id === message.payload.chatId);
      if (g) g.participantCount = Math.max(0, g.participantCount - 1);
      render();
    }

    // Next person
    if (message.type === "NEXT_PERSON_MATCHED") {
      state.nextPersonSearching = false;
      state.nextPersonChat = {
        chatId: message.match.chatId,
        user: message.match.matchedUser,
        messages: [],
      };
      state.activeTab = "private";
      render();
    }
    if (message.type === "NEXT_PERSON_NO_MATCH") {
      state.nextPersonSearching = false;
      showToast(message.payload.reason || "No one available");
    }
    if (message.type === "NEXT_PERSON_ENDED") {
      if (state.nextPersonChat?.chatId === message.payload.chatId) {
        state.nextPersonChat = null;
      }
      render();
    }

    // Limits
    if (message.type === "CHAT_LIMITS") {
      state.chatLimits = message.limits;
      render();
    }
    if (message.type === "LIMIT_EXCEEDED") {
      showToast(
        `Daily limit reached (${message.payload.limit}). Upgrade for more!`,
      );
    }
  });

  // --- Navigation & lifecycle ---

  chrome.runtime.sendMessage({
    type: "TAB_URL_CHANGED",
    url: window.location.href,
  });
  chrome.runtime.sendMessage({ type: "GET_CHAT_LIMITS" });

  const clearChatState = () => {
    state.chatMessages = [];
    state.groupChats = [];
    state.groupMessages = {};
    state.activeGroupChat = null;
    state.nextPersonChat = null;
    state.activeWhisper = null;
    state.pendingWhisperRequest = null;
  };

  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      clearChatState();
      chrome.runtime.sendMessage({ type: "TAB_URL_CHANGED", url: lastUrl });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("popstate", () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      clearChatState();
      chrome.runtime.sendMessage({ type: "TAB_URL_CHANGED", url: lastUrl });
    }
  });

  window.addEventListener("pagehide", () => {
    chrome.runtime.sendMessage({ type: "PAGE_UNLOAD" });
  });

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

  chrome.storage.local.get(["focusMode"], (result) => {
    if (result.focusMode) {
      state.focusMode = true;
      render();
    }
  });

  render();
}
