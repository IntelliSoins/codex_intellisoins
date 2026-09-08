//! Commandes Tauri exposées au frontend. Les noms correspondent aux appels
//! de `src/lib/bridge.ts` (les arguments camelCase JS sont convertis en
//! snake_case Rust par Tauri).

use tauri::State;

use crate::codex_bridge;
use crate::data;
use crate::db;
use crate::model::*;
use crate::security::{self, Capability};
use crate::state::AppState;
use chrono::Utc;

// --- Session & sécurité -----------------------------------------------------

#[tauri::command]
pub fn current_user(state: State<AppState>) -> SessionUser {
    state.user.lock().expect("verrou user").clone()
}

#[tauri::command]
pub fn unlock_vault(state: State<AppState>, passphrase: String) -> Result<SessionUser, String> {
    security::verify_passphrase(&passphrase).map_err(|e| e.to_string())?;
    let mut user = state.user.lock().expect("verrou user");
    user.vault_unlocked = true;
    Ok(user.clone())
}

#[tauri::command]
pub fn lock_vault(state: State<AppState>) -> SessionUser {
    let mut user = state.user.lock().expect("verrou user");
    user.vault_unlocked = false;
    user.clone()
}

#[tauri::command]
pub fn audit_log() -> Vec<AuditEntry> {
    let now = Utc::now().to_rfc3339();
    let e = |id: &str, actor: &str, role: Role, action: &str, target: &str, severity: &str| AuditEntry {
        id: id.into(),
        at: now.clone(),
        actor: actor.into(),
        role,
        action: action.into(),
        target: target.into(),
        severity: severity.into(),
    };
    vec![
        e("a-1", "Dr. Amélie Rousseau", Role::Proprietaire, "Déverrouillage du coffre", "vault", "info"),
        e("a-2", "Karim Salhi", Role::Salarie, "Consultation ordonnance", "o-1", "info"),
        e("a-3", "système", Role::Proprietaire, "Échec connexion MSSanté", "c-mss", "avertissement"),
        e("a-4", "Karim Salhi", Role::Salarie, "Tentative d'accès registre stupéfiants refusée", "registre-stup", "critique"),
    ]
}

// --- Tableau de bord --------------------------------------------------------

#[tauri::command]
pub fn dashboard_summary() -> DashboardSummary {
    data::seed_dashboard()
}

// --- Assistant IA -----------------------------------------------------------

#[tauri::command]
pub async fn agent_send(
    state: State<'_, AppState>,
    backend_id: String,
    history: Vec<AgentMessage>,
    input: String,
) -> Result<AgentMessage, String> {
    let _ = history;
    let externe = state
        .backends
        .lock()
        .expect("verrou backends")
        .iter()
        .find(|b| b.id == backend_id)
        .map(|b| b.externe)
        .unwrap_or(false);
    Ok(codex_bridge::agent_send(&backend_id, &input, externe).await)
}

// --- Recherche web ----------------------------------------------------------

#[tauri::command]
pub async fn web_search(query: String) -> Result<Vec<WebSearchResult>, String> {
    Ok(codex_bridge::web_search(&query).await)
}

// --- Calendrier & rappels ---------------------------------------------------

#[tauri::command]
pub fn reminders_list(state: State<AppState>) -> Vec<Reminder> {
    state.reminders.lock().expect("verrou rappels").clone()
}

#[tauri::command]
pub fn reminders_toggle(state: State<AppState>, id: String) -> Vec<Reminder> {
    let mut reminders = state.reminders.lock().expect("verrou rappels");
    if let Some(r) = reminders.iter_mut().find(|r| r.id == id) {
        r.done = !r.done;
    }
    reminders.clone()
}

#[tauri::command]
pub fn calendar_list() -> Vec<CalendarEvent> {
    let e = |id: &str, title: &str, start: &str, end: &str, kind: &str| CalendarEvent {
        id: id.into(),
        title: title.into(),
        start: start.into(),
        end: end.into(),
        kind: kind.into(),
    };
    vec![
        e("e-1", "Entretien pharmaceutique — asthme", "10:00", "10:30", "rdv"),
        e("e-2", "Livraison CERP", "11:15", "11:30", "livraison"),
        e("e-3", "Bilan de médication — M. Petit", "14:30", "15:00", "rdv"),
        e("e-4", "Garde de nuit", "20:00", "08:00", "garde"),
    ]
}

// --- Base de données locale -------------------------------------------------

#[tauri::command]
pub fn db_query(state: State<AppState>, entity: String, search: String) -> Result<Vec<DbRecord>, String> {
    // Garde-fou : consultation des dossiers soumise à habilitation.
    let role = state.user.lock().expect("verrou user").role;
    security::require(role, Capability::ConsulterDossiers).map_err(|e| e.to_string())?;
    Ok(db::query(&entity, &search))
}

// --- Connecteurs pharmacie --------------------------------------------------

fn connectors_seed() -> Vec<PharmacyConnector> {
    let c = |id: &str, name: &str, vendor: &str, category: &str, status: &str, last: Option<&str>| PharmacyConnector {
        id: id.into(),
        name: name.into(),
        vendor: vendor.into(),
        category: category.into(),
        status: status.into(),
        last_sync: last.map(|s| s.to_string()),
    };
    vec![
        c("c-lgo", "LGPI Winpharma", "Pharmagest", "lgo", "connecte", Some("il y a 3 min")),
        c("c-dp", "Dossier Pharmaceutique", "CNOP", "dossier-pharmaceutique", "connecte", Some("il y a 12 min")),
        c("c-cerp", "CERP EDI", "CERP", "grossiste", "connecte", Some("il y a 1 min")),
        c("c-tlt", "Télétransmission SESAM-Vitale", "GIE Sesam-Vitale", "teletransmission", "a-configurer", None),
        c("c-mss", "Messagerie Sécurisée Santé", "MSSanté", "messagerie-securisee", "erreur", Some("il y a 2 h")),
    ]
}

#[tauri::command]
pub fn connectors_list() -> Vec<PharmacyConnector> {
    connectors_seed()
}

#[tauri::command]
pub fn connectors_sync(id: String) -> Vec<PharmacyConnector> {
    connectors_seed()
        .into_iter()
        .map(|mut c| {
            if c.id == id {
                c.status = "connecte".into();
                c.last_sync = Some("à l'instant".into());
            }
            c
        })
        .collect()
}

// --- Outils MCP -------------------------------------------------------------

#[tauri::command]
pub async fn mcp_servers() -> Result<Vec<McpServer>, String> {
    Ok(codex_bridge::mcp_servers().await)
}

// --- Backends de calcul -----------------------------------------------------

#[tauri::command]
pub fn backends_list(state: State<AppState>) -> Vec<ComputeBackend> {
    state.backends.lock().expect("verrou backends").clone()
}

#[tauri::command]
pub fn backends_ping(state: State<AppState>, id: String) -> Result<Vec<ComputeBackend>, String> {
    let role = state.user.lock().expect("verrou user").role;
    security::require(role, Capability::GererBackends).map_err(|e| e.to_string())?;
    let mut backends = state.backends.lock().expect("verrou backends");
    if let Some(b) = backends.iter_mut().find(|b| b.id == id) {
        // Simule une mesure de latence tant que le ping réseau réel n'est pas branché.
        b.latency_ms = (b.latency_ms.saturating_mul(9) / 10).max(60);
    }
    Ok(backends.clone())
}
