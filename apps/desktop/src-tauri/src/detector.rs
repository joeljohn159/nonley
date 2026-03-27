/// Cross-platform active application detector.
///
/// Detects the currently focused/frontmost application window
/// and returns its name as a string.

pub struct AppDetector;

impl AppDetector {
    pub fn new() -> Self {
        Self
    }

    /// Detect the currently active (frontmost) application.
    /// Returns the application name or an empty string if detection fails.
    pub fn detect(&self) -> String {
        #[cfg(target_os = "macos")]
        {
            self.detect_macos()
        }

        #[cfg(target_os = "windows")]
        {
            self.detect_windows()
        }

        #[cfg(target_os = "linux")]
        {
            self.detect_linux()
        }

        #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
        {
            String::new()
        }
    }

    #[cfg(target_os = "macos")]
    fn detect_macos(&self) -> String {
        use std::process::Command;

        let output = Command::new("osascript")
            .arg("-e")
            .arg(
                "tell application \"System Events\" to get name of first application process whose frontmost is true",
            )
            .output();

        match output {
            Ok(result) => {
                let name = String::from_utf8_lossy(&result.stdout).trim().to_string();
                if name.is_empty() {
                    self.detect_macos_fallback()
                } else {
                    name
                }
            }
            Err(_) => self.detect_macos_fallback(),
        }
    }

    #[cfg(target_os = "macos")]
    fn detect_macos_fallback(&self) -> String {
        use std::process::Command;

        // Fallback: use lsappinfo to get the frontmost app
        let output = Command::new("lsappinfo")
            .arg("info")
            .arg("-only")
            .arg("name")
            .arg("-app")
            .arg("front")
            .output();

        match output {
            Ok(result) => {
                let raw = String::from_utf8_lossy(&result.stdout);
                // Parse output like: "name" = "AppName"
                raw.lines()
                    .find_map(|line| {
                        let trimmed = line.trim();
                        if trimmed.starts_with("\"name\"") {
                            trimmed
                                .split('=')
                                .nth(1)
                                .map(|v| v.trim().trim_matches('"').to_string())
                        } else {
                            None
                        }
                    })
                    .unwrap_or_default()
            }
            Err(_) => String::new(),
        }
    }

    #[cfg(target_os = "windows")]
    fn detect_windows(&self) -> String {
        use std::process::Command;

        // Use PowerShell to get the foreground window process name.
        // This avoids depending on the `windows` crate which adds compile complexity.
        let output = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "(Get-Process | Where-Object { $_.MainWindowHandle -eq (Add-Type -MemberDefinition '[DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow();' -Name Win32 -Namespace Temp -PassThru)::GetForegroundWindow() }).ProcessName",
            ])
            .output();

        match output {
            Ok(result) => {
                String::from_utf8_lossy(&result.stdout).trim().to_string()
            }
            Err(_) => String::new(),
        }
    }

    #[cfg(target_os = "linux")]
    fn detect_linux(&self) -> String {
        use std::process::Command;

        // Try xdotool first (X11)
        let xdotool_result = Command::new("xdotool")
            .args(["getactivewindow", "getwindowname"])
            .output();

        if let Ok(output) = xdotool_result {
            let name = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !name.is_empty() {
                return name;
            }
        }

        // Fallback for Wayland: use gdbus to get the active window title
        let gdbus_result = Command::new("gdbus")
            .args([
                "call",
                "--session",
                "--dest",
                "org.gnome.Shell",
                "--object-path",
                "/org/gnome/Shell",
                "--method",
                "org.gnome.Shell.Eval",
                "global.display.focus_window ? global.display.focus_window.get_wm_class() : ''",
            ])
            .output();

        if let Ok(output) = gdbus_result {
            let raw = String::from_utf8_lossy(&output.stdout);
            // Parse gdbus output: (true, 'AppName')
            if let Some(start) = raw.find('\'') {
                if let Some(end) = raw.rfind('\'') {
                    if start < end {
                        let name = &raw[start + 1..end];
                        if !name.is_empty() {
                            return name.to_string();
                        }
                    }
                }
            }
        }

        String::new()
    }
}

impl Default for AppDetector {
    fn default() -> Self {
        Self::new()
    }
}
