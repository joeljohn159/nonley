import { NonleyEmbed } from "./widget";

// Auto-initialize from script tag data attributes
// Supports both sync and async/defer loading
function autoInit(): void {
  // Try document.currentScript first (sync), then fallback to querySelector
  const script =
    (document.currentScript as HTMLScriptElement | null) ??
    document.querySelector<HTMLScriptElement>(
      "script[data-site][src*='nonley']",
    );

  if (script) {
    const siteId = script.getAttribute("data-site");
    if (siteId) {
      NonleyEmbed.init({
        siteId,
        position:
          (script.getAttribute("data-position") as
            | "bottom-right"
            | "bottom-left") ?? "bottom-right",
        chatEnabled: script.getAttribute("data-chat") !== "false",
        brandingHidden: script.getAttribute("data-branding") === "false",
        colors: script.getAttribute("data-color-primary")
          ? {
              primary: script.getAttribute("data-color-primary") ?? undefined,
              background: script.getAttribute("data-color-bg") ?? undefined,
              text: script.getAttribute("data-color-text") ?? undefined,
              accent: script.getAttribute("data-color-accent") ?? undefined,
            }
          : undefined,
      });
    }
  }
}

// Run auto-init
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  autoInit();
}

// Expose for programmatic usage
export { NonleyEmbed as Nonley } from "./widget";
