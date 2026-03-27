/**
 * Custom title bar for the frameless window.
 * Provides window controls and drag region.
 */

import { getCurrentWindow } from "@tauri-apps/api/window";

function TitleBar() {
  const appWindow = getCurrentWindow();

  async function handleMinimize() {
    await appWindow.minimize();
  }

  async function handleMaximize() {
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
  }

  async function handleClose() {
    await appWindow.hide();
  }

  return (
    <div
      className="border-nonley-border bg-nonley-surface flex h-9 select-none items-center justify-between border-b px-3"
      data-tauri-drag-region
    >
      <div className="flex items-center gap-2" data-tauri-drag-region>
        <div className="bg-nonley-primary h-4 w-4 rounded-full" />
        <span
          className="text-nonley-text text-xs font-medium"
          data-tauri-drag-region
        >
          Nonley
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handleMinimize}
          className="text-nonley-muted hover:bg-nonley-surface-elevated hover:text-nonley-text flex h-6 w-6 items-center justify-center rounded transition-colors"
          aria-label="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>

        <button
          onClick={handleMaximize}
          className="text-nonley-muted hover:bg-nonley-surface-elevated hover:text-nonley-text flex h-6 w-6 items-center justify-center rounded transition-colors"
          aria-label="Maximize"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        </button>

        <button
          onClick={handleClose}
          className="text-nonley-muted hover:bg-nonley-danger flex h-6 w-6 items-center justify-center rounded transition-colors hover:text-white"
          aria-label="Close"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default TitleBar;
