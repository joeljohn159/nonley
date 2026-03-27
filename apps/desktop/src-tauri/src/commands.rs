use crate::{AuthState, DetectorState};
use tauri::State;
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_shell::ShellExt;

/// Get the currently active (frontmost) application name.
#[tauri::command]
pub fn get_active_app(state: State<'_, DetectorState>) -> String {
    state
        .active_app
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .clone()
}

/// Store the auth token in memory.
/// In production this could use the OS keychain via a Tauri plugin.
#[tauri::command]
pub fn set_auth_token(token: String, state: State<'_, AuthState>) {
    let mut stored = state.token.lock().unwrap_or_else(|e| e.into_inner());
    *stored = Some(token);
}

/// Retrieve the stored auth token.
#[tauri::command]
pub fn get_auth_token(state: State<'_, AuthState>) -> Option<String> {
    state
        .token
        .lock()
        .unwrap_or_else(|e| e.into_inner())
        .clone()
}

/// Open a URL in the default system browser.
#[tauri::command]
pub async fn open_login_url(url: String, app: tauri::AppHandle) -> Result<(), String> {
    app.shell()
        .open(&url, None)
        .map_err(|e| format!("Failed to open URL: {}", e))
}

/// Enable or disable auto-start at login.
#[tauri::command]
pub fn set_autostart(enabled: bool, app: tauri::AppHandle) -> Result<(), String> {
    let autostart = app.autolaunch();
    if enabled {
        autostart
            .enable()
            .map_err(|e| format!("Failed to enable autostart: {}", e))
    } else {
        autostart
            .disable()
            .map_err(|e| format!("Failed to disable autostart: {}", e))
    }
}
