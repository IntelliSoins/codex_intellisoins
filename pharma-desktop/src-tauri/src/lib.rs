mod codex_bridge;
mod commands;
mod data;
mod db;
mod model;
mod patient_workflow;
mod security;
mod state;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;
            let database = tauri::async_runtime::block_on(async {
                let pool = db::initialize(&app_data_dir).await?;
                patient_workflow::initialize(&pool).await?;
                Ok::<_, anyhow::Error>(pool)
            })?;
            app.manage(AppState::new(database));
            Ok(())
        })
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
            commands::document_search,
            commands::patient_workflows_list,
            commands::patient_workflow_detail,
            commands::patient_workflow_create,
            commands::patient_workflow_advance,
            commands::connectors_list,
            commands::connectors_sync,
            commands::mcp_servers,
            commands::backends_list,
            commands::backends_ping,
        ])
        .run(tauri::generate_context!())
        .expect("erreur au lancement de PharmaCore");
}
