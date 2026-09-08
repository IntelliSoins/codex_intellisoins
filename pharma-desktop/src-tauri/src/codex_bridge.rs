//! Point d'intégration unique avec le backend Rust codex-*.
//!
//! Chaque fonction est aujourd'hui une implémentation de démonstration. Le
//! câblage réel s'active via la feature `codex` (voir Cargo.toml) et les
//! crates listées ci-dessous. Regrouper l'intégration ici évite de disperser
//! les dépendances codex dans toute la base.
//!
//! Correspondance module → crate :
//!   assistant (agent)      -> codex-core / codex-client / codex-model-provider
//!   recherche web          -> ext/web-search + codex-network-proxy
//!   outils MCP             -> codex-mcp / rmcp-client
//!   recherche documents    -> codex-file-search
//!   rôles / RBAC           -> codex-agent-roles
//!   coffre / secrets       -> codex-keyring-store / codex-secrets
//!   sandbox d'exécution    -> codex-sandboxing

use crate::data;
use crate::model::{AgentMessage, DocumentMatch, McpServer, McpTool, WebSearchResult};
use chrono::Utc;

/// Envoie un tour de conversation à l'agent sur le backend choisi.
///
/// Branchement : construire un `Thread`/`Turn` codex-core, sélectionner le
/// fournisseur de modèle (codex-model-provider) selon `backend_id`, puis
/// streamer la réponse. Pour un backend externe, pseudonymiser les données
/// patient avant l'appel.
pub async fn agent_send(backend_id: &str, _input: &str, externe: bool) -> AgentMessage {
    let prefix = if externe {
        "[Backend externe — données pseudonymisées avant envoi] "
    } else {
        "[Backend local] "
    };
    AgentMessage {
        id: format!("msg-{}", Utc::now().timestamp_millis()),
        role: "assistant".into(),
        content: format!(
            "{prefix}Analyse fondée sur les données locales de l'officine. \
             Je peux croiser l'ordonnance avec le Dossier Pharmaceutique, \
             vérifier les interactions via le serveur MCP Vidal, puis préparer la délivrance."
        ),
        created_at: Utc::now().to_rfc3339(),
        backend_id: Some(backend_id.to_string()),
        tool_name: None,
    }
}

/// Recherche web restreinte aux sources santé, via le proxy réseau contrôlé.
pub async fn web_search(query: &str) -> Vec<WebSearchResult> {
    data::web_results(query)
}

/// Recherche floue de documents locaux — CÂBLÉE sur `codex-file-search`.
///
/// Implémentation réelle (feature `codex`) : lance un balayage parallèle du
/// dossier `root` et classe les chemins par pertinence via nucleo. L'appel est
/// bloquant, on le déporte donc sur un thread `spawn_blocking` pour ne pas
/// figer la boucle async de Tauri.
#[cfg(feature = "codex")]
pub async fn document_search(root: &str, query: &str, limit: usize) -> anyhow::Result<Vec<DocumentMatch>> {
    use codex_file_search::{run, FileSearchOptions, MatchType};
    use std::num::NonZero;
    use std::path::PathBuf;

    let root = PathBuf::from(root);
    let query = query.to_string();

    let results = tokio::task::spawn_blocking(move || {
        let options = FileSearchOptions {
            limit: NonZero::new(limit.max(1)).unwrap_or_else(|| NonZero::new(20).expect("20 != 0")),
            exclude: Vec::new(),
            threads: NonZero::new(4).expect("4 != 0"),
            compute_indices: false,
            respect_gitignore: true,
        };
        run(&query, vec![root], options, /*cancel_flag*/ None)
    })
    .await??;

    Ok(results
        .matches
        .into_iter()
        .map(|m| {
            let path = m.path.to_string_lossy().into_owned();
            DocumentMatch {
                name: codex_file_search::file_name_from_path(&path),
                full_path: m.full_path().to_string_lossy().into_owned(),
                path,
                score: m.score,
                match_type: match m.match_type {
                    MatchType::File => "file".into(),
                    MatchType::Directory => "directory".into(),
                },
            }
        })
        .collect())
}

/// Repli hors feature `codex` : renvoie des documents fictifs pour l'aperçu.
#[cfg(not(feature = "codex"))]
pub async fn document_search(root: &str, query: &str, limit: usize) -> anyhow::Result<Vec<DocumentMatch>> {
    Ok(data::document_matches(root, query, limit))
}

/// Serveurs MCP configurés et leurs outils.
///
/// Branchement : interroger le gestionnaire de connexions codex-mcp
/// (`mcp_connection_manager`) pour lister serveurs et outils réels.
pub async fn mcp_servers() -> Vec<McpServer> {
    vec![
        McpServer {
            id: "m-vidal".into(),
            name: "vidal-mcp".into(),
            transport: "stdio".into(),
            command: "codex-mcp --server vidal".into(),
            status: "connecte".into(),
            tools: vec![
                McpTool { name: "interactions_medicamenteuses".into(), description: "Analyse d'interactions entre molécules".into(), dangerous: false },
                McpTool { name: "posologie_reference".into(), description: "Posologies recommandées par tranche d'âge".into(), dangerous: false },
            ],
        },
        McpServer {
            id: "m-fs".into(),
            name: "file-search".into(),
            transport: "stdio".into(),
            command: "codex-file-search".into(),
            status: "connecte".into(),
            tools: vec![McpTool { name: "recherche_documents".into(), description: "Recherche floue dans les documents de l'officine".into(), dangerous: false }],
        },
        McpServer {
            id: "m-shell".into(),
            name: "shell-tools".into(),
            transport: "stdio".into(),
            command: "codex-exec-server".into(),
            status: "deconnecte".into(),
            tools: vec![McpTool { name: "executer_commande".into(), description: "Exécute une commande système (sous sandbox)".into(), dangerous: true }],
        },
    ]
}
