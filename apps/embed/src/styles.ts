interface Colors {
  primary: string;
  background: string;
  text: string;
  accent: string;
}

export function createStyles(
  colors: Colors,
  position: "bottom-right" | "bottom-left" = "bottom-right",
): string {
  const panelSide = position === "bottom-left" ? "left: 0;" : "right: 0;";

  return `
    :host { all: initial; }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .bubble {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 12px;
      border-radius: 20px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      background: ${colors.background};
      color: ${colors.text};
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
      transition: all 200ms ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .bubble:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.4); transform: translateY(-1px); }
    .bubble.empty { opacity: 0.5; color: #666; }

    .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: ${colors.accent};
      transition: background 300ms ease;
    }
    .dot.inactive { background: #666; }

    .panel {
      position: absolute;
      bottom: 48px;
      ${panelSide}
      width: 280px;
      max-width: calc(100vw - 32px);
      max-height: 350px;
      border-radius: 12px;
      background: ${colors.background};
      color: ${colors.text};
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      overflow: hidden;
      display: none;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .panel.open { display: flex; }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      font-size: 13px;
      font-weight: 600;
    }

    .close-btn {
      background: none; border: none; color: ${colors.text};
      cursor: pointer; font-size: 18px; padding: 0 4px;
    }

    .panel-body { flex: 1; overflow-y: auto; padding: 8px 0; }

    .user-row {
      display: flex;
      align-items: center;
      padding: 6px 16px;
      gap: 10px;
    }

    .avatar {
      width: 24px; height: 24px; border-radius: 50%;
      background: rgba(255,255,255,0.1);
      background-size: cover;
      flex-shrink: 0;
    }

    .user-name { font-size: 13px; font-weight: 500; }

    .crowd-text { padding: 12px 16px; font-size: 13px; color: rgba(255,255,255,0.5); }

    .branding {
      padding: 8px 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
      text-align: center;
    }
    .branding a {
      color: rgba(255,255,255,0.3);
      text-decoration: none;
      font-size: 11px;
      transition: color 200ms;
    }
    .branding a:hover { color: ${colors.primary}; }

    @media (max-width: 400px) {
      .panel { width: calc(100vw - 32px); }
    }
  `;
}
