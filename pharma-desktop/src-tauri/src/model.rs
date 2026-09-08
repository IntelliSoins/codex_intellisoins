//! Structures sérialisées vers le frontend React.
//! Elles reflètent `src/lib/types.ts` (sérialisation en camelCase).

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum Role {
    Proprietaire,
    Salarie,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionUser {
    pub id: String,
    pub display_name: String,
    pub role: Role,
    pub officine: String,
    pub vault_unlocked: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ComputeKind {
    DgxSpark,
    MacSilicon,
    LlmExterne,
    LocalCpu,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ComputeBackend {
    pub id: String,
    pub kind: ComputeKind,
    pub label: String,
    pub endpoint: String,
    pub model: String,
    pub latency_ms: u32,
    pub status: String,
    pub externe: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub created_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backend_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebSearchResult {
    pub title: String,
    pub url: String,
    pub snippet: String,
    pub source: String,
    pub fetched_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Reminder {
    pub id: String,
    pub title: String,
    pub due: String,
    pub priority: String,
    pub category: String,
    pub done: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEvent {
    pub id: String,
    pub title: String,
    pub start: String,
    pub end: String,
    pub kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbRecord {
    pub id: String,
    pub fields: serde_json::Value,
}

/// Un document trouvé par la recherche floue (codex-file-search).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentMatch {
    /// Nom de fichier affiché.
    pub name: String,
    /// Chemin relatif à la racine de recherche.
    pub path: String,
    /// Chemin absolu sur le poste.
    pub full_path: String,
    /// Score de pertinence (nucleo). Plus élevé = plus pertinent.
    pub score: u32,
    /// "file" ou "directory".
    pub match_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpTool {
    pub name: String,
    pub description: String,
    pub dangerous: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServer {
    pub id: String,
    pub name: String,
    pub transport: String,
    pub command: String,
    pub status: String,
    pub tools: Vec<McpTool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PharmacyConnector {
    pub id: String,
    pub name: String,
    pub vendor: String,
    pub category: String,
    pub status: String,
    pub last_sync: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditEntry {
    pub id: String,
    pub at: String,
    pub actor: String,
    pub role: Role,
    pub action: String,
    pub target: String,
    pub severity: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardSummary {
    pub tasks_actives: u32,
    pub reminders_today: u32,
    pub connectors_online: u32,
    pub connectors_total: u32,
    pub backends_online: u32,
    pub backends_total: u32,
    pub security_alerts: u32,
}
