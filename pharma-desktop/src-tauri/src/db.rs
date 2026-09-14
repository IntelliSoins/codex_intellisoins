//! Accès à la base locale.
//!
//! Le pool SQLite est stocké dans le répertoire applicatif Tauri. Ce prototype
//! ne doit contenir que des données fictives tant que SQLCipher et le vrai
//! coffre système ne sont pas branchés.

use std::path::Path;
use std::time::Duration;

use crate::model::DbRecord;
use anyhow::Context;
use serde_json::json;
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous};
use sqlx::SqlitePool;

pub async fn initialize(app_data_dir: &Path) -> anyhow::Result<SqlitePool> {
    let database_path = app_data_dir.join("pharmacore-prototype.sqlite3");
    let options = SqliteConnectOptions::new()
        .filename(&database_path)
        .create_if_missing(true)
        .foreign_keys(true)
        .journal_mode(SqliteJournalMode::Wal)
        .synchronous(SqliteSynchronous::Normal)
        .busy_timeout(Duration::from_secs(5));

    SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await
        .with_context(|| format!("ouverture de la base locale {}", database_path.display()))
}

fn record(id: &str, fields: serde_json::Value) -> DbRecord {
    DbRecord {
        id: id.into(),
        fields,
    }
}

fn all(entity: &str) -> Vec<DbRecord> {
    match entity {
        "patients" => vec![
            record("p-1", json!({ "nom": "Bernard Jacques", "ne": "1951", "regime": "ALD", "medecin": "Dr Fontaine" })),
            record("p-2", json!({ "nom": "Léa Moreau", "ne": "1988", "regime": "Général", "medecin": "Dr Aziz" })),
            record("p-3", json!({ "nom": "Petit Marcel", "ne": "1943", "regime": "ALD", "medecin": "Dr Fontaine" })),
        ],
        "ordonnances" => vec![
            record("o-1", json!({ "patient": "Bernard Jacques", "date": "2026-09-01", "statut": "À renouveler", "prescripteur": "Dr Fontaine" })),
            record("o-2", json!({ "patient": "Léa Moreau", "date": "2026-09-05", "statut": "Délivrée", "prescripteur": "Dr Aziz" })),
        ],
        "stock" => vec![
            record("s-1", json!({ "produit": "Doliprane 1000mg", "cip": "3400930", "quantite": 42, "seuil": 20, "peremption": "2027-03" })),
            record("s-2", json!({ "produit": "Amoxicilline 500mg", "cip": "3400931", "quantite": 8, "seuil": 15, "peremption": "2026-11" })),
        ],
        "fournisseurs" => vec![
            record("f-1", json!({ "nom": "CERP Rouen", "contact": "commande@cerp.fr", "delai": "2h" })),
            record("f-2", json!({ "nom": "OCP", "contact": "edi@ocp.fr", "delai": "4h" })),
        ],
        _ => Vec::new(),
    }
}

/// Requête filtrée sur une entité. `search` vide renvoie tout.
pub fn query(entity: &str, search: &str) -> Vec<DbRecord> {
    let rows = all(entity);
    let needle = search.trim().to_lowercase();
    if needle.is_empty() {
        return rows;
    }
    rows.into_iter()
        .filter(|r| {
            r.fields
                .as_object()
                .map(|o| o.values().any(|v| v.to_string().to_lowercase().contains(&needle)))
                .unwrap_or(false)
        })
        .collect()
}
