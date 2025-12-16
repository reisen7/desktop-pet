#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![quit_app])
        .run(tauri::generate_context!())
        .expect("error while running desktop pet application");
}
