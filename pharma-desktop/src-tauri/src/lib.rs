mod codex_bridge;
mod commands;
mod data;
mod db;
mod model;
mod security;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::current_user,
            commands::unlock_vault,
            commands::lock_vault,
            commands::audit_log,
            commands::dashboard_summary,
            commands::agent_send,
            commands::web_search,
            commands::reminders_list,
            commands::reminders_toggle,
            commands::calendar_list,
            commands::db_query,
            commands::connectors_list,
            commands::connectors_sync,
            commands::mcp_servers,
            commands::backends_list,
            commands::backends_ping,
        ])
        .run(tauri::generate_context!())
        .expect("erreur au lancement de PharmaCore");
}
