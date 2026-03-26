import { createStyles } from "./styles";

interface NonleyEmbedConfig {
  siteId: string;
  position?: "bottom-right" | "bottom-left";
  colors?: {
    primary?: string;
    background?: string;
    text?: string;
    accent?: string;
  };
  chatEnabled?: boolean;
  brandingHidden?: boolean;
}

interface PresenceData {
  totalCount: number;
  users: Array<{ id: string; name: string; avatar: string }>;
}

// --- Sanitization ---
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

async function hashPath(path: string): Promise<string> {
  const data = new TextEncoder().encode(path);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class NonleyEmbed {
  private config: {
    siteId: string;
    position: "bottom-right" | "bottom-left";
    colors: {
      primary: string;
      background: string;
      text: string;
      accent: string;
    };
    chatEnabled: boolean;
    brandingHidden: boolean;
  };
  private host: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private ws: WebSocket | null = null;
  private presence: PresenceData = { totalCount: 0, users: [] };
  private isOpen = false;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private destroyed = false;
  private currentRoomHash: string | null = null;

  constructor(config: NonleyEmbedConfig) {
    this.config = {
      siteId: config.siteId,
      position: config.position ?? "bottom-right",
      colors: {
        primary: config.colors?.primary ?? "#818cf8",
        background: config.colors?.background ?? "#1a1a2e",
        text: config.colors?.text ?? "#e0e0e0",
        accent: config.colors?.accent ?? "#4ade80",
      },
      chatEnabled: config.chatEnabled ?? true,
      brandingHidden: config.brandingHidden ?? false,
    };
  }

  mount(container?: HTMLElement): void {
    if (this.host) return; // Prevent duplicate mounts
    const parent = container ?? document.body;

    this.host = document.createElement("div");
    this.host.id = "nonley-embed";
    this.host.style.cssText = `
      position: fixed;
      bottom: 16px;
      ${this.config.position === "bottom-left" ? "left: 16px;" : "right: 16px;"}
      z-index: 2147483647;
    `;

    this.shadow = this.host.attachShadow({ mode: "closed" });

    const style = document.createElement("style");
    style.textContent = createStyles(this.config.colors, this.config.position);
    this.shadow.appendChild(style);

    parent.appendChild(this.host);
    this.render();
    this.connect();

    // Handle SPA navigation
    this.observeNavigation();

    // Handle visibility changes
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  unmount(): void {
    this.destroyed = true;
    this.disconnect();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    this.host?.remove();
    this.host = null;
    this.shadow = null;
  }

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.stopHeartbeat();
    } else {
      this.startHeartbeat();
    }
  };

  private observeNavigation(): void {
    let lastPath = window.location.pathname;
    const check = () => {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        this.joinCurrentPage();
      }
    };
    // Intercept pushState/replaceState
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState = (...args) => {
      origPush(...args);
      check();
    };
    history.replaceState = (...args) => {
      origReplace(...args);
      check();
    };
    window.addEventListener("popstate", check);
  }

  private async joinCurrentPage(): Promise<void> {
    this.currentRoomHash = await hashPath(window.location.pathname);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "join",
          room: this.currentRoomHash,
          siteId: this.config.siteId,
        }),
      );
    }
  }

  private async connect(): Promise<void> {
    if (this.destroyed) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.currentRoomHash = await hashPath(window.location.pathname);
    const wsUrl = `wss://presence.nonley.com?site=${encodeURIComponent(this.config.siteId)}&room=${encodeURIComponent(this.currentRoomHash ?? "")}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.ws?.send(
          JSON.stringify({
            type: "join",
            room: this.currentRoomHash,
            siteId: this.config.siteId,
          }),
        );
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as {
            type: string;
            presence?: PresenceData;
          };
          if (data.type === "presence_update" && data.presence) {
            this.presence = data.presence;
            this.render();
          }
        } catch {
          // Ignore malformed messages
        }
      };

      this.ws.onerror = () => {
        // onerror is always followed by onclose, so we handle reconnection there
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.ws = null;
        if (!this.destroyed) {
          this.scheduleReconnect();
        }
      };
    } catch {
      if (!this.destroyed) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.destroyed || this.reconnectAttempts >= this.maxReconnectAttempts)
      return;
    // Exponential backoff: 1s, 2s, 4s, 8s... max 30s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  private disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnection
      this.ws.close();
      this.ws = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "heartbeat" }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private render(): void {
    if (!this.shadow) return;

    const existingContent = this.shadow.querySelector(".nonley-container");
    existingContent?.remove();

    const container = document.createElement("div");
    container.className = "nonley-container";

    const count = this.presence.totalCount;
    const hasUsers = count > 0;

    // Panel
    const panel = document.createElement("div");
    panel.className = `panel ${this.isOpen ? "open" : ""}`;

    const usersHtml =
      this.presence.users.length > 0
        ? this.presence.users
            .map((u) => {
              const safeName = escapeHtml(u.name || "Someone");
              const safeAvatar = u.avatar ? sanitizeImageUrl(u.avatar) : "";
              return `
            <div class="user-row">
              <div class="avatar" ${safeAvatar ? `style="background-image:url('${safeAvatar}')"` : ""}></div>
              <span class="user-name">${safeName}</span>
            </div>
          `;
            })
            .join("")
        : count > 0
          ? `<div class="crowd-text">${count} ${count === 1 ? "person is" : "people are"} browsing this page right now</div>`
          : `<div class="crowd-text">You're the first one here</div>`;

    panel.innerHTML = `
      <div class="panel-header">
        <span>${count} ${count === 1 ? "person" : "people"} here</span>
        <button class="close-btn" aria-label="Close">\u00D7</button>
      </div>
      <div class="panel-body">${usersHtml}</div>
      ${
        !this.config.brandingHidden
          ? `
        <div class="branding">
          <a href="https://nonley.com?ref=embed" target="_blank" rel="noopener noreferrer">Powered by Nonley</a>
        </div>
      `
          : ""
      }
    `;

    // Bubble
    const bubble = document.createElement("button");
    bubble.className = `bubble ${hasUsers ? "" : "empty"}`;
    bubble.setAttribute("aria-label", `${count} people here`);
    bubble.innerHTML = `<span class="dot ${hasUsers ? "" : "inactive"}"></span><span>${count}</span>`;

    container.appendChild(panel);
    container.appendChild(bubble);
    this.shadow.appendChild(container);

    // Bind events
    bubble.addEventListener("click", () => {
      this.isOpen = !this.isOpen;
      this.render();
    });
    panel.querySelector(".close-btn")?.addEventListener("click", () => {
      this.isOpen = false;
      this.render();
    });
  }

  static init(config: NonleyEmbedConfig): NonleyEmbed {
    const widget = new NonleyEmbed(config);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => widget.mount());
    } else {
      widget.mount();
    }
    return widget;
  }
}
