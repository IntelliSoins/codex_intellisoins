//! Données d'amorçage (fictives). En production, elles proviennent de la base
//! locale chiffrée (voir `db.rs`) et des crates codex-* (voir `codex_bridge.rs`).

use crate::model::*;
use chrono::Utc;

pub fn seed_user() -> SessionUser {
    SessionUser {
        id: "u-001".into(),
        display_name: "Dr. Amélie Rousseau".into(),
        role: Role::Proprietaire,
        officine: "Pharmacie du Grand Chêne".into(),
        vault_unlocked: false,
    }
}

pub fn seed_backends() -> Vec<ComputeBackend> {
    vec![
        ComputeBackend {
            id: "b-dgx".into(),
            kind: ComputeKind::DgxSpark,
            label: "DGX Spark (local)".into(),
            endpoint: "grpc://dgx-spark.local:8443".into(),
            model: "llama-3.3-70b-instruct".into(),
            latency_ms: 180,
            status: "en-ligne".into(),
            externe: false,
        },
        ComputeBackend {
            id: "b-mac".into(),
            kind: ComputeKind::MacSilicon,
            label: "Mac Studio M3 Ultra".into(),
            endpoint: "http://mac-studio.local:11434".into(),
            model: "qwen2.5-32b".into(),
            latency_ms: 240,
            status: "en-ligne".into(),
            externe: false,
        },
        ComputeBackend {
            id: "b-ext".into(),
            kind: ComputeKind::LlmExterne,
            label: "LLM externe (chiffré)".into(),
            endpoint: "https://gateway.exemple.fr/v1".into(),
            model: "gpt-4o-mini".into(),
            latency_ms: 620,
            status: "degrade".into(),
            externe: true,
        },
        ComputeBackend {
            id: "b-cpu".into(),
            kind: ComputeKind::LocalCpu,
            label: "Poste local (CPU)".into(),
            endpoint: "in-process".into(),
            model: "phi-3-mini".into(),
            latency_ms: 95,
            status: "hors-ligne".into(),
            externe: false,
        },
    ]
}

pub fn seed_reminders() -> Vec<Reminder> {
    let r = |id: &str, title: &str, due: &str, priority: &str, category: &str, done: bool| Reminder {
        id: id.into(),
        title: title.into(),
        due: due.into(),
        priority: priority.into(),
        category: category.into(),
        done,
    };
    vec![
        r("r-1", "Renouvellement ordonnance — M. Bernard", "Aujourd'hui 14:30", "haute", "ordonnance", false),
        r("r-2", "Commande grossiste avant 17h", "Aujourd'hui 17:00", "haute", "stock", false),
        r("r-3", "Vérifier péremptions rayon B4", "Aujourd'hui", "normale", "stock", false),
        r("r-4", "Déclaration de garde", "Demain 09:00", "normale", "reglementaire", false),
        r("r-6", "Signer registre stupéfiants", "Aujourd'hui 18:00", "haute", "reglementaire", false),
    ]
}

pub fn seed_dashboard() -> DashboardSummary {
    DashboardSummary {
        tasks_actives: 4,
        reminders_today: 6,
        connectors_online: 3,
        connectors_total: 5,
        backends_online: 2,
        backends_total: 4,
        security_alerts: 1,
    }
}

pub fn web_results(query: &str) -> Vec<WebSearchResult> {
    let now = Utc::now().to_rfc3339();
    let q = if query.trim().is_empty() { "recommandations HAS" } else { query.trim() };
    vec![
        WebSearchResult {
            title: format!("{q} — Haute Autorité de Santé"),
            url: "https://has-sante.fr".into(),
            snippet: "Recommandations de bonne pratique et fiches de bon usage du médicament.".into(),
            source: "has-sante.fr".into(),
            fetched_at: now.clone(),
        },
        WebSearchResult {
            title: format!("{q} — Base de données publique des médicaments"),
            url: "https://base-donnees-publique.medicaments.gouv.fr".into(),
            snippet: "Notices, RCP et conditions de prescription et de délivrance.".into(),
            source: "medicaments.gouv.fr".into(),
            fetched_at: now,
        },
    ]
}
