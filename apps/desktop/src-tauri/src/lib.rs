mod commands;
mod detector;
mod tray;

use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{Emitter, Manager};

/// Shared state for the auth token stored securely in memory.
pub struct AuthState {
    pub token: Mutex<Option<String>>,
}

/// Shared state for the currently detected active application.
pub struct DetectorState {
    pub active_app: Mutex<String>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let auth_state = AuthState {
        token: Mutex::new(None),
    };
    let detector_state = DetectorState {
        active_app: Mutex::new(String::new()),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .manage(auth_state)
        .manage(detector_state)
        .invoke_handler(tauri::generate_handler![
            commands::get_active_app,
            commands::set_auth_token,
            commands::get_auth_token,
            commands::open_login_url,
            commands::set_autostart,
        ])
        .setup(|app| {
            // Build the system tray
            tray::create_tray(app.handle())?;

            // Start the background app detector thread
            let handle = app.handle().clone();
            let detector = Arc::new(Mutex::new(detector::AppDetector::new()));

            thread::spawn(move || {
                loop {
                    let app_name = {
                        let det = detector.lock().unwrap_or_else(|e| e.into_inner());
                        det.detect()
                    };

                    // Update the shared state
                    if let Some(state) = handle.try_state::<DetectorState>() {
                        if let Ok(mut current) = state.active_app.lock() {
                            if *current != app_name {
                                *current = app_name.clone();
                                // Emit event to the frontend
                                let _ = handle.emit("active-app-changed", &app_name);
                            }
                        }
                    }

                    thread::sleep(Duration::from_secs(5));
                }
            });

            // Handle window close: hide to tray instead of quitting
            let main_window = app.get_webview_window("main");
            if let Some(window) = main_window {
                let w = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = w.hide();
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running nonley desktop");
}
